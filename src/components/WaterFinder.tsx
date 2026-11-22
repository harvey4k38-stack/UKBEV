import React, { useMemo, useState } from 'react';
import { ProductImage } from './ProductImage';
import { ArrowLeft, Check, RotateCcw, Sparkles } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import type { Brand, Product } from '../types';

/**
 * "Find your water" — a three-tap quiz that turns browsers into buyers with a
 * personalised pick and a one-tap add to bag.
 */

type Fizz = 'Still' | 'Sparkling';
type Occasion = 'go' | 'table' | 'home';
type Taste = 'light' | 'smooth' | 'mineral' | 'alkaline';

const QUESTIONS = [
  {
    key: 'fizz',
    title: 'Still or sparkling?',
    options: [
      { value: 'Still', label: 'Still', hint: 'Pure and easy-drinking' },
      { value: 'Sparkling', label: 'Sparkling', hint: 'Fine natural bubbles' },
    ],
  },
  {
    key: 'occasion',
    title: 'Where will you drink it most?',
    options: [
      { value: 'go', label: 'On the go', hint: 'Desk, gym, school run' },
      { value: 'table', label: 'At the table', hint: 'Dinners & entertaining' },
      { value: 'home', label: 'Stocking up at home', hint: 'The whole household' },
    ],
  },
  {
    key: 'taste',
    title: 'How do you like it to taste?',
    options: [
      { value: 'light', label: 'Light & soft', hint: 'Barely-there minerals' },
      { value: 'smooth', label: 'Smooth & silky', hint: 'Soft, rounded mouthfeel' },
      { value: 'mineral', label: 'Crisp & mineral', hint: 'Classic Alpine character' },
      { value: 'alkaline', label: 'Naturally alkaline', hint: 'Higher pH, clean finish' },
    ],
  },
] as const;

const TASTE_BRANDS: Record<Taste, string[]> = {
  light: ['brand-icelandic-glacial', 'brand-tongariro', 'brand-highland-spring'],
  smooth: ['brand-fiji', 'brand-tongariro'],
  mineral: ['brand-evian', 'brand-highland-spring'],
  alkaline: ['brand-icelandic-glacial', 'brand-fiji'],
};

const TASTE_REASON: Record<Taste, (b: Brand) => string> = {
  light: (b) => `Very low mineral content (${b.mineralProfile.tds} mg/L) for a soft, light taste.`,
  smooth: (b) => `Naturally rich in silica for that famously smooth mouthfeel (pH ${b.mineralProfile.ph}).`,
  mineral: (b) => `Balanced calcium & magnesium (${b.mineralProfile.tds} mg/L) give a crisp, refreshing finish.`,
  alkaline: (b) => `Naturally alkaline at pH ${b.mineralProfile.ph}, straight from the source.`,
};

function scoreProduct(p: Product, occasion: Occasion, taste: Taste) {
  let score = 0;
  const brandRank = TASTE_BRANDS[taste].indexOf(p.brandId);
  if (brandRank >= 0) score += 6 - brandRank * 2;
  if (occasion === 'go' && p.bottleSizeMl <= 500) score += 5;
  if (occasion === 'table' && p.bottleSizeMl >= 700 && p.bottleSizeMl <= 1000) score += 5;
  if (occasion === 'home' && p.bottleSizeMl >= 1000) score += 5;
  if (p.isBestSeller) score += 1;
  if (p.stock <= 0) score -= 100;
  return score;
}

