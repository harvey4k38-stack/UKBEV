import React, { useMemo, useState } from 'react';
import { CalendarClock, Minus, Plus, Users } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import type { SubscriptionFrequency } from '../types';

/**
 * "Never run out" planner: household size + daily drinking → exactly how many cases,
 * how often, and what a subscription saves per year. One tap to subscribe.
 */

const BOTTLE_ML = 500;
const FREQ_DAYS: Record<SubscriptionFrequency, number> = { weekly: 7, fortnightly: 14, monthly: 30 };
const FREQ_LABEL: Record<SubscriptionFrequency, string> = {
  weekly: 'every week',
  fortnightly: 'every 2 weeks',
  monthly: 'every month',
};

export function HydrationPlanner({ compact = false }: { compact?: boolean }) {
  const { products, brands, addToCart } = useStore();
  const eligible = useMemo(
    () => products.filter((p) => p.active && p.stock > 0 && p.subscriptionDiscountPct > 0),
    [products]
  );
  const [people, setPeople] = useState(2);
  const [bottles, setBottles] = useState(2);
  const [productId, setProductId] = useState(
    () => eligible.find((p) => p.isBestSeller && p.bottleSizeMl <= 500)?.id || eligible[0]?.id || ''
  );
  const product = eligible.find((p) => p.id === productId) || eligible[0];

  const plan = useMemo(() => {
    if (!product) return null;
    const litresPerDay = (people * bottles * BOTTLE_ML) / 1000;
    const caseLitres = (product.bottleSizeMl * product.packQuantity) / 1000;
    // Pick the least frequent delivery that keeps each drop to a sensible size (≤ 4 cases)
    const order: SubscriptionFrequency[] = ['monthly', 'fortnightly', 'weekly'];
    let frequency: SubscriptionFrequency = 'weekly';
    let cases = 1;
    for (const f of order) {
      const c = Math.max(1, Math.ceil((litresPerDay * FREQ_DAYS[f]) / caseLitres));
      if (c <= 4 || f === 'weekly') {
        frequency = f;
        cases = c;
        break;
      }
    }
    const subUnit = product.priceGbp * (1 - product.subscriptionDiscountPct / 100);
    const deliveriesPerYear = 365 / FREQ_DAYS[frequency];
    const yearlySub = subUnit * cases * deliveriesPerYear;
    const yearlyOnce = product.priceGbp * cases * deliveriesPerYear;
    return {
      litresPerDay,
      frequency,
      cases,
      perDelivery: subUnit * cases,
      yearlySaving: yearlyOnce - yearlySub,
      bottlesPerDelivery: cases * product.packQuantity,
    };
  }, [product, people, bottles]);

  const [added, setAdded] = useState(false);
  if (!product || !plan) return null;
  const brand = brands.find((b) => b.id === product.brandId);

  const Stepper = ({
    label,
    value,
    set,
    min,
    max,
    suffix,
  }: {
    label: string;
    value: number;
    set: (n: number) => void;
    min: number;
    max: number;
    suffix: string;
  }) => (
    <div>
      <span className="block text-xs font-medium text-slate-500 mb-1.5">{label}</span>
      <div className="flex items-center justify-between rounded-xl border border-black/10 bg-white">
        <button
          type="button"
          onClick={() => set(Math.max(min, value - 1))}
          className="p-3 text-slate-600 hover:text-[#14181F] disabled:opacity-30"
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold tabular-nums">
          {value} {suffix}
        </span>
        <button
          type="button"
          onClick={() => set(Math.min(max, value + 1))}
          className="p-3 text-slate-600 hover:text-[#14181F] disabled:opacity-30"
          disabled={value >= max}
          aria-label={`Increase ${label}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className={`rounded-2xl border border-black/8 bg-white ${compact ? 'p-5 sm:p-6' : 'p-5 sm:p-8'}`}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#0F5C6E]">
        <CalendarClock className="h-4 w-4" /> Never-run-out planner
      </div>
      <h3 className="mt-2 font-editorial text-2xl sm:text-3xl font-semibold text-[#14181F]">
        How much water does your home need?
      </h3>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stepper label="People at home" value={people} set={setPeople} min={1} max={8} suffix={people === 1 ? 'person' : 'people'} />
        <Stepper label="500ml bottles each per day" value={bottles} set={setBottles} min={1} max={6} suffix={bottles === 1 ? 'bottle' : 'bottles'} />
        <label className="block">
          <span className="block text-xs font-medium text-slate-500 mb-1.5">Your water</span>
          <select
            value={product.id}
            onChange={(e) => {
              setProductId(e.target.value);
              setAdded(false);
            }}
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm"
          >
            {eligible.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name.replace(' Natural Mineral Water', '').replace(' Natural Artesian Water', '')}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-5 rounded-xl bg-[#F3F7F8] p-4 sm:p-5">
        <p className="text-sm text-slate-600">
          <Users className="inline h-4 w-4 mr-1 -mt-0.5 text-[#0F5C6E]" />
          Your household drinks about <strong className="text-[#14181F]">{plan.litresPerDay.toFixed(1)} L a day</strong>.
          We suggest:
        </p>
        <p className="mt-2 text-lg sm:text-xl font-semibold text-[#14181F]">
          {plan.cases} {plan.cases === 1 ? 'case' : 'cases'} of {brand?.name} {product.bottleSizeLabel}{' '}
          {FREQ_LABEL[plan.frequency]}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">{plan.bottlesPerDelivery} bottles per delivery</p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-2xl font-semibold tabular-nums text-[#14181F]">
              £{plan.perDelivery.toFixed(2)}
              <span className="text-sm font-normal text-slate-500"> / delivery</span>
            </p>
            <p className="text-sm font-semibold text-emerald-700">
              You save £{plan.yearlySaving.toFixed(0)} a year vs one-off orders ({product.subscriptionDiscountPct}% off)
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              addToCart(product.id, plan.cases, 'subscribe', plan.frequency);
              setAdded(true);
            }}
            className="w-full sm:w-auto rounded-lg bg-[#0F5C6E] px-6 py-3.5 text-sm font-semibold text-white hover:bg-[#0C4A59]"
          >
            {added ? 'Added to bag ✓' : 'Start my subscription'}
          </button>
        </div>
        <p className="mt-3 text-[11px] text-slate-500">Pause, skip or cancel any time from your account.</p>
      </div>
    </div>
  );
}
