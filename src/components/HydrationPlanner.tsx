import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, Minus, Plus, Repeat } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductImage } from './ProductImage';
import type { Product, SubscriptionFrequency } from '../types';
import { FREQ_DAYS, perMonth } from '../lib/subscription';

/**
 * Subscription calculator: household + drinking habits → which water, how often,
 * how many cases, and exactly what it costs per delivery / per month. One tap to subscribe.
 */

const INTAKE = [
  { id: 'light', label: 'A little', hint: '2 bottles a day', litres: 1 },
  { id: 'average', label: 'Average', hint: '3 bottles a day', litres: 1.5 },
  { id: 'lots', label: 'Lots', hint: '4 bottles a day', litres: 2 },
] as const;
type IntakeId = (typeof INTAKE)[number]['id'];

const FREQS: { id: SubscriptionFrequency; label: string }[] = [
  { id: 'weekly', label: 'Weekly' },
  { id: 'fortnightly', label: 'Every 2 weeks' },
  { id: 'monthly', label: 'Monthly' },
];

const gbp = (n: number) => `£${n.toFixed(2)}`;
const shortName = (p: Product) =>
  `${p.bottleSizeLabel} × ${p.packQuantity}${p.waterType === 'Sparkling' ? ' · Sparkling' : ''}`;

