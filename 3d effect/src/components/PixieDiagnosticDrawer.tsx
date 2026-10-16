import React, { useState } from 'react';
import {
  DEFAULT_MODERN_CONFIG,
  OLD_STOCK_BOX_CONFIG,
  Pixie3DConfig,
} from '../data/pixieData';
import { Sliders, Code2, Check, Copy, Sparkles, Eye, MousePointer } from 'lucide-react';

interface PixieDiagnosticDrawerProps {
  config: Pixie3DConfig;
  onChangeConfig: (cfg: Pixie3DConfig) => void;
  activeTab: '3d-tuner' | 'nextjs-code';
  onChangeTab: (tab: '3d-tuner' | 'nextjs-code') => void;
  onClose: () => void;
}

export const PixieDiagnosticDrawer: React.FC<PixieDiagnosticDrawerProps> = ({
  config,
  onChangeConfig,
  activeTab,
  onChangeTab,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const updateField = <K extends keyof Pixie3DConfig>(key: K, value: Pixie3DConfig[K]) => {
    onChangeConfig({
      ...config,
      [key]: value,
    });
  };

  const splineInstructionsAndCode = `// HOW TO RECREATE THIS ROSE GOLD & TITANIUM LOOK IN SPLINE:
// 1. Background Ring: Select your Torus -> Material: Physical
//    - Base Color: #E5A996 (Brushed Rose Gold)
//    - Metalness: 0.85, Roughness: 0.22
// 2. Borderless Sleek Cards:
//    - Corner Radius: 28, Extrusion: 6, Bevel: 2
//    - Remove any red/pink borders! Use a bright #F7F4F0 pearl box behind product photos so products pop clearly.
// 3. Strong Mouse Tracking:
//    - Add "Look At" Event -> Distance: 200, Damping: 75

import Spline from '@splinetool/react-spline/next';

export default function Home() {
  return (
    <main className="relative w-screen h-screen bg-[#08080B] overflow-hidden">
      <Spline scene="https://prod.spline.design/I8Py7bJvnLpjOh4Z/scene.splinecode" />
    </main>
  );
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(splineInstructionsAndCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside className="w-full sm:w-[390px] bg-[#100F14]/95 backdrop-blur-xl border-l border-white/10 flex flex-col h-full overflow-hidden z-30 shadow-2xl">
      <div className="p-5 border-b border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-display font-bold text-white">
              Rose Gold &amp; Titanium Tuner
            </h2>
            <p className="text-xs text-zinc-400">
              Adjust mouse tracking, ring visibility &amp; card depth
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-zinc-400 hover:text-white px-2.5 py-1 rounded border border-white/10"
          >
            Close
          </button>
        </div>

        {/* Before / After Instant Switcher */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#08080B] rounded-lg border border-white/10">
          <button
            onClick={() => onChangeConfig(OLD_STOCK_BOX_CONFIG)}
            className={`px-2.5 py-2 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              config.visualMode === 'old-stock-boxes'
                ? 'bg-zinc-800 text-white border border-white/20'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Old Clipart Boxes
          </button>
          <button
            onClick={() => onChangeConfig(DEFAULT_MODERN_CONFIG)}
            className={`px-2.5 py-2 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              config.visualMode === 'modern-rosegold'
                ? 'bg-[#F4C4B2] text-zinc-950 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Modern Rose Gold
          </button>
        </div>

        {/* 2 Tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-[#08080B] rounded-lg border border-white/10">
          <button
            onClick={() => onChangeTab('3d-tuner')}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === '3d-tuner'
                ? 'bg-zinc-800 text-[#FCD5C5] border border-white/15'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Mouse &amp; Ring Controls
          </button>
          <button
            onClick={() => onChangeTab('nextjs-code')}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'nextjs-code'
                ? 'bg-zinc-800 text-[#FCD5C5] border border-white/15'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Spline Recipe
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {activeTab === '3d-tuner' ? (
          <div className="space-y-4">
            {/* Rose Gold Ring Toggle */}
            <div className="p-3.5 rounded-xl bg-[#08080B] border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-white">Rose Gold Orbital Ring</p>
                <p className="text-[11px] text-zinc-400">Toggle background ring on or off</p>
              </div>
              <button
                onClick={() => updateField('haloRingVisible', !config.haloRingVisible)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  config.haloRingVisible
                    ? 'bg-[#F4C4B2] text-zinc-950'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {config.haloRingVisible ? 'Rose Gold Ring ON' : 'Ring Hidden'}
              </button>
            </div>

            {/* Mouse Tracking Controls */}
            <div className="p-4 rounded-xl bg-[#08080B] border border-white/10 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#FCD5C5]">
                <MousePointer className="w-3.5 h-3.5" />
                <span>Mouse Tracking Intensity</span>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-300">3D Tilt Angle Toward Cursor</span>
                  <span className="font-mono-tabular text-[#F4C4B2]">
                    {Math.round(config.cursorTiltIntensity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.4"
                  max="1.8"
                  step="0.05"
                  value={config.cursorTiltIntensity}
                  onChange={(e) =>
                    updateField('cursorTiltIntensity', parseFloat(e.target.value))
                  }
                  className="w-full accent-[#F4C4B2] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-300">3D Z-Depth Push &amp; Parallax</span>
                  <span className="font-mono-tabular text-[#F4C4B2]">
                    {Math.round(config.cursorParallaxStrength * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.6"
                  step="0.05"
                  value={config.cursorParallaxStrength}
                  onChange={(e) =>
                    updateField('cursorParallaxStrength', parseFloat(e.target.value))
                  }
                  className="w-full accent-[#F4C4B2] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-300">Tracking Speed (Damping)</span>
                  <span className="font-mono-tabular text-[#F4C4B2]">
                    {config.cursorDamping.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.04"
                  max="0.25"
                  step="0.01"
                  value={config.cursorDamping}
                  onChange={(e) => updateField('cursorDamping', parseFloat(e.target.value))}
                  className="w-full accent-[#F4C4B2] cursor-pointer"
                />
              </div>
            </div>

            {/* Card Geometry Controls */}
            <div className="p-4 rounded-xl bg-[#08080B] border border-white/10 space-y-4">
              <div className="text-xs font-semibold text-white">
                Borderless Titanium Card Shape
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-300">Corner Radius</span>
                  <span className="font-mono-tabular text-[#F4C4B2]">
                    {Math.round(config.cornerRadius * 150)} px
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.24"
                  step="0.02"
                  value={config.cornerRadius}
                  onChange={(e) => updateField('cornerRadius', parseFloat(e.target.value))}
                  className="w-full accent-[#F4C4B2] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-300">Card Thickness</span>
                  <span className="font-mono-tabular text-[#F4C4B2]">
                    {(config.cardDepth * 100).toFixed(0)} px
                  </span>
                </div>
                <input
                  type="range"
                  min="0.04"
                  max="0.36"
                  step="0.02"
                  value={config.cardDepth}
                  onChange={(e) => updateField('cardDepth', parseFloat(e.target.value))}
                  className="w-full accent-[#F4C4B2] cursor-pointer"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">Spline Setup Guide</span>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-md bg-[#F4C4B2] hover:bg-[#FCD5C5] text-zinc-950 font-semibold text-xs flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3.5 rounded-xl bg-[#08080B] border border-white/10 text-[11px] font-mono-tabular text-zinc-300 overflow-x-auto leading-relaxed">
              <code>{splineInstructionsAndCode}</code>
            </pre>
          </div>
        )}
      </div>
    </aside>
  );
};
