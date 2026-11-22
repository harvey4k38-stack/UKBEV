import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import type { Brand, ScenePreset } from '../types';
import { responsiveImg } from '../lib/img';

/**
 * Cinematic "where your water comes from" experience for a brand origin page.
 * Real landscape photography with slow camera moves between journey stages, plus an
 * animated geological cross-section. Pure CSS/SVG: no WebGL, smooth on phones.
 */

interface Strata {
  surface: string;
  layers: { name: string; color: string }[];
  water: string;
}

const STRATA: Partial<Record<ScenePreset, Strata>> & { alps: Strata } = {
  alps: {
    surface: '#6f8a6a',
    layers: [
      { name: 'Glacial moraine sand', color: '#c8b48c' },
      { name: 'Impermeable clay seal', color: '#8b735c' },
      { name: 'Alpine bedrock', color: '#5e6872' },
    ],
    water: '#3b9cc4',
  },
  fiji: {
    surface: '#2f6b45',
    layers: [
      { name: 'Rainforest soil', color: '#6e5a3c' },
      { name: 'Ancient volcanic rock', color: '#4a4f57' },
      { name: 'Confined artesian chamber', color: '#33383f' },
    ],
    water: '#2aa5c4',
  },
  scotland: {
    surface: '#5d6b4a',
    layers: [
      { name: 'Moorland peat', color: '#5a4a3a' },
      { name: 'Old Red Sandstone', color: '#9a5e47' },
      { name: 'Ochil volcanic basalt', color: '#464b50' },
    ],
    water: '#3d8fae',
  },
  iceland: {
    surface: '#4d5a45',
    layers: [
      { name: 'Lava field', color: '#2f3237' },
      { name: 'Porous volcanic rock', color: '#4d5157' },
      { name: 'Basalt bedrock', color: '#26292d' },
    ],
    water: '#36a9d6',
  },
  tongariro: {
    surface: '#8a7a4e',
    layers: [
      { name: 'Volcanic ash soil', color: '#7d6a4a' },
      { name: 'Volcanic basalt', color: '#4a4643' },
      { name: 'Blue rock aquifer', color: '#4f5f6e' },
    ],
    water: '#3796b8',
  },
};

/** Where the "camera" looks on the photo for each stage: catchment → filtration → spring. */
const FOCUS = [
  { x: 50, y: 22, scale: 1.18 },
  { x: 38, y: 58, scale: 1.28 },
  { x: 62, y: 82, scale: 1.34 },
];

const STAGE_LABELS = ['Catchment', 'Filtration', 'Source'];
const STEP_MS = 7000;

