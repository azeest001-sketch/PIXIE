import imgArchitecture from '../assets/images/print_editorial_architecture_1791391895332.jpg';
import imgBotanical from '../assets/images/print_botanical_cyanotype_1791391911287.jpg';
import imgPortrait from '../assets/images/print_portrait_silhouette_1791391922889.jpg';
import imgDesert from '../assets/images/print_desert_monolith_1791391937069.jpg';

export interface PrintArtwork {
  id: string;
  title: string;
  artist: string;
  year: string;
  medium: string;
  dimensions: string;
  aspectRatio: number; // width / height
  imageUrl: string;
  position: [number, number, number];
  baseRotation: [number, number, number];
}

export interface PrintCalibrationConfig {
  presetName: 'raw-default' | 'hahnemuhle-rag' | 'baryta-satin' | 'museum-acrylic';
  paperStockThicknessMm: number; // 0 (flat plane) to 4.5mm
  matBorderWidthCm: number; // 0 (edge-to-edge) to 4.0cm
  matStockColor: '#F6F4EE' | '#EAE6DF' | '#18181B';
  surfaceRoughness: number; // 0.05 to 0.95
  clearcoatSheen: number; // 0.0 to 1.0
  paperMicrotooth: number; // 0.0 to 1.0 (procedural normal bump)
  lightingRig: 'unlit-flat' | 'warm-gallery-spot' | 'raking-daylight' | 'dramatic-atelier';
  keyLightIntensity: number;
  cursorTiltSensitivity: number; // 0.1 to 1.2
  dampingFactor: number; // 0.03 to 0.25
  anisotropicFiltering: boolean;
  postFilmGrain: number; // 0 to 0.35
  vignetteStrength: number; // 0 to 0.7
}

export const ARTWORKS: PrintArtwork[] = [
  {
    id: 'print-01',
    title: 'Concrete Cantilever IV',
    artist: 'K. Lindqvist',
    year: '2025',
    medium: 'Silver Gelatin on Cotton Rag',
    dimensions: '60 × 80 cm',
    aspectRatio: 0.75,
    imageUrl: imgArchitecture,
    position: [-3.9, 0.25, 0.2],
    baseRotation: [0.02, 0.16, -0.03],
  },
  {
    id: 'print-02',
    title: 'Alabaster Flora Study',
    artist: 'M. Vance',
    year: '2026',
    medium: 'Archival Pigment Print',
    dimensions: '50 × 65 cm',
    aspectRatio: 0.75,
    imageUrl: imgBotanical,
    position: [-1.25, -0.15, 0.55],
    baseRotation: [-0.01, 0.05, 0.02],
  },
  {
    id: 'print-03',
    title: 'Littoral Dusk No. 9',
    artist: 'S. Takahashi',
    year: '2026',
    medium: 'Platinum Palladium Print',
    dimensions: '60 × 80 cm',
    aspectRatio: 0.75,
    imageUrl: imgPortrait,
    position: [1.35, 0.2, 0.4],
    baseRotation: [0.01, -0.06, -0.015],
  },
  {
    id: 'print-04',
    title: 'Travertine Horizon',
    artist: 'E. Rostova',
    year: '2025',
    medium: 'Chromogenic Crystal Archive',
    dimensions: '70 × 52 cm',
    aspectRatio: 1.28,
    imageUrl: imgDesert,
    position: [4.05, -0.1, -0.1],
    baseRotation: [-0.02, -0.18, 0.025],
  },
];

export const CALIBRATION_PRESETS: Record<
  PrintCalibrationConfig['presetName'],
  { label: string; subtitle: string; config: PrintCalibrationConfig }
