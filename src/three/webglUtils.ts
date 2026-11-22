import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { BottleVisualStyle } from '../types';

export function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export function isWebGL2Available(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export function setupStudioRenderer(
  container: HTMLElement,
  isSoftwareGl: boolean,
  alpha = false
): {
  renderer: THREE.WebGLRenderer;
  pmremGenerator: THREE.PMREMGenerator;
  envTexture: THREE.Texture;
} {
  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    powerPreference: 'high-performance',
    alpha,
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  const lowPower =
    window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768 || (navigator.hardwareConcurrency || 8) <= 4;
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, lowPower ? 1.5 : 2));
  renderer.setSize(container.clientWidth || 800, container.clientHeight || 600);
  renderer.shadowMap.enabled = !isSoftwareGl && !lowPower;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const envScene = new RoomEnvironment();
  const envTexture = pmremGenerator.fromScene(envScene, 0.04).texture;
  envScene.dispose();

  return { renderer, pmremGenerator, envTexture };
}

export function afterDrawSync(
  renderer: THREE.WebGLRenderer,
  cb: () => void,
  timerRef: { id: number }
) {
  const gl = renderer.getContext() as WebGL2RenderingContext;
  if (typeof gl.fenceSync === 'function') {
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        timerRef.id = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        timerRef.id = window.setTimeout(cb, 80);
      }
    };
    timerRef.id = window.setTimeout(poll, 5);
  } else {
    timerRef.id = window.setTimeout(cb, 80);
  }
}

// Deterministic 2D value noise + fbm for procedural terrains & textures
function hash2(ix: number, iz: number): number {
  const n = Math.sin(ix * 127.1 + iz * 311.7) * 43758.5453123;
  return n - Math.floor(n);
}

function hash3(ix: number, iy: number, iz: number): number {
  const n = Math.sin(ix * 127.1 + iy * 311.7 + iz * 74.7) * 43758.5453123;
  return n - Math.floor(n);
}

export function noise2D(x: number, z: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uz = fz * fz * (3 - 2 * fz);
  const a = hash2(ix, iz);
  const b = hash2(ix + 1, iz);
  const c = hash2(ix, iz + 1);
  const d = hash2(ix + 1, iz + 1);
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}

function noise3D(x: number, y: number, z: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fy = y - iy;
  const fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const uz = fz * fz * (3 - 2 * fz);
  const c000 = hash3(ix, iy, iz);
  const c100 = hash3(ix + 1, iy, iz);
  const c010 = hash3(ix, iy + 1, iz);
  const c110 = hash3(ix + 1, iy + 1, iz);
  const c001 = hash3(ix, iy, iz + 1);
  const c101 = hash3(ix + 1, iy, iz + 1);
  const c011 = hash3(ix, iy + 1, iz + 1);
  const c111 = hash3(ix + 1, iy + 1, iz + 1);
  const x00 = c000 + (c100 - c000) * ux;
  const x10 = c010 + (c110 - c010) * ux;
  const x01 = c001 + (c101 - c001) * ux;
  const x11 = c011 + (c111 - c011) * ux;
  const y0 = x00 + (x10 - x00) * uy;
  const y1 = x01 + (x11 - x01) * uy;
  return y0 + (y1 - y0) * uz;
}

function fbm3D(x: number, y: number, z: number, octaves = 4): number {
  let val = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    val += amp * noise3D(x * freq, y * freq, z * freq);
    freq *= 2.04;
    amp *= 0.5;
  }
  return val;
}

export function fbm2D(x: number, z: number, octaves = 5): number {
  let val = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    val += amp * noise2D(x * freq, z * freq);
    freq *= 2.02;
    amp *= 0.5;
  }
  return val;
}

export function ridged2D(x: number, z: number, octaves = 5): number {
  let val = 0;
  let amp = 0.55;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    const n = 1 - Math.abs(noise2D(x * freq, z * freq) * 2 - 1);
    val += amp * n * n;
    freq *= 2.1;
    amp *= 0.48;
  }
  return val;
}

export function latLngToVector3(lat: number, lng: number, radius: number, out = new THREE.Vector3()): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  out.set(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
  return out;
}

