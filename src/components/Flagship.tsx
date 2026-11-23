import React, { useState } from 'react';
import { ArrowRight, Check, MapPin, RefreshCw, Truck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductImage } from './ProductImage';
import { FLAGSHIP_PATH, brandPath, isFlagship, tongariroProducts } from '../lib/flagship';
import { responsiveImg } from '../lib/img';
import type { Product } from '../types';

/**
 * Shared building blocks for the Tongariro flagship presentation
 * (home page, Tongariro page, shop, subscriptions, delivery).
 *
 * Palette: volcanic charcoal #121518 · midnight #0D1B2A · glacier #F4F6F5 · stone #E7E2D8 · moss #7D8C6A
 */

export const TONGARIRO_HERO = '/src/assets/images/brand_tongariro_nz_1795175837007.jpg';
export const NZ_CRATER = { src: '/images/nz/tongariro-crater-1600.webp', small: '/images/nz/tongariro-crater-800.webp' };
export const NZ_LAKE = { src: '/images/nz/tongariro-lake-1600.webp', small: '/images/nz/tongariro-lake-800.webp' };

export function SoleDistributorBadge({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] ${
        tone === 'dark'
          ? 'border-[#C9D6C0]/40 bg-white/5 text-[#DCE6D3]'
          : 'border-[#7D8C6A]/40 bg-[#7D8C6A]/10 text-[#4F5C42]'
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-[#A9BE95]" aria-hidden="true" />
      Sole UK distributor
    </span>
  );
}

/** Premium card for a Tongariro product: photo, format, price, one-tap add and subscribe. */
export function FlagshipProductCard({ product }: { product: Product }) {
  const { addToCart, navigate } = useStore();
  const [added, setAdded] = useState<'once' | 'subscribe' | null>(null);
  const perBottle = product.priceGbp / product.packQuantity;
  const subPrice = product.priceGbp * (1 - product.subscriptionDiscountPct / 100);
  const inStock = product.stock > 0;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-[#121518]/10 bg-white">
      <button onClick={() => navigate(`/products/${product.slug}`)} className="block text-left">
        <ProductImage product={product} brandName="Tongariro" className="h-56 sm:h-72 w-full border-b border-black/5" />
        <div className="px-5 pt-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5E6B4F]">
            {product.bottleSizeLabel} · {product.packQuantity} bottles
          </p>
          <h3 className="mt-1.5 font-editorial text-2xl font-semibold text-[#121518] group-hover:text-[#0D1B2A]">
            {product.bottleSizeLabel === '500ml' ? 'The everyday bottle' : product.bottleSizeLabel === '750ml' ? 'The table bottle' : 'The family bottle'}
          </h3>
          <p className="mt-1 text-sm text-slate-600">{product.subtitle}</p>
        </div>
      </button>
      <div className="mt-auto px-5 pb-5 pt-4 space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-2xl font-semibold tabular-nums text-[#121518]">£{product.priceGbp.toFixed(2)}</span>
          <span className="text-xs text-slate-500 tabular-nums">£{perBottle.toFixed(2)} a bottle</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            disabled={!inStock}
            onClick={() => {
              addToCart(product.id, 1, 'once');
              setAdded('once');
            }}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#121518] px-3 py-3 text-xs font-semibold text-white hover:bg-[#0D1B2A] disabled:opacity-40"
          >
            {added === 'once' ? <><Check className="h-3.5 w-3.5" /> Added</> : inStock ? 'Add to bag' : 'Out of stock'}
          </button>
          <button
            disabled={!inStock}
            onClick={() => {
              addToCart(product.id, 1, 'subscribe', 'monthly');
              setAdded('subscribe');
            }}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#121518]/15 px-3 py-3 text-xs font-semibold text-[#121518] hover:bg-[#121518]/5 disabled:opacity-40"
          >
            {added === 'subscribe' ? (
              <><Check className="h-3.5 w-3.5" /> Subscribed</>
            ) : (
              <><RefreshCw className="h-3.5 w-3.5" /> £{subPrice.toFixed(2)}/mo</>
            )}
          </button>
        </div>
        <p className="text-[11px] text-slate-500">
          Subscribe &amp; save {product.subscriptionDiscountPct}% · {inStock ? `${product.stock} in stock` : 'Back soon'}
        </p>
      </div>
    </article>
  );
}

/** The full Tongariro range as premium cards. */
export function TongariroCollection({ className = '' }: { className?: string }) {
  const { products } = useStore();
  const range = tongariroProducts(products);
  if (range.length === 0) return null;
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 ${className}`}>
      {range.map((p) => (
        <FlagshipProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

/** "Sole UK distributor" explanation. Accurate about the relationship: we distribute, we don't own or bottle. */
export function DistributionStatement({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  const { navigate } = useStore();
  const dark = tone === 'dark';
  return (
    <section className={dark ? 'bg-[#0D1B2A] text-white' : 'bg-[#E7E2D8]/60 text-[#121518]'}>
      <div className="mx-auto max-w-7xl px-4 sm:px-8 py-14 sm:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-6 space-y-5">
          <SoleDistributorBadge tone={dark ? 'dark' : 'light'} />
          <h2 className="font-editorial text-3xl sm:text-5xl font-semibold leading-[1.05]">
            New Zealand&apos;s water. One UK distribution partner.
          </h2>
          <p className={`text-sm sm:text-base leading-relaxed ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
            UK Beverages is the sole UK distributor of Tongariro Natural Spring Water. If you&apos;re buying Tongariro in the UK,
            for your home, office, hotel or shop, it comes through us. Tongariro is bottled in New Zealand by its brand owner; we
            import it, hold UK stock and deliver it to your door.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <button
              onClick={() => navigate(`${FLAGSHIP_PATH}#collection`)}
              className={`rounded-lg px-5 py-3 text-xs font-semibold tracking-wide ${
                dark ? 'bg-white text-[#0D1B2A] hover:bg-slate-200' : 'bg-[#121518] text-white hover:bg-[#0D1B2A]'
              }`}
            >
              SHOP TONGARIRO
            </button>
            <button
              onClick={() => navigate('/contact')}
              className={`rounded-lg border px-5 py-3 text-xs font-semibold tracking-wide ${
                dark ? 'border-white/25 text-white hover:bg-white/10' : 'border-[#121518]/20 hover:bg-[#121518]/5'
              }`}
            >
              TRADE &amp; WHOLESALE ENQUIRIES
            </button>
          </div>
        </div>
        <ul className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: MapPin, t: 'From New Zealand', d: 'Natural spring water, bottled at source.' },
            { icon: Truck, t: 'Held in UK stock', d: 'Ordered online and delivered across UK mainland zones.' },
            { icon: RefreshCw, t: 'On subscription', d: 'Weekly, fortnightly or monthly, and you can pause any time.' },
          ].map(({ icon: Icon, t, d }) => (
            <li
              key={t}
              className={`rounded-xl border p-5 ${dark ? 'border-white/10 bg-white/[0.03]' : 'border-[#121518]/10 bg-white'}`}
            >
              <Icon className={`h-5 w-5 ${dark ? 'text-[#A9BE95]' : 'text-[#5E6B4F]'}`} />
              <p className="mt-3 text-sm font-semibold">{t}</p>
              <p className={`mt-1 text-xs leading-relaxed ${dark ? 'text-slate-400' : 'text-slate-600'}`}>{d}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Home-page flagship block: cinematic NZ imagery + the Tongariro range. */
export function FlagshipShowcase() {
  const { navigate } = useStore();
  const hero = responsiveImg(TONGARIRO_HERO, '100vw');
  return (
    <section className="bg-[#121518] text-white">
      <div className="relative h-[62svh] min-h-[420px] max-h-[720px] overflow-hidden">
        <img {...hero} alt="Volcanic peaks and an alpine stream in New Zealand's Tongariro region" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#121518] via-[#121518]/40 to-[#121518]/10" />
        <div className="relative mx-auto flex h-full max-w-7xl items-end px-4 sm:px-8 pb-10 sm:pb-16">
          <div className="max-w-2xl space-y-4">
            <SoleDistributorBadge />
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9D6C0]">Our flagship water</p>
            <h2 className="font-editorial text-4xl sm:text-6xl font-semibold leading-[1.02]">Tongariro Natural Spring Water</h2>
            <p className="text-sm sm:text-lg text-slate-200 leading-relaxed">
              Natural spring water from New Zealand, named for the volcanic heart of the North Island and brought to the UK
              exclusively by UK Beverages.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => navigate(`${FLAGSHIP_PATH}#collection`)}
                className="rounded-lg bg-white px-6 py-3.5 text-xs font-semibold tracking-wide text-[#121518] hover:bg-slate-200"
              >
                SHOP TONGARIRO
              </button>
              <button
                onClick={() => navigate(FLAGSHIP_PATH)}
                className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-6 py-3.5 text-xs font-semibold tracking-wide hover:bg-white/10"
              >
                DISCOVER ITS ORIGIN <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-8 pb-16 sm:pb-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 py-8 sm:py-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A9BE95]">The Tongariro collection</p>
            <h3 className="mt-2 font-editorial text-3xl sm:text-4xl font-semibold">Three bottles, one New Zealand spring water</h3>
          </div>
          <button onClick={() => navigate(FLAGSHIP_PATH)} className="text-sm font-semibold text-[#C9D6C0] hover:text-white whitespace-nowrap">
            The Tongariro story →
          </button>
        </div>
        <TongariroCollection />
      </div>
    </section>
  );
}

