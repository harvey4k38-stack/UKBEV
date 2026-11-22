export type WaterType = 'Still' | 'Sparkling';
export type PackagingType = 'Glass' | 'rPET' | 'PET' | 'Bag-in-Box' | 'Dispenser';
export type ScenePreset = 'alps' | 'fiji' | 'scotland' | 'iceland' | 'tongariro' | 'alpine_generic';
export type BottleVisualStyle =
  | 'evian_glass'
  | 'evian_pet'
  | 'fiji_square'
  | 'highland_pet'
  | 'highland_glass'
  | 'icelandic_faceted'
  | 'tongariro_pure'
  | 'bulk_box';

export interface MineralProfile {
  ph: number;
  tds: number;
  calcium?: number;
  magnesium?: number;
  bicarbonate?: number;
  silica?: number;
  sodium?: number;
  potassium?: number;
  sulphate?: number;
  chloride?: number;
  nitrate?: number;
  notes?: string;
}

export interface BrandMarker {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  elevationLabel: string;
  position: [number, number, number];
  cameraOffset: [number, number, number];
}

export interface Brand {
  id: string;
  slug: string;
  name: string;
  country: string;
  region: string;
  sourceName: string;
  coordinates: { lat: number; lng: number };
  elevation: string;
  filtrationProcess: string;
  tagline: string;
  description: string;
  geologicalStory: string;
  accuracyNote?: string;
  mineralProfile: MineralProfile;
  heroImage: string;
  scenePreset: ScenePreset;
  accentHex: string;
  markers: BrandMarker[];
  active: boolean;
}

export interface Product {
  id: string;
  slug: string;
  brandId: string;
  name: string;
  subtitle: string;
  description: string;
  waterType: WaterType;
  packaging: PackagingType;
  bottleSizeMl: number;
  bottleSizeLabel: string;
  packQuantity: number;
  priceGbp: number;
  compareAtPriceGbp?: number;
  subscriptionDiscountPct: number;
  sku: string;
  stock: number;
  isBestSeller: boolean;
  isFeatured: boolean;
  bottleStyle: BottleVisualStyle;
  capColor: string;
  tintColor: string;
  labelAccent: string;
  /** Real product photo (optional). Falls back to the illustrated bottle when absent. */
  imageUrl?: string;
  active: boolean;
}

export interface DeliveryZone {
  id: string;
  name: string;
  description: string;
  prefixes: string[];
  excludedPrefixes: string[];
  feeGbp: number;
  expressFeeGbp: number;
  freeThresholdGbp: number;
  minOrderGbp: number;
  estimatedDays: string;
  expressDays: string;
  active: boolean;
}

export interface DiscountCode {
  code: string;
  type: 'percent' | 'fixed' | 'free_shipping';
  value: number;
  minOrderGbp: number;
  active: boolean;
  description: string;
}

export interface Address {
  id: string;
  label: string;
  recipient: string;
  line1: string;
  line2?: string;
  city: string;
  county?: string;
  postcode: string;
  phone: string;
  isDefault?: boolean;
}

export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expiry: string;
  holderName: string;
  isDefault?: boolean;
}

export interface UserPublic {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'customer' | 'admin';
  addresses: Address[];
  paymentMethods: PaymentMethod[];
  createdAt: string;
}

export interface CartItemInput {
  productId: string;
  quantity: number;
  purchaseMode: 'once' | 'subscribe';
  frequency?: 'weekly' | 'fortnightly' | 'monthly';
}

export interface OrderItem {
  productId: string;
  sku: string;
  name: string;
  brandName: string;
  bottleSizeLabel: string;
  packQuantity: number;
  quantity: number;
  unitPriceGbp: number;
  lineTotalGbp: number;
  purchaseMode: 'once' | 'subscribe';
  frequency?: 'weekly' | 'fortnightly' | 'monthly';
  bottleStyle: BottleVisualStyle;
  capColor: string;
  tintColor: string;
  labelAccent: string;
}

export type OrderStatus =
  | 'Awaiting Payment'
  | 'Confirmed'
  | 'Picking'
  | 'Dispatched'
  | 'Delivered'
  | 'Refunded'
  | 'Cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  customerEmail: string;
  customerName: string;
  phone: string;
  shippingAddress: Omit<Address, 'id' | 'label' | 'isDefault'>;
  deliveryZoneId: string;
  deliveryZoneName: string;
  deliveryMethod: 'standard' | 'express';
  items: OrderItem[];
  subtotalGbp: number;
  discountCode?: string;
  discountGbp: number;
  shippingGbp: number;
  vatIncludedGbp: number;
  totalGbp: number;
  paymentMethod: 'card' | 'apple_pay' | 'google_pay' | 'klarna_uk' | 'link' | 'demo';
  paymentLast4: string;
  /** Stripe Checkout session backing this order (when paid via Stripe). */
  stripeSessionId?: string;
  status: OrderStatus;
  trackingNumber: string;
  carrier: string;
  estimatedDelivery: string;
  createdAt: string;
  emailLog: string[];
}

export type SubscriptionFrequency = 'weekly' | 'fortnightly' | 'monthly';
export type SubscriptionStatus = 'Active' | 'Paused' | 'Cancelled';

export interface Subscription {
  id: string;
  userId?: string;
  customerEmail: string;
  customerName: string;
  productId: string;
  productName: string;
  brandName: string;
  bottleSizeLabel: string;
  packQuantity: number;
  frequency: SubscriptionFrequency;
  quantity: number;
  unitPriceGbp: number;
  status: SubscriptionStatus;
  nextDeliveryDate: string;
  shippingAddress: Omit<Address, 'id' | 'label' | 'isDefault'>;
  paymentLast4: string;
  createdAt: string;
}

export interface CompanySettings {
  legalName: string;
  tradingName: string;
  companyNumber: string;
  vatNumber: string;
  address: string;
  supportEmail: string;
  supportPhone: string;
}

export interface MarketingConfig {
  bannerEnabled: boolean;
  bannerText: string;
  bannerLink: string;
  featuredProductIds: string[];
  newsletterSubscribers: { email: string; subscribedAt: string }[];
  contactMessages: {
    id: string;
    name: string;
    email: string;
    postcode?: string;
    subject: string;
    message: string;
    createdAt: string;
  }[];
  companySettings: CompanySettings;
}

export interface PostcodeCheckResult {
  valid: boolean;
  deliverable: boolean;
  normalizedPostcode: string;
  zone?: DeliveryZone;
  reason?: string;
}
