import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  formatInr,
  Pixie3DConfig,
  PixieSceneCard,
  QUARTZ_PALETTE,
} from '../data/pixieData';

interface Pixie3DStageProps {
  cardsData: PixieSceneCard[];
  config: Pixie3DConfig;
  onSelectCard?: (card: PixieSceneCard) => void;
}

// Sleek Beveled Rounded Card Geometry
function createRoundedCardGeometry(
  width: number,
  height: number,
  depth: number,
  radius: number
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  const r = Math.min(radius, width / 2, height / 2);

  shape.moveTo(x + r, y);
  shape.lineTo(x + width - r, y);
  if (r > 0) shape.quadraticCurveTo(x + width, y, x + width, y + r);
  shape.lineTo(x + width, y + height - r);
  if (r > 0) shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  shape.lineTo(x + r, y + height);
  if (r > 0) shape.quadraticCurveTo(x, y + height, x, y + height - r);
  shape.lineTo(x, y + r);
  if (r > 0) shape.quadraticCurveTo(x, y, x + r, y);

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: depth,
    bevelEnabled: r > 0.01,
    bevelSegments: 5,
    steps: 1,
    bevelSize: r > 0.01 ? 0.024 : 0,
    bevelThickness: r > 0.01 ? 0.024 : 0,
  };

  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geo.center();
  return geo;
}

