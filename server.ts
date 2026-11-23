import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import express, { type NextFunction, type Request, type Response } from 'express';
import Stripe from 'stripe';
import { createServer as createViteServer } from 'vite';
import { MULTIPACK_PRODUCTS, PRODUCT_PHOTOS, db, hashPassword, verifyPassword, type StoredUser } from './server/store.ts';
import type {
  CartItemInput,
  DeliveryZone,
  Order,
  OrderItem,
  PostcodeCheckResult,
  Subscription,
  UserPublic,
} from './src/types.ts';

dotenv.config();

const PORT = Number(process.env.PORT || 3000);

// Payments: Stripe Checkout when STRIPE_SECRET_KEY is set. Without a key, local development
// falls back to a clearly-labelled demo mode; production refuses to take orders unpaid.
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const PAYMENT_MODE: 'stripe' | 'demo' | 'unavailable' = stripe
  ? 'stripe'
  : process.env.NODE_ENV === 'production'
    ? 'unavailable'
    : 'demo';
const SESSION_SECRET = process.env.SESSION_SECRET || 'sourcehouse-uk-session-secret-2026';

interface AuthedRequest extends Request {
  user?: StoredUser;
}

function sanitizeUser(u: StoredUser): UserPublic {
  const { passwordHash: _ph, ...rest } = u;
  return rest;
}

function signToken(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ uid: userId, iat: Date.now() })).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyToken(token: string): string | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as { uid?: string };
    return parsed.uid || null;
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const map: Record<string, string> = {};
  if (!cookieHeader) return map;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    map[k] = decodeURIComponent(v);
  }
  return map;
}

function attachUser(req: AuthedRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else {
    const cookies = parseCookies(req.headers.cookie);
    token = cookies.sh_token || '';
  }
  if (token) {
    const uid = verifyToken(token);
    if (uid) {
      req.user = db.getState().users.find((u) => u.id === uid);
    }
  }
  next();
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  next();
}

function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}

const UK_POSTCODE_REGEX = /^([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})$/;

