import React, { useEffect, useState } from 'react';
import { Lock, ShieldCheck, Truck } from 'lucide-react';
import { SeoHead } from '../components/SeoHead';
import { useStore } from '../context/StoreContext';
import type { DeliveryZone, OrderItem } from '../types';

interface QuoteResponse {
  items: OrderItem[];
  subtotalGbp: number;
  discountCode?: string;
  discountGbp: number;
  discountError?: string;
  shippingGbp: number;
  vatIncludedGbp: number;
  totalGbp: number;
  zone?: DeliveryZone;
  postcodeCheck?: { valid: boolean; deliverable: boolean; normalizedPostcode: string; reason?: string } | null;
  belowMinimumOrder: boolean;
}

export function CheckoutPage() {
  const { cart, user, savedPostcode, apiFetch, clearCart, navigate, refreshStorefront } = useStore();

  const defaultAddr = user?.addresses?.[0];

  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || defaultAddr?.phone || '');
  const [line1, setLine1] = useState(defaultAddr?.line1 || '');
  const [line2, setLine2] = useState(defaultAddr?.line2 || '');
  const [city, setCity] = useState(defaultAddr?.city || '');
  const [county, setCounty] = useState(defaultAddr?.county || '');
  const [postcode, setPostcode] = useState(defaultAddr?.postcode || savedPostcode || '');

  const [deliveryMethod, setDeliveryMethod] = useState<'standard' | 'express'>('standard');
  const [discountInput, setDiscountInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState('');
  const [paymentMode, setPaymentMode] = useState<'stripe' | 'demo' | 'unavailable' | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const cancelled = new URLSearchParams(window.location.search).get('cancelled') === '1';

  useEffect(() => {
    apiFetch<{ paymentMode: 'stripe' | 'demo' | 'unavailable' }>('/api/checkout/config')
      .then((r) => setPaymentMode(r.paymentMode))
      .catch(() => setPaymentMode('unavailable'));
  }, [apiFetch]);

  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (cart.length === 0) return;
    apiFetch<QuoteResponse>('/api/checkout/quote', {
      method: 'POST',
      body: JSON.stringify({
        items: cart,
        postcode,
        deliveryMethod,
        discountCode: appliedDiscount,
      }),
    })
      .then((res) => setQuote(res))
      .catch(() => {});
  }, [cart, postcode, deliveryMethod, appliedDiscount, apiFetch]);

  const handleApplyDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedDiscount(discountInput.trim().toUpperCase());
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!acceptedTerms) {
      setErrorMsg('Please tick the box to accept our Terms & Conditions.');
      document.getElementById('co-terms')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setSubmitting(true);
    try {
      const result = await apiFetch<{ order?: { id: string }; checkoutUrl?: string }>('/api/checkout/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: cart,
          customerEmail,
          customerName,
          phone,
          shippingAddress: {
            recipient: customerName,
            line1,
            line2,
            city,
            county,
            postcode,
            phone,
          },
          deliveryMethod,
          discountCode: appliedDiscount,
        }),
      });
      if (result.checkoutUrl) {
        // Hand off to Stripe's hosted, PCI-compliant payment page (cards, Apple Pay, Google Pay, Klarna)
        window.location.assign(result.checkoutUrl);
        return;
      }
      clearCart();
      await refreshStorefront();
      navigate(`/order-confirmation/${result.order!.id}`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to complete order.');
      setSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center space-y-4">
        <h1 className="font-editorial text-3xl font-semibold">Your Bag is Empty</h1>
        <p className="text-sm text-slate-600">Add bottled water cases before proceeding to UK checkout.</p>
        <button
          onClick={() => navigate('/shop')}
          className="rounded-lg bg-[#14181F] px-6 py-3 text-xs font-semibold text-white"
        >
          Shop All Water
        </button>
      </div>
    );
  }

  const hasSubItems = cart.some((i) => i.purchaseMode === 'subscribe');

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-8 py-8 sm:py-12 pb-28 lg:pb-12">
      <SeoHead
        title="Secure UK Checkout | UK Beverages"
        description="Complete your bottled water order with UK VAT breakdown, tracked delivery options, and GBP payment methods."
      />

      {cancelled && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900">
          Payment was cancelled. Your bag is saved, so you can pick up where you left off.
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/8 pb-6 mb-8 sm:mb-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#0F5C6E]">
            {user ? `Signed in as ${user.email}` : 'Guest Checkout · No Account Required'}
          </p>
          <h1 className="mt-1 font-editorial text-3xl sm:text-4xl font-semibold text-[#14181F]">
            Checkout
          </h1>
        </div>
        {!user && (
          <button
            onClick={() => navigate('/account')}
            className="text-xs font-semibold text-[#0F5C6E] hover:underline"
          >
            Returning customer? Sign in for saved addresses →
          </button>
        )}
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left: Customer, Address, Shipping, Payment */}
        <div className="lg:col-span-7 space-y-8">
          {/* Contact */}
          <div className="rounded-2xl border border-black/8 bg-white p-6 sm:p-8 space-y-4">
            <h2 className="font-editorial text-2xl font-semibold">01. Contact Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="co-name" className="block text-xs font-medium text-slate-600 mb-1">
                  Full Name *
                </label>
                <input
                  id="co-name"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Claire Bennett"
                  className="w-full rounded-lg border border-black/15 px-3.5 py-2.5 text-sm"
                />
              </div>
              <div>
                <label htmlFor="co-email" className="block text-xs font-medium text-slate-600 mb-1">
                  Email for Order &amp; Tracking *
                </label>
                <input
                  id="co-email"
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="claire@example.co.uk"
                  className="w-full rounded-lg border border-black/15 px-3.5 py-2.5 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="co-phone" className="block text-xs font-medium text-slate-600 mb-1">
                  UK Mobile (for Courier SMS Window) *
                </label>
                <input
                  id="co-phone"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07700 900412"
                  className="w-full rounded-lg border border-black/15 px-3.5 py-2.5 text-sm"
                />
              </div>
            </div>
          </div>

          {/* UK Delivery Address */}
          <div className="rounded-2xl border border-black/8 bg-white p-6 sm:p-8 space-y-4">
            <h2 className="font-editorial text-2xl font-semibold">02. UK Delivery Address</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="co-line1" className="block text-xs font-medium text-slate-600 mb-1">
                  Address Line 1 *
                </label>
                <input
                  id="co-line1"
                  required
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  placeholder="18 Pavilion Road"
                  className="w-full rounded-lg border border-black/15 px-3.5 py-2.5 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="co-line2" className="block text-xs font-medium text-slate-600 mb-1">
                  Address Line 2 (Optional)
                </label>
                <input
                  id="co-line2"
                  value={line2}
                  onChange={(e) => setLine2(e.target.value)}
                  placeholder="Flat 3"
                  className="w-full rounded-lg border border-black/15 px-3.5 py-2.5 text-sm"
                />
              </div>
              <div>
                <label htmlFor="co-city" className="block text-xs font-medium text-slate-600 mb-1">
                  Town / City *
                </label>
                <input
                  id="co-city"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="London"
                  className="w-full rounded-lg border border-black/15 px-3.5 py-2.5 text-sm"
                />
              </div>
              <div>
                <label htmlFor="co-county" className="block text-xs font-medium text-slate-600 mb-1">
                  County (Optional)
                </label>
                <input
                  id="co-county"
                  value={county}
                  onChange={(e) => setCounty(e.target.value)}
                  placeholder="Greater London"
                  className="w-full rounded-lg border border-black/15 px-3.5 py-2.5 text-sm"
                />
              </div>
              <div>
                <label htmlFor="co-postcode" className="block text-xs font-medium text-slate-600 mb-1">
                  UK Postcode *
                </label>
                <input
                  id="co-postcode"
                  required
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                  placeholder="SW1X 0AZ"
                  className="w-full rounded-lg border border-black/15 px-3.5 py-2.5 text-sm font-mono uppercase"
                />
              </div>
              <div className="flex items-end">
                {quote?.postcodeCheck && (
                  <p
                    className={`text-xs pb-2 ${
                      quote.postcodeCheck.deliverable ? 'text-[#0F5C6E] font-medium' : 'text-red-600'
                    }`}
                  >
                    {quote.postcodeCheck.deliverable && quote.zone
                      ? `Zone: ${quote.zone.name}`
                      : quote.postcodeCheck.reason}
                  </p>
                )}
              </div>
            </div>

            {/* Delivery Method */}
            {quote?.zone && (
              <div className="pt-3 space-y-2.5">
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Courier Option ({quote.zone.name})
                </span>
                <label className="flex items-center justify-between rounded-xl border border-black/12 p-3.5 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="deliveryMethod"
                      checked={deliveryMethod === 'standard'}
                      onChange={() => setDeliveryMethod('standard')}
                      className="accent-[#0F5C6E]"
                    />
                    <div>
                      <span className="text-sm font-semibold text-[#14181F] block">
                        Standard Tracked UK Courier
                      </span>
                      <span className="text-xs text-slate-500">{quote.zone.estimatedDays}</span>
                    </div>
                  </div>
                  <span className="text-sm font-mono font-semibold">
                    {quote.subtotalGbp - quote.discountGbp >= quote.zone.freeThresholdGbp
                      ? 'Free'
                      : `£${quote.zone.feeGbp.toFixed(2)}`}
                  </span>
                </label>

                <label className="flex items-center justify-between rounded-xl border border-black/12 p-3.5 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="deliveryMethod"
                      checked={deliveryMethod === 'express'}
                      onChange={() => setDeliveryMethod('express')}
                      className="accent-[#0F5C6E]"
                    />
                    <div>
                      <span className="text-sm font-semibold text-[#14181F] block">
                        Express DPD Priority
                      </span>
                      <span className="text-xs text-slate-500">{quote.zone.expressDays}</span>
                    </div>
                  </div>
                  <span className="text-sm font-mono font-semibold">
                    £{quote.zone.expressFeeGbp.toFixed(2)}
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Secure payment (Stripe Checkout) */}
          <div className="rounded-2xl border border-black/8 bg-white p-5 sm:p-8 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-editorial text-2xl font-semibold">03. Payment</h2>
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <Lock className="h-3.5 w-3.5" /> Secured by Stripe
              </span>
            </div>
            <p className="text-sm text-slate-600">
              After you continue, you&apos;ll pay on Stripe&apos;s secure checkout page. We never see or store
              your card details.
            </p>
            <div className="flex flex-wrap gap-2">
              {['Visa', 'Mastercard', 'Amex', 'Apple Pay', 'Google Pay', 'Klarna'].map((m) => (
                <span
                  key={m}
                  className="rounded-md border border-black/10 bg-[#F8F7F4] px-2.5 py-1 text-[11px] font-semibold text-slate-700"
                >
                  {m}
                </span>
              ))}
            </div>
            {paymentMode === 'demo' && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <strong>Demo mode:</strong> Stripe isn&apos;t connected yet, so orders are confirmed without
                payment. Add <code>STRIPE_SECRET_KEY</code> to take real payments.
              </p>
            )}
            {paymentMode === 'unavailable' && (
              <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                Online payments are temporarily unavailable. Please try again shortly.
              </p>
            )}
          </div>
        </div>

        {/* Right: Order Totals & Discount Code */}
        <div className="lg:col-span-5 rounded-2xl border border-black/8 bg-white p-6 sm:p-8 space-y-5 lg:sticky lg:top-24">
          <h2 className="font-editorial text-2xl font-semibold text-[#14181F]">Order Summary</h2>

          <div className="divide-y divide-black/6 max-h-72 overflow-y-auto pr-1">
            {(quote?.items || []).map((item, idx) => (
              <div key={`${item.productId}-${idx}`} className="py-3 flex justify-between gap-3 text-xs">
                <div>
                  <p className="font-semibold text-[#14181F]">{item.name}</p>
                  <p className="text-slate-500">
                    Qty {item.quantity} · {item.bottleSizeLabel} × {item.packQuantity}
                    {item.purchaseMode === 'subscribe' ? ` · ${item.frequency} subscription` : ''}
                  </p>
                </div>
                <span className="font-mono tabular-nums font-semibold shrink-0">
                  £{item.lineTotalGbp.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Discount Code */}
          <div className="border-t border-black/8 pt-4 space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                placeholder="Discount code (e.g. WELCOME10)"
                aria-label="Discount code"
                className="flex-1 rounded-lg border border-black/15 px-3 py-2 text-xs font-mono uppercase"
              />
              <button
                type="button"
                onClick={handleApplyDiscount}
                className="rounded-lg bg-[#EFECE6] px-4 py-2 text-xs font-semibold text-[#14181F] hover:bg-black/10"
              >
                Apply
              </button>
            </div>
            {quote?.discountError && <p className="text-xs text-red-600">{quote.discountError}</p>}
            {quote?.discountCode && (
              <p className="text-xs text-emerald-700 font-medium">
                Code {quote.discountCode} applied
              </p>
            )}
          </div>

          {quote && (
            <div className="border-t border-black/8 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums">£{quote.subtotalGbp.toFixed(2)}</span>
              </div>
              {quote.discountGbp > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount ({quote.discountCode})</span>
                  <span className="font-mono tabular-nums">-£{quote.discountGbp.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>UK Delivery ({quote.zone?.name || 'Mainland'})</span>
                <span className="font-mono tabular-nums">
                  {quote.shippingGbp === 0 ? 'Free' : `£${quote.shippingGbp.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Includes UK VAT (20%)</span>
                <span className="font-mono tabular-nums">£{quote.vatIncludedGbp.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-black/10 pt-3 text-lg font-semibold text-[#14181F]">
                <span>Total (GBP)</span>
                <span className="font-mono tabular-nums">£{quote.totalGbp.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* UK Consumer Checkout Disclosure */}
          <label id="co-terms" className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 accent-[#0F5C6E]"
            />
            <span>
              I agree to UK Beverages&apos;{' '}
              <button
                type="button"
                onClick={() => navigate('/legal/terms')}
                className="underline text-[#14181F]"
              >
                Terms &amp; Conditions
              </button>
              {hasSubItems && (
                <>
                  {' '}
                  and{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/legal/subscriptions')}
                    className="underline text-[#14181F]"
                  >
                    Recurring Subscription Terms
                  </button>{' '}
                  (cancel anytime before dispatch)
                </>
              )}
              .
            </span>
          </label>

          {errorMsg && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || Boolean(quote?.belowMinimumOrder) || paymentMode === 'unavailable'}
            className="hidden lg:block w-full rounded-lg bg-[#0F5C6E] px-5 py-3.5 text-sm font-semibold tracking-wide text-white hover:bg-[#0C4A59] disabled:opacity-45 transition-colors"
          >
            {submitting ? 'Redirecting to secure payment…' : `Continue to payment · £${(quote?.totalGbp || 0).toFixed(2)}`}
          </button>

          <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 pt-1">
            <span className="inline-flex items-center gap-1">
              <Truck className="h-3.5 w-3.5" /> Tracked UK Delivery
            </span>
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> 14-Day UK Returns
            </span>
          </div>
        </div>
        {/* Mobile: sticky pay bar so the CTA is always in reach */}
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 backdrop-blur px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-3">
            <div className="shrink-0">
              <p className="text-[11px] text-slate-500 leading-none">Total incl. VAT</p>
              <p className="font-mono text-lg font-semibold tabular-nums">£{(quote?.totalGbp || 0).toFixed(2)}</p>
            </div>
            <button
              type="submit"
              disabled={submitting || Boolean(quote?.belowMinimumOrder) || paymentMode === 'unavailable'}
              className="flex-1 rounded-lg bg-[#0F5C6E] px-4 py-3.5 text-sm font-semibold text-white disabled:opacity-45"
            >
              {submitting ? 'Redirecting…' : 'Continue to payment'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
