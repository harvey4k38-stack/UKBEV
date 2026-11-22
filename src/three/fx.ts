import * as THREE from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import {
  BloomEffect,
  DepthOfFieldEffect,
  EffectComposer,
  EffectPass,
  RenderPass,
  ToneMappingEffect,
  ToneMappingMode,
  VignetteEffect,
} from 'postprocessing';
import type { BottleVisualStyle } from '../types';


// Debug switches for before/after comparison: ?fx=0 disables post-processing, ?hdri=0 disables HDRIs.
const debugParams = new URLSearchParams(window.location.search);
const FX_ENABLED = debugParams.get('fx') !== '0';
const HDRI_ENABLED = debugParams.get('hdri') !== '0';

/* ------------------------------------------------------------------ */
/* HDRI environment lighting (Poly Haven, CC0 — see public/hdri)      */
/* ------------------------------------------------------------------ */

export const HDRI = {
  studio: '/hdri/studio_small_09_1k.hdr',
  outdoorSky: '/hdri/kloofendal_48d_partly_cloudy_puresky_1k.hdr',
} as const;

/**
 * Loads an equirectangular .hdr and applies it as scene.environment once ready.
 * The scene keeps its existing (RoomEnvironment) env map until the HDRI arrives,
 * so nothing pops to black while loading. Returns a disposer.
 */
export function applyHdriEnvironment(
  scene: THREE.Scene,
  pmrem: THREE.PMREMGenerator,
  url: string,
  opts: { intensity?: number; rotationY?: number } = {}
): () => void {
  if (!HDRI_ENABLED) return () => {};
  let disposed = false;
  let envMap: THREE.Texture | null = null;
  new HDRLoader().load(
    url,
    (hdr) => {
      if (disposed) {
        hdr.dispose();
        return;
      }
      envMap = pmrem.fromEquirectangular(hdr).texture;
      hdr.dispose();
      scene.environment = envMap;
      scene.environmentIntensity = opts.intensity ?? 1;
      if (opts.rotationY) scene.environmentRotation.set(0, opts.rotationY, 0);
    },
    undefined,
    () => {
      /* keep the procedural RoomEnvironment fallback */
    }
  );
  return () => {
    disposed = true;
    envMap?.dispose();
  };
}

/* ------------------------------------------------------------------ */
/* Device tier + render gating                                          */
/* ------------------------------------------------------------------ */

/** Phones, tablets and low-core/low-memory machines get a lighter pipeline. */
export function isLowPowerDevice(): boolean {
  const nav = navigator as Navigator & { deviceMemory?: number };
  return (
    window.matchMedia('(pointer: coarse)').matches ||
    window.innerWidth < 768 ||
    (nav.hardwareConcurrency || 8) <= 4 ||
    (nav.deviceMemory || 8) <= 4
  );
}

/**
 * Tracks whether a canvas is worth rendering: on screen and in a visible tab.
 * Render loops check `gate.active` and skip drawing (and GPU work) otherwise.
 */
export function createRenderGate(el: HTMLElement) {
  const gate = { active: true, dispose: () => {} };
  let onScreen = true;
  const sync = () => {
    gate.active = onScreen && document.visibilityState === 'visible';
  };
  const io = new IntersectionObserver(([e]) => {
    onScreen = e.isIntersecting;
    sync();
  });
  io.observe(el);
  document.addEventListener('visibilitychange', sync);
  gate.dispose = () => {
    io.disconnect();
    document.removeEventListener('visibilitychange', sync);
  };
  return gate;
}

/* ------------------------------------------------------------------ */
/* Post-processing: bloom, depth of field, filmic tone mapping, vignette */
/* ------------------------------------------------------------------ */

export interface PostFXOptions {
  bloom?: { intensity: number; threshold: number; smoothing?: number; radius?: number };
  vignette?: { darkness: number; offset?: number };
  /** Focus world-space point; enables a subtle depth-of-field. */
  dofTarget?: THREE.Vector3;
  dofBokehScale?: number;
  toneMapping?: ToneMappingMode;
}

export interface PostFX {
  /** False when falling back to plain rendering (software GL, WebGL1, ?fx=0). */
  active: boolean;
  render: (dt: number) => void;
  setSize: (w: number, h: number) => void;
  dispose: () => void;
}

/**
 * Wraps rendering in a postprocessing EffectComposer. On software GL or when
 * the browser can't do WebGL2, falls back to a plain renderer.render().
 */