export function HydrationPlanner() {
  const { products, brands, addToCart } = useStore();

  const eligible = useMemo(
    () =>
      products.filter(
        (p) => p.active && p.stock > 0 && p.subscriptionDiscountPct > 0 && p.packaging !== 'Glass'
      ),
    [products]
  );
  const brandList = useMemo(
    () => brands.filter((b) => eligible.some((p) => p.brandId === b.id)),
    [brands, eligible]
  );
  // Default pick: a photographed 500ml multipack, else a best seller.
  const defaultProduct =
    eligible.find((p) => p.imageUrl && p.bottleSizeMl === 500) ||
    eligible.find((p) => p.isBestSeller) ||
    eligible[0];

  const [people, setPeople] = useState(2);
  const [intake, setIntake] = useState<IntakeId>('average');
  const [productId, setProductId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [frequency, setFrequency] = useState<SubscriptionFrequency | null>(null); // null = use recommendation
  const [casesOverride, setCasesOverride] = useState<number | null>(null);
  const [added, setAdded] = useState(false);

  const product = eligible.find((p) => p.id === productId) || defaultProduct;
  const activeBrandId = brandId || product?.brandId || '';
  const litresPerDay = people * (INTAKE.find((i) => i.id === intake)?.litres ?? 1.5);

  // Cases needed + price for every frequency, so each option shows its own total.
  const options = useMemo(() => {
    if (!product) return [];
    const caseLitres = (product.bottleSizeMl * product.packQuantity) / 1000;
    const unit = product.priceGbp * (1 - product.subscriptionDiscountPct / 100);
    return FREQS.map((f) => {
      const cases = Math.max(1, Math.ceil((litresPerDay * FREQ_DAYS[f.id]) / caseLitres));
      return { ...f, cases, perDelivery: unit * cases };
    });
  }, [product, litresPerDay]);

  // Recommend the least frequent delivery that keeps each drop manageable (≤ 4 cases).
  const recommended: SubscriptionFrequency =
    options.find((o) => o.id === 'monthly' && o.cases <= 4)?.id ||
    options.find((o) => o.id === 'fortnightly' && o.cases <= 4)?.id ||
    'weekly';
  const freq = frequency || recommended;
  const opt = options.find((o) => o.id === freq);
  const neededCases = opt?.cases ?? 1;
  const cases = casesOverride ?? neededCases;

  // Any change to the inputs resets a manual case count back to the recommendation.
  useEffect(() => {
    setCasesOverride(null);
    setAdded(false);
  }, [people, intake, product?.id, freq]);

  if (!product || !opt) return null;
  const brand = brands.find((b) => b.id === product.brandId);
  const unitSub = product.priceGbp * (1 - product.subscriptionDiscountPct / 100);
  const perDelivery = unitSub * cases;
  const monthly = perMonth(perDelivery, freq);
  const yearlySaving = perMonth((product.priceGbp - unitSub) * cases, freq) * 12;
  const bottles = cases * product.packQuantity;
  const daysCovered = Math.floor((cases * product.bottleSizeMl * product.packQuantity) / 1000 / litresPerDay);
  const shortfall = cases < neededCases;
  const brandProducts = eligible.filter((p) => p.brandId === activeBrandId);

  const chip = (active: boolean) =>
    `rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
      active ? 'border-[#14181F] bg-[#14181F] text-white' : 'border-black/12 bg-white text-slate-700 hover:border-black/30'
    }`;

  return (
    <div className="rounded-2xl border border-black/8 bg-white overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-5">
        {/* Inputs */}
        <div className="lg:col-span-3 p-5 sm:p-8 space-y-7">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#0F5C6E]">
              <Repeat className="h-4 w-4" /> Subscription calculator
            </p>
            <h3 className="mt-2 font-editorial text-2xl sm:text-3xl font-semibold text-[#14181F]">
              Build your water plan
            </h3>
          </div>

          {/* 1. Household */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">1 · Your household</legend>
            <div className="flex items-center justify-between rounded-xl border border-black/10 px-2 py-1.5">
              <button
                type="button"
                onClick={() => setPeople((n) => Math.max(1, n - 1))}
                disabled={people <= 1}
                aria-label="Fewer people"
                className="p-2.5 text-slate-600 disabled:opacity-30"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold tabular-nums">
                {people} {people === 1 ? 'person' : 'people'}
              </span>
              <button
                type="button"
                onClick={() => setPeople((n) => Math.min(10, n + 1))}
                disabled={people >= 10}
                aria-label="More people"
                className="p-2.5 text-slate-600 disabled:opacity-30"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {INTAKE.map((i) => (
                <button key={i.id} type="button" onClick={() => setIntake(i.id)} className={`${chip(intake === i.id)} text-left`}>
                  <span className="block">{i.label}</span>
                  <span className={`block text-[11px] font-normal ${intake === i.id ? 'text-slate-300' : 'text-slate-500'}`}>
                    {i.hint} each
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              That&apos;s about <strong className="text-[#14181F]">{litresPerDay.toFixed(1)} litres a day</strong> for your home.
            </p>
          </fieldset>

          {/* 2. Water */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">2 · Your water</legend>
            <div className="flex flex-wrap gap-2">
              {brandList.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    setBrandId(b.id);
                    const first =
                      eligible.find((p) => p.brandId === b.id && p.imageUrl) ||
                      eligible.find((p) => p.brandId === b.id);
                    if (first) setProductId(first.id);
                  }}
                  className={chip(activeBrandId === b.id)}
                >
                  {b.name}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {brandProducts.map((p) => {
                const active = p.id === product.id;
                const perBottle = (p.priceGbp * (1 - p.subscriptionDiscountPct / 100)) / p.packQuantity;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProductId(p.id)}
                    className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors ${
                      active ? 'border-[#0F5C6E] bg-[#0F5C6E]/[0.06]' : 'border-black/10 hover:border-black/25'
                    }`}
                  >
                    <span>
                      <span className="block text-sm font-semibold text-[#14181F]">{shortName(p)}</span>
                      <span className="block text-[11px] text-slate-500">{gbp(perBottle)} a bottle</span>
                    </span>
                    {active && <Check className="h-4 w-4 shrink-0 text-[#0F5C6E]" />}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* 3. Frequency: each option shows its own price */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">3 · How often</legend>
            <div className="grid grid-cols-3 gap-2">
              {options.map((o) => {
                const active = o.id === freq;
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setFrequency(o.id)}
                    className={`relative rounded-xl border p-3 text-left transition-colors ${
                      active ? 'border-[#0F5C6E] bg-[#0F5C6E] text-white' : 'border-black/10 hover:border-black/25'
                    }`}
                  >
                    {o.id === recommended && (
                      <span
                        className={`absolute -top-2 right-2 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                          active ? 'bg-white text-[#0F5C6E]' : 'bg-[#0F5C6E] text-white'
                        }`}
                      >
                        Best fit
                      </span>
                    )}
                    <span className="block text-xs font-semibold">{o.label}</span>
                    <span className={`block mt-1 text-[11px] ${active ? 'text-white/80' : 'text-slate-500'}`}>
                      {o.cases} {o.cases === 1 ? 'case' : 'cases'}
                    </span>
                    <span className="block font-mono text-sm font-semibold tabular-nums">{gbp(o.perDelivery)}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>

        {/* Summary */}
        <div className="lg:col-span-2 bg-[#F3F7F8] border-t lg:border-t-0 lg:border-l border-black/8 p-5 sm:p-8 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <ProductImage product={product} brandName={brand?.name || ''} className="h-20 w-24 shrink-0 rounded-lg" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#0F5C6E]">{brand?.name}</p>
              <p className="text-sm font-semibold text-[#14181F] leading-snug">{shortName(product)}</p>
            </div>
          </div>

          <div>
            <span className="block text-xs font-medium text-slate-500 mb-1.5">Cases per delivery</span>
            <div className="flex items-center justify-between rounded-xl border border-black/10 bg-white px-2 py-1">
              <button
                type="button"
                onClick={() => setCasesOverride(Math.max(1, cases - 1))}
                disabled={cases <= 1}
                aria-label="Fewer cases"
                className="p-2.5 text-slate-600 disabled:opacity-30"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold tabular-nums">
                {cases} {cases === 1 ? 'case' : 'cases'} · {bottles} bottles
              </span>
              <button
                type="button"
                onClick={() => setCasesOverride(Math.min(20, cases + 1))}
                disabled={cases >= 20}
                aria-label="More cases"
                className="p-2.5 text-slate-600 disabled:opacity-30"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {shortfall ? (
              <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                Lasts about {daysCovered} days, so you&apos;d run out before the next delivery. We suggest {neededCases}.
              </p>
            ) : (
              <p className="mt-2 text-xs text-slate-500">Lasts about {daysCovered} days for your household.</p>
            )}
          </div>

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-600">Each delivery</dt>
              <dd className="font-mono tabular-nums text-slate-500">
                <span className="line-through mr-2">{gbp(product.priceGbp * cases)}</span>
                <span className="font-semibold text-[#14181F]">{gbp(perDelivery)}</span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-600">Delivered</dt>
              <dd className="font-medium text-[#14181F]">{FREQS.find((f) => f.id === freq)?.label}</dd>
            </div>
            <div className="flex justify-between items-baseline border-t border-black/10 pt-3">
              <dt className="font-semibold text-[#14181F]">Per month</dt>
              <dd className="font-mono text-xl font-semibold tabular-nums text-[#14181F]">≈ {gbp(monthly)}</dd>
            </div>
          </dl>
          <p className="-mt-2 text-sm font-semibold text-emerald-700">
            You save {gbp(yearlySaving)} a year ({product.subscriptionDiscountPct}% off every case)
          </p>

          <button
            type="button"
            onClick={() => {
              addToCart(product.id, cases, 'subscribe', freq);
              setAdded(true);
            }}
            className="mt-auto w-full rounded-lg bg-[#0F5C6E] px-6 py-3.5 text-sm font-semibold text-white hover:bg-[#0C4A59]"
          >
            {added ? 'Added to bag ✓' : `Start subscription · ${gbp(perDelivery)}`}
          </button>
          <p className="-mt-2 text-center text-[11px] text-slate-500">Free to pause, skip or cancel any time.</p>
        </div>
      </div>
    </div>
  );
}