function evaluatePostcode(rawPostcode: string): PostcodeCheckResult {
  const cleaned = rawPostcode.toUpperCase().replace(/\s+/g, '').trim();
  if (!cleaned) {
    return { valid: false, deliverable: false, normalizedPostcode: '', reason: 'Please enter a UK postcode.' };
  }
  const match = cleaned.match(UK_POSTCODE_REGEX);
  if (!match) {
    return {
      valid: false,
      deliverable: false,
      normalizedPostcode: rawPostcode.toUpperCase().trim(),
      reason: 'Please enter a valid full UK postcode (e.g. SW1X 0AZ or EH1 1YZ).',
    };
  }
  const outward = match[1];
  const inward = match[2];
  const normalized = `${outward} ${inward}`;
  const areaLetters = outward.match(/^[A-Z]+/)?.[0] || '';

  if (['GY', 'JE', 'IM'].includes(areaLetters)) {
    return {
      valid: true,
      deliverable: false,
      normalizedPostcode: normalized,
      reason:
        'Channel Islands (GY, JE) and Isle of Man (IM) deliveries are not currently supported on our standard UK courier network.',
    };
  }

  const zones = db.getState().deliveryZones.filter((z) => z.active);
  // Check exact outward prefix match first (e.g. PO30, PA20), then area letters (e.g. SW, IV)
  const candidates = [outward, areaLetters];
  let matchedZone: DeliveryZone | undefined;

  for (const token of candidates) {
    matchedZone = zones.find(
      (z) => z.prefixes.includes(token) && !z.excludedPrefixes.includes(outward)
    );
    if (matchedZone) break;
  }

  if (!matchedZone) {
    return {
      valid: true,
      deliverable: false,
      normalizedPostcode: normalized,
      reason: `Delivery to ${normalized} is outside our currently active UK delivery zones.`,
    };
  }

  return {
    valid: true,
    deliverable: true,
    normalizedPostcode: normalized,
    zone: matchedZone,
  };
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function addDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function calculateQuote(params: {
  items: CartItemInput[];
  postcode?: string;
  deliveryMethod?: 'standard' | 'express';
  discountCode?: string;
}) {
  const state = db.getState();
  const resolvedItems: OrderItem[] = [];
  let subtotalGbp = 0;

  for (const line of params.items) {
    const product = state.products.find((p) => p.id === line.productId && p.active);
    if (!product) {
      throw new Error(`Product ${line.productId} is unavailable.`);
    }
    const qty = Math.max(1, Math.min(99, Math.floor(Number(line.quantity) || 1)));
    if (product.stock < qty) {
      throw new Error(`Insufficient stock for ${product.name} (${product.stock} remaining).`);
    }
    const brand = state.brands.find((b) => b.id === product.brandId);
    const isSub = line.purchaseMode === 'subscribe';
    const unitPrice = isSub
      ? roundMoney(product.priceGbp * (1 - product.subscriptionDiscountPct / 100))
      : product.priceGbp;
    const lineTotal = roundMoney(unitPrice * qty);
    subtotalGbp = roundMoney(subtotalGbp + lineTotal);

    resolvedItems.push({
      productId: product.id,
      sku: product.sku,
      name: product.name,
      brandName: brand?.name || 'UK Beverages',
      bottleSizeLabel: product.bottleSizeLabel,
      packQuantity: product.packQuantity,
      quantity: qty,
      unitPriceGbp: unitPrice,
      lineTotalGbp: lineTotal,
      purchaseMode: line.purchaseMode,
      frequency: isSub ? line.frequency || 'monthly' : undefined,
      bottleStyle: product.bottleStyle,
      capColor: product.capColor,
      tintColor: product.tintColor,
      labelAccent: product.labelAccent,
    });
  }

  let postcodeCheck: PostcodeCheckResult | null = null;
  if (params.postcode) {
    postcodeCheck = evaluatePostcode(params.postcode);
  }

  const zone = postcodeCheck?.zone || state.deliveryZones[0];
  let discountGbp = 0;
  let freeShippingFromCode = false;
  let appliedCode: string | undefined;
  let discountError: string | undefined;

  if (params.discountCode && params.discountCode.trim()) {
    const codeUpper = params.discountCode.trim().toUpperCase();
    const found = state.discountCodes.find((c) => c.code.toUpperCase() === codeUpper && c.active);
    if (!found) {
      discountError = 'Discount code not recognised or inactive.';
    } else if (subtotalGbp < found.minOrderGbp) {
      discountError = `Code ${found.code} requires a minimum spend of £${found.minOrderGbp.toFixed(2)}.`;
    } else {
      appliedCode = found.code;
      if (found.type === 'percent') {
        discountGbp = roundMoney(subtotalGbp * (found.value / 100));
      } else if (found.type === 'fixed') {
        discountGbp = Math.min(subtotalGbp, found.value);
      } else if (found.type === 'free_shipping') {
        freeShippingFromCode = true;
      }
    }
  }

  const afterDiscount = Math.max(0, roundMoney(subtotalGbp - discountGbp));
  const method = params.deliveryMethod === 'express' ? 'express' : 'standard';

  let shippingGbp = 0;
  if (zone) {
    if (method === 'express') {
      shippingGbp = zone.expressFeeGbp;
    } else {
      const qualifiesFree = afterDiscount >= zone.freeThresholdGbp || freeShippingFromCode;
      shippingGbp = qualifiesFree ? 0 : zone.feeGbp;
    }
  }

  const totalGbp = roundMoney(afterDiscount + shippingGbp);
  // UK standard VAT (20%) included in bottled water retail prices: VAT = Total * (20 / 120)
  const vatIncludedGbp = roundMoney(totalGbp / 6);

  return {
    items: resolvedItems,
    subtotalGbp,
    discountCode: appliedCode,
    discountGbp,
    discountError,
    shippingGbp,
    vatIncludedGbp,
    totalGbp,
    zone,
    postcodeCheck,
    belowMinimumOrder: zone ? subtotalGbp < zone.minOrderGbp : false,
  };
}

function addDaysFromNow(days: number) {
  return addDaysIso(days);
}

/** Marks an order paid: commits stock, assigns tracking, starts any subscriptions. Idempotent. */
function finalizePaidOrder(order: Order, payment: { method: Order['paymentMethod']; last4: string }) {
  if (order.status !== 'Awaiting Payment') return;
  const state = db.getState();
  for (const item of order.items) {
    const prod = state.products.find((p) => p.id === item.productId);
    if (prod) prod.stock = Math.max(0, prod.stock - item.quantity);
  }
  const nowIso = new Date().toISOString();
  order.status = 'Confirmed';
  order.paymentMethod = payment.method;
  order.paymentLast4 = payment.last4;
  order.trackingNumber = `DPD-UK-${Math.floor(10000000 + Math.random() * 89999999)}`;
  order.emailLog.push(`${nowIso} — Order ${order.orderNumber} confirmation & VAT receipt sent to ${order.customerEmail}`);

  for (const item of order.items) {
    if (item.purchaseMode !== 'subscribe') continue;
    const freq = item.frequency || 'monthly';
    const daysMap = { weekly: 7, fortnightly: 14, monthly: 30 };
    const sub: Subscription = {
      id: `sub-${crypto.randomUUID().slice(0, 8)}`,
      userId: order.userId,
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      productId: item.productId,
      productName: item.name,
      brandName: item.brandName,
      bottleSizeLabel: item.bottleSizeLabel,
      packQuantity: item.packQuantity,
      frequency: freq,
      quantity: item.quantity,
      unitPriceGbp: item.unitPriceGbp,
      status: 'Active',
      nextDeliveryDate: addDaysFromNow(daysMap[freq]),
      shippingAddress: order.shippingAddress,
      paymentLast4: order.paymentLast4,
      createdAt: nowIso,
    };
    state.subscriptions.unshift(sub);
  }
  db.save();
}

async function confirmStripeSession(sessionId: string): Promise<Order | null> {
  if (!stripe) return null;
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['payment_intent.payment_method'],
  });
  const orderId = session.metadata?.orderId || session.client_reference_id;
  const order = db.getState().orders.find((o) => o.id === orderId);
  if (!order || order.stripeSessionId !== session.id) return null;
  if (session.payment_status === 'paid') {
    const pi = session.payment_intent as Stripe.PaymentIntent | null;
    const pm = pi?.payment_method as Stripe.PaymentMethod | null;
    const wallet = pm?.card?.wallet?.type;
    const method: Order['paymentMethod'] =
      pm?.type === 'klarna' ? 'klarna_uk'
      : pm?.type === 'link' ? 'link'
      : wallet === 'apple_pay' ? 'apple_pay'
      : wallet === 'google_pay' ? 'google_pay'
      : 'card';
    finalizePaidOrder(order, { method, last4: pm?.card?.last4 || '' });
  }
  return order;
}

