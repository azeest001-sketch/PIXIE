import React, { useState, useRef } from 'react';
import Spline from '@splinetool/react-spline';
import type { Application } from '@splinetool/runtime';
import { PrintCalibrationConfig } from '../data/printCalibrationData';
import { Sliders, Eye, Sparkles, RotateCcw } from 'lucide-react';

interface LiveSplineStageProps {
  sceneUrl: string;
  config: PrintCalibrationConfig;
}

export const LiveSplineStage: React.FC<LiveSplineStageProps> = ({ sceneUrl, config }) => {
  const splineAppRef = useRef<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [enhanceWrapperActive, setEnhanceWrapperActive] = useState(true);
  const [objectCount, setObjectCount] = useState<number>(0);

  const handleSplineLoad = (splineApp: Application) => {
    splineAppRef.current = splineApp;
    setIsLoading(false);
    try {
      const allObjects = splineApp.getAllObjects();
      setObjectCount(allObjects.length);
    } catch {
      setObjectCount(0);
    }
  };

  const handleResetCamera = () => {
    if (splineAppRef.current) {
      try {
        splineAppRef.current.setZoom(1);
      } catch {
        // Ignore if zoom isn't supported on this camera setup
      }
    }
  };

  // Calculate optical grading CSS filter when "Studio Optical Grading" is toggled on
  const opticalFilter = enhanceWrapperActive
    ? 'contrast(1.06) saturate(0.92) brightness(0.97) drop-shadow(0 24px 48px rgba(0,0,0,0.65))'
    : 'none';

  return (
    <div className="relative w-full h-full bg-[#09090B] overflow-hidden flex flex-col">
      {/* Top Floating Control Bar for the Live Spline Scene */}
      <div className="absolute top-4 left-6 right-6 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="pointer-events-auto bg-black/65 backdrop-blur-md border border-white/10 px-4 py-2 rounded-lg flex items-center gap-3 text-xs text-zinc-300">
          <span className="font-medium text-[#F4F4F0]">Your Live Spline Scene</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono-tabular text-zinc-400 truncate max-w-[260px]">
            prod.spline.design/I8Py7bJvnLpjOh4Z/scene.splinecode
          </span>
          {objectCount > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular text-emerald-400">{objectCount} scene nodes</span>
            </>
          )}
        </div>

        <div className="pointer-events-auto flex items-center gap-2 bg-black/65 backdrop-blur-md border border-white/10 p-1 rounded-lg">
          <button
            onClick={() => setEnhanceWrapperActive(false)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              !enhanceWrapperActive
                ? 'bg-white text-zinc-950'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Unmodified Raw Canvas
          </button>
          <button
            onClick={() => setEnhanceWrapperActive(true)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              enhanceWrapperActive
                ? 'bg-[#E11D48] text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            With Optical Film Grade + Vignette
          </button>
          <button
            onClick={handleResetCamera}
            title="Reset Spline Zoom"
            className="p-1.5 text-zinc-400 hover:text-white rounded-md transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Loading Backdrop */}
      {isLoading && !loadError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#09090B] text-zinc-400 gap-3">
          <div className="w-8 h-8 border-2 border-zinc-700 border-t-[#F4F4F0] rounded-full animate-spin" />
          <p className="text-xs tracking-wide">
            Streaming scene.splinecode from prod.spline.design...
          </p>
        </div>
      )}

      {/* Error Fallback if blocked by network */}
      {loadError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#09090B] p-6 text-center">
          <p className="text-sm font-medium text-[#F4F4F0] mb-1">
            Unable to reach prod.spline.design in this browser session
          </p>
          <p className="text-xs text-zinc-400 max-w-md mb-4">
            Switch to the Calibrated Archival 3D Stage tab to inspect the physically based print
            substrate, raking lighting, and cursor damping upgrades.
          </p>
        </div>
      )}

      {/* Actual Spline Canvas */}
      <div
        className="w-full h-full flex-1 transition-all duration-300"
        style={{ filter: opticalFilter }}
      >
        <Spline
          scene={sceneUrl}
          onLoad={handleSplineLoad}
          onError={() => setLoadError(true)}
        />
      </div>

      {/* Optional CSS Optical Overlays (can be wrapped around <Spline /> in Next.js immediately) */}
      {enhanceWrapperActive && (
        <>
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle at center, transparent 40%, rgba(5, 5, 7, ${Math.max(
                0.45,
                config.vignetteStrength
              )}) 100%)`,
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 mix-blend-overlay"
            style={{
              opacity: Math.max(0.14, config.postFilmGrain),
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />
        </>
      )}

      {/* Bottom explanation bar */}
      <div className="pointer-events-none absolute bottom-5 left-6 right-6 z-20 flex flex-wrap items-center justify-between gap-4">
        <div className="bg-black/65 backdrop-blur-md border border-white/10 px-4 py-2 rounded-lg text-xs text-zinc-300 flex items-center gap-2.5">
          <Eye className="w-3.5 h-3.5 text-zinc-400" />
          <span>
            Notice how raw 2D planes in Spline lack edge depth and catch flat specular glare when tilting.
          </span>
        </div>
        <div className="bg-black/65 backdrop-blur-md border border-white/10 px-4 py-2 rounded-lg text-xs text-zinc-400 flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-[#E11D48]" />
          <span>
            Toggle &ldquo;Calibrated Archival 3D Stage&rdquo; in the top bar to test 2.8mm rag board &amp; raking light.
          </span>
        </div>
      </div>
    </div>
  );
};
