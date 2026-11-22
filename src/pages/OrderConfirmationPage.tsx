import React, { useEffect, useState } from 'react';
import { CheckCircle2, Mail, Package, RefreshCw } from 'lucide-react';
import { SeoHead } from '../components/SeoHead';
import { useStore } from '../context/StoreContext';
import type { Order } from '../types';

export function OrderConfirmationPage({ orderId }: { orderId: string }) {
  const { apiFetch, navigate, clearCart, refreshStorefront } = useStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get('session_id');
    let attempts = 0;
    let timer = 0;
    const load = () => {
      // Returning from Stripe: verify the payment server-side, then show the order.
      const req = sessionId
        ? apiFetch<Order>(`/api/checkout/confirm?session_id=${encodeURIComponent(sessionId)}`)
        : apiFetch<Order>(`/api/orders/${orderId}`);
      req
        .then((res) => {
          setOrder(res);
          if (res.status !== 'Awaiting Payment') {
            if (sessionId) {
              clearCart();
              refreshStorefront();
            }
          } else if (sessionId && attempts++ < 10) {
            timer = window.setTimeout(load, 2000); // bank transfers / Klarna can take a moment
          }
        })
        .catch((err) => setError(err instanceof Error ? err.message : 'Order not found.'));
    };
    load();
    return () => clearTimeout(timer);
  }, [orderId, apiFetch]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center space-y-4">
        <h1 className="font-editorial text-3xl font-semibold">Order Unavailable</h1>
        <p className="text-sm text-slate-600">{error}</p>
        <button
          onClick={() => navigate('/shop')}
          className="rounded-lg bg-[#14181F] px-6 py-3 text-xs font-semibold text-white"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center text-sm text-slate-500">
        Loading order confirmation…
      </div>
    );
  }

  const hasSub = order.items.some((i) => i.purchaseMode === 'subscribe');

  if (order.status === 'Awaiting Payment') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center space-y-4">
        <h1 className="font-editorial text-3xl font-semibold">Confirming your payment…</h1>
        <p className="text-sm text-slate-600">
          This usually takes a few seconds. You&apos;ll also receive a confirmation email at {order.customerEmail}.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-8 py-14 space-y-8">
      <SeoHead
        title={`Order ${order.orderNumber} Confirmed | UK Beverages`}
        description="Your UK Beverages bottled water order has been confirmed and queued for dispatch."
      />

      <div className="rounded-2xl border border-black/8 bg-white p-8 space-y-6">
        <div className="flex items-start gap-4 border-b border-black/8 pb-6">
          <CheckCircle2 className="h-8 w-8 text-[#0F5C6E] shrink-0 mt-1" />
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#0F5C6E]">
              {order.status === 'Confirmed' ? 'Order confirmed' : `Order ${order.status.toLowerCase()}`}
            </p>
            <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#14181F]">
              Thank you, {order.customerName}
            </h1>
            <p className="text-sm text-slate-600">
              Order <strong className="font-mono">{order.orderNumber}</strong> has been received and a UK VAT confirmation email was sent to{' '}
              <strong>{order.customerEmail}</strong>.
            </p>
          </div>
        </div>

        {/* Shipping & Tracking */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div className="rounded-xl bg-[#F8F7F4] p-4 border border-black/5 space-y-1">
            <p className="font-semibold text-[#14181F] flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-[#0F5C6E]" /> Delivery Destination
            </p>
            <p className="text-slate-700">{order.shippingAddress.recipient}</p>
            <p className="text-slate-600">{order.shippingAddress.line1}</p>
            {order.shippingAddress.line2 && <p className="text-slate-600">{order.shippingAddress.line2}</p>}
            <p className="text-slate-600">
              {order.shippingAddress.city}, {order.shippingAddress.postcode}
            </p>
          </div>

          <div className="rounded-xl bg-[#F8F7F4] p-4 border border-black/5 space-y-1">
            <p className="font-semibold text-[#14181F]">UK Courier &amp; Tracking</p>
            <p className="text-slate-700">
              {order.carrier} ({order.deliveryZoneName})
            </p>
            <p className="text-slate-600 font-mono">Tracking: {order.trackingNumber}</p>
            <p className="text-slate-600">Estimate: {order.estimatedDelivery}</p>
          </div>
        </div>

        {/* Itemized Receipt */}
        <div className="border-t border-black/8 pt-5">
          <h2 className="text-sm font-semibold text-[#14181F] mb-3">Items Ordered</h2>
          <div className="divide-y divide-black/6 text-sm">
            {order.items.map((item, idx) => (
              <div key={`${item.productId}-${idx}`} className="py-3 flex justify-between gap-4">
                <div>
                  <p className="font-medium text-[#14181F]">{item.name}</p>
                  <p className="text-xs text-slate-500">
                    Qty {item.quantity} · {item.bottleSizeLabel} × {item.packQuantity}
                    {item.purchaseMode === 'subscribe' ? ` · Recurring (${item.frequency})` : ''}
                  </p>
                </div>
                <span className="font-mono tabular-nums font-medium">
                  £{item.lineTotalGbp.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-black/8 mt-4 pt-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-mono tabular-nums">£{order.subtotalGbp.toFixed(2)}</span>
            </div>
            {order.discountGbp > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount ({order.discountCode})</span>
                <span className="font-mono tabular-nums">-£{order.discountGbp.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>UK Shipping</span>
              <span className="font-mono tabular-nums">
                {order.shippingGbp === 0 ? 'Free' : `£${order.shippingGbp.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Includes UK VAT (20%)</span>
              <span className="font-mono tabular-nums">£{order.vatIncludedGbp.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-black/10 pt-2.5 text-base font-semibold text-[#14181F]">
              <span>Total Paid{order.paymentLast4 && order.paymentLast4 !== '0000' ? ` (•••• ${order.paymentLast4})` : ''}</span>
              <span className="font-mono tabular-nums">£{order.totalGbp.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Email Notification Log */}
        <div className="rounded-xl border border-black/8 bg-[#EFECE6]/50 p-4 space-y-1.5 text-xs">
          <p className="font-semibold text-[#14181F] flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 text-[#0F5C6E]" /> Email Notification History
          </p>
          {order.emailLog.map((entry, i) => (
            <p key={i} className="font-mono text-[11px] text-slate-600">
              {entry}
            </p>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={() => navigate('/shop')}
            className="rounded-lg bg-[#14181F] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#0F5C6E]"
          >
            Continue Shopping
          </button>
          {hasSub && (
            <button
              onClick={() => navigate('/subscriptions/manage')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#0F5C6E] px-5 py-2.5 text-xs font-semibold text-[#0F5C6E] hover:bg-[#0F5C6E]/5"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Manage Your Subscription
            </button>
          )}
          <button
            onClick={() => navigate('/account')}
            className="rounded-lg border border-black/15 px-5 py-2.5 text-xs font-semibold text-[#14181F] hover:bg-black/5"
          >
            Customer Account
          </button>
        </div>
      </div>
    </div>
  );
}
