import * as THREE from 'three';

/**
 * Real Earth imagery, pre-processed into public/textures/earth/:
 *  - day:       NASA Blue Marble "land and oceans" (public domain)
 *  - night:     NASA Black Marble 2016 city lights (public domain)
 *  - bump:      NASA SRTM/GTOPO elevation ramp (public domain)
 *  - roughness: ocean mask derived from the day map (glossy seas, matte land)
 *  - clouds:    cloud alpha extracted from NASA Blue Marble cloud composite (public domain)
 */
const BASE = '/textures/earth';

export interface EarthTextures {
  day: THREE.Texture;
  night: THREE.Texture;
  bump: THREE.Texture;
  roughness: THREE.Texture;
  clouds: THREE.Texture;
  /** Resolves when the day map is ready (rejects if it fails to load). */
  ready: Promise<void>;
  dispose: () => void;
}

export function loadEarthTextures(maxAnisotropy: number, highRes: boolean): EarthTextures {
  const loader = new THREE.TextureLoader();
  let resolveReady!: () => void;
  let rejectReady!: (e: unknown) => void;
  const ready = new Promise<void>((res, rej) => {
    resolveReady = res;
    rejectReady = rej;
  });

  const load = (file: string, srgb: boolean, onLoad?: () => void, onError?: (e: unknown) => void) => {
    const t = loader.load(`${BASE}/${file}`, onLoad, undefined, onError);
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.anisotropy = maxAnisotropy;
    t.wrapS = THREE.RepeatWrapping;
    return t;
  };

  const day = load(highRes ? 'earth_day_4k.jpg' : 'earth_day_2k.jpg', true, () => resolveReady(), rejectReady);
  const night = load('earth_night_2k.jpg', true);
  const bump = load('earth_bump_2k.jpg', false);
  const roughness = load('earth_roughness_2k.jpg', false);
  const clouds = load('earth_clouds_2k.jpg', false);

  return {
    day,
    night,
    bump,
    roughness,
    clouds,
    ready,
    dispose: () => [day, night, bump, roughness, clouds].forEach((t) => t.dispose()),
  };
}

/**
 * Patches a MeshStandardMaterial so its emissive map (city lights) only shows
 * on the night side of the planet, fading in across the terminator.
 */
export function applyNightSideEmissive(material: THREE.MeshStandardMaterial, sunDirWorld: THREE.Vector3) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uSunDir = { value: sunDirWorld };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vEarthWorldNormal;')
      .replace(
        '#include <beginnormal_vertex>',
        '#include <beginnormal_vertex>\nvEarthWorldNormal = normalize(mat3(modelMatrix) * objectNormal);'
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uSunDir;\nvarying vec3 vEarthWorldNormal;')
      .replace(
        '#include <emissivemap_fragment>',
        `#ifdef USE_EMISSIVEMAP
          vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
          float nightMask = smoothstep( 0.08, -0.32, dot( normalize( vEarthWorldNormal ), uSunDir ) );
          totalEmissiveRadiance *= emissiveColor.rgb * nightMask;
        #endif`
      );
  };
  material.customProgramCacheKey = () => 'earth-night-emissive';
}
