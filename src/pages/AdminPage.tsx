import React, { useEffect, useState } from 'react';
import { Lock, Plus, Trash2 } from 'lucide-react';
import { SeoHead } from '../components/SeoHead';
import { useStore } from '../context/StoreContext';
import type {
  Brand,
  DeliveryZone,
  DiscountCode,
  MarketingConfig,
  Order,
  OrderStatus,
  Product,
  Subscription,
  UserPublic,
} from '../types';

interface AdminOverview {
  brands: Brand[];
  products: Product[];
  orders: Order[];
  subscriptions: Subscription[];
  deliveryZones: DeliveryZone[];
  discountCodes: DiscountCode[];
  marketing: MarketingConfig;
  customers: UserPublic[];
}

export function AdminPage() {
  const { user, setAuthSession, apiFetch, refreshStorefront } = useStore();
  const [adminTab, setAdminTab] = useState<'products' | 'brands' | 'orders' | 'subscriptions' | 'delivery' | 'marketing'>('products');
  const [data, setData] = useState<AdminOverview | null>(null);
  const [statusMsg, setStatusMsg] = useState('');

  // Admin Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginErr, setLoginErr] = useState('');

  // New Product Form
  const [newProdName, setNewProdName] = useState('');
  const [newProdBrand, setNewProdBrand] = useState('brand-evian');
  const [newProdSize, setNewProdSize] = useState('750ml');
  const [newProdPack, setNewProdPack] = useState(12);
  const [newProdPrice, setNewProdPrice] = useState(25);
  const [newProdStock, setNewProdStock] = useState(40);
  const [newProdType, setNewProdType] = useState<'Still' | 'Sparkling'>('Still');
  const [newProdPkg, setNewProdPkg] = useState<'Glass' | 'rPET'>('Glass');

  // New Brand Form
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandCountry, setNewBrandCountry] = useState('');
  const [newBrandRegion, setNewBrandRegion] = useState('');
  const [newBrandSource, setNewBrandSource] = useState('');
  const [newBrandPh, setNewBrandPh] = useState(7.5);
  const [newBrandTds, setNewBrandTds] = useState(180);

  // Discount Form
  const [newCode, setNewCode] = useState('');
  const [newCodeType, setNewCodeType] = useState<'percent' | 'fixed' | 'free_shipping'>('percent');
  const [newCodeVal, setNewCodeVal] = useState(10);

  const loadAdmin = async () => {
    if (!user || user.role !== 'admin') return;
    try {
      const res = await apiFetch<AdminOverview>('/api/admin/overview');
      setData(res);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadAdmin();
  }, [user?.id, user?.role]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErr('');
    try {
      const res = await apiFetch<{ user: UserPublic; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });
      if (res.user.role !== 'admin') {
        setLoginErr('This account does not have administrator permissions.');
        return;
      }
      setAuthSession(res.user, res.token);
    } catch (err) {
      setLoginErr(err instanceof Error ? err.message : 'Login failed.');
    }
  };

  const quickDemoAdminLogin = async () => {
    setLoginErr('');
    try {
      const res = await apiFetch<{ user: UserPublic; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'admin@ukbeverages.co.uk',
          // Dev-only shortcut; stripped from production builds. Set ADMIN_PASSWORD on the server for real use.
          password: import.meta.env.DEV ? 'AdminSource2026!' : '',
        }),
      });
      setAuthSession(res.user, res.token);
    } catch (err) {
      setLoginErr(err instanceof Error ? err.message : 'Admin login failed.');
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <SeoHead
          title="Operations Admin Sign In | UK Beverages"
          description="UK Beverages administrative retail console."
        />
        <div className="rounded-2xl border border-black/10 bg-white p-8 space-y-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#0F5C6E]">
            <Lock className="h-4 w-4" />
            <span>Retail Operations Console</span>
          </div>
          <h1 className="font-editorial text-3xl font-semibold">Administrator Sign In</h1>

          <form onSubmit={handleAdminLogin} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Admin Email</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Password</label>
              <input
                type="password"
                required
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
              />
            </div>
            {loginErr && <p className="text-xs text-red-600">{loginErr}</p>}
            <button
              type="submit"
              className="w-full rounded-lg bg-[#14181F] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#0F5C6E]"
            >
              Sign In to Admin
            </button>
          </form>

          {import.meta.env.DEV && (
          <div className="border-t border-black/8 pt-4">
            <button
              onClick={quickDemoAdminLogin}
              className="w-full rounded-lg border border-black/15 px-4 py-2 text-xs font-semibold text-[#14181F] hover:bg-black/5"
            >
              Sign in as Demo Operations Admin (dev only)
            </button>
          </div>
          )}
        </div>
      </div>
    );
  }

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch('/api/admin/products', {
      method: 'POST',
      body: JSON.stringify({
        name: newProdName,
        brandId: newProdBrand,
        bottleSizeLabel: newProdSize,
        bottleSizeMl: parseInt(newProdSize, 10) || 750,
        packQuantity: newProdPack,
        priceGbp: newProdPrice,
        stock: newProdStock,
        waterType: newProdType,
        packaging: newProdPkg,
        subtitle: `Case of ${newProdPack} · ${newProdPkg}`,
      }),
    });
    setNewProdName('');
    setStatusMsg('Product added to live storefront.');
    await loadAdmin();
    await refreshStorefront();
  };

  const handlePatchProduct = async (id: string, patch: Partial<Product>) => {
    await apiFetch(`/api/admin/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    setStatusMsg('Product updated.');
    await loadAdmin();
    await refreshStorefront();
  };

  const handleDeleteProduct = async (id: string) => {
    await apiFetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    setStatusMsg('Product removed.');
    await loadAdmin();
    await refreshStorefront();
  };

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch('/api/admin/brands', {
      method: 'POST',
      body: JSON.stringify({
        name: newBrandName,
        country: newBrandCountry,
        region: newBrandRegion,
        sourceName: newBrandSource,
        mineralProfile: { ph: newBrandPh, tds: newBrandTds },
      }),
    });
    setNewBrandName('');
    setNewBrandCountry('');
    setNewBrandRegion('');
    setNewBrandSource('');
    setStatusMsg('New brand added dynamically with 3D origin page.');
    await loadAdmin();
    await refreshStorefront();
  };

  const handleOrderStatus = async (id: string, status: OrderStatus) => {
    await apiFetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    setStatusMsg(`Order status set to ${status}.`);
    await loadAdmin();
  };

  const handleZoneUpdate = async (id: string, patch: Partial<DeliveryZone>) => {
    await apiFetch(`/api/admin/delivery-zones/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    setStatusMsg('Delivery zone updated.');
    await loadAdmin();
    await refreshStorefront();
  };

  const handleAddDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch('/api/admin/discount-codes', {
      method: 'POST',
      body: JSON.stringify({ code: newCode, type: newCodeType, value: newCodeVal }),
    });
    setNewCode('');
    setStatusMsg('Discount code saved.');
    await loadAdmin();
  };

  const handleBannerSave = async (bannerText: string, bannerEnabled: boolean) => {
    await apiFetch('/api/admin/marketing', {
      method: 'PATCH',
      body: JSON.stringify({ bannerText, bannerEnabled }),
    });
    setStatusMsg('Promotional banner updated.');
    await loadAdmin();
    await refreshStorefront();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-8 py-10 space-y-8">
      <SeoHead
        title="Operations Console | UK Beverages"
        description="Manage UK Beverages products, brands, orders, subscriptions, delivery zones, and promotions."
      />

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/8 pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#0F5C6E]">
            UK Beverages Retail Operations
          </p>
          <h1 className="font-editorial text-4xl font-semibold text-[#14181F]">Admin Dashboard</h1>
        </div>
        {data && (
          <div className="flex flex-wrap gap-6 text-xs font-mono tabular-nums">
            <div>
              <span className="text-slate-500 block font-sans">Active Products</span>
              <span className="text-lg font-semibold">{data.products.length}</span>
            </div>
            <div>
              <span className="text-slate-500 block font-sans">Orders</span>
              <span className="text-lg font-semibold">{data.orders.length}</span>
            </div>
            <div>
              <span className="text-slate-500 block font-sans">Subscriptions</span>
              <span className="text-lg font-semibold">{data.subscriptions.length}</span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(['products', 'brands', 'orders', 'subscriptions', 'delivery', 'marketing'] as const).map(
          (t) => (
            <button
              key={t}
              onClick={() => setAdminTab(t)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-colors ${
                adminTab === t ? 'bg-[#14181F] text-white' : 'bg-[#EFECE6] text-slate-700 hover:bg-black/10'
              }`}
            >
              {t}
            </button>
          )
        )}
      </div>

      {statusMsg && (
        <div className="rounded-lg border border-[#0F5C6E]/30 bg-[#0F5C6E]/10 px-4 py-2.5 text-xs font-medium text-[#0F5C6E]">
          {statusMsg}
        </div>
      )}

      {data && (
        <>
          {/* PRODUCTS */}
          {adminTab === 'products' && (
            <div className="space-y-8">
              <form
                onSubmit={handleCreateProduct}
                className="rounded-2xl border border-black/8 bg-white p-6 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
              >
                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-slate-500 mb-1">Product Name *</label>
                  <input
                    required
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    placeholder="e.g. Evian Sparkling – 750ml Glass"
                    className="w-full rounded-lg border border-black/15 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Brand</label>
                  <select
                    value={newProdBrand}
                    onChange={(e) => setNewProdBrand(e.target.value)}
                    className="w-full rounded-lg border border-black/15 px-3 py-2 text-xs bg-white"
                  >
                    {data.brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Water / Packaging</label>
                  <div className="flex gap-1.5">
                    <select
                      value={newProdType}
                      onChange={(e) => setNewProdType(e.target.value as 'Still' | 'Sparkling')}
                      className="w-1/2 rounded-lg border border-black/15 px-2 py-2 text-xs bg-white"
                    >
                      <option value="Still">Still</option>
                      <option value="Sparkling">Sparkling</option>
                    </select>
                    <select
                      value={newProdPkg}
                      onChange={(e) => setNewProdPkg(e.target.value as 'Glass' | 'rPET')}
                      className="w-1/2 rounded-lg border border-black/15 px-2 py-2 text-xs bg-white"
                    >
                      <option value="Glass">Glass</option>
                      <option value="rPET">rPET</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Bottle Size</label>
                  <input
                    value={newProdSize}
                    onChange={(e) => setNewProdSize(e.target.value)}
                    className="w-full rounded-lg border border-black/15 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Pack Qty</label>
                  <input
                    type="number"
                    value={newProdPack}
                    onChange={(e) => setNewProdPack(Number(e.target.value))}
                    className="w-full rounded-lg border border-black/15 px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Price (£ GBP)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(Number(e.target.value))}
                    className="w-full rounded-lg border border-black/15 px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-[11px] text-slate-500 mb-1">Stock</label>
                    <input
                      type="number"
                      value={newProdStock}
                      onChange={(e) => setNewProdStock(Number(e.target.value))}
                      className="w-full rounded-lg border border-black/15 px-3 py-2 text-xs font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 rounded-lg bg-[#0F5C6E] px-4 py-2 text-xs font-semibold text-white whitespace-nowrap"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add
                  </button>
                </div>
              </form>

              <div className="overflow-x-auto rounded-2xl border border-black/8 bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-black/8 bg-[#EFECE6]/60 uppercase text-slate-600">
                    <tr>
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-4">Pack</th>
                      <th className="py-3 px-4">Price (£)</th>
                      <th className="py-3 px-4">Stock</th>
                      <th className="py-3 px-4">Sub %</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/6">
                    {data.products.map((p) => (
                      <tr key={p.id}>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-[#14181F]">{p.name}</p>
                          <p className="text-slate-500 font-mono">{p.sku}</p>
                        </td>
                        <td className="py-3 px-4">
                          {p.bottleSizeLabel} × {p.packQuantity}
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            step="0.1"
                            defaultValue={p.priceGbp}
                            onBlur={(e) =>
                              handlePatchProduct(p.id, { priceGbp: Number(e.target.value) })
                            }
                            className="w-20 rounded border border-black/15 px-2 py-1 font-mono tabular-nums"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            defaultValue={p.stock}
                            onBlur={(e) =>
                              handlePatchProduct(p.id, { stock: Number(e.target.value) })
                            }
                            className="w-16 rounded border border-black/15 px-2 py-1 font-mono tabular-nums"
                          />
                        </td>
                        <td className="py-3 px-4 font-mono">{p.subscriptionDiscountPct}%</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="text-slate-400 hover:text-red-600 p-1"
                            aria-label="Delete product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* BRANDS */}
          {adminTab === 'brands' && (
            <div className="space-y-8">
              <form
                onSubmit={handleCreateBrand}
                className="rounded-2xl border border-black/8 bg-white p-6 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end"
              >
                <input
                  required
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="Brand Name"
                  className="rounded-lg border border-black/15 px-3 py-2 text-xs"
                />
                <input
                  required
                  value={newBrandCountry}
                  onChange={(e) => setNewBrandCountry(e.target.value)}
                  placeholder="Country"
                  className="rounded-lg border border-black/15 px-3 py-2 text-xs"
                />
                <input
                  required
                  value={newBrandRegion}
                  onChange={(e) => setNewBrandRegion(e.target.value)}
                  placeholder="Region"
                  className="rounded-lg border border-black/15 px-3 py-2 text-xs"
                />
                <input
                  required
                  value={newBrandSource}
                  onChange={(e) => setNewBrandSource(e.target.value)}
                  placeholder="Source Name"
                  className="rounded-lg border border-black/15 px-3 py-2 text-xs"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={newBrandPh}
                    onChange={(e) => setNewBrandPh(Number(e.target.value))}
                    placeholder="pH"
                    className="w-1/2 rounded-lg border border-black/15 px-3 py-2 text-xs font-mono"
                  />
                  <input
                    type="number"
                    value={newBrandTds}
                    onChange={(e) => setNewBrandTds(Number(e.target.value))}
                    placeholder="TDS mg/L"
                    className="w-1/2 rounded-lg border border-black/15 px-3 py-2 text-xs font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-lg bg-[#0F5C6E] px-4 py-2 text-xs font-semibold text-white"
                >
                  Add Brand &amp; 3D Experience
                </button>
              </form>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {data.brands.map((b) => (
                  <div key={b.id} className="rounded-xl border border-black/8 bg-white p-5 space-y-2">
                    <div className="flex justify-between">
                      <h3 className="font-semibold text-base">{b.name}</h3>
                      <span className="text-xs font-mono text-slate-500">
                        pH {b.mineralProfile.ph} · TDS {b.mineralProfile.tds}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {b.sourceName} · {b.region}, {b.country}
                    </p>
                    <p className="text-xs text-slate-600">{b.tagline}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ORDERS */}
          {adminTab === 'orders' && (
            <div className="space-y-4">
              {data.orders.map((o) => (
                <div key={o.id} className="rounded-xl border border-black/8 bg-white p-5 space-y-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-mono font-semibold text-sm">{o.orderNumber}</p>
                      <p className="text-slate-500">
                        {o.customerName} ({o.customerEmail}) · {o.shippingAddress.postcode}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-semibold text-sm">£{o.totalGbp.toFixed(2)}</span>
                      <select
                        value={o.status}
                        onChange={(e) => handleOrderStatus(o.id, e.target.value as OrderStatus)}
                        className="rounded-lg border border-black/15 px-2.5 py-1.5 bg-white font-semibold"
                      >
                        <option value="Confirmed">Confirmed</option>
                        <option value="Picking">Picking</option>
                        <option value="Dispatched">Dispatched</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Refunded">Refunded</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SUBSCRIPTIONS */}
          {adminTab === 'subscriptions' && (
            <div className="space-y-3">
              {data.subscriptions.map((s) => (
                <div key={s.id} className="rounded-xl border border-black/8 bg-white p-5 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div>
                    <p className="font-semibold text-sm">{s.productName}</p>
                    <p className="text-slate-500">
                      {s.customerName} ({s.customerEmail}) · {s.quantity} × {s.frequency} · Next:{' '}
                      <span className="font-mono">{s.nextDeliveryDate}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-semibold">
                      £{(s.unitPriceGbp * s.quantity).toFixed(2)}
                    </span>
                    <span className="font-semibold text-[#0F5C6E]">{s.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* DELIVERY ZONES */}
          {adminTab === 'delivery' && (
            <div className="space-y-4">
              {data.deliveryZones.map((z) => (
                <div key={z.id} className="rounded-xl border border-black/8 bg-white p-5 grid grid-cols-1 md:grid-cols-5 gap-4 items-end text-xs">
                  <div className="md:col-span-2">
                    <p className="font-semibold text-sm text-[#14181F]">{z.name}</p>
                    <p className="text-slate-500 mt-0.5">{z.description}</p>
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Standard Fee (£)</label>
                    <input
                      type="number"
                      step="0.05"
                      defaultValue={z.feeGbp}
                      onBlur={(e) => handleZoneUpdate(z.id, { feeGbp: Number(e.target.value) })}
                      className="w-full rounded border border-black/15 px-2.5 py-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Free Threshold (£)</label>
                    <input
                      type="number"
                      step="1"
                      defaultValue={z.freeThresholdGbp}
                      onBlur={(e) =>
                        handleZoneUpdate(z.id, { freeThresholdGbp: Number(e.target.value) })
                      }
                      className="w-full rounded border border-black/15 px-2.5 py-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Min Order (£)</label>
                    <input
                      type="number"
                      step="1"
                      defaultValue={z.minOrderGbp}
                      onBlur={(e) => handleZoneUpdate(z.id, { minOrderGbp: Number(e.target.value) })}
                      className="w-full rounded border border-black/15 px-2.5 py-1.5 font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* MARKETING */}
          {adminTab === 'marketing' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="rounded-2xl border border-black/8 bg-white p-6 space-y-4">
                <h2 className="font-editorial text-2xl font-semibold">Promotional Top Banner</h2>
                <input
                  defaultValue={data.marketing.bannerText}
                  id="banner-text-input"
                  className="w-full rounded-lg border border-black/15 px-3 py-2 text-xs"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const el = document.getElementById('banner-text-input') as HTMLInputElement;
                      handleBannerSave(el.value, true);
                    }}
                    className="rounded-lg bg-[#14181F] px-4 py-2 text-xs font-semibold text-white"
                  >
                    Save &amp; Enable Banner
                  </button>
                  <button
                    onClick={() => handleBannerSave(data.marketing.bannerText, false)}
                    className="rounded-lg border border-black/15 px-4 py-2 text-xs font-semibold"
                  >
                    Disable
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-black/8 bg-white p-6 space-y-4">
                <h2 className="font-editorial text-2xl font-semibold">Discount Codes</h2>
                <form onSubmit={handleAddDiscount} className="flex gap-2">
                  <input
                    required
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    placeholder="CODE"
                    className="flex-1 rounded-lg border border-black/15 px-3 py-2 text-xs font-mono uppercase"
                  />
                  <select
                    value={newCodeType}
                    onChange={(e) => setNewCodeType(e.target.value as typeof newCodeType)}
                    className="rounded-lg border border-black/15 px-2 py-2 text-xs bg-white"
                  >
                    <option value="percent">% Off</option>
                    <option value="fixed">£ Off</option>
                    <option value="free_shipping">Free Delivery</option>
                  </select>
                  <input
                    type="number"
                    value={newCodeVal}
                    onChange={(e) => setNewCodeVal(Number(e.target.value))}
                    className="w-16 rounded-lg border border-black/15 px-2 py-2 text-xs font-mono"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-[#0F5C6E] px-4 py-2 text-xs font-semibold text-white"
                  >
                    Add
                  </button>
                </form>

                <div className="divide-y divide-black/6 text-xs">
                  {data.discountCodes.map((dc) => (
                    <div key={dc.code} className="py-2.5 flex justify-between">
                      <span className="font-mono font-semibold">{dc.code}</span>
                      <span className="text-slate-600">{dc.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
