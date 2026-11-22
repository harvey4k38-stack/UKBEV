import { FREQ_DAYS } from '../lib/subscription';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type {
  Brand,
  CartItemInput,
  DeliveryZone,
  MarketingConfig,
  PostcodeCheckResult,
  Product,
  SubscriptionFrequency,
  UserPublic,
} from '../types';
import { scrollToTop } from '../smoothScroll';

export interface CartEntry extends CartItemInput {
  id: string;
}

interface StoreContextValue {
  brands: Brand[];
  products: Product[];
  deliveryZones: DeliveryZone[];
  marketing: Pick<
    MarketingConfig,
    'bannerEnabled' | 'bannerText' | 'bannerLink' | 'featuredProductIds' | 'companySettings'
  > | null;
  loadingStorefront: boolean;
  refreshStorefront: () => Promise<void>;

  user: UserPublic | null;
  authToken: string | null;
  setAuthSession: (user: UserPublic | null, token?: string | null) => void;
  logout: () => Promise<void>;
  apiFetch: <T = any>(url: string, options?: RequestInit) => Promise<T>;

  cart: CartEntry[];
  cartDrawerOpen: boolean;
  setCartDrawerOpen: (open: boolean) => void;
  addToCart: (
    productId: string,
    quantity?: number,
    purchaseMode?: 'once' | 'subscribe',
    frequency?: SubscriptionFrequency
  ) => void;
  updateCartQuantity: (entryId: string, quantity: number) => void;
  updateCartMode: (
    entryId: string,
    purchaseMode: 'once' | 'subscribe',
    frequency?: SubscriptionFrequency
  ) => void;
  removeFromCart: (entryId: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotalGbp: number;

  savedPostcode: string;
  postcodeResult: PostcodeCheckResult | null;
  checkPostcode: (postcode: string) => Promise<PostcodeCheckResult>;

  currentPath: string;
  navigate: (path: string) => void;

  bannerDismissed: boolean;
  dismissBanner: () => void;

  compareIds: string[];
  toggleCompare: (productId: string) => void;
  clearCompare: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const CART_STORAGE_KEY = 'sourcehouse_cart_v1';
const TOKEN_STORAGE_KEY = 'sourcehouse_token_v1';
const POSTCODE_STORAGE_KEY = 'sourcehouse_postcode_v1';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [marketing, setMarketing] = useState<StoreContextValue['marketing']>(null);
  const [loadingStorefront, setLoadingStorefront] = useState(true);

  const [authToken, setAuthToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const [user, setUser] = useState<UserPublic | null>(null);

  const [cart, setCart] = useState<CartEntry[]>(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartEntry[]) : [];
    } catch {
      return [];
    }
  });
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  const [savedPostcode, setSavedPostcode] = useState<string>(() => {
    try {
      return localStorage.getItem(POSTCODE_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [postcodeResult, setPostcodeResult] = useState<PostcodeCheckResult | null>(null);

  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname || '/');
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  useEffect(() => {
    const onPop = () => {
      setCurrentPath(window.location.pathname || '/');
      scrollToTop(false);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((path: string) => {
    if (path === window.location.pathname + window.location.search) {
      scrollToTop(true);
      return;
    }
    window.history.pushState({}, '', path);
    setCurrentPath(path.split('?')[0] || '/');
    scrollToTop(false);
  }, []);

  const apiFetch = useCallback(
    async <T = any,>(url: string, options: RequestInit = {}): Promise<T> => {
      const headers = new Headers(options.headers || {});
      if (!headers.has('Content-Type') && options.body) {
        headers.set('Content-Type', 'application/json');
      }
      if (authToken) {
        headers.set('Authorization', `Bearer ${authToken}`);
      }
      const res = await fetch(url, { ...options, headers, credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      return data as T;
    },
    [authToken]
  );

  const refreshStorefront = useCallback(async () => {
    try {
      const data = await apiFetch<{
        brands: Brand[];
        products: Product[];
        deliveryZones: DeliveryZone[];
        marketing: StoreContextValue['marketing'];
      }>('/api/storefront');
      setBrands(data.brands);
      setProducts(data.products);
      setDeliveryZones(data.deliveryZones);
      setMarketing(data.marketing);
    } finally {
      setLoadingStorefront(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    refreshStorefront();
  }, [refreshStorefront]);

  useEffect(() => {
    apiFetch<{ user: UserPublic | null }>('/api/auth/me')
      .then((res) => setUser(res.user))
      .catch(() => setUser(null));
  }, [apiFetch]);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore storage quota errors
    }
  }, [cart]);

  const setAuthSession = useCallback((nextUser: UserPublic | null, nextToken?: string | null) => {
    setUser(nextUser);
    if (nextToken !== undefined) {
      setAuthToken(nextToken);
      try {
        if (nextToken) localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
        else localStorage.removeItem(TOKEN_STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setAuthSession(null, null);
  }, [setAuthSession]);

  const checkPostcode = useCallback(
    async (postcode: string): Promise<PostcodeCheckResult> => {
      const result = await apiFetch<PostcodeCheckResult>('/api/delivery/check-postcode', {
        method: 'POST',
        body: JSON.stringify({ postcode }),
      });
      setPostcodeResult(result);
      if (result.valid) {
        setSavedPostcode(result.normalizedPostcode);
        try {
          localStorage.setItem(POSTCODE_STORAGE_KEY, result.normalizedPostcode);
        } catch {
          // ignore
        }
      }
      return result;
    },
    [apiFetch]
  );

  useEffect(() => {
    if (savedPostcode && !postcodeResult) {
      checkPostcode(savedPostcode).catch(() => {});
    }
  }, [savedPostcode, postcodeResult, checkPostcode]);

  const addToCart = useCallback(
    (
      productId: string,
      quantity = 1,
      purchaseMode: 'once' | 'subscribe' = 'once',
      frequency: SubscriptionFrequency = 'monthly'
    ) => {
      setCart((prev) => {
        const existingIdx = prev.findIndex(
          (item) =>
            item.productId === productId &&
            item.purchaseMode === purchaseMode &&
            (purchaseMode === 'once' || item.frequency === frequency)
        );
        if (existingIdx !== -1) {
          const updated = [...prev];
          updated[existingIdx] = {
            ...updated[existingIdx],
            quantity: Math.min(99, updated[existingIdx].quantity + quantity),
          };
          return updated;
        }
        return [
          ...prev,
          {
            id: `${productId}-${purchaseMode}-${frequency}-${Date.now()}`,
            productId,
            quantity,
            purchaseMode,
            frequency: purchaseMode === 'subscribe' ? frequency : undefined,
          },
        ];
      });
      setCartDrawerOpen(true);
    },
    []
  );

  const updateCartQuantity = useCallback((entryId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.id !== entryId));
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.id === entryId ? { ...item, quantity: Math.min(99, quantity) } : item
      )
    );
  }, []);

  const updateCartMode = useCallback(
    (entryId: string, purchaseMode: 'once' | 'subscribe', frequency: SubscriptionFrequency = 'monthly') => {
      setCart((prev) =>
        prev.map((item) =>
          item.id === entryId
            ? {
                ...item,
                // Changing how often keeps the same amount of water: weekly → monthly ≈ 4× the cases per drop.
                quantity:
                  purchaseMode === 'subscribe' && item.purchaseMode === 'subscribe' && item.frequency && item.frequency !== frequency
                    ? Math.min(99, Math.max(1, Math.round((item.quantity * FREQ_DAYS[frequency]) / FREQ_DAYS[item.frequency])))
                    : item.quantity,
                purchaseMode,
                frequency: purchaseMode === 'subscribe' ? frequency : undefined,
              }
            : item
        )
      );
    },
    []
  );

  const removeFromCart = useCallback((entryId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== entryId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotalGbp = Math.round(
    cart.reduce((acc, item) => {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) return acc;
      const unit =
        item.purchaseMode === 'subscribe'
          ? prod.priceGbp * (1 - prod.subscriptionDiscountPct / 100)
          : prod.priceGbp;
      return acc + unit * item.quantity;
    }, 0) * 100
  ) / 100;

  const toggleCompare = useCallback((productId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(productId)) return prev.filter((id) => id !== productId);
      if (prev.length >= 4) return [...prev.slice(1), productId];
      return [...prev, productId];
    });
  }, []);

  const clearCompare = useCallback(() => setCompareIds([]), []);

  return (
    <StoreContext.Provider
      value={{
        brands,
        products,
        deliveryZones,
        marketing,
        loadingStorefront,
        refreshStorefront,
        user,
        authToken,
        setAuthSession,
        logout,
        apiFetch,
        cart,
        cartDrawerOpen,
        setCartDrawerOpen,
        addToCart,
        updateCartQuantity,
        updateCartMode,
        removeFromCart,
        clearCart,
        cartCount,
        cartSubtotalGbp,
        savedPostcode,
        postcodeResult,
        checkPostcode,
        currentPath,
        navigate,
        bannerDismissed,
        dismissBanner: () => setBannerDismissed(true),
        compareIds,
        toggleCompare,
        clearCompare,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
