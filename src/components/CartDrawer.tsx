import React from 'react';
import { ProductImage } from './ProductImage';
import { Minus, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import type { SubscriptionFrequency } from '../types';

export function CartDrawer() {
  const {
    cart,
    cartDrawerOpen,
    setCartDrawerOpen,
    products,
    brands,
    updateCartQuantity,
    updateCartMode,
    removeFromCart,
    cartSubtotalGbp,
    postcodeResult,
    navigate,
  } = useStore();

  if (!cartDrawerOpen) return null;

  const threshold = postcodeResult?.zone?.freeThresholdGbp ?? 45;
  const remainingForFree = Math.max(0, threshold - cartSubtotalGbp);
  const progressPct = Math.min(100, (cartSubtotalGbp / threshold) * 100);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/45">
      <div
        className="absolute inset-0"
        onClick={() => setCartDrawerOpen(false)}
        aria-hidden="true"
      />
      <aside
        className="relative z-10 flex h-full w-full max-w-md flex-col bg-[#F8F7F4] text-[#14181F] shadow-2xl border-l border-black/10"
        aria-label="Shopping Bag"
      >
        <div className="flex items-center justify-between border-b border-black/10 px-6 py-4 bg-white">
          <h2 className="font-editorial text-2xl font-semibold">Your Bag</h2>
          <button
            onClick={() => setCartDrawerOpen(false)}
            className="p-2 rounded-lg text-slate-500 hover:text-[#14181F] hover:bg-black/5"
            aria-label="Close bag"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* UK Delivery Threshold Indicator */}
        <div className="border-b border-black/8 bg-[#EFECE6] px-6 py-3">
          <p className="text-xs text-slate-700">
            {remainingForFree <= 0 ? (
              <span className="font-medium text-[#0F5C6E]">
                Qualifies for complimentary standard UK delivery
                {postcodeResult?.zone ? ` (${postcodeResult.zone.name})` : ''}
              </span>
            ) : (
              <span>
                Add <strong className="font-mono tabular-nums">£{remainingForFree.toFixed(2)}</strong> more for free
                standard UK delivery ({postcodeResult?.zone?.name || 'London & South East threshold £45'})
              </span>
            )}
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/10">
            <div
              className="h-full bg-[#0F5C6E] transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Line Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {cart.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <p className="text-sm text-slate-600">Your delivery bag is currently empty.</p>
              <button
                onClick={() => {
                  setCartDrawerOpen(false);
                  navigate('/shop');
                }}
                className="rounded-lg bg-[#14181F] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#0F5C6E] transition-colors"
              >
                Explore All Water
              </button>
            </div>
          ) : (
            cart.map((entry) => {
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
                  className="flex gap-4 rounded-xl border border-black/8 bg-white p-3.5"
                >
                  <ProductImage product={product} brandName={brand?.name || 'UK Beverages'} className="h-24 w-20 shrink-0 rounded-lg" />
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        onClick={() => {
                          setCartDrawerOpen(false);
                          navigate(`/products/${product.slug}`);
                        }}
                        className="text-left text-sm font-semibold text-[#14181F] hover:text-[#0F5C6E] truncate"
                      >
                        {product.name}
                      </button>
                      <button
                        onClick={() => removeFromCart(entry.id)}
                        aria-label={`Remove ${product.name}`}
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">
                      {product.bottleSizeLabel} × {product.packQuantity} · {product.packaging}
                    </p>

                    {/* Subscription Toggle inside Cart */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        onClick={() =>
                          updateCartMode(
                            entry.id,
                            isSub ? 'once' : 'subscribe',
                            entry.frequency || 'monthly'
                          )
                        }
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium border transition-colors ${
                          isSub
                            ? 'border-[#0F5C6E] bg-[#0F5C6E]/10 text-[#0F5C6E]'
                            : 'border-black/10 text-slate-600 hover:bg-black/5'
                        }`}
                      >
                        <RefreshCw className="h-3 w-3" />
                        {isSub
                          ? `Subscribed (-${product.subscriptionDiscountPct}%)`
                          : `Subscribe & Save ${product.subscriptionDiscountPct}%`}
                      </button>

                      {isSub && (
                        <select
                          aria-label="Delivery frequency"
                          value={entry.frequency || 'monthly'}
                          onChange={(e) =>
                            updateCartMode(entry.id, 'subscribe', e.target.value as SubscriptionFrequency)
                          }
                          className="rounded-md border border-black/15 bg-white px-2 py-1 text-[11px] text-[#14181F]"
                        >
                          <option value="weekly">Weekly</option>
                          <option value="fortnightly">Fortnightly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1.5">
                      <div className="inline-flex items-center rounded-lg border border-black/10">
                        <button
                          onClick={() => updateCartQuantity(entry.id, entry.quantity - 1)}
                          aria-label="Decrease quantity"
                          className="p-1.5 text-slate-600 hover:text-[#14181F]"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-2.5 text-xs font-mono tabular-nums">{entry.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(entry.id, entry.quantity + 1)}
                          aria-label="Increase quantity"
                          className="p-1.5 text-slate-600 hover:text-[#14181F]"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-sm font-semibold font-mono tabular-nums">
                        £{(unitPrice * entry.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        {cart.length > 0 && (
          <div className="border-t border-black/10 bg-white p-6 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Subtotal (incl. UK VAT)</span>
              <span className="text-base font-semibold font-mono tabular-nums">
                £{cartSubtotalGbp.toFixed(2)}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              UK delivery rates & discount codes calculated at checkout.
            </p>
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={() => {
                  setCartDrawerOpen(false);
                  navigate('/cart');
                }}
                className="rounded-lg border border-black/15 px-4 py-2.5 text-xs font-semibold text-[#14181F] hover:bg-black/5 transition-colors"
              >
                View Bag
              </button>
              <button
                onClick={() => {
                  setCartDrawerOpen(false);
                  navigate('/checkout');
                }}
                className="rounded-lg bg-[#0F5C6E] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#0C4A59] transition-colors"
              >
                Checkout
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
