import React from 'react';
import { ProductImage } from './ProductImage';
import { Check, Plus } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import type { Brand, Product } from '../types';

interface ProductCardProps {
  product: Product;
  brand?: Brand;
}

export function ProductCard({ product, brand }: ProductCardProps) {
  const { addToCart, navigate, compareIds, toggleCompare } = useStore();
  const perBottle = product.priceGbp / product.packQuantity;
  const inStock = product.stock > 0;
  const isCompared = compareIds.includes(product.id);

  return (
    <article className="group flex flex-col justify-between rounded-xl border border-black/8 bg-white overflow-hidden transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <button
        onClick={() => navigate(`/products/${product.slug}`)}
        className="block w-full text-left focus-visible:outline-2 focus-visible:outline-[#0F5C6E]"
      >
        <ProductImage product={product} brandName={brand?.name || 'UK Beverages'} className="h-40 sm:h-64 w-full border-b border-black/5" />

        <div className="p-3 sm:p-5 space-y-1.5 sm:space-y-2">
          {/* Unboxed typographic metadata (no pill badge spam) */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs text-slate-500">
            <span className="font-medium text-[#0F5C6E]">{brand?.name || 'Spring Water'}</span>
            <span aria-hidden="true">·</span>
            <span>{product.waterType}</span>
            <span aria-hidden="true">·</span>
            <span>{product.packaging}</span>
          </div>

          <h3 className="text-sm sm:text-base font-semibold text-[#14181F] leading-snug group-hover:text-[#0F5C6E] transition-colors">
            {product.name}
          </h3>

          <p className="text-xs text-slate-600">
            {product.bottleSizeLabel} × {product.packQuantity} pack
          </p>
        </div>
      </button>

      <div className="px-3 sm:px-5 pb-3 sm:pb-5 pt-2 flex flex-col sm:flex-row sm:items-end justify-between gap-2.5 sm:gap-3 border-t border-black/5 mt-auto">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold font-mono tabular-nums text-[#14181F]">
              £{product.priceGbp.toFixed(2)}
            </span>
            {product.compareAtPriceGbp && (
              <span className="text-xs font-mono tabular-nums text-slate-400 line-through">
                £{product.compareAtPriceGbp.toFixed(2)}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-1.5 text-[11px] text-slate-500 font-mono tabular-nums">
            <span>£{perBottle.toFixed(2)} / unit</span>
            <span aria-hidden="true">·</span>
            <span className={inStock ? 'text-emerald-700' : 'text-red-600'}>
              {inStock ? (product.stock < 12 ? `Only ${product.stock} left` : 'In stock') : 'Out of stock'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => toggleCompare(product.id)}
            title="Compare product"
            className={`hidden sm:inline-flex rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors ${
              isCompared
                ? 'border-[#0F5C6E] bg-[#0F5C6E]/10 text-[#0F5C6E]'
                : 'border-black/10 text-slate-600 hover:bg-black/5'
            }`}
          >
            {isCompared ? <Check className="h-3.5 w-3.5" /> : 'Compare'}
          </button>
          <button
            disabled={!inStock}
            onClick={() => addToCart(product.id, 1, 'once')}
            className="flex-1 sm:flex-none justify-center inline-flex items-center gap-1 rounded-lg bg-[#14181F] px-3.5 py-2.5 sm:py-2 text-sm sm:text-xs font-semibold text-white hover:bg-[#0F5C6E] disabled:opacity-40 transition-colors whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        </div>
      </div>
    </article>
  );
}
