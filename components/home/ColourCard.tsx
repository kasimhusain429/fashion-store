"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, PresentationControls, useGLTF, useTexture } from "@react-three/drei";
import { COLORWAYS, PRODUCTS } from "@/lib/catalog";
import { KNIT_URL } from "@/components/three/Tee";
import {
  applyClothHover,
  beginClothGrab,
  clearClothHover,
  createClothSim,
  endClothGrab,
  stepClothSim,
  updateClothGrab,
  type ClothSim,
} from "@/components/three/clothPhysics";
import { computeJerseySheen, makeFadeUniforms, patchMaterial } from "@/components/three/materials";

const SWATCH_URL = "/models/swatch.glb";
const COLOURS = Object.values(COLORWAYS);

function usedIn(id: string) {
  return PRODUCTS.filter((p) => p.colorways.some((c) => c.id === id)).map((p) => p.name);
}

function Swatch({ hex, onGrabChange }: { hex: string; onGrabChange: (grabbing: boolean) => void }) {
  const { scene } = useGLTF(SWATCH_URL);
  const knitSrc = useTexture(KNIT_URL);
  const target = useRef(new THREE.Color(hex));
  const group = useRef<THREE.Group>(null);
  const { camera, gl } = useThree();
  const prevHoverLocal = useRef<THREE.Vector3 | null>(null);
  const prevHoverTime = useRef(0);
  const grabState = useRef<{ plane: THREE.Plane; startWorld: THREE.Vector3 } | null>(null);

  const { object, cloth, sim, swatchMesh } = useMemo(() => {
    const knit = knitSrc.clone();
    knit.wrapS = knit.wrapT = THREE.RepeatWrapping;
    knit.repeat.set(14, 20);
    knit.colorSpace = THREE.NoColorSpace;
    knit.anisotropy = 8;
    knit.flipY = false;
    knit.needsUpdate = true;

    const c = new THREE.Color(hex);
    const clothMat = new THREE.MeshPhysicalMaterial({
      color: c,
      roughness: 0.94,
      metalness: 0,
      ior: 1.36,
      specularIntensity: 0.14,
      sheen: 0.42,
      sheenRoughness: 0.88,
      sheenColor: computeJerseySheen(c),
      normalMap: knit,
      normalScale: new THREE.Vector2(0.24, 0.24),
      side: THREE.DoubleSide,
    });
    patchMaterial(clothMat, makeFadeUniforms(), true);

    const root = scene.clone(true);
    let createdSim: ClothSim | null = null;
    let foundMesh: THREE.Mesh | null = null;
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      m.receiveShadow = true;
      if (m.name.includes("Swatch")) {
        createdSim = createClothSim(m.geometry, { kind: "swatch", phase: 0.8 });
        m.geometry = createdSim.geometry;
        m.material = clothMat;
        foundMesh = m;
      }
    });
    return { object: root, cloth: clothMat, sim: createdSim as ClothSim | null, swatchMesh: foundMesh as THREE.Mesh | null };
    // the colour animates smoothly in useFrame
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, knitSrc]);

  useEffect(() => {
    target.current.set(hex);
  }, [hex]);

  useEffect(() => {
    return () => {
      cloth.dispose();
      sim?.geometry.dispose();
    };
  }, [cloth, sim]);

  useEffect(() => {
    if (!sim || !swatchMesh) return;
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const hitWorld = new THREE.Vector3();
    const startLocal = new THREE.Vector3();
    const curLocal = new THREE.Vector3();
    const pullLocal = new THREE.Vector3();

    const onMove = (ev: PointerEvent) => {
      const gs = grabState.current;
      if (!gs) return;
      const rect = gl.domElement.getBoundingClientRect();
      ndc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      if (raycaster.ray.intersectPlane(gs.plane, hitWorld)) {
        startLocal.copy(gs.startWorld);
        curLocal.copy(hitWorld);
        swatchMesh.worldToLocal(startLocal);
        swatchMesh.worldToLocal(curLocal);
        pullLocal.subVectors(curLocal, startLocal);
        updateClothGrab(sim, pullLocal);
      }
    };

    const onUp = () => {
      if (!grabState.current) return;
      grabState.current = null;
      endClothGrab(sim);
      onGrabChange(false);
      document.body.style.cursor = "";
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [sim, swatchMesh, camera, gl, onGrabChange]);

  useFrame((state, dt) => {
    cloth.color.lerp(target.current, 1 - Math.exp(-dt * 6));
    computeJerseySheen(cloth.color, cloth.sheenColor);
    if (sim) {
      stepClothSim(sim, dt, state.clock.elapsedTime, true);
    }
    if (group.current) {
      const targetY = Math.sin(state.clock.elapsedTime * 0.28) * 0.16 + (sim ? sim.hangerTorqueY * 0.5 : 0);
      group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, targetY, 6, Math.min(dt, 1 / 30));
    }
  });

  return (
    <group ref={group} position={[0, 0.24, 0]}>
      <primitive
        object={object}
        onPointerOver={() => {
          document.body.style.cursor = grabState.current ? "grabbing" : "grab";
        }}
        onPointerMove={(e: { point: THREE.Vector3; object: THREE.Object3D }) => {
          if (!sim || !swatchMesh || grabState.current) return;
          if (e.object !== swatchMesh) return;
          const localPt = swatchMesh.worldToLocal(e.point.clone());
          const now = performance.now() / 1000;
          const dt = prevHoverTime.current ? now - prevHoverTime.current : 0.016;
          applyClothHover(sim, localPt, prevHoverLocal.current, dt);
          prevHoverLocal.current = localPt;
          prevHoverTime.current = now;
        }}
        onPointerOut={() => {
          prevHoverLocal.current = null;
          if (sim) clearClothHover(sim);
          if (!grabState.current) document.body.style.cursor = "";
        }}
        onPointerDown={(e: { stopPropagation: () => void; point: THREE.Vector3; object: THREE.Object3D }) => {
          if (!sim || !swatchMesh || e.object !== swatchMesh) return;
          e.stopPropagation();
          const localPt = swatchMesh.worldToLocal(e.point.clone());
          const camDir = new THREE.Vector3();
          camera.getWorldDirection(camDir);
          const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(camDir.negate(), e.point);
          grabState.current = { plane, startWorld: e.point.clone() };
          beginClothGrab(sim, localPt);
          onGrabChange(true);
          document.body.style.cursor = "grabbing";
        }}
      />
    </group>
  );
}

