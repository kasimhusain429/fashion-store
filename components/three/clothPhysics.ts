import * as THREE from "three";

/**
 * Interactive soft-body cloth deformation state attached to a garment or swatch mesh.
 *
 * Precomputes vertex adjacency and hanger/clip pin weights once per geometry, then runs
 * a zero-allocation spring-mass + elastic Poisson stretch + air-wake simulation only while
 * energy is active (> 1e-5), sleeping at 0 ms CPU when at rest.
 */
export interface ClothSim {
  geometry: THREE.BufferGeometry;
  vertCount: number;
  restPos: Float32Array;
  restNorm: Float32Array;
  mobility: Float32Array;
  vertTriOffsets: Int32Array;
  vertTriIndices: Int32Array;
  indices: Uint16Array | Uint32Array;
  triNorms: Float32Array;

  // Interactive grab / stretch state (in garment-local coordinates)
  grabbing: boolean;
  grabPoint: THREE.Vector3;
  grabPullTarget: THREE.Vector3;
  pullCurrent: THREE.Vector3;
  pullVel: THREE.Vector3;

  // Elastic release wave state
  releaseAmp: number;
  releasePhase: number;
  releaseOrigin: THREE.Vector3;

  // Hover air-wake / fingertip brush state (in garment-local coordinates)
  hoverActive: boolean;
  hoverPoint: THREE.Vector3;
  hoverSmoothPoint: THREE.Vector3;
  hoverVel: THREE.Vector3;
  hoverStrength: number;

  // Coupled hanger torque impulse from pulling / brushing
  hangerTorqueY: number;
  hangerTiltZ: number;
  ambientPhase: number;
  active: boolean;
}

export interface ClothOptions {
  /** 'garment' pins along the curved walnut hanger saddle; 'swatch' pins at the two top brass clips. */
  kind: "garment" | "swatch";
  phase?: number;
}

function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function smoothstep(v: number) {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
}

/**
 * Clones `source` geometry and prepares typed-array cloth physics buffers + triangle adjacency.
 */
