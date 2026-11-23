/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy, useEffect, useState } from 'react';
import { CartDrawer } from './components/CartDrawer';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { StoreProvider, useStore } from './context/StoreContext';
import { BrandPage } from './pages/BrandPage';
import { CartPage } from './pages/CartPage';
import { DeliveryPage } from './pages/DeliveryPage';
import { HomePage } from './pages/HomePage';
import {
  ContactPage,
  FaqsPage,
  LegalPage,
  OriginsPage,
  StoryPage,
} from './pages/OriginsStoryPages';
import { ProductPage } from './pages/ProductPage';
import { ShopPage } from './pages/ShopPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
const OrderConfirmationPage = lazy(() => import('./pages/OrderConfirmationPage').then((m) => ({ default: m.OrderConfirmationPage })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));
const AccountPage = lazy(() => import('./pages/AccountPage').then((m) => ({ default: m.AccountPage })));

const TongariroPage = lazy(() => import('./pages/TongariroPage').then((m) => ({ default: m.TongariroPage })));
const OtherBrandsPage = lazy(() => import('./pages/TongariroPage').then((m) => ({ default: m.OtherBrandsPage })));

function AppRouter() {
  const { currentPath, loadingStorefront } = useStore();
  const path = currentPath.replace(/\/+$/, '') || '/';

  if (loadingStorefront) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F7F4] text-sm text-slate-600">
        Loading UK Beverages…
      </div>
    );
  }

  let view: React.ReactNode = <HomePage />;

  if (path === '/') {
    view = <HomePage />;
  } else if (path === '/shop') {
    view = <ShopPage />;
  } else if (path === '/tongariro' || path === '/brands/tongariro') {
    view = <TongariroPage />;
  } else if (path === '/brands') {
    view = <OtherBrandsPage />;
  } else if (path.startsWith('/brands/')) {
    const slug = path.slice('/brands/'.length);
    view = <BrandPage slug={slug} />;
  } else if (path.startsWith('/products/')) {
    const slug = path.slice('/products/'.length);
    view = <ProductPage slug={slug} />;
  } else if (path === '/subscriptions') {
    view = <SubscriptionsPage />;
  } else if (path === '/subscriptions/manage') {
    view = <AccountPage defaultTab="subscriptions" />;
  } else if (path === '/origins') {
    view = <OriginsPage />;
  } else if (path === '/story') {
    view = <StoryPage />;
  } else if (path === '/delivery') {
    view = <DeliveryPage />;
  } else if (path === '/faqs') {
    view = <FaqsPage />;
  } else if (path === '/contact') {
    view = <ContactPage />;
  } else if (path === '/account') {
    view = <AccountPage defaultTab="orders" />;
  } else if (path === '/cart') {
    view = <CartPage />;
  } else if (path === '/checkout') {
    view = <CheckoutPage />;
  } else if (path.startsWith('/order-confirmation/')) {
    const orderId = path.slice('/order-confirmation/'.length);
    view = <OrderConfirmationPage orderId={orderId} />;
  } else if (path === '/admin') {
    view = <AdminPage />;
  } else if (path.startsWith('/legal/')) {
    const type = path.slice('/legal/'.length);
    view = <LegalPage type={type} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F7F4] text-[#14181F]">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<div className="min-h-[60vh]" />}>{view}</Suspense>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}

export default function App() {
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState(false);

  useEffect(() => {
    const onQuotaExceeded = () => setMapsQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuotaExceeded);
  }, []);

  return (
    <StoreProvider>
      {mapsQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}
      <AppRouter />
    </StoreProvider>
  );
}

