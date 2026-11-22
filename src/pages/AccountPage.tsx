import React, { useEffect, useState } from 'react';
import { CreditCard, LogOut, MapPin, Package, RefreshCw, RotateCcw, Trash2, User } from 'lucide-react';
import { SeoHead } from '../components/SeoHead';
import { useStore } from '../context/StoreContext';
import type { Order, Subscription, SubscriptionFrequency, UserPublic } from '../types';

export function AccountPage({ defaultTab = 'orders' }: { defaultTab?: 'orders' | 'subscriptions' | 'addresses' | 'payments' | 'profile' }) {
  const { user, setAuthSession, logout, apiFetch, products, addToCart, navigate } = useStore();

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [authError, setAuthError] = useState('');

  const [tab, setTab] = useState(defaultTab);
  const [orders, setOrders] = useState<Order[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  // Address form
  const [addrLabel, setAddrLabel] = useState('Home');
  const [addrLine1, setAddrLine1] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrPostcode, setAddrPostcode] = useState('');

  // Card form
  const [cardLast4, setCardLast4] = useState('');
  const [cardBrand, setCardBrand] = useState('Visa');
  const [cardExpiry, setCardExpiry] = useState('09/29');

  // Profile form
  const [profName, setProfName] = useState('');
  const [profPhone, setProfPhone] = useState('');

  useEffect(() => {
    setTab(defaultTab);
  }, [defaultTab]);

  const loadOverview = async () => {
    if (!user) return;
    setLoadingOverview(true);
    try {
      const data = await apiFetch<{ user: UserPublic; orders: Order[]; subscriptions: Subscription[] }>(
        '/api/account/overview'
      );
      setOrders(data.orders);
      setSubscriptions(data.subscriptions);
      setProfName(data.user.name);
      setProfPhone(data.user.phone);
    } catch {
      // ignore
    } finally {
      setLoadingOverview(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, [user?.id]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const res = await apiFetch<{ user: UserPublic; token: string }>(endpoint, {
        method: 'POST',
        body: JSON.stringify(
          authMode === 'login' ? { email, password } : { email, password, name, phone }
        ),
      });
      setAuthSession(res.user, res.token);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Authentication failed.');
    }
  };

  const handleDemoCustomerSignIn = async () => {
    setAuthError('');
    try {
      const res = await apiFetch<{ user: UserPublic; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'claire.bennett@example.co.uk',
          password: import.meta.env.DEV ? 'SourceHouse2026!' : '',
        }),
      });
      setAuthSession(res.user, res.token);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to sign in.');
    }
  };

  const handleReorder = (order: Order) => {
    for (const item of order.items) {
      addToCart(item.productId, item.quantity, item.purchaseMode, item.frequency);
    }
  };

  const handleUpdateSub = async (subId: string, patch: Record<string, unknown>) => {
    setActionMsg('');
    try {
      const updated = await apiFetch<Subscription>(`/api/subscriptions/${subId}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      setSubscriptions((prev) => prev.map((s) => (s.id === subId ? updated : s)));
      setActionMsg('Subscription updated.');
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : 'Update failed.');
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMsg('');
    try {
      const res = await apiFetch<{ user: UserPublic }>('/api/account/addresses', {
        method: 'POST',
        body: JSON.stringify({
          label: addrLabel,
          line1: addrLine1,
          city: addrCity,
          postcode: addrPostcode,
        }),
      });
      setAuthSession(res.user);
      setAddrLine1('');
      setAddrCity('');
      setAddrPostcode('');
      setActionMsg('UK delivery address saved.');
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : 'Invalid address.');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    const res = await apiFetch<{ user: UserPublic }>(`/api/account/addresses/${id}`, {
      method: 'DELETE',
    });
    setAuthSession(res.user);
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMsg('');
    try {
      const res = await apiFetch<{ user: UserPublic }>('/api/account/payment-methods', {
        method: 'POST',
        body: JSON.stringify({
          brand: cardBrand,
          last4: cardLast4,
          expiry: cardExpiry,
        }),
      });
      setAuthSession(res.user);
      setCardLast4('');
      setActionMsg('Payment card saved.');
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : 'Unable to save card.');
    }
  };

  const handleDeleteCard = async (id: string) => {
    const res = await apiFetch<{ user: UserPublic }>(`/api/account/payment-methods/${id}`, {
      method: 'DELETE',
    });
    setAuthSession(res.user);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiFetch<{ user: UserPublic }>('/api/account/profile', {
      method: 'PATCH',
      body: JSON.stringify({ name: profName, phone: profPhone }),
    });
    setAuthSession(res.user);
    setActionMsg('Profile updated.');
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <SeoHead
          title="Customer Account & Sign In | UK Beverages"
          description="Sign in or create a UK Beverages account to manage orders, track deliveries, and control water subscriptions."
        />

        <div className="rounded-2xl border border-black/8 bg-white p-8 space-y-6">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#0F5C6E]">
              Customer Portal
            </p>
            <h1 className="font-editorial text-3xl font-semibold text-[#14181F]">
              {authMode === 'login' ? 'Sign In to Your Account' : 'Create a Customer Account'}
            </h1>
          </div>

          <div className="flex gap-2 rounded-lg bg-[#EFECE6] p-1">
            <button
              onClick={() => setAuthMode('login')}
              className={`flex-1 rounded-md py-2 text-xs font-semibold transition-colors ${
                authMode === 'login' ? 'bg-white text-[#14181F] shadow-sm' : 'text-slate-600'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setAuthMode('register')}
              className={`flex-1 rounded-md py-2 text-xs font-semibold transition-colors ${
                authMode === 'register' ? 'bg-white text-[#14181F] shadow-sm' : 'text-slate-600'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authMode === 'register' && (
              <>
                <div>
                  <label htmlFor="acc-name" className="block text-xs font-medium text-slate-600 mb-1">
                    Full Name
                  </label>
                  <input
                    id="acc-name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Claire Bennett"
                    className="w-full rounded-lg border border-black/15 px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="acc-phone" className="block text-xs font-medium text-slate-600 mb-1">
                    UK Phone
                  </label>
                  <input
                    id="acc-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="07700 900412"
                    className="w-full rounded-lg border border-black/15 px-3.5 py-2.5 text-sm"
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="acc-email" className="block text-xs font-medium text-slate-600 mb-1">
                Email Address
              </label>
              <input
                id="acc-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.co.uk"
                className="w-full rounded-lg border border-black/15 px-3.5 py-2.5 text-sm"
              />
            </div>

            <div>
              <label htmlFor="acc-pass" className="block text-xs font-medium text-slate-600 mb-1">
                Password
              </label>
              <input
                id="acc-pass"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full rounded-lg border border-black/15 px-3.5 py-2.5 text-sm"
              />
            </div>

            {authError && <p className="text-xs text-red-600">{authError}</p>}

            <button
              type="submit"
              className="w-full rounded-lg bg-[#14181F] px-5 py-3 text-xs font-semibold text-white hover:bg-[#0F5C6E] transition-colors"
            >
              {authMode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {import.meta.env.DEV && (
          <div className="border-t border-black/8 pt-5 space-y-2">
            <p className="text-xs text-slate-500">
              Preview an existing customer account with active orders &amp; recurring subscriptions:
            </p>
            <button
              type="button"
              onClick={handleDemoCustomerSignIn}
              className="w-full rounded-lg border border-black/15 px-4 py-2.5 text-xs font-semibold text-[#14181F] hover:bg-black/5"
            >
              Sign in as Demo Customer (Claire Bennett, dev only)
            </button>
          </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-8 py-12">
      <SeoHead
        title="My Account – Orders & Subscriptions | UK Beverages"
        description="Manage your UK bottled water subscriptions, previous orders, saved delivery addresses, and payment methods."
      />

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/8 pb-6 mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#0F5C6E]">
            {user.role === 'admin' ? 'Administrator Account' : 'Customer Account'}
          </p>
          <h1 className="mt-1 font-editorial text-4xl font-semibold text-[#14181F]">
            Welcome, {user.name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
        </div>

        <div className="flex items-center gap-3">
          {user.role === 'admin' && (
            <button
              onClick={() => navigate('/admin')}
              className="rounded-lg bg-[#0F5C6E] px-4 py-2 text-xs font-semibold text-white"
            >
              Open Admin Console
            </button>
          )}
          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 px-4 py-2 text-xs font-semibold text-[#14181F] hover:bg-black/5"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {[
          { id: 'orders', label: `Orders (${orders.length})`, icon: Package },
          { id: 'subscriptions', label: `Subscriptions (${subscriptions.length})`, icon: RefreshCw },
          { id: 'addresses', label: `Addresses (${user.addresses.length})`, icon: MapPin },
          { id: 'payments', label: `Payment Methods (${user.paymentMethods.length})`, icon: CreditCard },
          { id: 'profile', label: 'Profile', icon: User },
        ].map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id as typeof tab)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition-colors ${
                active ? 'bg-[#14181F] text-white' : 'bg-[#EFECE6] text-slate-700 hover:bg-black/10'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>

      {actionMsg && (
        <div className="mb-6 rounded-xl border border-[#0F5C6E]/30 bg-[#0F5C6E]/10 px-4 py-3 text-xs font-medium text-[#0F5C6E]">
          {actionMsg}
        </div>
      )}

      {loadingOverview ? (
        <p className="text-sm text-slate-500">Loading your account data…</p>
      ) : (
        <>
          {/* ORDERS TAB */}
          {tab === 'orders' && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="rounded-2xl border border-black/8 bg-white p-10 text-center space-y-3">
                  <p className="text-sm text-slate-600">You have not placed any orders yet.</p>
                  <button
                    onClick={() => navigate('/shop')}
                    className="rounded-lg bg-[#14181F] px-5 py-2.5 text-xs font-semibold text-white"
                  >
                    Shop All Water
                  </button>
                </div>
              ) : (
                orders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-black/8 bg-white p-6 space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/8 pb-4">
                      <div>
                        <p className="font-mono text-sm font-semibold text-[#14181F]">
                          {order.orderNumber}
                        </p>
                        <p className="text-xs text-slate-500">
                          Placed {new Date(order.createdAt).toLocaleDateString('en-GB')} · {order.carrier} ({order.trackingNumber})
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-[#0F5C6E]">{order.status}</span>
                        <span className="font-mono tabular-nums text-base font-semibold">
                          £{order.totalGbp.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between">
                          <span className="text-slate-700">
                            {item.quantity} × {item.name} ({item.bottleSizeLabel} × {item.packQuantity})
                          </span>
                          <span className="font-mono tabular-nums">£{item.lineTotalGbp.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2">
                      <button
                        onClick={() => handleReorder(order)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#14181F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0F5C6E]"
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Reorder Cases
                      </button>
                      <button
                        onClick={() => navigate(`/order-confirmation/${order.id}`)}
                        className="rounded-lg border border-black/15 px-4 py-2 text-xs font-semibold text-[#14181F] hover:bg-black/5"
                      >
                        View Receipt &amp; Tracking
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* SUBSCRIPTIONS TAB */}
          {tab === 'subscriptions' && (
            <div className="space-y-5">
              {subscriptions.length === 0 ? (
                <div className="rounded-2xl border border-black/8 bg-white p-10 text-center space-y-3">
                  <p className="text-sm text-slate-600">You have no active water subscriptions.</p>
                  <button
                    onClick={() => navigate('/subscriptions')}
                    className="rounded-lg bg-[#0F5C6E] px-5 py-2.5 text-xs font-semibold text-white"
                  >
                    Build a Subscription Plan
                  </button>
                </div>
              ) : (
                subscriptions.map((sub) => (
                  <div
                    key={sub.id}
                    className="rounded-2xl border border-black/8 bg-white p-6 space-y-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black/8 pb-4">
                      <div>
                        <p className="text-xs font-semibold text-[#0F5C6E]">
                          {sub.brandName} · Status: {sub.status}
                        </p>
                        <h3 className="text-lg font-semibold text-[#14181F] mt-0.5">
                          {sub.productName}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Next dispatch: <span className="font-mono">{sub.nextDeliveryDate}</span> · Card •••• {sub.paymentLast4}
                        </p>
                      </div>
                      <div className="text-right font-mono tabular-nums">
                        <p className="text-base font-semibold">
                          £{(sub.unitPriceGbp * sub.quantity).toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-500 capitalize">per {sub.frequency}</p>
                      </div>
                    </div>

                    {sub.status !== 'Cancelled' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div>
                          <label className="block text-slate-500 mb-1">Swap Product</label>
                          <select
                            value={sub.productId}
                            onChange={(e) => handleUpdateSub(sub.id, { productId: e.target.value })}
                            className="w-full rounded-lg border border-black/15 px-3 py-2 bg-white"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.bottleSizeLabel} × {p.packQuantity})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-500 mb-1">Delivery Frequency</label>
                          <select
                            value={sub.frequency}
                            onChange={(e) =>
                              handleUpdateSub(sub.id, {
                                frequency: e.target.value as SubscriptionFrequency,
                              })
                            }
                            className="w-full rounded-lg border border-black/15 px-3 py-2 bg-white"
                          >
                            <option value="weekly">Weekly</option>
                            <option value="fortnightly">Fortnightly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-500 mb-1">Cases Per Delivery</label>
                          <select
                            value={sub.quantity}
                            onChange={(e) =>
                              handleUpdateSub(sub.id, { quantity: Number(e.target.value) })
                            }
                            className="w-full rounded-lg border border-black/15 px-3 py-2 bg-white font-mono"
                          >
                            {[1, 2, 3, 4, 6, 8].map((n) => (
                              <option key={n} value={n}>
                                {n} {n === 1 ? 'case' : 'cases'}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-1 text-xs">
                      <p className="text-slate-600">
                        Delivering to: {sub.shippingAddress.line1}, {sub.shippingAddress.city}{' '}
                        {sub.shippingAddress.postcode}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {user.addresses.length > 0 && sub.status !== 'Cancelled' && (
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              const addr = user.addresses.find((a) => a.id === e.target.value);
                              if (addr) {
                                handleUpdateSub(sub.id, { shippingAddress: addr });
                              }
                            }}
                            className="rounded-lg border border-black/15 px-2.5 py-1.5 text-xs bg-white"
                          >
                            <option value="" disabled>
                              Change Delivery Address…
                            </option>
                            {user.addresses.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.label} ({a.postcode})
                              </option>
                            ))}
                          </select>
                        )}

                        {sub.status === 'Active' && (
                          <button
                            onClick={() => handleUpdateSub(sub.id, { status: 'Paused' })}
                            className="rounded-lg border border-black/15 px-3.5 py-1.5 font-semibold hover:bg-black/5"
                          >
                            Pause Subscription
                          </button>
                        )}
                        {sub.status === 'Paused' && (
                          <button
                            onClick={() => handleUpdateSub(sub.id, { status: 'Active' })}
                            className="rounded-lg bg-[#0F5C6E] px-3.5 py-1.5 font-semibold text-white"
                          >
                            Resume Subscription
                          </button>
                        )}
                        {sub.status !== 'Cancelled' && (
                          <button
                            onClick={() => handleUpdateSub(sub.id, { status: 'Cancelled' })}
                            className="rounded-lg border border-red-200 px-3.5 py-1.5 font-semibold text-red-600 hover:bg-red-50"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ADDRESSES TAB */}
          {tab === 'addresses' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7 space-y-4">
                {user.addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="flex items-start justify-between rounded-xl border border-black/8 bg-white p-5 text-sm"
                  >
                    <div className="space-y-1">
                      <p className="font-semibold text-[#14181F]">{addr.label}</p>
                      <p className="text-slate-600">{addr.recipient}</p>
                      <p className="text-slate-600">{addr.line1}</p>
                      <p className="text-slate-600">
                        {addr.city}, <span className="font-mono">{addr.postcode}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="text-slate-400 hover:text-red-600 p-1"
                      aria-label="Delete address"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleAddAddress}
                className="lg:col-span-5 rounded-2xl border border-black/8 bg-white p-6 space-y-3"
              >
                <h2 className="font-editorial text-2xl font-semibold">Add UK Address</h2>
                <input
                  required
                  value={addrLabel}
                  onChange={(e) => setAddrLabel(e.target.value)}
                  placeholder="Label (e.g. Home, Studio)"
                  className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
                />
                <input
                  required
                  value={addrLine1}
                  onChange={(e) => setAddrLine1(e.target.value)}
                  placeholder="Address Line 1"
                  className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
                />
                <input
                  required
                  value={addrCity}
                  onChange={(e) => setAddrCity(e.target.value)}
                  placeholder="Town / City"
                  className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
                />
                <input
                  required
                  value={addrPostcode}
                  onChange={(e) => setAddrPostcode(e.target.value.toUpperCase())}
                  placeholder="UK Postcode (e.g. E1 6AN)"
                  className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm font-mono uppercase"
                />
                <button
                  type="submit"
                  className="w-full rounded-lg bg-[#14181F] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#0F5C6E]"
                >
                  Save Address
                </button>
              </form>
            </div>
          )}

          {/* PAYMENTS TAB */}
          {tab === 'payments' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7 space-y-4">
                {user.paymentMethods.map((pm) => (
                  <div
                    key={pm.id}
                    className="flex items-center justify-between rounded-xl border border-black/8 bg-white p-5 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-[#14181F]">
                        {pm.brand} ending in <span className="font-mono">{pm.last4}</span>
                      </p>
                      <p className="text-xs text-slate-500">Expires {pm.expiry}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteCard(pm.id)}
                      className="text-slate-400 hover:text-red-600 p-1"
                      aria-label="Remove payment method"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleAddCard}
                className="lg:col-span-5 rounded-2xl border border-black/8 bg-white p-6 space-y-3"
              >
                <h2 className="font-editorial text-2xl font-semibold">Add Payment Card</h2>
                <select
                  value={cardBrand}
                  onChange={(e) => setCardBrand(e.target.value)}
                  className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm bg-white"
                >
                  <option value="Visa">Visa</option>
                  <option value="Mastercard">Mastercard</option>
                  <option value="American Express">American Express</option>
                </select>
                <input
                  required
                  minLength={4}
                  maxLength={19}
                  value={cardLast4}
                  onChange={(e) => setCardLast4(e.target.value)}
                  placeholder="Card Number (last 4 digits stored)"
                  className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm font-mono"
                />
                <input
                  required
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  placeholder="MM/YY"
                  className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm font-mono"
                />
                <button
                  type="submit"
                  className="w-full rounded-lg bg-[#14181F] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#0F5C6E]"
                >
                  Save Card
                </button>
              </form>
            </div>
          )}

          {/* PROFILE TAB */}
          {tab === 'profile' && (
            <form
              onSubmit={handleSaveProfile}
              className="max-w-lg rounded-2xl border border-black/8 bg-white p-6 space-y-4"
            >
              <h2 className="font-editorial text-2xl font-semibold">Account Details</h2>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Full Name</label>
                <input
                  required
                  value={profName}
                  onChange={(e) => setProfName(e.target.value)}
                  className="w-full rounded-lg border border-black/15 px-3.5 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">UK Phone</label>
                <input
                  value={profPhone}
                  onChange={(e) => setProfPhone(e.target.value)}
                  className="w-full rounded-lg border border-black/15 px-3.5 py-2.5 text-sm"
                />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-[#14181F] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#0F5C6E]"
              >
                Save Changes
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
