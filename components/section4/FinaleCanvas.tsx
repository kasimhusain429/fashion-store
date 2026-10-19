"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface FinaleCanvasProps {
  scrollProgress?: number;
}

export default function FinaleCanvas({ scrollProgress = 0 }: FinaleCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const scrollProgressRef = useRef<number>(scrollProgress);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastVideoTime = useRef<number>(-1);

  useEffect(() => {
    scrollProgressRef.current = scrollProgress;
  }, [scrollProgress]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    mouseRef.current = { x, y };
  };

  const handleMouseLeave = () => {
    mouseRef.current = { x: 0, y: 0 };
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Three.js Scene Setup (Mounts ONCE)
    const scene = new THREE.Scene();

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 650;
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.2);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
      precision: "mediump",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Uniforms
    const uniforms = {
      uTexture: { value: null as THREE.Texture | null },
      uTime: { value: 0 },
      uGlowIntensity: { value: 1.0 },
    };

    // Load High-Res Fallback Studio Texture
    const textureLoader = new THREE.TextureLoader();
    const fallbackTexture = textureLoader.load(
      "/assets/s1_look01_monolith_studio.jpg",
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        if (!uniforms.uTexture.value) {
          uniforms.uTexture.value = tex;
        }
      }
    );

    // Bind 360-degree Turntable Video Texture
    let videoTexture: THREE.VideoTexture | null = null;
    const vid = videoRef.current;
    if (vid) {
      vid.currentTime = 0;
      vid.play()
        .then(() => {
          videoTexture = new THREE.VideoTexture(vid);
          videoTexture.colorSpace = THREE.SRGBColorSpace;
          videoTexture.minFilter = THREE.LinearFilter;
          videoTexture.generateMipmaps = false;
          uniforms.uTexture.value = videoTexture;
        })
        .catch(() => {});
    }

    // Shader Material: Primatte Keyer + Edge Vignette + Liquid Gold Rim
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
        // Subtle monumental levitation
        pos.y += sin(uTime * 1.2) * 0.025;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `;

    const fragmentShader = `
      uniform sampler2D uTexture;
      uniform float uTime;
      uniform float uGlowIntensity;
      varying vec2 vUv;
      varying vec3 vNormal;

      void main() {
        vec4 texColor = texture2D(uTexture, vUv);

        // Primatte Keyer (keys green screen)
        float maxRB = max(texColor.r, texColor.b);
        float k = texColor.g - maxRB;
        float alpha = 1.0 - smoothstep(0.02, 0.14, k);

        // Strict edge vignette (prevents edge bounding boxes)
        float edgeDistX = abs(vUv.x - 0.5) * 2.0;
        float edgeDistY = abs(vUv.y - 0.5) * 2.0;
        float boxMaskX = smoothstep(0.98, 0.88, edgeDistX);
        float boxMaskY = smoothstep(0.98, 0.88, edgeDistY);
        alpha *= (boxMaskX * boxMaskY);

        if (alpha < 0.03) {
          discard;
        }

        // Spill suppression
        if (texColor.g > maxRB) {
          texColor.g = mix(texColor.g, maxRB, 0.85);
        }

        // Liquid Gold Rim Light
        float rim = 1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0);
        rim = pow(rim, 2.8) * 0.65 * uGlowIntensity;
        vec3 goldRim = vec3(0.77, 0.66, 0.50); // #C5A880 in linear

        vec3 finalColor = texColor.rgb + (rim * goldRim * alpha);
        finalColor += vec3(0.02, 0.018, 0.015) * alpha;

        gl_FragColor = vec4(finalColor, alpha);
      }
    `;

    const garmentMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    // 896 x 1200 aspect ratio: height 2.8, width 2.8 * (896 / 1200) = 2.09
    const garmentGeo = new THREE.PlaneGeometry(2.09, 2.8, 32, 32);
    const garmentMesh = new THREE.Mesh(garmentGeo, garmentMaterial);
    garmentMesh.position.set(0, 0.18, 0);
    scene.add(garmentMesh);

    // Multi-Tier Concentric Obsidian Grounding Dais
    const daisGroup = new THREE.Group();
    daisGroup.position.set(0, -1.38, 0);

    // Base contact shadow
    const shadowGeo = new THREE.CircleGeometry(1.2, 32);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x050507,
      transparent: true,
      opacity: 0.88,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    daisGroup.add(shadowMesh);

    // Outer golden halo ring
    const outerRingGeo = new THREE.TorusGeometry(1.15, 0.008, 16, 64);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: 0xc5a880,
      transparent: true,
      opacity: 0.75,
    });
    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerRing.rotation.x = Math.PI / 2;
    daisGroup.add(outerRing);

    // Inner counter-rotating ring
    const innerRingGeo = new THREE.TorusGeometry(0.85, 0.005, 16, 48);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: 0xede9e3,
      transparent: true,
      opacity: 0.45,
    });
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRing.rotation.x = Math.PI / 2;
    daisGroup.add(innerRing);

    scene.add(daisGroup);

    // Resize Handler
    let resizeTimer: NodeJS.Timeout;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!container) return;
        const w = container.clientWidth || 800;
        const h = container.clientHeight || 650;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }, 50);
    };
    window.addEventListener("resize", onResize, { passive: true });

    // Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();
    let currentRotationY = 0;
    let currentPositionX = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      uniforms.uTime.value = elapsedTime;

      // Update turntable video frame
      if (vid && videoTexture && vid.readyState >= 2) {
        if (vid.currentTime !== lastVideoTime.current) {
          lastVideoTime.current = vid.currentTime;
          videoTexture.needsUpdate = true;
        }
      }

      // Subtle breathing pulse on the gold rim
      uniforms.uGlowIntensity.value = 0.85 + Math.sin(elapsedTime * 2.0) * 0.25;

      // Smooth interactive mouse parallax
      const targetRotY = mouseRef.current.x * 0.15 + Math.sin(elapsedTime * 0.5) * 0.04;
      const targetPosX = mouseRef.current.x * 0.06;

      currentRotationY += (targetRotY - currentRotationY) * 0.07;
      currentPositionX += (targetPosX - currentPositionX) * 0.07;

      garmentMesh.rotation.y = currentRotationY;
      garmentMesh.position.x = currentPositionX;

      // Concentric rings rotation
      outerRing.rotation.z += 0.004;
      innerRing.rotation.z -= 0.006;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", onResize);
      clearTimeout(resizeTimer);

      garmentGeo.dispose();
      garmentMaterial.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      outerRingGeo.dispose();
      outerRingMat.dispose();
      innerRingGeo.dispose();
      innerRingMat.dispose();
      fallbackTexture.dispose();
      if (videoTexture) videoTexture.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      className="relative w-full h-[440px] sm:h-[560px] lg:h-[620px] flex items-center justify-center select-none cursor-grab active:cursor-grabbing"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Golden Aura Glow Backdrop */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full blur-[130px] bg-[#C5A880]/15 pointer-events-none"
        aria-hidden="true"
      />

      <div
        ref={mountRef}
        className="relative w-full max-w-2xl h-full will-change-transform transform-gpu z-10 flex items-center justify-center"
      />

      {/* 360 Turntable Video Element */}
      <video
        ref={videoRef}
        src="/assets/S4_hero_turntable_green.mp4"
        crossOrigin="anonymous"
        playsInline
        muted
        loop
        autoPlay
        preload="auto"
        className="hidden"
      />
    </div>
  );
}