export function createRadialShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
  grad.addColorStop(0, 'rgba(15, 23, 32, 0.5)');
  grad.addColorStop(0.55, 'rgba(15, 23, 32, 0.18)');
  grad.addColorStop(1, 'rgba(15, 23, 32, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

interface CachedEarthCanvases {
  albedoCanvas: HTMLCanvasElement;
  normalCanvas: HTMLCanvasElement;
  roughnessCanvas: HTMLCanvasElement;
  emissiveCanvas: HTMLCanvasElement;
  cloudCanvas: HTMLCanvasElement;
}

let cachedEarthCanvases: CachedEarthCanvases | null = null;

function buildEarthCanvases(): CachedEarthCanvases {
  if (cachedEarthCanvases) return cachedEarthCanvases;

  const w = 2048;
  const h = 1024;

  // Higher-detail geographic continent polygons
  const landmasses: [number, number][][] = [
    // North America & Central America
    [
      [-168,66],[-161,71],[-140,70],[-126,70],[-110,69],[-94,70],[-82,66],[-78,61],
      [-65,59],[-55,52],[-61,46],[-67,45],[-71,41],[-75,35],[-80,31],[-81,25],
      [-83,29],[-90,29],[-97,26],[-96,19],[-88,21],[-84,11],[-78,8],[-83,9],
      [-92,15],[-105,20],[-112,24],[-117,32],[-122,38],[-124,45],[-125,49],
      [-132,54],[-141,60],[-152,59],[-162,55],[-166,61],
    ],
    // Greenland
    [[-52,60],[-43,60],[-33,68],[-20,71],[-18,81],[-42,83],[-64,79],[-70,76],[-56,67]],
    // Iceland (Ölfus Spring region)
    [[-24.2,65.5],[-22,66.4],[-18.5,66.1],[-14.5,66.2],[-13.5,64.8],[-16,63.9],[-20,63.5],[-22.7,63.9]],
    // Great Britain & Scotland (Highland Spring Ochil Hills)
    [[-5.6,50.1],[-1.2,50.8],[1.7,52.5],[0.2,53.6],[-1.4,55.2],[-2.1,57.6],[-3.1,58.6],[-5.3,58.4],[-6.2,56.8],[-5.0,55.0],[-3.6,54.4],[-4.8,52.0]],
    // Ireland
    [[-10.2,51.6],[-7.5,52.0],[-6.1,52.4],[-5.8,54.6],[-7.8,55.2],[-9.8,54.2]],
    // Continental Europe & Scandinavia
    [
      [-9.3,37.0],[-9.2,43.0],[-2.0,43.4],[-4.5,48.4],[2.0,51.0],[6.5,53.5],[8.5,55.5],
      [10.5,57.6],[7.5,58.2],[5.0,60.5],[6.5,63.2],[12.5,66.5],[17.5,69.5],[28.5,71.1],
      [32.0,69.5],[29.5,65.0],[22.0,65.5],[21.0,60.5],[28.0,60.2],[24.5,58.5],[20.0,55.5],
      [14.5,54.0],[19.0,50.5],[25.0,48.5],[29.8,46.2],[27.8,42.5],[29.0,41.1],[25.5,40.8],
      [23.5,38.0],[21.5,37.2],[19.5,40.5],[14.0,45.6],[16.0,41.0],[18.3,40.1],[15.8,38.0],
      [13.5,41.0],[9.2,44.4],[5.2,43.3],[3.1,42.4],[0.1,38.8],[-5.5,36.0],
    ],
    // Africa
    [
      [-17.2,14.7],[-16.5,22.0],[-13.0,28.0],[-6.0,35.8],[10.5,37.2],[11.5,33.0],[25.0,31.5],
      [32.5,31.2],[36.5,24.0],[43.2,12.6],[51.2,11.9],[47.0,4.5],[40.5,-3.0],[40.2,-11.0],
      [35.2,-20.0],[32.8,-26.5],[28.0,-33.0],[19.8,-34.8],[15.0,-26.0],[12.2,-15.5],
      [12.0,-6.0],[9.3,3.8],[3.0,6.4],[-8.0,4.5],[-15.2,11.2],
    ],
    // Madagascar
    [[49.2,-12.0],[50.4,-15.5],[47.5,-25.0],[44.0,-25.1],[44.5,-18.0],[47.5,-13.5]],
    // Eurasia / Middle East / Asia
    [
      [28.5,41.1],[36.0,41.8],[41.5,41.6],[49.0,40.5],[53.0,45.5],[60.0,55.0],[68.0,68.5],
      [78.0,73.0],[104.0,77.5],[138.0,73.0],[172.0,68.0],[178.0,65.5],[162.0,59.5],
      [156.5,51.0],[142.0,54.0],[136.0,44.5],[129.0,35.1],[126.5,38.0],[121.5,37.0],
      [121.8,31.0],[119.5,24.0],[114.0,22.2],[108.5,21.0],[109.2,12.5],[104.5,8.8],
      [100.5,13.5],[103.8,1.3],[98.5,8.0],[96.0,16.5],[90.5,22.2],[85.0,19.5],[77.5,8.1],
      [72.8,19.0],[68.5,23.5],[61.5,25.2],[56.2,26.8],[51.0,26.0],[48.5,29.8],[56.5,22.5],
      [53.0,16.0],[43.5,12.7],[35.0,29.5],[34.5,31.5],[36.0,36.8],
    ],
    // Japan
    [[130.5,31.4],[136.5,34.5],[140.8,36.2],[141.5,41.2],[145.5,44.2],[141.5,45.4],[139.8,39.5],[136.0,36.2],[131.0,33.8]],
    // Maritime SE Asia
    [[95.5,5.5],[105.5,-6.2],[114.5,-8.5],[118.5,2.5],[109.5,1.8],[99.5,-0.5]],
    [[119.5,1.2],[125.0,1.4],[123.5,-5.2],[119.0,-5.4]],
    [[121.0,18.2],[123.5,14.5],[126.0,7.2],[122.2,6.8],[120.2,14.5]],
    [[131.0,-1.8],[145.5,-6.2],[150.2,-10.4],[141.0,-9.0],[135.5,-4.5]],
    // Australia & Tasmania
    [
      [114.0,-22.2],[122.2,-17.8],[130.8,-12.2],[136.8,-12.2],[142.5,-10.8],[146.0,-18.0],
      [153.5,-28.0],[150.2,-37.2],[144.8,-38.5],[138.2,-35.5],[131.0,-32.0],[121.8,-33.9],
      [115.1,-34.3],[113.5,-26.5],
    ],
    [[144.8,-40.8],[148.2,-41.0],[147.2,-43.4],[145.2,-42.5]],
    // New Zealand (North & South Islands — Tongariro National Park at -39.2, 175.6)
    [[172.8,-34.5],[174.5,-36.0],[178.4,-37.6],[178.0,-39.5],[175.2,-41.4],[173.8,-39.2]],
    [[174.0,-41.1],[172.5,-42.8],[170.5,-44.5],[168.4,-46.6],[166.5,-45.7],[169.5,-42.6],[172.2,-40.7]],
    // Fiji (Viti Levu & Vanua Levu — Yaqara Valley at -17.43, 177.98)
    [[177.3,-17.4],[178.6,-17.5],[178.5,-18.2],[177.4,-18.1]],
    [[178.6,-16.4],[179.9,-16.2],[179.5,-16.9],[178.5,-16.8]],
    // South America
    [
      [-78.0,9.5],[-71.5,12.2],[-62.0,10.5],[-51.0,1.5],[-35.0,-6.0],[-38.5,-14.5],
      [-41.5,-22.5],[-48.5,-28.0],[-54.0,-34.8],[-62.0,-40.5],[-67.5,-47.0],[-68.8,-55.0],
      [-74.5,-52.5],[-73.8,-42.0],[-71.5,-30.0],[-70.5,-18.5],[-77.5,-12.0],[-81.3,-4.8],[-79.0,2.5],
    ],
    // Antarctica shelf
    [[-180,-71],[-135,-74],[-90,-73],[-60,-64],[-30,-72],[15,-70],[68,-68],[125,-67],[168,-72],[180,-71],[180,-90],[-180,-90]],
  ];

  // 1. Crisp land mask (2048x1024)
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = w;
  maskCanvas.height = h;
  const mctx = maskCanvas.getContext('2d')!;
  mctx.fillStyle = '#000000';
  mctx.fillRect(0, 0, w, h);
  mctx.fillStyle = '#ffffff';
  mctx.lineJoin = 'round';
  for (const poly of landmasses) {
    mctx.beginPath();
    poly.forEach(([lng, lat], idx) => {
      const x = ((lng + 180) / 360) * w;
      const y = ((90 - lat) / 180) * h;
      if (idx === 0) mctx.moveTo(x, y);
      else mctx.lineTo(x, y);
    });
    mctx.closePath();
    mctx.fill();
  }
  const maskData = mctx.getImageData(0, 0, w, h).data;

  // 2. Soft coastal/bathymetry distance canvas (512x256 -> hardware blurred)
  const sw = 512;
  const sh = 256;
  const shelfCanvas = document.createElement('canvas');
  shelfCanvas.width = sw;
  shelfCanvas.height = sh;
  const sctx = shelfCanvas.getContext('2d')!;
  sctx.fillStyle = '#000000';
  sctx.fillRect(0, 0, sw, sh);
  sctx.save();
  sctx.filter = 'blur(7px)';
  sctx.drawImage(maskCanvas, 0, 0, sw, sh);
  sctx.restore();
  const shelfData = sctx.getImageData(0, 0, sw, sh).data;

  // 3. Precompute seamless spherical 3D climate/tectonic noise grid at 512x256
  const noiseGrid = new Float32Array(sw * sh * 3); // [fbm, ridged, moisture]
  for (let y = 0; y < sh; y++) {
    const latRad = (0.5 - y / sh) * Math.PI;
    const cosLat = Math.cos(latRad);
    const sinLat = Math.sin(latRad);
    for (let x = 0; x < sw; x++) {
      const lngRad = (x / sw) * Math.PI * 2 - Math.PI;
      const sx = cosLat * Math.cos(lngRad);
      const sy = sinLat;
      const sz = cosLat * Math.sin(lngRad);
      const base = fbm3D(sx * 3.8 + 4.1, sy * 3.8 + 1.9, sz * 3.8 - 2.3, 4);
      const ridge = 1.0 - Math.abs(noise3D(sx * 7.5 - 1.2, sy * 7.5 + 3.4, sz * 7.5 + 0.8) * 2.0 - 1.0);
      const moist = fbm3D(sx * 2.4 - 5.2, sy * 2.4 + 6.1, sz * 2.4 + 2.9, 3);
      const ptr = (y * sw + x) * 3;
      noiseGrid[ptr] = base;
      noiseGrid[ptr + 1] = ridge * ridge;
      noiseGrid[ptr + 2] = moist;
    }
  }

  const sampleBilinear = (grid: Uint8ClampedArray | Float32Array, gx: number, gy: number, stride: number, offset: number): number => {
    const x0 = Math.floor(gx);
    const y0 = Math.min(sh - 1, Math.max(0, Math.floor(gy)));
    const x1 = (x0 + 1) % sw;
    const y1 = Math.min(sh - 1, y0 + 1);
    const tx = gx - x0;
    const ty = gy - y0;
    const v00 = grid[(y0 * sw + (x0 % sw)) * stride + offset];
    const v10 = grid[(y0 * sw + x1) * stride + offset];
    const v01 = grid[(y1 * sw + (x0 % sw)) * stride + offset];
    const v11 = grid[(y1 * sw + x1) * stride + offset];
    const top = v00 + (v10 - v00) * tx;
    const bot = v01 + (v11 - v01) * tx;
    return top + (bot - top) * ty;
  };

  // Mountain belt uplift helper (Alps, Himalayas, Rockies, Andes, NZ, Iceland, Scotland)
  const mountainWeight = (lat: number, lng: number): number => {
    const belts = [
      // Alps
      Math.exp(-(((lat - 46.5) / 2.2) ** 2 + ((lng - 9.0) / 5.5) ** 2)) * 0.95,
      // Himalayas / Tibet
      Math.exp(-(((lat - 32.5) / 5.0) ** 2 + ((lng - 87.0) / 14.0) ** 2)) * 1.1,
      // Rockies
      Math.exp(-(((lat - 46.0) / 14.0) ** 2 + ((lng + 114.0) / 7.5) ** 2)) * 0.85,
      // Andes
      Math.exp(-(((lat + 22.0) / 24.0) ** 2 + ((lng + 69.0) / 4.2) ** 2)) * 1.0,
      // NZ Southern Alps
      Math.exp(-(((lat + 43.2) / 2.5) ** 2 + ((lng - 170.8) / 2.5) ** 2)) * 0.85,
      // Iceland Highlands
      Math.exp(-(((lat - 64.8) / 1.4) ** 2 + ((lng + 18.0) / 3.0) ** 2)) * 0.7,
      // Scottish Highlands
      Math.exp(-(((lat - 56.9) / 1.4) ** 2 + ((lng + 4.3) / 2.0) ** 2)) * 0.55,
    ];
    return Math.min(1.1, belts[0] + belts[1] + belts[2] + belts[3] + belts[4] + belts[5] + belts[6]);
  };

  // Output buffers
  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = w;
  albedoCanvas.height = h;
  const actx = albedoCanvas.getContext('2d')!;
  const aImg = actx.createImageData(w, h);

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = w;
  roughCanvas.height = h;
  const rctx = roughCanvas.getContext('2d')!;
  const rImg = rctx.createImageData(w, h);

  const emissiveCanvas = document.createElement('canvas');
  emissiveCanvas.width = w;
  emissiveCanvas.height = h;
  const ectx = emissiveCanvas.getContext('2d')!;
  const eImg = ectx.createImageData(w, h);

  const heightField = new Float32Array(w * h);

  for (let y = 0; y < h; y++) {
    const lat = 90 - (y / h) * 180;
    const absLat = Math.abs(lat);
    const gy = (y / h) * (sh - 1);

    for (let x = 0; x < w; x++) {
      const lng = (x / w) * 360 - 180;
      const gx = (x / w) * sw;
      const idx = y * w + x;
      const p4 = idx * 4;

      const rawMask = maskData[p4] / 255;
      const shelfBlur = sampleBilinear(shelfData, gx, gy, 4, 0) / 255;
      const fbmVal = sampleBilinear(noiseGrid, gx, gy, 3, 0);
      const ridgeVal = sampleBilinear(noiseGrid, gx, gy, 3, 1);
      const moistVal = sampleBilinear(noiseGrid, gx, gy, 3, 2);

      // Perturb coastline subtly with fbm for natural inlets & fjords
      const micro = noise2D(x * 0.085, y * 0.085);
      const coastSignal = rawMask * 0.62 + shelfBlur * 0.38 + (fbmVal - 0.5) * 0.32 + (micro - 0.5) * 0.14;
      const isLand = coastSignal > 0.50;

      let r = 0;
      let g = 0;
      let b = 0;
      let rough = 60;
      let elev = 0;
      let cityGlow = 0;

      if (!isLand) {
        // Bathymetric ocean shading: shallow turquoise shelf -> deep cobalt pelagic water
        const shelfGlow = Math.pow(Math.min(1, coastSignal * 1.95), 2.2);
        const abyssal = (fbmVal - 0.5) * 0.35 + (micro - 0.5) * 0.08;
        r = 7 + shelfGlow * 14 + abyssal * 6;
        g = 24 + shelfGlow * 48 + abyssal * 12;
        b = 46 + shelfGlow * 64 + abyssal * 18;
        rough = 58 + Math.round(shelfGlow * 14);
        elev = -0.15 + shelfGlow * 0.12 + abyssal * 0.04;

        // Polar sea ice breakup
        const iceThreshold = 71.5 + (fbmVal - 0.5) * 9.0;
        if (absLat > iceThreshold) {
          const iceBlend = Math.min(1, (absLat - iceThreshold) / 3.5);
          r = r * (1 - iceBlend) + 225 * iceBlend;
          g = g * (1 - iceBlend) + 236 * iceBlend;
          b = b * (1 - iceBlend) + 244 * iceBlend;
          rough = Math.round(rough * (1 - iceBlend) + 125 * iceBlend);
        }
      } else {
        const inland = Math.min(1, (coastSignal - 0.5) * 2.6);
        const mtn = mountainWeight(lat, lng);
        elev = inland * 0.25 + ridgeVal * (0.28 + mtn * 0.85) + (micro - 0.5) * 0.08;
        rough = 216;

        // Biome calculation by latitude, moisture & elevation
        if (absLat > 67.5 + (fbmVal - 0.5) * 6 || elev > 0.76) {
          // Polar ice & alpine snow caps
          const snow = Math.min(1, Math.max((elev - 0.68) * 4.5, (absLat - 66) / 6));
          r = 95 * (1 - snow) + 236 * snow;
          g = 104 * (1 - snow) + 242 * snow;
          b = 108 * (1 - snow) + 247 * snow;
          rough = 148;
        } else {
          // Arid belt: Sahara, Arabia, Central Asia, Australian Outback, SW US
          const desertLat = Math.exp(-(((absLat - 24.5) / 10.5) ** 2));
          const dryness = desertLat * (1.15 - moistVal * 1.1) * (1 - mtn * 0.4);

          if (dryness > 0.42) {
            const aridMix = Math.min(1, (dryness - 0.42) * 2.5);
            const sandR = 166 + (fbmVal - 0.5) * 32;
            const sandG = 136 + (fbmVal - 0.5) * 24;
            const sandB = 96 + (fbmVal - 0.5) * 18;
            const scrubR = 98;
            const scrubG = 108;
            const scrubB = 72;
            r = scrubR * (1 - aridMix) + sandR * aridMix;
            g = scrubG * (1 - aridMix) + sandG * aridMix;
            b = scrubB * (1 - aridMix) + sandB * aridMix;
          } else if (absLat < 19.5) {
            // Tropical rainforest (Amazon, Congo, Fiji, SE Asia)
            r = 25 + fbmVal * 26 + micro * 8;
            g = 68 + fbmVal * 34 + micro * 10;
            b = 36 + fbmVal * 16;
          } else if (absLat < 52.0) {
            // Temperate European, UK, NZ & North American greens
            r = 42 + fbmVal * 32 + mtn * 36;
            g = 80 + fbmVal * 28 + micro * 10;
            b = 46 + fbmVal * 18 + mtn * 22;
          } else {
            // Boreal / Nordic / Volcanic highland rock + moss (Iceland / Siberia / Canada)
            const isIceland = lat > 62 && lat < 67 && lng > -26 && lng < -12;
            if (isIceland) {
              r = 56 + micro * 20;
              g = 66 + fbmVal * 24;
              b = 64 + micro * 14;
            } else {
              r = 34 + fbmVal * 28;
              g = 58 + fbmVal * 26;
              b = 44 + fbmVal * 18;
            }
          }

          // Subtle mountain ridge rock shading
          if (elev > 0.48) {
            const rockMix = Math.min(0.85, (elev - 0.48) * 2.6);
            r = r * (1 - rockMix) + 114 * rockMix;
            g = g * (1 - rockMix) + 112 * rockMix;
            b = b * (1 - rockMix) + 108 * rockMix;
          }
        }

        // Subtle coastal & temperate city lights for dark-side terminator polish
        const populatedZone =
          ((lat > 35 && lat < 58 && lng > -10 && lng < 30) || // Europe & UK
            (lat > 28 && lat < 46 && lng > -95 && lng < -70) || // Eastern North America
            (lat > 31 && lat < 41 && lng > 128 && lng < 143)) && // Japan
          elev < 0.45 &&
          inland < 0.72;
        if (populatedZone && micro > 0.78 && fbmVal > 0.48) {
          cityGlow = Math.min(1, (micro - 0.78) * 5.2);
        }
      }

      heightField[idx] = elev;

      aImg.data[p4] = Math.max(0, Math.min(255, Math.round(r)));
      aImg.data[p4 + 1] = Math.max(0, Math.min(255, Math.round(g)));
      aImg.data[p4 + 2] = Math.max(0, Math.min(255, Math.round(b)));
      aImg.data[p4 + 3] = 255;

      rImg.data[p4] = rough;
      rImg.data[p4 + 1] = rough;
      rImg.data[p4 + 2] = rough;
      rImg.data[p4 + 3] = 255;

      eImg.data[p4] = Math.round(cityGlow * 255);
      eImg.data[p4 + 1] = Math.round(cityGlow * 195);
      eImg.data[p4 + 2] = Math.round(cityGlow * 115);
      eImg.data[p4 + 3] = 255;
    }
  }

  actx.putImageData(aImg, 0, 0);
  rctx.putImageData(rImg, 0, 0);
  ectx.putImageData(eImg, 0, 0);

  // 4. Sobel tangent-space Normal Map from heightField
  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = w;
  normalCanvas.height = h;
  const nctx = normalCanvas.getContext('2d')!;
  const nImg = nctx.createImageData(w, h);
  const strength = 5.5;

  for (let y = 0; y < h; y++) {
    const ym = Math.max(0, y - 1);
    const yp = Math.min(h - 1, y + 1);
    for (let x = 0; x < w; x++) {
      const xm = (x - 1 + w) % w;
      const xp = (x + 1) % w;
      const dx = (heightField[y * w + xp] - heightField[y * w + xm]) * strength;
      const dy = (heightField[yp * w + x] - heightField[ym * w + x]) * strength;
      const invLen = 1 / Math.sqrt(dx * dx + dy * dy + 1);
      const nx = -dx * invLen;
      const ny = dy * invLen;
      const nz = invLen;
      const p4 = (y * w + x) * 4;
      nImg.data[p4] = Math.round((nx * 0.5 + 0.5) * 255);
      nImg.data[p4 + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      nImg.data[p4 + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      nImg.data[p4 + 3] = 255;
    }
  }
  nctx.putImageData(nImg, 0, 0);

  // 5. Seamless swirling atmospheric Cloud Layer canvas (1024x512)
  const cw = 1024;
  const ch = 512;
  const cloudCanvas = document.createElement('canvas');
  cloudCanvas.width = cw;
  cloudCanvas.height = ch;
  const cctx = cloudCanvas.getContext('2d')!;
  const cImg = cctx.createImageData(cw, ch);

  for (let y = 0; y < ch; y++) {
    const latRad = (0.5 - y / ch) * Math.PI;
    const cosLat = Math.cos(latRad);
    const sinLat = Math.sin(latRad);
    const latDeg = Math.abs((latRad * 180) / Math.PI);
    // Slightly higher cloud probability in mid-latitude storm belts & ITCZ
    const bandBias = 0.04 * Math.cos(latRad * 4.0);
    for (let x = 0; x < cw; x++) {
      const lngRad = (x / cw) * Math.PI * 2 - Math.PI;
      const sx = cosLat * Math.cos(lngRad);
      const sy = sinLat;
      const sz = cosLat * Math.sin(lngRad);
      const warp = fbm3D(sx * 2.5 + 1.3, sy * 2.5 - 0.7, sz * 2.5 + 2.1, 3);
      const density = fbm3D(
        sx * 4.6 + warp * 1.4,
        sy * 5.2 + warp * 0.8,
        sz * 4.6 - warp * 1.4,
        4
      ) + bandBias;
      const alpha = latDeg > 86 ? 0.15 : Math.max(0, Math.min(1, (density - 0.53) * 3.1));
      const p4 = (y * cw + x) * 4;
      cImg.data[p4] = 248;
      cImg.data[p4 + 1] = 251;
      cImg.data[p4 + 2] = 255;
      cImg.data[p4 + 3] = Math.round(alpha * 220);
    }
  }
  cctx.putImageData(cImg, 0, 0);

  cachedEarthCanvases = {
    albedoCanvas,
    normalCanvas,
    roughnessCanvas: roughCanvas,
    emissiveCanvas,
    cloudCanvas,
  };
  return cachedEarthCanvases;
}

export function createEarthTextures(maxAnisotropy: number): {
  albedo: THREE.CanvasTexture;
  normal: THREE.CanvasTexture;
  roughness: THREE.CanvasTexture;
  emissive: THREE.CanvasTexture;
  clouds: THREE.CanvasTexture;
} {
  const c = buildEarthCanvases();

  const albedo = new THREE.CanvasTexture(c.albedoCanvas);
  albedo.colorSpace = THREE.SRGBColorSpace;
  albedo.wrapS = THREE.RepeatWrapping;
  albedo.anisotropy = maxAnisotropy;

  const normal = new THREE.CanvasTexture(c.normalCanvas);
  normal.wrapS = THREE.RepeatWrapping;
  normal.anisotropy = maxAnisotropy;

  const roughness = new THREE.CanvasTexture(c.roughnessCanvas);
  roughness.wrapS = THREE.RepeatWrapping;
  roughness.anisotropy = maxAnisotropy;

  const emissive = new THREE.CanvasTexture(c.emissiveCanvas);
  emissive.colorSpace = THREE.SRGBColorSpace;
  emissive.wrapS = THREE.RepeatWrapping;
  emissive.anisotropy = maxAnisotropy;

  const clouds = new THREE.CanvasTexture(c.cloudCanvas);
  clouds.colorSpace = THREE.SRGBColorSpace;
  clouds.wrapS = THREE.RepeatWrapping;
  clouds.anisotropy = maxAnisotropy;

  return { albedo, normal, roughness, emissive, clouds };
}

export function createStoneBumpTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n = fbm2D(x * 0.08, y * 0.08, 4);
      const v = Math.floor(n * 255);
      const idx = (y * size + x) * 4;
      img.data[idx] = v;
      img.data[idx + 1] = v;
      img.data[idx + 2] = v;
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  return tex;
}

export function createBottleLabelTexture(
  brandName: string,
  sizeLabel: string,
  waterType: string,
  accentHex: string,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#FAF9F6';
  ctx.fillRect(0, 0, 512, 256);

  // Subtle accent band
  ctx.fillStyle = accentHex;
  ctx.fillRect(0, 0, 512, 18);
  ctx.fillRect(0, 244, 512, 12);

  // Center typography
  const cleanTitle = brandName.replace(' Natural Spring Water', '').replace(' Water', '').toUpperCase();
  ctx.fillStyle = '#14181F';
  ctx.textAlign = 'center';
  ctx.font = '600 42px Georgia, serif';
  ctx.fillText(cleanTitle, 256, 118);

  ctx.fillStyle = accentHex;
  ctx.font = '600 18px sans-serif';
  ctx.fillText(`${waterType.toUpperCase()} NATURAL WATER`, 256, 158);

  ctx.fillStyle = '#475569';
  ctx.font = '500 18px monospace';
  ctx.fillText(`${sizeLabel}  ·  UK BEVERAGES`, 256, 198);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export interface CompositeBottleParts {
  root: THREE.Group;
  capGroup: THREE.Group;
  collarMesh: THREE.Mesh;
  labelMesh: THREE.Mesh;
  waterMesh: THREE.Mesh;
  bodyMesh: THREE.Mesh;
}

export function buildCompositeBottleGroup(params: {
  brandName: string;
  sizeLabel: string;
  waterType: 'Still' | 'Sparkling';
  packaging: string;
  bottleStyle: BottleVisualStyle;
  capColor: string;
  tintColor: string;
  labelAccent: string;
  isSoftwareGl: boolean;
  maxAnisotropy: number;
}): CompositeBottleParts {
  const root = new THREE.Group();
  const isGlass = params.packaging === 'Glass';
  const isFiji = params.bottleStyle === 'fiji_square';
  const isIcelandic = params.bottleStyle === 'icelandic_faceted';

  const vesselMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(params.tintColor),
    roughness: isGlass ? 0.06 : 0.14,
    metalness: 0.0,
    transmission: params.isSoftwareGl ? 0 : isGlass ? 0.88 : 0.72,
    transparent: true,
    opacity: params.isSoftwareGl ? 0.42 : 0.96,
    ior: isGlass ? 1.52 : 1.46,
    thickness: 0.5,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    depthWrite: !params.isSoftwareGl,
  });

  const waterMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#DDF3FC'),
    roughness: 0.05,
    metalness: 0.0,
    transparent: true,
    opacity: 0.52,
    ior: 1.333,
  });

  let bodyGeo: THREE.BufferGeometry;
  let waterGeo: THREE.BufferGeometry;
  let labelGeo: THREE.BufferGeometry;

  if (isFiji) {
    // Beveled rounded square cross-section for FIJI
    const shape = new THREE.Shape();
    const s = 0.56;
    const r = 0.14;
    shape.moveTo(-s + r, -s);
    shape.lineTo(s - r, -s);
    shape.quadraticCurveTo(s, -s, s, -s + r);
    shape.lineTo(s, s - r);
    shape.quadraticCurveTo(s, s, s - r, s);
    shape.lineTo(-s + r, s);
    shape.quadraticCurveTo(-s, s, -s, s - r);
    shape.lineTo(-s, -s + r);
    shape.quadraticCurveTo(-s, -s, -s + r, -s);

    bodyGeo = new THREE.ExtrudeGeometry(shape, {
      depth: 2.35,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.08,
      bevelSegments: 4,
    });
    bodyGeo.rotateX(-Math.PI / 2);
    bodyGeo.translate(0, 0.1, 0);

    waterGeo = new THREE.BoxGeometry(0.96, 1.95, 0.96);
    waterGeo.translate(0, 1.15, 0);

    labelGeo = new THREE.CylinderGeometry(0.64, 0.64, 1.25, 4, 1, true);
    labelGeo.rotateY(Math.PI / 4);
    labelGeo.translate(0, 1.32, 0);
  } else if (isIcelandic) {
    // Faceted glacial prism profile
    const pts = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.46, 0.0),
      new THREE.Vector2(0.55, 0.25),
      new THREE.Vector2(0.61, 1.45),
      new THREE.Vector2(0.54, 2.25),
      new THREE.Vector2(0.24, 2.85),
      new THREE.Vector2(0.22, 3.28),
      new THREE.Vector2(0.25, 3.35),
      new THREE.Vector2(0.0, 3.35),
    ];
    bodyGeo = new THREE.LatheGeometry(pts, 10);
    waterGeo = new THREE.CylinderGeometry(0.52, 0.45, 2.15, 10);
    waterGeo.translate(0, 1.22, 0);
    labelGeo = new THREE.CylinderGeometry(0.59, 0.57, 1.05, 10, 1, true);
    labelGeo.translate(0, 1.45, 0);
  } else {
    // Classic Alpine / Scottish / NZ curved LatheGeometry
    const pts = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.5, 0.0),
      new THREE.Vector2(0.58, 0.15),
      new THREE.Vector2(0.58, 2.1),
      new THREE.Vector2(0.45, 2.55),
      new THREE.Vector2(0.24, 2.95),
      new THREE.Vector2(0.23, 3.38),
      new THREE.Vector2(0.26, 3.45),
      new THREE.Vector2(0.0, 3.45),
    ];
    bodyGeo = new THREE.LatheGeometry(pts, 36);
    waterGeo = new THREE.CylinderGeometry(0.52, 0.52, 2.15, 32);
    waterGeo.translate(0, 1.2, 0);
    labelGeo = new THREE.CylinderGeometry(0.588, 0.588, 1.15, 36, 1, true);
    labelGeo.translate(0, 1.32, 0);
  }

  const bodyMesh = new THREE.Mesh(bodyGeo, vesselMat);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  bodyMesh.renderOrder = 2;

  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.renderOrder = 1;

  // Shoulder neck dome for FIJI square bottle
  if (isFiji) {
    const neckShoulder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.23, 0.56, 0.72, 24),
      vesselMat
    );
    neckShoulder.position.set(0, 2.8, 0);
    bodyMesh.add(neckShoulder);
  }

  // Label wrap
  const labelTex = createBottleLabelTexture(
    params.brandName,
    params.sizeLabel,
    params.waterType,
    params.labelAccent,
    params.maxAnisotropy
  );
  const labelMat = new THREE.MeshStandardMaterial({
    map: labelTex,
    roughness: 0.42,
    metalness: 0.05,
    side: THREE.FrontSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });
  const labelMesh = new THREE.Mesh(labelGeo, labelMat);
  labelMesh.renderOrder = 3;

  // Collar ring (brushed metallic contrast)
  const collarMesh = new THREE.Mesh(
    new THREE.TorusGeometry(0.245, 0.032, 12, 32),
    new THREE.MeshStandardMaterial({
      color: '#CBD5E1',
      roughness: 0.25,
      metalness: 0.85,
    })
  );
  collarMesh.rotation.x = Math.PI / 2;
  collarMesh.position.y = isFiji ? 3.16 : 3.3;

  // Cap Group (3 sub-parts: main cap cylinder, bevel crown, knurled band)
  const capGroup = new THREE.Group();
  const capMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(params.capColor),
    roughness: 0.32,
    metalness: isGlass ? 0.78 : 0.15,
  });
  const capBody = new THREE.Mesh(new THREE.CylinderGeometry(0.265, 0.275, 0.34, 32), capMat);
  capBody.castShadow = true;
  const capTop = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.265, 0.05, 32), capMat);
  capTop.position.y = 0.195;
  const capTrim = new THREE.Mesh(
    new THREE.TorusGeometry(0.268, 0.015, 8, 32),
    new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.2, metalness: 0.9 })
  );
  capTrim.rotation.x = Math.PI / 2;
  capTrim.position.y = -0.14;
  capGroup.add(capBody, capTop, capTrim);
  capGroup.position.y = isFiji ? 3.36 : 3.5;

  // Soft radial contact shadow flush at y = 0.01
  const shadowTex = createRadialShadowTexture();
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.9, 1.9),
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.55,
    })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.01;

  root.add(bodyMesh, waterMesh, labelMesh, collarMesh, capGroup, shadowPlane);
  return { root, capGroup, collarMesh, labelMesh, waterMesh, bodyMesh };
}
