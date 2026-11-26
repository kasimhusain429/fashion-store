"use client";

/* eslint-disable react-hooks/immutability --
   three.js objects (camera, uniforms, scene graph) are mutated inside useFrame callbacks,
   outside React's render; that is how react-three-fiber animates. */

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Environment, Lightformer, SoftShadows, useGLTF, useProgress } from "@react-three/drei";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AnimatePresence, motion } from "motion/react";
import { PRODUCTS, SIZE_LABELS, type Product } from "@/lib/catalog";
import { formatPrice, lookNumber } from "@/lib/format";
import { shop, useShop } from "@/lib/store";
import { makeFadeUniforms, type FadeUniforms } from "@/components/three/materials";
import { TeeOnHanger, preloadTees, type HangerImpulse } from "@/components/three/Tee";
import { SceneBoundary } from "@/components/three/SceneBoundary";
import { scrollLock } from "@/components/chrome/SmoothScroll";

gsap.registerPlugin(ScrollTrigger);
preloadTees();
useGLTF.preload("/models/rail.glb");

const RAIL_Y = 1.72;
const SPACING = 0.255;
const EDGE = 1.32; // edge-on swivel (rad)
const SPREAD = 0.165;
const N = PRODUCTS.length;
const baseX = (i: number) => (i - (N - 1) / 2) * SPACING;
const RAIL_LEN = (N - 1) * SPACING + 2 * (SPREAD + 0.42);

type View = "front" | "back";

interface Shared {
  intro: number;
  drag: number;
  mobile: boolean;
  grabbingCloth: boolean;
}

/* ------------------------------------------------------------------ */
/* 3D                                                                  */
/* ------------------------------------------------------------------ */

