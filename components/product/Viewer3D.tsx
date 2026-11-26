"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls, PerformanceMonitor, SoftShadows, useGLTF } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { Product } from "@/lib/catalog";
import { makeFadeUniforms } from "@/components/three/materials";
import { TeeOnHanger, type HangerImpulse } from "@/components/three/Tee";
import { SceneBoundary } from "@/components/three/SceneBoundary";

function RailStub() {
  const { nodes } = useGLTF("/models/rail.glb") as unknown as { nodes: Record<string, THREE.Mesh> };
  const tube = nodes["VAELIS_Rail_Tube"];
  return <mesh geometry={tube.geometry} material={tube.material} scale={[0.9, 1, 1]} castShadow />;
}

function Piece({
  product,
  colorHex,
  turn,
  onGrabStateChange,
}: {
  product: Product;
  colorHex: string;
  turn: number;
  onGrabStateChange: (grabbing: boolean) => void;
}) {
  const g = useRef<THREE.Group>(null);
  const fade = useMemo(() => makeFadeUniforms(), []);
  const sim = useRef({ rot: 0, vel: 0 });
  const impulse = useRef<HangerImpulse>({ torqueY: 0, tiltZ: 0 });

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 1 / 30);
    const s = sim.current;
    const targetRot = turn + impulse.current.torqueY;
    s.vel += (targetRot - s.rot) * 32 * dt;
    s.vel *= Math.exp(-8.0 * dt);
    s.rot += s.vel * dt;
    if (g.current) {
      g.current.rotation.y = s.rot;
      g.current.rotation.z = THREE.MathUtils.clamp(-s.vel * 0.01 + impulse.current.tiltZ, -0.09, 0.09);
    }
  });

  return (
    <group ref={g}>
      <TeeOnHanger
        product={product}
        colorHex={colorHex}
        fade={fade}
        enableHoverBrush
        enableGrab
        allowAmbient
        impulseRef={impulse}
        onGrabStateChange={onGrabStateChange}
      />
    </group>
  );
}

export function Viewer3D({ product, colorHex }: { product: Product; colorHex: string }) {
  const [turn, setTurn] = useState(0);
  const [dpr, setDpr] = useState(1.25);
  const [soft, setSoft] = useState(true);
  const [grabbingCloth, setGrabbingCloth] = useState(false);
  const controlsRef = useRef<OrbitControlsImpl>(null);

  return (
    <div className="absolute inset-0 h-full w-full" data-lenis-prevent>
      <Canvas
        style={{ width: "100%", height: "100%" }}
        shadows={{ type: THREE.PCFShadowMap }}
        dpr={dpr}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.AgXToneMapping, toneMappingExposure: 1.05 }}
        camera={{ fov: 30, position: [0, -0.32, 2.32], near: 0.05, far: 20 }}
      >
        <PerformanceMonitor
          onDecline={() => {
            setDpr(1);
            setSoft(false);
          }}
        />
        <hemisphereLight args={["#f6f3ec", "#8f897f", 0.85]} />
        <directionalLight
          position={[-1.4, 2.4, 3.6]}
          intensity={2.15}
          color="#fff7ec"
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0005}
          shadow-normalBias={0.028}
          shadow-camera-left={-1.1}
          shadow-camera-right={1.1}
          shadow-camera-top={0.9}
          shadow-camera-bottom={-1.3}
        />
        <directionalLight position={[2.2, 0.6, 1.8]} intensity={0.55} color="#e8eef6" />
        <directionalLight position={[0.2, 1.6, -2.0]} intensity={0.45} color="#f5f1e8" />
        <Environment resolution={128} frames={1}>
          <Lightformer form="rect" intensity={1.9} position={[-2, 3, 3]} scale={[4, 2, 1]} color="#fffaf2" />
          <Lightformer form="rect" intensity={0.85} position={[3, 1, 2]} scale={[1.8, 3, 1]} color="#eef2f6" />
          <Lightformer form="rect" intensity={0.45} position={[0, -2, 2]} scale={[6, 1, 1]} color="#c4bdb1" />
        </Environment>
        <mesh position={[0, -0.4, -0.44]} receiveShadow>
          <planeGeometry args={[6, 4]} />
          <shadowMaterial opacity={0.11} />
        </mesh>
        <SceneBoundary>
          <Suspense fallback={null}>
            <RailStub />
            <Piece product={product} colorHex={colorHex} turn={turn} onGrabStateChange={setGrabbingCloth} />
          </Suspense>
        </SceneBoundary>
        <OrbitControls
          ref={controlsRef}
          enabled={!grabbingCloth}
          target={[0, -0.37, 0]}
          enablePan={false}
          minDistance={0.9}
          maxDistance={3.0}
          minPolarAngle={Math.PI * 0.32}
          maxPolarAngle={Math.PI * 0.62}
          enableDamping
          dampingFactor={0.08}
        />
        {soft && <SoftShadows size={20} samples={10} focus={0.6} />}
      </Canvas>
      <div className="absolute left-4 top-4 flex gap-1" role="group" aria-label="Turn the piece">
        {[
          { label: "Front", v: 0 },
          { label: "Side", v: Math.PI / 2 },
          { label: "Back", v: Math.PI },
        ].map((b) => (
          <button
            key={b.label}
            type="button"
            aria-pressed={turn === b.v}
            onClick={() => setTurn(b.v)}
            className={`t-label rounded-full px-3.5 py-2 transition-colors ${turn === b.v ? "bg-ink text-washi" : "bg-washi/75 hover:bg-washi"}`}
          >
            {b.label}
          </button>
        ))}
      </div>
      <p className="t-label pointer-events-none absolute right-4 top-5 hidden text-muted sm:block">
        Pull fabric to touch · Drag backdrop to orbit · Scroll to zoom
      </p>
    </div>
  );
}
