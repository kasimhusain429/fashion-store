"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useGLTF, useTexture } from "@react-three/drei";
import { detailUrl, inkUrl, modelUrl, PRODUCTS, type Product } from "@/lib/catalog";
import {
  applyClothHover,
  beginClothGrab,
  clearClothHover,
  createClothSim,
  endClothGrab,
  stepClothSim,
  updateClothGrab,
} from "./clothPhysics";
import { computeJerseySheen, makeJerseyMaterial, patchMaterial, prepareJerseyTextures, type FadeUniforms } from "./materials";

export const HANGER_URL = "/models/hanger.glb";
export const KNIT_URL = "/textures/jersey_normal.png";
export const WEAVE_URL = "/textures/jersey_weave.png";

export interface HangerImpulse {
  torqueY: number;
  tiltZ: number;
}

function firstMesh(root: THREE.Object3D) {
  let found: THREE.Mesh | null = null;
  root.traverse((o) => {
    if (!found && (o as THREE.Mesh).isMesh) found = o as THREE.Mesh;
  });
  return found as THREE.Mesh | null;
}

/** Walnut hanger with bronze hook (Blender asset); materials cloned per instance for fading. */
export function Hanger({ fade, castShadow = true }: { fade: FadeUniforms; castShadow?: boolean }) {
  const { scene } = useGLTF(HANGER_URL);
  const object = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        const mat = (m.material as THREE.MeshStandardMaterial).clone();
        patchMaterial(mat, fade, false);
        m.material = mat;
        m.receiveShadow = true;
        if (m.name.includes("Body")) m.scale.set(0.86, 0.96, 0.78);
      }
    });
    return clone;
  }, [scene, fade]);

  useEffect(() => {
    object.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = castShadow;
    });
  }, [object, castShadow]);

  return <primitive object={object} />;
}

/**
 * The draped tee mesh with physically-based jersey material and real-time interactive soft-body cloth physics.
 * Origin = rail centre.
 */
