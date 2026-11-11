/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Link2,
  Bell,
  Mail,
  Globe,
  Check,
  LineChart,
  Tag,
} from 'lucide-react';
import { connectEmail, deleteProduct, getAlertEmail, getProductHistory, listProducts, setDropGoal, trackProduct, type TrackedProduct } from './lib/api';

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

type GraphNode = {
  label: string;
  price: number | null;
  x: number;
  y: number;
  available: boolean;
};

function formatWhen(value?: string | null) {
  if (!value) return '';
  const when = new Date(value);
  if (Number.isNaN(when.getTime())) return value;
  return when.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function wishlistGroups(products: TrackedProduct[]) {
  const seen = new Set<string>();
  const groups = [];
  for (const product of products) {
    const key = product.pair_id || `solo-${product.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const members = product.pair_id
      ? products.filter((item) => item.pair_id === product.pair_id)
      : [product];
    members.sort((a, b) => (a.platform === 'amazon' ? -1 : b.platform === 'amazon' ? 1 : 0));
    groups.push({ key, members });
  }
  return groups;
}

const POINT_GAP = 148;
const POINT_PAD = 88;

function toGraphNodes(
  history: { month: string; price: number | null; recorded_at?: string; available?: boolean }[],
  scale?: { lowest: number; highest: number },
): GraphNode[] {
  if (history.length === 0) {
    return DROP_NODES.map((node) => ({ ...node, available: true }));
  }
  const priced = history.filter((point) => point.available !== false && point.price != null);
  const prices = priced.map((point) => point.price as number);
  // Both store lines share one high and low, so a cheaper price sits lower.
  const lowest = scale?.lowest ?? (prices.length ? Math.min(...prices) : 0);
  const highest = scale?.highest ?? (prices.length ? Math.max(...prices) : 1);
  const span = highest - lowest || 1;
  const lastIndex = history.length - 1;
  const nodes = history.map((point, index) => {
    const available = point.available !== false && point.price != null;
    return {
      label: point.recorded_at ? formatWhen(point.recorded_at) : point.month,
      price: available ? Math.round((point.price as number) * 100) / 100 : null,
      available,
      x: history.length === 1 ? 290 : POINT_PAD + index * POINT_GAP,
      y: available ? 28 + ((highest - (point.price as number)) / span) * 108 : 0,
    };
  });
  return nodes.map((node, index) => {
    if (node.available) return node;
    let nearest: GraphNode | undefined;
    for (let step = 1; step < nodes.length; step += 1) {
      const before = nodes[index - step];
      const after = nodes[index + step];
      if (before?.available) {
        nearest = before;
        break;
      }
      if (after?.available) {
        nearest = after;
        break;
      }
    }
    const lineY = nearest ? nearest.y : 120;
    return { ...node, y: Math.min(lineY + 16, 150) };
  });
}

function lineSegments(nodes: GraphNode[], xOffset = 0) {
  const segments: string[] = [];
  let current: string[] = [];
  const flush = () => {
    if (current.length > 1) segments.push(current.join(' '));
    current = [];
  };
  nodes.forEach((node) => {
    if (!node.available) {
      flush();
      return;
    }
    current.push(`${node.x + xOffset},${node.y}`);
  });
  flush();
  return segments;
}

export default function App() {
  // Section 1: URL Paste & Price Drop Graph states
  const [productUrl, setProductUrl] = useState<string>('');
  const [desiredDropPct, setDesiredDropPct] = useState<number>(25);
  const [trackingStarted, setTrackingStarted] = useState<boolean>(false);
  const [selectedGraphNodeIdx, setSelectedGraphNodeIdx] = useState<number>(6);
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>(() => toGraphNodes([]));
  const [otherNodes, setOtherNodes] = useState<GraphNode[]>([]);
  const [comparisonNote, setComparisonNote] = useState('');
  const [targetPrice, setTargetPrice] = useState(200);
  const [statusText, setStatusText] = useState('Paste a link to see a live price.');
  const [, setDealScore] = useState('—');
  const [verdict, setVerdict] = useState('Waiting for a tracked product');
  const [, setSavedAmount] = useState(0);
  const [usingLivePrices, setUsingLivePrices] = useState(false);
  const [trackedProducts, setTrackedProducts] = useState<TrackedProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [emailNotice, setEmailNotice] = useState('');
  const [emailConnecting, setEmailConnecting] = useState(false);
  const [alertEmail, setAlertEmail] = useState('');
  const [savedAlertEmail, setSavedAlertEmail] = useState('');
  const [priceNotes, setPriceNotes] = useState<string[]>([]);
  const graphScrollRef = useRef<HTMLDivElement>(null);

  const activeNode = graphNodes[Math.min(selectedGraphNodeIdx, Math.max(graphNodes.length - 1, 0))];
  const scaleNodes = (otherNodes.length > 0 ? [...graphNodes, ...otherNodes] : graphNodes).filter(
    (node) => node.available && node.price != null,
  );
  const highestPrice = scaleNodes.length ? Math.max(...scaleNodes.map((node) => node.price as number)) : 0;
  const lowestPrice = scaleNodes.length ? Math.min(...scaleNodes.map((node) => node.price as number)) : 0;
  const priceSpan = highestPrice - lowestPrice || 1;
  const targetLineY = usingLivePrices
    ? Math.min(140, Math.max(24, 28 + ((highestPrice - targetPrice) / priceSpan) * 108))
    : 100;
  const chartWidth = Math.max(
    580,
    ...graphNodes.map((node) => node.x + 96),
    ...otherNodes.map((node) => node.x + 118),
  );
  const curveSegments = lineSegments(graphNodes);
  const otherSegments = lineSegments(otherNodes, 22);
  const areaSegments = curveSegments.map((segment) => {
    const pairs = segment.split(' ');
    const firstX = pairs[0].split(',')[0];
    const lastX = pairs[pairs.length - 1].split(',')[0];
    return `${segment} ${lastX},150 ${firstX},150`;
  });
  const formatAmount = (amount: number) => {
    const value = Math.round(Number(amount) * 100) / 100;
    const hasPaise = Math.abs(value - Math.round(value)) >= 0.01;
    return value.toLocaleString('en-IN', {
      minimumFractionDigits: hasPaise ? 2 : 0,
      maximumFractionDigits: hasPaise ? 2 : 0,
    });
  };
  const money = (amount: number) =>
    `${usingLivePrices ? '₹' : '$'}${formatAmount(amount)}`;
  const rupee = (amount?: number | null) =>
    amount == null ? '—' : `₹${formatAmount(amount)}`;
  const selectedProduct = trackedProducts.find((product) => product.id === selectedProductId);
  const emailIsConnected =
    savedAlertEmail !== '' &&
    alertEmail.trim().toLowerCase() === savedAlertEmail.trim().toLowerCase();

  const showProduct = async (productId: number, nextTarget?: number, platform?: string) => {
    const data = await getProductHistory(productId);
    const partnerHistory = data.comparison?.found ? data.comparison.history || [] : [];
    const selectedPlatform = data.platform || platform || '';
    // Gold is always Amazon. Purple is always Flipkart, even if the
    // opened row is the Flipkart one.
    const amazonHistory = selectedPlatform === 'flipkart' ? partnerHistory : data.history;
    const flipkartHistory = selectedPlatform === 'flipkart' ? data.history : partnerHistory;
    const prices = [...amazonHistory, ...flipkartHistory]
      .filter((point) => point.available !== false && point.price != null)
      .map((point) => point.price as number);
    const scale = prices.length
      ? { lowest: Math.min(...prices), highest: Math.max(...prices) }
      : undefined;
    // Gold is the Amazon line. Purple is the Flipkart line.
    // A Flipkart-only product stays purple instead of borrowing the gold line.
    const amazonNodes = amazonHistory.length ? toGraphNodes(amazonHistory, scale) : [];
    const flipkartNodes = flipkartHistory.length ? toGraphNodes(flipkartHistory, scale) : [];
    const hasLivePrices = amazonNodes.length > 0 || flipkartNodes.length > 0;
    if (!hasLivePrices) {
      setGraphNodes(toGraphNodes([]));
      setOtherNodes([]);
    } else {
      setGraphNodes(amazonNodes);
      setOtherNodes(flipkartNodes);
    }
    setComparisonNote(data.comparison?.note || '');
    const notes: string[] = [];
    const mention = (store: string, available?: boolean, checkedAt?: string | null) => {
      if (available === false) {
        const when = formatWhen(checkedAt);
        notes.push(`${store}: Price is not available${when ? ` · ${when}` : ''}`);
      }
    };
    if (selectedPlatform === 'flipkart') {
      mention('Flipkart', data.price_available, data.checked_at);
      if (data.comparison?.found) {
        mention('Amazon', data.comparison.other?.price_available, data.comparison.other?.checked_at);
      }
    } else {
      mention('Amazon', data.price_available, data.checked_at);
      if (data.comparison?.found) {
        mention('Flipkart', data.comparison.other?.price_available, data.comparison.other?.checked_at);
      }
    }
    setPriceNotes(notes);
    const axis = amazonNodes.length ? amazonNodes : flipkartNodes;
    setSelectedGraphNodeIdx(Math.max((hasLivePrices ? axis.length : 1) - 1, 0));
    setUsingLivePrices(hasLivePrices);
    if (nextTarget != null) {
      setTargetPrice(nextTarget);
    }
    setDealScore(`${data.analytics.deal_score}/10`);
    setVerdict(data.analytics.verdict || 'From saved prices');
  };

  const openTrackedProduct = async (product: TrackedProduct) => {
    setSelectedProductId(product.id);
    setTrackingStarted(true);
    setStatusText(product.title || product.name || 'Tracked product');
    setSavedAmount(product.saved || 0);
    if (product.drop_goal_percent != null) {
      setDesiredDropPct(Math.round(product.drop_goal_percent));
    }
    await showProduct(product.id, product.target_price, product.platform);
  };

  const connectMailbox = async () => {
    const email = alertEmail.trim();
    if (!email) {
      setEmailNotice('Enter your email address.');
      return;
    }
    setEmailConnecting(true);
    try {
      const result = await connectEmail(email);
      setSavedAlertEmail(email);
      setAlertEmail(email);
      setEmailNotice(result.sent ? '' : result.message);
    } catch (error) {
      setEmailNotice(error instanceof Error ? error.message : 'Could not connect email.');
    } finally {
      setEmailConnecting(false);
    }
  };

  const removeTrackedProduct = async (productId: number) => {
    const chosen = trackedProducts.find((product) => product.id === productId);
    const ids = chosen?.pair_id
      ? trackedProducts.filter((product) => product.pair_id === chosen.pair_id).map((product) => product.id)
      : [productId];
    for (const id of ids) {
      await deleteProduct(id);
    }
    const refreshed = await listProducts();
    const products = refreshed.products || [];
    setTrackedProducts(products);
    setPendingDeleteId(null);
    if (products.length === 0) {
      setSelectedProductId(null);
      setTrackingStarted(false);
      setUsingLivePrices(false);
      setGraphNodes(toGraphNodes([]));
      setOtherNodes([]);
      setComparisonNote('');
      setPriceNotes([]);
      setSavedAmount(0);
      setDealScore('—');
      setVerdict('Waiting for a tracked product');
      setStatusText('Paste a link to see a live price.');
      return;
    }
    if (selectedProductId != null && ids.includes(selectedProductId)) {
      await openTrackedProduct(products[0]);
    }
  };

  useEffect(() => {
    const graph = graphScrollRef.current;
    if (graph) graph.scrollLeft = graph.scrollWidth;
  }, [selectedProductId, graphNodes.length, otherNodes.length]);

  useEffect(() => {
    getAlertEmail()
      .then((data) => {
        const email = (data.email || '').trim();
        setAlertEmail(email);
        setSavedAlertEmail(email);
      })
      .catch(() => {});
    listProducts()
      .then(async (data) => {
        const products = data.products || [];
        setTrackedProducts(products);
        const first = wishlistGroups(products)[0];
        const product = first?.members.find((item) => item.platform === 'amazon') || first?.members[0];
        if (product) {
          await openTrackedProduct(product);
        }
      })
      .catch(() => {
        setStatusText('Start the backend, then paste a product link.');
      });
  }, []);

  const applyDropGoal = async (percent: number) => {
    setDesiredDropPct(percent);
    if (selectedProductId == null) {
      return;
    }
    try {
      const updated = await setDropGoal(selectedProductId, percent);
      setTrackedProducts((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
      if (updated.target_price != null) {
        setTargetPrice(updated.target_price);
      }
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : 'Could not update that target.');
    }
  };

  const trackPastedLink = async () => {
    const url = productUrl.trim();
    if (!url) {
      setStatusText('Paste an Amazon or Flipkart link first.');
      return;
    }
    setStatusText('Checking the price...');
    try {
      const result = await trackProduct(url, desiredDropPct);
      setTrackingStarted(true);
      setStatusText(result.product.title || result.product.name || 'Tracking');
      setSavedAmount(result.product.saved || 0);
      const refreshed = await listProducts();
      setTrackedProducts(refreshed.products || []);
      await showProduct(result.product.id, result.target_price, result.product.platform);
      setSelectedProductId(result.product.id);
    } catch (error) {
      setTrackingStarted(false);
      setStatusText(error instanceof Error ? error.message : 'Could not track that link.');
    }
  };

  return (
    <div className="h-screen w-full bg-transparent text-white flex flex-col relative overflow-hidden select-none">
      {/* Spline Background Dark Overlay for text legibility */}
      <div className="fixed inset-0 z-[1] bg-black/55 pointer-events-none" aria-hidden="true" />
      {/* =====================================================================
          TOP NAVIGATION BAR
         ===================================================================== */}
      <div className="w-full max-w-[1440px] mx-auto px-8 sm:px-14 lg:px-20 pt-4 shrink-0 relative z-20">
        <header className="w-full flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5 text-white">
            <PixieLogoMark />
            <span className="text-[20px] font-bold tracking-tight text-white">
              PIXIE
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
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
        className="w-full max-w-[1440px] mx-auto px-8 sm:px-14 lg:px-20 py-4 relative z-10 flex-1 min-h-0 overflow-hidden flex flex-col"
      >
        <div className="h-full grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] items-stretch gap-6">
          <aside className="lg:order-2 min-h-0 h-full overflow-hidden rounded-[26px] bg-white/[0.08] border border-white/20 backdrop-blur-2xl p-5 shadow-[0_24px_80px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.25)] flex flex-col">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-white">Wishlist</div>
              <div className="text-[11px] font-semibold tabular-nums text-white/70">
                {wishlistGroups(trackedProducts).length}
              </div>
            </div>
            <div className="text-[11px] text-white/65 mt-1 mb-4">
              Tracked products saved on this computer.
            </div>
            {trackedProducts.length === 0 ? (
              <p className="text-xs text-white/60">No products yet. Paste a link to start tracking.</p>
            ) : (
              <div className="product-scroll min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-2">
                {wishlistGroups(trackedProducts).map((group) => {
                  const product = group.members.find((item) => item.platform === 'amazon') || group.members[0];
                  const selected = group.members.some((item) => item.id === selectedProductId);
                  const asking = pendingDeleteId === product.id;
                  const name = product.title || product.name || 'Tracked product';
                  return (
                    <div
                      key={group.key}
                      className={`w-full rounded-xl px-3 py-2.5 border text-left text-xs ${
                        selected
                          ? 'bg-white text-black border-white'
                          : 'bg-white/[0.05] text-white border-white/15'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          void openTrackedProduct(product);
                        }}
                        className="flex w-full items-center gap-2 text-left cursor-pointer"
                      >
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt=""
                            referrerPolicy="no-referrer"
                            className={`h-10 w-10 shrink-0 rounded-lg object-contain ${
                              selected ? 'bg-black/5' : 'bg-white'
                            }`}
                          />
                        ) : null}
                        <div className="min-w-0">
                        <div className="font-medium truncate">{name}</div>
                        {group.members.map((item) => {
                          const flipkart = item.platform === 'flipkart';
                          const ink = flipkart
                            ? selected
                              ? '#a21caf'
                              : '#E879F9'
                            : selected
                              ? '#8a6230'
                              : '#EFCF92';
                          return (
                            <div
                              key={item.id}
                              className="mt-1 flex items-center gap-1.5 truncate tabular-nums"
                              style={{ color: ink }}
                            >
                              <span
                                className={`inline-block shrink-0 rounded-full ${
                                  flipkart ? 'h-0.5 w-4' : 'h-1.5 w-4'
                                }`}
                                style={{ backgroundColor: flipkart ? '#E879F9' : '#EFCF92' }}
                              />
                              <span className="truncate">
                                {flipkart ? 'Flipkart' : 'Amazon'}
                                {' · '}
                                {item.price_available === false
                                  ? 'Price is not available'
                                  : item.price == null
                                    ? '—'
                                    : rupee(item.price)}
                              </span>
                            </div>
                          );
                        })}
                        <div className={`mt-0.5 truncate tabular-nums ${selected ? 'text-black/80' : 'text-white/85'}`}>
                          Target{' '}
                          {product.drop_goal_percent != null
                            ? `−${Math.round(product.drop_goal_percent)}% · `
                            : ''}
                          {rupee(product.target_price)}
                        </div>
                        </div>
                      </button>
                      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                        {group.members.map((item) =>
                          item.url ? (
                            <a
                              key={`link-${item.id}`}
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] underline"
                              style={{
                                color:
                                  item.platform === 'flipkart'
                                    ? selected
                                      ? '#a21caf'
                                      : '#E879F9'
                                    : selected
                                      ? '#8a6230'
                                      : '#EFCF92',
                              }}
                            >
                              {item.platform === 'flipkart' ? 'Flipkart' : 'Amazon'}
                            </a>
                          ) : null,
                        )}
                      </div>
                      {asking ? (
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className={selected ? 'text-black/80' : 'text-white/80'}>
                            Remove this?
                          </span>
                          <span className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPendingDeleteId(null)}
                              className={`px-2 py-1 rounded-lg border cursor-pointer ${
                                selected ? 'border-black/20' : 'border-white/20'
                              }`}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                void removeTrackedProduct(product.id).catch(() => {
                                  setStatusText('Could not delete that product.');
                                  setPendingDeleteId(null);
                                });
                              }}
                              className="px-2 py-1 rounded-lg bg-black text-white cursor-pointer"
                            >
                              Delete
                            </button>
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPendingDeleteId(product.id)}
                          className={`mt-1.5 cursor-pointer ${selected ? 'text-black/70' : 'text-white/60'} hover:underline`}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </aside>

          <div className="lg:order-1 min-h-0 h-full grid grid-cols-1 lg:grid-cols-12 items-stretch gap-6">
          {/* LEFT COLUMN: Headline + Paste Product Link URL Studio */}
          <div className="lg:col-span-5 flex flex-col items-start min-h-0 h-full">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.4 }}
              transition={{ duration: 0.5 }}
              className="text-xs font-medium text-white/60 tracking-wide mb-3"
            >
              01 · Track & Price Drop Analytics
            </motion.span>

            <h1 className="text-[28px] sm:text-[34px] font-bold text-white leading-[1.1] tracking-[-0.02em] mb-2">
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
              className="text-white/75 text-sm leading-[1.5] mb-4"
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
                  onClick={() => {
                    void trackPastedLink();
                  }}
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
                      onClick={() => {
                        void applyDropGoal(pct);
                      }}
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

            <div className="w-full mt-4 rounded-[26px] bg-white/[0.08] border border-white/20 backdrop-blur-2xl px-5 py-4 shadow-[0_24px_80px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.25)]">
              {selectedProduct && (
                <p className="text-sm text-white/80 tabular-nums">
                  Target{' '}
                  {selectedProduct.drop_goal_percent != null
                    ? `−${Math.round(selectedProduct.drop_goal_percent)}% · `
                    : ''}
                  {rupee(selectedProduct.target_price)}
                </p>
              )}
              {comparisonNote && (
                <p className="mt-1 text-sm text-white/75">{comparisonNote}</p>
              )}
              {verdict && verdict !== 'Keep watching' && (
                <p className="mt-1 text-sm font-semibold text-white/90">{verdict}</p>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN (7 cols): PRICE DROP GRAPHS PLACED RIGHT AT THE TOP */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.25 }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="lg:col-span-7 relative flex flex-col gap-4 min-h-0"
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

            <div className="relative flex items-start gap-3 px-1">
              {selectedProduct?.image_url ? (
                <img
                  src={selectedProduct.image_url}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-16 w-16 shrink-0 rounded-2xl bg-white object-contain"
                />
              ) : null}
              <div className="min-w-0">
              <p
                className="text-[17px] font-medium leading-snug text-white"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                {statusText}
              </p>
              </div>
            </div>

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
                    <div className="mt-1 flex items-center gap-3 text-xs text-white/70">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="inline-block h-1.5 w-4 rounded-full bg-[#EFCF92]" />
                        Amazon
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="inline-block h-0.5 w-4 rounded-full bg-[#E879F9]" />
                        Flipkart
                      </span>
                    </div>
                    {priceNotes.map((note) => (
                      <p key={note} className="mt-1 text-xs text-white/85">
                        {note}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              {/* SVG Price Drop Line Chart */}
              <div className="rounded-2xl bg-white/[0.04] border border-white/12 p-4">
                <div ref={graphScrollRef} className="product-scroll overflow-x-auto overflow-y-hidden">
                <svg
                  viewBox={`0 0 ${chartWidth} 168`}
                  width={chartWidth}
                  height={148}
                  className="block max-w-none"
                  role="img"
                  aria-label="Price drop detection graph"
                >
                  <defs>
                    <linearGradient id="topDropGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(239,207,146,0.28)" />
                      <stop offset="100%" stopColor="rgba(239,207,146,0.0)" />
                    </linearGradient>
                  </defs>

                  <text
                    x="26"
                    y="14"
                    fill="rgba(255,255,255,0.75)"
                    fontSize="11"
                    fontWeight="600"
                  >
                    Target {money(targetPrice)}
                  </text>

                  {/* Target Threshold Dashed Line */}
                  <line
                    x1="20"
                    y1={targetLineY}
                    x2={chartWidth - 20}
                    y2={targetLineY}
                    stroke="rgba(255,255,255,0.35)"
                    strokeDasharray="5 5"
                    strokeWidth="1.2"
                  />
                  {areaSegments.map((points) => (
                    <polygon key={points} points={points} fill="url(#topDropGrad)" />
                  ))}

                  {curveSegments.map((points) => (
                    <polyline
                      key={points}
                      fill="none"
                      stroke="#EFCF92"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={points}
                    />
                  ))}

                  {otherSegments.map((points) => (
                    <polyline
                      key={points}
                      fill="none"
                      stroke="#E879F9"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={points}
                    />
                  ))}

                  {graphNodes.map((node, idx) => {
                    const isSelected = idx === selectedGraphNodeIdx;
                    if (!node.available) {
                      return (
                        <text
                          key={`${node.label}-${idx}`}
                          x={node.x}
                          y={node.y}
                          textAnchor="middle"
                          fill="rgba(255,255,255,0.8)"
                          fontSize="11"
                          fontWeight="600"
                          className="cursor-pointer"
                          onClick={() => setSelectedGraphNodeIdx(idx)}
                        >
                          Not available
                        </text>
                      );
                    }
                    return (
                      <g
                        key={`${node.label}-${idx}`}
                        className="cursor-pointer"
                        onClick={() => setSelectedGraphNodeIdx(idx)}
                      >
                        {isSelected && (
                          <circle
                            cx={node.x}
                            cy={node.y}
                            r="13"
                            fill="rgba(239,207,146,0.22)"
                          />
                        )}
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={isSelected ? '6' : '4.5'}
                          fill={isSelected ? '#EFCF92' : '#14120e'}
                          stroke="#EFCF92"
                          strokeWidth={isSelected ? '2.5' : '1.8'}
                        />
                        <text
                          x={node.x}
                          y={node.y > 120 ? node.y - 14 : node.y + 18}
                          textAnchor="middle"
                          fill={
                            isSelected ? '#ffffff' : 'rgba(255,255,255,0.65)'
                          }
                          fontSize="11"
                          fontWeight={isSelected ? '700' : '500'}
                        >
                          {money(node.price as number)}
                        </text>
                      </g>
                    );
                  })}

                  {otherNodes.map((node, idx) =>
                    node.available ? (
                      <circle
                        key={`other-${node.label}-${idx}`}
                        cx={node.x + 22}
                        cy={node.y}
                        r="5"
                        fill="#E879F9"
                      />
                    ) : null,
                  )}
                  {otherNodes.map((node, idx) => (
                    <text
                      key={`other-price-${node.label}-${idx}`}
                      x={node.x + 22}
                      y={node.available ? (node.y > 120 ? node.y - 14 : node.y + 18) : node.y}
                      textAnchor="middle"
                      fill="#E879F9"
                      fontSize="11"
                      fontWeight="600"
                    >
                      {node.available ? money(node.price as number) : 'Not available'}
                    </text>
                  ))}
                </svg>
                <div className="relative mt-2 h-11 border-t border-white/10" style={{ width: chartWidth }}>
                  {(graphNodes.length ? graphNodes : otherNodes).map((node, idx) => {
                    const isSelected = idx === selectedGraphNodeIdx;
                    return (
                      <button
                        key={`${node.label}-${idx}`}
                        type="button"
                        onClick={() => setSelectedGraphNodeIdx(idx)}
                        style={{ left: node.x }}
                        className={`absolute top-1.5 -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded-lg text-xs tabular-nums transition-colors cursor-pointer ${
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
              </div>
            </div>

            <div id="studio-connect" className="rounded-[26px] bg-white/[0.08] border border-white/20 backdrop-blur-2xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.25)]">
              <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-white/[0.14] border border-white/20 flex items-center justify-center">
                      <Bell className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-[15px] font-semibold text-white">
                        Connect Account for Alerts
                      </div>
                  <div className="text-xs text-white/65 mt-0.5">
                    Every price drop sends an email. The target discount sends its own message.
                    </div>
                  </div>
                </div>

              <label className="block mb-3">
                <span className="text-xs text-white/70">Email for price alerts</span>
                    <input
                      type="email"
                  value={alertEmail}
                  onChange={(event) => setAlertEmail(event.target.value)}
                  placeholder="you@email.com"
                  aria-label="Email for price alerts"
                  className="mt-1.5 w-full rounded-2xl bg-black/60 border border-white/20 px-3.5 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none"
                />
              </label>
                      <button
                        type="button"
                onClick={() => {
                  void connectMailbox();
                }}
                disabled={emailConnecting || emailIsConnected}
                className={`w-full rounded-2xl px-4 py-3 border bg-white text-black flex items-center justify-between gap-3 ${
                  emailConnecting ? 'opacity-60 cursor-default' : emailIsConnected ? 'cursor-default' : 'cursor-pointer'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-black/5 border border-black/10 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                        </span>
                  <span className="text-sm font-semibold">
                    {emailConnecting ? 'Connecting email…' : emailIsConnected ? 'Connected' : 'Connect email'}
                      </span>
                            </span>
                          </button>
              {emailNotice && (
                <p className="mt-3 text-xs text-white/85">{emailNotice}</p>
              )}
            </div>
          </motion.div>
          </div>

        </div>
      </section>

    </div>
  );
}