function Rail({ dimmed }: { dimmed: boolean }) {
  const { nodes } = useGLTF("/models/rail.glb") as unknown as { nodes: Record<string, THREE.Mesh> };
  const tube = nodes["VAELIS_Rail_Tube"];
  const bracket = nodes["VAELIS_Rail_Bracket"];
  return (
    <group position={[0, RAIL_Y, 0]}>
      <mesh geometry={tube.geometry} material={tube.material} scale={[RAIL_LEN, 1, 1]} castShadow={!dimmed} receiveShadow />
      {[-1, 1].map((side) => (
        <group key={side} position={[(side * RAIL_LEN) / 2, 0, 0]} scale={[side, 1, 1]}>
          <mesh geometry={bracket.geometry} material={bracket.material} rotation={[Math.PI / 2, 0, 0]} castShadow={!dimmed} />
          <mesh position={[0, 1.4, 0]} material={bracket.material}>
            <cylinderGeometry args={[0.0062, 0.0062, 2.6, 16]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Garment({
  product,
  index,
  colorHex,
  frontIndex,
  focused,
  anyFocused,
  view,
  shared,
  onHoverEnter,
  onHoverLeave,
  onPick,
}: {
  product: Product;
  index: number;
  colorHex: string;
  frontIndex: number | null;
  focused: boolean;
  anyFocused: boolean;
  view: View;
  shared: React.RefObject<Shared>;
  onHoverEnter: (i: number) => void;
  onHoverLeave: (i: number) => void;
  onPick: (i: number) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const fade = useMemo<FadeUniforms>(() => makeFadeUniforms(), []);
  const sim = useRef({ rot: EDGE, vel: 0, x: baseX(index) });
  const impulse = useRef<HangerImpulse>({ torqueY: 0, tiltZ: 0 });
  const phase = index * 1.7 + 0.4;

  const handleGrabState = (grabbing: boolean) => {
    shared.current.grabbingCloth = grabbing;
  };

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 1 / 30);
    const g = group.current;
    if (!g) return;
    const s = sim.current;
    const isFront = frontIndex === index;
    let targetRot = EDGE;
    if (isFront) targetRot = view === "back" && focused ? Math.PI : 0;
    if (focused) targetRot += shared.current.drag;
    if (!isFront && !anyFocused) targetRot += Math.sin(state.clock.elapsedTime * 0.55 + phase) * 0.032;
    targetRot += impulse.current.torqueY;

    // Swing on the hook: lightly under-damped pendulum coupled with fabric pull
    s.vel += (targetRot - s.rot) * 36 * dt;
    s.vel *= Math.exp(-8.5 * dt);
    s.rot += s.vel * dt;
    g.rotation.y = s.rot;
    g.rotation.z = THREE.MathUtils.clamp(-s.vel * 0.012 + impulse.current.tiltZ, -0.08, 0.08);

    // Neighbours nudge gently aside on hover without ever shifting the hovered piece itself;
    // in focus mode they part wide so the colourway tags and details have full clearance.
    let tx = baseX(index);
    if (anyFocused && frontIndex !== null && frontIndex !== index) {
      tx += index < frontIndex ? -(SPREAD + 0.44) : SPREAD + 0.44;
    } else if (!anyFocused && frontIndex !== null && frontIndex !== index) {
      const dIdx = index - frontIndex;
      if (Math.abs(dIdx) === 1) tx += dIdx < 0 ? -0.055 : 0.055;
    }
    s.x = THREE.MathUtils.damp(s.x, tx, 6.5, dt);
    g.position.x = s.x;

    // Non-focused garments dissolve completely into the plaster backdrop when a piece is focused
    const targetFade = anyFocused && !focused ? 1.0 : 0;
    fade.uFade.value = THREE.MathUtils.damp(fade.uFade.value, targetFade, 6.5, dt);
  });

  const handleOver = (e: ThreeEvent<PointerEvent>) => {
    if (anyFocused || shared.current.mobile) return;
    e.stopPropagation();
    onHoverEnter(index);
  };

  const handleMove = (e: ThreeEvent<PointerEvent>) => {
    if (anyFocused || shared.current.mobile) return;
    e.stopPropagation();
    onHoverEnter(index);
  };

  const handleOut = (e: ThreeEvent<PointerEvent>) => {
    if (anyFocused || shared.current.mobile) return;
    e.stopPropagation();
    onHoverLeave(index);
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (anyFocused) return;
    e.stopPropagation();
    onPick(index);
  };

  return (
    <group
      ref={group}
      position={[baseX(index), RAIL_Y, 0]}
      rotation={[0, EDGE, 0]}
      onPointerOver={handleOver}
      onPointerMove={handleMove}
      onPointerOut={handleOut}
      onClick={handleClick}
    >
      <SceneBoundary>
        <Suspense fallback={null}>
          <TeeOnHanger
            product={product}
            colorHex={colorHex}
            fade={fade}
            castShadow={!anyFocused || focused}
            enableHoverBrush={!anyFocused || focused}
            enableGrab={focused}
            allowAmbient={focused}
            impulseRef={impulse}
            onGrabStateChange={handleGrabState}
          />
        </Suspense>
      </SceneBoundary>
    </group>
  );
}

/* Colourway hang-tags: cards on strings tied to the rail, swinging as pendulums. */
function tagGeometry() {
  const w = 0.05;
  const h = 0.082;
  const r = 0.006;
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h);
  s.lineTo(w / 2 - r, -h);
  s.quadraticCurveTo(w / 2, -h, w / 2, -h + r);
  s.lineTo(w / 2, -r);
  s.quadraticCurveTo(w / 2, 0, w / 2 - r, 0);
  s.lineTo(-w / 2 + r, 0);
  s.quadraticCurveTo(-w / 2, 0, -w / 2, -r);
  s.lineTo(-w / 2, -h + r);
  s.quadraticCurveTo(-w / 2, -h, -w / 2 + r, -h);
  const hole = new THREE.Path();
  hole.absarc(0, -0.009, 0.0034, 0, Math.PI * 2, true);
  s.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.0014, bevelEnabled: false, curveSegments: 6 });
  g.translate(0, 0, -0.0007);
  return g;
}

function HangTag({
  hex,
  x,
  length,
  selected,
  onSelect,
  delay,
}: {
  hex: string;
  x: number;
  length: number;
  selected: boolean;
  onSelect: () => void;
  delay: number;
}) {
  const pivot = useRef<THREE.Group>(null);
  const geo = useMemo(() => tagGeometry(), []);
  const p = useRef({ a: 0.9, w: 0, t: -delay, drop: 0 });
  const [hover, setHover] = useState(false);

  useEffect(() => {
    if (selected) p.current.w += 2.4;
  }, [selected]);

  useEffect(() => () => geo.dispose(), [geo]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 1 / 30);
    const s = p.current;
    s.t += dt;
    if (s.t < 0) return;
    s.drop = THREE.MathUtils.damp(s.drop, 1, 7, dt);
    s.w += (-(9.81 / length) * Math.sin(s.a) - 1.6 * s.w) * dt;
    s.a += s.w * dt;
    if (pivot.current) {
      pivot.current.rotation.z = s.a;
      pivot.current.scale.setScalar(Math.max(s.drop, 0.0001));
    }
  });

  return (
    <group position={[x, RAIL_Y - 0.012, 0.03]}>
      <group ref={pivot} scale={0.0001}>
        <mesh position={[0, -length / 2, 0]}>
          <cylinderGeometry args={[0.0007, 0.0007, length, 6]} />
          <meshStandardMaterial color={selected ? "#8c6338" : "#2a2622"} roughness={0.7} />
        </mesh>
        <mesh
          geometry={geo}
          position={[0, -length + 0.006, 0]}
          scale={selected || hover ? 1.1 : 1}
          castShadow
          onPointerOver={(e) => {
            e.stopPropagation();
            setHover(true);
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            setHover(false);
            document.body.style.cursor = "";
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          <meshStandardMaterial color={hex} roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

function CameraRig({
  frontIndex,
  focused,
  shared,
}: {
  frontIndex: number | null;
  focused: number | null;
  shared: React.RefObject<Shared>;
}) {
  const { camera, size } = useThree();
  const look = useRef(new THREE.Vector3(baseX(0), 1.56, 0));
  const mobile = size.width / size.height < 0.8;

  useEffect(() => {
    shared.current.mobile = mobile;
  }, [mobile, shared]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 1 / 30);
    const cam = camera as THREE.PerspectiveCamera;
    const targetFov = mobile ? 34 : 26;
    if (Math.abs(cam.fov - targetFov) > 0.01) {
      cam.fov = targetFov;
      cam.updateProjectionMatrix();
    }
    const fx = baseX(frontIndex ?? 0);
    const ease = 1 - Math.pow(1 - shared.current.intro, 3);
    let px: number, py: number, pz: number, lx: number, ly: number;
    if (focused !== null) {
      const x = baseX(focused);
      if (mobile) {
        px = x + 0.16;
        py = 1.2;
        pz = 3.3;
        lx = x + 0.16;
        ly = 0.84;
      } else {
        px = x + 0.24;
        py = 1.3;
        pz = 2.15;
        lx = x + 0.24;
        ly = 1.3;
      }
    } else if (mobile) {
      px = fx;
      py = THREE.MathUtils.lerp(1.80, 1.3, ease);
      pz = THREE.MathUtils.lerp(3.05, 3.45, ease);
      lx = fx;
      ly = THREE.MathUtils.lerp(1.80, 1.18, ease);
    } else {
      // Intro positions the rail gracefully below the VAELIS display wordmark & subtitle without overlapping
      px = THREE.MathUtils.lerp(fx, fx * 0.28, ease);
      py = THREE.MathUtils.lerp(1.78, 1.32, ease);
      pz = THREE.MathUtils.lerp(3.35, 4.75, ease);
      lx = px;
      ly = THREE.MathUtils.lerp(1.78, 1.26, ease);
    }
    const lambda = focused !== null ? 3.4 : 4.5;
    cam.position.x = THREE.MathUtils.damp(cam.position.x, px, lambda, dt);
    cam.position.y = THREE.MathUtils.damp(cam.position.y, py, lambda, dt);
    cam.position.z = THREE.MathUtils.damp(cam.position.z, pz, lambda, dt);
    look.current.x = THREE.MathUtils.damp(look.current.x, lx, lambda, dt);
    look.current.y = THREE.MathUtils.damp(look.current.y, ly, lambda, dt);
    cam.lookAt(look.current);
  });
  return null;
}

function Scene({
  colors,
  frontIndex,
  focused,
  view,
  shared,
  onHover,
  onPick,
  onBackground,
  onColor,
  dragMovedRef,
}: {
  colors: string[];
  frontIndex: number | null;
  focused: number | null;
  view: View;
  shared: React.RefObject<Shared>;
  onHover: (i: number | null) => void;
  onPick: (i: number) => void;
  onBackground: () => void;
  onColor: (productIndex: number, colorId: string) => void;
  dragMovedRef: React.RefObject<number>;
}) {
  const hoverLeaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeHover = useRef<number | null>(null);

  const handleHoverEnter = useCallback(
    (i: number) => {
      if (hoverLeaveTimer.current) {
        clearTimeout(hoverLeaveTimer.current);
        hoverLeaveTimer.current = null;
      }
      if (activeHover.current !== i) {
        activeHover.current = i;
        onHover(i);
      }
      document.body.style.cursor = "pointer";
    },
    [onHover],
  );

  const handleHoverLeave = useCallback(
    (i: number) => {
      if (hoverLeaveTimer.current) clearTimeout(hoverLeaveTimer.current);
      // Grace period prevents micro-flicker across seams without snapping away during swivel
      hoverLeaveTimer.current = setTimeout(() => {
        if (activeHover.current === i) {
          activeHover.current = null;
          onHover(null);
          document.body.style.cursor = "";
        }
      }, 240);
    },
    [onHover],
  );

  useEffect(() => {
    return () => {
      if (hoverLeaveTimer.current) clearTimeout(hoverLeaveTimer.current);
    };
  }, []);

  useEffect(() => {
    if (focused !== null) {
      activeHover.current = null;
      if (hoverLeaveTimer.current) {
        clearTimeout(hoverLeaveTimer.current);
        hoverLeaveTimer.current = null;
      }
    }
  }, [focused]);

  return (
    <>
      <hemisphereLight args={["#f6f3ec", "#8f897f", 0.85]} />
      <directionalLight
        position={[-1.6, 3.0, 4.4]}
        intensity={2.15}
        color="#fff7ec"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.028}
        shadow-camera-left={-2.5}
        shadow-camera-right={2.5}
        shadow-camera-top={2.6}
        shadow-camera-bottom={0}
        shadow-camera-near={0.5}
        shadow-camera-far={12}
      />
      <directionalLight position={[2.8, 1.4, 2.4]} intensity={0.52} color="#e8eef6" />
      <directionalLight position={[0.2, 1.8, -1.8]} intensity={0.38} color="#f3efe6" />
      <Suspense fallback={null}>
        <Environment resolution={128} frames={1}>
          <Lightformer form="rect" intensity={1.9} position={[-2, 3, 3]} scale={[4, 2, 1]} color="#fffaf2" />
          <Lightformer form="rect" intensity={0.85} position={[3, 1, 2]} scale={[1.8, 3, 1]} color="#eef2f6" />
          <Lightformer form="rect" intensity={0.45} position={[0, -2, 2]} scale={[6, 1, 1]} color="#c4bdb1" />
        </Environment>
        <Rail dimmed={focused !== null} />
      </Suspense>

      {/* Plaster wall: subtle soft gallery shadow; dimmed in focus mode so UI stays crisp */}
      <mesh
        position={[0, 1.3, -0.52]}
        receiveShadow
        onClick={(e) => {
          if (focused !== null && dragMovedRef.current < 8) {
            e.stopPropagation();
            onBackground();
          }
        }}
      >
        <planeGeometry args={[10, 5.5]} />
        <shadowMaterial opacity={focused !== null ? 0.08 : 0.11} />
      </mesh>
      {PRODUCTS.map((p, i) => (
        <Garment
          key={p.slug}
          product={p}
          index={i}
          colorHex={p.colorways.find((c) => c.id === colors[i])?.hex ?? p.colorways[0].hex}
          frontIndex={focused ?? frontIndex}
          focused={focused === i}
          anyFocused={focused !== null}
          view={view}
          shared={shared}
          onHoverEnter={handleHoverEnter}
          onHoverLeave={handleHoverLeave}
          onPick={onPick}
        />
      ))}

      {focused !== null &&
        PRODUCTS[focused].colorways.map((c, k) => (
          <HangTag
            key={`${focused}-${c.id}`}
            hex={c.hex}
            x={baseX(focused) + (shared.current.mobile ? 0.3 : 0.44) + k * 0.068}
            length={0.13 + ((k * 37) % 3) * 0.028}
            selected={colors[focused] === c.id}
            onSelect={() => onColor(focused, c.id)}
            delay={0.25 + k * 0.12}
          />
        ))}

      <CameraRig frontIndex={frontIndex} focused={focused} shared={shared} />
      <SoftShadows size={20} samples={10} focus={0.6} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* DOM                                                                 */
/* ------------------------------------------------------------------ */

function Loader() {
  const { active, progress } = useProgress();
  return (
    <AnimatePresence>
      {active && (
        <motion.p
          className="t-label absolute bottom-8 left-1/2 -translate-x-1/2 text-muted"
          exit={{ opacity: 0 }}
          aria-live="polite"
        >
          Hanging the collection {Math.round(progress)}%
        </motion.p>
      )}
    </AnimatePresence>
  );
}

function FocusPanel({
  product,
  colorId,
  onColor,
  view,
  onView,
  onClose,
}: {
  product: Product;
  colorId: string;
  onColor: (id: string) => void;
  view: View;
  onView: (v: View) => void;
  onClose: () => void;
}) {
  const s = useShop();
  const [size, setSize] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const color = product.colorways.find((c) => c.id === colorId) ?? product.colorways[0];
  const price = s.currency === "EUR" ? product.priceEUR : product.priceUSD;
  const saved = s.wishlist.includes(product.slug);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => closeRef.current?.focus({ preventScroll: true }), []);

  return (
    <motion.aside
      role="dialog"
      aria-modal="false"
      aria-label={`${product.name}, ${lookNumber(product.look)}`}
      className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 max-h-[52svh] overflow-y-auto rounded-t-2xl border-t border-line bg-washi/95 px-5 pb-6 pt-5 backdrop-blur-md lg:inset-x-auto lg:bottom-auto lg:right-[var(--gutter)] lg:top-1/2 lg:max-h-[calc(100svh-var(--header-h)-2rem)] lg:w-[360px] lg:-translate-y-1/2 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.5, ease: [0.22, 0.8, 0.18, 1] }}
      data-lenis-prevent
    >
      <div className="flex items-baseline justify-between">
        <p className="t-label text-muted">{lookNumber(product.look)}</p>
        <button ref={closeRef} type="button" onClick={onClose} className="t-label link py-2">
          Back to the rail
        </button>
      </div>
      <h2 className="t-headline mt-2 text-[clamp(30px,3.2vw,44px)]">{product.name}</h2>
      <p className="t-ui mt-2 text-muted">{product.cut}</p>
      <p className="t-headline mt-4 text-[22px]">{formatPrice(price, s.currency)}</p>

      <fieldset className="mt-6">
        <legend className="t-label">
          Colour <span className="text-muted">{color.name}</span>
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {product.colorways.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={c.id === color.id}
              onClick={() => onColor(c.id)}
              className={`t-label flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 ${c.id === color.id ? "shadow-[inset_0_0_0_1.5px_#000]" : "shadow-[inset_0_0_0_1px_rgb(0_0_0/0.2)] hover:shadow-[inset_0_0_0_1px_#000]"}`}
            >
              <span className="h-5 w-5 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.15)]" style={{ background: c.swatch }} />
              {c.name}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-5 flex flex-wrap items-center gap-2" role="group" aria-label="View">
        {(["front", "back"] as const).map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={view === v}
            onClick={() => onView(v)}
            className={`t-label rounded-full px-4 py-2 ${view === v ? "bg-ink text-washi" : "shadow-[inset_0_0_0_1px_rgb(0_0_0/0.25)]"}`}
          >
            {v === "front" ? "Front" : "Back"}
          </button>
        ))}
        <span className="t-label ml-1 text-muted">Pull cloth to stretch · Drag space to turn</span>
      </div>

      <fieldset className="mt-6">
        <legend className="t-label">Size</legend>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {product.sizes.map((sz) => (
            <button
              key={sz}
              type="button"
              aria-pressed={size === sz}
              onClick={() => {
                setSize(sz);
                setError(false);
              }}
              className={`t-label h-11 rounded-full ${size === sz ? "bg-ink text-washi" : "shadow-[inset_0_0_0_1px_rgb(0_0_0/0.25)] hover:shadow-[inset_0_0_0_1px_#000]"}`}
            >
              {SIZE_LABELS[sz]}
            </button>
          ))}
        </div>
        {error && (
          <p className="t-label mt-2 text-[#9b2c1f]" role="alert">
            Choose a size to add this piece to your bag.
          </p>
        )}
      </fieldset>

      <div className="mt-6 flex gap-2">
        <button
          type="button"
          className="btn btn-solid flex-1"
          onClick={() => {
            if (!size) return setError(true);
            shop.add({ slug: product.slug, colorway: color.id, size });
          }}
        >
          Add to bag
        </button>
        <button type="button" className="btn btn-line" aria-pressed={saved} onClick={() => shop.toggleWish(product.slug)}>
          {saved ? "Saved" : "Save"}
        </button>
      </div>
      <Link href={`/collection/${product.slug}?c=${color.id}`} className="t-ui link mt-5 inline-block">
        Full details and sizing
      </Link>
    </motion.aside>
  );
}

