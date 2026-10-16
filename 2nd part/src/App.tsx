/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Link2,
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  Globe,
  Check,
  TrendingDown,
  LineChart,
  ShieldCheck,
  Sparkles,
  Tag,
  Sliders,
} from 'lucide-react';

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
      viewport={{ once: false, amount: 0.3 }}
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
      <path
        d="M2 19.5L8.5 3.8C9.2 2.2 11.5 2.2 12.2 3.8L16.5 13.8L11.8 19.5H2Z"
        fill="white"
      />
      <path
        d="M17.2 3.5C18.0 1.9 20.3 1.9 21.1 3.5L28.5 19.5H22.4L15.8 5.6L17.2 3.5Z"
        fill="white"
      />
      <circle cx="15" cy="18" r="1.8" fill="white" />
    </svg>
  );
}

const DROP_NODES = [
  { label: 'W1', price: 280, x: 30, y: 36 },
  { label: 'W2', price: 270, x: 115, y: 42 },
  { label: 'W3', price: 290, x: 200, y: 28 },
  { label: 'W4', price: 245, x: 285, y: 62 },
  { label: 'W5', price: 220, x: 370, y: 80 },
  { label: 'Drop', price: 185, x: 455, y: 122 },
  { label: 'Now', price: 168, x: 540, y: 136 },
] as const;

const WEEKLY_BARS = [
  { day: 'Mon', val: 90, price: '$280' },
  { day: 'Tue', val: 84, price: '$265' },
  { day: 'Wed', val: 78, price: '$245' },
  { day: 'Thu', val: 68, price: '$220' },
  { day: 'Fri', val: 56, price: '$198' },
  { day: 'Sat', val: 44, price: '$185' },
  { day: 'Sun', val: 34, price: '$168' },
] as const;

