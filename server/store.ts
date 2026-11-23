import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type {
  Brand,
  DeliveryZone,
  DiscountCode,
  MarketingConfig,
  Order,
  Product,
  Subscription,
  UserPublic,
} from '../src/types.ts';

export interface StoredUser extends UserPublic {
  passwordHash: string;
}

export interface DatabaseState {
  brands: Brand[];
  products: Product[];
  deliveryZones: DeliveryZone[];
  discountCodes: DiscountCode[];
  users: StoredUser[];
  orders: Order[];
  subscriptions: Subscription[];
  marketing: MarketingConfig;
  /** One-off data migrations already applied to this database. */
  appliedMigrations?: string[];
}

// DATA_DIR lets hosting point the JSON store at a persistent volume (e.g. Railway volume at /data)
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(process.cwd(), 'data'));
const DB_FILE = path.join(DATA_DIR, 'store.json');

export function hashPassword(password: string, existingSalt?: string): string {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(derived, 'hex'));
}

function createInitialState(): DatabaseState {
  const brands: Brand[] = [
    {
      id: 'brand-evian',
      slug: 'evian',
      name: 'Evian',
      country: 'France',
      region: 'Évian-les-Bains, French Alps',
      sourceName: 'Cachat Spring',
      coordinates: { lat: 46.4008, lng: 6.5903 },
      elevation: '480m – 850m (Plateau of Gavot)',
      filtrationProcess: 'Over 15 years through glacial Alpine sand and clay moraines',
      tagline: 'Born of Alpine rain and snowmelt, naturally filtered over fifteen years.',
      description:
        'Evian natural mineral water begins as rain and melting snow on the peaks of the French Alps, filtering slowly through the mineral-rich glacial geology of the Plateau of Gavot before emerging at Cachat Spring in Évian-les-Bains.',
      geologicalStory:
        'Protected beneath layers of impervious clay, the confined glacial sand aquifer shields the water from surface contaminants while imparting a balanced mineral profile of calcium (80 mg/L), magnesium (26 mg/L), and bicarbonates (360 mg/L) at neutral pH 7.2.',
      mineralProfile: {
        ph: 7.2,
        tds: 345,
        calcium: 80,
        magnesium: 26,
        bicarbonate: 360,
        silica: 15,
        sodium: 6.5,
        potassium: 1,
        sulphate: 14,
        chloride: 10,
        notes: 'Dry residue at 180°C: ~345 mg/L. Balanced Alpine mineralisation.',
      },
      heroImage: '/src/assets/images/brand_evian_alps_1795175836809.jpg',
      scenePreset: 'alps',
      accentHex: '#D15B78',
      markers: [
        {
          id: 'evian-peaks',
          title: 'Chablais Alpine Peaks',
          subtitle: 'Precipitation Catchment Zone',
          description:
            'Winter snowmelt and mountain rainfall collect high across the French Alpine slopes above Lake Geneva.',
          elevationLabel: '2,200 m',
          position: [-8, 5.6, -6],
          cameraOffset: [-4, 8, 5],
        },
        {
          id: 'evian-gavot',
          title: 'Plateau of Gavot',
          subtitle: '15-Year Glacial Moraine Filtration',
          description:
            'Water percolates downward through ancient glacial sand and gravel deposits sealed between protective Alpine clay strata.',
          elevationLabel: '780 m',
          position: [-1.5, 2.4, -1],
          cameraOffset: [4, 5, 8],
        },
        {
          id: 'evian-cachat',
          title: 'Cachat Spring',
          subtitle: 'Évian-les-Bains Emergence',
          description:
            'Naturally pressurised mineral water emerges at a steady 11.6°C in Évian-les-Bains with consistent mineral balance.',
          elevationLabel: '480 m',
          position: [4.5, 0.7, 3.5],
          cameraOffset: [9, 3.8, 9],
        },
      ],
      active: true,
    },
    {
      id: 'brand-fiji',
      slug: 'fiji-water',
      name: 'FIJI Water',
      country: 'Fiji',
      region: 'Yaqara Valley, Viti Levu',
      sourceName: 'Yaqara Artesian Aquifer',
      coordinates: { lat: -17.4333, lng: 177.9833 },
      elevation: 'Rainforest catchment to deep volcanic aquifer',
      filtrationProcess: 'Filtered slowly through ancient volcanic rock layers into a confined artesian aquifer',
      tagline: 'Protected artesian water from the volcanic rainforests of Viti Levu.',
      description:
        'Bottled at the source in the remote Yaqara Valley on Viti Levu, Fiji, FIJI Water is drawn from a sustainable underground artesian aquifer shielded by ancient volcanic rock formations.',
      geologicalStory:
        'Tropical rains fall on the pristine upland rainforest ridges of Viti Levu and filter through volcanic strata rich in silica (93 mg/L), accumulating natural electrolytes before settling under natural artesian pressure far beneath the valley floor.',
      mineralProfile: {
        ph: 7.7,
        tds: 222,
        silica: 93,
        bicarbonate: 153,
        calcium: 18,
        sodium: 18,
        magnesium: 15,
        chloride: 9,
        potassium: 5,
        sulphate: 1,
        notes: 'Naturally high silica content (93 mg/L) gives a characteristically soft mouthfeel.',
      },
      heroImage: '/src/assets/images/brand_fiji_rainforest_1795175837391.jpg',
      scenePreset: 'fiji',
      accentHex: '#18759C',
      markers: [
        {
          id: 'fiji-ridge',
          title: 'Nakauvadra Volcanic Ridges',
          subtitle: 'Tropical Rainforest Catchment',
          description:
            'Dense tropical canopy captures Pacific trade-wind rainfall over untouched volcanic highlands.',
          elevationLabel: '840 m',
          position: [-6.5, 4.8, -5.5],
          cameraOffset: [-2, 7, 5],
        },
        {
          id: 'fiji-valley',
          title: 'Yaqara Valley Canopy',
          subtitle: 'Natural Percolation Zone',
          description:
            'Rainwater descends through porous tropical basalt, picking up natural silica and trace electrolytes.',
          elevationLabel: '160 m',
          position: [0.5, 1.3, 0.5],
          cameraOffset: [6, 4.5, 7],
        },
        {
          id: 'fiji-aquifer',
          title: 'Confined Artesian Aquifer',
          subtitle: 'Subsurface Volcanic Chamber',
          description:
            'Sealed beneath dense confining rock, natural artesian pressure brings the water to the bottling source untouched by open air.',
          elevationLabel: '-150 m',
          position: [4.2, -1.2, 3.8],
          cameraOffset: [9, 2.2, 10],
        },
      ],
      active: true,
    },
    {
      id: 'brand-highland-spring',
      slug: 'highland-spring',
      name: 'Highland Spring',
      country: 'Scotland, UK',
      region: 'Ochil Hills, Perthshire',
      sourceName: 'Blackford Protected Catchment',
      coordinates: { lat: 56.2561, lng: -3.7764 },
      elevation: 'Ochil Hills Catchment (up to 721m)',
      filtrationProcess: 'Drawn through ancient volcanic basalt and Old Red Sandstone strata',
      tagline: 'Drawn from protected land in the Ochil Hills of Perthshire, Scotland.',
      description:
        'Highland Spring is drawn from a strictly protected, organic-certified catchment area spanning over 2,500 acres in the Ochil Hills of Perthshire, Scotland.',
      geologicalStory:
        'Scottish rainfall filters gently down through heather-clad moorland and ancient volcanic rock formations, emerging with a clean, lightly mineralised profile (TDS ~170 mg/L, pH 7.8) suited for everyday hydration and dining.',
      mineralProfile: {
        ph: 7.8,
        tds: 170,
        bicarbonate: 150,
        calcium: 40.5,
        magnesium: 10.1,
        chloride: 6.1,
        sodium: 5.6,
        sulphate: 5.3,
        nitrate: 3.1,
        potassium: 0.7,
        notes: 'Still water pH ~7.8; Sparkling variant pH 4–5 due to carbonation.',
      },
      heroImage: '/src/assets/images/brand_highland_ochil_1795175837115.jpg',
      scenePreset: 'scotland',
      accentHex: '#4F3D7A',
      markers: [
        {
          id: 'ochil-moor',
          title: 'Ochil Hills Moorland',
          subtitle: 'Protected Organic Catchment',
          description:
            'Over 2,500 acres of sheltered Scottish hillside free from intensive agriculture or industrial runoff.',
          elevationLabel: '590 m',
          position: [-6, 3.8, -5],
          cameraOffset: [-2, 6, 4.5],
        },
        {
          id: 'ochil-burn',
          title: 'Perthshire Burn & Strata',
          subtitle: 'Basalt & Sandstone Filtration',
          description:
            'Rainwater travels slowly downward through fractured volcanic basalt and Old Red Sandstone layers.',
          elevationLabel: '240 m',
          position: [0.5, 1.4, 0.8],
          cameraOffset: [5.5, 4.2, 6.8],
        },
        {
          id: 'blackford-spring',
          title: 'Blackford Natural Spring',
          subtitle: 'Perthshire Source',
          description:
            'Lightly mineralised Scottish spring water captured directly at the Blackford source for UK distribution.',
          elevationLabel: '125 m',
          position: [5, 0.5, 3.6],
          cameraOffset: [9.5, 3.4, 8.5],
        },
      ],
      active: true,
    },
    {
      id: 'brand-icelandic-glacial',
      slug: 'icelandic-glacial',
      name: 'Icelandic Glacial',
      country: 'Iceland',
      region: 'Hlíðarendi, Ölfus, Southwest Iceland',
      sourceName: 'Ölfus Spring',
      coordinates: { lat: 63.9495, lng: -21.1516 },
      elevation: 'Underground Ölfus Spring (128,000-acre exclusion zone)',
      filtrationProcess: 'Rainfall and snowmelt filtered naturally through porous volcanic lava rock',
      tagline: 'Naturally alkaline pH 8.4 spring water from the underground Ölfus Spring.',
      description:
        'Icelandic Glacial is sourced from the subterranean Ölfus Spring in southwest Iceland—a vast, constantly replenished underground spring formed over 5,000 years ago and surrounded by a 128,000-acre protected exclusion zone.',
      geologicalStory:
        'Precipitation and snowmelt across southwest Iceland percolate slowly downward through layers of porous black volcanic lava rock into the underground Ölfus Spring. This slow volcanic filtration yields exceptionally soft, ultra-low-mineral water (TDS 62 mg/L) with a naturally alkaline pH of 8.4.',
      accuracyNote:
        'Sourced strictly from the underground Ölfus Spring via natural lava-rock filtration of rainfall and snowmelt—never extracted directly from a glacier.',
      mineralProfile: {
        ph: 8.4,
        tds: 62,
        silica: 56,
        bicarbonate: 42,
        sodium: 11,
        calcium: 5.6,
        sulphate: 3,
        chloride: 2,
        magnesium: 1.5,
        potassium: 0.3,
        notes: 'Naturally alkaline pH 8.4 with exceptionally low total dissolved solids (62 mg/L).',
      },
      heroImage: '/src/assets/images/brand_iceland_olfus_1795175837928.jpg',
      scenePreset: 'iceland',
      accentHex: '#2B6E8C',
      markers: [
        {
          id: 'iceland-highlands',
          title: 'Surrounding Highlands & Glaciers',
          subtitle: 'Regional Snowmelt & Rainfall Origin',
          description:
            'Regional snowmelt and North Atlantic rain fall across surrounding Icelandic mountains and seep downward into porous basalt.',
          elevationLabel: '1,100 m',
          position: [-7.5, 4.9, -6.5],
          cameraOffset: [-3, 7.5, 4],
        },
        {
          id: 'iceland-lava',
          title: 'Porous Volcanic Lava Field',
          subtitle: 'Natural Basalt Filtration Matrix',
          description:
            'Water filters gradually through ancient fractured lava rock and moss-covered basalt, naturally purifying without chemical intervention.',
          elevationLabel: '180 m',
          position: [-0.8, 1.3, 0.2],
          cameraOffset: [4.5, 4.2, 6.8],
        },
        {
          id: 'iceland-olfus',
          title: 'Underground Ölfus Spring',
          subtitle: 'Subterranean Alkaline Reservoir (pH 8.4)',
          description:
            'The protected underground Ölfus Spring continuously replenishes with naturally alkaline (pH 8.4), ultra-soft water (TDS 62 mg/L).',
          elevationLabel: '-45 m',
          position: [4.6, -1.1, 3.6],
          cameraOffset: [9.5, 2.4, 9.5],
        },
      ],
      active: true,
    },
    {
      id: 'brand-tongariro',
      slug: 'tongariro',
      name: 'Tongariro Natural Spring Water',
      country: 'New Zealand',
      region: 'Tongariro National Park Foothills, Central North Island',
      sourceName: 'Tongariro High-Altitude Aquifer',
      coordinates: { lat: -39.2008, lng: 175.5625 },
      elevation: '738m above sea level',
      filtrationProcess: 'Naturally filtered through ancient volcanic basalt and blue rock strata',
      tagline: 'Silica-rich volcanic spring water from 738m in New Zealand’s Central North Island.',
      description:
        'Sourced from a deep underground aquifer situated 738 metres above sea level in the foothills of Tongariro National Park—a UNESCO Dual World Heritage Area in New Zealand’s central North Island.',
      geologicalStory:
        'Alpine precipitation filters slowly through ancient volcanic basalt and blue rock layers beneath the Tongariro plateau, emerging naturally balanced (pH ~7.4, TDS 150 mg/L) with a notably crisp silica signature of 59.5 mg/L.',
      accuracyNote:
        'Sourced in the Tongariro National Park foothills, central North Island, New Zealand.',
      mineralProfile: {
        ph: 7.4,
        tds: 150,
        silica: 59.5,
        bicarbonate: 117,
        calcium: 15.2,
        sodium: 12.8,
        magnesium: 6.5,
        notes: 'High natural silica (59.5 mg/L) with clean volcanic basalt mineralisation.',
      },
      heroImage: '/src/assets/images/brand_tongariro_nz_1795175837007.jpg',
      scenePreset: 'tongariro',
      accentHex: '#8C6239',
      markers: [
        {
          id: 'tongariro-cone',
          title: 'Tongariro Volcanic Peaks',
          subtitle: 'UNESCO Dual World Heritage Catchment',
          description:
            'Alpine snow and rain fall across New Zealand’s central North Island volcanic massif.',
          elevationLabel: '2,291 m',
          position: [-6.5, 5.8, -5.5],
          cameraOffset: [-2, 8.2, 5.5],
        },
        {
          id: 'tongariro-tussock',
          title: 'Volcanic Basalt & Blue Rock',
          subtitle: 'Deep Natural Filtration',
          description:
            'Water descends through dense layers of volcanic basalt and blue rock, dissolving 59.5 mg/L of natural silica.',
          elevationLabel: '920 m',
          position: [-0.5, 2.0, -0.2],
          cameraOffset: [5, 4.6, 7],
        },
        {
          id: 'tongariro-aquifer',
          title: '738m Underground Aquifer',
          subtitle: 'Central North Island Bore',
          description:
            'Drawn from a deep confined aquifer 738 metres above sea level with pH ~7.4 and TDS 150 mg/L.',
          elevationLabel: '738 m',
          position: [4.5, -1.0, 3.8],
          cameraOffset: [9.5, 2.4, 9.5],
        },
      ],
      active: true,
    },
  ];

  const products: Product[] = [
    {
      id: 'prod-evian-750-glass',
      slug: 'evian-750ml-glass-case-12',
      brandId: 'brand-evian',
      name: 'Evian Natural Mineral Water – 750ml Glass',
      subtitle: 'Case of 12 · Flint Glass Table Bottles',
      description:
        'Evian’s signature 750ml flint glass table bottles, ideal for dining tables and home hospitality. Filled at Cachat Spring in Évian-les-Bains with zero chemical treatment.',
      waterType: 'Still',
      packaging: 'Glass',
      bottleSizeMl: 750,
      bottleSizeLabel: '750ml',
      packQuantity: 12,
      priceGbp: 27.6,
      subscriptionDiscountPct: 12,
      sku: 'SH-EVI-750GL-12',
      stock: 84,
      isBestSeller: true,
      isFeatured: true,
      bottleStyle: 'evian_glass',
      capColor: '#D4D9DF',
      tintColor: '#E8F3F7',
      labelAccent: '#D15B78',
      active: false,
    },
    {
      id: 'prod-evian-500-pet',
      slug: 'evian-500ml-rpet-case-24',
      brandId: 'brand-evian',
      name: 'Evian Natural Mineral Water – 500ml',
      subtitle: 'Case of 24 · 100% rPET Bottles',
      description:
        'Everyday 500ml Evian bottles crafted from 100% recycled rPET plastic (excluding cap and label). Balanced Alpine mineral profile at neutral pH 7.2.',
      waterType: 'Still',
      packaging: 'rPET',
      bottleSizeMl: 500,
      bottleSizeLabel: '500ml',
      packQuantity: 24,
      priceGbp: 7.00,
      subscriptionDiscountPct: 10,
      sku: 'SH-EVI-500PET-24',
      stock: 140,
      isBestSeller: true,
      isFeatured: false,
      bottleStyle: 'evian_pet',
      capColor: '#D15B78',
      tintColor: '#EEF6FA',
      labelAccent: '#D15B78',
      active: true,
    },
    {
      id: 'prod-evian-1500-pet',
      slug: 'evian-1500ml-rpet-case-12',
      brandId: 'brand-evian',
      name: 'Evian Natural Mineral Water – 1.5 Litre',
      subtitle: 'Case of 12 · Family & Kitchen Format',
      description:
        'Twelve generous 1.5 Litre bottles of Evian natural mineral water for household hydration, culinary use, and weekly family deliveries.',
      waterType: 'Still',
      packaging: 'rPET',
      bottleSizeMl: 1500,
      bottleSizeLabel: '1.5L',
      packQuantity: 12,
      priceGbp: 7.50,
      subscriptionDiscountPct: 12,
      sku: 'SH-EVI-1500PET-12',
      stock: 96,
      isBestSeller: false,
      isFeatured: false,
      bottleStyle: 'evian_pet',
      capColor: '#D15B78',
      tintColor: '#EEF6FA',
      labelAccent: '#D15B78',
      active: true,
    },
    {
      id: 'prod-fiji-500-pet',
      slug: 'fiji-water-500ml-case-24',
      brandId: 'brand-fiji',
      name: 'FIJI Natural Artesian Water – 500ml',
      subtitle: 'Case of 24 · Iconic Square Bottle',
      description:
        'Bottled at the source in Viti Levu, Fiji, in FIJI Water’s signature square bottle. Soft mouthfeel with 93 mg/L of naturally occurring volcanic silica.',
      waterType: 'Still',
      packaging: 'rPET',
      bottleSizeMl: 500,
      bottleSizeLabel: '500ml',
      packQuantity: 24,
      priceGbp: 8.00,
      subscriptionDiscountPct: 12,
      sku: 'SH-FIJ-500PET-24',
      stock: 72,
      isBestSeller: true,
      isFeatured: true,
      bottleStyle: 'fiji_square',
      capColor: '#133C55',
      tintColor: '#E5F2F8',
      labelAccent: '#18759C',
      active: true,
    },
    {
      id: 'prod-fiji-1000-pet',
      slug: 'fiji-water-1000ml-case-12',
      brandId: 'brand-fiji',
      name: 'FIJI Natural Artesian Water – 1 Litre',
      subtitle: 'Case of 12 · Studio & Desk Format',
      description:
        'Twelve 1 Litre square bottles of FIJI Natural Artesian Water. Naturally occurring electrolytes and a smooth pH 7.7 finish.',
      waterType: 'Still',
      packaging: 'rPET',
      bottleSizeMl: 1000,
      bottleSizeLabel: '1L',
      packQuantity: 12,
      priceGbp: 7.50,
      subscriptionDiscountPct: 12,
      sku: 'SH-FIJ-1000PET-12',
      stock: 58,
      isBestSeller: false,
      isFeatured: false,
      bottleStyle: 'fiji_square',
      capColor: '#133C55',
      tintColor: '#E5F2F8',
      labelAccent: '#18759C',
      active: true,
    },
    {
      id: 'prod-fiji-330-pet',
      slug: 'fiji-water-330ml-case-36',
      brandId: 'brand-fiji',
      name: 'FIJI Natural Artesian Water – 330ml',
      subtitle: 'Case of 36 · Compact Hospitality Pack',
      description:
        'Thirty-six compact 330ml square bottles suited for guest reception, home entertaining, and travel.',
      waterType: 'Still',
      packaging: 'rPET',
      bottleSizeMl: 330,
      bottleSizeLabel: '330ml',
      packQuantity: 36,
      priceGbp: 8.00,
      subscriptionDiscountPct: 10,
      sku: 'SH-FIJ-330PET-36',
      stock: 44,
      isBestSeller: false,
      isFeatured: false,
      bottleStyle: 'fiji_square',
      capColor: '#133C55',
      tintColor: '#E5F2F8',
      labelAccent: '#18759C',
      active: true,
    },
    {
      id: 'prod-highland-750-glass-still',
      slug: 'highland-spring-still-750ml-glass-12',
      brandId: 'brand-highland-spring',
      name: 'Highland Spring Still – 750ml Glass',
      subtitle: 'Case of 12 · Scottish Table Glass',
      description:
        'Pure Scottish spring water drawn from the Ochil Hills in Perthshire and presented in recyclable 750ml glass bottles for dining.',
      waterType: 'Still',
      packaging: 'Glass',
      bottleSizeMl: 750,
      bottleSizeLabel: '750ml',
      packQuantity: 12,
      priceGbp: 21.6,
      subscriptionDiscountPct: 10,
      sku: 'SH-HIG-750GLS-12',
      stock: 112,
      isBestSeller: false,
      isFeatured: false,
      bottleStyle: 'highland_glass',
      capColor: '#4F3D7A',
      tintColor: '#EAF2F5',
      labelAccent: '#4F3D7A',
      active: false,
    },
    {
      id: 'prod-highland-750-glass-sparkling',
      slug: 'highland-spring-sparkling-750ml-glass-12',
      brandId: 'brand-highland-spring',
      name: 'Highland Spring Sparkling – 750ml Glass',
      subtitle: 'Case of 12 · Crisp Effervescent Glass',
      description:
        'Lightly carbonated Scottish spring water with fine, lively bubbles in 750ml emerald-tinted glass bottles.',
      waterType: 'Sparkling',
      packaging: 'Glass',
      bottleSizeMl: 750,
      bottleSizeLabel: '750ml',
      packQuantity: 12,
      priceGbp: 22.8,
      subscriptionDiscountPct: 10,
      sku: 'SH-HIG-750GLK-12',
      stock: 90,
      isBestSeller: true,
      isFeatured: true,
      bottleStyle: 'highland_glass',
      capColor: '#1F5C49',
      tintColor: '#C4E0D2',
      labelAccent: '#1F5C49',
      active: false,
    },
    {
      id: 'prod-highland-500-pet-sparkling',
      slug: 'highland-spring-sparkling-500ml-case-24',
      brandId: 'brand-highland-spring',
      name: 'Highland Spring Sparkling – 500ml',
      subtitle: 'Case of 24 · Everyday Sparkling',
      description:
        'Twenty-four 500ml bottles of briskly carbonated Highland Spring sparkling water from the Ochil Hills, Scotland.',
      waterType: 'Sparkling',
      packaging: 'rPET',
      bottleSizeMl: 500,
      bottleSizeLabel: '500ml',
      packQuantity: 24,
      priceGbp: 6.50,
      subscriptionDiscountPct: 10,
      sku: 'SH-HIG-500PETK-24',
      stock: 165,
      isBestSeller: false,
      isFeatured: false,
      bottleStyle: 'highland_pet',
      capColor: '#1F5C49',
      tintColor: '#DFF1E8',
      labelAccent: '#1F5C49',
      active: true,
    },
    {
      id: 'prod-icelandic-500-still',
      slug: 'icelandic-glacial-500ml-still-case-24',
      brandId: 'brand-icelandic-glacial',
      name: 'Icelandic Glacial Still – 500ml',
      subtitle: 'Case of 24 · Naturally Alkaline pH 8.4',
      description:
        'Drawn from the underground Ölfus Spring in southwest Iceland. Ultra-low mineral content (TDS 62 mg/L) and naturally alkaline pH 8.4 in faceted rPET bottles.',
      waterType: 'Still',
      packaging: 'rPET',
      bottleSizeMl: 500,
      bottleSizeLabel: '500ml',
      packQuantity: 24,
      priceGbp: 7.50,
      subscriptionDiscountPct: 12,
      sku: 'SH-ICE-500PET-24',
      stock: 68,
      isBestSeller: true,
      isFeatured: true,
      bottleStyle: 'icelandic_faceted',
      capColor: '#CBD5E1',
      tintColor: '#E1F2FA',
      labelAccent: '#2B6E8C',
      active: true,
    },
    {
      id: 'prod-icelandic-1000-still',
      slug: 'icelandic-glacial-1000ml-still-case-12',
      brandId: 'brand-icelandic-glacial',
      name: 'Icelandic Glacial Still – 1 Litre',
      subtitle: 'Case of 12 · Faceted Glacial Silhouette',
      description:
        'Twelve 1 Litre faceted bottles of Icelandic Glacial spring water from Ölfus Spring, offering clean, crisp, naturally alkaline hydration.',
      waterType: 'Still',
      packaging: 'rPET',
      bottleSizeMl: 1000,
      bottleSizeLabel: '1L',
      packQuantity: 12,
      priceGbp: 7.50,
      subscriptionDiscountPct: 12,
      sku: 'SH-ICE-1000PET-12',
      stock: 52,
      isBestSeller: false,
      isFeatured: false,
      bottleStyle: 'icelandic_faceted',
      capColor: '#CBD5E1',
      tintColor: '#E1F2FA',
      labelAccent: '#2B6E8C',
      active: true,
    },
    {
      id: 'prod-icelandic-750-sparkling-glass',
      slug: 'icelandic-glacial-sparkling-750ml-glass-12',
      brandId: 'brand-icelandic-glacial',
      name: 'Icelandic Glacial Sparkling – 750ml Glass',
      subtitle: 'Case of 12 · Fine Volcanic Carbonation',
      description:
        'Naturally soft Ölfus Spring water delicately carbonated and bottled in heavy glacial-clear 750ml glass for refined dining.',
      waterType: 'Sparkling',
      packaging: 'Glass',
      bottleSizeMl: 750,
      bottleSizeLabel: '750ml',
      packQuantity: 12,
      priceGbp: 33.6,
      subscriptionDiscountPct: 12,
      sku: 'SH-ICE-750GLK-12',
      stock: 39,
      isBestSeller: false,
      isFeatured: true,
      bottleStyle: 'icelandic_faceted',
      capColor: '#1E293B',
      tintColor: '#D6ECF8',
      labelAccent: '#1E3A5F',
      active: false,
    },
    {
      id: 'prod-tongariro-750-still',
      slug: 'tongariro-natural-spring-750ml-case-12',
      brandId: 'brand-tongariro',
      name: 'Tongariro Natural Spring – 750ml',
      subtitle: 'Case of 12 · Active Volcanic Spring',
      description:
        'Sourced 738m above sea level in the Tongariro National Park foothills, New Zealand. High natural silica (59.5 mg/L) in ergonomic 750ml bottles.',
      waterType: 'Still',
      packaging: 'PET',
      bottleSizeMl: 750,
      bottleSizeLabel: '750ml',
      packQuantity: 12,
      priceGbp: 7.00,
      subscriptionDiscountPct: 10,
      sku: 'SH-TON-750PET-12',
      stock: 64,
      isBestSeller: false,
      isFeatured: true,
      bottleStyle: 'tongariro_pure',
      capColor: '#2E3B46',
      tintColor: '#E5EFF2',
      labelAccent: '#8C6239',
      active: true,
    },
    {
      id: 'prod-tongariro-1500-still',
      slug: 'tongariro-natural-spring-1500ml-case-8',
      brandId: 'brand-tongariro',
      name: 'Tongariro Natural Spring – 1.5 Litre',
      subtitle: 'Case of 8 · Volcanic Basalt Filtered',
      description:
        'Eight 1.5 Litre bottles of Tongariro Natural Spring Water, naturally filtered through ancient basalt and blue rock layers in New Zealand.',
      waterType: 'Still',
      packaging: 'PET',
      bottleSizeMl: 1500,
      bottleSizeLabel: '1.5L',
      packQuantity: 8,
      priceGbp: 7.00,
      subscriptionDiscountPct: 10,
      sku: 'SH-TON-1500PET-8',
      stock: 48,
      isBestSeller: false,
      isFeatured: false,
      bottleStyle: 'tongariro_pure',
      capColor: '#2E3B46',
      tintColor: '#E5EFF2',
      labelAccent: '#8C6239',
      active: true,
    },
    {
      id: 'prod-tongariro-10l-bib',
      slug: 'tongariro-natural-spring-10l-bag-in-box',
      brandId: 'brand-tongariro',
      name: 'Tongariro Natural Spring – 10L Bag-in-Box',
      subtitle: 'Pack of 2 (20L Total) · Eco Bulk Countertop',
      description:
        'Eco-conscious 10 Litre bag-in-box format with integrated pouring tap—ideal for home kitchens, studios, and bulk hydration without single-use bottles.',
      waterType: 'Still',
      packaging: 'Bag-in-Box',
      bottleSizeMl: 10000,
      bottleSizeLabel: '10L',
      packQuantity: 2,
      priceGbp: 8.00,
      subscriptionDiscountPct: 15,
      sku: 'SH-TON-10LBIB-2',
      stock: 30,
      isBestSeller: false,
      isFeatured: false,
      bottleStyle: 'bulk_box',
      capColor: '#8C6239',
      tintColor: '#DCE8EC',
      labelAccent: '#8C6239',
      active: false,
    },
  ];

  const deliveryZones: DeliveryZone[] = [
    {
      id: 'zone-london-se',
      name: 'London & South East',
      description: 'Greater London, Surrey, Kent, Essex, Sussex, Berkshire, Hertfordshire & Buckinghamshire.',
      prefixes: [
        'E', 'EC', 'N', 'NW', 'SE', 'SW', 'W', 'WC',
        'BR', 'CR', 'DA', 'EN', 'HA', 'IG', 'KT', 'RM', 'SM', 'TW', 'UB',
        'GU', 'ME', 'CT', 'TN', 'BN', 'RH', 'SL', 'RG', 'HP', 'AL', 'WD', 'CM', 'SS',
      ],
      excludedPrefixes: [],
      feeGbp: 4.95,
      expressFeeGbp: 8.95,
      freeThresholdGbp: 45,
      minOrderGbp: 15,
      estimatedDays: '1–2 working days (dispatch Mon–Fri)',
      expressDays: 'Next working day (orders before 14:00)',
      active: true,
    },
    {
      id: 'zone-england-wales',
      name: 'England & Wales Mainland',
      description: 'All mainland England and Wales postcodes outside London & South East.',
      prefixes: [
        'B', 'BA', 'BB', 'BD', 'BH', 'BL', 'BS', 'CA', 'CB', 'CF', 'CH', 'CO', 'CV', 'CW',
        'DE', 'DH', 'DL', 'DN', 'DT', 'DY', 'EX', 'FY', 'GL', 'HD', 'HG', 'HR', 'HU', 'HX',
        'IP', 'L', 'LA', 'LD', 'LE', 'LL', 'LN', 'LS', 'LU', 'M', 'MK', 'NE', 'NG', 'NN', 'NP',
        'NR', 'OL', 'OX', 'PE', 'PL', 'PO', 'PR', 'S', 'SA', 'SG', 'SK', 'SN', 'SO', 'SP',
        'SR', 'ST', 'SY', 'TA', 'TF', 'TQ', 'TR', 'TS', 'WA', 'WF', 'WN', 'WR', 'WS', 'WV', 'YO',
      ],
      excludedPrefixes: ['PO30', 'PO31', 'PO32', 'PO33', 'PO34', 'PO35', 'PO36', 'PO37', 'PO38', 'PO39', 'PO40', 'PO41'],
      feeGbp: 5.95,
      expressFeeGbp: 10.95,
      freeThresholdGbp: 55,
      minOrderGbp: 15,
      estimatedDays: '2–3 working days',
      expressDays: '1–2 working days (tracked courier)',
      active: true,
    },
    {
      id: 'zone-scotland-lowlands',
      name: 'Scottish Lowlands & Central Belt',
      description: 'Edinburgh, Glasgow, Aberdeen, Dundee, Perthshire and mainland Lowlands.',
      prefixes: ['AB', 'DD', 'DG', 'EH', 'FK', 'G', 'KA', 'KY', 'ML', 'PA', 'PH', 'TD'],
      excludedPrefixes: ['PA20', 'PA41', 'PA60', 'PH42', 'PH43', 'PH44', 'KA27', 'KA28'],
      feeGbp: 6.95,
      expressFeeGbp: 12.95,
      freeThresholdGbp: 65,
      minOrderGbp: 20,
      estimatedDays: '2–4 working days',
      expressDays: '1–2 working days',
      active: true,
    },
    {
      id: 'zone-highlands-ni',
      name: 'Scottish Highlands, Islands & Northern Ireland',
      description: 'IV, KW, HS, ZE, BT postcodes and offshore Scottish islands.',
      prefixes: ['IV', 'KW', 'HS', 'ZE', 'BT', 'PA20', 'PA41', 'PA60', 'PH42', 'PH43', 'PH44', 'KA27', 'KA28', 'PO30', 'PO31', 'PO32', 'PO33', 'PO34', 'PO35', 'PO36', 'PO37', 'PO38', 'PO39', 'PO40', 'PO41'],
      excludedPrefixes: [],
      feeGbp: 12.5,
      expressFeeGbp: 19.5,
      freeThresholdGbp: 110,
      minOrderGbp: 25,
      estimatedDays: '3–5 working days',
      expressDays: '2–3 working days',
      active: true,
    },
  ];

  const discountCodes: DiscountCode[] = [
    {
      code: 'WELCOME10',
      type: 'percent',
      value: 10,
      minOrderGbp: 20,
      active: true,
      description: '10% off your first order over £20',
    },
    {
      code: 'HYDRATE15',
      type: 'fixed',
      value: 15,
      minOrderGbp: 80,
      active: true,
      description: '£15 off bulk orders of £80 or more',
    },
    {
      code: 'SPRINGFREE',
      type: 'free_shipping',
      value: 0,
      minOrderGbp: 25,
      active: true,
      description: 'Complimentary standard UK mainland delivery on orders over £25',
    },
  ];

  const demoCustomerId = 'user-claire';
  const adminUserId = 'user-admin';

  const users: StoredUser[] = [
    {
      id: demoCustomerId,
      email: 'claire.bennett@example.co.uk',
      name: 'Claire Bennett',
      phone: '07700 900412',
      role: 'customer',
      passwordHash: hashPassword('SourceHouse2026!'),
      addresses: [
        {
          id: 'addr-claire-1',
          label: 'Home – Chelsea',
          recipient: 'Claire Bennett',
          line1: '18 Pavilion Road',
          line2: 'Flat 3',
          city: 'London',
          county: 'Greater London',
          postcode: 'SW1X 0AZ',
          phone: '07700 900412',
          isDefault: true,
        },
      ],
      paymentMethods: [
        {
          id: 'pm-claire-1',
          brand: 'Visa',
          last4: '4242',
          expiry: '08/29',
          holderName: 'Claire Bennett',
          isDefault: true,
        },
      ],
      createdAt: '2026-09-12T10:15:00Z',
    },
    {
      id: adminUserId,
      email: 'admin@ukbeverages.co.uk',
      name: 'UK Beverages Operations',
      phone: '020 7946 0821',
      role: 'admin',
      passwordHash: hashPassword('AdminSource2026!'),
      addresses: [],
      paymentMethods: [],
      createdAt: '2026-09-01T09:00:00Z',
    },
  ];

  const orders: Order[] = [
    {
      id: 'ord-1042',
      orderNumber: 'SH-2026-1042',
      userId: demoCustomerId,
      customerEmail: 'claire.bennett@example.co.uk',
      customerName: 'Claire Bennett',
      phone: '07700 900412',
      shippingAddress: {
        recipient: 'Claire Bennett',
        line1: '18 Pavilion Road',
        line2: 'Flat 3',
        city: 'London',
        county: 'Greater London',
        postcode: 'SW1X 0AZ',
        phone: '07700 900412',
      },
      deliveryZoneId: 'zone-london-se',
      deliveryZoneName: 'London & South East',
      deliveryMethod: 'standard',
      items: [
        {
          productId: 'prod-evian-750-glass',
          sku: 'SH-EVI-750GL-12',
          name: 'Evian Natural Mineral Water – 750ml Glass',
          brandName: 'Evian',
          bottleSizeLabel: '750ml',
          packQuantity: 12,
          quantity: 1,
          unitPriceGbp: 27.6,
          lineTotalGbp: 27.6,
          purchaseMode: 'once',
          bottleStyle: 'evian_glass',
          capColor: '#D4D9DF',
          tintColor: '#E8F3F7',
          labelAccent: '#D15B78',
        },
        {
          productId: 'prod-icelandic-500-still',
          sku: 'SH-ICE-500PET-24',
          name: 'Icelandic Glacial Still – 500ml',
          brandName: 'Icelandic Glacial',
          bottleSizeLabel: '500ml',
          packQuantity: 24,
          quantity: 1,
          unitPriceGbp: 27.46,
          lineTotalGbp: 27.46,
          purchaseMode: 'subscribe',
          frequency: 'monthly',
          bottleStyle: 'icelandic_faceted',
          capColor: '#CBD5E1',
          tintColor: '#E1F2FA',
          labelAccent: '#2B6E8C',
        },
      ],
      subtotalGbp: 55.06,
      discountGbp: 0,
      shippingGbp: 0,
      vatIncludedGbp: 9.18,
      totalGbp: 55.06,
      paymentMethod: 'card',
      paymentLast4: '4242',
      status: 'Dispatched',
      trackingNumber: 'DPD-UK-88419204',
      carrier: 'DPD Local UK',
      estimatedDelivery: '1–2 working days',
      createdAt: '2026-11-18T14:22:00Z',
      emailLog: [
        '2026-11-18T14:22:05Z — Order confirmation sent to claire.bennett@example.co.uk',
        '2026-11-19T08:40:00Z — Dispatch notice with DPD tracking DPD-UK-88419204 sent',
      ],
    },
  ];

  const subscriptions: Subscription[] = [
    {
      id: 'sub-901',
      userId: demoCustomerId,
      customerEmail: 'claire.bennett@example.co.uk',
      customerName: 'Claire Bennett',
      productId: 'prod-icelandic-500-still',
      productName: 'Icelandic Glacial Still – 500ml',
      brandName: 'Icelandic Glacial',
      bottleSizeLabel: '500ml',
      packQuantity: 24,
      frequency: 'monthly',
      quantity: 1,
      unitPriceGbp: 27.46,
      status: 'Active',
      nextDeliveryDate: '2026-12-18',
      shippingAddress: {
        recipient: 'Claire Bennett',
        line1: '18 Pavilion Road',
        line2: 'Flat 3',
        city: 'London',
        county: 'Greater London',
        postcode: 'SW1X 0AZ',
        phone: '07700 900412',
      },
      paymentLast4: '4242',
      createdAt: '2026-11-18T14:22:00Z',
    },
  ];

  const marketing: MarketingConfig = {
    bannerEnabled: true,
    bannerText: 'Complimentary London & South East delivery on orders over £45 · Use WELCOME10 for 10% off your first case',
    bannerLink: '/shop',
    featuredProductIds: [
      'prod-evian-500-pet',
      'prod-fiji-500-pet',
      'prod-icelandic-500-still',
      'prod-highland-500-pet-sparkling',
      'prod-tongariro-750-still',
    ],
    newsletterSubscribers: [],
    contactMessages: [],
    companySettings: {
      legalName: 'UK Beverages Ltd',
      tradingName: 'UK Beverages',
      companyNumber: '14892310 (Registered in England & Wales)',
      vatNumber: 'GB 412 8940 22',
      address: 'Unit 7, Park Royal Distribution Centre, Coronation Road, London NW10 7PQ',
      supportEmail: 'hello@ukbeverages.co.uk',
      supportPhone: '+44 (0)20 7946 0821',
    },
  };

  return {
    brands,
    products: [...products.map((p) => ({ ...p, imageUrl: PRODUCT_PHOTOS[p.id] ?? p.imageUrl })), ...MULTIPACK_PRODUCTS],
    deliveryZones,
    discountCodes,
    users,
    orders,
    subscriptions,
    marketing,
  };
}


