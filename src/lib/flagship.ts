import type { Brand, Product } from '../types';

/** Tongariro Natural Spring Water: our flagship brand, distributed in the UK solely by UK Beverages. */
export const FLAGSHIP_BRAND_ID = 'brand-tongariro';
export const FLAGSHIP_PATH = '/tongariro';

export const isFlagship = (x?: { id?: string; brandId?: string } | null) =>
  !!x && (x.brandId === FLAGSHIP_BRAND_ID || x.id === FLAGSHIP_BRAND_ID);

/** Stable sort that puts the flagship brand (or its products) first. */
export function flagshipFirst<T extends { id?: string; brandId?: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => Number(isFlagship(b)) - Number(isFlagship(a)));
}

/**
 * Mineral / source figures are only shown once confirmed against the supplier's label analysis.
 * Brands default to verified; a brand sets `factsVerified: false` until we have the spec sheet.
 */
export const factsVerified = (b?: Brand | null) => !!b && b.factsVerified !== false;

/** A brand figure for display, or an em dash when it hasn't been verified. */
export function fact(b: Brand | null | undefined, value: number | string | undefined | null, unit = '') {
  if (!factsVerified(b) || value === undefined || value === null || value === '') return '—';
  return `${value}${unit}`;
}

export const brandPath = (b: Pick<Brand, 'id' | 'slug'>) => (isFlagship(b) ? FLAGSHIP_PATH : `/brands/${b.slug}`);

export const tongariroProducts = (products: Product[]) =>
  products
    .filter((p) => p.brandId === FLAGSHIP_BRAND_ID && p.active)
    .sort((a, b) => a.bottleSizeMl - b.bottleSizeMl);