/** Understated grid for the supporting brands. */
export function SecondaryBrands({ title = 'More exceptional waters from around the world' }: { title?: string }) {
  const { brands, navigate } = useStore();
  const others = brands.filter((b) => !isFlagship(b) && b.active !== false);
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-8 py-14 sm:py-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Also available from UK Beverages</p>
          <h2 className="mt-2 font-editorial text-2xl sm:text-3xl font-semibold text-[#121518] uppercase tracking-wide">{title}</h2>
        </div>
        <button onClick={() => navigate('/shop#more-waters')} className="text-sm font-semibold text-[#121518] hover:underline whitespace-nowrap">
          Shop all water →
        </button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {others.map((b) => {
          const img = responsiveImg(b.heroImage, '(min-width: 1024px) 300px, 50vw');
          return (
            <button
              key={b.id}
              onClick={() => navigate(brandPath(b))}
              className="group text-left overflow-hidden rounded-xl border border-black/8 bg-white"
            >
              <div className="relative h-32 sm:h-40 overflow-hidden bg-[#14202C]">
                <img {...img} alt={`${b.name}, ${b.country}`} loading="lazy" className="h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-[1.04]" />
              </div>
              <div className="p-3 sm:p-4">
                <p className="text-[11px] text-slate-500">{b.country}</p>
                <p className="text-sm font-semibold text-[#121518] leading-snug">{b.name}</p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