export function SourceJourney({ brand }: { brand: Brand }) {
  const steps = brand.markers.slice(0, 3);
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [inView, setInView] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const reduced =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const strata = STRATA[brand.scenePreset] ?? STRATA.alps;
  const img = responsiveImg(brand.heroImage, '(min-width: 1280px) 1216px, 100vw');

  useEffect(() => setActive(0), [brand.id]);

  // Only animate while on screen
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Auto-advance through the journey
  useEffect(() => {
    if (!playing || !inView || reduced || steps.length < 2) return;
    const t = window.setTimeout(() => setActive((a) => (a + 1) % steps.length), STEP_MS);
    return () => clearTimeout(t);
  }, [active, playing, inView, reduced, steps.length]);

  // Subtle pointer parallax (desktop only)
  const onPointerMove = (e: React.PointerEvent) => {
    if (reduced || e.pointerType !== 'mouse' || !parallaxRef.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const dx = (e.clientX - r.left) / r.width - 0.5;
    const dy = (e.clientY - r.top) / r.height - 0.5;
    parallaxRef.current.style.transform = `translate3d(${dx * -18}px, ${dy * -12}px, 0)`;
  };
  const onPointerLeave = () => {
    if (parallaxRef.current) parallaxRef.current.style.transform = 'translate3d(0,0,0)';
  };

  const choose = (i: number) => {
    setActive(i);
    setPlaying(false);
  };

  const focus = FOCUS[Math.min(active, FOCUS.length - 1)];
  const step = steps[active];

  return (
    <div ref={rootRef} className="space-y-4">
      {/* Cinematic landscape */}
      <div
        className="relative h-[440px] sm:h-[540px] lg:h-[600px] w-full overflow-hidden rounded-2xl bg-[#0B141E] isolate"
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        <div
          ref={parallaxRef}
          className="absolute -inset-6 transition-transform duration-700 ease-out will-change-transform"
        >
          <img
            {...img}
            alt={`${brand.sourceName}, ${brand.region}`}
            fetchPriority="high"
            decoding="async"
            className="h-full w-full object-cover will-change-transform"
            style={{
              transformOrigin: `${focus.x}% ${focus.y}%`,
              transform: `scale(${reduced ? 1.04 : focus.scale})`,
              transition: 'transform 3.2s cubic-bezier(0.22, 0.61, 0.36, 1), transform-origin 3.2s cubic-bezier(0.22, 0.61, 0.36, 1)',
            }}
          />
        </div>

        {/* Legibility gradients */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#060d14]/90 via-[#060d14]/25 to-[#060d14]/10" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#060d14]/55 via-transparent to-transparent" />

        {/* Elevation / coordinates chip */}
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-3 text-[11px] text-white/80">
          <span className="rounded-full bg-black/35 backdrop-blur-md px-3 py-1.5 font-mono tabular-nums">
            {brand.coordinates.lat.toFixed(2)}°, {brand.coordinates.lng.toFixed(2)}°
          </span>
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="inline-flex items-center gap-1.5 rounded-full bg-black/35 backdrop-blur-md px-3 py-1.5 hover:bg-black/50"
            aria-label={playing ? 'Pause journey' : 'Play journey'}
          >
            {playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            {playing ? 'Pause' : 'Play'}
          </button>
        </div>

        {/* Stage caption */}
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8 lg:p-10">
          {step && (
            <div key={`${brand.id}-${active}`} className="max-w-xl journey-caption">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8fd3e8]">
                {String(active + 1).padStart(2, '0')} · {STAGE_LABELS[active] ?? 'Stage'} · {step.elevationLabel}
              </p>
              <h3 className="mt-2 font-editorial text-3xl sm:text-4xl lg:text-5xl font-semibold text-white leading-tight">
                {step.title}
              </h3>
              <p className="mt-3 text-sm sm:text-base leading-relaxed text-white/85">{step.description}</p>
            </div>
          )}

          {/* Stepper with progress */}
          <div className="mt-6 grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
            {steps.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => choose(i)}
                className="group text-left"
                aria-current={i === active ? 'step' : undefined}
              >
                <span className="block h-[3px] w-full overflow-hidden rounded-full bg-white/20">
                  <span
                    className={`block h-full rounded-full bg-white ${
                      i === active && playing && inView && !reduced ? 'journey-progress' : ''
                    }`}
                    style={{
                      width: i < active ? '100%' : i === active ? (playing && inView && !reduced ? undefined : '100%') : '0%',
                      animationDuration: `${STEP_MS}ms`,
                    }}
                  />
                </span>
                <span
                  className={`mt-2 block truncate text-[11px] sm:text-xs font-medium transition-colors ${
                    i === active ? 'text-white' : 'text-white/55 group-hover:text-white/80'
                  }`}
                >
                  {s.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Geological cross-section */}
      <AquiferSection strata={strata} active={active} animate={inView && !reduced} filtration={brand.filtrationProcess} />
    </div>
  );
}

function AquiferSection({
  strata,
  active,
  animate,
  filtration,
}: {
  strata: Strata;
  active: number;
  animate: boolean;
  filtration: string;
}) {
  const [l1, l2, l3] = strata.layers;
  // Water path: rain falls on the hills (left), seeps down through the layers, emerges at the spring (right)
  const flow = 'M90 62 C 120 110, 170 130, 240 150 S 420 205, 560 196 S 700 150, 742 116';
  const dim = (i: number) => (active === i ? 1 : 0.55);

  return (
    <div className="rounded-2xl border border-black/8 bg-white p-4 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#0F5C6E]">How it&apos;s filtered</p>
        <p className="text-xs text-slate-500 max-w-md">{filtration}</p>
      </div>
      <svg viewBox="0 0 800 260" className="w-full h-auto" role="img" aria-label="Cross-section of the rock layers that filter the water">
        <defs>
          <linearGradient id="aq-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#eef4f8" />
            <stop offset="1" stopColor="#f8f7f4" />
          </linearGradient>
          <linearGradient id="aq-water" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={strata.water} stopOpacity="0.15" />
            <stop offset="0.5" stopColor={strata.water} stopOpacity="0.55" />
            <stop offset="1" stopColor={strata.water} stopOpacity="0.85" />
          </linearGradient>
          <pattern id="aq-grain" width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="0.7" fill="#000" opacity="0.08" />
            <circle cx="4.5" cy="4" r="0.5" fill="#fff" opacity="0.08" />
          </pattern>
          <clipPath id="aq-clip">
            <rect x="0" y="0" width="800" height="260" rx="14" />
          </clipPath>
        </defs>

        <g clipPath="url(#aq-clip)">
          <rect width="800" height="260" fill="url(#aq-sky)" />

          {/* Rain over the catchment */}
          <g opacity={dim(0)} style={{ transition: 'opacity .8s' }}>
            {Array.from({ length: 14 }).map((_, i) => (
              <line
                key={i}
                x1={40 + i * 13}
                y1={-10}
                x2={34 + i * 13}
                y2={6}
                stroke={strata.water}
                strokeWidth="1.6"
                strokeLinecap="round"
                className={animate ? 'aq-rain' : ''}
                style={{ animationDelay: `${(i * 137) % 900}ms` }}
              />
            ))}
          </g>

          {/* Layers (bottom-up) */}
          <path d="M0 175 C 200 190, 420 215, 800 200 L800 260 L0 260Z" fill={l3.color} opacity={dim(2) + 0.35} style={{ transition: 'opacity .8s' }} />
          <path d="M0 120 C 180 140, 380 170, 800 150 L800 205 C 420 218, 200 192, 0 178Z" fill={l2.color} opacity={dim(1) + 0.35} style={{ transition: 'opacity .8s' }} />
          <path d="M0 70 C 90 30, 150 40, 230 80 S 420 120, 560 112 S 720 92, 800 100 L800 152 C 380 172, 180 142, 0 122Z" fill={l1.color} opacity={dim(0) + 0.35} style={{ transition: 'opacity .8s' }} />
          {/* Surface vegetation band */}
          <path d="M0 70 C 90 30, 150 40, 230 80 S 420 120, 560 112 S 720 92, 800 100 L800 108 C 720 100, 640 112, 560 120 S 420 128, 230 88 S 90 38, 0 78Z" fill={strata.surface} />
          <rect width="800" height="260" fill="url(#aq-grain)" />

          {/* Aquifer lens */}
          <path
            d="M240 170 C 360 200, 520 210, 680 182 C 600 196, 420 196, 240 170Z"
            fill="url(#aq-water)"
            opacity={active === 2 ? 1 : 0.6}
            style={{ transition: 'opacity .8s' }}
          />

          {/* Flowing water path */}
          <path d={flow} fill="none" stroke={strata.water} strokeOpacity="0.25" strokeWidth="5" strokeLinecap="round" />
          <path
            d={flow}
            fill="none"
            stroke={strata.water}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="6 14"
            className={animate ? 'aq-flow' : ''}
          />
          {animate &&
            [0, 1.6, 3.2].map((delay) => (
              <circle key={delay} r="4.5" fill="#fff" stroke={strata.water} strokeWidth="2">
                <animateMotion dur="4.8s" begin={`${delay}s`} repeatCount="indefinite" path={flow} rotate="auto" />
              </circle>
            ))}

          {/* Spring outlet */}
          <g transform="translate(742 116)">
            <circle r="9" fill={strata.water} opacity="0.2" className={animate ? 'aq-pulse' : ''} />
            <circle r="5" fill={strata.water} />
          </g>
        </g>

        {/* Labels */}
        <g fontSize="12" fontFamily="inherit" fill="#14181F">
          <text x="24" y="104" fontWeight={active === 0 ? 700 : 500}>{l1.name}</text>
          <text x="24" y="160" fontWeight={active === 1 ? 700 : 500} fill="#fff">{l2.name}</text>
          <text x="24" y="226" fontWeight={active === 2 ? 700 : 500} fill="#fff">{l3.name}</text>
          <text x="736" y="96" textAnchor="end" fontWeight="700" fill={strata.water}>Spring</text>
        </g>
      </svg>
    </div>
  );
}