// Helper: Draws a high-resolution, super modern Card using the EXACT 5-color reference palette:
// #EFCF92 (Champagne Gold), #FDF6E7 (Warm Cream), #B87B5A (Warm Bronze), #F9E6EC (Soft Blush Mist), #E7B8C6 (Rose Quartz Pink)
function renderReferencePaletteCard(
  card: PixieSceneCard,
  imgElement: HTMLImageElement | null
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 640;
  const ctx = canvas.getContext('2d')!;

  const {
    champagneGold, // #EFCF92
    warmCream, // #FDF6E7
    warmBronze, // #B87B5A
    softBlushMist, // #F9E6EC
    roseQuartzPink, // #E7B8C6
  } = QUARTZ_PALETTE;

  // 1. Deep Obsidian Glass Base with Rose Quartz (#E7B8C6) & Champagne Gold (#EFCF92) Radial Geode Glow
  const bg = ctx.createLinearGradient(0, 0, 960, 640);
  bg.addColorStop(0, '#1B1418');
  bg.addColorStop(0.55, '#110D10');
  bg.addColorStop(1, '#0A080A');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 960, 640);

  // Rose Quartz Pink (#E7B8C6) Soft Upper Glow
  const quartzGlow = ctx.createRadialGradient(200, 120, 10, 220, 160, 520);
  quartzGlow.addColorStop(0, 'rgba(231, 184, 198, 0.25)');
  quartzGlow.addColorStop(0.6, 'rgba(249, 230, 236, 0.08)');
  quartzGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = quartzGlow;
  ctx.fillRect(0, 0, 960, 640);

  // Champagne Gold (#EFCF92) Lower Right Shimmer
  const goldGlow = ctx.createRadialGradient(800, 520, 10, 760, 480, 480);
  goldGlow.addColorStop(0, 'rgba(239, 207, 146, 0.22)');
  goldGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = goldGlow;
  ctx.fillRect(0, 0, 960, 640);

  if (card.slotType === 'hero-motto') {
    // Card 3: Upgraded "NEVER MISS A PRICE DROP. EVER." in #FDF6E7, #E7B8C6 & #EFCF92
    ctx.strokeStyle = 'rgba(249, 230, 236, 0.05)';
    ctx.lineWidth = 1.5;
    for (let x = 80; x < 960; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 640);
      ctx.stroke();
    }
    for (let y = 80; y < 640; y += 80) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(960, y);
      ctx.stroke();
    }

    // Top Rose Quartz (#E7B8C6) Pill Kicker
    ctx.fillStyle = 'rgba(231, 184, 198, 0.18)';
    ctx.beginPath();
    ctx.roundRect(64, 58, 420, 46, 23);
    ctx.fill();

    ctx.fillStyle = softBlushMist; // #F9E6EC
    ctx.font = '600 20px "JetBrains Mono", monospace';
    ctx.fillText('PIXIE · INSTANT DISCOUNT RADAR', 88, 88);

    // Crisp Warm Cream (#FDF6E7) Display Typography
    ctx.fillStyle = warmCream; // #FDF6E7
    ctx.font = '800 54px "Syne", "Plus Jakarta Sans", sans-serif';
    ctx.fillText('NEVER MISS A', 64, 210);
    ctx.fillText('PRICE DROP.', 64, 282);

    // Champagne Gold (#EFCF92) to Rose Quartz (#E7B8C6) Gradient "EVER."
    ctx.save();
    ctx.shadowColor = 'rgba(239, 207, 146, 0.48)';
    ctx.shadowBlur = 30;
    const rgGrad = ctx.createLinearGradient(64, 330, 520, 450);
    rgGrad.addColorStop(0, warmCream); // #FDF6E7
    rgGrad.addColorStop(0.45, champagneGold); // #EFCF92
    rgGrad.addColorStop(1, roseQuartzPink); // #E7B8C6
    ctx.fillStyle = rgGrad;
    ctx.font = '800 128px "Syne", "Plus Jakarta Sans", sans-serif';
    ctx.fillText('EVER.', 60, 428);
    ctx.restore();

    // Sleek 3D Pointer Arrow in #F9E6EC -> #EFCF92
    ctx.save();
    ctx.translate(715, 330);
    ctx.shadowColor = 'rgba(231, 184, 198, 0.55)';
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(118, 44);
    ctx.lineTo(66, 68);
    ctx.lineTo(94, 120);
    ctx.lineTo(66, 134);
    ctx.lineTo(38, 82);
    ctx.lineTo(-4, 118);
    ctx.closePath();
    const arrowGrad = ctx.createLinearGradient(0, 0, 118, 134);
    arrowGrad.addColorStop(0, warmCream); // #FDF6E7
    arrowGrad.addColorStop(0.5, champagneGold); // #EFCF92
    arrowGrad.addColorStop(1, warmBronze); // #B87B5A
    ctx.fillStyle = arrowGrad;
    ctx.fill();
    ctx.restore();

    // Bottom Subtitle in Soft Blush (#F9E6EC)
    ctx.fillStyle = roseQuartzPink; // #E7B8C6
    ctx.font = '600 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('DEALS UNDER ₹1,999 · AMAZON · FLIPKART · MYNTRA · AJIO', 64, 565);
  } else if (card.slotType === 'sale-bag-icon') {
    // Card 1 (Top Right): Bright Warm Cream (#FDF6E7) Product Frame + Champagne Gold (#EFCF92) Steal Price
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(40, 40, 450, 560, 28);
    ctx.clip();

    // Warm Cream (#FDF6E7) to Soft Blush (#F9E6EC) high-key backdrop so product is super bright
    const photoBg = ctx.createLinearGradient(40, 40, 490, 600);
    photoBg.addColorStop(0, warmCream); // #FDF6E7
    photoBg.addColorStop(1, softBlushMist); // #F9E6EC
    ctx.fillStyle = photoBg;
    ctx.fillRect(40, 40, 450, 560);

    if (imgElement && imgElement.complete && imgElement.naturalWidth > 0) {
      const scale = Math.max(450 / imgElement.naturalWidth, 560 / imgElement.naturalHeight);
      const w = imgElement.naturalWidth * scale;
      const h = imgElement.naturalHeight * scale;
      ctx.drawImage(imgElement, 40 + (450 - w) / 2, 40 + (560 - h) / 2, w, h);
    }
    ctx.restore();

    // Right Column: Rose Quartz Pill + Low Discount ₹ Price
    ctx.fillStyle = 'rgba(231, 184, 198, 0.22)';
    ctx.beginPath();
    ctx.roundRect(525, 46, 235, 48, 24);
    ctx.fill();
    ctx.fillStyle = softBlushMist; // #F9E6EC
    ctx.font = '700 22px "JetBrains Mono", monospace';
    ctx.fillText(`↓ ${card.dropPercent}% OFF`, 556, 78);

    ctx.fillStyle = roseQuartzPink; // #E7B8C6
    ctx.font = '600 20px "JetBrains Mono", monospace';
    ctx.fillText(card.storeName || 'MYNTRA · AJIO', 525, 142);

    ctx.fillStyle = warmCream; // #FDF6E7
    ctx.font = '700 30px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(card.title, 525, 190);

    // Big Discount Price in Champagne Gold (#EFCF92)
    ctx.fillStyle = champagneGold; // #EFCF92
    ctx.font = '700 66px "JetBrains Mono", monospace';
    ctx.fillText(formatInr(card.currentPriceInr || 1299), 525, 280);

    // Strikethrough MRP in Warm Bronze (#B87B5A)
    const origStr = `MRP ${formatInr(card.originalPriceInr || 4299)}`;
    ctx.fillStyle = warmBronze; // #B87B5A
    ctx.font = '500 28px "JetBrains Mono", monospace';
    ctx.fillText(origStr, 525, 328);
    const origW = ctx.measureText(origStr).width;
    ctx.strokeStyle = roseQuartzPink;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(525, 318);
    ctx.lineTo(525 + origW, 318);
    ctx.stroke();

    // Rose Quartz & Champagne Gold Shopping Tote Emblem Box
    ctx.save();
    ctx.fillStyle = 'rgba(239, 207, 146, 0.12)';
    ctx.beginPath();
    ctx.roundRect(525, 380, 390, 200, 26);
    ctx.fill();

    // Tote Icon in Champagne Gold (#EFCF92)
    ctx.strokeStyle = champagneGold;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(558, 435, 86, 96, 14);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(601, 435, 24, Math.PI, 0, false);
    ctx.stroke();

    ctx.fillStyle = warmCream; // #FDF6E7
    ctx.font = '700 26px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('FLASH STEAL', 668, 474);
    ctx.fillStyle = champagneGold; // #EFCF92
    ctx.font = '600 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`You save ${formatInr(card.savedInr || 3000)}`, 668, 512);
    ctx.restore();
  } else if (card.slotType === 'instant-buy') {
    // Card 5 (Bottom Right): ₹799 Watch Steal + Champagne Gold & Rose Quartz Pill Button
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(40, 40, 420, 355, 26);
    ctx.clip();
    ctx.fillStyle = warmCream; // #FDF6E7
    ctx.fillRect(40, 40, 420, 355);
    if (imgElement && imgElement.complete && imgElement.naturalWidth > 0) {
      const scale = Math.max(420 / imgElement.naturalWidth, 355 / imgElement.naturalHeight);
      const w = imgElement.naturalWidth * scale;
      const h = imgElement.naturalHeight * scale;
      ctx.drawImage(imgElement, 40 + (420 - w) / 2, 40 + (355 - h) / 2, w, h);
    }
    ctx.restore();

    ctx.fillStyle = roseQuartzPink; // #E7B8C6
    ctx.font = '600 20px "JetBrains Mono", monospace';
    ctx.fillText(card.storeName || 'AMAZON IN · NYKAA', 495, 92);

    ctx.fillStyle = warmCream; // #FDF6E7
    ctx.font = '700 32px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(card.title, 495, 144);

    // Huge ₹799 Steal Price in Champagne Gold (#EFCF92)
    ctx.fillStyle = champagneGold; // #EFCF92
    ctx.font = '700 68px "JetBrains Mono", monospace';
    ctx.fillText(formatInr(card.currentPriceInr || 799), 495, 236);

    const origStr = `MRP ${formatInr(card.originalPriceInr || 3499)} (-${card.dropPercent}%)`;
    ctx.fillStyle = warmBronze; // #B87B5A
    ctx.font = '500 27px "JetBrains Mono", monospace';
    ctx.fillText(origStr, 495, 286);

    // Sleek Champagne Gold (#EFCF92) & Rose Quartz (#E7B8C6) Metallic Capsule Button
    ctx.save();
    const pillGrad = ctx.createLinearGradient(40, 435, 920, 585);
    pillGrad.addColorStop(0, champagneGold); // #EFCF92
    pillGrad.addColorStop(0.5, warmCream); // #FDF6E7
    pillGrad.addColorStop(1, roseQuartzPink); // #E7B8C6
    ctx.fillStyle = pillGrad;
    ctx.beginPath();
    ctx.roundRect(40, 435, 880, 155, 77);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#120D10';
    ctx.font = '800 34px "Syne", "Plus Jakarta Sans", sans-serif';
    ctx.fillText('⚡ GRAB DEAL AT ₹799 NOW', 205, 525);
  } else {
    // Cards 2 & 4: Bright Warm Cream (#FDF6E7) Product Frame + Champagne Gold (#EFCF92) Price Drop Curve
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(40, 40, 455, 560, 28);
    ctx.clip();
    ctx.fillStyle = warmCream; // #FDF6E7
    ctx.fillRect(40, 40, 455, 560);
    if (imgElement && imgElement.complete && imgElement.naturalWidth > 0) {
      const scale = Math.max(455 / imgElement.naturalWidth, 560 / imgElement.naturalHeight);
      const w = imgElement.naturalWidth * scale;
      const h = imgElement.naturalHeight * scale;
      ctx.drawImage(imgElement, 40 + (455 - w) / 2, 40 + (560 - h) / 2, w, h);
    }
    ctx.restore();

    // Right Column Telemetry
    ctx.fillStyle = 'rgba(231, 184, 198, 0.22)';
    ctx.beginPath();
    ctx.roundRect(530, 46, 235, 48, 24);
    ctx.fill();

    ctx.fillStyle = softBlushMist; // #F9E6EC
    ctx.font = '700 22px "JetBrains Mono", monospace';
    ctx.fillText(`↓ ${card.dropPercent}% OFF`, 562, 78);

    ctx.fillStyle = roseQuartzPink; // #E7B8C6
    ctx.font = '600 20px "JetBrains Mono", monospace';
    ctx.fillText(card.storeName || card.subtitle, 530, 142);

    ctx.fillStyle = warmCream; // #FDF6E7
    ctx.font = '700 30px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(card.title, 530, 190);

    // Big Discounted ₹ Price in Champagne Gold (#EFCF92)
    ctx.fillStyle = champagneGold; // #EFCF92
    ctx.font = '700 64px "JetBrains Mono", monospace';
    ctx.fillText(formatInr(card.currentPriceInr || 1499), 530, 278);

    const origStr = `MRP ${formatInr(card.originalPriceInr || 4999)}`;
    ctx.fillStyle = warmBronze; // #B87B5A
    ctx.font = '500 28px "JetBrains Mono", monospace';
    ctx.fillText(origStr, 530, 326);
    const origW = ctx.measureText(origStr).width;
    ctx.strokeStyle = roseQuartzPink;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(530, 316);
    ctx.lineTo(530 + origW, 316);
    ctx.stroke();

    // Smooth Champagne Gold (#EFCF92) & Rose Quartz (#E7B8C6) Sparkline Curve
    const pts = [1.0, 0.96, 0.92, 0.85, 0.76, 0.62, 0.45];
    const cx = 530;
    const cy = 385;
    const cw = 375;
    const ch = 140;

    ctx.beginPath();
    pts.forEach((v, i) => {
      const px = cx + (i / (pts.length - 1)) * cw;
      const py = cy + (1 - v) * ch * 1.6;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.lineTo(cx + cw, cy + ch + 20);
    ctx.lineTo(cx, cy + ch + 20);
    ctx.closePath();
    const fillGrad = ctx.createLinearGradient(0, cy, 0, cy + ch + 20);
    fillGrad.addColorStop(0, 'rgba(239, 207, 146, 0.32)');
    fillGrad.addColorStop(1, 'rgba(231, 184, 198, 0.0)');
    ctx.fillStyle = fillGrad;
    ctx.fill();

    // Curve line in Champagne Gold (#EFCF92)
    ctx.beginPath();
    pts.forEach((v, i) => {
      const px = cx + (i / (pts.length - 1)) * cw;
      const py = cy + (1 - v) * ch * 1.6;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.strokeStyle = champagneGold; // #EFCF92
    ctx.lineWidth = 5.5;
    ctx.stroke();

    // Glowing terminal dot in Warm Cream (#FDF6E7)
    const lastY = cy + (1 - pts[pts.length - 1]) * ch * 1.6;
    ctx.fillStyle = warmCream;
    ctx.beginPath();
    ctx.arc(cx + cw, lastY, 9, 0, Math.PI * 2);
    ctx.fill();
  }

  // Multi-Stop Metallic Gold & Rose Quartz Foil Rim Highlight (maintaining #EFCF92, #FDF6E7, #E7B8C6, #B87B5A)
  const borderGrad = ctx.createLinearGradient(0, 0, 960, 640);
  borderGrad.addColorStop(0, '#FDF6E7'); // Bright Warm Cream specular highlight
  borderGrad.addColorStop(0.22, '#EFCF92'); // Champagne Gold
  borderGrad.addColorStop(0.45, '#E7B8C6'); // Rose Quartz Pink
  borderGrad.addColorStop(0.68, '#FFF5D6'); // Bright Gold sheen flash
  borderGrad.addColorStop(0.85, '#EFCF92'); // Champagne Gold
  borderGrad.addColorStop(1, '#B87B5A'); // Warm Bronze depth
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, 954, 634);

  return canvas;
}

// Helper: Renders the old stock clipart boxes from the screenshot when comparing "Before"
function renderOldStockBoxCanvas(slotType: PixieSceneCard['slotType']): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 540;
  const ctx = canvas.getContext('2d')!;

  if (slotType === 'sale-bag-icon') {
    const grad = ctx.createRadialGradient(400, 270, 20, 400, 270, 380);
    grad.addColorStop(0, '#831843');
    grad.addColorStop(0.5, '#3B0764');
    grad.addColorStop(1, '#111827');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 540);
    ctx.strokeStyle = '#FF2E93';
    ctx.shadowColor = '#FF2E93';
    ctx.shadowBlur = 28;
    ctx.lineWidth = 8;
    ctx.strokeRect(270, 140, 260, 260);
    ctx.font = '700 58px sans-serif';
    ctx.fillStyle = '#FF6EC7';
    ctx.fillText('SALE', 325, 295);
  } else if (slotType === 'hero-motto') {
    ctx.fillStyle = '#030303';
    ctx.fillRect(0, 0, 800, 540);
    ctx.shadowColor = '#EC4899';
    ctx.shadowBlur = 22;
    ctx.fillStyle = '#F472B6';
    ctx.font = '700 40px sans-serif';
    ctx.fillText('NEVER MISS A PRICE', 180, 210);
    ctx.fillText('DROP.', 330, 270);
    ctx.shadowColor = '#FACC15';
    ctx.fillStyle = '#FDE047';
    ctx.font = '800 84px sans-serif';
    ctx.fillText('EVER', 280, 370);
  } else if (slotType === 'mobile-pulse') {
    const grad = ctx.createLinearGradient(0, 0, 800, 540);
    grad.addColorStop(0, '#F5D0FE');
    grad.addColorStop(0.55, '#86198F');
    grad.addColorStop(1, '#1E1B4B');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 540);
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 6;
    ctx.strokeRect(340, 160, 180, 220);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 32px sans-serif';
    ctx.fillText('WASHED OUT GLARE', 240, 280);
  } else if (slotType === 'product-drop') {
    const grad = ctx.createLinearGradient(0, 0, 800, 540);
    grad.addColorStop(0, '#FBCFE8');
    grad.addColorStop(1, '#701A75');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 540);
    ctx.fillStyle = '#111827';
    ctx.fillRect(160, 110, 480, 280);
    ctx.fillStyle = '#F472B6';
    ctx.font = '700 36px sans-serif';
    ctx.fillText('MINI STOCK CART PHOTO', 190, 260);
  } else {
    ctx.fillStyle = '#14051E';
    ctx.fillRect(0, 0, 800, 540);
    ctx.strokeStyle = '#EC4899';
    ctx.shadowColor = '#EC4899';
    ctx.shadowBlur = 30;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.roundRect(210, 170, 380, 200, 90);
    ctx.stroke();
    ctx.fillStyle = '#F472B6';
    ctx.font = '700 44px sans-serif';
    ctx.fillText('CART CLIPART', 250, 285);
  }

  return canvas;
}