export function TeeMesh({
  product,
  colorHex,
  fade,
  castShadow = true,
  enableHoverBrush = true,
  enableGrab = false,
  allowAmbient = false,
  impulseRef,
  onGrabStateChange,
  onMeshPointerOver,
  onMeshPointerMove,
  onMeshPointerOut,
  onMeshClick,
}: {
  product: Product;
  colorHex: string;
  fade: FadeUniforms;
  castShadow?: boolean;
  enableHoverBrush?: boolean;
  enableGrab?: boolean;
  allowAmbient?: boolean;
  impulseRef?: React.RefObject<HangerImpulse>;
  onGrabStateChange?: (grabbing: boolean) => void;
  onMeshPointerOver?: (e: ThreeEvent<PointerEvent>) => void;
  onMeshPointerMove?: (e: ThreeEvent<PointerEvent>) => void;
  onMeshPointerOut?: (e: ThreeEvent<PointerEvent>) => void;
  onMeshClick?: (e: ThreeEvent<MouseEvent>) => void;
}) {
  const { scene } = useGLTF(modelUrl(product));
  const ink = inkUrl(product);
  const urls = useMemo(
    () => (ink ? [KNIT_URL, WEAVE_URL, detailUrl(product), ink] : [KNIT_URL, WEAVE_URL, detailUrl(product)]),
    [ink, product],
  );
  const tex = useTexture(urls);
  const sourceGeo = useMemo(() => firstMesh(scene)?.geometry ?? null, [scene]);
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera, gl } = useThree();

  const sim = useMemo(() => {
    if (!sourceGeo) return null;
    return createClothSim(sourceGeo, { kind: "garment", phase: product.look * 1.4 });
  }, [sourceGeo, product.look]);

  const material = useMemo(() => {
    const t = { knit: tex[0].clone(), weave: tex[1].clone(), detail: tex[2], ink: tex[3] ?? null };
    prepareJerseyTextures(t);
    t.knit.needsUpdate = true;
    t.weave.needsUpdate = true;
    t.detail.needsUpdate = true;
    if (t.ink) t.ink.needsUpdate = true;
    return makeJerseyMaterial(t, colorHex, fade);
    // colour changes are animated smoothly in useFrame
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tex, fade]);

  const target = useRef(new THREE.Color(colorHex));
  const prevHoverLocal = useRef<THREE.Vector3 | null>(null);
  const prevHoverTime = useRef(0);
  const grabState = useRef<{
    plane: THREE.Plane;
    startWorld: THREE.Vector3;
  } | null>(null);

  useEffect(() => {
    target.current.set(colorHex);
  }, [colorHex]);

  useEffect(() => () => material.dispose(), [material]);
  useEffect(() => () => sim?.geometry.dispose(), [sim]);

  // Global window pointer move/up listeners when actively pinching & pulling cloth
  useEffect(() => {
    if (!enableGrab || !sim) return;
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const hitWorld = new THREE.Vector3();
    const startLocal = new THREE.Vector3();
    const curLocal = new THREE.Vector3();
    const pullLocal = new THREE.Vector3();

    const onWinMove = (ev: PointerEvent) => {
      const gs = grabState.current;
      const mesh = meshRef.current;
      if (!gs || !mesh) return;
      const rect = gl.domElement.getBoundingClientRect();
      ndc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      if (raycaster.ray.intersectPlane(gs.plane, hitWorld)) {
        startLocal.copy(gs.startWorld);
        curLocal.copy(hitWorld);
        mesh.worldToLocal(startLocal);
        mesh.worldToLocal(curLocal);
        pullLocal.subVectors(curLocal, startLocal);
        updateClothGrab(sim, pullLocal);
      }
    };

    const onWinUp = () => {
      if (!grabState.current) return;
      grabState.current = null;
      endClothGrab(sim);
      onGrabStateChange?.(false);
      document.body.style.cursor = "";
    };

    window.addEventListener("pointermove", onWinMove);
    window.addEventListener("pointerup", onWinUp);
    window.addEventListener("pointercancel", onWinUp);
    return () => {
      window.removeEventListener("pointermove", onWinMove);
      window.removeEventListener("pointerup", onWinUp);
      window.removeEventListener("pointercancel", onWinUp);
      if (grabState.current) {
        grabState.current = null;
        endClothGrab(sim);
        onGrabStateChange?.(false);
      }
    };
  }, [enableGrab, sim, camera, gl, onGrabStateChange]);

  useFrame((state, dt) => {
    const c = material.color;
    if (Math.abs(c.r - target.current.r) + Math.abs(c.g - target.current.g) + Math.abs(c.b - target.current.b) > 0.0015) {
      const k = 1 - Math.exp(-dt * 7.5);
      c.lerp(target.current, k);
      computeJerseySheen(c, material.sheenColor);
    }
    if (sim) {
      stepClothSim(sim, dt, state.clock.elapsedTime, allowAmbient);
      if (impulseRef?.current) {
        impulseRef.current.torqueY = sim.hangerTorqueY;
        impulseRef.current.tiltZ = sim.hangerTiltZ;
      }
    }
  });

  if (!sim) return null;

  return (
    <mesh
      ref={meshRef}
      geometry={sim.geometry}
      material={material}
      castShadow={castShadow}
      receiveShadow
      onPointerOver={(e) => {
        if (enableGrab) document.body.style.cursor = grabState.current ? "grabbing" : "grab";
        onMeshPointerOver?.(e);
      }}
      onPointerMove={(e) => {
        onMeshPointerMove?.(e);
        if (!enableHoverBrush || !meshRef.current || grabState.current) return;
        const localPt = meshRef.current.worldToLocal(e.point.clone());
        const now = performance.now() / 1000;
        const dt = prevHoverTime.current ? now - prevHoverTime.current : 0.016;
        applyClothHover(sim, localPt, prevHoverLocal.current, dt);
        prevHoverLocal.current = localPt;
        prevHoverTime.current = now;
      }}
      onPointerOut={(e) => {
        prevHoverLocal.current = null;
        clearClothHover(sim);
        if (enableGrab && !grabState.current) document.body.style.cursor = "";
        onMeshPointerOut?.(e);
      }}
      onPointerDown={(e) => {
        if (!enableGrab || !meshRef.current) return;
        e.stopPropagation();
        const localPt = meshRef.current.worldToLocal(e.point.clone());
        const camDir = new THREE.Vector3();
        camera.getWorldDirection(camDir);
        const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(camDir.negate(), e.point);
        grabState.current = { plane, startWorld: e.point.clone() };
        beginClothGrab(sim, localPt);
        onGrabStateChange?.(true);
        document.body.style.cursor = "grabbing";
      }}
      onClick={(e) => {
        onMeshClick?.(e);
      }}
    />
  );
}

export function TeeOnHanger(props: {
  product: Product;
  colorHex: string;
  fade: FadeUniforms;
  castShadow?: boolean;
  enableHoverBrush?: boolean;
  enableGrab?: boolean;
  allowAmbient?: boolean;
  impulseRef?: React.RefObject<HangerImpulse>;
  onGrabStateChange?: (grabbing: boolean) => void;
  onMeshPointerOver?: (e: ThreeEvent<PointerEvent>) => void;
  onMeshPointerMove?: (e: ThreeEvent<PointerEvent>) => void;
  onMeshPointerOut?: (e: ThreeEvent<PointerEvent>) => void;
  onMeshClick?: (e: ThreeEvent<MouseEvent>) => void;
}) {
  return (
    <group>
      <Hanger fade={props.fade} castShadow={props.castShadow} />
      <TeeMesh {...props} />
    </group>
  );
}

export function preloadTees() {
  useGLTF.preload(HANGER_URL);
  PRODUCTS.forEach((p) => useGLTF.preload(modelUrl(p)));
}
