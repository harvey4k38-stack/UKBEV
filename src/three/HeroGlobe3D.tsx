import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Globe, Satellite } from 'lucide-react';
import { LazyGoogleEarthOriginMap as GoogleEarthOriginMap } from '../components/LazyGoogleEarthOriginMap';
import type { Brand } from '../types';
import {
  afterDrawSync,
  createEarthTextures,
  detectSoftwareWebGL,
  isWebGLAvailable,
  latLngToVector3,
  setupStudioRenderer,
} from './webglUtils';
import { HDRI, applyHdriEnvironment, createPostFX, createRenderGate, isLowPowerDevice, trackScrollProgress } from './fx';
import { applyNightSideEmissive, loadEarthTextures } from './earthTextures';

interface HeroGlobe3DProps {
  brands: Brand[];
  selectedBrandId: string | null;
  onSelectBrand: (brand: Brand | null) => void;
  onExploreBrand: (slug: string) => void;
}

const _targetCamPos = new THREE.Vector3();
const _ukVec = new THREE.Vector3();
const _pulsePos = new THREE.Vector3();
const _sunDir = new THREE.Vector3(7, 4.5, 6).normalize();

const ATMOSPHERE_VERT = /* glsl */ `
  varying vec3 vNormalDir;
  varying vec3 vWorldNormal;
  void main() {
    vNormalDir = normalize(normalMatrix * normal);
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ATMOSPHERE_OUTER_FRAG = /* glsl */ `
  uniform vec3 uSunDir;
  varying vec3 vNormalDir;
  varying vec3 vWorldNormal;
  void main() {
    float viewDot = dot(vNormalDir, vec3(0.0, 0.0, 1.0));
    float rim = pow(clamp(0.68 - viewDot, 0.0, 1.0), 3.1);
    float sunLight = clamp(dot(vWorldNormal, uSunDir) * 0.65 + 0.52, 0.14, 1.0);
    vec3 dayGlow = vec3(0.36, 0.76, 0.98);
    vec3 nightGlow = vec3(0.07, 0.22, 0.44);
    vec3 col = mix(nightGlow, dayGlow, sunLight);
    gl_FragColor = vec4(col, rim * 0.85 * sunLight);
  }
`;

const ATMOSPHERE_INNER_FRAG = /* glsl */ `
  uniform vec3 uSunDir;
  varying vec3 vNormalDir;
  varying vec3 vWorldNormal;
  void main() {
    float viewDot = clamp(dot(vNormalDir, vec3(0.0, 0.0, 1.0)), 0.0, 1.0);
    float fresnel = pow(1.0 - viewDot, 3.8);
    float sunLight = clamp(dot(vWorldNormal, uSunDir) * 0.65 + 0.45, 0.08, 1.0);
    vec3 scatter = vec3(0.45, 0.82, 1.0);
    gl_FragColor = vec4(scatter, fresnel * 0.36 * sunLight);
  }