export default function App() {
  const [activeNav, setActiveNav] = useState<'track' | 'connect'>('track');

  // Section 1: URL Paste & Price Drop Graph states
  const [productUrl, setProductUrl] = useState<string>('');
  const [desiredDropPct, setDesiredDropPct] = useState<number>(25);
  const [trackingStarted, setTrackingStarted] = useState<boolean>(false);
  const [selectedGraphNodeIdx, setSelectedGraphNodeIdx] = useState<number>(6);

  // Section 2: Account & Notification Channels states
  const [emailInput, setEmailInput] = useState<string>('you@example.com');
  const [connectedChannels, setConnectedChannels] = useState<string[]>([
    'email',
    'push',
  ]);
  const [alertRules, setAlertRules] = useState<string[]>([
    'target-hit',
    'all-time-low',
    'fake-sale-shield',
  ]);

  const activeNode = DROP_NODES[selectedGraphNodeIdx];

  const toggleChannel = (id: string) => {
    setConnectedChannels((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleRule = (id: string) => {
    setAlertRules((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const scrollToSubSection = (id: string, navKey: 'track' | 'connect') => {
    setActiveNav(navKey);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen w-full bg-transparent text-white flex flex-col justify-between relative overflow-x-hidden select-none">
      {/* Spline Background Dark Overlay for text legibility */}
      <div className="fixed inset-0 z-[1] bg-black/55 pointer-events-none" aria-hidden="true" />
      {/* =====================================================================
          TOP NAVIGATION BAR
         ===================================================================== */}
      <div className="w-full max-w-[1440px] mx-auto px-8 sm:px-14 lg:px-20 pt-8 sm:pt-10 relative z-20">
        <header className="w-full flex items-center justify-between">
          {/* Brand Logo */}
          <a
            href="#studio-top"
            onClick={(e) => {
              e.preventDefault();
              scrollToSubSection('studio-top', 'track');
            }}
            className="flex items-center gap-2.5 text-white cursor-pointer focus-visible:outline-none"
          >
            <PixieLogoMark />
            <span className="text-[20px] font-bold tracking-tight text-white">
              PIXIE
            </span>
          </a>

          {/* Center Navigation Links (2 Clean Sections) */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-10"
          >
            <button
              type="button"
              onClick={() => scrollToSubSection('studio-top', 'track')}
              className="relative py-1.5 text-[14px] font-normal text-white transition-opacity cursor-pointer whitespace-nowrap"
            >
              Track & Drop Graphs
              {activeNav === 'track' && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-white rounded-full"
                  aria-hidden="true"
                />
              )}
            </button>
            <button
              type="button"
              onClick={() => scrollToSubSection('studio-connect', 'connect')}
              className="relative py-1.5 text-[14px] font-normal text-white/85 hover:text-white transition-opacity cursor-pointer whitespace-nowrap"
            >
              Connect Account
              {activeNav === 'connect' && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-white rounded-full"
                  aria-hidden="true"
                />
              )}
            </button>
          </nav>

          {/* Right Action CTA */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => scrollToSubSection('studio-connect', 'connect')}
              className="bg-white text-black rounded-full px-5 py-2.5 text-[13.5px] font-semibold inline-flex items-center gap-2 hover:bg-white/90 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>Connect Alerts</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2]" />
            </button>
          </div>
        </header>
      </div>

      {/* =====================================================================
          SECTION 1 (TOP): PASTE PRODUCT LINK URL + LIVE PRICE DROP GRAPHS
          Graphs placed right at the top alongside the URL Paste Studio
         ===================================================================== */}
      <section
        id="studio-top"
        className="w-full max-w-[1440px] mx-auto px-8 sm:px-14 lg:px-20 py-14 lg:py-20 relative z-10"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 items-start gap-10 lg:gap-8">
          
          {/* LEFT COLUMN (5 cols): Headline + Paste Product Link URL Studio */}
          <div className="lg:col-span-5 flex flex-col items-start">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.4 }}
              transition={{ duration: 0.5 }}
              className="text-xs font-medium text-white/60 tracking-wide mb-3"
            >
              01 · Track & Price Drop Analytics
            </motion.span>

            <h1 className="text-[36px] sm:text-[46px] font-bold text-white leading-[1.1] tracking-[-0.02em] mb-4">
              <ScrollRevealWords
                text="Paste a Link. Watch the Price Drop."
                delayOffset={0.05}
              />
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 16, filter: 'blur(5px)' }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={{ once: false, amount: 0.4 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-white/75 text-[14.5px] leading-[1.68] mb-7"
            >
              Paste any product link below, set your target price drop, and track
              real-time price movements on the live graphs.
            </motion.p>

            {/* Frosted Glass URL Paste Box */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-full rounded-[26px] bg-white/[0.08] border border-white/20 backdrop-blur-2xl p-6 shadow-[0_24px_80px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.25)]"
            >
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/[0.14] border border-white/20 flex items-center justify-center">
                    <Link2 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">
                      Paste Product Link URL
                    </div>
                    <div className="text-[11px] text-white/65">
                      Direct link to any online product page
                    </div>
                  </div>
                </div>
              </div>

              {/* URL Input + Track Button */}
              <div className="rounded-2xl bg-black/60 border border-white/20 p-2 pl-3.5 flex items-center gap-2 mb-5">
                <Globe className="w-4 h-4 text-white/60 shrink-0" />
                <input
                  type="text"
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  placeholder="https://paste-product-url-here..."
                  aria-label="Paste Product Link URL"
                  className="bg-transparent text-xs text-white placeholder:text-white/40 focus:outline-none w-full truncate"
                />
                <button
                  type="button"
                  onClick={() => setTrackingStarted(!trackingStarted)}
                  className="bg-white text-black rounded-xl px-4 py-2.5 text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-white/90 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  {trackingStarted ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Tracking</span>
                    </>
                  ) : (
                    <>
                      <span>Track Link</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2]" />
                    </>
                  )}
                </button>
              </div>

              {/* Desired Drop Percentage Selector */}
              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center justify-between text-xs text-white/75 mb-2.5">
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Target Drop Threshold</span>
                  </span>
                  <span className="font-semibold text-white tabular-nums">
                    Notify at -{desiredDropPct}% Drop
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 25, 35, 45].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setDesiredDropPct(pct)}
                      className={`py-2 rounded-xl text-xs font-semibold tabular-nums border transition-colors cursor-pointer ${
                        desiredDropPct === pct
                          ? 'bg-white text-black border-white'
                          : 'bg-white/[0.05] text-white/75 border-white/10 hover:bg-white/[0.12]'
                      }`}
                    >
                      -{pct}%
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* RIGHT COLUMN (7 cols): PRICE DROP GRAPHS PLACED RIGHT AT THE TOP */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.25 }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="lg:col-span-7 relative flex flex-col gap-5"
          >
            {/* Ambient Light Glow behind Top Right Graphs */}
            <div
              className="pointer-events-none absolute top-4 right-12 w-80 h-80 rounded-full bg-white/[0.13] blur-[95px]"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute bottom-4 left-12 w-64 h-64 rounded-full bg-white/[0.08] blur-[80px]"
              aria-hidden="true"
            />

            {/* TOP GRAPH CARD: Interactive Price Drop Trajectory Curve */}
            <div className="relative rounded-[28px] bg-white/[0.08] border border-white/20 backdrop-blur-2xl p-6 shadow-[0_24px_80px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.25)]">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/[0.14] border border-white/20 flex items-center justify-center">
                    <LineChart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-[15px] font-semibold text-white">
                      Price Drop Detection Graph
                    </div>
                    <div className="text-xs text-white/70">
                      Real-time curve showing when price crosses your target line
                    </div>
                  </div>
                </div>

                <div className="rounded-full bg-white text-black px-3.5 py-1 text-xs font-semibold tabular-nums">
                  {activeNode.label}: ${activeNode.price}
                </div>
              </div>

              {/* SVG Price Drop Line Chart */}
              <div className="rounded-2xl bg-white/[0.04] border border-white/12 p-4 mb-3">
                <svg
                  viewBox="0 0 580 155"
                  className="w-full h-36 overflow-visible"
                  role="img"
                  aria-label="Price drop detection graph"
                >
                  <defs>
                    <linearGradient id="topDropGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
                      <stop offset="100%" stopColor="rgba(255,255,255,0.0)" />
                    </linearGradient>
                  </defs>

                  {/* Target Threshold Dashed Line */}
                  <line
                    x1="20"
                    y1="100"
                    x2="560"
                    y2="100"
                    stroke="rgba(255,255,255,0.35)"
                    strokeDasharray="5 5"
                    strokeWidth="1.2"
                  />
                  <text
                    x="26"
                    y="92"
                    fill="rgba(255,255,255,0.65)"
                    fontSize="10"
                    fontWeight="600"
                  >
                    Target Price Threshold ($200)
                  </text>

                  {/* Area under curve */}
                  <polygon
                    points="30,36 115,42 200,28 285,62 370,80 455,122 540,136 540,150 30,150"
                    fill="url(#topDropGrad)"
                  />

                  {/* Main Price Curve */}
                  <polyline
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="30,36 115,42 200,28 285,62 370,80 455,122 540,136"
                  />

                  {/* Interactive Data Nodes */}
                  {DROP_NODES.map((node, idx) => {
                    const isSelected = idx === selectedGraphNodeIdx;
                    return (
                      <g
                        key={node.label}
                        className="cursor-pointer"
                        onClick={() => setSelectedGraphNodeIdx(idx)}
                      >
                        {isSelected && (
                          <circle
                            cx={node.x}
                            cy={node.y}
                            r="13"
                            fill="rgba(255,255,255,0.22)"
                          />
                        )}
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={isSelected ? '6' : '4.5'}
                          fill={isSelected ? '#ffffff' : '#141414'}
                          stroke="#ffffff"
                          strokeWidth={isSelected ? '2.5' : '1.8'}
                        />
                        <text
                          x={node.x}
                          y={node.y - 11}
                          textAnchor="middle"
                          fill={
                            isSelected ? '#ffffff' : 'rgba(255,255,255,0.65)'
                          }
                          fontSize="11"
                          fontWeight={isSelected ? '700' : '500'}
                        >
                          ${node.price}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Checkpoint Selector Row */}
                <div className="grid grid-cols-7 gap-1.5 pt-2 border-t border-white/10">
                  {DROP_NODES.map((node, idx) => {
                    const isSelected = idx === selectedGraphNodeIdx;
                    return (
                      <button
                        key={node.label}
                        type="button"
                        onClick={() => setSelectedGraphNodeIdx(idx)}
                        className={`py-1 rounded-lg text-xs tabular-nums transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-white text-black font-semibold'
                            : 'text-white/65 hover:text-white hover:bg-white/[0.06]'
                        }`}
                      >
                        {node.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-white/80">
                <span>Price dropped 40% below initial listing ($280 → $168)</span>
                <span className="font-semibold text-white">Drop Confirmed</span>
              </div>
            </div>

            {/* BOTTOM ROW OF RIGHT COLUMN: Weekly Drop Bar Graph + Confidence Card */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5">
              {/* Weekly Drop Bar Graph (7 cols) */}
              <div className="sm:col-span-7 rounded-[26px] bg-white/[0.08] border border-white/20 backdrop-blur-2xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.25)]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <TrendingDown className="w-4 h-4" />
                    <span>Daily Drop Progression</span>
                  </span>
                  <span className="text-xs font-semibold text-white tabular-nums">
                    -$112 Saved
                  </span>
                </div>

                <div className="grid grid-cols-7 gap-2 items-end h-24 pt-3">
                  {WEEKLY_BARS.map((bar, idx) => {
                    const isLowest = idx === 6;
                    return (
                      <div
                        key={bar.day}
                        className="h-full flex flex-col justify-end items-center gap-1.5"
                      >
                        <div className="w-full h-full flex items-end justify-center">
                          <div
                            style={{ height: `${bar.val}%` }}
                            className={`w-full rounded-lg border transition-all ${
                              isLowest
                                ? 'bg-white border-white shadow-[0_0_16px_rgba(255,255,255,0.4)]'
                                : 'bg-white/[0.12] border-white/20'
                            }`}
                          />
                        </div>
                        <span
                          className={`text-[10px] tabular-nums ${
                            isLowest
                              ? 'text-white font-semibold'
                              : 'text-white/60'
                          }`}
                        >
                          {bar.day}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Buy Timing Signal Card (5 cols) */}
              <div className="sm:col-span-5 rounded-[26px] bg-white/[0.07] border border-white/20 backdrop-blur-2xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.25)] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 stroke-[2]" />
                  </div>
                  <span className="text-xs font-bold text-white tabular-nums">
                    98% Signal
                  </span>
                </div>
                <div className="my-2">
                  <div className="text-sm font-semibold text-white">
                    Right Time to Buy
                  </div>
                  <div className="text-xs text-white/70 mt-0.5 leading-relaxed">
                    Current price is at its lowest point in 180 days.
                  </div>
                </div>
                <div className="text-[11px] text-white/80 font-medium pt-2 border-t border-white/10">
                  Fake Discount Shield: Active
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* =====================================================================
          SECTION 2 (BOTTOM): CONNECT ACCOUNT & NOTIFICATION PREFERENCES
         ===================================================================== */}
      <section
        id="studio-connect"
        className="w-full max-w-[1440px] mx-auto px-8 sm:px-14 lg:px-20 py-20 border-t border-white/10 relative z-10"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-12 lg:gap-10">
          
          {/* Left Side: Frosted Glass Account & Notification Channels Hub */}
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.25 }}
            transition={{ duration: 0.65 }}
            className="lg:col-span-7 relative flex items-center justify-center lg:justify-start"
          >
            <div
              className="pointer-events-none absolute top-8 left-16 w-72 h-72 rounded-full bg-white/[0.12] blur-[95px]"
              aria-hidden="true"
            />

            <div className="relative w-full max-w-[660px] grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Primary Account Sync & Alert Channels Card (7 cols) */}
              <div className="md:col-span-7 rounded-[28px] bg-white/[0.08] border border-white/20 backdrop-blur-2xl p-6 sm:p-7 shadow-[0_24px_80px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.25)]">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/[0.14] border border-white/20 flex items-center justify-center">
                      <Bell className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-[15px] font-semibold text-white">
                        Connect Account for Alerts
                      </div>
                      <div className="text-xs text-white/70">
                        Choose where PIXIE sends price drops
                      </div>
                    </div>
                  </div>
                </div>

                {/* Primary Email Account Input */}
                <div className="rounded-2xl bg-black/50 border border-white/15 p-3 mb-4">
                  <div className="text-[11px] text-white/60 mb-1.5">
                    Account Email for Notifications
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      aria-label="Account email"
                      className="bg-transparent text-xs font-medium text-white focus:outline-none w-full"
                    />
                    <span className="px-2.5 py-1 rounded-full bg-white text-black text-[11px] font-semibold shrink-0">
                      Connected
                    </span>
                  </div>
                </div>

                {/* Interactive Channel Toggles */}
                <div className="space-y-2.5">
                  {[
                    {
                      id: 'email',
                      name: 'Instant Email Alert',
                      desc: 'Direct drop link + price history snapshot',
                      icon: Mail,
                    },
                    {
                      id: 'push',
                      name: 'Mobile Push Notification',
                      desc: 'Instant alert when target price hits',
                      icon: Smartphone,
                    },
                    {
                      id: 'sms',
                      name: 'SMS Text Alert',
                      desc: 'For urgent all-time price lows',
                      icon: MessageSquare,
                    },
                  ].map((ch) => {
                    const IconComp = ch.icon;
                    const isConnected = connectedChannels.includes(ch.id);
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => toggleChannel(ch.id)}
                        className={`w-full rounded-2xl p-3.5 border flex items-center justify-between gap-3 text-left transition-all cursor-pointer ${
                          isConnected
                            ? 'bg-white/[0.14] border-white/30 text-white'
                            : 'bg-white/[0.04] border-white/10 text-white/65 hover:bg-white/[0.08]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                            <IconComp className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white">
                              {ch.name}
                            </div>
                            <div className="text-[11px] text-white/65">
                              {ch.desc}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-semibold shrink-0 transition-colors ${
                            isConnected
                              ? 'bg-white text-black'
                              : 'bg-white/10 text-white/75 border border-white/15'
                          }`}
                        >
                          {isConnected ? 'Connected' : 'Connect'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Stack (5 cols): Smart Notification Rules & Sync */}
              <div className="md:col-span-5 flex flex-col justify-between gap-5">
                <div className="rounded-[26px] bg-white/[0.07] border border-white/20 backdrop-blur-2xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.25)] flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-white">
                        Alert Rules
                      </span>
                      <Sliders className="w-4 h-4 text-white/75" />
                    </div>

                    <div className="space-y-2.5">
                      {[
                        {
                          id: 'target-hit',
                          label: 'Target Price Reached',
                        },
                        {
                          id: 'all-time-low',
                          label: 'New Historical Low',
                        },
                        {
                          id: 'fake-sale-shield',
                          label: 'Fake Discount Warning',
                        },
                      ].map((rule) => {
                        const active = alertRules.includes(rule.id);
                        return (
                          <button
                            key={rule.id}
                            type="button"
                            onClick={() => toggleRule(rule.id)}
                            className={`w-full rounded-xl px-3.5 py-2.5 border flex items-center justify-between text-xs transition-all cursor-pointer ${
                              active
                                ? 'bg-white/[0.14] border-white/30 text-white'
                                : 'bg-white/[0.04] border-white/10 text-white/55'
                            }`}
                          >
                            <span className="truncate">{rule.label}</span>
                            <span
                              className={`w-4 h-4 rounded-md flex items-center justify-center border shrink-0 ml-2 ${
                                active
                                  ? 'bg-white text-black border-white'
                                  : 'border-white/30 text-transparent'
                              }`}
                            >
                              <Check className="w-3 h-3 stroke-[2.5]" />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/75">
                    <span>Active Channels</span>
                    <span className="font-semibold text-white tabular-nums">
                      {connectedChannels.length} Connected
                    </span>
                  </div>
                </div>

                {/* Instant Sync Status Mini Card */}
                <div className="rounded-[24px] bg-white/[0.09] border border-white/20 backdrop-blur-2xl p-5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">
                        Account Synced
                      </div>
                      <div className="text-[11px] text-white/70">
                        24/7 price radar active
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-white">Live</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Side: Minimal Copy */}
          <div className="lg:col-span-5 flex flex-col items-start lg:pl-6">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.4 }}
              transition={{ duration: 0.5 }}
              className="text-xs font-medium text-white/60 tracking-wide mb-3"
            >
              02 · Connect & Get Notified
            </motion.span>

            <h2 className="text-3xl sm:text-4xl font-bold text-white leading-[1.15] tracking-[-0.02em] mb-4">
              <ScrollRevealWords
                text="Get Notified the Moment It Drops."
                delayOffset={0.05}
              />
            </h2>

            <motion.p
              initial={{ opacity: 0, y: 18, filter: 'blur(5px)' }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={{ once: false, amount: 0.4 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-white/75 text-[14.5px] leading-[1.7] max-w-[380px] mb-5"
            >
              Connect your account and choose how you want to be notified. The
              moment a tracked item hits your target price, PIXIE sends a
              verified drop alert straight to you.
            </motion.p>

            <span className="text-xs font-semibold text-white/90 tracking-wide">
              Let the price come to you.
            </span>
          </div>

        </div>
      </section>
    </div>
  );
}