export function createClothSim(source: THREE.BufferGeometry, options: ClothOptions): ClothSim {
  const geometry = source.clone();
  const posAttr = geometry.getAttribute("position") as THREE.BufferAttribute;
  const normAttr = geometry.getAttribute("normal") as THREE.BufferAttribute;
  const indexAttr = geometry.getIndex();

  if (!normAttr) geometry.computeVertexNormals();
  const norm = geometry.getAttribute("normal") as THREE.BufferAttribute;

  const vertCount = posAttr.count;
  const restPos = new Float32Array(posAttr.array as Float32Array);
  const restNorm = new Float32Array(norm.array as Float32Array);

  // Clone mutable dynamic buffers so shared GLTF buffers stay untouched
  const dynPos = new Float32Array(restPos);
  const dynNorm = new Float32Array(restNorm);
  geometry.setAttribute("position", new THREE.BufferAttribute(dynPos, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(dynNorm, 3));

  // Build index buffer if non-indexed
  let indices: Uint16Array | Uint32Array;
  if (indexAttr) {
    indices = indexAttr.array as Uint16Array | Uint32Array;
  } else {
    indices = new Uint32Array(vertCount);
    for (let i = 0; i < vertCount; i++) indices[i] = i;
  }

  // Compute vertex-to-triangle adjacency for fast zero-GC normal updates
  const triCount = (indices.length / 3) | 0;
  const counts = new Int32Array(vertCount);
  for (let t = 0; t < triCount; t++) {
    const i0 = indices[t * 3];
    const i1 = indices[t * 3 + 1];
    const i2 = indices[t * 3 + 2];
    counts[i0]++;
    counts[i1]++;
    counts[i2]++;
  }
  const vertTriOffsets = new Int32Array(vertCount + 1);
  for (let i = 0; i < vertCount; i++) {
    vertTriOffsets[i + 1] = vertTriOffsets[i] + counts[i];
  }
  const vertTriIndices = new Int32Array(vertTriOffsets[vertCount]);
  const cursor = new Int32Array(vertCount);
  for (let t = 0; t < triCount; t++) {
    for (let k = 0; k < 3; k++) {
      const v = indices[t * 3 + k];
      vertTriIndices[vertTriOffsets[v] + cursor[v]++] = t;
    }
  }

  // Compute smooth mobility weights (0 = pinned to hanger/clips, 1 = free-draping fabric)
  const mobility = new Float32Array(vertCount);
  for (let i = 0; i < vertCount; i++) {
    const x = restPos[i * 3];
    const y = restPos[i * 3 + 1];
    if (options.kind === "swatch") {
      // Swatch hangs from two brass clips near top left/right (y around -0.001..-0.03)
      const topPin = smoothstep((y - -0.07) / 0.055);
      const clipProx = smoothstep((0.145 - Math.abs(Math.abs(x) - 0.115)) / 0.06);
      const pin = topPin * (0.55 + 0.45 * clipProx);
      mobility[i] = 1 - clamp01(pin) * 0.96;
    } else {
      // Tee rests along curved walnut hanger shoulder saddle (y ~ -0.066..-0.145, |x| < 0.22)
      const pinX = smoothstep((0.23 - Math.abs(x)) / 0.065);
      const pinY = smoothstep((y - -0.175) / 0.075);
      // Keep neck collar slightly suppler than rigid shoulder top
      const collarRelief = smoothstep((Math.abs(x) - 0.06) / 0.04);
      const pin = pinX * pinY * (0.72 + 0.28 * collarRelief);
      mobility[i] = 1 - clamp01(pin) * 0.97;
    }
  }

  return {
    geometry,
    vertCount,
    restPos,
    restNorm,
    mobility,
    vertTriOffsets,
    vertTriIndices,
    indices,
    triNorms: new Float32Array(triCount * 3),
    grabbing: false,
    grabPoint: new THREE.Vector3(),
    grabPullTarget: new THREE.Vector3(),
    pullCurrent: new THREE.Vector3(),
    pullVel: new THREE.Vector3(),
    releaseAmp: 0,
    releasePhase: 0,
    releaseOrigin: new THREE.Vector3(),
    hoverActive: false,
    hoverPoint: new THREE.Vector3(),
    hoverSmoothPoint: new THREE.Vector3(),
    hoverVel: new THREE.Vector3(),
    hoverStrength: 0,
    hangerTorqueY: 0,
    hangerTiltZ: 0,
    ambientPhase: options.phase ?? 0,
    active: false,
  };
}

/**
 * Triggers a pointer brush wake across the cloth surface (hover reaction).
 */
export function applyClothHover(sim: ClothSim, localPoint: THREE.Vector3, prevPoint: THREE.Vector3 | null, dt: number) {
  if (!sim.hoverActive) {
    sim.hoverSmoothPoint.copy(localPoint);
  }
  sim.hoverActive = true;
  sim.hoverPoint.copy(localPoint);
  if (prevPoint && dt > 0.0005) {
    const invDt = Math.min(1 / dt, 90);
    const vx = THREE.MathUtils.clamp((localPoint.x - prevPoint.x) * invDt, -1.6, 1.6);
    const vy = THREE.MathUtils.clamp((localPoint.y - prevPoint.y) * invDt, -1.6, 1.6);
    const vz = THREE.MathUtils.clamp((localPoint.z - prevPoint.z) * invDt, -1.6, 1.6);
    sim.hoverVel.lerp(new THREE.Vector3(vx, vy, vz), 0.35);
  }
}

export function clearClothHover(sim: ClothSim) {
  sim.hoverActive = false;
}

export function beginClothGrab(sim: ClothSim, localPoint: THREE.Vector3) {
  sim.grabbing = true;
  sim.grabPoint.copy(localPoint);
  sim.grabPullTarget.set(0, 0, 0);
}

export function updateClothGrab(sim: ClothSim, pullVectorLocal: THREE.Vector3) {
  if (!sim.grabbing) return;
  // Soft saturation curve so extreme drags feel like real stretchy cotton resistance rather than snapping
  const maxStretch = 0.24;
  const len = pullVectorLocal.length();
  if (len > 1e-5) {
    const softLen = maxStretch * Math.tanh(len / maxStretch);
    sim.grabPullTarget.copy(pullVectorLocal).multiplyScalar(softLen / len);
  } else {
    sim.grabPullTarget.set(0, 0, 0);
  }
}

export function endClothGrab(sim: ClothSim) {
  if (!sim.grabbing) return;
  sim.grabbing = false;
  const stretchLen = sim.pullCurrent.length();
  if (stretchLen > 0.008) {
    sim.releaseOrigin.copy(sim.grabPoint);
    sim.releaseAmp = Math.min(0.022, stretchLen * 0.14);
    sim.releasePhase = 0;
  }
  sim.grabPullTarget.set(0, 0, 0);
}

/**
 * Advances interactive cloth physics and updates vertex positions + smooth normals when active.
 */
export function stepClothSim(sim: ClothSim, dtRaw: number, elapsed: number, allowAmbient = false): boolean {
  const dt = Math.min(dtRaw, 1 / 30);

  // 1. Update hover brush spring/decay
  const targetHover = sim.hoverActive && !sim.grabbing ? 1 : 0;
  sim.hoverStrength = THREE.MathUtils.damp(sim.hoverStrength, targetHover, targetHover ? 16 : 6.5, dt);
  sim.hoverSmoothPoint.lerp(sim.hoverPoint, 1 - Math.exp(-dt * 18));
  sim.hoverVel.multiplyScalar(Math.exp(-dt * 8));

  // 2. Update grab / elastic recovery spring
  const kSpring = sim.grabbing ? 240 : 155;
  const kDamp = sim.grabbing ? 22 : 10.2;
  const ax = (sim.grabPullTarget.x - sim.pullCurrent.x) * kSpring - sim.pullVel.x * kDamp;
  const ay = (sim.grabPullTarget.y - sim.pullCurrent.y) * kSpring - sim.pullVel.y * kDamp;
  const az = (sim.grabPullTarget.z - sim.pullCurrent.z) * kSpring - sim.pullVel.z * kDamp;
  sim.pullVel.x += ax * dt;
  sim.pullVel.y += ay * dt;
  sim.pullVel.z += az * dt;
  sim.pullCurrent.x += sim.pullVel.x * dt;
  sim.pullCurrent.y += sim.pullVel.y * dt;
  sim.pullCurrent.z += sim.pullVel.z * dt;

  // 3. Advance release flutter wave
  if (sim.releaseAmp > 1e-4) {
    sim.releasePhase += dt * 26;
    sim.releaseAmp *= Math.exp(-dt * 3.4);
  } else {
    sim.releaseAmp = 0;
  }

  // 4. Coupled hanger reaction torque (gentle tilt & yaw while tugging or brushing)
  const targetTorqueY = sim.grabbing
    ? sim.pullCurrent.x * 0.42 - sim.grabPoint.x * sim.pullCurrent.z * 1.4
    : sim.hoverStrength * (sim.hoverVel.x * 0.045);
  const targetTiltZ = sim.grabbing ? -sim.pullCurrent.x * 0.16 : -sim.hoverStrength * sim.hoverVel.x * 0.015;
  sim.hangerTorqueY = THREE.MathUtils.damp(sim.hangerTorqueY, targetTorqueY, 10, dt);
  sim.hangerTiltZ = THREE.MathUtils.damp(sim.hangerTiltZ, targetTiltZ, 10, dt);

  const pullLen = sim.pullCurrent.length();
  const pullVelLen = sim.pullVel.length();
  const energy = pullLen + pullVelLen * 0.1 + sim.hoverStrength + sim.releaseAmp;

  if (energy < 1e-4 && !allowAmbient) {
    if (sim.active) {
      // Restore exact pristine rest positions & normals before going idle
      const posArr = sim.geometry.getAttribute("position").array as Float32Array;
      const normArr = sim.geometry.getAttribute("normal").array as Float32Array;
      posArr.set(sim.restPos);
      normArr.set(sim.restNorm);
      sim.geometry.getAttribute("position").needsUpdate = true;
      sim.geometry.getAttribute("normal").needsUpdate = true;
      sim.active = false;
    }
    return false;
  }

  sim.active = true;

  const posAttr = sim.geometry.getAttribute("position") as THREE.BufferAttribute;
  const normAttr = sim.geometry.getAttribute("normal") as THREE.BufferAttribute;
  const posArr = posAttr.array as Float32Array;
  const normArr = normAttr.array as Float32Array;
  const rest = sim.restPos;
  const restN = sim.restNorm;
  const mob = sim.mobility;

  const gx = sim.grabPoint.x;
  const gy = sim.grabPoint.y;
  const gz = sim.grabPoint.z;
  const px = sim.pullCurrent.x;
  const py = sim.pullCurrent.y;
  const pz = sim.pullCurrent.z;
  const invPullLen = pullLen > 1e-5 ? 1 / pullLen : 0;
  const pdx = px * invPullLen;
  const pdy = py * invPullLen;
  const pdz = pz * invPullLen;

  const hx = sim.hoverSmoothPoint.x;
  const hy = sim.hoverSmoothPoint.y;
  const hz = sim.hoverSmoothPoint.z;
  const hvx = sim.hoverVel.x * 0.022;
  const hvy = sim.hoverVel.y * 0.022;
  const hvz = sim.hoverVel.z * 0.022;
  const hs = sim.hoverStrength;

  const rx = sim.releaseOrigin.x;
  const ry = sim.releaseOrigin.y;
  const rz = sim.releaseOrigin.z;
  const rAmp = sim.releaseAmp;
  const rPhase = sim.releasePhase;

  const hasPull = pullLen > 1e-5;
  const hasHover = hs > 1e-4;
  const hasRelease = rAmp > 1e-4;
  const isSleeveGrab = Math.abs(gx) > 0.22;
  const pullRadiusSq2 = isSleeveGrab ? 2 * 0.22 * 0.22 : 2 * 0.36 * 0.36;
  const hoverRadiusSq2 = 2 * 0.105 * 0.105;

  for (let i = 0; i < sim.vertCount; i++) {
    const m = mob[i];
    const i3 = i * 3;
    let vx = rest[i3];
    let vy = rest[i3 + 1];
    let vz = rest[i3 + 2];

    if (m > 0.001) {
      const nx = restN[i3];
      const ny = restN[i3 + 1];
      const nz = restN[i3 + 2];
      let dx = 0;
      let dy = 0;
      let dz = 0;

      // Subtle living drape sway when active/focused
      if (allowAmbient) {
        const lower = clamp01((-vy - 0.22) / 0.55);
        const breath = Math.sin(elapsed * 1.15 + sim.ambientPhase + vx * 5.2 + vy * 2.4) * 0.0022 * lower * m;
        dz += breath;
        dx += Math.cos(elapsed * 0.85 + sim.ambientPhase + vy * 3.1) * 0.0012 * lower * m;
      }

      // A) Direct fabric grab / pull / Poisson tension necking & radiating tension folds
      if (hasPull) {
        const ox = vx - gx;
        const oy = vy - gy;
        const oz = vz - gz;
        const d2 = ox * ox + oy * oy + oz * oz;
        const w = Math.exp(-d2 / pullRadiusSq2) * m;
        if (w > 0.001) {
          dx += px * w;
          dy += py * w;
          dz += pz * w;

          // Poisson transverse contraction (fabric narrows slightly perpendicular to tension)
          const proj = ox * pdx + oy * pdy + oz * pdz;
          const perpx = ox - pdx * proj;
          const perpy = oy - pdy * proj;
          const perpz = oz - pdz * proj;
          const midBand = w * (1 - w) * 4.0;
          const neck = -0.22 * pullLen * midBand;
          dx += perpx * neck;
          dy += perpy * neck;
          dz += perpz * neck;

          // Radiating diagonal tension creases between pinch and anchor
          const ang = Math.atan2(perpy + 0.0001, perpx + 0.0001);
          const crease = Math.sin(ang * 5.0 + proj * 14.0) * 0.0045 * clamp01(pullLen / 0.14) * midBand;
          dx += nx * crease;
          dy += ny * crease;
          dz += nz * crease;
        }
      }

      // B) Hover tactile indentation + fingertip air-wake
      if (hasHover) {
        const ox = vx - hx;
        const oy = vy - hy;
        const oz = vz - hz;
        const d2 = ox * ox + oy * oy + oz * oz;
        const hw = Math.exp(-d2 / hoverRadiusSq2) * m * hs;
        if (hw > 0.001) {
          const indent = -0.014 * hw;
          dx += nx * indent + hvx * hw;
          dy += ny * indent + hvy * hw;
          dz += nz * indent + hvz * hw;
        }
      }

      // C) Damped release flutter wave propagating from grab origin
      if (hasRelease) {
        const ox = vx - rx;
        const oy = vy - ry;
        const oz = vz - rz;
        const dist = Math.sqrt(ox * ox + oy * oy + oz * oz);
        const wave = Math.sin(dist * 22.0 - rPhase) * rAmp * Math.exp(-dist * 3.2) * m;
        dx += nx * wave;
        dy += ny * wave * 0.35;
        dz += nz * wave;
      }

      vx += dx;
      vy += dy;
      vz += dz;
    }

    posArr[i3] = vx;
    posArr[i3 + 1] = vy;
    posArr[i3 + 2] = vz;
  }

  // Recompute smooth vertex normals in place (zero GC)
  const indices = sim.indices;
  const triCount = (indices.length / 3) | 0;
  const triNorms = sim.triNorms;

  for (let t = 0; t < triCount; t++) {
    const i0 = indices[t * 3] * 3;
    const i1 = indices[t * 3 + 1] * 3;
    const i2 = indices[t * 3 + 2] * 3;
    const ax = posArr[i1] - posArr[i0];
    const ay = posArr[i1 + 1] - posArr[i0 + 1];
    const az = posArr[i1 + 2] - posArr[i0 + 2];
    const bx = posArr[i2] - posArr[i0];
    const by = posArr[i2 + 1] - posArr[i0 + 1];
    const bz = posArr[i2 + 2] - posArr[i0 + 2];
    const t3 = t * 3;
    triNorms[t3] = ay * bz - az * by;
    triNorms[t3 + 1] = az * bx - ax * bz;
    triNorms[t3 + 2] = ax * by - ay * bx;
  }

  const offsets = sim.vertTriOffsets;
  const vertTris = sim.vertTriIndices;
  for (let i = 0; i < sim.vertCount; i++) {
    let sx = 0;
    let sy = 0;
    let sz = 0;
    const start = offsets[i];
    const end = offsets[i + 1];
    for (let k = start; k < end; k++) {
      const t3 = vertTris[k] * 3;
      sx += triNorms[t3];
      sy += triNorms[t3 + 1];
      sz += triNorms[t3 + 2];
    }
    const len = Math.sqrt(sx * sx + sy * sy + sz * sz);
    const i3 = i * 3;
    if (len > 1e-8) {
      const inv = 1 / len;
      normArr[i3] = sx * inv;
      normArr[i3 + 1] = sy * inv;
      normArr[i3 + 2] = sz * inv;
    } else {
      normArr[i3] = restN[i3];
      normArr[i3 + 1] = restN[i3 + 1];
      normArr[i3 + 2] = restN[i3 + 2];
    }
  }

  posAttr.needsUpdate = true;
  normAttr.needsUpdate = true;
  // Keep bounding sphere up to date so stretched hems aren't frustum-culled or missed by raycaster
  if (hasPull) sim.geometry.computeBoundingSphere();
  return true;
}