`;

export function HeroGlobe3D({
  brands,
  selectedBrandId,
  onSelectBrand,
  onExploreBrand,
}: HeroGlobe3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglReady, setWebglReady] = useState(true);
  const [hoveredBrandId, setHoveredBrandId] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [viewMode, setViewMode] = useState<'globe' | 'satellite'>('globe');

  const brandsRef = useRef(brands);
  brandsRef.current = brands;
  const selectedRef = useRef(selectedBrandId);
  selectedRef.current = selectedBrandId;
  const autoRotateRef = useRef(autoRotate);
  autoRotateRef.current = autoRotate;
  const onSelectRef = useRef(onSelectBrand);
  onSelectRef.current = onSelectBrand;

  const flyTargetRef = useRef<THREE.Vector3 | null>(null);

  // Trigger camera fly-to whenever selectedBrandId changes
  useEffect(() => {
    if (!selectedBrandId) {
      flyTargetRef.current = null;
      return;
    }
    const brand = brandsRef.current.find((b) => b.id === selectedBrandId);
    if (brand) {
      const surfacePos = latLngToVector3(
        brand.coordinates.lat,
        brand.coordinates.lng,
        2.35,
        new THREE.Vector3()
      );
      flyTargetRef.current = surfacePos.clone().normalize().multiplyScalar(5.55);
    }
  }, [selectedBrandId]);

  useEffect(() => {
    if (viewMode !== 'globe') return;
    const container = mountRef.current;
    if (!container) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!isWebGLAvailable()) {
      setWebglReady(false);
      return;
    }

    const isSoftwareGl = detectSoftwareWebGL();
    const { renderer, pmremGenerator, envTexture } = setupStudioRenderer(
      container,
      isSoftwareGl,
      false
    );
    container.appendChild(renderer.domElement);
    const gate = createRenderGate(container);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglReady(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060e17);
    scene.environment = envTexture;
    const disposeHdri = applyHdriEnvironment(scene, pmremGenerator, HDRI.studio, { intensity: 0.6 });

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    // Start oriented toward UK / France / Iceland Atlantic hemisphere
    const initFocus = latLngToVector3(46, -8, 6.25, new THREE.Vector3());
    camera.position.copy(initFocus);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    // Never hijack page scrolling: no wheel zoom, and no touch dragging on phones
    // (the globe is a self-rotating backdrop there).
    controls.enableZoom = false;
    if (window.matchMedia('(pointer: coarse)').matches) {
      controls.enabled = false;
      renderer.domElement.style.touchAction = 'pan-y';
    }
    controls.minDistance = 3.85;
    controls.maxDistance = 9.5;
    controls.enableDamping = !isSoftwareGl && !prefersReduced;
    controls.dampingFactor = 0.06;
    controls.rotateSpeed = 0.62;
    controls.target.set(0, 0, 0);

    controls.addEventListener('start', () => {
      flyTargetRef.current = null;
    });

    // Solar directional key + subtle cool planetary bounce + rim light
    const hemi = new THREE.HemisphereLight(0xbbe0f7, 0x08131f, 0.55);
    scene.add(hemi);
    const sunLight = new THREE.DirectionalLight(0xfff6e9, 2.75);
    sunLight.position.copy(_sunDir).multiplyScalar(12);
    scene.add(sunLight);
    const rimLight = new THREE.DirectionalLight(0x47a8d8, 0.72);
    rimLight.position.set(-7, -2.5, -5);
    scene.add(rimLight);

    const globeGroup = new THREE.Group();
    // Parallax wrapper: drifts/shrinks the globe as the hero scrolls away
    const parallaxGroup = new THREE.Group();
    parallaxGroup.add(globeGroup);
    scene.add(parallaxGroup);
    const scroll = trackScrollProgress(container, 'leave');

    const radius = 2.35;
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const earth = loadEarthTextures(
      maxAniso,
      !isSoftwareGl && Math.min(window.innerWidth, window.screen?.width || Infinity) >= 900
    );

    // NASA Blue Marble Earth: real albedo, elevation relief, glossy oceans, night-side city lights
    const lowPower = isSoftwareGl || isLowPowerDevice();
    const globeGeo = new THREE.SphereGeometry(radius, lowPower ? 72 : 128, lowPower ? 48 : 96);
    const globeMat = new THREE.MeshStandardMaterial({
      map: earth.day,
      bumpMap: earth.bump,
      bumpScale: 2.2,
      roughnessMap: earth.roughness,
      roughness: 1.0,
      metalness: 0.0,
      emissiveMap: earth.night,
      emissive: new THREE.Color('#FFC27A'),
      emissiveIntensity: 1.6,
      envMapIntensity: 0.55,
    });
    applyNightSideEmissive(globeMat, _sunDir);
    const globeMesh = new THREE.Mesh(globeGeo, globeMat);
    globeGroup.add(globeMesh);

    // Real cloud cover shell, drifting slowly over the surface
    const cloudGeo = new THREE.SphereGeometry(radius * 1.012, lowPower ? 64 : 96, lowPower ? 40 : 64);
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      alphaMap: earth.clouds,
      transparent: true,
      opacity: 0.7,
      roughness: 0.95,
      metalness: 0.0,
      depthWrite: false,
    });
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    globeGroup.add(cloudMesh);

    // Hold the surface back until the imagery has arrived, then fade it in
    globeMesh.visible = false;
    cloudMesh.visible = false;
    let surfaceFade = 1;
    earth.ready.then(
      () => {
        globeMesh.visible = true;
        cloudMesh.visible = true;
        surfaceFade = prefersReduced ? 1 : 0;
      },
      () => {
        // Fallback: procedurally painted Earth if the imagery fails to load
        const p = createEarthTextures(maxAniso);
        globeMat.map = p.albedo;
        globeMat.bumpMap = null;
        globeMat.normalMap = p.normal;
        globeMat.roughnessMap = p.roughness;
        globeMat.emissiveMap = p.emissive;
        globeMat.emissiveIntensity = 0.16;
        globeMat.needsUpdate = true;
        cloudMat.alphaMap = null;
        cloudMat.map = p.clouds;
        cloudMat.opacity = 0.64;
        cloudMat.needsUpdate = true;
        disposables.push(p.albedo, p.normal, p.roughness, p.emissive, p.clouds);
        globeMesh.visible = true;
        cloudMesh.visible = true;
      }
    );

    // Inner atmospheric surface Fresnel scatter
    const innerAtmoGeo = new THREE.SphereGeometry(radius * 1.006, 64, 48);
    const innerAtmoMat = new THREE.ShaderMaterial({
      vertexShader: ATMOSPHERE_VERT,
      fragmentShader: ATMOSPHERE_INNER_FRAG,
      uniforms: { uSunDir: { value: _sunDir.clone() } },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.FrontSide,
    });
    const innerAtmoMesh = new THREE.Mesh(innerAtmoGeo, innerAtmoMat);
    globeGroup.add(innerAtmoMesh);

    // Outer Rayleigh atmospheric limb glow
    const haloGeo = new THREE.SphereGeometry(radius * 1.095, 64, 48);
    const haloMat = new THREE.ShaderMaterial({
      vertexShader: ATMOSPHERE_VERT,
      fragmentShader: ATMOSPHERE_OUTER_FRAG,
      uniforms: { uSunDir: { value: _sunDir.clone() } },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    globeGroup.add(haloMesh);

    // Subtle orbital geodesic reference ring
    const eqGeo = new THREE.TorusGeometry(radius * 1.14, 0.003, 8, 140);
    const eqMat = new THREE.MeshBasicMaterial({
      color: 0x6ba6be,
      transparent: true,
      opacity: 0.18,
    });
    const eqRing = new THREE.Mesh(eqGeo, eqMat);
    eqRing.rotation.x = Math.PI / 2;
    globeGroup.add(eqRing);

    // Multi-layered distant starfield
    const starCount = 650;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 18 + Math.random() * 16;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.cos(phi);
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xdbeaf4,
      size: 0.055,
      transparent: true,
      opacity: 0.62,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // London UK Distribution Hub marker
    latLngToVector3(51.5072, -0.1276, radius + 0.018, _ukVec);
    const ukBeacon = new THREE.Group();
    const ukRingGeo = new THREE.RingGeometry(0.036, 0.058, 28);
    const ukRingMat = new THREE.MeshBasicMaterial({ color: 0xf8f7f4, side: THREE.DoubleSide });
    const ukRing = new THREE.Mesh(ukRingGeo, ukRingMat);
    const ukCoreGeo = new THREE.SphereGeometry(0.022, 12, 12);
    const ukCoreMat = new THREE.MeshBasicMaterial({ color: 0x7cc4d8 });
    const ukCore = new THREE.Mesh(ukCoreGeo, ukCoreMat);
    ukBeacon.position.copy(_ukVec);
    ukBeacon.lookAt(_ukVec.clone().multiplyScalar(2));
    ukBeacon.add(ukRing, ukCore);
    globeGroup.add(ukBeacon);

    // Interactive Brand Origin Pins + Orbital Supply Arcs + Flowing Water-Light Pulses
    const hitTargets: THREE.Mesh[] = [];
    const pinHeads: { mesh: THREE.Mesh; brandId: string }[] = [];
    const arcPulses: { curve: THREE.QuadraticBezierCurve3; bead: THREE.Mesh; phase: number }[] = [];
    const pulseBeadGeo = new THREE.SphereGeometry(0.024, 12, 12);

    const disposables: { dispose: () => void }[] = [
      globeGeo,
      globeMat,
      cloudGeo,
      cloudMat,
      innerAtmoGeo,
      innerAtmoMat,
      haloGeo,
      haloMat,
      eqGeo,
      eqMat,
      starGeo,
      starMat,
      ukRingGeo,
      ukRingMat,
      ukCoreGeo,
      ukCoreMat,
      pulseBeadGeo,
      earth,
    ];

    brandsRef.current.forEach((brand, bIdx) => {
      const pos = latLngToVector3(
        brand.coordinates.lat,
        brand.coordinates.lng,
        radius,
        new THREE.Vector3()
      );
      const normalVec = pos.clone().normalize();

      const pinGroup = new THREE.Group();
      pinGroup.position.copy(pos);
      pinGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normalVec);

      const accent = new THREE.Color(brand.accentHex || '#38BDF8');
      const baseRingGeo = new THREE.RingGeometry(0.042, 0.072, 28);
      const baseRingMat = new THREE.MeshBasicMaterial({
        color: accent,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.92,
      });
      const baseRing = new THREE.Mesh(baseRingGeo, baseRingMat);
      baseRing.rotation.x = -Math.PI / 2;
      baseRing.position.y = 0.015;

      const stemGeo = new THREE.CylinderGeometry(0.008, 0.012, 0.16, 10);
      const stemMat = new THREE.MeshStandardMaterial({
        color: 0xf1f5f9,
        metalness: 0.75,
        roughness: 0.22,
      });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.y = 0.09;

      const headGeo = new THREE.OctahedronGeometry(0.056, 0);
      const headMat = new THREE.MeshStandardMaterial({
        color: accent,
        emissive: accent,
        emissiveIntensity: 0.55,
        roughness: 0.16,
        metalness: 0.35,
      });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.y = 0.19;
      pinHeads.push({ mesh: head, brandId: brand.id });

      const hitGeo = new THREE.SphereGeometry(0.19, 12, 12);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitProxy = new THREE.Mesh(hitGeo, hitMat);
      hitProxy.position.y = 0.15;
      hitProxy.layers.set(1);
      hitProxy.userData = { brand };
      hitTargets.push(hitProxy);

      pinGroup.add(baseRing, stem, head, hitProxy);
      globeGroup.add(pinGroup);
      disposables.push(baseRingGeo, baseRingMat, stemGeo, stemMat, headGeo, headMat, hitGeo, hitMat);

      // Great-circle arc from spring origin to London UK
      const arcHeight = Math.min(0.95, 0.35 + pos.distanceTo(_ukVec) * 0.18);
      const mid = pos
        .clone()
        .add(_ukVec)
        .multiplyScalar(0.5)
        .normalize()
        .multiplyScalar(radius + arcHeight);
      const curve = new THREE.QuadraticBezierCurve3(
        pos.clone().multiplyScalar(1.008),
        mid,
        _ukVec.clone()
      );
      const arcGeo = new THREE.TubeGeometry(curve, 44, 0.006, 6, false);
      const arcMat = new THREE.MeshBasicMaterial({
        color: accent,
        transparent: true,
        opacity: 0.42,
      });
      const arcMesh = new THREE.Mesh(arcGeo, arcMat);
      globeGroup.add(arcMesh);
      disposables.push(arcGeo, arcMat);

      // 2 animated pulse beads per route traveling smoothly toward London UK
      for (let k = 0; k < 2; k++) {
        const beadMat = new THREE.MeshBasicMaterial({ color: accent });
        const bead = new THREE.Mesh(pulseBeadGeo, beadMat);
        globeGroup.add(bead);
        disposables.push(beadMat);
        arcPulses.push({
          curve,
          bead,
          phase: (bIdx * 0.21 + k * 0.5) % 1,
        });
      }
    });

    // Raycaster for layer 1 markers
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    const pointer = new THREE.Vector2();
    let lastMoveCheck = 0;

    const updatePointer = (ev: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerMove = (ev: PointerEvent) => {
      const now = performance.now();
      if (now - lastMoveCheck < 45) return;
      lastMoveCheck = now;
      updatePointer(ev);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(hitTargets, false);
      if (hits.length > 0) {
        const brand = hits[0].object.userData.brand as Brand;
        renderer.domElement.style.cursor = 'pointer';
        setHoveredBrandId(brand.id);
      } else {
        renderer.domElement.style.cursor = 'grab';
        setHoveredBrandId(null);
      }
    };

    let pointerDownPos = { x: 0, y: 0 };
    const onPointerDown = (ev: PointerEvent) => {
      pointerDownPos = { x: ev.clientX, y: ev.clientY };
    };
    const onPointerUp = (ev: PointerEvent) => {
      const dx = ev.clientX - pointerDownPos.x;
      const dy = ev.clientY - pointerDownPos.y;
      if (Math.hypot(dx, dy) > 6) return;
      updatePointer(ev);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(hitTargets, false);
      if (hits.length > 0) {
        const brand = hits[0].object.userData.brand as Brand;
        onSelectRef.current(brand);
      }
    };

    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      fx.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const fx = createPostFX(renderer, scene, camera, isSoftwareGl, {
      bloom: { intensity: 1.1, threshold: 0.42, smoothing: 0.35, radius: 0.75 },
      vignette: { darkness: 0.55, offset: 0.28 },
    });

    const clock = new THREE.Clock();
    const timerRef = { id: 0 };
    let disposed = false;

    const tick = () => {
      if (disposed) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.getElapsedTime();

      if (!prefersReduced) {
        cloudMesh.rotation.y += dt * 0.006;
      }
      if (surfaceFade < 1) {
        surfaceFade = Math.min(1, surfaceFade + dt * 1.6);
        globeMat.transparent = surfaceFade < 1;
        globeMat.opacity = surfaceFade;
        cloudMat.opacity = 0.7 * surfaceFade;
      }

      if (flyTargetRef.current) {
        _targetCamPos.copy(flyTargetRef.current).applyQuaternion(globeGroup.quaternion);
        const alpha = 1 - Math.exp(-4.5 * dt);
        camera.position.lerp(_targetCamPos, alpha);
        if (camera.position.distanceTo(_targetCamPos) < 0.08) {
          flyTargetRef.current = null;
        }
      } else if (autoRotateRef.current && !selectedRef.current && !prefersReduced) {
        globeGroup.rotation.y += dt * 0.075;
      }

      for (const p of pinHeads) {
        const isSelected = p.brandId === selectedRef.current;
        const targetScale = isSelected ? 1.55 : 1 + Math.sin(elapsed * 2.2) * 0.08;
        p.mesh.scale.setScalar(THREE.MathUtils.damp(p.mesh.scale.x, targetScale, 8, dt));
        p.mesh.rotation.y += dt * 0.9;
      }

      if (!prefersReduced) {
        for (const ap of arcPulses) {
          const t = (elapsed * 0.22 + ap.phase) % 1;
          ap.curve.getPointAt(t, _pulsePos);
          ap.bead.position.copy(_pulsePos);
          const s = 0.6 + Math.sin(t * Math.PI) * 0.75;
          ap.bead.scale.setScalar(s);
        }
      }

      if (!prefersReduced) {
        const p = scroll.progress.value;
        parallaxGroup.position.y = THREE.MathUtils.damp(parallaxGroup.position.y, p * 1.4, 6, dt);
        parallaxGroup.rotation.x = THREE.MathUtils.damp(parallaxGroup.rotation.x, p * 0.35, 6, dt);
        parallaxGroup.scale.setScalar(THREE.MathUtils.damp(parallaxGroup.scale.x, 1 - p * 0.18, 6, dt));
      }

      if (gate.active) {
        controls.update();
        fx.render(dt);
      }

      if (isSoftwareGl) {
        afterDrawSync(renderer, tick, timerRef);
      } else {
        timerRef.id = requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(timerRef.id);
      clearTimeout(timerRef.id);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      controls.dispose();
      gate.dispose();
      scroll.dispose();
      fx.dispose();
      disposeHdri();
      for (const d of disposables) d.dispose();
      envTexture.dispose();
      pmremGenerator.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [brands.length, viewMode]);

  const activeBrand =
    brands.find((b) => b.id === (selectedBrandId || hoveredBrandId)) || null;

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#060E17]">
      {viewMode === 'satellite' ? (
        <GoogleEarthOriginMap
          brands={brands}
          selectedBrandId={selectedBrandId}
          onSelectBrand={onSelectBrand}
          defaultRange={22000}
          defaultZoom={11}
        />
      ) : !webglReady ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0B1724] text-white p-8">
          <div className="max-w-xl text-center space-y-4">
            <p className="text-sm uppercase tracking-widest text-[#7CC4D8]">Global Water Provenance</p>
            <h2 className="font-editorial text-3xl text-white">Five Natural Springs Around the World</h2>
            <p className="text-sm text-slate-300">
              Explore our curated sources in France, Fiji, Scotland, Iceland, and New Zealand.
            </p>
          </div>
        </div>
      ) : (
        <div ref={mountRef} className="absolute inset-0 w-full h-full" />
      )}

      {/* Brand Origin Preview Card (when marker hovered/selected) */}
      {activeBrand && (
        <div
          className="hidden md:block absolute right-6 top-20 z-20 w-80 overflow-hidden rounded-xl border border-white/15 shadow-2xl transition-opacity duration-200"
          style={{ backgroundColor: 'rgba(11, 20, 30, 0.94)' }}
        >
          <div className="relative h-36 w-full overflow-hidden bg-[#132232]">
            <img
              src={activeBrand.heroImage}
              alt={`${activeBrand.name} source in ${activeBrand.country}`}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B141E] via-transparent to-transparent" />
            <div className="absolute bottom-2.5 left-4 right-4 flex items-center justify-between text-xs text-slate-200">
              <span>{activeBrand.country}</span>
              <span className="font-mono tabular-nums">pH {activeBrand.mineralProfile.ph}</span>
            </div>
          </div>
          <div className="p-4 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-white">{activeBrand.name}</h3>
                <p className="text-xs text-slate-400">{activeBrand.sourceName}</p>
              </div>
              {selectedBrandId === activeBrand.id && (
                <button
                  onClick={() => onSelectBrand(null)}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1"
                  aria-label="Close brand preview"
                >
                  Close
                </button>
              )}
            </div>
            <p className="text-xs leading-relaxed text-slate-300 line-clamp-3">
              {activeBrand.tagline}
            </p>
            <div className="pt-1 flex items-center gap-2">
              <button
                onClick={() => onExploreBrand(activeBrand.slug)}
                className="flex-1 rounded-lg bg-[#18759C] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#1E88B5] transition-colors whitespace-nowrap"
              >
                Explore Source
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sleek Bottom Source Selector & Earth Mode Dock (<= 15% viewport, solid rgba surface) */}
      <div
        className="hidden md:flex absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex-wrap items-center justify-center gap-1.5 rounded-xl border border-white/15 px-3 py-2 shadow-xl max-w-[95vw]"
        style={{ backgroundColor: 'rgba(10, 18, 28, 0.92)' }}
      >
        <div className="flex items-center rounded-lg bg-white/10 p-0.5 mr-1">
          <button
            type="button"
            onClick={() => setViewMode('globe')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              viewMode === 'globe'
                ? 'bg-white text-[#0B141E]'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            3D Globe
          </button>
          <button
            type="button"
            onClick={() => setViewMode('satellite')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              viewMode === 'satellite'
                ? 'bg-white text-[#0B141E]'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Satellite className="h-3.5 w-3.5" />
            Satellite Earth
          </button>
        </div>

        <span className="hidden sm:inline-block h-4 w-px bg-white/15 mx-0.5" aria-hidden="true" />

        {brands.map((brand) => {
          const active = selectedBrandId === brand.id;
          return (
            <button
              key={brand.id}
              onClick={() => onSelectBrand(active ? null : brand)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-[#18759C] text-white'
                  : 'text-slate-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              {brand.name.replace(' Natural Spring Water', '').replace(' Water', '')} ·{' '}
              {brand.country.replace(', UK', '')}
            </button>
          );
        })}

        {viewMode === 'globe' && (
          <>
            <span className="hidden sm:inline-block h-4 w-px bg-white/15 mx-0.5" aria-hidden="true" />
            <button
              onClick={() => setAutoRotate((r) => !r)}
              className="px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/10 whitespace-nowrap shrink-0"
            >
              {autoRotate ? 'Pause Orbit' : 'Resume Orbit'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
