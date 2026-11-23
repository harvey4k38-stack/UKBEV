import React, { useState } from 'react';
import { ArrowDown, ArrowRight, Droplets, Leaf, MapPin, Mountain, Package } from 'lucide-react';
import { SeoHead } from '../components/SeoHead';
import {
  DistributionStatement,
  NZ_CRATER,
  NZ_LAKE,
  SecondaryBrands,
  SoleDistributorBadge,
  TONGARIRO_HERO,
  TongariroCollection,
} from '../components/Flagship';
import { ProductImage } from '../components/ProductImage';
import { useStore } from '../context/StoreContext';
import { FLAGSHIP_BRAND_ID, fact, factsVerified, tongariroProducts } from '../lib/flagship';
import { responsiveImg } from '../lib/img';
import { HeroGlobe3D } from '../three/lazy';

/**
 * The flagship brand experience. Copy is limited to what we can stand behind:
 * New Zealand natural spring water, bottled at source, distributed in the UK solely by UK Beverages.
 * Source/mineral figures appear only once the brand is marked factsVerified (supplier spec sheet).
 */
export function TongariroPage() {
  const { brands, products, navigate } = useStore();
  const brand = brands.find((b) => b.id === FLAGSHIP_BRAND_ID);
  const range = tongariroProducts(products);
  const [exploring, setExploring] = useState(false);
  const hero = responsiveImg(TONGARIRO_HERO, '100vw');
  const verified = factsVerified(brand);
  const showcase = range.find((p) => p.bottleSizeMl === 750) || range[0];

  const goCollection = () => navigate('/tongariro#collection');

  return (
    <div className="bg-[#121518] text-white">
      <SeoHead
        title="Tongariro Natural Spring Water UK – Sole UK Distributor | UK Beverages"
        description="Tongariro Natural Spring Water from New Zealand, available in the UK exclusively through UK Beverages. Shop 500ml, 750ml and 1.5L cases with UK delivery and subscriptions."
      />

      {/* 1 · Introduction */}
      <section className="relative min-h-[88svh] overflow-hidden">
        <img {...hero} alt="Snow-capped volcano above an alpine stream in New Zealand's Tongariro region" className="absolute inset-0 h-full w-full object-cover" fetchPriority="high" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#121518]/40 via-[#121518]/20 to-[#121518]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#121518]/70 via-transparent to-transparent" />
        <div className="relative mx-auto flex min-h-[88svh] max-w-7xl flex-col justify-end px-4 sm:px-8 pb-14 sm:pb-20">
          <div className="max-w-3xl space-y-5">
            <SoleDistributorBadge />
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.3em] text-[#C9D6C0]">
              Tongariro Natural Spring Water · New Zealand
            </p>
            <h1 className="font-editorial text-5xl sm:text-7xl lg:text-8xl font-semibold leading-[0.95]">
              From the heart of New Zealand.
            </h1>
            <p className="max-w-xl text-base sm:text-lg text-slate-200 leading-relaxed">
              A natural spring water from New Zealand, bottled at source and named for the volcanic Tongariro region of the
              central North Island. In the UK, it&apos;s available exclusively through UK Beverages.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button onClick={goCollection} className="rounded-lg bg-white px-6 py-3.5 text-xs font-semibold tracking-wide text-[#121518] hover:bg-slate-200">
                SHOP THE COLLECTION
              </button>
              <button
                onClick={() => navigate('/tongariro#origin')}
                className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-6 py-3.5 text-xs font-semibold tracking-wide hover:bg-white/10"
              >
                EXPLORE THE ORIGIN <ArrowDown className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2 · Explore the origin */}
      <section id="origin" className="scroll-mt-20 mx-auto max-w-7xl px-4 sm:px-8 py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end mb-10">
          <div className="lg:col-span-7">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A9BE95]">Explore the origin</p>
            <h2 className="mt-3 font-editorial text-4xl sm:text-5xl font-semibold leading-[1.05]">
              Volcanic peaks, alpine tussock, clear mountain water.
            </h2>
          </div>
          <p className="lg:col-span-5 text-sm sm:text-base text-slate-300 leading-relaxed">
            Tongariro National Park, a UNESCO World Heritage Site, is New Zealand&apos;s oldest national park, a high volcanic
            plateau of crater lakes, lava fields and snow-fed streams. It&apos;s the landscape this water is named for.
          </p>
        </div>

        {/* Interactive 3D globe, flown to New Zealand */}
        <div className="relative h-[440px] sm:h-[560px] overflow-hidden rounded-2xl border border-white/10">
          {exploring ? (
            <HeroGlobe3D
              brands={brands}
              selectedBrandId={FLAGSHIP_BRAND_ID}
              onSelectBrand={() => undefined}
              onExploreBrand={() => navigate('/tongariro#collection')}
              onShopBrand={goCollection}
              compact
            />
          ) : (
            <button onClick={() => setExploring(true)} className="group absolute inset-0 block text-left">
              <img src={NZ_CRATER.src} srcSet={`${NZ_CRATER.small} 800w, ${NZ_CRATER.src} 1600w`} sizes="(min-width: 1280px) 1216px, 100vw" alt="Volcanic terrain and a crater lake in Tongariro National Park" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#121518]/90 via-[#121518]/30 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-[#C9D6C0]">Interactive 3D</p>
                  <p className="mt-1 font-editorial text-2xl sm:text-3xl font-semibold">Fly to New Zealand on the globe</p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-xs font-semibold text-[#121518]">
                  <MapPin className="h-4 w-4" /> Start exploring
                </span>
              </div>
            </button>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { img: NZ_LAKE, alt: 'Crater lake beneath cloud on the Tongariro plateau', cap: 'Crater lakes of the Tongariro plateau' },
            { img: { src: TONGARIRO_HERO, small: TONGARIRO_HERO }, alt: 'Volcanic cone above tussock and a mountain stream', cap: 'Snow-capped volcanoes and alpine streams' },
          ].map((g) => (
            <figure key={g.cap} className="relative h-64 sm:h-80 overflow-hidden rounded-2xl">
              <img src={g.img.small} srcSet={g.img.small !== g.img.src ? `${g.img.small} 800w, ${g.img.src} 1600w` : undefined} sizes="(min-width: 640px) 50vw, 100vw" alt={g.alt} loading="lazy" className="h-full w-full object-cover" />
              <figcaption className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-5 pb-4 pt-10 text-sm text-slate-100">{g.cap}</figcaption>
            </figure>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-slate-500">
          Landscape photography of Tongariro National Park. Images show the region the water is named for, not the bottling site.
        </p>
      </section>

      {/* 3 · Why Tongariro */}
      <section className="bg-[#E7E2D8] text-[#121518]">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 py-16 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#5E6B4F]">Why Tongariro?</p>
            <h2 className="mt-3 font-editorial text-4xl sm:text-5xl font-semibold leading-[1.05]">
              A New Zealand water, brought to the UK by one partner.
            </h2>
          </div>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Mountain, t: 'New Zealand origin', d: 'Sourced and bottled in New Zealand, then shipped to our UK stock.' },
              { icon: Droplets, t: 'Natural spring water', d: 'A still natural spring water, sold under its own New Zealand label.' },
              { icon: Package, t: 'Bottled at source', d: 'Filled in New Zealand and imported in 500ml, 750ml and 1.5 litre bottles.' },
              { icon: Leaf, t: 'Only through us', d: 'UK Beverages is the sole UK distributor, so every UK case comes direct from our stock.' },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t} className="rounded-2xl bg-white/70 p-6 border border-[#121518]/8">
                <Icon className="h-5 w-5 text-[#5E6B4F]" />
                <p className="mt-4 font-semibold">{t}</p>
                <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{d}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-[#121518]/10 bg-white p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div>
              <p className="font-semibold">Mineral composition</p>
              <p className="mt-1 text-sm text-slate-600">
                {verified ? 'Typical analysis from the current product label (mg/L).' : 'Published from the supplier’s current label analysis.'}
              </p>
            </div>
            {verified && brand ? (
              <dl className="md:col-span-2 grid grid-cols-3 sm:grid-cols-6 gap-3 text-center">
                {[
                  ['pH', fact(brand, brand.mineralProfile.ph)],
                  ['TDS', fact(brand, brand.mineralProfile.tds)],
                  ['Silica', fact(brand, brand.mineralProfile.silica)],
                  ['Calcium', fact(brand, brand.mineralProfile.calcium)],
                  ['Magnesium', fact(brand, brand.mineralProfile.magnesium)],
                  ['Sodium', fact(brand, brand.mineralProfile.sodium)],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-[#F4F6F5] py-3">
                    <dt className="text-[11px] text-slate-500">{k}</dt>
                    <dd className="font-mono text-sm font-semibold tabular-nums">{v}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="md:col-span-2 text-sm text-slate-600">
                We&apos;re confirming the full mineral analysis with the supplier and will publish it here. Need it now for a
                trade listing or dietary question?{' '}
                <button onClick={() => navigate('/contact')} className="font-semibold text-[#121518] underline">
                  Ask us for the product specification
                </button>
                .
              </p>
            )}
          </div>
        </div>
      </section>

      {/* 4 · The collection */}
      <section id="collection" className="scroll-mt-20 mx-auto max-w-7xl px-4 sm:px-8 py-16 sm:py-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A9BE95]">The collection</p>
            <h2 className="mt-3 font-editorial text-4xl sm:text-5xl font-semibold">Choose your Tongariro</h2>
          </div>
          <button onClick={() => navigate('/subscriptions#plan-builder')} className="text-sm font-semibold text-[#C9D6C0] hover:text-white whitespace-nowrap">
            Or set up a subscription →
          </button>
        </div>
        <TongariroCollection />
      </section>

      {/* 5 · Exclusive UK distribution */}
      <DistributionStatement tone="dark" />

      {/* 6 · Final conversion */}
      <section className="bg-[#F4F6F5] text-[#121518]">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 py-16 sm:py-24 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          {showcase && (
            <ProductImage product={showcase} brandName="Tongariro" className="h-80 sm:h-[460px] w-full rounded-2xl" />
          )}
          <div className="space-y-5">
            <SoleDistributorBadge tone="light" />
            <h2 className="font-editorial text-5xl sm:text-6xl font-semibold leading-[0.98]">Experience Tongariro.</h2>
            <p className="text-base text-slate-600 leading-relaxed max-w-md">
              From £{Math.min(...range.map((p) => p.priceGbp)).toFixed(2)} a case, delivered across the UK. Subscribe and save
              on every delivery; pause or cancel whenever you like.
            </p>
            <button onClick={goCollection} className="inline-flex items-center gap-2 rounded-lg bg-[#121518] px-7 py-4 text-xs font-semibold tracking-wide text-white hover:bg-[#0D1B2A]">
              SHOP TONGARIRO WATER <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <div className="bg-[#F8F7F4] text-[#121518]">
        <SecondaryBrands />
      </div>
    </div>
  );
}

/** "Other brands": the supporting range, presented more quietly than the flagship. */
export function OtherBrandsPage() {
  const { navigate } = useStore();
  return (
    <div>
      <SeoHead
        title="Other Premium Waters – Evian, FIJI, Highland Spring, Icelandic Glacial | UK Beverages"
        description="Alongside our flagship Tongariro Natural Spring Water, UK Beverages delivers Evian, FIJI Water, Highland Spring and Icelandic Glacial across the UK."
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-8 pt-10 sm:pt-14">
        <button
          onClick={() => navigate('/tongariro')}
          className="flex w-full flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-[#121518] px-5 py-4 text-left text-white"
        >
          <span>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-[#A9BE95]">Our flagship</span>
            <span className="block font-editorial text-xl font-semibold">Tongariro Natural Spring Water · New Zealand</span>
          </span>
          <span className="text-xs font-semibold text-[#C9D6C0]">Discover Tongariro →</span>
        </button>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-8 pt-10">
        <h1 className="font-editorial text-4xl sm:text-5xl font-semibold text-[#121518]">Other brands</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Alongside Tongariro, we deliver four of the world&apos;s best-known bottled waters across the UK.
        </p>
      </div>
      <SecondaryBrands title="Explore by origin" />
    </div>
  );
}
