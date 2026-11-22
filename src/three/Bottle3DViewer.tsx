import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import type { Product } from '../types';
import { BottleArtwork } from '../components/BottleArtwork';
import {
  afterDrawSync,
  buildCompositeBottleGroup,
  detectSoftwareWebGL,
  isWebGLAvailable,
  setupStudioRenderer,
} from './webglUtils';
import { ToneMappingMode } from 'postprocessing';
import { HDRI, applyHdriEnvironment, createPostFX, createRenderGate, isLowPowerDevice, loadBottleModel, trackScrollProgress } from './fx';

interface Bottle3DViewerProps {
  product: Product;
  brandName: string;
}

export function Bottle3DViewer({ product, brandName }: Bottle3DViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglOk, setWebglOk] = useState(true);
  const [exploded, setExploded] = useState(false);
  const explodedRef = useRef(exploded);
  explodedRef.current = exploded;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    if (!isWebGLAvailable() || product.bottleStyle === 'bulk_box') {
      setWebglOk(false);
      return;
    }

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isSoftwareGl = detectSoftwareWebGL();
    const { renderer, pmremGenerator, envTexture } = setupStudioRenderer(container, isSoftwareGl, false);
    container.appendChild(renderer.domElement);
    const gate = createRenderGate(container);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xefece6);
    scene.environment = envTexture;
    const disposeHdri = applyHdriEnvironment(scene, pmremGenerator, HDRI.studio, {
      intensity: 1.1,
      rotationY: Math.PI * 0.35,
    });

    const camera = new THREE.PerspectiveCamera(
      36,
      (container.clientWidth || 600) / (container.clientHeight || 520),
      0.1,
      50
    );
    camera.position.set(0, 2.3, 6.4);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableDamping = !isSoftwareGl && !prefersReduced;
    controls.dampingFactor = 0.06;
    controls.minDistance = 4.2;
    controls.maxDistance = 9.0;
    controls.target.set(0, 1.75, 0);

    // 3-point studio lighting + RectAreaLight softboxes on GPU
    const hemi = new THREE.HemisphereLight(0xf8fafc, 0xd9d2c4, 0.9);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xfff4e0, 1.8);
    key.position.set(4, 6, 4);
    key.castShadow = !isSoftwareGl;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -3;
    key.shadow.camera.right = 3;
    key.shadow.camera.top = 5;
    key.shadow.camera.bottom = -1;
    key.shadow.bias = -0.0005;
    scene.add(key);

    const rim = new THREE.DirectionalLight(0xdbeafe, 0.9);
    rim.position.set(-4, 3, -4);
    scene.add(rim);

    if (!isSoftwareGl) {
      RectAreaLightUniformsLib.init();
      const softboxL = new THREE.RectAreaLight(0xffffff, 2.6, 2.2, 4.5);
      softboxL.position.set(-3.2, 2.2, 2.5);
      softboxL.lookAt(0, 1.7, 0);
      scene.add(softboxL);
    }

    // Travertine stone plinth
    const plinthGeo = new THREE.CylinderGeometry(1.55, 1.62, 0.28, 48);
    const plinthMat = new THREE.MeshStandardMaterial({
      color: 0xe3ddd1,
      roughness: 0.72,
      metalness: 0.02,
    });
    const plinth = new THREE.Mesh(plinthGeo, plinthMat);
    plinth.position.y = -0.14;
    plinth.receiveShadow = true;
    scene.add(plinth);

    // Composite Bottle
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const bottle = buildCompositeBottleGroup({
      brandName,
      sizeLabel: product.bottleSizeLabel,
      waterType: product.waterType,
      packaging: product.packaging,
      bottleStyle: product.bottleStyle,
      capColor: product.capColor,
      tintColor: product.tintColor,
      labelAccent: product.labelAccent,
      isSoftwareGl,
      maxAnisotropy: maxAniso,
    });
    // "Anti-gravity" float rig: scrollGroup (scroll-linked spin) > floatGroup (hover bob) > bottle
    const scrollGroup = new THREE.Group();
    const floatGroup = new THREE.Group();
    scrollGroup.add(floatGroup);
    floatGroup.add(bottle.root);
    scene.add(scrollGroup);

    // Parts animated by the Anatomy View (swapped out if a real .glb model loads)
    const dummy = () => new THREE.Object3D();
    const parts = {
      cap: bottle.capGroup as THREE.Object3D,
      collar: bottle.collarMesh as THREE.Object3D,
      water: bottle.waterMesh as THREE.Object3D,
      label: bottle.labelMesh as THREE.Object3D,
    };
    let baseCapY = parts.cap.position.y;
    let baseCollarY = parts.collar.position.y;
    let baseWaterY = parts.water.position.y;
    const baseLabelScale = 1;

    let disposed = false;
    loadBottleModel(product.bottleStyle).then((model) => {
      if (!model || disposed) return;
      floatGroup.remove(bottle.root);
      floatGroup.add(model.root);
      parts.cap = model.cap ?? dummy();
      parts.collar = dummy();
      parts.water = model.water ?? dummy();
      parts.label = model.label ?? dummy();
      baseCapY = parts.cap.position.y;
      baseCollarY = parts.collar.position.y;
      baseWaterY = parts.water.position.y;
    });

    const scroll = trackScrollProgress(container);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const fx = createPostFX(renderer, scene, camera, isSoftwareGl, {
      dofTarget: new THREE.Vector3(0, 1.85, 0),
      dofBokehScale: 1.4,
      bloom: { intensity: 0.5, threshold: 1.15, smoothing: 0.1, radius: 0.55 },
      vignette: { darkness: 0.22, offset: 0.4 },
      // Khronos PBR Neutral keeps label/brand colours true-to-life
      toneMapping: ToneMappingMode.NEUTRAL,
    });
    // Pre-compensated so it lands on the page's #EFECE6 after tone mapping
    if (fx.active) scene.background = new THREE.Color(0xfdfaf4);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || 600;
      const h = container.clientHeight || 520;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      fx.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();
    const timerRef = { id: 0 };

    const tick = () => {
      if (disposed) return;
      const dt = Math.min(clock.getDelta(), 0.05);

      const elapsed = clock.elapsedTime;
      if (!prefersReduced) {
        floatGroup.rotation.y += dt * 0.28;
        // Weightless hover: slow bob + gentle drift tilt above the plinth
        floatGroup.position.y = 0.07 + Math.sin(elapsed * 1.1) * 0.05;
        floatGroup.rotation.z = Math.sin(elapsed * 0.7) * 0.035;
        floatGroup.rotation.x = Math.cos(elapsed * 0.55) * 0.025;
        // Scroll-linked half turn as the viewer passes through the viewport
        scrollGroup.rotation.y = THREE.MathUtils.damp(
          scrollGroup.rotation.y,
          (scroll.progress.value - 0.5) * Math.PI,
          5,
          dt
        );
      }

      // Smooth exploded anatomy transition
      const isExp = explodedRef.current;
      parts.cap.position.y = THREE.MathUtils.damp(
        parts.cap.position.y,
        isExp ? baseCapY + 0.65 : baseCapY,
        7,
        dt
      );
      parts.collar.position.y = THREE.MathUtils.damp(
        parts.collar.position.y,
        isExp ? baseCollarY + 0.32 : baseCollarY,
        7,
        dt
      );
      parts.water.position.y = THREE.MathUtils.damp(
        parts.water.position.y,
        isExp ? baseWaterY - 0.12 : baseWaterY,
        7,
        dt
      );
      const targetScale = isExp ? 1.09 : baseLabelScale;
      parts.label.scale.x = THREE.MathUtils.damp(parts.label.scale.x, targetScale, 7, dt);
      parts.label.scale.z = THREE.MathUtils.damp(parts.label.scale.z, targetScale, 7, dt);

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
      controls.dispose();
      gate.dispose();
      scroll.dispose();
      fx.dispose();
      disposeHdri();
      plinthGeo.dispose();
      plinthMat.dispose();
      envTexture.dispose();
      pmremGenerator.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [product.id]);

  if (!webglOk || product.bottleStyle === 'bulk_box') {
    return (
      <BottleArtwork
        brandName={brandName}
        bottleStyle={product.bottleStyle}
        capColor={product.capColor}
        tintColor={product.tintColor}
        labelAccent={product.labelAccent}
        sizeLabel={product.bottleSizeLabel}
        waterType={product.waterType}
        packaging={product.packaging}
        className="w-full h-[340px] sm:h-[460px] rounded-2xl border border-black/5"
      />
    );
  }

  return (
    <div className="relative w-full h-[340px] sm:h-[460px] lg:h-[520px] overflow-hidden rounded-2xl border border-black/5 bg-[#EFECE6]">
      <div ref={mountRef} data-lenis-prevent className="w-full h-full" />
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 rounded-xl border border-black/10 px-3 py-1.5 shadow-sm"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.92)' }}
      >
        <span className="text-xs text-slate-600 px-1.5 whitespace-nowrap">Drag to rotate 360°</span>
        <span className="h-3.5 w-px bg-black/10" aria-hidden="true" />
        <button
          onClick={() => setExploded((e) => !e)}
          className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
            exploded ? 'bg-[#0F5C6E] text-white' : 'text-[#14181F] hover:bg-black/5'
          }`}
        >
          {exploded ? 'Assemble Vessel' : 'Anatomy View'}
        </button>
      </div>
    </div>
  );
}
