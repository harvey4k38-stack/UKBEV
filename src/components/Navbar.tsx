import React, { useState } from 'react';
import { Menu, ShoppingBag, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export function Navbar() {
  const {
    currentPath,
    navigate,
    cartCount,
    setCartDrawerOpen,
    marketing,
    bannerDismissed,
    dismissBanner,
    user,
  } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isHome = currentPath === '/';
  const showBanner = !isHome && marketing?.bannerEnabled && !bannerDismissed;

  const navItems = [
    { label: 'Tongariro', path: '/tongariro', flagship: true },
    { label: 'Shop All Water', path: '/shop' },
    { label: 'Other Brands', path: '/brands' },
    { label: 'Origins', path: '/origins' },
    { label: 'Subscriptions', path: '/subscriptions' },
    { label: 'Delivery', path: '/delivery' },
    { label: user ? 'Account' : 'Sign In', path: '/account' },
  ];

  const handleNav = (path: string) => {
    setMobileOpen(false);
    navigate(path);
  };

  return (
    <div className="sticky top-0 z-40 w-full">
      {showBanner && (
        <div className="flex h-9 items-center justify-between bg-[#14181F] px-4 sm:px-8 text-xs text-slate-200">
          <div className="w-4" aria-hidden="true" />
          <button
            onClick={() => handleNav(marketing.bannerLink || '/shop')}
            className="truncate text-center hover:text-white transition-colors"
          >
            {marketing.bannerText}
          </button>
          <button
            onClick={dismissBanner}
            aria-label="Dismiss announcement"
            className="p-1 text-slate-400 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <header
        className={`border-b transition-colors ${
          isHome
            ? 'border-white/10 bg-[#08121C]/85 backdrop-blur-xl text-white'
            : 'border-black/8 bg-[#F8F7F4] text-[#14181F]'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 sm:px-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <button
            onClick={() => handleNav('/')}
            className="font-editorial text-xl sm:text-2xl font-semibold tracking-wide whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0F5C6E]"
          >
            UK BEVERAGES
          </button>

          {/* Zone 2: 5 concise single-line nav links */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-7 text-sm font-medium" aria-label="Primary">
            {navItems.map((item) => {
              const active =
                currentPath === item.path ||
                (item.path === '/tongariro' && currentPath === '/brands/tongariro') ||
                (item.path === '/brands' && currentPath.startsWith('/brands/') && currentPath !== '/brands/tongariro');
              if ('flagship' in item && item.flagship) {
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNav(item.path)}
                    className={`inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-full border px-3 py-1 transition-colors ${
                      isHome
                        ? active ? 'border-white bg-white text-[#0B141E]' : 'border-[#DCE6D3]/50 text-white hover:bg-white/10'
                        : active ? 'border-[#121518] bg-[#121518] text-white' : 'border-[#5E6B4F]/40 text-[#121518] hover:bg-[#121518]/5'
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#A9BE95]" aria-hidden="true" />
                    {item.label}
                  </button>
                );
              }
              return (
                <button
                  key={item.path}
                  onClick={() => handleNav(item.path)}
                  className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                    active
                      ? isHome
                        ? 'border-white text-white'
                        : 'border-[#0F5C6E] text-[#14181F]'
                      : isHome
                      ? 'border-transparent text-slate-300 hover:text-white'
                      : 'border-transparent text-slate-600 hover:text-[#14181F]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setCartDrawerOpen(true)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                isHome
                  ? 'bg-white text-[#0B141E] hover:bg-slate-100'
                  : 'bg-[#14181F] text-white hover:bg-[#0F5C6E]'
              }`}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span className="tabular-nums">Bag ({cartCount})</span>
            </button>

            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="lg:hidden p-2 rounded-lg border border-current/15"
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileOpen && (
          <div
            className={`lg:hidden border-t px-4 py-4 space-y-2 ${
              isHome ? 'border-white/10 bg-[#0B141E] text-white' : 'border-black/10 bg-[#F8F7F4] text-[#14181F]'
            }`}
          >
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className={`flex w-full items-center gap-2 text-left py-2.5 px-2 text-sm rounded-lg hover:bg-black/5 ${
                  'flagship' in item && item.flagship ? 'font-semibold' : 'font-medium'
                }`}
              >
                {'flagship' in item && item.flagship && <span className="h-1.5 w-1.5 rounded-full bg-[#A9BE95]" aria-hidden="true" />}
                {item.label}
                {'flagship' in item && item.flagship && (
                  <span className="ml-auto text-[10px] uppercase tracking-widest opacity-60">Sole UK distributor</span>
                )}
              </button>
            ))}
            <button
              onClick={() => handleNav('/story')}
              className="block w-full text-left py-2.5 px-2 text-sm font-medium rounded-lg hover:bg-black/5"
            >
              Our Story
            </button>
          </div>
        )}
      </header>
    </div>
  );
}
