import React, { useState } from 'react';
import {
  CALIBRATION_PRESETS,
  PrintCalibrationConfig,
  SPLINE_FIX_CHECKLIST,
} from '../data/printCalibrationData';
import { Sliders, Check, Copy, Sparkles, Layers, Sun, MousePointer, Code2 } from 'lucide-react';

interface CalibrationDrawerProps {
  config: PrintCalibrationConfig;
  onChangeConfig: (newConfig: PrintCalibrationConfig) => void;
  splitComparisonMode: boolean;
  onToggleSplitComparison: () => void;
  activeRightTab: 'inspector' | 'spline-guide' | 'nextjs-code';
  onChangeRightTab: (tab: 'inspector' | 'spline-guide' | 'nextjs-code') => void;
}

export const CalibrationDrawer: React.FC<CalibrationDrawerProps> = ({
  config,
  onChangeConfig,
  splitComparisonMode,
  onToggleSplitComparison,
  activeRightTab,
  onChangeRightTab,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);

  const handlePresetSelect = (presetKey: PrintCalibrationConfig['presetName']) => {
    onChangeConfig(CALIBRATION_PRESETS[presetKey].config);
  };

  const updateField = <K extends keyof PrintCalibrationConfig>(
    field: K,
    value: PrintCalibrationConfig[K]
  ) => {
    onChangeConfig({
      ...config,
      [field]: value,
    });
  };

  const nextJsCodeSnippet = `'use client';

import { useRef, useState } from 'react';
import Spline from '@splinetool/react-spline/next';
import type { Application } from '@splinetool/runtime';

export default function ArchivalSplinePrintHero() {
  const splineRef = useRef<Application | null>(null);
  const [loaded, setLoaded] = useState(false);

  function handleLoad(app: Application) {
    splineRef.current = app;
    setLoaded(true);

    // Optional: Programmatically soften harsh default directional light in your scene
    const keyLight = app.findObjectByName('Directional Light');
    if (keyLight) {
      keyLight.intensity = ${config.keyLightIntensity.toFixed(2)};
    }
  }

  return (
    <main className="relative w-full h-screen bg-[#09090B] overflow-hidden select-none">
      {/* 1. Calibrated Optical Wrapper: Fixes digital saturation & flat contrast */}
      <div
        className={\`w-full h-full transition-opacity duration-700 \${
          loaded ? 'opacity-100' : 'opacity-0'
        }\`}
        style={{
          filter: 'contrast(1.06) saturate(0.92) brightness(0.98) drop-shadow(0 28px 50px rgba(0,0,0,0.7))',
        }}
      >
        <Spline
          scene="https://prod.spline.design/I8Py7bJvnLpjOh4Z/scene.splinecode"
          onLoad={handleLoad}
        />
      </div>

      {/* 2. Gallery Raking Vignette Scrim (eliminates floating-in-void look) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at center, transparent 42%, rgba(9, 9, 11, ${config.vignetteStrength.toFixed(
              2
            )}) 100%)',
        }}
      />

      {/* 3. Tactile Cotton Rag Micro-Grain Overlay (removes plastic WebGL sheen) */}
      <div
        className="pointer-events-none absolute inset-0 mix-blend-overlay"
        style={{
          opacity: ${config.postFilmGrain.toFixed(2)},
          backgroundImage: \`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")\`,
        }}
      />
    </main>
  );
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(nextJsCodeSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <aside className="w-full lg:w-[430px] xl:w-[460px] shrink-0 bg-[#111114] border-l border-white/10 flex flex-col h-full overflow-hidden">
      {/* Drawer Header & Segmented View Switcher */}
      <div className="p-5 border-b border-white/10 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-editorial tracking-wide text-[#F4F4F0]">
              Print Material &amp; Spline Diagnostics
            </h2>
            <p className="text-xs text-zinc-400">
              Why 3D cursor-tracking photos look cheap — and how to fix them
            </p>
          </div>
        </div>

        {/* Segmented Control */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-[#09090B] rounded-lg border border-white/10">
          <button
            onClick={() => onChangeRightTab('inspector')}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeRightTab === 'inspector'
                ? 'bg-zinc-800 text-[#F4F4F0] shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Material Lab
          </button>
          <button
            onClick={() => onChangeRightTab('spline-guide')}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeRightTab === 'spline-guide'
                ? 'bg-zinc-800 text-[#F4F4F0] shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            5 Spline Fixes
          </button>
          <button
            onClick={() => onChangeRightTab('nextjs-code')}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeRightTab === 'nextjs-code'
                ? 'bg-zinc-800 text-[#F4F4F0] shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Next.js Code
          </button>
        </div>
      </div>

      {/* Scrollable Drawer Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {activeRightTab === 'inspector' && (
          <>
            {/* Quick A/B Split Comparison Toggle */}
            <div className="p-3.5 rounded-lg bg-[#09090B] border border-white/10 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#F4F4F0]">
                  A/B Split Diagnostic View
                </p>
                <p className="text-[11px] text-zinc-400">
                  Compare flat 0mm planes (left) vs archival stock (right)
                </p>
              </div>
              <button
                onClick={onToggleSplitComparison}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  splitComparisonMode
                    ? 'bg-[#E11D48] text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {splitComparisonMode ? 'Split Active' : 'Compare A/B'}
              </button>
            </div>

            {/* Paper Stock Presets */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-200">
                  Archival Paper Presets
                </span>
                <span className="text-[11px] text-zinc-400">Click to test in 3D</span>
              </div>
              <div className="space-y-2">
                {(
                  Object.keys(CALIBRATION_PRESETS) as Array<
                    PrintCalibrationConfig['presetName']
                  >
                ).map((key) => {
                  const item = CALIBRATION_PRESETS[key];
                  const isSelected = config.presetName === key;
                  const isRaw = key === 'raw-default';
                  return (
                    <button
                      key={key}
                      onClick={() => handlePresetSelect(key)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        isSelected
                          ? isRaw
                            ? 'bg-rose-950/30 border-rose-500/60 text-[#F4F4F0]'
                            : 'bg-zinc-800/90 border-white/30 text-[#F4F4F0]'
                          : 'bg-[#09090B]/60 border-white/5 text-zinc-400 hover:border-white/15 hover:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-xs font-semibold">{item.label}</span>
                        <span className="text-[11px] font-mono-tabular text-zinc-400">
                          {item.config.paperStockThicknessMm.toFixed(1)}mm
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        {item.subtitle}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 1: Physical Geometry & Mat Framing */}
            <div className="pt-4 border-t border-white/10 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#F4F4F0]">
                <Layers className="w-3.5 h-3.5 text-[#E11D48]" />
                <span>01. Substrate Geometry &amp; Passe-Partout Border</span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-300">Paper Board Extrusion (Thickness)</span>
                    <span className="font-mono-tabular text-zinc-400">
                      {config.paperStockThicknessMm.toFixed(1)} mm
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="4.5"
                    step="0.1"
                    value={config.paperStockThicknessMm}
                    onChange={(e) =>
                      updateField('paperStockThicknessMm', parseFloat(e.target.value))
                    }
                    className="w-full accent-[#E11D48] cursor-pointer"
                  />
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    0mm planes look like cheap digital stickers. 2.5–3.5mm catches edge light.
                  </p>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-300">Museum Mat Border Width</span>
                    <span className="font-mono-tabular text-zinc-400">
                      {config.matBorderWidthCm.toFixed(1)} cm
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="3.5"
                    step="0.1"
                    value={config.matBorderWidthCm}
                    onChange={(e) =>
                      updateField('matBorderWidthCm', parseFloat(e.target.value))
                    }
                    className="w-full accent-[#E11D48] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-zinc-300">Mat Board Stock Tint</span>
                  <div className="flex items-center gap-2">
                    {(
                      [
                        { hex: '#F6F4EE', name: 'Warm Cotton' },
                        { hex: '#EAE6DF', name: 'Natural Linen' },
                        { hex: '#18181B', name: 'Obsidian' },
                      ] as const
                    ).map((swatch) => (
                      <button
                        key={swatch.hex}
                        onClick={() => updateField('matStockColor', swatch.hex)}
                        className={`px-2.5 py-1 rounded text-[11px] border transition-all flex items-center gap-1.5 ${
                          config.matStockColor === swatch.hex
                            ? 'border-white text-[#F4F4F0] bg-zinc-800'
                            : 'border-white/10 text-zinc-400 hover:border-white/25'
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-black/20"
                          style={{ backgroundColor: swatch.hex }}
                        />
                        {swatch.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Surface Roughness & Specular Response */}
            <div className="pt-4 border-t border-white/10 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#F4F4F0]">
                <Sparkles className="w-3.5 h-3.5 text-[#E11D48]" />
                <span>02. PBR Surface Roughness &amp; Paper Tooth</span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-300">Surface Roughness (Matte vs Gloss)</span>
                    <span className="font-mono-tabular text-zinc-400">
                      {config.surfaceRoughness.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.08"
                    max="0.95"
                    step="0.02"
                    value={config.surfaceRoughness}
                    onChange={(e) =>
                      updateField('surfaceRoughness', parseFloat(e.target.value))
                    }
                    className="w-full accent-[#E11D48] cursor-pointer"
                  />
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Low roughness (&lt;0.25) causes harsh white specular hotspots on dark photos.
                  </p>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-300">Baryta Clearcoat Sheen</span>
                    <span className="font-mono-tabular text-zinc-400">
                      {config.clearcoatSheen.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.04"
                    value={config.clearcoatSheen}
                    onChange={(e) =>
                      updateField('clearcoatSheen', parseFloat(e.target.value))
                    }
                    className="w-full accent-[#E11D48] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-300">Cotton Fiber Micro-Tooth (Bump)</span>
                    <span className="font-mono-tabular text-zinc-400">
                      {Math.round(config.paperMicrotooth * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={config.paperMicrotooth}
                    onChange={(e) =>
                      updateField('paperMicrotooth', parseFloat(e.target.value))
                    }
                    className="w-full accent-[#E11D48] cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Gallery Lighting & Cursor Physics */}
            <div className="pt-4 border-t border-white/10 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#F4F4F0]">
                <Sun className="w-3.5 h-3.5 text-[#E11D48]" />
                <span>03. Gallery Lighting &amp; Cursor Inertia</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    { id: 'warm-gallery-spot', label: 'Warm Gallery Spot' },
                    { id: 'raking-daylight', label: 'Raking Daylight' },
                    { id: 'dramatic-atelier', label: 'Dramatic Atelier' },
                    { id: 'unlit-flat', label: 'Harsh Flat (Bad)' },
                  ] as const
                ).map((rig) => (
                  <button
                    key={rig.id}
                    onClick={() => updateField('lightingRig', rig.id)}
                    className={`px-2.5 py-2 rounded-md text-xs font-medium border text-left transition-colors whitespace-nowrap truncate ${
                      config.lightingRig === rig.id
                        ? 'bg-zinc-800 border-white/30 text-[#F4F4F0]'
                        : 'bg-[#09090B] border-white/5 text-zinc-400 hover:border-white/15'
                    }`}
                  >
                    {rig.label}
                  </button>
                ))}
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-300 flex items-center gap-1.5">
                    <MousePointer className="w-3 h-3" />
                    Cursor Damping (Physical Weight)
                  </span>
                  <span className="font-mono-tabular text-zinc-400">
                    {config.dampingFactor.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.03"
                  max="0.25"
                  step="0.01"
                  value={config.dampingFactor}
                  onChange={(e) =>
                    updateField('dampingFactor', parseFloat(e.target.value))
                  }
                  className="w-full accent-[#E11D48] cursor-pointer"
                />
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Lower values (0.05–0.08) give heavy framed inertia; high values feel twitchy.
                </p>
              </div>
            </div>
          </>
        )}

        {activeRightTab === 'spline-guide' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-lg bg-[#09090B] border border-white/10">
              <p className="text-xs text-zinc-300 leading-relaxed">
                Open your file in the <strong className="text-[#F4F4F0]">Spline Editor</strong> and apply these 5 targeted adjustments to transform flat planes into physical gallery prints:
              </p>
            </div>

            <div className="space-y-3">
              {SPLINE_FIX_CHECKLIST.map((step) => (
                <div
                  key={step.number}
                  className="p-4 rounded-lg bg-[#09090B] border border-white/10 space-y-2"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-xs font-semibold text-[#F4F4F0]">
                      {step.number}. {step.symptom}
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    <strong className="text-zinc-300">Why it happens:</strong> {step.rootCause}
                  </p>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    <strong className="text-emerald-400">Fix in Spline:</strong> {step.splineAction}
                  </p>
                  <div className="pt-1.5 border-t border-white/5 text-[11px] font-mono-tabular text-amber-300/90">
                    {step.exactValues}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeRightTab === 'nextjs-code' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-[#F4F4F0]">
                  Enhanced Next.js Component
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Drop-in replacement for your Home() component with optical grading &amp; runtime light calibration
                </p>
              </div>
              <button
                onClick={handleCopyCode}
                className="px-3 py-1.5 rounded-md bg-[#E11D48] hover:bg-rose-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Code
                  </>
                )}
              </button>
            </div>

            <pre className="p-4 rounded-lg bg-[#09090B] border border-white/10 text-[11px] font-mono-tabular text-zinc-300 overflow-x-auto leading-relaxed">
              <code>{nextJsCodeSnippet}</code>
            </pre>
          </div>
        )}
      </div>
    </aside>
  );
};
