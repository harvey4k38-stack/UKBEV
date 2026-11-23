import React, { useState } from 'react';
import { ArrowLeft, Droplets, Mountain, Satellite } from 'lucide-react';
import { LazyGoogleEarthOriginMap as GoogleEarthOriginMap } from '../components/LazyGoogleEarthOriginMap';
import { ProductCard } from '../components/ProductCard';
import { SeoHead } from '../components/SeoHead';
import { useStore } from '../context/StoreContext';
import { SourceJourney } from '../components/SourceJourney';
import { responsiveImg } from '../lib/img';
import { factsVerified } from '../lib/flagship';

export function BrandPage({ slug }: { slug: string }) {
  const { brands, products, navigate } = useStore();
  const [sourceView, setSourceView] = useState<'journey' | 'satellite'>('journey');
  const brand = brands.find((b) => b.slug === slug);

  if (!brand) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center space-y-4">
        <h1 className="font-editorial text-3xl font-semibold">Source Not Found</h1>
        <p className="text-sm text-slate-600">This water origin page is unavailable.</p>
        <button
          onClick={() => navigate('/origins')}
          className="rounded-lg bg-[#14181F] px-5 py-2.5 text-xs font-semibold text-white"
        >
          View All Brand Origins
        </button>
      </div>
    );
  }

  const brandProducts = products.filter((p) => p.brandId === brand.id);
  const minerals = [
    { label: 'pH', val: String(brand.mineralProfile.ph), unit: '' },
    { label: 'Total Dissolved Solids', val: String(brand.mineralProfile.tds), unit: 'mg/L' },
    { label: 'Calcium (Ca²⁺)', val: brand.mineralProfile.calcium, unit: 'mg/L' },
    { label: 'Magnesium (Mg²⁺)', val: brand.mineralProfile.magnesium, unit: 'mg/L' },
    { label: 'Bicarbonate (HCO₃⁻)', val: brand.mineralProfile.bicarbonate, unit: 'mg/L' },
    { label: 'Silica (SiO₂)', val: brand.mineralProfile.silica, unit: 'mg/L' },
    { label: 'Sodium (Na⁺)', val: brand.mineralProfile.sodium, unit: 'mg/L' },
    { label: 'Potassium (K⁺)', val: brand.mineralProfile.potassium, unit: 'mg/L' },
    { label: 'Sulphate (SO₄²⁻)', val: brand.mineralProfile.sulphate, unit: 'mg/L' },
    { label: 'Chloride (Cl⁻)', val: brand.mineralProfile.chloride, unit: 'mg/L' },
  ].filter((m) => m.val !== undefined && factsVerified(brand));

  return (
    <div>
      <SeoHead
        title={`${brand.name} UK Delivery – ${brand.sourceName}, ${brand.country} | UK Beverages`}
        description={`Explore ${brand.name} at its natural source in ${brand.region}, ${brand.country}, and order verified packs for UK home delivery.`}
      />

      {/* Editorial Header & 3D Source Environment */}
      <section className="mx-auto max-w-7xl px-4 sm:px-8 pt-6 sm:pt-8 pb-12 sm:pb-16">
        <button
          onClick={() => navigate('/origins')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-[#14181F] mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All Five Brand Origins
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-8">
          <div className="lg:col-span-8 space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-[#0F5C6E]">{brand.country}</span>
              <span aria-hidden="true">·</span>
              <span>{brand.region}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {brand.coordinates.lat.toFixed(2)}°, {brand.coordinates.lng.toFixed(2)}°
              </span>
            </div>
            <h1 className="font-editorial text-4xl sm:text-5xl font-semibold text-[#14181F]">
              {brand.name}
            </h1>
            <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
              {brand.tagline}
            </p>
          </div>

          <div className="lg:col-span-4 flex flex-wrap lg:justify-end items-center gap-3">
            <div className="inline-flex rounded-lg border border-black/10 bg-white p-1 text-xs">
              <button
                type="button"
                onClick={() => setSourceView('journey')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors ${
                  sourceView === 'journey'
                    ? 'bg-[#14181F] text-white'
                    : 'text-slate-600 hover:text-[#14181F]'
                }`}
              >
                <Mountain className="h-3.5 w-3.5" />
                Source Journey
              </button>
              <button
                type="button"
                onClick={() => setSourceView('satellite')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors ${
                  sourceView === 'satellite'
                    ? 'bg-[#14181F] text-white'
                    : 'text-slate-600 hover:text-[#14181F]'
                }`}
              >
                <Satellite className="h-3.5 w-3.5" />
                Satellite
              </button>
            </div>
            <a
              href="#brand-catalogue"
              className="rounded-lg bg-[#14181F] px-5 py-3 text-xs font-semibold text-white hover:bg-[#0F5C6E] transition-colors whitespace-nowrap"
            >
              Shop {brand.name} ({brandProducts.length})
            </a>
          </div>
        </div>

        {/* Interactive 3D Environment or Real Google Maps Satellite Terrain */}
        {sourceView === 'journey' ? (
          <SourceJourney brand={brand} />
        ) : (
          <div className="relative h-[500px] sm:h-[560px] w-full overflow-hidden rounded-2xl border border-black/10 bg-[#0B141E] shadow-sm">
            <GoogleEarthOriginMap
              brands={[brand]}
              selectedBrandId={brand.id}
              onSelectBrand={() => {}}
              defaultRange={14000}
              defaultZoom={12}
            />
          </div>
        )}
      </section>

      {/* Source Narrative + Photorealistic Landscape + Verified Mineral Profile */}
      <section className="border-y border-black/8 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div className="overflow-hidden rounded-2xl border border-black/8 bg-[#EFECE6]">
              <img
                {...responsiveImg(brand.heroImage, '(min-width: 1024px) 700px, 100vw')}
                alt={`${brand.sourceName} landscape in ${brand.region}`}
                loading="lazy"
                decoding="async"
                className="h-72 sm:h-80 w-full object-cover"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#0F5C6E]">
                <Mountain className="h-4 w-4" />
                <span>Geological Provenance</span>
              </div>
              <h2 className="font-editorial text-3xl font-semibold text-[#14181F]">
                {brand.sourceName}
              </h2>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                {brand.description}
              </p>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                {brand.geologicalStory}
              </p>
              {brand.accuracyNote && (
                <div className="rounded-xl border border-black/10 bg-[#F8F7F4] p-4 text-xs text-slate-700 leading-relaxed">
                  <strong className="text-[#14181F]">Source Accuracy Note:</strong> {brand.accuracyNote}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 rounded-2xl border border-black/10 bg-[#F8F7F4] p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-black/10 pb-4">
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-[#0F5C6E]" />
                <h3 className="text-base font-semibold text-[#14181F]">
                  Typical Mineral Analysis
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500">mg/L</span>
            </div>

            <dl className="divide-y divide-black/6 text-sm">
              {minerals.map((m) => (
                <div key={m.label} className="py-2.5 flex items-center justify-between">
                  <dt className="text-slate-600">{m.label}</dt>
                  <dd className="font-mono tabular-nums font-medium text-[#14181F]">
                    {m.val} {m.unit}
                  </dd>
                </div>
              ))}
            </dl>

            {brand.mineralProfile.notes && (
              <p className="pt-2 text-xs text-slate-500 leading-relaxed border-t border-black/10">
                {brand.mineralProfile.notes}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Brand Shopping Catalogue */}
      <section id="brand-catalogue" className="mx-auto max-w-7xl px-4 sm:px-8 py-16">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#0F5C6E]">
              Available for UK Delivery
            </p>
            <h2 className="mt-1 font-editorial text-3xl sm:text-4xl font-semibold text-[#14181F]">
              {brand.name} Range
            </h2>
          </div>
          <button
            onClick={() => navigate('/shop')}
            className="text-xs font-semibold text-[#0F5C6E] hover:underline"
          >
            Browse All Brands →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brandProducts.map((product) => (
            <ProductCard key={product.id} product={product} brand={brand} />
          ))}
        </div>
      </section>

      {/* Cross-link to the flagship */}
      <section className="mx-auto max-w-7xl px-4 sm:px-8 pb-14">
        <button
          onClick={() => navigate('/tongariro')}
          className="flex w-full flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-[#121518] px-6 py-5 text-left text-white"
        >
          <span>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-[#A9BE95]">Our flagship · Sole UK distributor</span>
            <span className="block font-editorial text-2xl font-semibold">Discover Tongariro Natural Spring Water from New Zealand</span>
          </span>
          <span className="text-xs font-semibold text-[#C9D6C0] whitespace-nowrap">Explore Tongariro →</span>
        </button>
      </section>
    </div>
  );
}