export function AtelierRail() {
  const section = useRef<HTMLElement>(null);
  const canvasWrap = useRef<HTMLDivElement>(null);
  const shared = useRef<Shared>({ intro: 0, drag: 0, mobile: false, grabbingCloth: false });
  const dragMovedRef = useRef(0);
  const [current, setCurrent] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const [focused, setFocused] = useState<number | null>(null);
  const [view, setView] = useState<View>("front");
  const [colors, setColors] = useState<string[]>(() => PRODUCTS.map((p) => p.colorways[0].id));
  const [introDone, setIntroDone] = useState(false);
  const [visible, setVisible] = useState(true);
  const s = useShop();

  // Scroll: intro pull-back, then flick through the rail one hanger at a time
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const introShare = 100 / (100 + N * 42 + 30 - 100);
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "bottom bottom",
      onUpdate(self) {
        const p = self.progress;
        shared.current.intro = reduced ? 1 : Math.min(1, p / introShare);
        setIntroDone(p > introShare * 0.62);
        const browse = Math.max(0, (p - introShare) / (1 - introShare));
        setCurrent(Math.min(N - 1, Math.floor(browse * N * 0.999)));
      },
    });
    if (reduced) shared.current.intro = 1;
    return () => st.kill();
  }, []);

  useEffect(() => {
    const el = canvasWrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "120px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const focus = useCallback((i: number) => {
    setFocused(i);
    setView("front");
    shared.current.drag = 0;
    setHovered(null);
    document.body.style.cursor = "";
  }, []);

  const unfocus = useCallback(() => {
    setFocused(null);
    setView("front");
    shared.current.drag = 0;
    shared.current.grabbingCloth = false;
  }, []);

  useEffect(() => {
    if (focused === null) return;
    scrollLock.lock();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") unfocus();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      scrollLock.unlock();
    };
  }, [focused, unfocus]);

  // Drag on backdrop to turn the focused piece; always measure total pointer travel so releasing after cloth pull never mis-triggers background unfocus
  useEffect(() => {
    const el = canvasWrap.current;
    if (!el || focused === null) return;
    let down = false;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    const onDown = (e: PointerEvent) => {
      dragMovedRef.current = 0;
      down = true;
      startX = e.clientX;
      startY = e.clientY;
      lastX = e.clientX;
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
      if (dist > dragMovedRef.current) dragMovedRef.current = dist;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      if (!shared.current.grabbingCloth) {
        shared.current.drag += dx * 0.012;
      }
    };
    const onUp = () => {
      down = false;
    };
    el.addEventListener("pointerdown", onDown, { capture: true });
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown, { capture: true });
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [focused]);

  const frontIndex = hovered ?? current;
  const shown = PRODUCTS[focused ?? frontIndex];
  const setColor = (pi: number, id: string) => setColors((cs) => cs.map((c, k) => (k === pi ? id : c)));

  return (
    <section
      ref={section}
      aria-label="The rail: the Chrono-Fold collection"
      className="relative"
      style={{ height: `${100 + N * 42 + 30}vh` }}
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden bg-plaster">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-10 px-[var(--gutter)] pt-[calc(var(--header-h)+0.4vh)] text-white mix-blend-difference transition-opacity duration-500"
          style={{ opacity: introDone || focused !== null ? 0 : 1 }}
        >
          <h1
            className="t-display text-center text-[clamp(44px,min(17vw,20svh),290px)] leading-[0.82]"
            style={{ animation: "unfold-width 1.6s var(--ease-fold) both" }}
          >
            VAELIS
          </h1>
          <div className="mt-2 flex flex-col items-center gap-1 text-center sm:mt-[1.4vh]" style={{ animation: "rise 1s 0.9s var(--ease-cloth) both" }}>
            <p className="t-lede text-[clamp(18px,min(3.2vw,3.4svh),32px)]">Chrono-Fold. Six t-shirts, cut as architecture.</p>
            <p className="t-label opacity-70">Scroll to walk the rail</p>
          </div>
        </div>

        <div ref={canvasWrap} className="absolute inset-0 h-full w-full" style={{ touchAction: focused !== null ? "none" : "pan-y" }}>
          <Canvas
            style={{ width: "100%", height: "100%" }}
            shadows={{ type: THREE.PCFShadowMap }}
            dpr={[1, 1.75]}
            frameloop={visible ? "always" : "never"}
            gl={{ antialias: true, alpha: true, toneMapping: THREE.AgXToneMapping, toneMappingExposure: 1.05 }}
            camera={{ fov: 26, position: [baseX(0), 1.78, 3.35], near: 0.05, far: 30 }}
            aria-hidden="true"
          >
            <Scene
              colors={colors}
              frontIndex={frontIndex}
              focused={focused}
              view={view}
              shared={shared}
              onHover={setHovered}
              onPick={focus}
              onBackground={unfocus}
              onColor={setColor}
              dragMovedRef={dragMovedRef}
            />
          </Canvas>
          <Loader />
        </div>

        <AnimatePresence>
          {introDone && focused === null && (
            <motion.div
              className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col gap-4 px-[var(--gutter)] pb-6 sm:flex-row sm:items-end sm:justify-between sm:pb-8"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 0.8, 0.18, 1] }}
            >
              <div className="pointer-events-auto">
                <p className="t-label text-muted">{lookNumber(shown.look)}</p>
                <p className="t-headline mt-1 text-[clamp(26px,3vw,40px)]">{shown.name}</p>
                <p className="t-ui mt-1">
                  {shown.cut}
                  <span className="ml-3">{formatPrice(s.currency === "EUR" ? shown.priceEUR : shown.priceUSD, s.currency)}</span>
                </p>
                <button type="button" className="btn btn-solid mt-4" onClick={() => focus(PRODUCTS.indexOf(shown))}>
                  Take it off the rail
                </button>
              </div>
              <nav aria-label="Looks on the rail" className="pointer-events-auto">
                <ol className="flex gap-1">
                  {PRODUCTS.map((p, i) => (
                    <li key={p.slug}>
                      <button
                        type="button"
                        onMouseEnter={() => setHovered(i)}
                        onMouseLeave={() => setHovered(null)}
                        onFocus={() => setHovered(i)}
                        onBlur={() => setHovered(null)}
                        onClick={() => focus(i)}
                        aria-label={`${lookNumber(p.look)}: ${p.name}`}
                        aria-current={frontIndex === i ? "true" : undefined}
                        className={`t-num grid h-10 w-10 place-items-center text-[15px] transition-colors sm:h-11 sm:w-11 ${frontIndex === i ? "text-ink underline underline-offset-4" : "text-muted hover:text-ink"}`}
                      >
                        {String(p.look).padStart(2, "0")}
                      </button>
                    </li>
                  ))}
                </ol>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {focused !== null && (
            <FocusPanel
              key={PRODUCTS[focused].slug}
              product={PRODUCTS[focused]}
              colorId={colors[focused]}
              onColor={(id) => setColor(focused, id)}
              view={view}
              onView={(v) => {
                setView(v);
                shared.current.drag = 0;
              }}
              onClose={unfocus}
            />
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
