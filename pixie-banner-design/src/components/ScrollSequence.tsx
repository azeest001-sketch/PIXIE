import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const START_FRAME = 21;
const END_FRAME = 150;
const FRAME_COUNT = END_FRAME - START_FRAME + 1;
const LERP = 0.18;
const FADE_LERP = 0.38;
const FADE_END = 0.025;

function frameSrc(n: number) {
  return `/short_vid2/ezgif-frame-${String(n).padStart(3, '0')}.jpg`;
}

function smoothstep(t: number) {
  t = Math.min(1, Math.max(0, t));
  return t * t * (3 - 2 * t);
}

export function ScrollSequence({
  trackRef,
}: {
  trackRef: React.RefObject<HTMLElement | null>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<(HTMLImageElement | undefined)[]>(new Array(FRAME_COUNT));
  const stateRef = useRef({
    targetIndex: 0,
    currentIndex: 0,
    overlay: 1,
    targetOverlay: 1,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.decoding = 'async';
      img.src = frameSrc(START_FRAME + i);
      framesRef.current[i] = img;
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
    };

    const progress = () => {
      const track = trackRef.current;
      if (!track) return 0;
      const max = Math.max(1, track.offsetHeight - window.innerHeight);
      const scrolled = -track.getBoundingClientRect().top;
      return Math.min(1, Math.max(0, scrolled / max));
    };

    const drawCover = (img?: HTMLImageElement) => {
      if (!img || !img.complete || !img.naturalWidth) return false;
      const cw = canvas.width;
      const ch = canvas.height;
      if (!cw || !ch) return false;
      const ir = img.naturalWidth / img.naturalHeight;
      const cr = cw / ch;
      let dw: number;
      let dh: number;
      let dx: number;
      let dy: number;
      if (ir > cr) {
        dh = ch;
        dw = ch * ir;
        dx = (cw - dw) / 2;
        dy = 0;
      } else {
        dw = cw;
        dh = cw / ir;
        dx = 0;
        dy = (ch - dh) / 2;
      }
      ctx.drawImage(img, dx, dy, dw, dh);
      return true;
    };

    const drawOverlay = (overlay: number) => {
      const cw = canvas.width;
      const ch = canvas.height;
      if (!cw || !ch || overlay <= 0.001) return;

      ctx.fillStyle = `rgba(0,0,0,${overlay})`;
      ctx.fillRect(0, 0, cw, ch);

      const cx = cw * 0.5;
      const cy = ch * 0.42;
      const inner = Math.min(cw, ch) * (0.12 + (1 - overlay) * 0.5);
      const outer = Math.hypot(cw, ch) * 0.65;
      const gradient = ctx.createRadialGradient(cx, cy, inner, cx, cy, outer);
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(0.45, `rgba(0,0,0,${overlay * 0.25})`);
      gradient.addColorStop(1, `rgba(0,0,0,${Math.min(1, overlay * 0.7)})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, cw, ch);
    };

    const render = () => {
      const { currentIndex, overlay } = stateRef.current;
      const i = Math.round(Math.min(FRAME_COUNT - 1, Math.max(0, currentIndex)));
      if (!drawCover(framesRef.current[i])) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      drawOverlay(overlay);
    };

    let frameId = 0;
    const tick = () => {
      const p = progress();
      const s = stateRef.current;
      s.targetOverlay = 1 - smoothstep(p / FADE_END);
      s.overlay += (s.targetOverlay - s.overlay) * FADE_LERP;
      if (Math.abs(s.targetOverlay - s.overlay) < 0.001) s.overlay = s.targetOverlay;

      s.targetIndex = p * (FRAME_COUNT - 1);
      s.currentIndex += (s.targetIndex - s.currentIndex) * LERP;
      if (Math.abs(s.targetIndex - s.currentIndex) < 0.002) s.currentIndex = s.targetIndex;

      render();
      frameId = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });
    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
    };
  }, [trackRef]);

  return createPortal(
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 block h-full w-full pointer-events-none"
    />,
    document.body
  );
}
