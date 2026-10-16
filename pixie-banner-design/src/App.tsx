/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { getProductHistory, listProducts, trackProduct } from './lib/api';
import { motion } from 'motion/react';
import { Pixie3DStage } from './components/Pixie3DStage';
import { ScrollSequence } from './components/ScrollSequence';
import { DEFAULT_MODERN_CONFIG, PIXIE_RIGHT_CLUSTER_CARDS } from './data/pixieData';
import {
  Search,
  ArrowRight,
  X,
  TrendingDown,
  Bell,
  ShieldCheck,
  Radar,
  Sparkles,
  LineChart,
  BookmarkCheck,
  ExternalLink,
  Check,
  AlertTriangle,
  Link2,
} from 'lucide-react';

// Smooth scroll-triggered word-by-word text reveal component
function ScrollRevealWords({
  text,
  className = '',
  delayOffset = 0,
}: {
  text: string;
  className?: string;
  delayOffset?: number;
}) {
  const words = text.split(' ');
  return (
    <motion.span
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, amount: 0.35 }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.045,
            delayChildren: delayOffset,
          },
        },
      }}
      className={`inline-block ${className}`}
    >
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          variants={{
            hidden: { opacity: 0, y: 18, filter: 'blur(6px)' },
            visible: {
              opacity: 1,
              y: 0,
              filter: 'blur(0px)',
              transition: {
                duration: 0.55,
                ease: [0.16, 1, 0.3, 1],
              },
            },
          }}
          className="inline-block mr-[0.26em] last:mr-0"
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
}

// Custom geometric PIXIE logo mark keeping the clean white architectural aesthetic
function PixieLogoMark() {
  return (
    <svg
      width="30"
      height="22"
      viewBox="0 0 30 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      aria-hidden="true"
    >
      {/* Left price-tag / prism wing */}
      <path
        d="M2 19.5L8.5 3.8C9.2 2.2 11.5 2.2 12.2 3.8L16.5 13.8L11.8 19.5H2Z"
        fill="white"
      />
      {/* Right price-drop arrow / spark peak */}
      <path
        d="M17.2 3.5C18.0 1.9 20.3 1.9 21.1 3.5L28.5 19.5H22.4L15.8 5.6L17.2 3.5Z"
        fill="white"
      />
      <circle cx="15" cy="18" r="1.8" fill="white" />
    </svg>
  );
}

const NAV_ITEMS = [
  { label: 'Home', targetId: 'section-home' },
  { label: 'How It Works', targetId: 'section-track' },
  { label: 'Price History', targetId: 'section-history' },
  { label: 'Start Saving', targetId: 'section-start' },
] as const;

const BOTTOM_FEATURES = [
  {
    id: 'price-tracking',
    title: 'Price Tracking',
    subtitle: 'Keep an eye on changing prices',
    icon: Radar,
    targetId: 'section-track',
  },
  {
    id: 'price-history',
    title: 'Price History',
    subtitle: 'See if today is a real deal',
    icon: LineChart,
    targetId: 'section-history',
  },
  {
    id: 'instant-alerts',
    title: 'Instant Alerts',
    subtitle: 'Get notified when prices drop',
    icon: Bell,
    targetId: 'section-track',
  },
  {
    id: 'smart-wishlist',
    title: 'Wishlist Autopilot',
    subtitle: 'Let PIXIE do the checking',
    icon: BookmarkCheck,
    targetId: 'section-start',
  },
] as const;

const PRICE_TIMELINE = [
  {
    month: 'Nov',
    price: 240,
    x: 40,
    y: 78,
    type: 'normal',
    verdict: 'Standard Retail Price',
    detail: 'Selling at normal historical average ($240). Wait for a drop.',
  },
  {
    month: 'Dec',
    price: 299,
    x: 140,
    y: 26,
    type: 'fake',
    verdict: 'Fake Discount Detected',
    detail: 'Price was raised to $299 right before advertising a "20% Off" holiday sale.',
  },
  {
    month: 'Jan',
    price: 235,
    x: 240,
    y: 82,
    type: 'normal',
    verdict: 'Post-Sale Reset',
    detail: 'Returned to typical retail baseline. Still above target price.',
  },
  {
    month: 'Feb',
    price: 215,
    x: 340,
    y: 100,
    type: 'dip',
    verdict: 'Moderate Dip (-10%)',
    detail: 'Genuine $25 reduction, but historical trends show deeper drops ahead.',
  },
  {
    month: 'Mar',
    price: 229,
    x: 440,
    y: 88,
    type: 'normal',
    verdict: 'Minor Fluctuation',
    detail: 'Price rebounded slightly as stock tightened.',
  },
  {
    month: 'Today',
    price: 179,
    x: 540,
    y: 132,
    type: 'best',
    verdict: 'Verified Real Deal · -25% Below Avg',
    detail: 'Lowest recorded price in 180 days. 98% confidence it is the right time to buy.',
  },
] as const;

