import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ARTWORKS, PrintArtwork, PrintCalibrationConfig } from '../data/printCalibrationData';

interface ArchivalPrintStageProps {
  config: PrintCalibrationConfig;
  selectedArtworkId: string | null;
  onSelectArtwork: (artwork: PrintArtwork) => void;
  splitComparisonMode: boolean;
}

// Helper to generate procedural fine cotton rag micro-tooth bump texture
function createPaperToothTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    // Subtle high-frequency organic cotton fiber grain
    const grain = 128 + (Math.random() - 0.5) * 90;
    data[i] = grain;
    data[i + 1] = grain;
    data[i + 2] = grain;
    data[i + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  return texture;
}

export const ArchivalPrintStage: React.FC<ArchivalPrintStageProps> = ({
  config,
  selectedArtworkId,
  onSelectArtwork,
  splitComparisonMode,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const configRef = useRef<PrintCalibrationConfig>(config);
  configRef.current = config;

  const [webglError, setWebglError] = useState(false);
  const [hoveredTitle, setHoveredTitle] = useState<string | null>(null);
  const [cursorTelemetry, setCursorTelemetry] = useState({ x: 0, y: 0 });

  // Store Three.js references for live reactive parameter updates without recreating the scene
  const sceneObjectsRef = useRef<{
    renderer?: THREE.WebGLRenderer;
    scene?: THREE.Scene;
    camera?: THREE.PerspectiveCamera;
    ambientLight?: THREE.AmbientLight;
    keySpotLight?: THREE.SpotLight;
    rimLight?: THREE.DirectionalLight;
    fillLight?: THREE.PointLight;
    printGroups: {
      artwork: PrintArtwork;
      rootGroup: THREE.Group;
      substrateMesh: THREE.Mesh;
      photoMesh: THREE.Mesh;
      bevelEdgeMesh: THREE.LineSegments;
      substrateMat: THREE.MeshPhysicalMaterial;
      photoMat: THREE.MeshPhysicalMaterial;
      targetRotX: number;
      targetRotY: number;
    }[];
  }>({ printGroups: [] });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
        alpha: false,
      });
    } catch {
      setWebglError(true);
      return;
    }

    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglError(true);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#09090B');
    scene.fog = new THREE.FogExp2('#09090B', 0.045);

    const camera = new THREE.PerspectiveCamera(
      36,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0.1, 8.8);

    // Subtle dark gallery back wall to catch soft shadows
    const wallGeo = new THREE.PlaneGeometry(32, 18);
    const wallMat = new THREE.MeshStandardMaterial({
      color: '#0D0D11',
      roughness: 0.92,
      metalness: 0.05,
    });
    const backWall = new THREE.Mesh(wallGeo, wallMat);
    backWall.position.z = -1.15;
    backWall.receiveShadow = true;
    scene.add(backWall);

    // Lighting Rig
    const ambientLight = new THREE.AmbientLight('#EAE6DF', 0.45);
    scene.add(ambientLight);

    const keySpotLight = new THREE.SpotLight('#FFF7ED', 1.8);
    keySpotLight.position.set(1.5, 5.2, 5.5);
    keySpotLight.angle = Math.PI / 3.2;
    keySpotLight.penumbra = 0.85;
    keySpotLight.decay = 1.1;
    keySpotLight.distance = 25;
    keySpotLight.castShadow = true;
    keySpotLight.shadow.mapSize.width = 2048;
    keySpotLight.shadow.mapSize.height = 2048;
    keySpotLight.shadow.bias = -0.0005;
    scene.add(keySpotLight);

    const rimLight = new THREE.DirectionalLight('#93C5FD', 0.55);
    rimLight.position.set(-4.5, 2.5, -2.0);
    scene.add(rimLight);

    const fillLight = new THREE.PointLight('#FDE68A', 0.45, 16);
    fillLight.position.set(-3.2, -2.2, 4.0);
    scene.add(fillLight);

    const paperToothMap = createPaperToothTexture();
    const textureLoader = new THREE.TextureLoader();
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

    const printGroups: typeof sceneObjectsRef.current.printGroups = [];

    ARTWORKS.forEach((art) => {
      const rootGroup = new THREE.Group();
      rootGroup.position.set(...art.position);
      rootGroup.rotation.set(...art.baseRotation);
      rootGroup.userData = { artwork: art };

      const baseHeight = 2.55;
      const baseWidth = baseHeight * art.aspectRatio;

      // 1. Archival Substrate / Passe-Partout Mat Board
      const substrateGeo = new THREE.BoxGeometry(baseWidth, baseHeight, 0.05);
      const substrateMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(configRef.current.matStockColor),
        roughness: 0.86,
        metalness: 0.0,
        bumpMap: paperToothMap,
        bumpScale: 0.004,
        clearcoat: 0.04,
      });

      const substrateMesh = new THREE.Mesh(substrateGeo, substrateMat);
      substrateMesh.castShadow = true;
      substrateMesh.receiveShadow = true;
      substrateMesh.userData = { artwork: art };
      rootGroup.add(substrateMesh);

      // Subtle archival bevel edge highlight around the mat board
      const edgesGeo = new THREE.EdgesGeometry(substrateGeo);
      const edgesMat = new THREE.LineBasicMaterial({
        color: '#FFFFFF',
        transparent: true,
        opacity: 0.12,
      });
      const bevelEdgeMesh = new THREE.LineSegments(edgesGeo, edgesMat);
      rootGroup.add(bevelEdgeMesh);

      // 2. High-Resolution Photographic Print Layer (Slightly inset & raised 0.8mm above mat)
      const photoGeo = new THREE.PlaneGeometry(baseWidth, baseHeight);
      const loadedTex = textureLoader.load(art.imageUrl, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = configRef.current.anisotropicFiltering ? maxAnisotropy : 1;
        tex.needsUpdate = true;
      });
      loadedTex.colorSpace = THREE.SRGBColorSpace;

      const photoMat = new THREE.MeshPhysicalMaterial({
        map: loadedTex,
        roughness: configRef.current.surfaceRoughness,
        metalness: 0.0,
        clearcoat: configRef.current.clearcoatSheen,
        clearcoatRoughness: 0.25,
        bumpMap: paperToothMap,
        bumpScale: configRef.current.paperMicrotooth * 0.006,
        reflectivity: 0.22,
      });

      const photoMesh = new THREE.Mesh(photoGeo, photoMat);
      photoMesh.position.z = 0.026;
      photoMesh.userData = { artwork: art };
      rootGroup.add(photoMesh);

      scene.add(rootGroup);

      printGroups.push({
        artwork: art,
        rootGroup,
        substrateMesh,
        photoMesh,
        bevelEdgeMesh,
        substrateMat,
        photoMat,
        targetRotX: art.baseRotation[0],
        targetRotY: art.baseRotation[1],
      });
    });

    sceneObjectsRef.current = {
      renderer,
      scene,
      camera,
      ambientLight,
      keySpotLight,
      rimLight,
      fillLight,
      printGroups,
    };

    // Pointer / Cursor Tracking & Raycasting
    const pointer = new THREE.Vector2(0, 0);
    const raycaster = new THREE.Raycaster();

    const handlePointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      pointer.set(nx, ny);
      setCursorTelemetry({
        x: Math.round(nx * 100),
        y: Math.round(ny * 100),
      });

      // Check hover
      raycaster.setFromCamera(pointer, camera);
      const meshes = printGroups.flatMap((g) => [g.photoMesh, g.substrateMesh]);
      const intersects = raycaster.intersectObjects(meshes, false);
      if (intersects.length > 0) {
        const hitArt = intersects[0].object.userData.artwork as PrintArtwork | undefined;
        setHoveredTitle(hitArt ? `${hitArt.title} (${hitArt.medium})` : null);
        renderer.domElement.style.cursor = 'pointer';
      } else {
        setHoveredTitle(null);
        renderer.domElement.style.cursor = 'grab';
      }
    };

    const handleClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      pointer.set(nx, ny);
      raycaster.setFromCamera(pointer, camera);
      const meshes = printGroups.flatMap((g) => [g.photoMesh, g.substrateMesh]);
      const intersects = raycaster.intersectObjects(meshes, false);
      if (intersects.length > 0) {
        const hitArt = intersects[0].object.userData.artwork as PrintArtwork | undefined;
        if (hitArt) {
          onSelectArtwork(hitArt);
        }
      }
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('mousemove', handlePointerMove);
    domElem.addEventListener('click', handleClick);

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop with Smooth Spring Damping & Cursor Look-At
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      const activeConfig = configRef.current;

      // Subtle key light follow for lively specular grazing across paper fibers
      keySpotLight.position.x = 1.5 + pointer.x * 2.4;
      keySpotLight.position.y = 4.8 + pointer.y * 1.5;

      printGroups.forEach((item, idx) => {
        const { artwork, rootGroup } = item;

        // Calculate cursor relative to print's horizontal position in world space
        const normalizedPrintX = artwork.position[0] / 4.5;
        const deltaX = pointer.x - normalizedPrintX * 0.35;
        const deltaY = pointer.y;

        // Clamp rotation so prints never flip or distort unnaturally
        const maxTilt = 0.55 * activeConfig.cursorTiltSensitivity;
        const desiredRotY =
          artwork.baseRotation[1] + THREE.MathUtils.clamp(deltaX * maxTilt, -0.48, 0.48);
        const desiredRotX =
          artwork.baseRotation[0] + THREE.MathUtils.clamp(-deltaY * maxTilt * 0.85, -0.38, 0.38);

        // Apply physical damping (lower = heavier gallery frame inertia)
        const lerpFactor = activeConfig.dampingFactor;
        rootGroup.rotation.y += (desiredRotY - rootGroup.rotation.y) * lerpFactor;
        rootGroup.rotation.x += (desiredRotX - rootGroup.rotation.x) * lerpFactor;

        // Gentle organic floating breathing motion
        const floatOffset = Math.sin(elapsedTime * 1.3 + idx * 1.4) * 0.035;
        // Bring closer to camera when cursor is near this print
        const proximityBoost = Math.max(0, 1 - Math.abs(pointer.x - normalizedPrintX)) * 0.28;
        const targetZ = artwork.position[2] + proximityBoost;
        rootGroup.position.z += (targetZ - rootGroup.position.z) * 0.06;
        rootGroup.position.y = artwork.position[1] + floatOffset;
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      domElem.removeEventListener('mousemove', handlePointerMove);
      domElem.removeEventListener('click', handleClick);
      domElem.removeEventListener('webglcontextlost', handleContextLost);
      renderer.dispose();
    };
  }, [onSelectArtwork]);

  // Synchronize live calibration sliders with Three.js materials and geometry
  useEffect(() => {
    const { ambientLight, keySpotLight, rimLight, fillLight, printGroups, renderer } =
      sceneObjectsRef.current;
    if (!printGroups.length || !renderer) return;

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

    // Update lighting rig
    if (ambientLight && keySpotLight && rimLight && fillLight) {
      if (config.lightingRig === 'unlit-flat') {
        // Mimics the "cheap" Spline look: overly bright ambient + harsh head-on directional glare
        ambientLight.intensity = 1.65;
        ambientLight.color.set('#FFFFFF');
        keySpotLight.position.set(0, 0.5, 6.5);
        keySpotLight.intensity = config.keyLightIntensity * 1.35;
        keySpotLight.color.set('#FFFFFF');
        rimLight.intensity = 0;
        fillLight.intensity = 0;
      } else if (config.lightingRig === 'warm-gallery-spot') {
        ambientLight.intensity = 0.35;
        ambientLight.color.set('#EAE6DF');
        keySpotLight.intensity = config.keyLightIntensity;
        keySpotLight.color.set('#FFF5EA');
        rimLight.intensity = 0.45;
        fillLight.intensity = 0.4;
      } else if (config.lightingRig === 'raking-daylight') {
        ambientLight.intensity = 0.5;
        ambientLight.color.set('#F1F5F9');
        keySpotLight.intensity = config.keyLightIntensity * 1.1;
        keySpotLight.color.set('#F8FAFC');
        rimLight.intensity = 0.7;
        fillLight.intensity = 0.3;
      } else if (config.lightingRig === 'dramatic-atelier') {
        ambientLight.intensity = 0.18;
        ambientLight.color.set('#D4D4D8');
        keySpotLight.intensity = config.keyLightIntensity * 1.25;
        keySpotLight.color.set('#FDE68A');
        rimLight.intensity = 0.85;
        fillLight.intensity = 0.25;
      }
    }

    printGroups.forEach((item, index) => {
      // If Split Comparison Mode is active, left 2 prints show "Raw Cheap Default" and right 2 show "Calibrated Archival"
      const isRawSide = splitComparisonMode && index < 2;

      const thicknessMm = isRawSide ? 0.0 : config.paperStockThicknessMm;
      const borderCm = isRawSide ? 0.0 : config.matBorderWidthCm;
      const roughness = isRawSide ? 0.14 : config.surfaceRoughness;
      const clearcoat = isRawSide ? 0.0 : config.clearcoatSheen;
      const microtooth = isRawSide ? 0.0 : config.paperMicrotooth;
      const matColor = isRawSide ? '#FFFFFF' : config.matStockColor;

      // Scale substrate thickness & mat border
      const thicknessScale = Math.max(0.02, (thicknessMm / 2.8) * 1.1);
      const borderRatio = 1 + borderCm * 0.055;

      item.substrateMesh.scale.set(borderRatio, borderRatio, thicknessScale);
      item.bevelEdgeMesh.scale.set(borderRatio, borderRatio, thicknessScale);
      item.bevelEdgeMesh.visible = thicknessMm > 0.2;

      // Position photo layer immediately in front of the scaled substrate face
      const halfDepth = (0.05 * thicknessScale) / 2;
      item.photoMesh.position.z = halfDepth + 0.002;

      // Update materials
      item.substrateMat.color.set(matColor);
      item.photoMat.roughness = roughness;
      item.photoMat.clearcoat = clearcoat;
      item.photoMat.bumpScale = microtooth * 0.007;

      if (item.photoMat.map) {
        item.photoMat.map.anisotropy =
          !isRawSide && config.anisotropicFiltering ? maxAnisotropy : 1;
        item.photoMat.map.needsUpdate = true;
      }
      item.photoMat.needsUpdate = true;
    });
  }, [config, splitComparisonMode]);

  if (webglError) {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-[#09090B] p-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl w-full">
          {ARTWORKS.map((art) => (
            <button
              key={art.id}
              onClick={() => onSelectArtwork(art)}
              className="group text-left bg-[#F4F4F0] p-4 shadow-2xl transition-transform hover:-translate-y-1"
            >
              <img
                src={art.imageUrl}
                alt={art.title}
                referrerPolicy="no-referrer"
                className="w-full h-64 object-cover mb-3"
              />
              <p className="text-xs font-semibold text-zinc-900">{art.title}</p>
              <p className="text-[11px] text-zinc-500">{art.medium}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-[#09090B]">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Optical Vignette Overlay */}
      {config.vignetteStrength > 0 && (
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at center, transparent 42%, rgba(5, 5, 7, ${config.vignetteStrength}) 100%)`,
          }}
        />
      )}

      {/* Analog Film Grain Post-Processing Layer */}
      {config.postFilmGrain > 0 && (
        <div
          className="pointer-events-none absolute inset-0 mix-blend-overlay"
          style={{
            opacity: config.postFilmGrain,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      )}

      {/* Split-Screen A/B Diagnostic Divider Banner */}
      {splitComparisonMode && (
        <div className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 flex flex-col items-center justify-between py-6 z-10">
          <div className="bg-black/75 backdrop-blur-md border border-white/15 px-4 py-1.5 rounded-md text-xs tracking-wide text-[#F4F4F0] flex items-center gap-4 shadow-xl">
            <span className="text-rose-400 font-medium">← Left 2: Raw Flat Plane (Cheap)</span>
            <span className="text-zinc-600">|</span>
            <span className="text-emerald-300 font-medium">Right 2: Calibrated Archival Print →</span>
          </div>
          <div className="w-px flex-1 bg-gradient-to-b from-white/25 via-white/10 to-white/25 my-2" />
        </div>
      )}

      {/* Subtle Floating HUD Telemetry & Hover Readout */}
      <div className="pointer-events-none absolute bottom-5 left-6 right-6 flex flex-wrap items-center justify-between gap-4 z-10">
        <div className="bg-black/55 backdrop-blur-md border border-white/10 px-3.5 py-2 rounded-lg text-xs text-zinc-300 flex items-center gap-3">
          <span>Move cursor to tilt prints</span>
          <span aria-hidden="true">·</span>
          <span>Click any print to inspect framing & EXIF</span>
          {hoveredTitle && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-[#F4F4F0] font-medium">{hoveredTitle}</span>
            </>
          )}
        </div>

        <div className="bg-black/55 backdrop-blur-md border border-white/10 px-3.5 py-2 rounded-lg text-xs font-mono-tabular text-zinc-400 flex items-center gap-3">
          <span>
            CURSOR X:{cursorTelemetry.x >= 0 ? `+${cursorTelemetry.x}` : cursorTelemetry.x}% Y:
            {cursorTelemetry.y >= 0 ? `+${cursorTelemetry.y}` : cursorTelemetry.y}%
          </span>
          <span aria-hidden="true">·</span>
          <span>STOCK: {config.paperStockThicknessMm.toFixed(1)}mm</span>
          <span aria-hidden="true">·</span>
          <span>ROUGHNESS: {config.surfaceRoughness.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};
