"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { soundSynth } from "@/lib/soundSynth";

interface Colorway {
  id: string;
  name: string;
  hex: string;
  accent: string;
  bgGlow: string;
  spec: string;
  targetTime: number; // Video timestamp in seconds
}

const COLORWAYS: Colorway[] = [
  {
    id: "obsidian",
    name: "Obsidian Black",
    hex: "#121316",
    accent: "#C5A880",
    bgGlow: "rgba(197, 168, 128, 0.14)",
    spec: "440gsm Bonded Virgin Wool Twill with contrast amber Habotai silk facing",
    targetTime: 0.05,
  },
  {
    id: "alabaster",
    name: "Bone Alabaster",
    hex: "#EDE9E3",
    accent: "#E2DDD5",
    bgGlow: "rgba(237, 233, 227, 0.16)",
    spec: "Natural unbleached virgin merino wool with raw Japanese Habotai silk lining",
    targetTime: 2.8,
  },
  {
    id: "umber",
    name: "Umber Dust",
    hex: "#8C6338",
    accent: "#D49A55",
    bgGlow: "rgba(212, 154, 85, 0.18)",
    spec: "Warm raw ochre mineral dye on heavy structured twill drape",
    targetTime: 4.8,
  },
];

export default function ColorwayStudio() {
  const mountRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [activeColorIndex, setActiveColorIndex] = useState(0);
  const [isPlayingContinuous, setIsPlayingContinuous] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);

  const activeColor = COLORWAYS[activeColorIndex];

  // Ref tracking animation state
  const targetTimeRef = useRef<number | null>(null);
  const isContinuousRef = useRef<boolean>(false);
  const lastVideoTimeRef = useRef<number>(-1);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const meshRef = useRef<THREE.Mesh | null>(null);
  const uniformsRef = useRef<{
    uTexture: { value: THREE.Texture | null };
    uTime: { value: number };
  }>({
    uTexture: { value: null },
    uTime: { value: 0 },
  });

  // Handle colorway click: smoothly play video towards target timestamp
  const handleSelectColorway = useCallback((index: number) => {
    soundSynth.playSilkClick();
    setActiveColorIndex(index);
    setIsPlayingContinuous(false);
    isContinuousRef.current = false;

    const video = videoRef.current;
    if (!video) return;

    const target = COLORWAYS[index].targetTime;
    targetTimeRef.current = target;

    // If current time is past target, wrap or play forward
    video.play().catch(() => {});
  }, []);

  // Toggle continuous morph loop
  const handleTogglePlay = useCallback(() => {
    soundSynth.playSilkClick();
    const video = videoRef.current;
    if (!video) return;

    if (isPlayingContinuous) {
      setIsPlayingContinuous(false);
      isContinuousRef.current = false;
      targetTimeRef.current = null;
      video.pause();
    } else {
      setIsPlayingContinuous(true);
      isContinuousRef.current = true;
      targetTimeRef.current = null;
      video.play().catch(() => {});
    }
  }, [isPlayingContinuous]);

  // Scrubber drag / click
  const handleScrub = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !video.duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = ratio * video.duration;

    targetTimeRef.current = null;
    isContinuousRef.current = false;
    setIsPlayingContinuous(false);
    video.currentTime = newTime;

    // Detect closest colorway
    let closestIdx = 0;
    let minDiff = Infinity;
    COLORWAYS.forEach((cw, idx) => {
      const diff = Math.abs(cw.targetTime - newTime);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });
    setActiveColorIndex(closestIdx);
  }, []);

  // Mouse move parallax
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    mouseRef.current = { x, y };
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = { x: 0, y: 0 };
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Create & Configure Video Element
    const video = document.createElement("video");
    video.src = "/assets/S3_hero_colorway_morph_green.mp4";
    video.crossOrigin = "anonymous";
    video.playsInline = true;
    video.muted = true;
    video.loop = true;
    video.preload = "auto";
    videoRef.current = video;

    // Three.js Scene Setup (Mounts ONCE)
    const scene = new THREE.Scene();

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 560;
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.3);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
      precision: "mediump",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // Initial Fallback High-Res Poster Texture
    const textureLoader = new THREE.TextureLoader();
    const posterTexture = textureLoader.load(
      "/assets/s3_trench_obsidian.jpg",
      () => {
        if (!uniformsRef.current.uTexture.value) {
          uniformsRef.current.uTexture.value = posterTexture;
        }
      }
    );
    posterTexture.colorSpace = THREE.SRGBColorSpace;
    posterTexture.minFilter = THREE.LinearFilter;
    posterTexture.generateMipmaps = false;

    // Create Video Texture
    let videoTexture: THREE.VideoTexture | null = null;

    const setupVideoTexture = () => {
      if (videoTexture) return;
      videoTexture = new THREE.VideoTexture(video);
      videoTexture.colorSpace = THREE.SRGBColorSpace;
      videoTexture.minFilter = THREE.LinearFilter;
      videoTexture.magFilter = THREE.LinearFilter;
      videoTexture.generateMipmaps = false;
      uniformsRef.current.uTexture.value = videoTexture;
    };

    video.addEventListener("canplay", setupVideoTexture);
    video.addEventListener("loadeddata", setupVideoTexture);

    // GLSL Green-Difference Keyer with Stand Dissolve and Rim Light
    const vertexShader = `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      uniform float uTime;

      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;

        vec3 pos = position;
        // Subtle organic breathing float
        pos.y += sin(uTime * 1.4) * 0.018;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `;

    const fragmentShader = `
      uniform sampler2D uTexture;
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vNormal;

      void main() {
        vec4 texColor = texture2D(uTexture, vUv);

        // Primatte Green Difference Key
        float maxRB = max(texColor.r, texColor.b);
        float k = texColor.g - maxRB;
        float alpha = 1.0 - smoothstep(0.02, 0.14, k);

        // Dual-axis edge vignette: Prevents any rectangular borders
        float edgeDistX = abs(vUv.x - 0.5) * 2.0;
        float edgeDistY = abs(vUv.y - 0.5) * 2.0;
        float boxMaskX = smoothstep(0.98, 0.88, edgeDistX);
        float boxMaskY = smoothstep(0.98, 0.88, edgeDistY);
        alpha *= (boxMaskX * boxMaskY);

        // Dissolve Mannequin Tripod Stand & Watermark
        // Coat hem ends at vUv.y ~ 0.17
        if (vUv.y < 0.17) {
          alpha *= smoothstep(0.12, 0.17, vUv.y);
        }

        if (alpha < 0.035) {
          discard;
        }

        // Green spill suppression on edges
        if (texColor.g > maxRB) {
          texColor.g = mix(texColor.g, maxRB, 0.82);
        }

        // Sculptural rim light contour
        float rim = 1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0);
        rim = pow(rim, 2.5) * 0.45;
        vec3 rimCol = mix(vec3(0.98, 0.95, 0.90), vec3(0.85, 0.65, 0.40), 0.35);

        vec3 finalColor = texColor.rgb + (rim * rimCol * alpha);
        finalColor += vec3(0.02, 0.018, 0.015) * alpha;

        gl_FragColor = vec4(finalColor, alpha);
      }
    `;

    const garmentMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: uniformsRef.current,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    // Vertical 9:16 aspect ratio: height 2.7, width 1.51875
    const garmentGeo = new THREE.PlaneGeometry(1.52, 2.7, 32, 32);
    const garmentMesh = new THREE.Mesh(garmentGeo, garmentMaterial);
    garmentMesh.position.set(0, 0.15, 0);
    scene.add(garmentMesh);
    meshRef.current = garmentMesh;

    // Circular Grounding Plinth
    const plinthGroup = new THREE.Group();
    plinthGroup.position.set(0, -1.35, 0);

    const shadowGeo = new THREE.CircleGeometry(0.95, 32);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x060608,
      transparent: true,
      opacity: 0.8,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    plinthGroup.add(shadowMesh);

    const ringGeo = new THREE.TorusGeometry(0.92, 0.008, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xc5a880,
      transparent: true,
      opacity: 0.7,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    plinthGroup.add(ringMesh);
    scene.add(plinthGroup);

    // Resize handler
    let resizeTimer: NodeJS.Timeout;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!container) return;
        const w = container.clientWidth || 600;
        const h = container.clientHeight || 560;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }, 50);
    };
    window.addEventListener("resize", onResize, { passive: true });

    // Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();
    let targetRotationY = 0;
    let targetPositionX = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      uniformsRef.current.uTime.value = elapsedTime;

      // Video playback logic
      if (video && video.readyState >= 2) {
        // Track video progress
        if (video.duration) {
          const cur = video.currentTime;
          const dur = video.duration;
          setVideoProgress(cur / dur);

          // If targeted playback is active
          if (targetTimeRef.current !== null) {
            const target = targetTimeRef.current;
            const diff = target - cur;

            // If we are within 0.08s of target
            if (Math.abs(diff) < 0.08) {
              video.pause();
              video.currentTime = target;
              targetTimeRef.current = null;
            } else if (diff < 0 && Math.abs(diff) > 1.0) {
              // Target is behind us by a wide margin, wrap around or seek
              video.currentTime = target;
              video.pause();
              targetTimeRef.current = null;
            }
          }

          // If continuous play is active, update active colorway indicator
          if (isContinuousRef.current) {
            let activeIdx = 0;
            if (cur >= 1.5 && cur < 3.8) {
              activeIdx = 1; // Alabaster
            } else if (cur >= 3.8 && cur < 5.4) {
              activeIdx = 2; // Umber
            } else {
              activeIdx = 0; // Obsidian
            }
            setActiveColorIndex(activeIdx);
          }
        }

        // Only upload texture to GPU when frame actually changes
        if (videoTexture && video.currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = video.currentTime;
          videoTexture.needsUpdate = true;
        }
      }

      // Smooth interactive mouse parallax
      targetRotationY = mouseRef.current.x * 0.18 + Math.sin(elapsedTime * 0.6) * 0.04;
      targetPositionX = mouseRef.current.x * 0.08;

      garmentMesh.rotation.y += (targetRotationY - garmentMesh.rotation.y) * 0.08;
      garmentMesh.position.x += (targetPositionX - garmentMesh.position.x) * 0.08;

      ringMesh.rotation.z += 0.003;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", onResize);
      clearTimeout(resizeTimer);

      video.removeEventListener("canplay", setupVideoTexture);
      video.removeEventListener("loadeddata", setupVideoTexture);
      video.pause();
      video.src = "";

      garmentGeo.dispose();
      garmentMaterial.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      posterTexture.dispose();
      if (videoTexture) videoTexture.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      className="relative w-full py-12 flex flex-col items-center justify-center select-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Dynamic Background Ambient Light Tint */}
      <div
        style={{ background: activeColor.bgGlow }}
        className="absolute w-[620px] h-[620px] rounded-full blur-[140px] pointer-events-none transition-colors duration-700 ease-out"
        aria-hidden="true"
      />

      {/* 3D WebGL Chroma-Keyed Video Canvas */}
      <div
        ref={mountRef}
        className="relative w-full max-w-xl h-[490px] sm:h-[550px] overflow-hidden will-change-transform transform-gpu z-10 cursor-grab active:cursor-grabbing"
      />

      {/* Interactive Controls & Timeline Strip */}
      <div className="relative z-20 mt-4 flex flex-col items-center space-y-5 max-w-lg w-full px-4">
        {/* Swatch Selector and Play/Pause Bar */}
        <div className="flex items-center gap-4 bg-[#121316]/90 p-2.5 px-4 rounded-full border border-white/10 glass-panel shadow-2xl">
          {/* Play / Pause Toggle Button */}
          <button
            type="button"
            onClick={handleTogglePlay}
            aria-label={isPlayingContinuous ? "Pause morph sequence" : "Play continuous morph"}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-[#C5A880]/20 border border-white/15 text-white/90 font-mono text-[10px] uppercase tracking-wider transition-all duration-300"
          >
            {isPlayingContinuous ? (
              <>
                <span className="w-2 h-2 bg-[#C5A880] rounded-sm animate-pulse" />
                <span>PAUSE</span>
              </>
            ) : (
              <>
                <svg className="w-2.5 h-2.5 fill-[#C5A880]" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>MORPH</span>
              </>
            )}
          </button>

          <div className="h-4 w-px bg-white/15" />

          {/* Colorway Swatches */}
          <div className="flex items-center gap-3">
            {COLORWAYS.map((cw, idx) => (
              <button
                key={cw.id}
                type="button"
                onClick={() => handleSelectColorway(idx)}
                aria-label={`Select ${cw.name} colorway`}
                style={{ backgroundColor: cw.hex }}
                className={`w-7 h-7 rounded-full border-2 transition-all duration-300 relative ${
                  activeColorIndex === idx
                    ? "border-[#C5A880] scale-125 shadow-[0_0_15px_rgba(197,168,128,0.7)]"
                    : "border-white/20 hover:scale-110"
                }`}
              >
                {activeColorIndex === idx && (
                  <span className="absolute -inset-1 rounded-full border border-[#C5A880]/40 animate-ping" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Minimal Interactive Scrubber Bar */}
        <div className="w-full max-w-sm space-y-1.5">
          <div
            onClick={handleScrub}
            className="relative w-full h-1.5 bg-white/10 rounded-full cursor-pointer overflow-hidden group hover:h-2 transition-all duration-200"
            role="slider"
            aria-label="Colorway scrub progress"
            aria-valuenow={Math.round(videoProgress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            {/* Progress Fill */}
            <div
              style={{ width: `${videoProgress * 100}%` }}
              className="h-full bg-gradient-to-r from-[#C5A880] via-[#EDE9E3] to-[#8C6338] rounded-full transition-all duration-75"
            />
          </div>

          {/* Milestones Labels */}
          <div className="flex justify-between items-center font-mono text-[9px] text-white/40 tracking-wider">
            <span
              onClick={() => handleSelectColorway(0)}
              className={`cursor-pointer hover:text-white transition-colors ${
                activeColorIndex === 0 ? "text-[#C5A880] font-medium" : ""
              }`}
            >
              OBSIDIAN
            </span>
            <span
              onClick={() => handleSelectColorway(1)}
              className={`cursor-pointer hover:text-white transition-colors ${
                activeColorIndex === 1 ? "text-[#EDE9E3] font-medium" : ""
              }`}
            >
              ALABASTER
            </span>
            <span
              onClick={() => handleSelectColorway(2)}
              className={`cursor-pointer hover:text-white transition-colors ${
                activeColorIndex === 2 ? "text-[#D49A55] font-medium" : ""
              }`}
            >
              UMBER DUST
            </span>
          </div>
        </div>

        {/* Active Colorway Specifications */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <span
              style={{ color: activeColor.accent }}
              className="font-serif text-2xl font-light tracking-wide transition-colors duration-500"
            >
              {activeColor.name}
            </span>
            <span className="font-mono text-[9px] uppercase px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60">
              ARCHIVE
            </span>
          </div>

          <p className="font-mono text-[11px] text-white/50 max-w-md mx-auto">
            {activeColor.spec}
          </p>
        </div>
      </div>
    </div>
  );
}
