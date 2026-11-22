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
      <div className={`bg-white flex items-center justify-center overflow-hidden ${className}`}>
        <img
          src={product.imageUrl}
          alt={`${product.name}, ${product.packQuantity} × ${product.bottleSizeLabel}`}
          width={800}
          height={600}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          className="h-full w-full object-contain"
        />
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