async function startServer() {
  // Catalogue migration: add any newly introduced products missing from an existing database.
  {
    const state = db.getState();
    const missing = MULTIPACK_PRODUCTS.filter((p) => !state.products.some((x) => x.id === p.id));
    if (missing.length) {
      state.products.push(...missing.map((p) => ({ ...p })));
      db.save();
      console.log(`[catalogue] added ${missing.length} new product(s)`);
    }
  }

  // We only sell plastic bottles: retire the glass-bottle range once (admins can re-enable later).
  {
    const state = db.getState();
    const applied = (state.appliedMigrations ||= []);
    if (!applied.includes('retire-glass-v1')) {
      let n = 0;
      for (const p of state.products) {
        if (p.packaging === 'Glass' && p.active) {
          p.active = false;
          n++;
        }
      }
      state.marketing.featuredProductIds = state.marketing.featuredProductIds.filter(
        (id) => state.products.find((p) => p.id === id)?.active
      );
      applied.push('retire-glass-v1');
      db.save();
      console.log(`[catalogue] retired ${n} glass product(s)`);
    }
  }

  // Attach product photography to older listings (only where no photo has been set).
  {
    const state = db.getState();
    let n = 0;
    for (const p of state.products) {
      if (!p.imageUrl && PRODUCT_PHOTOS[p.id]) {
        p.imageUrl = PRODUCT_PHOTOS[p.id];
        n++;
      }
    }
    if (n) {
      db.save();
      console.log(`[catalogue] added photos to ${n} product(s)`);
    }
  }

  // Bag-in-box range discontinued (bottles only). Runs once; admins can re-enable later.
  {
    const state = db.getState();
    const applied = (state.appliedMigrations ||= []);
    if (!applied.includes('retire-bib-v1')) {
      for (const p of state.products) if (p.packaging === 'Bag-in-Box') p.active = false;
      state.marketing.featuredProductIds = state.marketing.featuredProductIds.filter(
        (id) => state.products.find((p) => p.id === id)?.active
      );
      applied.push('retire-bib-v1');
      db.save();
      console.log('[catalogue] retired bag-in-box products');
    }
  }

  // One-off repricing to real UK case prices (£5–£8). Later admin edits are kept.
  {
    const state = db.getState();
    const applied = (state.appliedMigrations ||= []);
    if (!applied.includes('reprice-2026-11')) {
      const prices: Record<string, number> = JSON.parse(
        fs.readFileSync(path.resolve(process.cwd(), 'server/prices.json'), 'utf8')
      );
      for (const p of state.products) {
        if (prices[p.id] != null) {
          p.priceGbp = prices[p.id];
          delete p.compareAtPriceGbp;
        }
      }
      applied.push('reprice-2026-11');
      db.save();
      console.log('[catalogue] applied 2026-11 prices');
    }
  }

  // Real admin credentials come from the environment, never from the client bundle.
  {
    const admin = db.getState().users.find((u) => u.role === 'admin');
    if (admin && process.env.ADMIN_EMAIL) admin.email = process.env.ADMIN_EMAIL.trim().toLowerCase();
    if (admin && process.env.ADMIN_PASSWORD) {
      admin.passwordHash = hashPassword(process.env.ADMIN_PASSWORD);
      db.save();
    } else if (process.env.NODE_ENV === 'production') {
      console.warn('[security] ADMIN_PASSWORD is not set; the seeded admin password is public. Set it before going live.');
    }
  }

  const app = express();

  // Stripe webhook (needs the raw body, so it is registered before the JSON parser).
  // Confirms orders even if the customer closes the tab before returning to the site.
  app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripe || !secret) {
      res.status(400).send('Webhook not configured');
      return;
    }
    try {
      const event = stripe.webhooks.constructEvent(req.body, String(req.headers['stripe-signature'] || ''), secret);
      if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
        await confirmStripeSession((event.data.object as Stripe.Checkout.Session).id);
      }
      res.json({ received: true });
    } catch (err) {
      console.error('[stripe webhook]', err);
      res.status(400).send('Invalid webhook');
    }
  });

  app.use(express.json({ limit: '2mb' }));
  app.use(attachUser);

  // SEO endpoints
  app.get('/robots.txt', (_req, res) => {
    const base = process.env.APP_URL || 'https://ukbeverages.co.uk';
    res.type('text/plain').send(
      `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /account\nDisallow: /checkout\nSitemap: ${base}/sitemap.xml\n`
    );
  });

  app.get('/sitemap.xml', (_req, res) => {
    const base = (process.env.APP_URL || 'https://ukbeverages.co.uk').replace(/\/$/, '');
    const state = db.getState();
    const staticPaths = [
      '/',
      '/shop',
      '/origins',
      '/subscriptions',
      '/delivery',
      '/story',
      '/faqs',
      '/contact',
      '/legal/privacy',
      '/legal/terms',
      '/legal/returns',
      '/legal/delivery',
      '/legal/subscriptions',
    ];
    const urls = [
      ...staticPaths.map((p) => `${base}${p}`),
      ...state.brands.filter((b) => b.active).map((b) => `${base}/brands/${b.slug}`),
      ...state.products.filter((p) => p.active).map((p) => `${base}/products/${p.slug}`),
    ];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map((u) => `  <url><loc>${u}</loc><changefreq>weekly</changefreq></url>`)
      .join('\n')}\n</urlset>`;
    res.type('application/xml').send(xml);
  });

  // Public Storefront Bootstrap
  app.get('/api/storefront', (_req, res) => {
    const state = db.getState();
    res.json({
      brands: state.brands.filter((b) => b.active),
      products: state.products.filter((p) => p.active),
      deliveryZones: state.deliveryZones.filter((z) => z.active),
      marketing: {
        bannerEnabled: state.marketing.bannerEnabled,
        bannerText: state.marketing.bannerText,
        bannerLink: state.marketing.bannerLink,
        featuredProductIds: state.marketing.featuredProductIds,
        companySettings: state.marketing.companySettings,
      },
    });
  });

  // Postcode Check
  app.post('/api/delivery/check-postcode', (req, res) => {
    const postcode = String(req.body?.postcode || '');
    res.json(evaluatePostcode(postcode));
  });

  // Cart / Checkout Quote
  app.post('/api/checkout/quote', (req, res) => {
    try {
      const { items, postcode, deliveryMethod, discountCode } = req.body || {};
      if (!Array.isArray(items) || items.length === 0) {
        res.status(400).json({ error: 'Cart is empty.' });
        return;
      }
      const quote = calculateQuote({ items, postcode, deliveryMethod, discountCode });
      res.json(quote);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Quote failed.' });
    }
  });

  // Checkout configuration (tells the client how payment will be taken)
  app.get('/api/checkout/config', (_req, res) => {
    res.json({ paymentMode: PAYMENT_MODE });
  });

  // Checkout Order Creation (Guest or Logged-in)
  // Creates an order in "Awaiting Payment", then hands off to Stripe Checkout.
  app.post('/api/checkout/orders', async (req: AuthedRequest, res) => {
    try {
      if (PAYMENT_MODE === 'unavailable') {
        res.status(503).json({ error: 'Online payments are temporarily unavailable. Please try again shortly.' });
        return;
      }
      const {
        items,
        customerEmail,
        customerName,
        phone,
        shippingAddress,
        deliveryMethod = 'standard',
        discountCode,
      } = req.body || {};

      if (!Array.isArray(items) || items.length === 0) {
        res.status(400).json({ error: 'Your bag is empty.' });
        return;
      }
      if (!customerEmail || !customerName || !shippingAddress?.line1 || !shippingAddress?.city || !shippingAddress?.postcode) {
        res.status(400).json({ error: 'Please complete all required customer and UK delivery address fields.' });
        return;
      }

      const postcodeResult = evaluatePostcode(String(shippingAddress.postcode));
      if (!postcodeResult.valid || !postcodeResult.deliverable || !postcodeResult.zone) {
        res.status(400).json({ error: postcodeResult.reason || 'Delivery unavailable for this postcode.' });
        return;
      }

      const quote = calculateQuote({
        items,
        postcode: postcodeResult.normalizedPostcode,
        deliveryMethod,
        discountCode,
      });

      if (quote.belowMinimumOrder && quote.zone) {
        res.status(400).json({
          error: `Minimum order value for ${quote.zone.name} is £${quote.zone.minOrderGbp.toFixed(2)}.`,
        });
        return;
      }

      const state = db.getState();
      for (const item of quote.items) {
        const prod = state.products.find((p) => p.id === item.productId);
        if (!prod || prod.stock < item.quantity) {
          res.status(400).json({ error: `Insufficient stock for ${item.name}.` });
          return;
        }
      }

      const orderNum = `UKB-2026-${1043 + state.orders.length}`;
      const orderId = `ord-${crypto.randomUUID().slice(0, 12)}`;
      const nowIso = new Date().toISOString();
      const email = String(customerEmail).trim().toLowerCase();
      const method = deliveryMethod === 'express' ? 'express' : 'standard';

      const order: Order = {
        id: orderId,
        orderNumber: orderNum,
        userId: req.user?.id,
        customerEmail: email,
        customerName: String(customerName).trim(),
        phone: String(phone || shippingAddress.phone || '').trim(),
        shippingAddress: {
          recipient: String(shippingAddress.recipient || customerName).trim(),
          line1: String(shippingAddress.line1).trim(),
          line2: shippingAddress.line2 ? String(shippingAddress.line2).trim() : undefined,
          city: String(shippingAddress.city).trim(),
          county: shippingAddress.county ? String(shippingAddress.county).trim() : undefined,
          postcode: postcodeResult.normalizedPostcode,
          phone: String(phone || shippingAddress.phone || '').trim(),
        },
        deliveryZoneId: postcodeResult.zone.id,
        deliveryZoneName: postcodeResult.zone.name,
        deliveryMethod: method,
        items: quote.items,
        subtotalGbp: quote.subtotalGbp,
        discountCode: quote.discountCode,
        discountGbp: quote.discountGbp,
        shippingGbp: quote.shippingGbp,
        vatIncludedGbp: quote.vatIncludedGbp,
        totalGbp: quote.totalGbp,
        paymentMethod: 'card',
        paymentLast4: '',
        status: 'Awaiting Payment',
        trackingNumber: '',
        carrier: method === 'express' ? 'DPD Next Day UK' : 'DPD Local UK',
        estimatedDelivery: method === 'express' ? postcodeResult.zone.expressDays : postcodeResult.zone.estimatedDays,
        createdAt: nowIso,
        emailLog: [],
      };

      if (PAYMENT_MODE === 'demo') {
        state.orders.unshift(order);
        finalizePaidOrder(order, { method: 'demo', last4: '0000' });
        res.status(201).json({ order });
        return;
      }

      // Stripe Checkout: prices are VAT-inclusive GBP, amounts in pence, computed server-side only.
      const origin = (process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
      const pence = (gbp: number) => Math.round(gbp * 100);
      const hasSubscription = quote.items.some((i) => i.purchaseMode === 'subscribe');

      let couponId: string | undefined;
      if (quote.discountGbp > 0) {
        const coupon = await stripe!.coupons.create({
          amount_off: pence(quote.discountGbp),
          currency: 'gbp',
          duration: 'once',
          name: `Code ${quote.discountCode}`,
        });
        couponId = coupon.id;
      }

      const session = await stripe!.checkout.sessions.create({
        mode: 'payment',
        customer_email: email,
        client_reference_id: orderId,
        metadata: { orderId, orderNumber: orderNum },
        line_items: quote.items.map((item) => ({
          quantity: item.quantity,
          price_data: {
            currency: 'gbp',
            unit_amount: pence(item.unitPriceGbp),
            product_data: {
              name: item.name,
              description: `${item.bottleSizeLabel} × ${item.packQuantity}${
                item.purchaseMode === 'subscribe' ? ` · first delivery of your ${item.frequency} subscription` : ''
              }`,
            },
          },
        })),
        discounts: couponId ? [{ coupon: couponId }] : undefined,
        shipping_options: [
          {
            shipping_rate_data: {
              type: 'fixed_amount',
              display_name: `${method === 'express' ? 'Express' : 'Standard'} UK delivery · ${order.estimatedDelivery}`,
              fixed_amount: { amount: pence(quote.shippingGbp), currency: 'gbp' },
            },
          },
        ],
        // Save the card for subscription renewals
        payment_intent_data: hasSubscription ? { setup_future_usage: 'off_session' } : undefined,
        customer_creation: hasSubscription ? 'always' : undefined,
        success_url: `${origin}/order-confirmation/${orderId}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/checkout?cancelled=1`,
      });

      order.stripeSessionId = session.id;
      state.orders.unshift(order);
      db.save();
      res.status(201).json({ checkoutUrl: session.url });
    } catch (err) {
      console.error('[checkout]', err);
      // Never leak payment-provider internals to shoppers
      const isStripeError = err instanceof Stripe.errors.StripeError;
      res.status(isStripeError ? 502 : 400).json({
        error: isStripeError
          ? 'We couldn’t start secure payment just now. Please try again in a moment.'
          : err instanceof Error
            ? err.message
            : 'Checkout failed.',
      });
    }
  });

  // Return from Stripe: verify the session server-side before confirming the order.
  app.get('/api/checkout/confirm', async (req, res) => {
    try {
      const sessionId = String(req.query.session_id || '');
      if (!stripe || !sessionId) {
        res.status(400).json({ error: 'Missing payment session.' });
        return;
      }
      const order = await confirmStripeSession(sessionId);
      if (!order) {
        res.status(404).json({ error: 'Order not found for this payment.' });
        return;
      }
      res.json(order);
    } catch (err) {
      console.error('[checkout confirm]', err);
      res.status(400).json({ error: 'Unable to verify payment.' });
    }
  });

  // Public Order Lookup / Confirmation
  app.get('/api/orders/lookup', (req, res) => {
    const orderNumber = String(req.query.orderNumber || '').trim().toUpperCase();
    const email = String(req.query.email || '').trim().toLowerCase();
    const state = db.getState();
    const order = state.orders.find(
      (o) =>
        o.orderNumber.toUpperCase() === orderNumber &&
        (!email || o.customerEmail.toLowerCase() === email)
    );
    if (!order) {
      res.status(404).json({ error: 'Order not found. Check your order number and email.' });
      return;
    }
    res.json(order);
  });

  app.get('/api/orders/:id', (req, res) => {
    const order = db.getState().orders.find((o) => o.id === req.params.id || o.orderNumber === req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.json(order);
  });

  // Auth Endpoints
  app.post('/api/auth/register', (req, res) => {
    const { email, password, name, phone } = req.body || {};
    if (!email || !password || !name) {
      res.status(400).json({ error: 'Name, email, and password are required.' });
      return;
    }
    if (String(password).length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters.' });
      return;
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const state = db.getState();
    if (state.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }
    const newUser: StoredUser = {
      id: `user-${crypto.randomUUID().slice(0, 8)}`,
      email: normalizedEmail,
      name: String(name).trim(),
      phone: String(phone || '').trim(),
      role: 'customer',
      passwordHash: hashPassword(String(password)),
      addresses: [],
      paymentMethods: [],
      createdAt: new Date().toISOString(),
    };
    state.users.push(newUser);
    db.save();

    const token = signToken(newUser.id);
    res.setHeader('Set-Cookie', `sh_token=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`);
    res.status(201).json({ user: sanitizeUser(newUser), token });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const user = db.getState().users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!user || !verifyPassword(String(password || ''), user.passwordHash)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }
    const token = signToken(user.id);
    res.setHeader('Set-Cookie', `sh_token=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`);
    res.json({ user: sanitizeUser(user), token });
  });

  app.post('/api/auth/logout', (_req, res) => {
    res.setHeader('Set-Cookie', 'sh_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
    res.json({ ok: true });
  });

  app.get('/api/auth/me', (req: AuthedRequest, res) => {
    if (!req.user) {
      res.json({ user: null });
      return;
    }
    res.json({ user: sanitizeUser(req.user) });
  });

  // Customer Account Endpoints
  app.get('/api/account/overview', requireAuth, (req: AuthedRequest, res) => {
    const user = req.user!;
    const state = db.getState();
    const orders = state.orders.filter(
      (o) => o.userId === user.id || o.customerEmail.toLowerCase() === user.email.toLowerCase()
    );
    const subscriptions = state.subscriptions.filter(
      (s) => s.userId === user.id || s.customerEmail.toLowerCase() === user.email.toLowerCase()
    );
    res.json({ user: sanitizeUser(user), orders, subscriptions });
  });

  app.patch('/api/account/profile', requireAuth, (req: AuthedRequest, res) => {
    const user = req.user!;
    if (req.body?.name) user.name = String(req.body.name).trim();
    if (req.body?.phone !== undefined) user.phone = String(req.body.phone).trim();
    db.save();
    res.json({ user: sanitizeUser(user) });
  });

  app.post('/api/account/addresses', requireAuth, (req: AuthedRequest, res) => {
    const user = req.user!;
    const { label, recipient, line1, line2, city, county, postcode, phone } = req.body || {};
    const pc = evaluatePostcode(String(postcode || ''));
    if (!pc.valid) {
      res.status(400).json({ error: pc.reason || 'Invalid UK postcode' });
      return;
    }
    const addr = {
      id: `addr-${crypto.randomUUID().slice(0, 8)}`,
      label: String(label || 'Home').trim(),
      recipient: String(recipient || user.name).trim(),
      line1: String(line1 || '').trim(),
      line2: line2 ? String(line2).trim() : undefined,
      city: String(city || '').trim(),
      county: county ? String(county).trim() : undefined,
      postcode: pc.normalizedPostcode,
      phone: String(phone || user.phone).trim(),
      isDefault: user.addresses.length === 0,
    };
    user.addresses.push(addr);
    db.save();
    res.status(201).json({ user: sanitizeUser(user) });
  });

  app.delete('/api/account/addresses/:id', requireAuth, (req: AuthedRequest, res) => {
    const user = req.user!;
    user.addresses = user.addresses.filter((a) => a.id !== req.params.id);
    db.save();
    res.json({ user: sanitizeUser(user) });
  });

  app.post('/api/account/payment-methods', requireAuth, (req: AuthedRequest, res) => {
    const user = req.user!;
    const { brand = 'Visa', last4, expiry, holderName } = req.body || {};
    if (!last4 || String(last4).length < 4 || !expiry) {
      res.status(400).json({ error: 'Card number and expiry are required.' });
      return;
    }
    user.paymentMethods.push({
      id: `pm-${crypto.randomUUID().slice(0, 8)}`,
      brand: String(brand),
      last4: String(last4).slice(-4),
      expiry: String(expiry),
      holderName: String(holderName || user.name),
      isDefault: user.paymentMethods.length === 0,
    });
    db.save();
    res.status(201).json({ user: sanitizeUser(user) });
  });

  app.delete('/api/account/payment-methods/:id', requireAuth, (req: AuthedRequest, res) => {
    const user = req.user!;
    user.paymentMethods = user.paymentMethods.filter((p) => p.id !== req.params.id);
    db.save();
    res.json({ user: sanitizeUser(user) });
  });

  // Subscription Management (Customer or Admin)
  app.patch('/api/subscriptions/:id', requireAuth, (req: AuthedRequest, res) => {
    const state = db.getState();
    const sub = state.subscriptions.find((s) => s.id === req.params.id);
    if (!sub) {
      res.status(404).json({ error: 'Subscription not found.' });
      return;
    }
    if (
      req.user!.role !== 'admin' &&
      sub.userId !== req.user!.id &&
      sub.customerEmail.toLowerCase() !== req.user!.email.toLowerCase()
    ) {
      res.status(403).json({ error: 'Not authorised to modify this subscription.' });
      return;
    }

    const { status, frequency, quantity, productId, shippingAddress, paymentLast4 } = req.body || {};
    if (status && ['Active', 'Paused', 'Cancelled'].includes(status)) {
      sub.status = status;
    }
    if (frequency && ['weekly', 'fortnightly', 'monthly'].includes(frequency)) {
      sub.frequency = frequency;
      const daysMap = { weekly: 7, fortnightly: 14, monthly: 30 };
      sub.nextDeliveryDate = addDaysIso(daysMap[frequency as keyof typeof daysMap]);
    }
    if (quantity && Number(quantity) >= 1) {
      sub.quantity = Math.min(20, Math.floor(Number(quantity)));
    }
    if (productId) {
      const prod = state.products.find((p) => p.id === productId && p.active);
      if (prod) {
        const brand = state.brands.find((b) => b.id === prod.brandId);
        sub.productId = prod.id;
        sub.productName = prod.name;
        sub.brandName = brand?.name || sub.brandName;
        sub.bottleSizeLabel = prod.bottleSizeLabel;
        sub.packQuantity = prod.packQuantity;
        sub.unitPriceGbp = roundMoney(prod.priceGbp * (1 - prod.subscriptionDiscountPct / 100));
      }
    }
    if (shippingAddress?.line1 && shippingAddress?.postcode) {
      const pc = evaluatePostcode(String(shippingAddress.postcode));
      if (!pc.valid || !pc.deliverable) {
        res.status(400).json({ error: pc.reason || 'Invalid UK postcode.' });
        return;
      }
      sub.shippingAddress = {
        ...sub.shippingAddress,
        ...shippingAddress,
        postcode: pc.normalizedPostcode,
      };
    }
    if (paymentLast4) {
      sub.paymentLast4 = String(paymentLast4).slice(-4);
    }

    db.save();
    res.json(sub);
  });

  // Newsletter & Contact
  app.post('/api/newsletter', (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }
    const state = db.getState();
    if (!state.marketing.newsletterSubscribers.some((s) => s.email === email)) {
      state.marketing.newsletterSubscribers.unshift({ email, subscribedAt: new Date().toISOString() });
      db.save();
    }
    res.status(201).json({ ok: true });
  });

  app.post('/api/contact', (req, res) => {
    const { name, email, postcode, subject, message } = req.body || {};
    if (!name || !email || !message) {
      res.status(400).json({ error: 'Name, email, and message are required.' });
      return;
    }
    const state = db.getState();
    state.marketing.contactMessages.unshift({
      id: `msg-${crypto.randomUUID().slice(0, 8)}`,
      name: String(name).trim(),
      email: String(email).trim(),
      postcode: postcode ? String(postcode).trim().toUpperCase() : undefined,
      subject: String(subject || 'General Enquiry').trim(),
      message: String(message).trim(),
      createdAt: new Date().toISOString(),
    });
    db.save();
    res.status(201).json({ ok: true });
  });

  // ---------------- ADMIN ENDPOINTS ----------------
  app.get('/api/admin/overview', requireAdmin, (_req, res) => {
    const state = db.getState();
    res.json({
      brands: state.brands,
      products: state.products,
      orders: state.orders,
      subscriptions: state.subscriptions,
      deliveryZones: state.deliveryZones,
      discountCodes: state.discountCodes,
      marketing: state.marketing,
      customers: state.users.filter((u) => u.role === 'customer').map(sanitizeUser),
    });
  });

  // Admin Products CRUD
  app.post('/api/admin/products', requireAdmin, (req, res) => {
    const state = db.getState();
    const body = req.body || {};
    const slugBase = String(body.name || 'water-case')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const product = {
      id: `prod-${crypto.randomUUID().slice(0, 8)}`,
      slug: `${slugBase}-${Math.floor(Math.random() * 900 + 100)}`,
      brandId: String(body.brandId || state.brands[0]?.id),
      name: String(body.name || 'New Water Pack'),
      subtitle: String(body.subtitle || 'Case of 12'),
      description: String(body.description || ''),
      waterType: body.waterType === 'Sparkling' ? 'Sparkling' : 'Still',
      packaging: body.packaging || 'rPET',
      bottleSizeMl: Number(body.bottleSizeMl || 750),
      bottleSizeLabel: String(body.bottleSizeLabel || '750ml'),
      packQuantity: Number(body.packQuantity || 12),
      priceGbp: Number(body.priceGbp || 24),
      compareAtPriceGbp: body.compareAtPriceGbp ? Number(body.compareAtPriceGbp) : undefined,
      subscriptionDiscountPct: Number(body.subscriptionDiscountPct ?? 10),
      sku: String(body.sku || `SH-NEW-${Date.now().toString().slice(-4)}`),
      stock: Number(body.stock ?? 50),
      isBestSeller: Boolean(body.isBestSeller),
      isFeatured: Boolean(body.isFeatured),
      bottleStyle: body.bottleStyle || 'evian_pet',
      capColor: String(body.capColor || '#CBD5E1'),
      tintColor: String(body.tintColor || '#E5F2F8'),
      labelAccent: String(body.labelAccent || '#0F5C6E'),
      active: body.active !== false,
    };
    state.products.unshift(product as any);
    db.save();
    res.status(201).json(product);
  });

  app.patch('/api/admin/products/:id', requireAdmin, (req, res) => {
    const state = db.getState();
    const prod = state.products.find((p) => p.id === req.params.id);
    if (!prod) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    Object.assign(prod, req.body);
    db.save();
    res.json(prod);
  });

  app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
    const state = db.getState();
    state.products = state.products.filter((p) => p.id !== req.params.id);
    db.save();
    res.json({ ok: true });
  });

  // Admin Brands CRUD
  app.post('/api/admin/brands', requireAdmin, (req, res) => {
    const state = db.getState();
    const body = req.body || {};
    const slug = String(body.name || 'new-spring')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const brand = {
      id: `brand-${crypto.randomUUID().slice(0, 8)}`,
      slug,
      name: String(body.name || 'New Spring'),
      country: String(body.country || 'United Kingdom'),
      region: String(body.region || 'Highlands'),
      sourceName: String(body.sourceName || 'Protected Spring'),
      coordinates: body.coordinates || { lat: 56.0, lng: -4.0 },
      elevation: String(body.elevation || '350m'),
      filtrationProcess: String(body.filtrationProcess || 'Natural mineral rock filtration'),
      tagline: String(body.tagline || 'Pure natural spring water.'),
      description: String(body.description || ''),
      geologicalStory: String(body.geologicalStory || ''),
      mineralProfile: body.mineralProfile || { ph: 7.5, tds: 150 },
      heroImage: String(body.heroImage || '/src/assets/images/brand_highland_ochil_1795175837115.jpg'),
      scenePreset: body.scenePreset || 'alpine_generic',
      accentHex: String(body.accentHex || '#0F5C6E'),
      markers: body.markers || [
        {
          id: `${slug}-spring`,
          title: String(body.sourceName || 'Natural Spring'),
          subtitle: 'Protected Catchment',
          description: String(body.geologicalStory || 'Naturally filtered spring source.'),
          elevationLabel: String(body.elevation || '350m'),
          position: [0, 1.5, 0],
          cameraOffset: [5, 4, 6],
        },
      ],
      active: body.active !== false,
    };
    state.brands.push(brand as any);
    db.save();
    res.status(201).json(brand);
  });

  app.patch('/api/admin/brands/:id', requireAdmin, (req, res) => {
    const state = db.getState();
    const brand = state.brands.find((b) => b.id === req.params.id);
    if (!brand) {
      res.status(404).json({ error: 'Brand not found' });
      return;
    }
    Object.assign(brand, req.body);
    db.save();
    res.json(brand);
  });

  // Admin Orders
  app.patch('/api/admin/orders/:id', requireAdmin, (req, res) => {
    const state = db.getState();
    const order = state.orders.find((o) => o.id === req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    if (req.body?.status) {
      order.status = req.body.status;
      order.emailLog.push(`${new Date().toISOString()} — Order status updated to ${req.body.status}`);
    }
    if (req.body?.trackingNumber) {
      order.trackingNumber = String(req.body.trackingNumber);
    }
    db.save();
    res.json(order);
  });

  // Admin Delivery Zones
  app.patch('/api/admin/delivery-zones/:id', requireAdmin, (req, res) => {
    const state = db.getState();
    const zone = state.deliveryZones.find((z) => z.id === req.params.id);
    if (!zone) {
      res.status(404).json({ error: 'Delivery zone not found' });
      return;
    }
    Object.assign(zone, req.body);
    db.save();
    res.json(zone);
  });

  // Admin Discount Codes & Marketing
  app.post('/api/admin/discount-codes', requireAdmin, (req, res) => {
    const state = db.getState();
    const { code, type = 'percent', value = 10, minOrderGbp = 0, description = '' } = req.body || {};
    if (!code) {
      res.status(400).json({ error: 'Code is required' });
      return;
    }
    const upper = String(code).trim().toUpperCase();
    const existing = state.discountCodes.find((d) => d.code === upper);
    if (existing) {
      Object.assign(existing, { type, value: Number(value), minOrderGbp: Number(minOrderGbp), description, active: true });
    } else {
      state.discountCodes.push({
        code: upper,
        type,
        value: Number(value),
        minOrderGbp: Number(minOrderGbp),
        active: true,
        description: String(description || `${upper} promotion`),
      });
    }
    db.save();
    res.status(201).json(state.discountCodes);
  });

  app.patch('/api/admin/discount-codes/:code', requireAdmin, (req, res) => {
    const state = db.getState();
    const found = state.discountCodes.find((d) => d.code === req.params.code);
    if (!found) {
      res.status(404).json({ error: 'Code not found' });
      return;
    }
    Object.assign(found, req.body);
    db.save();
    res.json(found);
  });

  app.patch('/api/admin/marketing', requireAdmin, (req, res) => {
    const state = db.getState();
    Object.assign(state.marketing, req.body);
    db.save();
    res.json(state.marketing);
  });

  // Vite or static serving
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`UK Beverages server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