type MultipackSpec = {
  brandId: string;
  brandShort: string;
  slugBrand: string;
  skuBrand: string;
  priceGbp: number;
  subscriptionDiscountPct: number;
  packaging: Product['packaging'];
  bottleStyle: Product['bottleStyle'];
  capColor: string;
  tintColor: string;
  labelAccent: string;
  image: string;
  description: string;
};

// 12 × 500ml still multipacks, photographed (public/images/products).
// PRICES ARE SUGGESTED (about half the 24-pack price) and STOCK IS A PLACEHOLDER: confirm both before launch.
const MULTIPACK_SPECS: MultipackSpec[] = [
  { brandId: 'brand-evian', brandShort: 'Evian Natural Mineral Water', slugBrand: 'evian', skuBrand: 'EVI', priceGbp: 5.50, subscriptionDiscountPct: 10, packaging: 'rPET', bottleStyle: 'evian_pet', capColor: '#D15B78', tintColor: '#EEF6FA', labelAccent: '#D15B78', image: '/images/products/evian-12x500ml.webp', description: 'The classic Evian 500ml in a handy 12-pack, ideal for lunchboxes, the gym bag and the office. Naturally filtered for over 15 years through Alpine glacial sands.' },
  { brandId: 'brand-fiji', brandShort: 'FIJI Natural Artesian Water', slugBrand: 'fiji', skuBrand: 'FIJ', priceGbp: 6.50, subscriptionDiscountPct: 12, packaging: 'rPET', bottleStyle: 'fiji_square', capColor: '#133C55', tintColor: '#E5F2F8', labelAccent: '#18759C', image: '/images/products/fiji-12x500ml.webp', description: 'FIJI’s iconic square 500ml bottle in a 12-pack. Soft, smooth artesian water, naturally rich in silica, from a protected aquifer on Viti Levu.' },
  { brandId: 'brand-highland-spring', brandShort: 'Highland Spring Still Water', slugBrand: 'highland-spring', skuBrand: 'HIG', priceGbp: 5.00, subscriptionDiscountPct: 10, packaging: 'rPET', bottleStyle: 'highland_pet', capColor: '#5B3A8C', tintColor: '#DFF1E8', labelAccent: '#5B3A8C', image: '/images/products/highland-spring-12x500ml.webp', description: 'Still Highland Spring in 500ml bottles, 12 to a pack. Drawn from protected land in the Ochil Hills of Perthshire, Scotland.' },
  { brandId: 'brand-icelandic-glacial', brandShort: 'Icelandic Glacial Still Water', slugBrand: 'icelandic-glacial', skuBrand: 'ICE', priceGbp: 6.00, subscriptionDiscountPct: 12, packaging: 'rPET', bottleStyle: 'icelandic_faceted', capColor: '#1F2328', tintColor: '#E1F2FA', labelAccent: '#2B6E8C', image: '/images/products/icelandic-glacial-12x500ml.webp', description: 'Naturally alkaline (pH 8.4) Icelandic Glacial in 500ml bottles, 12 to a pack. Filtered through porous lava rock at the Ölfus Spring.' },
  { brandId: 'brand-tongariro', brandShort: 'Tongariro Natural Spring Water', slugBrand: 'tongariro', skuBrand: 'TON', priceGbp: 6.00, subscriptionDiscountPct: 10, packaging: 'PET', bottleStyle: 'tongariro_pure', capColor: '#1E4FA0', tintColor: '#E5EFF2', labelAccent: '#1E4FA0', image: '/images/products/tongariro-12x500ml.webp', description: 'Silica-rich volcanic spring water from 738m in New Zealand’s Tongariro region, in convenient 500ml bottles, 12 to a pack.' },
];