export function WaterFinder() {
  const { products, brands, addToCart, navigate } = useStore();
  const [answers, setAnswers] = useState<{ fizz?: Fizz; occasion?: Occasion; taste?: Taste }>({});
  const [added, setAdded] = useState<string | null>(null);

  const stepIndex = !answers.fizz ? 0 : !answers.occasion ? 1 : !answers.taste ? 2 : 3;
  const done = stepIndex === 3;

  const results = useMemo(() => {
    if (!done) return [];
    return products
      .filter((p) => p.active && p.waterType === answers.fizz)
      .map((p) => ({ p, s: scoreProduct(p, answers.occasion!, answers.taste!) }))
      .sort((a, b) => b.s - a.s)
      .slice(0, 3)
      .map((r) => r.p);
  }, [done, products, answers]);

  const choose = (key: string, value: string) => {
    setAdded(null);
    setAnswers((a) => ({ ...a, [key]: value }));
  };
  const back = () => {
    const keys = ['fizz', 'occasion', 'taste'] as const;
    const last = keys[Math.min(stepIndex, 3) - 1];
    if (last) setAnswers((a) => ({ ...a, [last]: undefined }));
  };
  const restart = () => {
    setAnswers({});
    setAdded(null);
  };

  const brandOf = (p: Product) => brands.find((b) => b.id === p.brandId);
  const [top, ...alts] = results;
  const topBrand = top ? brandOf(top) : undefined;

  return (
    <section className="bg-[#0B1724] text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-8 py-12 sm:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        <div className="lg:col-span-4 space-y-3">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#7CC4D8]">
            <Sparkles className="h-3.5 w-3.5" /> 20-second quiz
          </p>
          <h2 className="font-editorial text-3xl sm:text-4xl font-semibold leading-tight">Find your water</h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Five springs, fifteen formats. Answer three quick questions and we&apos;ll match you with the one
            you&apos;ll love.
          </p>
          {/* progress */}
          <div className="flex gap-1.5 pt-2" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors duration-500 ${
                  i < stepIndex ? 'bg-[#7CC4D8]' : 'bg-white/15'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="lg:col-span-8 lg:min-h-[220px]">
          {!done ? (
            <div key={stepIndex} className="journey-caption space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl sm:text-2xl font-semibold">{QUESTIONS[stepIndex].title}</h3>
                {stepIndex > 0 && (
                  <button onClick={back} className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white">
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                  </button>
                )}
              </div>
              <div className={`grid gap-3 ${QUESTIONS[stepIndex].options.length > 3 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'}`}>
                {QUESTIONS[stepIndex].options.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => choose(QUESTIONS[stepIndex].key, o.value)}
                    className="group rounded-xl border border-white/12 bg-white/[0.04] p-4 sm:p-5 text-left transition-all hover:border-[#7CC4D8]/70 hover:bg-white/[0.08] active:scale-[0.98]"
                  >
                    <span className="block text-base font-semibold text-white">{o.label}</span>
                    <span className="mt-1 block text-xs text-slate-400 group-hover:text-slate-300">{o.hint}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : top && topBrand ? (
            <div className="journey-caption space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#7CC4D8]">Your match</p>
                <button onClick={restart} className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white">
                  <RotateCcw className="h-3.5 w-3.5" /> Start again
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-0 overflow-hidden rounded-2xl bg-white text-[#14181F]">
                <ProductImage product={top} brandName={topBrand.name} className="sm:col-span-2 h-48 sm:h-full min-h-[200px]" />
                <div className="sm:col-span-3 p-5 sm:p-6 space-y-3">
                  <p className="text-xs text-[#0F5C6E] font-semibold">
                    {topBrand.name} · {topBrand.country}
                  </p>
                  <h3 className="text-xl font-semibold leading-snug">{top.name}</h3>
                  <p className="text-sm text-slate-600">{TASTE_REASON[answers.taste!](topBrand)}</p>
                  <p className="text-xs text-slate-500">
                    {top.bottleSizeLabel} × {top.packQuantity} · £{(top.priceGbp / top.packQuantity).toFixed(2)} per bottle
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <span className="font-mono text-2xl font-semibold tabular-nums">£{top.priceGbp.toFixed(2)}</span>
                    <button
                      onClick={() => {
                        addToCart(top.id, 1, 'once');
                        setAdded(top.id);
                      }}
                      className="inline-flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-lg bg-[#0F5C6E] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0C4A59]"
                    >
                      {added === top.id ? (
                        <>
                          <Check className="h-4 w-4" /> Added
                        </>
                      ) : (
                        'Add to bag'
                      )}
                    </button>
                    <button
                      onClick={() => navigate(`/products/${top.slug}`)}
                      className="text-sm font-semibold text-[#0F5C6E] hover:underline"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
              {alts.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {alts.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => navigate(`/products/${p.slug}`)}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-left hover:bg-white/[0.08]"
                    >
                      <span>
                        <span className="block text-[11px] text-slate-400">Also great</span>
                        <span className="block text-sm font-medium">{p.name}</span>
                      </span>
                      <span className="font-mono text-sm tabular-nums text-slate-300">£{p.priceGbp.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-300">
              We couldn&apos;t find a match in stock right now.{' '}
              <button onClick={restart} className="underline">
                Try again
              </button>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
