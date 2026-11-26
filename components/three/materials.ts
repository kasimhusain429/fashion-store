import * as THREE from "three";

export const PLASTER = new THREE.Color("#d8d5ce");
// Exact sRGB plaster match for post-tonemap dithering fade (avoids dark linear-to-sRGB mismatch!)
const PLASTER_SRGB = new THREE.Vector3(216 / 255, 213 / 255, 206 / 255);

export interface FadeUniforms {
  uFade: { value: number };
  uFadeColor: { value: THREE.Vector3 };
}

export function makeFadeUniforms(): FadeUniforms {
  return { uFade: { value: 0 }, uFadeColor: { value: PLASTER_SRGB.clone() } };
}

/**
 * Patches a standard/physical material so that:
 *  - a tangent-space normal map (fine jersey knit) and bump map (stitching, ribs, seams) stack cleanly;
 *  - high-frequency knit normals smoothly attenuate with screen-space derivative `fwidth` so distant rail
 *    views never Moire-alias into stripes while close-ups retain crisp spun-cotton loops;
 *  - the final sRGB colour can dissolve seamlessly into the plaster backdrop (rail focus effect).
 */
export function patchMaterial(mat: THREE.MeshStandardMaterial, fade: FadeUniforms, stackBump: boolean) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uFade = fade.uFade;
    shader.uniforms.uFadeColor = fade.uFadeColor;
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform float uFade;\nuniform vec3 uFadeColor;")
      .replace(
        "#include <dithering_fragment>",
        "#include <dithering_fragment>\ngl_FragColor.rgb = mix(gl_FragColor.rgb, uFadeColor, uFade);",
      );
    if (stackBump) {
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <normal_fragment_maps>",
        `
#ifdef USE_NORMALMAP_TANGENTSPACE
  vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
  // Attenuate fine knit loops above Nyquist density so distant views/swatches never Moire-alias
  float uvRate = length( fwidth( vNormalMapUv ) );
  float knitAtten = 1.0 - smoothstep( 0.007, 0.028, uvRate );
  mapN.xy *= normalScale * max( knitAtten, 0.0 );
  normal = normalize( tbn * mapN );
#endif
#ifdef USE_BUMPMAP
  normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif
`,
      );
    }
  };
  mat.customProgramCacheKey = () => (stackBump ? "vaelis-jersey-v2" : "vaelis-fade-v2");
  mat.needsUpdate = true;
}

export interface JerseyTextures {
  knit: THREE.Texture;
  weave: THREE.Texture;
  detail: THREE.Texture;
  ink: THREE.Texture | null;
}

export function prepareJerseyTextures(t: JerseyTextures) {
  t.knit.wrapS = t.knit.wrapT = THREE.RepeatWrapping;
  t.knit.repeat.set(44, 22);
  t.knit.colorSpace = THREE.NoColorSpace;
  t.knit.anisotropy = 8;
  t.knit.flipY = false;

  t.weave.wrapS = t.weave.wrapT = THREE.RepeatWrapping;
  t.weave.repeat.set(36, 18);
  t.weave.colorSpace = THREE.NoColorSpace;
  t.weave.anisotropy = 4;
  t.weave.flipY = false;

  t.detail.colorSpace = THREE.NoColorSpace;
  t.detail.anisotropy = 8;
  t.detail.flipY = false;

  if (t.ink) {
    t.ink.colorSpace = THREE.SRGBColorSpace;
    t.ink.anisotropy = 8;
    t.ink.flipY = false;
  }
}

export function computeJerseySheen(color: THREE.Color, target = new THREE.Color()) {
  // Subtle natural cotton micro-fiber rim tint — preserves rich dark blacks instead of washing out to grey plastic
  return target.copy(color).lerp(new THREE.Color("#ece8de"), 0.14);
}

export function makeJerseyMaterial(t: JerseyTextures, hex: string, fade: FadeUniforms) {
  const color = new THREE.Color(hex);
  const mat = new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.94,
    roughnessMap: t.weave,
    metalness: 0,
    ior: 1.36,
    specularIntensity: 0.14,
    sheen: 0.42,
    sheenRoughness: 0.88,
    sheenColor: computeJerseySheen(color),
    normalMap: t.knit,
    normalScale: new THREE.Vector2(0.32, 0.32),
    bumpMap: t.detail,
    bumpScale: 0.042,
    map: t.ink ?? null,
    side: THREE.DoubleSide,
  });
  patchMaterial(mat, fade, true);
  return mat;
}

export function setJerseyColor(mat: THREE.MeshPhysicalMaterial, hex: string) {
  mat.color.set(hex);
  computeJerseySheen(mat.color, mat.sheenColor);
}