const TWELVE_PACKS: Product[] = MULTIPACK_SPECS.map((m) => ({
  id: `prod-${m.slugBrand}-500-12pk`,
  slug: `${m.slugBrand}-500ml-still-12-pack`,
  brandId: m.brandId,
  name: `${m.brandShort} – 500ml 12-Pack`,
  subtitle: 'Pack of 12 · 500ml Still Bottles',
  description: m.description,
  waterType: 'Still',
  packaging: m.packaging,
  bottleSizeMl: 500,
  bottleSizeLabel: '500ml',
  packQuantity: 12,
  priceGbp: m.priceGbp,
  subscriptionDiscountPct: m.subscriptionDiscountPct,
  sku: `UKB-${m.skuBrand}-500-12`,
  stock: 50,
  isBestSeller: false,
  isFeatured: false,
  bottleStyle: m.bottleStyle,
  capColor: m.capColor,
  tintColor: m.tintColor,
  labelAccent: m.labelAccent,
  imageUrl: m.image,
  active: true,
}));

const specFor = (slugBrand: string) => MULTIPACK_SPECS.find((m) => m.slugBrand === slugBrand)!;

// 12-bottle cases in 750ml and 1.5L, photographed as single bottles (public/images/products/single).
// PRICES ARE SUGGESTED within the £5–£8 case range and STOCK IS A PLACEHOLDER: confirm before launch.
const SIZE_CASES: { slugBrand: string; sizeMl: number; priceGbp: number; blurb: string }[] = [
  { slugBrand: 'evian', sizeMl: 750, priceGbp: 6.5, blurb: 'Evian in the 750ml sports-friendly bottle, 12 to a case. Natural mineral water from the French Alps.' },
  { slugBrand: 'fiji', sizeMl: 750, priceGbp: 7.5, blurb: 'FIJI’s square 750ml bottle, 12 to a case. Soft, silica-rich artesian water from Viti Levu.' },
  { slugBrand: 'highland-spring', sizeMl: 750, priceGbp: 6.0, blurb: 'Still Highland Spring in 750ml bottles, 12 to a case, from the Ochil Hills of Perthshire.' },
  { slugBrand: 'icelandic-glacial', sizeMl: 750, priceGbp: 7.0, blurb: 'Naturally alkaline Icelandic Glacial in 750ml bottles, 12 to a case, from the Ölfus Spring.' },
  { slugBrand: 'fiji', sizeMl: 1500, priceGbp: 8.0, blurb: 'FIJI in the family-size 1.5 litre bottle, 12 to a case. Smooth artesian water for the whole household.' },
  { slugBrand: 'highland-spring', sizeMl: 1500, priceGbp: 7.0, blurb: 'Highland Spring still water in 1.5 litre bottles, 12 to a case: great value for the fridge door.' },
  { slugBrand: 'icelandic-glacial', sizeMl: 1500, priceGbp: 8.0, blurb: 'Icelandic Glacial in 1.5 litre bottles, 12 to a case. Naturally alkaline at pH 8.4.' },
];