> = {
  'raw-default': {
    label: 'Raw Spline Default (Why it looks cheap)',
    subtitle: '0mm paper plane · No mat border · Plastic specular glare · Unfiltered mipmaps',
    config: {
      presetName: 'raw-default',
      paperStockThicknessMm: 0.0,
      matBorderWidthCm: 0.0,
      matStockColor: '#F6F4EE',
      surfaceRoughness: 0.18,
      clearcoatSheen: 0.0,
      paperMicrotooth: 0.0,
      lightingRig: 'unlit-flat',
      keyLightIntensity: 2.6,
      cursorTiltSensitivity: 0.85,
      dampingFactor: 0.22,
      anisotropicFiltering: false,
      postFilmGrain: 0.0,
      vignetteStrength: 0.0,
    },
  },
  'hahnemuhle-rag': {
    label: 'Hahnemühle 308g Cotton Rag',
    subtitle: '2.8mm beveled rag stock · Warm museum passe-partout · Organic fiber tooth · Raking spot',
    config: {
      presetName: 'hahnemuhle-rag',
      paperStockThicknessMm: 2.8,
      matBorderWidthCm: 2.2,
      matStockColor: '#F6F4EE',
      surfaceRoughness: 0.82,
      clearcoatSheen: 0.08,
      paperMicrotooth: 0.75,
      lightingRig: 'warm-gallery-spot',
      keyLightIntensity: 1.65,
      cursorTiltSensitivity: 0.45,
      dampingFactor: 0.06,
      anisotropicFiltering: true,
      postFilmGrain: 0.14,
      vignetteStrength: 0.45,
    },
  },
  'baryta-satin': {
    label: 'Ilford Galerie Baryta Satin',
    subtitle: '3.2mm heavy board · Deep pearl clearcoat sheen · Rich Dmax blacks · Raking daylight',
    config: {
      presetName: 'baryta-satin',
      paperStockThicknessMm: 3.2,
      matBorderWidthCm: 1.8,
      matStockColor: '#EAE6DF',
      surfaceRoughness: 0.42,
      clearcoatSheen: 0.55,
      paperMicrotooth: 0.35,
      lightingRig: 'raking-daylight',
      keyLightIntensity: 1.85,
      cursorTiltSensitivity: 0.5,
      dampingFactor: 0.07,
      anisotropicFiltering: true,
      postFilmGrain: 0.12,
      vignetteStrength: 0.4,
    },
  },
  'museum-acrylic': {
    label: 'Diasec Museum Acrylic Mount',
    subtitle: '4.0mm Obsidian aluminum backing · High-gloss optical acrylic face · Dramatic atelier spot',
    config: {
      presetName: 'museum-acrylic',
      paperStockThicknessMm: 4.0,
      matBorderWidthCm: 1.4,
      matStockColor: '#18181B',
      surfaceRoughness: 0.26,
      clearcoatSheen: 0.92,
      paperMicrotooth: 0.15,
      lightingRig: 'dramatic-atelier',
      keyLightIntensity: 1.9,
      cursorTiltSensitivity: 0.4,
      dampingFactor: 0.05,
      anisotropicFiltering: true,
      postFilmGrain: 0.1,
      vignetteStrength: 0.55,
    },
  },
};

export interface SplineFixStep {
  number: string;
  symptom: string;
  rootCause: string;
  splineAction: string;
  exactValues: string;
}

export const SPLINE_FIX_CHECKLIST: SplineFixStep[] = [
  {
    number: '01',
    symptom: 'Photos look like paper-thin digital stickers floating in void',
    rootCause: 'Using a 2D Plane geometry with 0 extrusion and edge-to-edge UV stretching.',
    splineAction: 'Convert Planes to Box or Extruded Rectangles with a warm ivory Passe-Partout border.',
    exactValues: 'Extrusion: 2.5px – 3.5px · Bevel: 0.4px ·Bevel Sides: 3 · Inner Image Inset: 8%–12%',
  },
  {
    number: '02',
    symptom: 'Harsh white plastic glare washes out the photo when tilting',
    rootCause: 'Default Phong/Lambert material or overly low Roughness under a head-on Directional Light.',
    splineAction: 'Switch Material to Physical (PBR). Increase Roughness for cotton paper and use Clearcoat for subtle satin sheen.',
    exactValues: 'Material: Physical · Roughness: 0.78 · Metalness: 0.0 · Reflectivity: 0.15 · Clearcoat: 0.12',
  },
  {
    number: '03',
    symptom: 'Image textures look blurry, pixelated, or shimmering at cursor tilt angles',
    rootCause: 'Spline compresses uploaded JPEGs by default and lacks anisotropic texture sampling on steep angles.',
    splineAction: 'In Image Layer settings, set Compression to Lossless/High, Filtering to Trilinear, and add a 3% Overlay Noise layer for paper tooth.',
    exactValues: 'Image Filtering: Linear/Mipmap · Bump Map: Fine Noise (Scale 0.02, Intensity 1.5)',
  },
  {
    number: '04',
    symptom: 'Cursor "Look At" feels robotic, twitchy, and breaks the illusion of weight',
    rootCause: 'Look At Event has Distance too small and Damping disabled or too fast.',
    splineAction: 'Select the Group/Print → Events → Look At. Increase Damping and clamp rotation limits so prints move like heavy framed stock.',
    exactValues: 'Damping: 85–92 · Distance: 450 · Clamp X/Y: ±18° · Z-Axis Lock: Enabled',
  },
  {
    number: '05',
    symptom: 'Colors look muddy or washed out compared to the original photo file',
    rootCause: 'Ambient Light is too high (flattening contrast) and Image Layer blend mode is affected by scene tint.',
    splineAction: 'Lower Ambient Light intensity to 0.25, place one warm Spot Light above at a 35° raking angle, and enable Post-Processing Vignette + Noise.',
    exactValues: 'Ambient: 0.25 (#EAE6DF) · Spot Light: 1.6 (Angle 42°, Penumbra 0.8, Cast Shadow: ON)',
  },
];
