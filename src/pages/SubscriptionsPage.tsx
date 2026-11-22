import React, { useState } from 'react';
import { ProductImage } from '../components/ProductImage';
import { Calendar, CheckCircle2, PauseCircle, RefreshCw, Shield } from 'lucide-react';
import { HydrationPlanner } from '../components/HydrationPlanner';
import { SeoHead } from '../components/SeoHead';
import { useStore } from '../context/StoreContext';
import type { SubscriptionFrequency } from '../types';

export function SubscriptionsPage() {
  const { products, brands, addToCart, navigate, user } = useStore();

  const [selectedBrandId, setSelectedBrandId] = useState<string>('all');
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || 'prod-evian-500-pet');
  const [frequency, setFrequency] = useState<SubscriptionFrequency>('monthly');
  const [quantity, setQuantity] = useState<number>(1);

  const filteredProducts =
    selectedBrandId === 'all'
      ? products
      : products.filter((p) => p.brandId === selectedBrandId);

  const selectedProduct =
    products.find((p) => p.id === selectedProductId) || filteredProducts[0] || products[0];
  const selectedBrand = brands.find((b) => b.id === selectedProduct?.brandId);

  const subUnitPrice = selectedProduct
    ? selectedProduct.priceGbp * (1 - selectedProduct.subscriptionDiscountPct / 100)
    : 0;
  const totalPerDelivery = subUnitPrice * quantity;

  const handleStartPlan = () => {
    if (!selectedProduct) return;
    addToCart(selectedProduct.id, quantity, 'subscribe', frequency);
    navigate('/checkout');
  };

  return (
    <div>
      <SeoHead
        title="Water Delivery Subscriptions UK – Never Run Out | UK Beverages"
        description="Subscribe to weekly, fortnightly, or monthly UK deliveries of Evian, FIJI Water, Highland Spring, Icelandic Glacial, and Tongariro. Save up to 15% and manage online."
      />

      {/* Hero Section */}
      <section className="border-b border-black/8 bg-[#14181F] text-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#7CC4D8]">
              Recurring UK Water Delivery
            </p>
            <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.06] text-white">
              NEVER RUN OUT OF YOUR FAVOURITE WATER.
            </h1>
            <p className="text-base text-slate-300 leading-relaxed max-w-xl">
              Set a dependable UK delivery cadence for your household. Enjoy subscriber pricing across all five natural spring brands with full freedom to pause, swap products, or adjust dates in your account.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <a
                href="#plan-builder"
                className="rounded-lg bg-white px-5 py-3 text-xs font-semibold text-[#14181F] hover:bg-slate-200 transition-colors"
              >
                Configure Your Plan
              </a>
              <button
                onClick={() => navigate(user ? '/subscriptions/manage' : '/account')}
                className="rounded-lg border border-white/25 px-5 py-3 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Manage Existing Subscriptions
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-2">
              <RefreshCw className="h-5 w-5 text-[#7CC4D8]" />
              <h2 className="text-sm font-semibold">10%–15% Off Cases</h2>
              <p className="text-xs text-slate-400">Automatic recurring savings applied to every scheduled dispatch.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-2">
              <Calendar className="h-5 w-5 text-[#7CC4D8]" />
              <h2 className="text-sm font-semibold">Your Schedule</h2>
              <p className="text-xs text-slate-400">Choose weekly, fortnightly, or monthly UK doorstep deliveries.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-2">
              <PauseCircle className="h-5 w-5 text-[#7CC4D8]" />
              <h2 className="text-sm font-semibold">Pause Anytime</h2>
              <p className="text-xs text-slate-400">Away on holiday? Pause or resume in one click with zero fees.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-2">
              <Shield className="h-5 w-5 text-[#7CC4D8]" />
              <h2 className="text-sm font-semibold">Swap Freely</h2>
              <p className="text-xs text-slate-400">Switch between still, sparkling, bottle sizes or brands between deliveries.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Subscription Builder */}
      <section className="mx-auto max-w-4xl px-4 sm:px-8 pt-12 sm:pt-16">
        <HydrationPlanner />
      </section>

      <section id="plan-builder" className="mx-auto max-w-7xl px-4 sm:px-8 py-14 sm:py-20">
        <div className="mb-10 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#0F5C6E]">
            Plan Configurator
          </p>
          <h2 className="mt-2 font-editorial text-3xl sm:text-4xl font-semibold text-[#14181F]">
            Build Your Recurring Water Delivery
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Step Selection */}
          <div className="lg:col-span-7 space-y-8 rounded-2xl border border-black/8 bg-white p-6 sm:p-8">
            {/* Step 1: Filter by Brand */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                01. Choose Brand
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedBrandId('all')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                    selectedBrandId === 'all'
                      ? 'bg-[#14181F] text-white'
                      : 'bg-[#EFECE6] text-slate-700 hover:bg-black/10'
                  }`}
                >
                  All Brands
                </button>
                {brands.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setSelectedBrandId(b.id);
                      const first = products.find((p) => p.brandId === b.id);
                      if (first) setSelectedProductId(first.id);
                    }}
                    className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                      selectedBrandId === b.id
                        ? 'bg-[#14181F] text-white'
                        : 'bg-[#EFECE6] text-slate-700 hover:bg-black/10'
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Select Pack */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                02. Select Water &amp; Pack Size
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredProducts.map((p) => {
                  const active = selectedProduct?.id === p.id;
                  const discPrice = p.priceGbp * (1 - p.subscriptionDiscountPct / 100);
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProductId(p.id)}
                      className={`text-left rounded-xl border p-4 transition-colors ${
                        active
                          ? 'border-[#0F5C6E] bg-[#0F5C6E]/[0.05]'
                          : 'border-black/10 hover:border-black/25'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold text-[#14181F]">{p.name}</span>
                        {active && <CheckCircle2 className="h-4 w-4 text-[#0F5C6E] shrink-0" />}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {p.bottleSizeLabel} × {p.packQuantity} · {p.packaging}
                      </p>
                      <div className="mt-2 flex items-baseline gap-2 font-mono tabular-nums">
                        <span className="text-sm font-semibold text-[#0F5C6E]">
                          £{discPrice.toFixed(2)}
                        </span>
                        <span className="text-xs text-slate-400 line-through">
                          £{p.priceGbp.toFixed(2)}
                        </span>
                        <span className="text-[11px] text-slate-500">(-{p.subscriptionDiscountPct}%)</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Cadence & Quantity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  03. Delivery Frequency
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['weekly', 'fortnightly', 'monthly'] as SubscriptionFrequency[]).map((freq) => (
                    <button
                      key={freq}
                      onClick={() => setFrequency(freq)}
                      className={`rounded-lg border py-2.5 text-xs font-semibold capitalize transition-colors ${
                        frequency === freq
                          ? 'border-[#14181F] bg-[#14181F] text-white'
                          : 'border-black/12 text-slate-700 hover:bg-black/5'
                      }`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="sub-qty" className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  04. Cases Per Delivery
                </label>
                <select
                  id="sub-qty"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full rounded-lg border border-black/15 bg-white px-3.5 py-2.5 text-sm font-mono"
                >
                  {[1, 2, 3, 4, 6, 8, 10].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'case' : 'cases'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Right: Summary Preview */}
          {selectedProduct && (
            <div className="lg:col-span-5 rounded-2xl border border-black/8 bg-white overflow-hidden">
              <ProductImage product={selectedProduct} brandName={selectedBrand?.name || 'UK Beverages'} className="h-64 w-full border-b border-black/5" />
              <div className="p-6 sm:p-8 space-y-5">
                <div>
                  <p className="text-xs font-semibold text-[#0F5C6E]">{selectedBrand?.name}</p>
                  <h3 className="mt-1 font-editorial text-2xl font-semibold text-[#14181F]">
                    {selectedProduct.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-600">
                    {quantity} × {selectedProduct.packQuantity} bottles ({selectedProduct.bottleSizeLabel}) · Delivered{' '}
                    <span className="capitalize font-medium">{frequency}</span>
                  </p>
                </div>

                <div className="rounded-xl bg-[#F8F7F4] p-4 space-y-2 text-xs border border-black/5">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Standard Retail Price</span>
                    <span className="font-mono tabular-nums text-slate-400 line-through">
                      £{(selectedProduct.priceGbp * quantity).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">
                      Subscription Savings ({selectedProduct.subscriptionDiscountPct}%)
                    </span>
                    <span className="font-mono tabular-nums text-emerald-700">
                      -£{((selectedProduct.priceGbp - subUnitPrice) * quantity).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-black/10 pt-2 text-sm font-semibold text-[#14181F]">
                    <span>Recurring Total (incl. UK VAT)</span>
                    <span className="font-mono tabular-nums">£{totalPerDelivery.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleStartPlan}
                  className="w-full rounded-lg bg-[#0F5C6E] px-5 py-3.5 text-xs font-semibold tracking-wide text-white hover:bg-[#0C4A59] transition-colors"
                >
                  Continue to Checkout
                </button>
                <p className="text-[11px] text-slate-500 text-center">
                  Manage, pause, or cancel anytime under Customer Account → Subscriptions.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
