import React from 'react';
import { Calendar, PauseCircle, RefreshCw, Shield } from 'lucide-react';
import { HydrationPlanner } from '../components/HydrationPlanner';
import { SeoHead } from '../components/SeoHead';
import { useStore } from '../context/StoreContext';

export function SubscriptionsPage() {
  const { navigate, user } = useStore();

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

      {/* Subscription calculator */}
      <section id="plan-builder" className="mx-auto max-w-6xl px-4 sm:px-8 py-12 sm:py-16 scroll-mt-24">
        <HydrationPlanner />
      </section>
    </div>
  );
}
