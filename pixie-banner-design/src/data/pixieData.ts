import imgBrightHeadphones from '../assets/images/pixie_bright_headphones_1791394279920.jpg';
import imgBrightWatch from '../assets/images/pixie_bright_watch_1791394293674.jpg';
import imgBrightSneaker from '../assets/images/pixie_bright_sneaker_1791394305531.jpg';
import imgBrightCamera from '../assets/images/pixie_bright_camera_1791394317070.jpg';

// Exact 5-Color Rose Quartz & Gold Geode Palette from the User's Reference Image
export const QUARTZ_PALETTE = {
  champagneGold: '#EFCF92',
  warmCream: '#FDF6E7',
  warmBronze: '#B87B5A',
  softBlushMist: '#F9E6EC',
  roseQuartzPink: '#E7B8C6',
  deepBlackBg: '#060608',
} as const;

export interface PixieSceneCard {
  id: string;
  slotType: 'sale-bag-icon' | 'mobile-pulse' | 'hero-motto' | 'product-drop' | 'instant-buy';
  title: string;
  subtitle: string;
  storeName?: string;
  originalPriceInr?: number;
  currentPriceInr?: number;
  dropPercent?: number;
  savedInr?: number;
  imageUrl?: string;
  // Exact 3D spatial layout matching the user's screenshot (clustered on the right side)
  position: [number, number, number];
  baseRotation: [number, number, number];
  dimensions: [number, number]; // [width, height]
}

export interface Pixie3DConfig {
  visualMode: 'modern-rosegold' | 'old-stock-boxes';
  cornerRadius: number; // 0.0 to 0.24
  cardDepth: number; // 0.04 to 0.36
  surfaceRoughness: number; // 0.12 to 0.70
  specularGlareControl: number; // 0.1 to 1.0
  cursorTiltIntensity: number; // 0.4 to 1.8
  cursorParallaxStrength: number; // 0.2 to 1.6
  cursorDamping: number; // 0.04 to 0.25
  haloRingVisible: boolean;
}

// Helper to format Indian Rupees cleanly (e.g. ₹799 or ₹1,499)
export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

// The 5 cards positioned on the right side in the exact stagger formation as the user's screenshot
// Featuring realistic, everyday heavily discounted Indian e-commerce steal prices!
export const PIXIE_RIGHT_CLUSTER_CARDS: PixieSceneCard[] = [
  {
    // 1. Top-Right Card: Everyday Sneaker Flash Steal
    id: 'card-top-right',
    slotType: 'sale-bag-icon',
    title: 'CLOUDRUNNER MESH PRO',
    subtitle: 'PRICE DROP ALERT · -70%',
    storeName: 'Myntra · Ajio',
    originalPriceInr: 4299,
    currentPriceInr: 1299,
    dropPercent: 70,
    savedInr: 3000,
    imageUrl: imgBrightSneaker,
    position: [2.55, 2.05, 0.35],
    baseRotation: [0.08, -0.28, -0.03],
    dimensions: [2.45, 1.65],
  },
  {
    // 2. Upper-Middle Card: Wireless ANC Headphones Deal
    id: 'card-upper-mid',
    slotType: 'mobile-pulse',
    title: 'AERO ANC HEADPHONES',
    subtitle: 'INSTANT PUSH · 2M AGO',
    storeName: 'Amazon IN · Flipkart',
    originalPriceInr: 4999,
    currentPriceInr: 1499,
    dropPercent: 70,
    savedInr: 3500,
    imageUrl: imgBrightHeadphones,
    position: [0.65, 1.15, -0.15],
    baseRotation: [0.05, -0.18, 0.02],
    dimensions: [2.55, 1.65],
  },
  {
    // 3. Far-Right Hero Motto Card ("NEVER MISS A PRICE DROP. EVER.")
    id: 'card-right-motto',
    slotType: 'hero-motto',
    title: 'NEVER MISS A PRICE DROP.',
    subtitle: 'EVER.',
    position: [2.85, -0.05, 0.65],
    baseRotation: [0.02, -0.32, -0.01],
    dimensions: [2.75, 1.95],
  },
  {
    // 4. Lower-Middle Card: Retro Instant Camera Deal
    id: 'card-lower-mid',
    slotType: 'product-drop',
    title: 'INSTAX MINI RETRO EVO',
    subtitle: 'ALL-TIME LOW DETECTED',
    storeName: 'Flipkart · Croma',
    originalPriceInr: 5999,
    currentPriceInr: 1899,
    dropPercent: 68,
    savedInr: 4100,
    imageUrl: imgBrightCamera,
    position: [-0.05, -0.55, 0.25],
    baseRotation: [-0.03, -0.14, 0.015],
    dimensions: [2.85, 1.75],
  },
  {
    // 5. Bottom-Right Card: Rose Gold Smart Watch Steal
    id: 'card-bottom-right',
    slotType: 'instant-buy',
    title: 'HALO FIT ROSE WATCH',
    subtitle: 'AUTO-TRACKING ACTIVE',
    storeName: 'Amazon IN · Nykaa',
    originalPriceInr: 3499,
    currentPriceInr: 799,
    dropPercent: 77,
    savedInr: 2700,
    imageUrl: imgBrightWatch,
    position: [2.25, -2.05, 0.4],
    baseRotation: [-0.08, -0.26, 0.02],
    dimensions: [2.45, 1.6],
  },
];

export const DEFAULT_MODERN_CONFIG: Pixie3DConfig = {
  visualMode: 'modern-rosegold',
  cornerRadius: 0.18,
  cardDepth: 0.06,
  surfaceRoughness: 0.2,
  specularGlareControl: 0.92,
  cursorTiltIntensity: 1.35,
  cursorParallaxStrength: 1.08,
  cursorDamping: 0.11,
  haloRingVisible: true,
};

export const OLD_STOCK_BOX_CONFIG: Pixie3DConfig = {
  visualMode: 'old-stock-boxes',
  cornerRadius: 0.0,
  cardDepth: 0.34,
  surfaceRoughness: 0.12,
  specularGlareControl: 0.15,
  cursorTiltIntensity: 0.95,
  cursorParallaxStrength: 0.6,
  cursorDamping: 0.18,
  haloRingVisible: true,
};
