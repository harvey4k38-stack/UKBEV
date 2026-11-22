import React, { useState } from 'react';
import { MapPin, PackageCheck, Search, Truck } from 'lucide-react';
import { SeoHead } from '../components/SeoHead';
import { useStore } from '../context/StoreContext';
import type { Order } from '../types';

export function DeliveryPage() {
  const { deliveryZones, checkPostcode, postcodeResult, savedPostcode, apiFetch, navigate } = useStore();
  const [pcInput, setPcInput] = useState(savedPostcode || '');
  const [checking, setChecking] = useState(false);

  const [orderLookupNum, setOrderLookupNum] = useState('');
  const [orderLookupEmail, setOrderLookupEmail] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [lookupError, setLookupError] = useState('');

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setChecking(true);
    try {
      await checkPostcode(pcInput);
    } finally {
      setChecking(false);
    }
  };

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError('');
    setTrackedOrder(null);
    try {
      const params = new URLSearchParams({
        orderNumber: orderLookupNum.trim(),
        email: orderLookupEmail.trim(),
      });
      const ord = await apiFetch<Order>(`/api/orders/lookup?${params.toString()}`);
      setTrackedOrder(ord);
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : 'Order not found.');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-8 py-12 space-y-16">
      <SeoHead
        title="UK Delivery Rates, Postcode Checker & Tracking | UK Beverages"
        description="Check UK bottled water delivery availability, shipping fees, free delivery thresholds, and track your UK Beverages order by postcode."
      />

      {/* Header & Postcode Validator */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start border-b border-black/8 pb-14">
        <div className="lg:col-span-6 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#0F5C6E]">
            United Kingdom Logistics
          </p>
          <h1 className="font-editorial text-4xl sm:text-5xl font-semibold text-[#14181F]">
            UK Delivery Information
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Every case of water is dispatched from our London distribution centre via tracked UK courier. Enter your postcode to confirm delivery availability, shipping fees, and free-delivery thresholds before checkout.
          </p>

          <form onSubmit={handleCheck} className="pt-2 flex flex-col sm:flex-row gap-2.5 max-w-md">
            <input
              type="text"
              value={pcInput}
              onChange={(e) => setPcInput(e.target.value)}
              placeholder="Enter UK postcode (e.g. SW1X 0AZ)"
              aria-label="UK Postcode"
              className="flex-1 rounded-lg border border-black/15 bg-white px-4 py-3 text-sm font-mono uppercase text-[#14181F] focus:border-[#0F5C6E] focus:outline-none"
            />
            <button
              type="submit"
              disabled={checking}
              className="rounded-lg bg-[#14181F] px-6 py-3 text-xs font-semibold text-white hover:bg-[#0F5C6E] transition-colors whitespace-nowrap"
            >
              {checking ? 'Validating…' : 'Check Postcode'}
            </button>
          </form>

          {postcodeResult && (
            <div className="max-w-md rounded-xl border border-black/10 bg-white p-4 text-xs space-y-1.5 shadow-sm">
              {postcodeResult.deliverable && postcodeResult.zone ? (
                <>
                  <p className="font-semibold text-[#0F5C6E] flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    Deliverable to {postcodeResult.normalizedPostcode} · {postcodeResult.zone.name}
                  </p>
                  <p className="text-slate-700 font-mono tabular-nums">
                    Standard: £{postcodeResult.zone.feeGbp.toFixed(2)} · Express: £
                    {postcodeResult.zone.expressFeeGbp.toFixed(2)}
                  </p>
                  <p className="text-slate-700 font-mono tabular-nums">
                    Free standard delivery over £{postcodeResult.zone.freeThresholdGbp.toFixed(2)} · Min order £
                    {postcodeResult.zone.minOrderGbp.toFixed(2)}
                  </p>
                  <p className="text-slate-500">
                    Standard transit: {postcodeResult.zone.estimatedDays}
                  </p>
                </>
              ) : (
                <p className="text-red-700 font-medium">{postcodeResult.reason}</p>
              )}
            </div>
          )}
        </div>

        {/* Live Order Tracking Lookup */}
        <div className="lg:col-span-6 rounded-2xl border border-black/8 bg-white p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#0F5C6E]">
            <PackageCheck className="h-4 w-4" />
            <span>Track Your UK Shipment</span>
          </div>
          <h2 className="font-editorial text-2xl font-semibold text-[#14181F]">
            Order Status &amp; Courier Tracking
          </h2>
          <form onSubmit={handleTrackOrder} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="track-num" className="block text-[11px] text-slate-500 mb-1">
                  Order Number
                </label>
                <input
                  id="track-num"
                  type="text"
                  required
                  value={orderLookupNum}
                  onChange={(e) => setOrderLookupNum(e.target.value)}
                  placeholder="e.g. SH-2026-1042"
                  className="w-full rounded-lg border border-black/15 px-3 py-2 text-xs font-mono uppercase"
                />
              </div>
              <div>
                <label htmlFor="track-email" className="block text-[11px] text-slate-500 mb-1">
                  Order Email (Optional)
                </label>
                <input
                  id="track-email"
                  type="email"
                  value={orderLookupEmail}
                  onChange={(e) => setOrderLookupEmail(e.target.value)}
                  placeholder="claire.bennett@example.co.uk"
                  className="w-full rounded-lg border border-black/15 px-3 py-2 text-xs"
                />
              </div>
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F5C6E] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#0C4A59]"
            >
              <Search className="h-3.5 w-3.5" /> Look Up Order
            </button>
          </form>

          {lookupError && <p className="text-xs text-red-600">{lookupError}</p>}

          {trackedOrder && (
            <div className="rounded-xl bg-[#F8F7F4] border border-black/8 p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-semibold text-[#14181F]">
                  {trackedOrder.orderNumber}
                </span>
                <span className="font-semibold text-[#0F5C6E]">{trackedOrder.status}</span>
              </div>
              <p className="text-slate-600">
                Carrier: {trackedOrder.carrier} · Tracking:{' '}
                <span className="font-mono">{trackedOrder.trackingNumber}</span>
              </p>
              <p className="text-slate-600">
                Destination: {trackedOrder.shippingAddress.city}, {trackedOrder.shippingAddress.postcode}
              </p>
              <button
                onClick={() => navigate(`/order-confirmation/${trackedOrder.id}`)}
                className="text-[#0F5C6E] font-semibold hover:underline pt-1"
              >
                View Full Receipt &amp; Timeline →
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Dynamic UK Delivery Zones Table */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-[#0F5C6E]" />
          <h2 className="font-editorial text-3xl font-semibold text-[#14181F]">
            UK Delivery Zones &amp; Shipping Rates
          </h2>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-black/8 bg-white">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-black/8 bg-[#EFECE6]/60 text-xs uppercase tracking-wider text-slate-600">
              <tr>
                <th className="py-3.5 px-5">Zone</th>
                <th className="py-3.5 px-5">Standard Fee</th>
                <th className="py-3.5 px-5">Express Fee</th>
                <th className="py-3.5 px-5">Free Threshold</th>
                <th className="py-3.5 px-5">Min Order</th>
                <th className="py-3.5 px-5">Estimated Window</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/6">
              {deliveryZones.map((z) => (
                <tr key={z.id}>
                  <td className="py-4 px-5">
                    <p className="font-semibold text-[#14181F]">{z.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5 max-w-xs">{z.description}</p>
                  </td>
                  <td className="py-4 px-5 font-mono tabular-nums">£{z.feeGbp.toFixed(2)}</td>
                  <td className="py-4 px-5 font-mono tabular-nums">£{z.expressFeeGbp.toFixed(2)}</td>
                  <td className="py-4 px-5 font-mono tabular-nums font-semibold text-[#0F5C6E]">
                    £{z.freeThresholdGbp.toFixed(2)}
                  </td>
                  <td className="py-4 px-5 font-mono tabular-nums">£{z.minOrderGbp.toFixed(2)}</td>
                  <td className="py-4 px-5 text-xs text-slate-600">
                    <p>{z.estimatedDays}</p>
                    <p className="text-slate-400">Express: {z.expressDays}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500">
          Note: Deliveries to Channel Islands (GY, JE) and Isle of Man (IM) are currently excluded from standard online checkout. Working days exclude UK bank holidays and weekends.
        </p>
      </section>

      {/* Delivery FAQs */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-black/8 bg-white p-6 space-y-2">
          <h3 className="text-sm font-semibold text-[#14181F]">How are cases packaged?</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Every case arrives shrink-wrapped in recyclable plastic bottles, packed in sturdy outer cartons so nothing gets crushed in transit.
          </p>
        </div>
        <div className="rounded-xl border border-black/8 bg-white p-6 space-y-2">
          <h3 className="text-sm font-semibold text-[#14181F]">Do I need to be in to sign?</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Our tracked DPD UK couriers provide a 1-hour delivery window via SMS/email on the morning of delivery, with safe-place and neighbour options.
          </p>
        </div>
        <div className="rounded-xl border border-black/8 bg-white p-6 space-y-2">
          <h3 className="text-sm font-semibold text-[#14181F]">Can I change my delivery address?</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Subscription delivery addresses can be updated anytime in your Customer Account prior to the next scheduled dispatch cutoff.
          </p>
        </div>
      </section>
    </div>
  );
}