export function createPostFX(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  isSoftwareGl: boolean,
  opts: PostFXOptions = {}
): PostFX {
  const plain: PostFX = {
    active: false,
    render: () => renderer.render(scene, camera),
    setSize: (w, h) => renderer.setSize(w, h),
    dispose: () => {},
  };
  if (!FX_ENABLED || isSoftwareGl || isLowPowerDevice() || !renderer.capabilities.isWebGL2) return plain;

  // Tone mapping is done once, at the end of the effect chain.
  renderer.toneMapping = THREE.NoToneMapping;

  const composer = new EffectComposer(renderer, {
    frameBufferType: THREE.HalfFloatType,
    multisampling: Math.min(4, renderer.capabilities.maxSamples),
  });
  composer.addPass(new RenderPass(scene, camera));

  const effects = [];
  if (opts.dofTarget) {
    const dof = new DepthOfFieldEffect(camera, {
      focusRange: 2.6,
      bokehScale: opts.dofBokehScale ?? 1.6,
    });
    dof.target = opts.dofTarget;
    effects.push(dof);
  }
  if (opts.bloom) {
    effects.push(
      new BloomEffect({
        mipmapBlur: true,
        intensity: opts.bloom.intensity,
        luminanceThreshold: opts.bloom.threshold,
        luminanceSmoothing: opts.bloom.smoothing ?? 0.2,
        radius: opts.bloom.radius ?? 0.7,
      })
    );
  }
  effects.push(new ToneMappingEffect({ mode: opts.toneMapping ?? ToneMappingMode.ACES_FILMIC }));
  if (opts.vignette) {
    effects.push(
      new VignetteEffect({ darkness: opts.vignette.darkness, offset: opts.vignette.offset ?? 0.32 })
    );
  }
  composer.addPass(new EffectPass(camera, ...effects));

  return {
    active: true,
    render: (dt) => composer.render(dt),
    setSize: (w, h) => {
      renderer.setSize(w, h);
      composer.setSize(w, h);
    },
    dispose: () => composer.dispose(),
  };
}

/* ------------------------------------------------------------------ */
/* Scroll-linked progress (GSAP ScrollTrigger, smoothed by Lenis)     */
/* ------------------------------------------------------------------ */

/**
 * Tracks 0→1 progress as `el` scrolls through the viewport. Read `progress.value`
 * inside the render loop. 'enter' = from entering the bottom of the viewport until it
 * leaves the top; 'leave' = from its top hitting the top of the viewport until it has
 * scrolled fully away. Passive listeners only, no animation library needed.
 */
export function trackScrollProgress(
  el: HTMLElement,
  mode: 'enter' | 'leave' = 'enter'
): { progress: { value: number }; dispose: () => void } {
  const progress = { value: 0 };
  const update = () => {
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = mode === 'enter' ? (vh - r.top) / (vh + r.height) : -r.top / Math.max(1, r.height);
    progress.value = Math.min(1, Math.max(0, p));
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  return {
    progress,
    dispose: () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    },
  };
}

/* ------------------------------------------------------------------ */
/* Real bottle models (.glb, optionally Draco-compressed)             */
/* ------------------------------------------------------------------ */

/**
 * Drop a .glb into public/models/ and register it here to replace the
 * procedural bottle for that style. Name nodes "cap", "label" and "water"
 * in Blender so the Anatomy View can still separate them. Model should be
 * ~3.5 units tall with its base at y = 0 (it is auto-scaled if not).
 */
export const BOTTLE_MODELS: Partial<Record<BottleVisualStyle, string>> = {
  // evian_glass: '/models/evian_glass.glb',
};

let gltfLoader: GLTFLoader | null = null;
function getGltfLoader() {
  if (!gltfLoader) {
    const draco = new DRACOLoader();
    draco.setDecoderPath('/draco/');
    gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(draco);
  }
  return gltfLoader;
}

export async function loadBottleModel(style: BottleVisualStyle): Promise<{
  root: THREE.Group;
  cap?: THREE.Object3D;
  label?: THREE.Object3D;
  water?: THREE.Object3D;
} | null> {
  const url = BOTTLE_MODELS[style];
  if (!url) return null;
  try {
    const gltf = await getGltfLoader().loadAsync(url);
    const model = gltf.scene;
    // Normalise height to ~3.5 units, base on the plinth.
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const scale = size.y > 0 ? 3.5 / size.y : 1;
    model.scale.setScalar(scale);
    box.setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.x -= center.x;
    model.position.z -= center.z;
    model.position.y -= box.min.y;
    model.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    const root = new THREE.Group();
    root.add(model);
    const find = (n: string) =>
      model.getObjectByProperty('name', n) ??
      model.children.find((c) => c.name.toLowerCase().includes(n));
    return { root, cap: find('cap'), label: find('label'), water: find('water') };
  } catch (err) {
    console.warn(`[3D] Could not load bottle model for ${style}, using procedural bottle.`, err);
    return null;
  }
}
