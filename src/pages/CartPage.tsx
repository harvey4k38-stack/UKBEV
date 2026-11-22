import React, { useState } from 'react';
import { ProductImage } from '../components/ProductImage';
import { Minus, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { SeoHead } from '../components/SeoHead';
import { useStore } from '../context/StoreContext';
import type { SubscriptionFrequency } from '../types';

export function CartPage() {
  const {
    cart,
    products,
    brands,
    updateCartQuantity,
    updateCartMode,
    removeFromCart,
    cartSubtotalGbp,
    postcodeResult,
    savedPostcode,
    checkPostcode,
    navigate,
  } = useStore();

  const [pcInput, setPcInput] = useState(savedPostcode || '');

  const handlePc = async (e: React.FormEvent) => {
    e.preventDefault();
    await checkPostcode(pcInput);
  };

  const zone = postcodeResult?.zone;
  const estShipping = zone
    ? cartSubtotalGbp >= zone.freeThresholdGbp
      ? 0
      : zone.feeGbp
    : cartSubtotalGbp >= 45
    ? 0
    : 4.95;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-8 py-12">
      <SeoHead
        title="Your Shopping Bag | UK Beverages"
        description="Review your bottled water order, adjust case quantities or subscription frequencies, and estimate UK delivery."
      />

      <h1 className="font-editorial text-4xl font-semibold text-[#14181F] mb-8">Shopping Bag</h1>

      {cart.length === 0 ? (
        <div className="rounded-2xl border border-black/8 bg-white p-12 text-center space-y-4">
          <p className="text-base text-slate-600">Your bag is currently empty.</p>
          <button
            onClick={() => navigate('/shop')}
            className="rounded-lg bg-[#14181F] px-6 py-3 text-xs font-semibold text-white hover:bg-[#0F5C6E]"
          >
            Browse All Water
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-4">
            {cart.map((entry) => {
              const product = products.find((p) => p.id === entry.productId);
              if (!product) return null;
              const brand = brands.find((b) => b.id === product.brandId);
              const isSub = entry.purchaseMode === 'subscribe';
              const unitPrice = isSub
                ? product.priceGbp * (1 - product.subscriptionDiscountPct / 100)
                : product.priceGbp;

              return (
                <div
                  key={entry.id}
                  className="flex flex-col sm:flex-row gap-5 rounded-xl border border-black/8 bg-white p-5"
                >
                  <ProductImage product={product} brandName={brand?.name || 'UK Beverages'} className="h-32 w-28 shrink-0 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs text-[#0F5C6E] font-medium">{brand?.name}</p>
                        <button
                          onClick={() => navigate(`/products/${product.slug}`)}
                          className="text-base font-semibold text-[#14181F] hover:text-[#0F5C6E] text-left"
                        >
                          {product.name}
                        </button>
                        <p className="text-xs text-slate-500">
                          {product.bottleSizeLabel} × {product.packQuantity} · {product.packaging}
                        </p>
                      </div>
                      <span className="text-base font-semibold font-mono tabular-nums">
                        £{(unitPrice * entry.quantity).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center rounded-lg border border-black/12">
                          <button
                            onClick={() => updateCartQuantity(entry.id, entry.quantity - 1)}
                            className="p-2 text-slate-600 hover:text-[#14181F]"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="px-3 text-xs font-mono tabular-nums">{entry.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(entry.id, entry.quantity + 1)}
                            className="p-2 text-slate-600 hover:text-[#14181F]"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() =>
                            updateCartMode(
                              entry.id,
                              isSub ? 'once' : 'subscribe',
                              entry.frequency || 'monthly'
                            )
                          }
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium ${
                            isSub
                              ? 'border-[#0F5C6E] bg-[#0F5C6E]/10 text-[#0F5C6E]'
                              : 'border-black/12 text-slate-600 hover:bg-black/5'
                          }`}
                        >
                          <RefreshCw className="h-3 w-3" />
                          {isSub
                            ? `Subscribed (-${product.subscriptionDiscountPct}%)`
                            : `Switch to Subscription (-${product.subscriptionDiscountPct}%)`}
                        </button>

                        {isSub && (
                          <select
                            value={entry.frequency || 'monthly'}
                            onChange={(e) =>
                              updateCartMode(
                                entry.id,
                                'subscribe',
                                e.target.value as SubscriptionFrequency
                              )
                            }
                            className="rounded-lg border border-black/12 bg-white px-2.5 py-2 text-xs"
                          >
                            <option value="weekly">Weekly</option>
                            <option value="fortnightly">Fortnightly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        )}
                      </div>

                      <button
                        onClick={() => removeFromCart(entry.id)}
                        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-4 rounded-2xl border border-black/8 bg-white p-6 space-y-5">
            <h2 className="font-editorial text-2xl font-semibold text-[#14181F]">Order Summary</h2>

            <form onSubmit={handlePc} className="space-y-2">
              <label htmlFor="cart-pc" className="block text-xs font-medium text-slate-600">
                Estimate UK Delivery by Postcode
              </label>
              <div className="flex gap-2">
                <input
                  id="cart-pc"
                  type="text"
                  value={pcInput}
                  onChange={(e) => setPcInput(e.target.value)}
                  placeholder="SW1X 0AZ"
                  className="flex-1 rounded-lg border border-black/15 px-3 py-2 text-xs font-mono uppercase"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-[#EFECE6] px-3.5 py-2 text-xs font-semibold text-[#14181F] hover:bg-black/10"
                >
                  Apply
                </button>
              </div>
              {postcodeResult && (
                <p className={`text-xs ${postcodeResult.deliverable ? 'text-[#0F5C6E]' : 'text-red-600'}`}>
                  {postcodeResult.deliverable && postcodeResult.zone
                    ? `${postcodeResult.zone.name}: ${postcodeResult.zone.estimatedDays}`
                    : postcodeResult.reason}
                </p>
              )}
            </form>

            <div className="border-t border-black/8 pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal (incl. UK VAT)</span>
                <span className="font-mono tabular-nums font-medium">£{cartSubtotalGbp.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">
                  Est. Standard Delivery{zone ? ` (${zone.name})` : ''}
                </span>
                <span className="font-mono tabular-nums font-medium">
                  {estShipping === 0 ? 'Free' : `£${estShipping.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between border-t border-black/8 pt-3 text-base font-semibold">
                <span>Estimated Total</span>
                <span className="font-mono tabular-nums">
                  £{(cartSubtotalGbp + estShipping).toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full rounded-lg bg-[#0F5C6E] px-5 py-3.5 text-xs font-semibold tracking-wide text-white hover:bg-[#0C4A59] transition-colors"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
