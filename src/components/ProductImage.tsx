import React from 'react';
import type { Product } from '../types';
import { BottleArtwork } from './BottleArtwork';

/** Real product photo when we have one, otherwise the illustrated bottle. */
export function ProductImage({
  product,
  brandName,
  className = '',
  eager = false,
}: {
  product: Product;
  brandName: string;
  className?: string;
  eager?: boolean;
}) {
  if (product.imageUrl) {
    return (
      <div className={`relative bg-white flex items-center justify-center overflow-hidden ${className}`}>
        <img
          src={product.imageUrl}
          alt={`${product.name}, ${product.packQuantity} × ${product.bottleSizeLabel}`}
          width={800}
          height={600}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          className="h-full w-full object-contain"
        />
        {/* Single-bottle photos: make it clear the price is for a case */}
        {product.imageUrl.includes('/single/') && product.packQuantity > 1 && (
          <span className="absolute bottom-1.5 left-1.5 rounded-full bg-[#14181F]/85 px-2 py-0.5 text-[10px] font-semibold text-white">
            Case of {product.packQuantity}
          </span>
        )}
      </div>
    );
  }
  return (
    <BottleArtwork
      brandName={brandName}
      bottleStyle={product.bottleStyle}
      capColor={product.capColor}
      tintColor={product.tintColor}
      labelAccent={product.labelAccent}
      sizeLabel={product.bottleSizeLabel}
      waterType={product.waterType}
      packaging={product.packaging}
      className={className}
    />
  );
}
