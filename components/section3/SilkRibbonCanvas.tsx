"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface SilkRibbonCanvasProps {
  scrollProgress: number; // local progress of ribbon section (0 to 1)
}

export default function SilkRibbonCanvas({
  scrollProgress,
}: SilkRibbonCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef(0);
  const currentScrollLerp = useRef(0);

  useEffect(() => {
    scrollRef.current = scrollProgress;
  }, [scrollProgress]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Three.js Scene Setup (Mounts ONCE)
    const scene = new THREE.Scene();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 450;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
      precision: "mediump",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // GLSL Vertex Displacement Silk Shader
    const vertexShader = `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      uniform float uTime;
      uniform float uScroll;

      void main() {
        vUv = uv;
        vPosition = position;

        vec3 pos = position;

        // Dynamic multi-wave silk cloth physics
        float wave1 = sin(pos.x * 2.8 + uTime * 2.2 + uScroll * 4.5) * 0.32;
        float wave2 = cos(pos.x * 4.2 - uTime * 1.8) * 0.12 * sin(pos.y * 3.0);
        float wave3 = sin(pos.y * 5.0 + uTime * 1.5) * 0.08;

        pos.z += wave1 + wave2 + wave3;
        pos.y += sin(pos.x * 1.5 + uTime * 1.2) * 0.15;

        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `;

    const fragmentShader = `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      uniform float uTime;
      uniform float uScroll;

      void main() {
        // Dynamic Anisotropic Silk Sheen
        vec3 lightDir = normalize(vec3(0.5, 1.0, 1.2));
        float diff = max(dot(vNormal, lightDir), 0.0);

        // Specular highlight catching silk twill ridges
        vec3 viewDir = normalize(-vPosition);
        vec3 halfDir = normalize(lightDir + viewDir);
        float spec = pow(max(dot(vNormal, halfDir), 0.0), 18.0) * 0.85;

        // Color transition: Obsidian base warming into liquid gold and amber ochre
        vec3 baseColor = vec3(0.08, 0.08, 0.10);
        vec3 goldColor = mix(vec3(0.77, 0.66, 0.50), vec3(0.85, 0.58, 0.32), uScroll);
        vec3 silkColor = mix(baseColor, goldColor, 0.65 + vUv.x * 0.35);

        vec3 finalColor = (silkColor * (diff * 0.8 + 0.25)) + (spec * vec3(0.98, 0.95, 0.88));

        // Soft edge transparency
        float edgeAlpha = smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.85, vUv.y);

        gl_FragColor = vec4(finalColor, edgeAlpha * 0.85);
      }
    `;

    // High-density plane geometry for fluid cloth ripples
    const ribbonGeo = new THREE.PlaneGeometry(6.5, 1.8, 64, 32);
    const ribbonMat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uScroll: { value: 0 },
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const ribbonMesh = new THREE.Mesh(ribbonGeo, ribbonMat);
    ribbonMesh.rotation.z = -0.06;
    scene.add(ribbonMesh);

    // Resize handler
    let resizeTimer: NodeJS.Timeout;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!container) return;
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || 450;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }, 50);
    };
    window.addEventListener("resize", onResize, { passive: true });

    // Render loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      currentScrollLerp.current += (scrollRef.current - currentScrollLerp.current) * 0.08;

      ribbonMat.uniforms.uTime.value = elapsedTime;
      ribbonMat.uniforms.uScroll.value = currentScrollLerp.current;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", onResize);
      clearTimeout(resizeTimer);

      ribbonGeo.dispose();
      ribbonMat.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-10 will-change-transform transform-gpu"
      aria-hidden="true"
    />
  );
}