export function ColourCard() {
  const [active, setActive] = useState(COLOURS[0].id);
  const [inView, setInView] = useState(false);
  const [grabbingCloth, setGrabbingCloth] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const colour = COLOURS.find((c) => c.id === active) ?? COLOURS[0];

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section aria-labelledby="cc-title" className="dark grain relative overflow-hidden" data-header="dark">
      <div className="grid grid-cols-1 gap-10 px-[var(--gutter)] py-20 lg:grid-cols-12 lg:items-center lg:py-24">
        <div className="lg:col-span-5">
          <h2 id="cc-title" className="t-headline text-[clamp(34px,4.4vw,64px)]">
            The colour card
          </h2>
          <p className="t-body measure mt-5 text-muted-dark">
            Eight mineral-dyed shades run through the collection. Choose one to see it on a hanging swatch of combed jersey,
            or pull the cloth to feel its drape and recovery.
          </p>
          <div role="radiogroup" aria-label="Collection colours" className="mt-8 grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-2">
            {COLOURS.map((c) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={active === c.id}
                onClick={() => setActive(c.id)}
                className={`group flex items-center gap-3 border-t py-3 text-left transition-colors ${active === c.id ? "border-washi" : "border-line-dark hover:border-muted-dark"}`}
              >
                <span
                  className="h-7 w-7 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgb(255_255_255/0.22)] transition-transform group-hover:scale-110"
                  style={{ background: c.swatch }}
                />
                <span className={`t-label ${active === c.id ? "text-washi" : "text-muted-dark"}`}>{c.name}</span>
              </button>
            ))}
          </div>
          <p className="t-ui mt-6 text-washi/90" aria-live="polite">
            {colour.note}
          </p>
          <p className="t-label mt-2 text-muted-dark">
            Cut in: {usedIn(colour.id).join(", ")}.
          </p>
        </div>

          <div ref={wrap} className="relative h-[46svh] min-h-[300px] sm:h-[56svh] sm:min-h-[380px] lg:col-span-7 lg:h-[62svh] lg:min-h-[420px]" aria-hidden="true">
            {inView && (
              <Canvas
                style={{ width: "100%", height: "100%" }}
                shadows={{ type: THREE.PCFShadowMap }}
                dpr={[1, 1.75]}
                gl={{ antialias: true, alpha: true, toneMapping: THREE.AgXToneMapping, toneMappingExposure: 1.08 }}
                camera={{ fov: 30, position: [0, 0, 1.25] }}
              >
                <ambientLight intensity={0.32} />
                <directionalLight position={[-1.6, 1.4, 1.4]} intensity={2.2} color="#fff6ea" castShadow />
                <directionalLight position={[1.5, -0.3, 0.9]} intensity={0.48} color="#dfe8f2" />
                <Environment resolution={64} frames={1}>
                  <Lightformer form="rect" intensity={1.3} position={[-2, 2, 2]} scale={[3, 2, 1]} />
                </Environment>
                <Suspense fallback={null}>
                  <PresentationControls enabled={!grabbingCloth} global={false} snap polar={[-0.2, 0.2]} azimuth={[-0.7, 0.7]} speed={1.4}>
                    <Swatch hex={colour.hex} onGrabChange={setGrabbingCloth} />
                  </PresentationControls>
                </Suspense>
              </Canvas>
            )}
            <p className="t-label pointer-events-none absolute bottom-0 right-0 text-muted-dark">
              Pull cloth to stretch · Drag backdrop to tilt
            </p>
          </div>
        </div>
    </section>
  );
}

useGLTF.preload(SWATCH_URL);
