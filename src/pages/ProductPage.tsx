import React, { useEffect, useState } from 'react';
import { ProductImage } from '../components/ProductImage';
import { ArrowLeft, Check, Minus, Plus, RefreshCw, ShieldCheck, Truck } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { SeoHead } from '../components/SeoHead';
import { useStore } from '../context/StoreContext';
import { Bottle3DViewer } from '../three/lazy';
import type { SubscriptionFrequency } from '../types';

export function ProductPage({ slug }: { slug: string }) {
  const { products, brands, addToCart, navigate, postcodeResult } = useStore();
  const product = products.find((p) => p.slug === slug);

  const hasPhoto = Boolean(product?.imageUrl);
  const [galleryMode, setGalleryMode] = useState<'3d' | 'studio' | 'source'>(hasPhoto ? 'studio' : '3d');
  // Reset the gallery when moving between products (the page component is reused)
  useEffect(() => {
    setGalleryMode(hasPhoto ? 'studio' : '3d');
  }, [product?.id, hasPhoto]);
  const [purchaseMode, setPurchaseMode] = useState<'once' | 'subscribe'>('once');
  const [frequency, setFrequency] = useState<SubscriptionFrequency>('monthly');
  const [quantity, setQuantity] = useState(1);

  if (!product) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center space-y-4">
        <h1 className="font-editorial text-3xl font-semibold">Product Not Found</h1>
        <button
          onClick={() => navigate('/shop')}
          className="rounded-lg bg-[#14181F] px-5 py-2.5 text-xs font-semibold text-white"
        >
          Back to Shop
        </button>
      </div>
    );
  }

  const brand = brands.find((b) => b.id === product.brandId);
  const subPrice = product.priceGbp * (1 - product.subscriptionDiscountPct / 100);
  const activeUnitPrice = purchaseMode === 'subscribe' ? subPrice : product.priceGbp;
  const perBottle = activeUnitPrice / product.packQuantity;

  const sameBrandProducts = products.filter(
    (p) => p.brandId === product.brandId && p.id !== product.id
  );
  const relatedProducts =
    sameBrandProducts.length >= 2
      ? sameBrandProducts.slice(0, 3)
      : [...sameBrandProducts, ...products.filter((p) => p.brandId !== product.brandId)].slice(0, 3);

  const handleBuyNow = () => {
    addToCart(product.id, quantity, purchaseMode, frequency);
    navigate('/checkout');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-8 py-6 sm:py-10 pb-28 lg:pb-10">
      <SeoHead
        title={`${product.name} | UK Beverages`}
        description={`${product.subtitle}. ${product.description}`}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          sku: product.sku,
          description: product.description,
          brand: { '@type': 'Brand', name: brand?.name || 'UK Beverages' },
          offers: {
            '@type': 'Offer',
            priceCurrency: 'GBP',
            price: product.priceGbp.toFixed(2),
            availability:
              product.stock > 0
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
          },
        }}
      />

      <button
        onClick={() => navigate('/shop')}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-[#14181F] mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Shop All Water
      </button>

      {/* Main Contiguous PDP Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left: Sticky 3D / Studio / Source Gallery */}
        <div className="lg:col-span-7 lg:sticky lg:top-24 space-y-4">
          {galleryMode === '3d' ? (
            <Bottle3DViewer
              product={product}
              brandName={brand?.name || 'UK Beverages'}
              fallback={<div className="w-full h-[340px] sm:h-[460px] lg:h-[520px] rounded-2xl border border-black/5 bg-[#EFECE6]" />}
            />
          ) : galleryMode === 'studio' ? (
            <ProductImage product={product} brandName={brand?.name || 'UK Beverages'} className="w-full h-[340px] sm:h-[460px] lg:h-[520px] rounded-2xl border border-black/8" />
          ) : (
            <div className="relative h-[340px] sm:h-[460px] lg:h-[520px] overflow-hidden rounded-2xl border border-black/8 bg-[#14202C]">
              <img
                src={brand?.heroImage || '/src/assets/images/brand_evian_alps_1795175836809.jpg'}
                alt={`${brand?.name} source`}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-6 right-6 text-white">
                <p className="text-xs text-slate-200">{brand?.region}</p>
                <p className="font-editorial text-2xl font-semibold">{brand?.sourceName}</p>
              </div>
            </div>
          )}

          {/* Thumbnail / View Switcher */}
          <div className="flex items-center gap-3">
            {!hasPhoto && (
            <button
              onClick={() => setGalleryMode('3d')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                galleryMode === '3d'
                  ? 'border-[#14181F] bg-[#14181F] text-white'
                  : 'border-black/10 bg-white text-slate-700 hover:bg-black/5'
              }`}
            >
              Interactive 3D Bottle
            </button>
            )}
            <button
              onClick={() => setGalleryMode('studio')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                galleryMode === 'studio'
                  ? 'border-[#14181F] bg-[#14181F] text-white'
                  : 'border-black/10 bg-white text-slate-700 hover:bg-black/5'
              }`}
            >
              {hasPhoto ? 'Product Photo' : 'Studio Profile'}
            </button>
            <button
              onClick={() => setGalleryMode('source')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                galleryMode === 'source'
                  ? 'border-[#14181F] bg-[#14181F] text-white'
                  : 'border-black/10 bg-white text-slate-700 hover:bg-black/5'
              }`}
            >
              Origin Landscape
            </button>
          </div>
        </div>

        {/* Right: Contiguous Purchase Module */}
        <div className="lg:col-span-5 rounded-2xl border border-black/8 bg-white p-6 sm:p-8 space-y-6">
          <div className="space-y-2 border-b border-black/8 pb-5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <button
                onClick={() => brand && navigate(`/brands/${brand.slug}`)}
                className="font-semibold text-[#0F5C6E] hover:underline"
              >
                {brand?.name} · {brand?.country}
              </button>
              <span className="font-mono">{product.sku}</span>
            </div>

            <h1 className="font-editorial text-3xl font-semibold text-[#14181F]">
              {product.name}
            </h1>

            <p className="text-sm text-slate-600">{product.subtitle}</p>

            <div className="pt-2 flex items-baseline gap-3">
              <span className="text-2xl font-semibold font-mono tabular-nums text-[#14181F]">
                £{activeUnitPrice.toFixed(2)}
              </span>
              {product.compareAtPriceGbp && purchaseMode === 'once' && (
                <span className="text-sm font-mono tabular-nums text-slate-400 line-through">
                  £{product.compareAtPriceGbp.toFixed(2)}
                </span>
              )}
              <span className="text-xs font-mono tabular-nums text-slate-500">
                (£{perBottle.toFixed(2)} per bottle · incl. UK VAT)
              </span>
            </div>

            <p
              className={`text-xs font-medium ${
                product.stock > 0 ? 'text-emerald-700' : 'text-red-600'
              }`}
            >
              {product.stock > 0
                ? `In stock (${product.stock} cases ready for UK dispatch)`
                : 'Currently out of stock'}
            </p>
          </div>

          <p className="text-sm text-slate-700 leading-relaxed">{product.description}</p>

          {/* Verified Spec Table */}
          <div className="grid grid-cols-2 gap-3 rounded-xl bg-[#F8F7F4] p-4 text-xs border border-black/5">
            <div>
              <span className="text-slate-500 block">Bottle Size</span>
              <span className="font-semibold font-mono text-[#14181F]">{product.bottleSizeLabel}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Pack Quantity</span>
              <span className="font-semibold font-mono text-[#14181F]">{product.packQuantity} units</span>
            </div>
            <div>
              <span className="text-slate-500 block">Water Type</span>
              <span className="font-semibold text-[#14181F]">{product.waterType}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Packaging</span>
              <span className="font-semibold text-[#14181F]">{product.packaging}</span>
            </div>
            {brand && (
              <>
                <div>
                  <span className="text-slate-500 block">Verified pH</span>
                  <span className="font-semibold font-mono text-[#14181F]">{brand.mineralProfile.ph}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">TDS (Dry Residue)</span>
                  <span className="font-semibold font-mono text-[#14181F]">
                    {brand.mineralProfile.tds} mg/L
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Purchase Mode Selector: One-time vs Subscription */}
          <div className="space-y-2.5">
            <label className="flex items-start justify-between gap-3 rounded-xl border p-3.5 cursor-pointer transition-colors hover:bg-black/[0.02] border-black/12">
              <div className="flex items-start gap-2.5">
                <input
                  type="radio"
                  name="purchaseMode"
                  checked={purchaseMode === 'once'}
                  onChange={() => setPurchaseMode('once')}
                  className="mt-1 accent-[#0F5C6E]"
                />
                <div>
                  <span className="block text-sm font-semibold text-[#14181F]">One-time Purchase</span>
                  <span className="text-xs text-slate-500">Single UK delivery dispatch</span>
                </div>
              </div>
              <span className="text-sm font-semibold font-mono tabular-nums">
                £{product.priceGbp.toFixed(2)}
              </span>
            </label>

            <label
              className={`flex flex-col gap-3 rounded-xl border p-3.5 cursor-pointer transition-colors ${
                purchaseMode === 'subscribe'
                  ? 'border-[#0F5C6E] bg-[#0F5C6E]/[0.04]'
                  : 'border-black/12 hover:bg-black/[0.02]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <input
                    type="radio"
                    name="purchaseMode"
                    checked={purchaseMode === 'subscribe'}
                    onChange={() => setPurchaseMode('subscribe')}
                    className="mt-1 accent-[#0F5C6E]"
                  />
                  <div>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#14181F]">
                      <RefreshCw className="h-3.5 w-3.5 text-[#0F5C6E]" />
                      Subscribe &amp; Save {product.subscriptionDiscountPct}%
                    </span>
                    <span className="block text-xs text-slate-500">
                      Pause, change frequency, or cancel anytime
                    </span>
                  </div>
                </div>
                <span className="text-sm font-semibold font-mono tabular-nums text-[#0F5C6E]">
                  £{subPrice.toFixed(2)}
                </span>
              </div>

              {purchaseMode === 'subscribe' && (
                <div className="pl-6 flex items-center gap-2">
                  <label htmlFor="pdp-freq" className="text-xs text-slate-600">
                    Frequency:
                  </label>
                  <select
                    id="pdp-freq"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as SubscriptionFrequency)}
                    className="rounded-lg border border-black/15 bg-white px-2.5 py-1.5 text-xs font-medium text-[#14181F]"
                  >
                    <option value="weekly">Every week</option>
                    <option value="fortnightly">Every 2 weeks</option>
                    <option value="monthly">Every month</option>
                  </select>
                </div>
              )}
            </label>
          </div>

          {/* Quantity & Primary CTAs */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center rounded-lg border border-black/15 bg-white">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="p-3 text-slate-600 hover:text-[#14181F]"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-4 text-sm font-semibold font-mono tabular-nums">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock || 20, q + 1))}
                  aria-label="Increase quantity"
                  className="p-3 text-slate-600 hover:text-[#14181F]"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <button
                disabled={product.stock <= 0}
                onClick={() => addToCart(product.id, quantity, purchaseMode, frequency)}
                className="flex-1 rounded-lg bg-[#14181F] px-5 py-3 text-xs font-semibold tracking-wide text-white hover:bg-[#0F5C6E] disabled:opacity-40 transition-colors"
              >
                ADD TO BAG · £{(activeUnitPrice * quantity).toFixed(2)}
              </button>
            </div>

            <button
              disabled={product.stock <= 0}
              onClick={handleBuyNow}
              className="w-full rounded-lg border border-[#14181F] px-5 py-3 text-xs font-semibold tracking-wide text-[#14181F] hover:bg-[#14181F] hover:text-white disabled:opacity-40 transition-colors"
            >
              BUY NOW
            </button>
          </div>

          {/* Delivery & Trust Summary */}
          <div className="border-t border-black/8 pt-4 space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-[#0F5C6E] shrink-0" />
              <span>
                {postcodeResult?.zone
                  ? `${postcodeResult.zone.name}: ${postcodeResult.zone.estimatedDays} (Free over £${postcodeResult.zone.freeThresholdGbp})`
                  : 'Tracked UK courier dispatch · Complimentary London & SE delivery over £45'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#0F5C6E] shrink-0" />
              <span>Bottled at source · UK VAT receipt issued with every order</span>
            </div>
            {brand && (
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#0F5C6E] shrink-0" />
                <button
                  onClick={() => navigate(`/brands/${brand.slug}`)}
                  className="text-left hover:underline text-[#0F5C6E] font-medium"
                >
                  See where {brand.name} comes from in {brand.country} →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-20 border-t border-black/8 pt-14">
          <h2 className="font-editorial text-3xl font-semibold text-[#14181F] mb-8">
            More From Our Collection
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
            {relatedProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                brand={brands.find((b) => b.id === p.brandId)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Mobile sticky purchase bar: price + add to bag always within thumb reach */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 backdrop-blur px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-3">
          <div className="shrink-0">
            <p className="text-[11px] text-slate-500 leading-none">
              {purchaseMode === 'subscribe' ? `Subscribe · save ${product.subscriptionDiscountPct}%` : 'One-time'}
            </p>
            <p className="font-mono text-lg font-semibold tabular-nums">£{(activeUnitPrice * quantity).toFixed(2)}</p>
          </div>
          <button
            disabled={product.stock <= 0}
            onClick={() => addToCart(product.id, quantity, purchaseMode, frequency)}
            className="flex-1 rounded-lg bg-[#14181F] px-4 py-3.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            {product.stock > 0 ? 'Add to bag' : 'Out of stock'}
          </button>
        </div>
      </div>
    </div>
  );
}
