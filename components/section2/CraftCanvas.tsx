"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface CraftCanvasProps {
  scrollProgress: number; // 0 to 1 through section 2
  assembledColorway?: "obsidian" | "alabaster";
}

export default function CraftCanvas({
  scrollProgress,
  assembledColorway = "alabaster",
}: CraftCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const explodedVideoRef = useRef<HTMLVideoElement | null>(null);
  const assembledVideoBlackRef = useRef<HTMLVideoElement | null>(null);
  const assembledVideoWhiteRef = useRef<HTMLVideoElement | null>(null);

  const scrollRef = useRef(0);
  const currentScrollLerp = useRef(0);
  const lastExplodedTime = useRef(-1);
  const lastWhiteTime = useRef(-1);
  const lastBlackTime = useRef(-1);
  const colorwayRef = useRef<"obsidian" | "alabaster">(assembledColorway);

  // Synchronize refs without re-mounting Three.js scene
  useEffect(() => {
    scrollRef.current = scrollProgress;
  }, [scrollProgress]);

  useEffect(() => {
    colorwayRef.current = assembledColorway;
    const isWhite = assembledColorway === "alabaster";
    const vid = isWhite ? assembledVideoWhiteRef.current : assembledVideoBlackRef.current;
    if (vid && vid.paused) {
      vid.play().catch(() => {});
    }
  }, [assembledColorway]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Three.js Scene Setup (Mounts ONCE)
    const scene = new THREE.Scene();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
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

    // Fallback Texture Loader
    const textureLoader = new THREE.TextureLoader();
    const fallbackExplodedTexture = textureLoader.load(
      "/assets/s2_video_frame.jpg",
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        if (!explodedMat.uniforms.uTexture.value) {
          explodedMat.uniforms.uTexture.value = tex;
        }
      }
    );

    const fallbackAlabasterTexture = textureLoader.load(
      "/assets/s3_colorway_alabaster_studio.jpg",
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        if (colorwayRef.current === "alabaster" && !assembledMat.uniforms.uTexture.value) {
          assembledMat.uniforms.uTexture.value = tex;
        }
      }
    );

    const fallbackBlackTexture = textureLoader.load(
      "/assets/s1_look01_monolith_studio.jpg",
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        if (colorwayRef.current === "obsidian" && !assembledMat.uniforms.uTexture.value) {
          assembledMat.uniforms.uTexture.value = tex;
        }
      }
    );

    // GLSL Green-Difference Keying Shader with Strict Edge Vignette & Rim Boost
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
        pos.y += sin(uTime * 1.6 + pos.x * 2.0) * 0.02;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `;

    const fragmentShader = `
      uniform sampler2D uTexture;
      uniform float uOpacity;
      uniform bool uSuppressStand;
      uniform float uRimBoost;
      varying vec2 vUv;
      varying vec3 vNormal;

      void main() {
        vec4 texColor = texture2D(uTexture, vUv);

        // Primatte green difference key
        float maxRB = max(texColor.r, texColor.b);
        float k = texColor.g - maxRB;

        // Smooth matte transition
        float alpha = 1.0 - smoothstep(0.02, 0.12, k);

        // Strict Edge Vignette: Guarantees zero rectangular bounding box
        float edgeDistX = abs(vUv.x - 0.5) * 2.0;
        float edgeDistY = abs(vUv.y - 0.5) * 2.0;
        float boxMaskX = smoothstep(0.98, 0.88, edgeDistX);
        float boxMaskY = smoothstep(0.98, 0.88, edgeDistY);
        alpha *= (boxMaskX * boxMaskY);

        // Suppress bottom tripod / stand if enabled (e.g. for white coat or exploded video)
        if (uSuppressStand && vUv.y < 0.22) {
          alpha *= smoothstep(0.16, 0.23, vUv.y);
        }

        // Suppress bottom right AI watermark
        if (vUv.x > 0.74 && vUv.y < 0.12) {
          alpha *= clamp(smoothstep(0.74, 0.70, vUv.x) + smoothstep(0.04, 0.12, vUv.y), 0.0, 1.0);
        }

        // Strict discard threshold: Eliminates any faint grey boxes
        if (alpha < 0.04) {
          discard;
        }

        // Spill suppression: Clean neutral wool edges
        if (texColor.g > maxRB) {
          texColor.g = mix(texColor.g, maxRB, 0.85);
        }

        // Platinum/Amber contour rim lighting boost
        float rim = 1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0);
        rim = pow(rim, 2.4) * uRimBoost;
        vec3 rimColor = mix(vec3(0.96, 0.94, 0.90), vec3(0.77, 0.66, 0.50), 0.45);

        vec3 finalColor = texColor.rgb + (rim * rimColor * alpha);
        // Subtle ambient lift on dark wool
        finalColor += vec3(0.03, 0.025, 0.02) * alpha;

        gl_FragColor = vec4(finalColor, alpha * uOpacity);
      }
    `;

    // Assembled Coat Mesh (Beat 1 on left)
    const assembledMat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTexture: { value: fallbackAlabasterTexture },
        uTime: { value: 0 },
        uOpacity: { value: 1.0 },
        uSuppressStand: { value: true },
        uRimBoost: { value: 0.65 },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const assembledGeo = new THREE.PlaneGeometry(1.65, 2.95, 16, 16);
    const assembledMesh = new THREE.Mesh(assembledGeo, assembledMat);
    assembledMesh.position.set(-1.15, 0.05, 0);
    scene.add(assembledMesh);

    // Setup Video Textures for Assembled Rotating Coat (Beat 1)
    let assembledTexBlack: THREE.VideoTexture | null = null;
    let assembledTexWhite: THREE.VideoTexture | null = null;

    const vidBlack = assembledVideoBlackRef.current;
    if (vidBlack) {
      assembledTexBlack = new THREE.VideoTexture(vidBlack);
      assembledTexBlack.colorSpace = THREE.SRGBColorSpace;
      assembledTexBlack.minFilter = THREE.LinearFilter;
      assembledTexBlack.generateMipmaps = false;
      vidBlack.play().catch(() => {});
    }

    const vidWhite = assembledVideoWhiteRef.current;
    if (vidWhite) {
      assembledTexWhite = new THREE.VideoTexture(vidWhite);
      assembledTexWhite.colorSpace = THREE.SRGBColorSpace;
      assembledTexWhite.minFilter = THREE.LinearFilter;
      assembledTexWhite.generateMipmaps = false;
      vidWhite.play().catch(() => {});

      // Alabaster is first by default
      if (colorwayRef.current === "alabaster") {
        assembledMat.uniforms.uTexture.value = assembledTexWhite;
        assembledMat.uniforms.uSuppressStand.value = true;
      }
    }

    // Circular Ambient Plinth under Assembled Coat (Beat 1)
    const plinthGroup = new THREE.Group();
    plinthGroup.position.set(-1.15, -1.45, 0);

    const shadowGeo = new THREE.CircleGeometry(0.85, 32);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x060608,
      transparent: true,
      opacity: 0.7,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    plinthGroup.add(shadowMesh);

    const ringGeo = new THREE.TorusGeometry(0.82, 0.008, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xc5a880,
      transparent: true,
      opacity: 0.5,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    plinthGroup.add(ringMesh);
    scene.add(plinthGroup);

    // Exploded Anatomy Mesh (Beat 3 in center)
    const explodedMat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTexture: { value: null },
        uTime: { value: 0 },
        uOpacity: { value: 0.0 },
        uSuppressStand: { value: true },
        uRimBoost: { value: 0.75 },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const explodedGeo = new THREE.PlaneGeometry(2.0, 3.55, 16, 16);
    const explodedMesh = new THREE.Mesh(explodedGeo, explodedMat);
    explodedMesh.position.set(0, 0.05, 0);
    scene.add(explodedMesh);

    // Video Texture for Exploded Anatomy Clip (Beat 3)
    let explodedVideoTexture: THREE.VideoTexture | null = null;
    const vidExploded = explodedVideoRef.current;
    if (vidExploded) {
      explodedVideoTexture = new THREE.VideoTexture(vidExploded);
      explodedVideoTexture.colorSpace = THREE.SRGBColorSpace;
      explodedVideoTexture.minFilter = THREE.LinearFilter;
      explodedVideoTexture.generateMipmaps = false;
      explodedMat.uniforms.uTexture.value = explodedVideoTexture;
      vidExploded.play().catch(() => {});
    }

    // Drifting Basting Thread Filaments (Beat 3)
    const threadCount = 35;
    const threadGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.16, 6);
    const threadMat = new THREE.MeshBasicMaterial({
      color: 0xc5a880,
      transparent: true,
      opacity: 0.4,
    });
    const instancedThreads = new THREE.InstancedMesh(threadGeo, threadMat, threadCount);

    const threadsData: { angle: number; speed: number; radius: number; y: number; yBase: number; rotX: number; rotY: number }[] = [];
    const dummy = new THREE.Object3D();

    for (let i = 0; i < threadCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.2 + Math.random() * 0.4;
      const radius = 0.6 + Math.random() * 1.2;
      const y = (Math.random() - 0.5) * 2.8;

      threadsData.push({
        angle,
        speed,
        radius,
        y,
        yBase: y,
        rotX: (Math.random() - 0.5) * 0.02,
        rotY: (Math.random() - 0.5) * 0.03,
      });

      dummy.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      dummy.updateMatrix();
      instancedThreads.setMatrixAt(i, dummy.matrix);
    }
    instancedThreads.instanceMatrix.needsUpdate = true;
    scene.add(instancedThreads);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    const rimLight = new THREE.DirectionalLight(0xf4f4f6, 2.5);
    rimLight.position.set(0, 4, 3);
    scene.add(rimLight);

    const warmKey = new THREE.PointLight(0xc5a880, 2.8, 5.5);
    warmKey.position.set(-1.15, 0, 1.2);
    scene.add(warmKey);

    // Resize handler
    let resizeTimer: NodeJS.Timeout;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!container) return;
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }, 50);
    };
    window.addEventListener("resize", onResize, { passive: true });

    // Animation loop (RAF)
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Determine active colorway texture in Beat 1
      const isWhite = colorwayRef.current === "alabaster";
      const activeAssembledVid = isWhite ? vidWhite : vidBlack;
      const activeAssembledTex = isWhite ? assembledTexWhite : assembledTexBlack;
      const fallbackTex = isWhite ? fallbackAlabasterTexture : fallbackBlackTexture;

      // Switch active texture if colorway changed
      const targetTex = activeAssembledTex || fallbackTex;
      if (targetTex && assembledMat.uniforms.uTexture.value !== targetTex) {
        assembledMat.uniforms.uTexture.value = targetTex;
        assembledMat.uniforms.uSuppressStand.value = isWhite;
      }

      // Update active video GPU texture when frame advances
      if (activeAssembledVid && activeAssembledTex && activeAssembledVid.readyState >= 2) {
        const lastTime = isWhite ? lastWhiteTime : lastBlackTime;
        if (activeAssembledVid.currentTime !== lastTime.current) {
          lastTime.current = activeAssembledVid.currentTime;
          activeAssembledTex.needsUpdate = true;
        }
      }

      // Smooth scroll progress interpolation
      currentScrollLerp.current += (scrollRef.current - currentScrollLerp.current) * 0.08;
      const p = currentScrollLerp.current;

      assembledMat.uniforms.uTime.value = elapsedTime;
      explodedMat.uniforms.uTime.value = elapsedTime;

      // Ensure exploded video is playing once approaching Beat 3
      if (p > 0.35 && vidExploded && vidExploded.paused) {
        vidExploded.play().catch(() => {});
      }

      // Update Exploded Video Texture in Beat 3 with fallback safeguard
      if (vidExploded && explodedVideoTexture && vidExploded.readyState >= 2) {
        if (explodedMat.uniforms.uTexture.value !== explodedVideoTexture) {
          explodedMat.uniforms.uTexture.value = explodedVideoTexture;
        }
        if (vidExploded.currentTime !== lastExplodedTime.current) {
          lastExplodedTime.current = vidExploded.currentTime;
          explodedVideoTexture.needsUpdate = true;
        }
      } else if (fallbackExplodedTexture && (!explodedMat.uniforms.uTexture.value || (vidExploded && vidExploded.readyState < 2))) {
        explodedMat.uniforms.uTexture.value = fallbackExplodedTexture;
      }

      // ====================================================
      // BEAT TRANSITIONS (Harmonized with SectionCraft):
      // ====================================================
      if (p < 0.32) {
        // Beat 1: Assembled rotating coat on left with plinth
        const beat1Fade = 1.0 - Math.max(0, (p - 0.20) / 0.12);
        assembledMat.uniforms.uOpacity.value = beat1Fade;
        assembledMesh.position.x = -1.15 + p * 0.35;
        assembledMesh.position.y = 0.05 + Math.sin(elapsedTime * 1.2) * 0.02;

        plinthGroup.position.x = assembledMesh.position.x;
        plinthGroup.position.y = -1.45 + Math.sin(elapsedTime * 1.2) * 0.01;
        ringMesh.rotation.z += 0.003;
        plinthGroup.visible = beat1Fade > 0.05;

        explodedMat.uniforms.uOpacity.value = 0.0;
        instancedThreads.visible = false;
      } else if (p >= 0.32 && p < 0.50) {
        // Beat 2: Macro Lens Weave focus
        assembledMat.uniforms.uOpacity.value = 0.0;
        plinthGroup.visible = false;
        explodedMat.uniforms.uOpacity.value = 0.0;
        instancedThreads.visible = false;
      } else {
        // Beat 3: Exploded Anatomy Full Stage
        assembledMat.uniforms.uOpacity.value = 0.0;
        plinthGroup.visible = false;

        const fadeIn = Math.min(1.0, (p - 0.50) / 0.12);
        const exitFade = p > 0.92 ? Math.max(0, 1.0 - (p - 0.92) / 0.08) : 1.0;
        explodedMat.uniforms.uOpacity.value = fadeIn * exitFade;

        const explodeProgress = Math.min((p - 0.50) / 0.16, 1.0);
        const scale = 0.95 + explodeProgress * 0.12;
        explodedMesh.scale.set(scale, scale, 1.0);
        explodedMesh.position.y = 0.05 + Math.sin(elapsedTime * 1.2) * 0.02;

        instancedThreads.visible = explodedMat.uniforms.uOpacity.value > 0.05;
      }

      if (instancedThreads.visible) {
        for (let i = 0; i < threadCount; i++) {
          const t = threadsData[i];
          t.angle += 0.01 * t.speed;
          const currentY = t.yBase + Math.sin(elapsedTime * 1.5 + t.angle) * 0.15;

          dummy.position.set(
            Math.cos(t.angle) * t.radius,
            currentY,
            Math.sin(t.angle) * t.radius
          );
          dummy.rotation.x += t.rotX;
          dummy.rotation.y += t.rotY;
          dummy.updateMatrix();
          instancedThreads.setMatrixAt(i, dummy.matrix);
        }
        instancedThreads.instanceMatrix.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", onResize);
      clearTimeout(resizeTimer);

      assembledGeo.dispose();
      assembledMat.dispose();
      fallbackAlabasterTexture.dispose();
      fallbackBlackTexture.dispose();
      if (assembledTexBlack) assembledTexBlack.dispose();
      if (assembledTexWhite) assembledTexWhite.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      explodedGeo.dispose();
      explodedMat.dispose();
      if (fallbackExplodedTexture) fallbackExplodedTexture.dispose();
      if (explodedVideoTexture) explodedVideoTexture.dispose();
      threadGeo.dispose();
      threadMat.dispose();
      instancedThreads.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-10 will-change-transform transform-gpu"
      aria-hidden="true"
    >
      {/* Beat 1 Rotating White Wool Trench Video (Alabaster) */}
      <video
        ref={assembledVideoWhiteRef}
        src="/assets/S2_trench_rotating_white.mp4"
        crossOrigin="anonymous"
        playsInline
        muted
        loop
        autoPlay
        preload="auto"
        className="hidden"
      />

      {/* Beat 1 Rotating Black Trench Video (Obsidian) */}
      <video
        ref={assembledVideoBlackRef}
        src="/assets/S2_trench_rotating_black.mp4"
        crossOrigin="anonymous"
        playsInline
        muted
        loop
        autoPlay
        preload="auto"
        className="hidden"
      />

      {/* Beat 3 Exploded Anatomy Video */}
      <video
        ref={explodedVideoRef}
        src="/assets/S2_garment_exploded_green.mp4"
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
