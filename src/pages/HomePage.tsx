import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, MapPin, RefreshCw, ShieldCheck } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { HydrationPlanner } from '../components/HydrationPlanner';
import { SeoHead } from '../components/SeoHead';
import { WaterFinder } from '../components/WaterFinder';
import { DistributionStatement, FlagshipShowcase, SecondaryBrands, SoleDistributorBadge } from '../components/Flagship';
import { isFlagship } from '../lib/flagship';
import { useStore } from '../context/StoreContext';
import { HeroGlobe3D } from '../three/lazy';
import type { Brand } from '../types';

export function HomePage() {
  const {
    brands,
    products,
    marketing,
    navigate,
    checkPostcode,
    postcodeResult,
    savedPostcode,
  } = useStore();

  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [postcodeInput, setPostcodeInput] = useState(savedPostcode || '');
  const [checkingPc, setCheckingPc] = useState(false);

  const featuredProducts = (marketing?.featuredProductIds || [])
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .slice(0, 6);

  // Wider range (Tongariro has its own showcase above): photographed packs, then admin-chosen featured lines
  const photographed = products.filter((p) => p.imageUrl && !isFlagship(p));
  const displayProducts = [
    ...photographed,
    ...(featuredProducts.length > 0 ? featuredProducts : products).filter((p) => !p.imageUrl && !isFlagship(p)),
  ].slice(0, 6);

  const handlePostcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckingPc(true);
    try {
      await checkPostcode(postcodeInput);
    } finally {
      setCheckingPc(false);
    }
  };

  return (
    <div>
      <SeoHead
        title="Tongariro Natural Spring Water UK – Sole UK Distributor | UK Beverages"
        description="UK Beverages is the sole UK distributor of Tongariro Natural Spring Water from New Zealand. Order Tongariro, plus Evian, FIJI Water, Highland Spring and Icelandic Glacial, with UK delivery and subscriptions."
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'UK Beverages',
          description:
            'Sole UK distributor of Tongariro Natural Spring Water (New Zealand), also supplying Evian, FIJI Water, Highland Spring and Icelandic Glacial.',
          url: window.location.origin,
          areaServed: 'GB',
        }}
      />

      {/* Section 1: Full-Bleed Cinematic 3D Globe Hero */}
      {/* Phones: globe on top, copy underneath. Desktop: copy floats over a full-bleed globe. */}
      <section className="relative w-full bg-[#08121C] overflow-hidden md:h-[86vh] md:min-h-[620px] md:max-h-[860px]">
        <div className="relative h-[54svh] min-h-[340px] max-h-[520px] md:absolute md:inset-0 md:h-auto md:max-h-none">
          <HeroGlobe3D
            brands={brands}
            selectedBrandId={selectedBrand?.id || null}
            onSelectBrand={(b) => setSelectedBrand(b)}
            onExploreBrand={(slug) => navigate(slug === 'tongariro' ? '/tongariro' : `/brands/${slug}`)}
            onShopBrand={() => navigate('/tongariro#collection')}
          />
        </div>

        {/* Editorial Hero Overlay (left-aligned, never covering central globe markers) */}
        <div className="pointer-events-none relative md:absolute md:inset-0 z-10 flex items-end md:items-center pt-1 pb-6 md:py-0">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-8">
            <div
              className="pointer-events-auto max-w-lg rounded-2xl border border-white/10 p-5 sm:p-8 text-white shadow-2xl backdrop-blur-sm"
              style={{ backgroundColor: 'rgba(8, 18, 28, 0.78)' }}
            >
              <SoleDistributorBadge />
              <p className="mt-4 text-xs font-medium tracking-[0.25em] uppercase text-[#C9D6C0]">
                Tongariro Natural Spring Water · New Zealand
              </p>
              <h1 className="mt-3 font-editorial text-[1.75rem] sm:text-5xl font-semibold leading-[1.05] tracking-tight text-white">
                NEW ZEALAND&apos;S FINEST WATER. NOW IN THE UK.
              </h1>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base leading-relaxed text-slate-300">
                Discover Tongariro Natural Spring Water, exclusively distributed in the UK by UK Beverages. Explore its New Zealand
                origins and our wider collection of premium international waters.
              </p>

              <div className="mt-6 grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-3">
                <button
                  onClick={() => navigate('/tongariro')}
                  className="rounded-lg bg-white px-5 py-3.5 sm:py-3 text-sm sm:text-xs font-semibold tracking-wide text-[#08121C] hover:bg-slate-200 transition-colors whitespace-nowrap"
                >
                  EXPLORE TONGARIRO
                </button>
                <button
                  onClick={() => navigate('/shop')}
                  className="rounded-lg border border-white/25 px-5 py-3.5 sm:py-3 text-sm sm:text-xs font-semibold tracking-wide text-white hover:bg-white/10 transition-colors whitespace-nowrap"
                >
                  SHOP ALL WATER
                </button>
              </div>

              <p className="hidden md:block mt-5 text-[11px] text-slate-400">
                Drag to spin the globe. Tap a marker to explore Tongariro and our other origins.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Flagship: Tongariro, its collection, our distribution role */}
      <FlagshipShowcase />
      <DistributionStatement tone="light" />

      {/* Supporting brands */}
      <SecondaryBrands />

      {/* Find-your-water quiz */}
      <WaterFinder />

      {/* Section 3: Featured Retail Selection */}
      <section className="border-y border-black/8 bg-[#EFECE6]/55 py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#0F5C6E]">
                The wider collection
              </p>
              <h2 className="mt-2 font-editorial text-3xl sm:text-4xl font-semibold text-[#14181F]">
                Popular cases from around the world
              </h2>
            </div>
            <button
              onClick={() => navigate('/shop')}
              className="inline-flex items-center gap-2 rounded-lg bg-[#14181F] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#0F5C6E] transition-colors whitespace-nowrap"
            >
              View Full Catalogue <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                brand={brands.find((b) => b.id === product.brandId)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Subscriptions & Live UK Postcode Checker */}
      <section className="mx-auto max-w-7xl px-4 sm:px-8 py-14 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-12">
            <HydrationPlanner />
          </div>

          <div className="lg:col-span-12 rounded-2xl border border-black/8 bg-[#14181F] text-white p-6 sm:p-10 flex flex-col justify-between">
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#7CC4D8]">
                <MapPin className="h-3.5 w-3.5" />
                <span>UK Delivery Coverage</span>
              </div>
              <h3 className="font-editorial text-2xl sm:text-3xl font-semibold text-white">
                Check Delivery to Your Postcode
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Enter your UK postcode to view exact courier pricing, dispatch estimates, and free delivery thresholds before checkout.
              </p>

              <form onSubmit={handlePostcodeSubmit} className="pt-2 flex gap-2">
                <input
                  type="text"
                  value={postcodeInput}
                  onChange={(e) => setPostcodeInput(e.target.value)}
                  placeholder="e.g. SW1X 0AZ"
                  aria-label="UK Postcode"
                  className="flex-1 rounded-lg border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm font-mono uppercase text-white placeholder:text-slate-400 focus:border-[#7CC4D8] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={checkingPc}
                  className="rounded-lg bg-white px-4 py-2.5 text-xs font-semibold text-[#14181F] hover:bg-slate-200 transition-colors whitespace-nowrap"
                >
                  {checkingPc ? 'Checking…' : 'Check'}
                </button>
              </form>

              {postcodeResult && (
                <div className="mt-4 rounded-xl border border-white/15 bg-white/5 p-4 text-xs space-y-1.5">
                  {postcodeResult.deliverable && postcodeResult.zone ? (
                    <>
                      <p className="font-semibold text-[#7CC4D8]">
                        Deliverable · {postcodeResult.normalizedPostcode} ({postcodeResult.zone.name})
                      </p>
                      <p className="text-slate-200 font-mono tabular-nums">
                        Standard: £{postcodeResult.zone.feeGbp.toFixed(2)} (Free over £
                        {postcodeResult.zone.freeThresholdGbp.toFixed(2)})
                      </p>
                      <p className="text-slate-400">Est. transit: {postcodeResult.zone.estimatedDays}</p>
                    </>
                  ) : (
                    <p className="text-amber-300">{postcodeResult.reason}</p>
                  )}
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-white/10 mt-6">
              <button
                onClick={() => navigate('/delivery')}
                className="text-xs font-semibold text-[#7CC4D8] hover:text-white transition-colors"
              >
                View Full UK Delivery Zones &amp; Rates →
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