const SIZED_CASES: Product[] = SIZE_CASES.map(({ slugBrand, sizeMl, priceGbp, blurb }) => {
  const m = specFor(slugBrand);
  const label = sizeMl >= 1000 ? `${sizeMl / 1000}L` : `${sizeMl}ml`;
  const nice = sizeMl >= 1000 ? `${sizeMl / 1000} Litre` : `${sizeMl}ml`;
  return {
    id: `prod-${slugBrand}-${sizeMl}-12pk`,
    slug: `${slugBrand}-${sizeMl >= 1000 ? `${sizeMl / 1000}l` : `${sizeMl}ml`}-still-12-pack`.replace('.', '-'),
    brandId: m.brandId,
    name: `${m.brandShort} – ${nice} 12-Pack`,
    subtitle: `Case of 12 · ${label} Still Bottles`,
    description: blurb,
    waterType: 'Still',
    packaging: m.packaging,
    bottleSizeMl: sizeMl,
    bottleSizeLabel: label,
    packQuantity: 12,
    priceGbp,
    subscriptionDiscountPct: m.subscriptionDiscountPct,
    sku: `UKB-${m.skuBrand}-${sizeMl}-12`,
    stock: 50,
    isBestSeller: false,
    isFeatured: false,
    bottleStyle: m.bottleStyle,
    capColor: m.capColor,
    tintColor: m.tintColor,
    labelAccent: m.labelAccent,
    imageUrl: `/images/products/single/${slugBrand}-${sizeMl}ml.webp`,
    active: true,
  };
});

