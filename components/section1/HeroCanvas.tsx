"use client";

import { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";

interface HeroCanvasProps {
  scrollProgress: number; // 0 to 1 through section 1
}

export default function HeroCanvas({ scrollProgress }: HeroCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Store scrollProgress in a ref so scroll updates NEVER re-instantiate WebGL
  const scrollProgressRef = useRef(0);
  const currentScrollLerp = useRef(0);

  // Synchronize scrollProgress ref without triggering scene re-creation
  useEffect(() => {
    scrollProgressRef.current = scrollProgress;
  }, [scrollProgress]);

  const uniformsRef = useRef<{
    uTexture: { value: THREE.Texture | null };
    uTime: { value: number };
    uShockwaveTime: { value: number };
  }>({
    uTexture: { value: null },
    uTime: { value: 0 },
    uShockwaveTime: { value: -10 },
  });

  const pointerRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const lastVideoTime = useRef(-1);

  const triggerShockwave = useCallback(() => {
    uniformsRef.current.uShockwaveTime.value = uniformsRef.current.uTime.value;
    if (videoRef.current && videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  // Main WebGL Scene: Initialized strictly ONCE on mount
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Three.js Scene Setup
    const scene = new THREE.Scene();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, -0.05, 4.2);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
      precision: "mediump", // High-performance mobile GPU friendly
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // Initial fallback texture (ensures ZERO black frames)
    const textureLoader = new THREE.TextureLoader();
    const fallbackTexture: THREE.Texture | null = textureLoader.load(
      "/assets/s1_video_frame.jpg",
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        if (!uniformsRef.current.uTexture.value) {
          uniformsRef.current.uTexture.value = tex;
        }
      }
    );

    // GLSL Green-Difference Chroma Key Shader (Primatte/Ultimatte formula)
    const vertexShader = `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      uniform float uTime;
      uniform float uShockwaveTime;

      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;

        vec3 pos = position;

        // Shockwave ripple on tap
        float waveProgress = uTime - uShockwaveTime;
        if (waveProgress > 0.0 && waveProgress < 1.5) {
          float dist = length(vUv - vec2(0.5, 0.5));
          float wave = sin((dist - waveProgress * 0.9) * 20.0) * exp(-waveProgress * 3.5) * 0.05;
          pos.z += wave;
        }

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

        // Green-dominance difference keying
        float maxRB = max(texColor.r, texColor.b);
        float k = texColor.g - maxRB;

        // Smooth matte transition: k > 0.04 indicates green screen
        float alpha = 1.0 - smoothstep(0.03, 0.14, k);

        // Watermark suppressor for bottom right corner (x > 0.74, y < 0.12)
        if (vUv.x > 0.74 && vUv.y < 0.12) {
          float cornerMask = smoothstep(0.74, 0.70, vUv.x) + smoothstep(0.04, 0.12, vUv.y);
          alpha *= clamp(cornerMask, 0.0, 1.0);
        }

        // Surgical discard of all keyed background pixels
        if (alpha < 0.01) {
          discard;
        }

        // Spill suppression: eliminate green bounce on wool edges
        if (texColor.g > maxRB) {
          texColor.g = mix(texColor.g, maxRB, 0.85);
        }

        // Subtle, elegant rim lighting along the coat silhouette
        float rim = 1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0);
        rim = pow(rim, 3.2) * 0.35;
        vec3 rimColor = vec3(0.96, 0.93, 0.88);

        vec3 finalColor = texColor.rgb + (rim * rimColor * alpha);

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

    // 9:16 portrait geometry matching video aspect ratio
    const garmentGeo = new THREE.PlaneGeometry(1.9, 3.38, 16, 16);
    const garmentMesh = new THREE.Mesh(garmentGeo, garmentMaterial);
    garmentMesh.position.set(0, -0.05, 0);
    scene.add(garmentMesh);

    // ==========================================
    // Circular Plinth & Warm Floor Glow
    // ==========================================
    const plinthGroup = new THREE.Group();
    plinthGroup.position.set(0, -1.85, 0);

    const plinthGeo = new THREE.CylinderGeometry(1.6, 1.7, 0.08, 48);
    const plinthMat = new THREE.MeshStandardMaterial({
      color: 0x0f1013,
      roughness: 0.25,
      metalness: 0.9,
    });
    const plinthMesh = new THREE.Mesh(plinthGeo, plinthMat);
    plinthGroup.add(plinthMesh);

    const ringGeo = new THREE.TorusGeometry(1.58, 0.012, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xc5a880,
      transparent: true,
      opacity: 0.75,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = 0.05;
    plinthGroup.add(ringMesh);

    const shadowGeo = new THREE.CircleGeometry(1.55, 32);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x050506,
      transparent: true,
      opacity: 0.6,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.055;
    plinthGroup.add(shadowMesh);

    scene.add(plinthGroup);

    // ==========================================
    // Subtle Studio Dust Motes & Golden Micro-Fibers
    // ==========================================
    const particleCount = 50;
    const moteGeo = new THREE.SphereGeometry(0.007, 6, 6);
    const moteMat = new THREE.MeshBasicMaterial({
      color: 0xc5a880,
      transparent: true,
      opacity: 0.35,
    });
    const instancedMotes = new THREE.InstancedMesh(moteGeo, moteMat, particleCount);

    const motesData: {
      angle: number;
      speed: number;
      radius: number;
      y: number;
      yBase: number;
    }[] = [];

    const dummy = new THREE.Object3D();

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.2 + Math.random() * 0.4;
      const radius = 0.8 + Math.random() * 1.2;
      const y = -1.5 + Math.random() * 2.2;

      motesData.push({
        angle,
        speed,
        radius,
        y,
        yBase: y,
      });

      dummy.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
      dummy.scale.setScalar(0.6 + Math.random() * 0.8);
      dummy.updateMatrix();
      instancedMotes.setMatrixAt(i, dummy.matrix);
    }
    instancedMotes.instanceMatrix.needsUpdate = true;
    scene.add(instancedMotes);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const rimLight = new THREE.DirectionalLight(0xf4f4f6, 2.2);
    rimLight.position.set(0, 4, 3);
    scene.add(rimLight);

    const warmUnderLight = new THREE.PointLight(0xc5a880, 2.5, 4.5);
    warmUnderLight.position.set(0, -1.3, 0.8);
    scene.add(warmUnderLight);

    // Video Texture Binding (Created strictly ONCE)
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
          uniformsRef.current.uTexture.value = videoTexture;
        })
        .catch(() => {
          // Autoplay fallback
        });
    }

    // Pointer Inertia
    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      let clientX = 0;
      let clientY = 0;
      if ("touches" in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ("clientX" in e) {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      pointerRef.current.targetX = (clientX / window.innerWidth - 0.5) * 2;
      pointerRef.current.targetY = -(clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener("mousemove", onPointerMove, { passive: true });
    window.addEventListener("touchmove", onPointerMove, { passive: true });

    let resizeTimeout: NodeJS.Timeout;
    const onResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (!container) return;
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }, 50);
    };
    window.addEventListener("resize", onResize, { passive: true });

    // Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      uniformsRef.current.uTime.value = elapsedTime;

      // Smart video texture update: only upload when video frame actually advances
      if (vid && videoTexture && vid.readyState >= 2) {
        if (vid.currentTime !== lastVideoTime.current) {
          lastVideoTime.current = vid.currentTime;
          videoTexture.needsUpdate = true;
        }
      }

      // Smooth pointer rotation inertia (±12 degrees)
      pointerRef.current.x += (pointerRef.current.targetX - pointerRef.current.x) * 0.05;
      pointerRef.current.y += (pointerRef.current.targetY - pointerRef.current.y) * 0.05;

      // Smooth lerp of scroll progress (interpolated at 60fps without React re-renders)
      currentScrollLerp.current += (scrollProgressRef.current - currentScrollLerp.current) * 0.08;
      const snapProgress = Math.min(currentScrollLerp.current * 2.2, 1.0);

      const coatScale = 1.0 + snapProgress * 0.18;
      garmentMesh.scale.set(coatScale, coatScale, 1.0);

      // Subtle breathing float & camera parallax
      garmentMesh.rotation.y = pointerRef.current.x * 0.18;
      garmentMesh.rotation.x = -pointerRef.current.y * 0.10;
      garmentMesh.position.y = -0.05 + Math.sin(elapsedTime * 1.4) * 0.02 + snapProgress * 0.06;

      // Plinth sweep on scroll
      plinthGroup.position.y = -2.5 + snapProgress * 0.85;
      ringMesh.rotation.z += 0.004;

      // Animate delicate motes in gentle orbit
      for (let i = 0; i < particleCount; i++) {
        const m = motesData[i];
        m.angle += 0.008 * m.speed;
        const currentY = m.yBase + Math.sin(elapsedTime * 1.5 + m.angle) * 0.15;

        dummy.position.set(
          Math.cos(m.angle) * m.radius,
          currentY,
          Math.sin(m.angle) * m.radius
        );
        dummy.updateMatrix();
        instancedMotes.setMatrixAt(i, dummy.matrix);
      }
      instancedMotes.instanceMatrix.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("resize", onResize);
      clearTimeout(resizeTimeout);

      garmentGeo.dispose();
      garmentMaterial.dispose();
      if (fallbackTexture) fallbackTexture.dispose();
      if (videoTexture) videoTexture.dispose();
      plinthGeo.dispose();
      plinthMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      moteGeo.dispose();
      moteMat.dispose();
      instancedMotes.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []); // Run ONCE on mount — NEVER destroy or recreate WebGL on scroll!

  return (
    <div
      ref={mountRef}
      onClick={triggerShockwave}
      className="absolute inset-0 w-full h-full overflow-hidden cursor-grab active:cursor-grabbing z-10 will-change-transform transform-gpu"
      aria-label="Interactive 3D Runway Garment View"
    >
      <video
        ref={videoRef}
        src="/assets/S1_hero_trench_billow_green.mp4"
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
