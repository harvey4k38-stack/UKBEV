import React, { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { SeoHead } from '../components/SeoHead';
import { useStore } from '../context/StoreContext';

type CollectionTab =
  | 'all'
  | 'still'
  | 'sparkling'
  | 'premium'
  | 'plastic'
  | 'bulk'
  | 'bestsellers';

export function ShopPage() {
  const { brands, products, compareIds, toggleCompare, clearCompare, navigate } = useStore();

  const [collectionTab, setCollectionTab] = useState<CollectionTab>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [sizeFilter, setSizeFilter] = useState<string>('all');
  const [packFilter, setPackFilter] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<number>(60);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'per-litre'>('featured');
  const [showCompareModal, setShowCompareModal] = useState(false);

  const uniqueSizes = useMemo(
    () => Array.from(new Set(products.map((p) => p.bottleSizeLabel))),
    [products]
  );
  const uniquePacks = useMemo(
    () => Array.from(new Set(products.map((p) => p.packQuantity))).sort((a, b) => a - b),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = products.filter((p) => {
      if (collectionTab === 'still' && p.waterType !== 'Still') return false;
      if (collectionTab === 'sparkling' && p.waterType !== 'Sparkling') return false;
      if (collectionTab === 'plastic' && !['PET', 'rPET'].includes(p.packaging)) return false;
      if (collectionTab === 'bulk' && p.packQuantity < 12 && p.bottleSizeMl < 1500) return false;
      if (collectionTab === 'bestsellers' && !p.isBestSeller) return false;
      if (collectionTab === 'premium' && !p.isFeatured) return false;

      if (brandFilter !== 'all' && p.brandId !== brandFilter) return false;
      if (sizeFilter !== 'all' && p.bottleSizeLabel !== sizeFilter) return false;
      if (packFilter !== 'all' && String(p.packQuantity) !== packFilter) return false;
      if (p.priceGbp > maxPrice) return false;

      if (q) {
        const brand = brands.find((b) => b.id === p.brandId);
        const hay = `${p.name} ${p.subtitle} ${p.waterType} ${p.packaging} ${brand?.name || ''} ${brand?.country || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'price-asc') return a.priceGbp - b.priceGbp;
      if (sortBy === 'price-desc') return b.priceGbp - a.priceGbp;
      if (sortBy === 'per-litre') {
        const aLitre = a.priceGbp / ((a.bottleSizeMl * a.packQuantity) / 1000);
        const bLitre = b.priceGbp / ((b.bottleSizeMl * b.packQuantity) / 1000);
        return aLitre - bLitre;
      }
      // Default order: real product photography first, then featured lines
      return (
        Number(Boolean(b.imageUrl)) - Number(Boolean(a.imageUrl)) ||
        Number(b.isFeatured) - Number(a.isFeatured)
      );
    });
  }, [
    products,
    brands,
    collectionTab,
    brandFilter,
    sizeFilter,
    packFilter,
    maxPrice,
    searchQuery,
    sortBy,
  ]);

  const comparedProducts = products.filter((p) => compareIds.includes(p.id));

  const tabs: { id: CollectionTab; label: string }[] = [
    { id: 'all', label: 'All Water' },
    { id: 'still', label: 'Still Water' },
    { id: 'sparkling', label: 'Sparkling Water' },
    { id: 'premium', label: 'Premium Water' },
    { id: 'plastic', label: 'Plastic Bottles' },
    { id: 'bulk', label: 'Bulk Packs' },
    { id: 'bestsellers', label: 'Best Sellers' },
  ];

  const resetFilters = () => {
    setCollectionTab('all');
    setBrandFilter('all');
    setSizeFilter('all');
    setPackFilter('all');
    setMaxPrice(60);
    setSearchQuery('');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-8 py-6 sm:py-12">
      <SeoHead
        title="Shop All Bottled Water UK – Evian, FIJI, Highland Spring, Icelandic Glacial & Tongariro | UK Beverages"
        description="Browse and buy Evian, FIJI Water, Highland Spring, Icelandic Glacial, and Tongariro Natural Spring Water cases with UK mainland delivery."
      />

      {/* Page Title */}
      <div className="border-b border-black/8 pb-5 sm:pb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#0F5C6E]">
          UK Consumer Storefront
        </p>
        <div className="mt-2 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <h1 className="font-editorial text-3xl sm:text-5xl font-semibold text-[#14181F]">
            Shop All Bottled Water
          </h1>
          <p className="text-sm text-slate-600 max-w-md">
            Cases and multipacks of bottled water sourced directly for UK home delivery. All prices include 20% UK VAT.
          </p>
        </div>

        {/* Navigation Collection Tabs */}
        <div className="mt-5 sm:mt-8 -mx-4 px-4 sm:mx-0 sm:px-0 flex items-center gap-1.5 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCollectionTab(tab.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                collectionTab === tab.id
                  ? 'bg-[#14181F] text-white'
                  : 'bg-[#EFECE6] text-slate-700 hover:bg-black/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile toolbar: filters collapse behind one button so products show first */}
      <div className="sm:hidden flex items-center justify-between gap-3 py-3">
        <button
          type="button"
          onClick={() => setFiltersOpen((o) => !o)}
          className="inline-flex items-center gap-2 rounded-lg border border-black/12 bg-white px-3.5 py-2.5 text-sm font-medium"
          aria-expanded={filtersOpen}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {filtersOpen ? 'Hide filters' : 'Filters'}
        </button>
        <span className="text-xs text-slate-500 font-mono tabular-nums">{filteredProducts.length} packs</span>
      </div>

      {/* Filters Bar */}
      <div className={`${filtersOpen ? 'grid' : 'hidden'} sm:grid py-4 sm:py-6 border-b border-black/8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end`}>
        <div className="lg:col-span-2">
          <label htmlFor="shop-search" className="block text-[11px] font-medium text-slate-500 mb-1">
            Search Brand or Format
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              id="shop-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. Evian 500ml, pH 8.4, FIJI"
              className="w-full rounded-lg border border-black/12 bg-white pl-9 pr-3 py-2 text-xs text-[#14181F] focus:border-[#0F5C6E] focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label htmlFor="filter-brand" className="block text-[11px] font-medium text-slate-500 mb-1">
            Brand
          </label>
          <select
            id="filter-brand"
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="w-full rounded-lg border border-black/12 bg-white px-3 py-2 text-xs text-[#14181F]"
          >
            <option value="all">All Brands</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-size" className="block text-[11px] font-medium text-slate-500 mb-1">
            Bottle Size
          </label>
          <select
            id="filter-size"
            value={sizeFilter}
            onChange={(e) => setSizeFilter(e.target.value)}
            className="w-full rounded-lg border border-black/12 bg-white px-3 py-2 text-xs text-[#14181F]"
          >
            <option value="all">All Sizes</option>
            {uniqueSizes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-pack" className="block text-[11px] font-medium text-slate-500 mb-1">
            Pack Quantity
          </label>
          <select
            id="filter-pack"
            value={packFilter}
            onChange={(e) => setPackFilter(e.target.value)}
            className="w-full rounded-lg border border-black/12 bg-white px-3 py-2 text-xs text-[#14181F]"
          >
            <option value="all">Any Pack Size</option>
            {uniquePacks.map((qty) => (
              <option key={qty} value={String(qty)}>
                {qty} per pack
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="sort-by" className="block text-[11px] font-medium text-slate-500 mb-1">
            Sort By
          </label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="w-full rounded-lg border border-black/12 bg-white px-3 py-2 text-xs text-[#14181F]"
          >
            <option value="featured">Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="per-litre">Best Value (£ / Litre)</option>
          </select>
        </div>
      </div>

      {/* Price Ceiling & Result Count */}
      <div className={`${filtersOpen ? 'flex' : 'hidden'} sm:flex py-4 flex-wrap items-center justify-between gap-4 text-xs text-slate-600`}>
        <div className="flex items-center gap-4">
          <span className="font-mono tabular-nums">
            Showing {filteredProducts.length} of {products.length} packs
          </span>
          <label className="inline-flex items-center gap-2">
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
            <span>Max Price:</span>
            <input
              type="range"
              min={15}
              max={60}
              step={5}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="accent-[#0F5C6E]"
            />
            <span className="font-mono tabular-nums font-semibold">£{maxPrice}</span>
          </label>
        </div>

        <button onClick={resetFilters} className="text-[#0F5C6E] font-semibold hover:underline">
          Reset Filters
        </button>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="my-12 rounded-2xl border border-black/8 bg-white p-12 text-center space-y-3">
          <p className="text-base font-semibold text-[#14181F]">No water packs match those filters.</p>
          <p className="text-sm text-slate-600">Try clearing one or more filters to view our full UK range.</p>
          <button
            onClick={resetFilters}
            className="mt-2 rounded-lg bg-[#14181F] px-5 py-2.5 text-xs font-semibold text-white"
          >
            Show All Products
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 pt-2">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              brand={brands.find((b) => b.id === product.brandId)}
            />
          ))}
        </div>
      )}

      {/* Floating Comparison Bar */}
      {comparedProducts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-40 rounded-xl border border-black/15 bg-[#14181F] text-white px-4 py-3 shadow-2xl flex items-center gap-4">
          <span className="text-xs font-medium">
            Comparing {comparedProducts.length} {comparedProducts.length === 1 ? 'water' : 'waters'}
          </span>
          <button
            onClick={() => setShowCompareModal(true)}
            className="rounded-lg bg-white px-3.5 py-1.5 text-xs font-semibold text-[#14181F] hover:bg-slate-200"
          >
            Compare Side-by-Side
          </button>
          <button onClick={clearCompare} className="text-xs text-slate-400 hover:text-white">
            Clear
          </button>
        </div>
      )}

      {/* Comparison Modal */}
      {showCompareModal && comparedProducts.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative max-h-[88vh] w-full max-w-5xl overflow-auto rounded-2xl bg-white p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/10 pb-4">
              <h2 className="font-editorial text-2xl font-semibold">Side-by-Side Water Comparison</h2>
              <button
                onClick={() => setShowCompareModal(false)}
                className="p-2 rounded-lg hover:bg-black/5"
                aria-label="Close comparison"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-black/10">
                    <th className="py-3 pr-4 font-semibold text-slate-500">Attribute</th>
                    {comparedProducts.map((p) => (
                      <th key={p.id} className="py-3 px-4 font-semibold text-[#14181F] min-w-[180px]">
                        <button
                          onClick={() => {
                            setShowCompareModal(false);
                            navigate(`/products/${p.slug}`);
                          }}
                          className="text-left hover:text-[#0F5C6E]"
                        >
                          {p.name}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/6 font-mono tabular-nums">
                  <tr>
                    <td className="py-2.5 pr-4 font-sans text-slate-600">Source Country</td>
                    {comparedProducts.map((p) => {
                      const b = brands.find((br) => br.id === p.brandId);
                      return (
                        <td key={p.id} className="py-2.5 px-4 font-sans">
                          {b?.country}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-sans text-slate-600">Pack Price (GBP)</td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} className="py-2.5 px-4 font-semibold">
                        £{p.priceGbp.toFixed(2)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-sans text-slate-600">Price Per Unit</td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} className="py-2.5 px-4">
                        £{(p.priceGbp / p.packQuantity).toFixed(2)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-sans text-slate-600">pH Level</td>
                    {comparedProducts.map((p) => {
                      const b = brands.find((br) => br.id === p.brandId);
                      return (
                        <td key={p.id} className="py-2.5 px-4">
                          {b?.mineralProfile.ph}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-sans text-slate-600">Total Dissolved Solids</td>
                    {comparedProducts.map((p) => {
                      const b = brands.find((br) => br.id === p.brandId);
                      return (
                        <td key={p.id} className="py-2.5 px-4">
                          {b?.mineralProfile.tds} mg/L
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-sans text-slate-600">Silica / Calcium</td>
                    {comparedProducts.map((p) => {
                      const b = brands.find((br) => br.id === p.brandId);
                      return (
                        <td key={p.id} className="py-2.5 px-4">
                          SiO₂ {b?.mineralProfile.silica ?? '—'} · Ca {b?.mineralProfile.calcium ?? '—'} mg/L
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-sans text-slate-600">Packaging</td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} className="py-2.5 px-4 font-sans">
                        {p.packaging} · {p.waterType}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4" />
                    {comparedProducts.map((p) => (
                      <td key={p.id} className="py-3 px-4 font-sans">
                        <button
                          onClick={() => toggleCompare(p.id)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