/** All catalogue additions since the original seed; server.ts adds any missing ones on startup. */
export const MULTIPACK_PRODUCTS: Product[] = [...TWELVE_PACKS, ...SIZED_CASES];

/** Single-bottle photos for products that existed before we had photography. */
export const PRODUCT_PHOTOS: Record<string, string> = {
  'prod-evian-500-pet': '/images/products/single/evian-500ml-bottle.webp',
  'prod-fiji-500-pet': '/images/products/single/fiji-500ml-bottle.webp',
  'prod-icelandic-500-still': '/images/products/single/icelandic-glacial-500ml-bottle.webp',
  'prod-tongariro-750-still': '/images/products/single/tongariro-750ml.webp',
  'prod-tongariro-1500-still': '/images/products/single/tongariro-1500ml.webp',
};

class StoreRepository {
  private state: DatabaseState;

  constructor() {
    this.state = this.load();
  }

  private load(): DatabaseState {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw) as DatabaseState;
      }
    } catch {
      // Fallback to fresh seed if corrupted
    }
    const initial = createInitialState();
    this.persist(initial);
    return initial;
  }

  private persist(nextState: DatabaseState) {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tmp = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(nextState, null, 2), 'utf-8');
    fs.renameSync(tmp, DB_FILE);
  }

  getState(): DatabaseState {
    return this.state;
  }

  save() {
    this.persist(this.state);
  }
}

export const db = new StoreRepository();