export default function App() {
  const overlayTrackRef = useRef<HTMLDivElement>(null);
  const [activeNav, setActiveNav] = useState<string>('Home');
  const [activeSlide, setActiveSlide] = useState<number>(1);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Section 2 interactive states (3-Step How PIXIE Works & Wishlist Autopilot)
  const [activeHowStep, setActiveHowStep] = useState<number>(0);
  const [quickProduct, setQuickProduct] = useState<string>('Wireless Noise-Canceling Headphones');
  const [selectedDropGoal, setSelectedDropGoal] = useState<number>(25);
  const [watchlistItems, setWatchlistItems] = useState([
    { id: 1, name: 'Minimalist Desk Lamp', drop: '-18%', saved: 28, active: true },
    { id: 2, name: 'Mechanical Keycap Set', drop: '-30%', saved: 45, active: true },
    { id: 3, name: 'Portable SSD 2TB', drop: '-22%', saved: 52, active: false },
  ]);
  const [dealScore, setDealScore] = useState('9.8/10');
  const [trackMessage, setTrackMessage] = useState('');

  useEffect(() => {
    listProducts()
      .then((data) => {
        if (!data.products?.length) return;
        setWatchlistItems(
          data.products.map((item) => ({
            id: item.id,
            name: item.name || item.title || 'Tracked product',
            drop: item.drop || '—',
            saved: item.saved || 0,
            active: item.active !== false,
          }))
        );
      })
      .catch(() => {
        // Backend stub not running yet — keep local placeholders.
      });

    getProductHistory(1)
      .then((data) => {
        if (data.analytics?.deal_score != null) {
          setDealScore(`${data.analytics.deal_score}/10`);
        }
      })
      .catch(() => {
        // Keep the static chart until analytics.py is implemented.
      });
  }, []);

  const submitTrackedProduct = async (dropGoal = selectedDropGoal) => {
    try {
      const result = await trackProduct(quickProduct, dropGoal);
      const stored = result.product;
      setTrackMessage(`Tracking ${stored.title || stored.name || quickProduct}`);
      setWatchlistItems((prev) => [
        {
          id: stored.id,
          name: stored.title || stored.name || quickProduct,
          drop: stored.drop || `-${dropGoal}%`,
          saved: stored.saved || 0,
          active: true,
        },
        ...prev.filter((item) => item.id !== stored.id),
      ]);
    } catch {
      setTrackMessage('Backend not running — placeholder saved in the UI only.');
    }
  };

  // Section 3 interactive states (Real Price History & Fake Discount Detector)
  const [selectedTimelineIdx, setSelectedTimelineIdx] = useState<number>(5);

  const [activeModal, setActiveModal] = useState<{
    title: string;
    description: string;
  } | null>(null);

  const selectedPoint = PRICE_TIMELINE[selectedTimelineIdx];

  const scrollToSection = (targetId: string, navLabel?: string) => {
    if (navLabel) {
      setActiveNav(navLabel);
    }
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const toggleWatchlistItem = (id: number) => {
    setWatchlistItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, active: !item.active } : item
      )
    );
  };

  const totalWatchlistSavings = watchlistItems
    .filter((i) => i.active)
    .reduce((sum, i) => sum + i.saved, 0);

  return (
    <div className="min-h-screen w-full bg-transparent text-white flex flex-col justify-between relative select-none">
      {/* =====================================================================
          SECTION 1: HERO BANNER + 3D PRODUCT CLUSTER
         ===================================================================== */}
      <div id="section-home" className="relative z-20 w-full min-h-screen overflow-hidden bg-black">
        <div className="absolute inset-0 z-0 hidden lg:block">
          <Pixie3DStage
            bannerMode
            cardsData={PIXIE_RIGHT_CLUSTER_CARDS}
            config={DEFAULT_MODERN_CONFIG}
          />
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-[58%] bg-gradient-to-r from-black via-black/85 to-transparent"
            aria-hidden="true"
          />
        </div>

        <div className="relative z-10 w-full max-w-[1440px] min-h-screen mx-auto px-8 sm:px-14 lg:px-20 py-8 sm:py-10 flex flex-col justify-between">
        {/* TOP NAVIGATION BAR */}
        <header className="w-full flex items-center justify-between">
          {/* Brand Logo */}
          <a
            href="#section-home"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('section-home', 'Home');
            }}
            className="flex items-center gap-2.5 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-md"
          >
            <PixieLogoMark />
            <span className="text-[20px] font-bold tracking-tight text-white">
              PIXIE
            </span>
          </a>

          {/* Center Navigation Links — Clicking scrolls smoothly to each section */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-9 lg:gap-11"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeNav === item.label;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => scrollToSection(item.targetId, item.label)}
                  className="relative py-1.5 text-[14px] font-normal text-white transition-opacity hover:opacity-100 opacity-95 cursor-pointer whitespace-nowrap focus-visible:outline-none"
                >
                  {item.label}
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-white rounded-full"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Actions: Search & Primary Pill CTA */}
          <div className="flex items-center gap-5">
            {searchOpen ? (
              <div className="flex items-center bg-white/10 border border-white/20 rounded-full px-3.5 py-1.5 gap-2">
                <Search className="w-4 h-4 text-white/80 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Paste product link..."
                  autoFocus
                  className="bg-transparent text-white text-xs placeholder:text-white/50 focus:outline-none w-32 sm:w-40"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery('');
                  }}
                  aria-label="Close search"
                  className="text-white/70 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Search products"
                className="p-2 text-white hover:opacity-80 transition-opacity cursor-pointer focus-visible:outline-none"
              >
                <Search className="w-[19px] h-[19px] stroke-[1.8]" />
              </button>
            )}

            <a
              href="http://localhost:3001"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-black rounded-full px-5 py-2.5 text-[13.5px] font-semibold inline-flex items-center gap-2 hover:bg-white/90 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2]" />
            </a>
          </div>
        </header>

        {/* MIDDLE HERO CONTENT AREA WITH SCROLL TEXT ANIMATION */}
        <main className="my-auto py-12 lg:py-16 flex flex-col items-start relative">
          {/* Main Two-Line Headline */}
          <h1 className="text-[44px] sm:text-[56px] lg:text-[64px] font-bold text-white leading-[1.1] tracking-[-0.02em] mb-6">
            <span className="block">
              <ScrollRevealWords text="Shop Smarter" delayOffset={0.05} />
            </span>
            <span className="block">
              <ScrollRevealWords text="with PIXIE" delayOffset={0.18} />
            </span>
          </h1>

          {/* Subtitle / Body Copy */}
          <motion.p
            initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: false, amount: 0.4 }}
            transition={{ duration: 0.65, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="text-white text-[14.5px] sm:text-[15.5px] leading-[1.68] font-normal max-w-[460px] mb-9"
          >
            Track prices, compare deals, and know when it’s the right time to
            buy. PIXIE watches the prices for you, so you can spend less time
            searching and more time saving.
          </motion.p>

          {/* Primary & Secondary Action Row */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.4 }}
            transition={{ duration: 0.6, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap items-center gap-4"
          >
            <button
              type="button"
              onClick={() => scrollToSection('section-track', 'How It Works')}
              className="bg-white text-black rounded-full px-6 py-3.5 text-[14px] font-semibold inline-flex items-center gap-2.5 hover:bg-white/90 transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>Track a Product</span>
              <ArrowRight className="w-4 h-4 stroke-[2]" />
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('section-history', 'Price History')}
              className="rounded-full bg-white/[0.08] border border-white/15 backdrop-blur-md px-6 py-3.5 text-[14px] font-medium text-white hover:bg-white/[0.14] transition-colors cursor-pointer whitespace-nowrap"
            >
              Explore Deals
            </button>
          </motion.div>
        </main>

        {/* BOTTOM BAR: 4 FEATURE ITEMS WITH GLASS BORDER & SLIDE INDICATOR */}
        <footer className="w-full pt-6 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 flex-1 max-w-[1080px]">
            {BOTTOM_FEATURES.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <motion.button
                  key={feature.id}
                  type="button"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.2 }}
                  transition={{
                    duration: 0.5,
                    delay: 0.1 + index * 0.08,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  onClick={() => scrollToSection(feature.targetId)}
                  className="rounded-[20px] bg-white/[0.08] border border-white/15 backdrop-blur-md px-5 py-4 flex items-center gap-3.5 text-left group hover:bg-white/[0.12] transition-colors cursor-pointer focus-visible:outline-none"
                >
                  <div className="w-11 h-11 rounded-full bg-white/[0.14] border border-white/20 flex items-center justify-center shrink-0 text-white group-hover:bg-white/20 transition-colors">
                    <IconComponent className="w-5 h-5 stroke-[1.6]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[14px] font-semibold text-white leading-snug whitespace-nowrap">
                      {feature.title}
                    </span>
                    <span className="text-[12px] font-normal text-white/85 leading-snug whitespace-nowrap mt-0.5">
                      {feature.subtitle}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Bottom-Right Pagination Indicator: 01 [progress bar] 04 */}
          <div className="flex items-center gap-3.5 self-end xl:self-center shrink-0">
            <span className="text-[12.5px] font-normal text-white tabular-nums">
              0{activeSlide}
            </span>
            <div
              role="group"
              aria-label="Banner slide indicator"
              className="w-24 h-[2px] bg-white/25 rounded-full overflow-hidden flex cursor-pointer"
              onClick={() => {
                const next = (activeSlide % 4) + 1;
                setActiveSlide(next);
                const targets = [
                  'section-home',
                  'section-track',
                  'section-history',
                  'section-start',
                ];
                scrollToSection(targets[next - 1]);
              }}
            >
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`h-full flex-1 transition-colors ${
                    activeSlide === step ? 'bg-white' : 'bg-transparent'
                  }`}
                />
              ))}
            </div>
            <span className="text-[12.5px] font-normal text-white/75 tabular-nums">
              04
            </span>
          </div>
        </footer>
        </div>
      </div>

      <ScrollSequence trackRef={overlayTrackRef} />

      <div
        ref={overlayTrackRef}
        className="relative z-10 min-h-[320vh] bg-transparent [text-shadow:0_10px_28px_rgba(0,0,0,0.85)]"
      >
      {/* =====================================================================
          SECTION 2: HOW IT WORKS — PRICE TRACKING & WATCHLIST AUTOPILOT
          Minimal Left Copy + Interactive 3-Step Flow & Wishlist Autopilot on Right
         ===================================================================== */}
      <section
        id="section-track"
        className="w-full max-w-[1440px] mx-auto px-8 sm:px-14 lg:px-20 py-28 relative z-10 bg-transparent"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-12 lg:gap-10">
          
          {/* Left Side: Animated Minimal Copy */}
          <div className="lg:col-span-4 flex flex-col items-start">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.5 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-xs font-medium text-white/60 tracking-wide mb-3"
            >
              02 · How It Works · Price Tracking
            </motion.span>

            <h2 className="text-3xl sm:text-4xl font-bold text-white leading-[1.15] tracking-[-0.02em] mb-4">
              <ScrollRevealWords text="You Shop. PIXIE Watches." delayOffset={0.05} />
            </h2>

            <motion.p
              initial={{ opacity: 0, y: 18, filter: 'blur(5px)' }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={{ once: false, amount: 0.4 }}
              transition={{ duration: 0.6, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="text-white/75 text-[14.5px] leading-[1.7] max-w-[340px] mb-5"
            >
              Prices change every day. Instead of constantly refreshing product
              pages, add items to your watchlist and let PIXIE keep an eye on
              them.
            </motion.p>

            <motion.span
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.5 }}
              transition={{ duration: 0.55, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="text-xs font-semibold text-white/90 tracking-wide"
            >
              Set it. Forget it. Get the drop.
            </motion.span>
          </div>

          {/* Right Side: Interactive 3-Step Flow & Wishlist Autopilot Glass Showcase */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.25 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-8 relative flex items-center justify-center lg:justify-end min-h-[460px]"
          >
            {/* Ambient Glows behind glass for blur refraction */}
            <div
              className="pointer-events-none absolute top-4 right-20 w-80 h-80 rounded-full bg-white/[0.13] blur-[95px]"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute bottom-2 right-72 w-64 h-64 rounded-full bg-white/[0.08] blur-[80px]"
              aria-hidden="true"
            />

            {/* Decorative Frosted Glass Ring */}
            <div
              className="pointer-events-none hidden sm:flex absolute -top-6 right-6 w-28 h-28 rounded-full bg-white/[0.04] border border-white/15 backdrop-blur-2xl items-center justify-center"
              aria-hidden="true"
            >
              <div className="w-14 h-14 rounded-full border border-white/20 bg-white/[0.05]" />
            </div>

            {/* Main Right-Side Glass Grid */}
            <div className="relative w-full max-w-[680px] grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
              
              {/* Left Glass Card (7 cols): Interactive 3-Step "How PIXIE Works" Explorer */}
              <div className="md:col-span-7 rounded-[28px] bg-white/[0.08] border border-white/20 backdrop-blur-2xl p-6 sm:p-7 shadow-[0_24px_80px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.25)] flex flex-col justify-between">
                {/* Interactive 01 / 02 / 03 Step Selector Cards */}
                <div className="space-y-2.5 mb-5">
                  {[
                    {
                      num: '01',
                      title: '01 — Find It',
                      desc: 'Search for the product you want or add a product link.',
                    },
                    {
                      num: '02',
                      title: '02 — Track It',
                      desc: 'Set your target price and let PIXIE keep watch.',
                    },
                    {
                      num: '03',
                      title: '03 — Catch the Drop',
                      desc: 'Get notified when the price drops to your desired price.',
                    },
                  ].map((s, idx) => {
                    const isActive = activeHowStep === idx;
                    return (
                      <button
                        key={s.num}
                        type="button"
                        onClick={() => setActiveHowStep(idx)}
                        className={`w-full rounded-2xl p-4 border text-left transition-all cursor-pointer flex items-start justify-between gap-3 ${
                          isActive
                            ? 'bg-white/[0.15] border-white/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]'
                            : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08]'
                        }`}
                      >
                        <div className="flex items-start gap-3.5">
                          <span
                            className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold tabular-nums shrink-0 mt-0.5 ${
                              isActive
                                ? 'bg-white text-black'
                                : 'bg-white/10 text-white/75 border border-white/15'
                            }`}
                          >
                            {s.num}
                          </span>
                          <div>
                            <div className="text-sm font-semibold text-white">
                              {s.title}
                            </div>
                            <div className="text-xs text-white/70 mt-0.5 leading-relaxed">
                              {s.desc}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Interactive Stage Preview for Currently Selected Step */}
                <div className="rounded-2xl bg-white/[0.06] border border-white/15 backdrop-blur-xl p-4">
                  {activeHowStep === 0 && (
                    <div>
                      <div className="flex items-center justify-between text-xs text-white/70 mb-2">
                        <span>Quick Add Product to Radar</span>
                        <span className="text-white font-medium">Step 01</span>
                      </div>
                      <div className="flex items-center gap-2 bg-black/50 border border-white/20 rounded-xl px-3 py-2">
                        <Link2 className="w-4 h-4 text-white/70 shrink-0" />
                        <input
                          type="text"
                          value={quickProduct}
                          onChange={(e) => setQuickProduct(e.target.value)}
                          aria-label="Product name or link"
                          className="bg-transparent text-xs text-white w-full focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setActiveHowStep(1)}
                          className="px-3 py-1 rounded-lg bg-white text-black text-xs font-semibold hover:bg-white/90 transition-colors cursor-pointer shrink-0"
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                  )}

                  {activeHowStep === 1 && (
                    <div>
                      <div className="flex items-center justify-between text-xs text-white/75 mb-2.5">
                        <span>Choose Desired Drop Goal</span>
                        <span className="font-semibold text-white tabular-nums">
                          -{selectedDropGoal}% Target
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {[15, 20, 25, 35].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => {
                              setSelectedDropGoal(pct);
                              setActiveHowStep(2);
                              void submitTrackedProduct(pct);
                            }}
                            className={`py-2 rounded-xl text-xs font-semibold tabular-nums border transition-all cursor-pointer ${
                              selectedDropGoal === pct
                                ? 'bg-white text-black border-white'
                                : 'bg-white/[0.06] text-white border-white/15 hover:bg-white/[0.14]'
                            }`}
                          >
                            -{pct}%
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeHowStep === 2 && (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shrink-0">
                          <Bell className="w-4 h-4 stroke-[2.2]" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">
                            Alert Locked for -{selectedDropGoal}% Drop
                          </div>
                          <div className="text-[11px] text-white/70 truncate max-w-[220px]">
                            {quickProduct}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-white/85 tabular-nums shrink-0">
                        {trackMessage || 'Active 24/7'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column Stack (5 cols): Wishlist on Autopilot & Total Savings */}
              <div className="md:col-span-5 flex flex-col justify-between gap-5">
                
                {/* Top Card: Your Wishlist, On Autopilot */}
                <div className="rounded-[26px] bg-white/[0.08] border border-white/20 backdrop-blur-2xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.25)] flex flex-col justify-between flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm font-semibold text-white">
                        Wishlist on Autopilot
                      </div>
                      <div className="text-xs text-white/65 mt-0.5">
                        Toggle items on your radar
                      </div>
                    </div>
                    <div className="w-9 h-9 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center">
                      <Radar className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  <div className="space-y-2.5 my-2">
                    {watchlistItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleWatchlistItem(item.id)}
                        className={`w-full rounded-xl px-3.5 py-2.5 border flex items-center justify-between text-xs transition-all cursor-pointer ${
                          item.active
                            ? 'bg-white/[0.14] border-white/30 text-white'
                            : 'bg-white/[0.04] border-white/10 text-white/55'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span
                            className={`w-4 h-4 rounded-md flex items-center justify-center border shrink-0 ${
                              item.active
                                ? 'bg-white text-black border-white'
                                : 'border-white/30 text-transparent'
                            }`}
                          >
                            <Check className="w-3 h-3 stroke-[2.5]" />
                          </span>
                          <span className="font-medium truncate">{item.name}</span>
                        </div>
                        <span className="font-semibold tabular-nums shrink-0 ml-2">
                          {item.drop}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/75">
                    <span>Active Watchlist</span>
                    <span className="font-semibold text-white tabular-nums">
                      {watchlistItems.filter((i) => i.active).length} Products
                    </span>
                  </div>
                </div>

                {/* Bottom Card: Every Drop Matters Savings Counter */}
                <div className="rounded-[24px] bg-white/[0.09] border border-white/20 backdrop-blur-2xl p-5 shadow-[0_16px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.25)] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
                      <TrendingDown className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">
                        Every Drop Matters
                      </div>
                      <div className="text-[11px] text-white/70">
                        Estimated watchlist savings
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-base font-bold text-white tabular-nums">
                      ${totalWatchlistSavings}
                    </div>
                    <div className="text-[10px] text-white/65">Saved</div>
                  </div>
                </div>

              </div>

            </div>
          </motion.div>

        </div>
      </section>

      {/* =====================================================================
          SECTION 3: PRICE HISTORY — KNOW THE REAL PRICE
          Interactive Price History Curve & Fake Discount Detector on Left + Animated Text on Right
         ===================================================================== */}
      <section
        id="section-history"
        className="w-full max-w-[1440px] mx-auto px-8 sm:px-14 lg:px-20 py-28 relative z-10 bg-transparent"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-12 lg:gap-10">
          
          {/* Left Side: Interactive Price History & Fake Discount Detector */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.25 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-8 relative flex items-center justify-center lg:justify-start min-h-[460px]"
          >
            {/* Ambient Light Spheres behind left glass block */}
            <div
              className="pointer-events-none absolute top-10 left-14 w-80 h-80 rounded-full bg-white/[0.12] blur-[100px]"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -bottom-6 left-64 w-72 h-72 rounded-full bg-white/[0.08] blur-[85px]"
              aria-hidden="true"
            />

            {/* Decorative Tilted Glass Backdrop Pane */}
            <div
              className="pointer-events-none hidden sm:block absolute -top-4 left-10 w-[420px] h-[360px] rounded-[34px] bg-white/[0.03] border border-white/10 backdrop-blur-lg -rotate-2"
              aria-hidden="true"
            />

            {/* Left-Side Layered Glass Bento Grid */}
            <div className="relative w-full max-w-[680px] grid grid-cols-1 md:grid-cols-12 gap-5">
              
              {/* Top Wide Interactive Glass Card: 6-Month Price History Line & Fake Discount Detector */}
              <div className="md:col-span-12 rounded-[28px] bg-white/[0.08] border border-white/20 backdrop-blur-2xl p-6 sm:p-7 shadow-[0_24px_80px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.25)]">
                {/* Header with Dynamic Deal Verdict */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/[0.14] border border-white/20 flex items-center justify-center">
                      {selectedPoint.type === 'fake' ? (
                        <AlertTriangle className="w-5 h-5 text-white" />
                      ) : (
                        <LineChart className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div>
                      <div className="text-[15px] font-semibold text-white">
                        Real Price History · Fake Discount Detector
                      </div>
                      <div className="text-xs text-white/70">
                        Click any point on the timeline to inspect historical pricing
                      </div>
                    </div>
                  </div>

                  <div className="rounded-full bg-white/[0.12] border border-white/25 backdrop-blur-md px-4 py-1.5 text-xs text-white flex items-center gap-2 tabular-nums">
                    <span className="text-white/70">{selectedPoint.month}:</span>
                    <span className="font-bold">${selectedPoint.price}</span>
                    <span className="text-white/40">·</span>
                    <span className="font-medium text-white/90">
                      {selectedPoint.verdict}
                    </span>
                  </div>
                </div>

                {/* Interactive SVG Price Curve Canvas */}
                <div className="rounded-2xl bg-white/[0.04] border border-white/12 p-4 mb-4">
                  <svg
                    viewBox="0 0 580 160"
                    className="w-full h-36 overflow-visible"
                    role="img"
                    aria-label="6-month product price history chart"
                  >
                    <defs>
                      <linearGradient id="priceAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0.0)" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Reference Line: 6-Month Average ($240) */}
                    <line
                      x1="20"
                      y1="78"
                      x2="560"
                      y2="78"
                      stroke="rgba(255,255,255,0.2)"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <text
                      x="24"
                      y="70"
                      fill="rgba(255,255,255,0.45)"
                      fontSize="10"
                    >
                      Typical Avg $240
                    </text>

                    {/* Shaded Area under Price Curve */}
                    <path
                      d="M 40 78 L 140 26 L 240 82 L 340 100 L 440 88 L 540 132 L 540 155 L 40 155 Z"
                      fill="url(#priceAreaGrad)"
                    />

                    {/* Main Price History Polyline */}
                    <polyline
                      fill="none"
                      stroke="rgba(255,255,255,0.85)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points="40,78 140,26 240,82 340,100 440,88 540,132"
                    />

                    {/* Interactive Data Nodes */}
                    {PRICE_TIMELINE.map((pt, idx) => {
                      const isSelected = idx === selectedTimelineIdx;
                      return (
                        <g
                          key={pt.month}
                          className="cursor-pointer"
                          onClick={() => setSelectedTimelineIdx(idx)}
                        >
                          {isSelected && (
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r="13"
                              fill="rgba(255,255,255,0.2)"
                            />
                          )}
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={isSelected ? '6.5' : '4.5'}
                            fill={isSelected ? '#ffffff' : '#171717'}
                            stroke="#ffffff"
                            strokeWidth={isSelected ? '2.5' : '1.8'}
                          />
                          <text
                            x={pt.x}
                            y={pt.y - 12}
                            textAnchor="middle"
                            fill={
                              isSelected
                                ? '#ffffff'
                                : 'rgba(255,255,255,0.65)'
                            }
                            fontSize="11"
                            fontWeight={isSelected ? '700' : '500'}
                          >
                            ${pt.price}
                          </text>
                        </g>
                      );
                    })}
                  </svg>

                  {/* Month Selector Buttons under Chart */}
                  <div className="grid grid-cols-6 gap-2 pt-2 border-t border-white/10">
                    {PRICE_TIMELINE.map((pt, idx) => {
                      const isSelected = idx === selectedTimelineIdx;
                      return (
                        <button
                          key={pt.month}
                          type="button"
                          onClick={() => setSelectedTimelineIdx(idx)}
                          className={`py-1.5 rounded-lg text-xs tabular-nums transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-white text-black font-semibold'
                              : 'text-white/65 hover:text-white hover:bg-white/[0.06]'
                          }`}
                        >
                          {pt.month}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Point Insight Banner */}
                <div className="flex items-center justify-between gap-4 text-xs text-white/85 px-1">
                  <span>{selectedPoint.detail}</span>
                  <span className="font-semibold text-white shrink-0 tabular-nums">
                    {selectedPoint.type === 'fake'
                      ? 'Avoid Overpaying'
                      : selectedPoint.type === 'best'
                      ? 'Buy Now Recommended'
                      : 'Keep Watching'}
                  </span>
                </div>
              </div>

              {/* Bottom Left Glass Card: Price Comparison Verdict */}
              <div className="md:col-span-6 rounded-[26px] bg-white/[0.07] border border-white/20 backdrop-blur-2xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.25)] flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.14] border border-white/25 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">
                      True Deal Score
                    </div>
                    <div className="text-xs text-white/75 mt-0.5">
                      Verified against 180-day history
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-base font-bold text-white tabular-nums">
                    {dealScore}
                  </div>
                  <div className="text-[11px] text-white/65">All-Time Low</div>
                </div>
              </div>

              {/* Bottom Right Glass Card: Buy with Confidence */}
              <div className="md:col-span-6 rounded-[26px] bg-white/[0.09] border border-white/20 backdrop-blur-2xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.25)] flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.14] border border-white/25 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">
                      Buy with Confidence
                    </div>
                    <div className="text-xs text-white/75 mt-0.5">
                      Wait for the right price
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => scrollToSection('section-start', 'Start Saving')}
                  className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:bg-white/90 transition-colors cursor-pointer shrink-0"
                  aria-label="Go to Start Saving section"
                >
                  <ArrowRight className="w-4 h-4 stroke-[2]" />
                </button>
              </div>

            </div>
          </motion.div>

          {/* Right Side: Animated Minimal Copy */}
          <div className="lg:col-span-4 flex flex-col items-start lg:pl-6">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.5 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-xs font-medium text-white/60 tracking-wide mb-3"
            >
              03 · Price History · Real Deal Check
            </motion.span>

            <h2 className="text-3xl sm:text-4xl font-bold text-white leading-[1.15] tracking-[-0.02em] mb-4">
              <ScrollRevealWords
                text="Know the Real Price Before You Buy."
                delayOffset={0.05}
              />
            </h2>

            <motion.p
              initial={{ opacity: 0, y: 18, filter: 'blur(5px)' }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={{ once: false, amount: 0.4 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-white/75 text-[14.5px] leading-[1.7] max-w-[340px] mb-5"
            >
              Don’t fall for fake discounts. Check price history, understand
              what a product is really worth, and make your purchase when the
              timing is right.
            </motion.p>

            <motion.span
              initial={{ opacity: 0, x: 12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.5 }}
              transition={{ duration: 0.55, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="text-xs font-semibold text-white/90 tracking-wide"
            >
              Smarter Shopping. Better Prices. That’s PIXIE.
            </motion.span>
          </div>

        </div>
      </section>

      {/* =====================================================================
          SECTION 4: FINAL CENTERED CTA SECTION ("Start Saving")
         ===================================================================== */}
      <section
        id="section-start"
        className="w-full max-w-[1440px] mx-auto px-8 sm:px-14 lg:px-20 py-32 relative z-10 bg-transparent"
      >
        <div className="relative flex flex-col items-center justify-center text-center max-w-3xl mx-auto">
          {/* Center Ambient Light Glow behind the Frosted Glass Card */}
          <div
            className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-white/[0.12] blur-[110px]"
            aria-hidden="true"
          />

          {/* Centered Frosted Glass Showcase Container */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full rounded-[32px] bg-white/[0.07] border border-white/20 backdrop-blur-2xl px-8 py-14 sm:px-14 sm:py-16 shadow-[0_24px_80px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.25)] flex flex-col items-center"
          >
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.5 }}
              transition={{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="text-xs font-medium text-white/65 tracking-wide mb-4"
            >
              04 · Start Saving · Never Overpay Again
            </motion.span>

            <h2 className="text-3xl sm:text-5xl font-bold text-white leading-[1.12] tracking-[-0.02em] mb-5 max-w-xl">
              <ScrollRevealWords
                text="Ready to Stop Overpaying?"
                delayOffset={0.1}
              />
            </h2>

            <motion.p
              initial={{ opacity: 0, y: 18, filter: 'blur(5px)' }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={{ once: false, amount: 0.4 }}
              transition={{ duration: 0.6, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="text-white/80 text-[15px] sm:text-[16px] leading-[1.7] max-w-lg mb-9"
            >
              Start tracking the products you want and let PIXIE find the right
              price for you. Watch prices, catch drops, and save more without
              the effort.
            </motion.p>

            {/* Centered Get Started Button */}
            <motion.a
              href="http://localhost:3001"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.94 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: false, amount: 0.4 }}
              transition={{ duration: 0.5, delay: 0.34, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white text-black rounded-full px-8 py-4 text-[14.5px] font-semibold inline-flex items-center gap-2.5 hover:bg-white/90 transition-colors cursor-pointer whitespace-nowrap shadow-[0_0_35px_rgba(255,255,255,0.25)]"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 stroke-[2]" />
            </motion.a>

            {/* Subtle Animated Tagline Trio */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.4 }}
              transition={{ duration: 0.55, delay: 0.42, ease: [0.16, 1, 0.3, 1] }}
              className="mt-10 pt-6 border-t border-white/10 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-white/65"
            >
              <span>Watch prices. Catch drops. Save more.</span>
              <span aria-hidden="true">·</span>
              <span>Your personal price radar.</span>
              <span aria-hidden="true">·</span>
              <span>Let the price come to you.</span>
            </motion.div>
          </motion.div>
        </div>
      </section>
      </div>

      {/* Lightweight Interactive Modal for Button Actions */}
      {activeModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-neutral-950 border border-white/20 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-white">
                {activeModal.title}
              </h2>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                aria-label="Close modal"
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-white/80 leading-relaxed mb-6">
              {activeModal.description}
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="bg-white text-black rounded-full px-5 py-2 text-xs font-semibold hover:bg-white/90 transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Continue</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