export const Pixie3DStage: React.FC<Pixie3DStageProps> = ({
  cardsData,
  config,
  onSelectCard,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const configRef = useRef<Pixie3DConfig>(config);
  configRef.current = config;

  const [hoveredCard, setHoveredCard] = useState<PixieSceneCard | null>(null);
  const [cursorCoords, setCursorCoords] = useState({ x: 0, y: 0 });
  const [loadedImages, setLoadedImages] = useState<Record<string, HTMLImageElement>>({});

  // Preload bright studio product photos
  useEffect(() => {
    let isMounted = true;
    const map: Record<string, HTMLImageElement> = {};
    const withImages = cardsData.filter((c) => c.imageUrl);
    let count = 0;

    withImages.forEach((c) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (!isMounted) return;
        map[c.id] = img;
        count++;
        if (count === withImages.length) {
          setLoadedImages({ ...map });
        }
      };
      img.src = c.imageUrl!;
    });

    return () => {
      isMounted = false;
    };
  }, [cardsData]);

  const stageRef = useRef<{
    renderer?: THREE.WebGLRenderer;
    scene?: THREE.Scene;
    camera?: THREE.PerspectiveCamera;
    clusterRoot?: THREE.Group;
    roseGoldTorus?: THREE.Mesh<THREE.TorusGeometry, THREE.MeshPhysicalMaterial>;
    champagneThinRing?: THREE.Mesh<THREE.TorusGeometry, THREE.MeshStandardMaterial>;
    cursorSpotLight?: THREE.PointLight;
    cards: {
      data: PixieSceneCard;
      group: THREE.Group;
      bodyMesh: THREE.Mesh;
      frontPlane: THREE.Mesh;
      frontMat: THREE.MeshPhysicalMaterial;
      bodyMat: THREE.MeshPhysicalMaterial;
    }[];
  }>({ cards: [] });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.24;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Pure Deep Black Background (#060608) as requested!
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(QUARTZ_PALETTE.deepBlackBg);

    // High-Key Golden & Rose Quartz Studio Reflection Environment Map (via PMREMGenerator)
    // Creates real-time mirror-like golden metallic highlights across the ring and card borders!
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color('#0C0809');

    // Top Warm Cream & Gold (#FDF6E7) overhead studio softbox strip
    const topSoftbox = new THREE.Mesh(
      new THREE.PlaneGeometry(26, 7),
      new THREE.MeshBasicMaterial({ color: new THREE.Color('#FDF6E7').multiplyScalar(4.2) })
    );
    topSoftbox.position.set(0, 8, 2);
    topSoftbox.rotation.x = Math.PI / 2.2;
    envScene.add(topSoftbox);

    // Right Champagne Gold (#EFCF92) high-intensity golden reflection bar
    const rightStrip = new THREE.Mesh(
      new THREE.PlaneGeometry(7, 24),
      new THREE.MeshBasicMaterial({ color: new THREE.Color('#EFCF92').multiplyScalar(4.5) })
    );
    rightStrip.position.set(8.5, 1, 3.5);
    rightStrip.rotation.y = -Math.PI / 2.4;
    envScene.add(rightStrip);

    // Left Rose Quartz (#E7B8C6) & Blush (#F9E6EC) reflection bar
    const leftStrip = new THREE.Mesh(
      new THREE.PlaneGeometry(7, 22),
      new THREE.MeshBasicMaterial({ color: new THREE.Color('#E7B8C6').multiplyScalar(3.8) })
    );
    leftStrip.position.set(-8.5, 2, 2.5);
    leftStrip.rotation.y = Math.PI / 2.4;
    envScene.add(leftStrip);

    // Bottom Warm Bronze-Gold (#B87B5A) bounce reflection strip
    const bottomStrip = new THREE.Mesh(
      new THREE.PlaneGeometry(22, 5),
      new THREE.MeshBasicMaterial({ color: new THREE.Color('#EFCF92').multiplyScalar(3.0) })
    );
    bottomStrip.position.set(1, -7.5, 2);
    bottomStrip.rotation.x = -Math.PI / 2.3;
    envScene.add(bottomStrip);

    const envRenderTarget = pmremGenerator.fromScene(envScene, 0.025);
    scene.environment = envRenderTarget.texture;

    const camera = new THREE.PerspectiveCamera(
      40,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 8.8);

    const clusterRoot = new THREE.Group();
    scene.add(clusterRoot);

    // 1. Metallic Golden-Rose Quartz Orbital Halo Ring (maintaining #E7B8C6, #F9E6EC & #EFCF92 with liquid gold metallic sheen!)
    const torusGeo = new THREE.TorusGeometry(4.35, 0.21, 64, 200);
    const torusMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#EFCF92'), // Champagne Gold metallic base
      emissive: new THREE.Color('#E7B8C6'), // Rose Quartz pink inner glow so both colors blend into Rose-Gold!
      emissiveIntensity: 0.48,
      roughness: 0.06, // Mirror-polished golden reflection
      metalness: 0.98, // True metallic gold specular response
      sheen: 1.0,
      sheenColor: new THREE.Color('#F9E6EC'), // Soft Blush Mist velvet rim sheen
      sheenRoughness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      envMapIntensity: 3.2,
      transparent: true,
      opacity: 0.98,
    });
    const roseGoldTorus = new THREE.Mesh(torusGeo, torusMat);
    roseGoldTorus.position.set(1.1, 1.35, -1.55);
    roseGoldTorus.rotation.set(0.18, -0.28, 0.2);
    clusterRoot.add(roseGoldTorus);

    // Secondary Pure Liquid Champagne Gold (#EFCF92) & Cream (#FDF6E7) Orbit Line
    const thinRingGeo = new THREE.TorusGeometry(4.68, 0.038, 32, 160);
    const thinRingMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#EFCF92'),
      emissive: new THREE.Color('#EFCF92'),
      emissiveIntensity: 1.35,
      roughness: 0.05,
      metalness: 1.0,
    });
    const champagneThinRing = new THREE.Mesh(thinRingGeo, thinRingMat);
    champagneThinRing.position.set(1.15, 1.35, -1.75);
    champagneThinRing.rotation.set(0.22, -0.32, 0.15);
    clusterRoot.add(champagneThinRing);

    // 2. Golden & Rose Quartz Specular Lighting Rig
    const hemiLight = new THREE.HemisphereLight('#FDF6E7', '#B87B5A', 1.35);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight('#EFCF92', 3.4);
    keyLight.position.set(4.5, 5.5, 6.5);
    scene.add(keyLight);

    const roseRimLight = new THREE.DirectionalLight('#E7B8C6', 2.8);
    roseRimLight.position.set(-5.0, 3.0, 4.0);
    scene.add(roseRimLight);

    // Interactive Golden (#EFCF92) Specular Light that glides across the metallic borders & ring with your cursor!
    const cursorSpotLight = new THREE.PointLight('#EFCF92', 6.5, 16, 1.1);
    cursorSpotLight.position.set(2.0, 0.0, 4.2);
    scene.add(cursorSpotLight);

    // 3. Build the 5 Right-Side Cards with 24K Champagne-Rose Gold Beveled Borders
    const cards: typeof stageRef.current.cards = [];

    cardsData.forEach((cardItem) => {
      const group = new THREE.Group();
      group.position.set(...cardItem.position);
      group.rotation.set(...cardItem.baseRotation);
      group.userData = { card: cardItem };

      const [cardW, cardH] = cardItem.dimensions;

      const bodyGeo = createRoundedCardGeometry(
        cardW,
        cardH,
        configRef.current.cardDepth,
        configRef.current.cornerRadius
      );

      // Metallic Champagne Gold (#EFCF92) + Rose Quartz (#E7B8C6) Beveled 3D Card Border
      const bodyMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#EFCF92'), // Champagne Gold metallic body
        emissive: new THREE.Color('#B87B5A'), // Warm Bronze-Gold undertone
        emissiveIntensity: 0.35,
        roughness: 0.07, // High-polish metallic gold mirror edge
        metalness: 0.98, // Full metallic gold reflection
        sheen: 1.0,
        sheenColor: new THREE.Color('#E7B8C6'), // Rose Quartz pink grazing sheen
        sheenRoughness: 0.12,
        clearcoat: 1.0,
        clearcoatRoughness: 0.04,
        envMapIntensity: 3.0,
      });

      const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
      bodyMesh.userData = { card: cardItem };
      group.add(bodyMesh);

      // Slightly inset (0.974) so the polished Golden & Rose Quartz 3D beveled border gleams around every card!
      const frontGeo = new THREE.PlaneGeometry(cardW * 0.974, cardH * 0.974);
      const canvasElem =
        configRef.current.visualMode === 'modern-rosegold'
          ? renderReferencePaletteCard(cardItem, loadedImages[cardItem.id] || null)
          : renderOldStockBoxCanvas(cardItem.slotType);

      const frontTex = new THREE.CanvasTexture(canvasElem);
      frontTex.colorSpace = THREE.SRGBColorSpace;
      frontTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

      const frontMat = new THREE.MeshPhysicalMaterial({
        map: frontTex,
        roughness: 0.16,
        metalness: 0.06,
        clearcoat: 1.0,
        clearcoatRoughness: 0.06,
        reflectivity: 0.9,
        envMapIntensity: 1.45,
      });

      const frontPlane = new THREE.Mesh(frontGeo, frontMat);
      frontPlane.position.z = configRef.current.cardDepth / 2 + 0.026;
      frontPlane.userData = { card: cardItem };
      group.add(frontPlane);

      clusterRoot.add(group);
      cards.push({
        data: cardItem,
        group,
        bodyMesh,
        frontPlane,
        frontMat,
        bodyMat,
      });
    });

    stageRef.current = {
      renderer,
      scene,
      camera,
      clusterRoot,
      roseGoldTorus,
      champagneThinRing,
      cursorSpotLight,
      cards,
    };

    // Window-wide Mouse Tracking
    const pointer = new THREE.Vector2(0, 0);
    const raycaster = new THREE.Raycaster();

    const handleWindowMouseMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      pointer.set(
        THREE.MathUtils.clamp(nx, -1.2, 1.2),
        THREE.MathUtils.clamp(ny, -1.2, 1.2)
      );
      setCursorCoords({
        x: Math.round(pointer.x * 100),
        y: Math.round(pointer.y * 100),
      });

      raycaster.setFromCamera(pointer, camera);
      const meshes = cards.flatMap((c) => [c.frontPlane, c.bodyMesh]);
      const hits = raycaster.intersectObjects(meshes, false);
      if (hits.length > 0) {
        const hitCard = hits[0].object.userData.card as PixieSceneCard | undefined;
        setHoveredCard(hitCard || null);
        renderer.domElement.style.cursor = 'pointer';
      } else {
        setHoveredCard(null);
        renderer.domElement.style.cursor = 'default';
      }
    };

    const handleClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      pointer.set(nx, ny);
      raycaster.setFromCamera(pointer, camera);
      const meshes = cards.flatMap((c) => [c.frontPlane, c.bodyMesh]);
      const hits = raycaster.intersectObjects(meshes, false);
      if (hits.length > 0 && onSelectCard) {
        const hitCard = hits[0].object.userData.card as PixieSceneCard | undefined;
        if (hitCard) onSelectCard(hitCard);
      }
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    renderer.domElement.addEventListener('click', handleClick);

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    let frameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const cfg = configRef.current;

      if (cursorSpotLight) {
        cursorSpotLight.position.x = pointer.x * 4.5 + 1.2;
        cursorSpotLight.position.y = pointer.y * 3.5;
        cursorSpotLight.position.z = 3.5;
      }

      if (roseGoldTorus && champagneThinRing) {
        roseGoldTorus.rotation.y = -0.28 + pointer.x * 0.28;
        roseGoldTorus.rotation.x = 0.18 - pointer.y * 0.28;
        champagneThinRing.rotation.y = -0.32 - pointer.x * 0.35;
        champagneThinRing.rotation.x = 0.22 + pointer.y * 0.35;
        champagneThinRing.rotation.z = t * 0.12;
      }

      cards.forEach((item, idx) => {
        const { data, group } = item;

        const cardNormX = data.position[0] / 4.2;
        const cardNormY = data.position[1] / 3.2;
        const relX = pointer.x - cardNormX * 0.45;
        const relY = pointer.y - cardNormY * 0.45;

        const tiltScale = 0.65 * cfg.cursorTiltIntensity;
        const targetRotY =
          data.baseRotation[1] + THREE.MathUtils.clamp(relX * tiltScale, -0.78, 0.78);
        const targetRotX =
          data.baseRotation[0] + THREE.MathUtils.clamp(-relY * tiltScale, -0.68, 0.68);
        const targetRotZ =
          data.baseRotation[2] + THREE.MathUtils.clamp(-relX * relY * 0.18, -0.15, 0.15);

        group.rotation.y += (targetRotY - group.rotation.y) * cfg.cursorDamping;
        group.rotation.x += (targetRotX - group.rotation.x) * cfg.cursorDamping;
        group.rotation.z += (targetRotZ - group.rotation.z) * cfg.cursorDamping;

        const distToCard = Math.hypot(pointer.x - cardNormX, pointer.y - cardNormY);
        const zPull = Math.max(0, 1.15 - distToCard) * 0.65 * cfg.cursorParallaxStrength;

        const targetPosX =
          data.position[0] + pointer.x * (0.28 + idx * 0.04) * cfg.cursorParallaxStrength;
        const targetPosY =
          data.position[1] +
          pointer.y * (0.24 + idx * 0.03) * cfg.cursorParallaxStrength +
          Math.sin(t * 1.5 + idx * 1.3) * 0.05;
        const targetPosZ = data.position[2] + zPull;

        group.position.x += (targetPosX - group.position.x) * cfg.cursorDamping;
        group.position.y += (targetPosY - group.position.y) * cfg.cursorDamping;
        group.position.z += (targetPosZ - group.position.z) * cfg.cursorDamping;
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleWindowMouseMove);
      renderer.domElement.removeEventListener('click', handleClick);
      renderer.dispose();
    };
  }, [cardsData, loadedImages, onSelectCard]);

  // Synchronize live config updates
  useEffect(() => {
    const { cards, roseGoldTorus, champagneThinRing, renderer } = stageRef.current;
    if (!cards.length || !renderer) return;

    const isOld = config.visualMode === 'old-stock-boxes';

    if (roseGoldTorus && champagneThinRing) {
      roseGoldTorus.visible = config.haloRingVisible;
      champagneThinRing.visible = config.haloRingVisible && !isOld;
      if (isOld) {
        roseGoldTorus.material.color.set('#6B21A8');
        roseGoldTorus.material.emissive.set('#4C1D95');
      } else {
        roseGoldTorus.material.color.set('#EFCF92');
        roseGoldTorus.material.emissive.set('#E7B8C6');
      }
    }

    cards.forEach((item) => {
      const [cardW, cardH] = item.data.dimensions;

      item.bodyMesh.geometry.dispose();
      item.bodyMesh.geometry = createRoundedCardGeometry(
        cardW,
        cardH,
        config.cardDepth,
        config.cornerRadius
      );

      item.frontPlane.geometry.dispose();
      item.frontPlane.geometry = new THREE.PlaneGeometry(
        cardW * (isOld ? 0.992 : 0.974),
        cardH * (isOld ? 0.992 : 0.974)
      );
      item.frontPlane.position.z = config.cardDepth / 2 + (isOld ? 0.005 : 0.026);

      const newCanvas = isOld
        ? renderOldStockBoxCanvas(item.data.slotType)
        : renderReferencePaletteCard(item.data, loadedImages[item.data.id] || null);

      const newTex = new THREE.CanvasTexture(newCanvas);
      newTex.colorSpace = THREE.SRGBColorSpace;
      newTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

      if (item.frontMat.map) item.frontMat.map.dispose();
      item.frontMat.map = newTex;
      item.frontMat.roughness = isOld ? config.surfaceRoughness : 0.16;
      item.frontMat.clearcoat = isOld ? config.specularGlareControl : 1.0;
      item.frontMat.needsUpdate = true;

      item.bodyMat.color.set(isOld ? '#3B0764' : '#EFCF92');
      item.bodyMat.emissive.set(isOld ? '#1E1B4B' : '#B87B5A');
      item.bodyMat.emissiveIntensity = isOld ? 0.15 : 0.35;
    });
  }, [config, loadedImages]);

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-[#060608]">
      {/* Full-Screen 3D Canvas on Pure Deep Black */}
      <div ref={mountRef} className="w-full h-full" />
    </div>
  );
};
