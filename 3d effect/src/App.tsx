import React from 'react';
import {
  DEFAULT_MODERN_CONFIG,
  PIXIE_RIGHT_CLUSTER_CARDS,
} from './data/pixieData';
import { Pixie3DStage } from './components/Pixie3DStage';

export default function App() {
  return (
    <main className="h-screen w-screen bg-[#060608] overflow-hidden">
      <Pixie3DStage
        cardsData={PIXIE_RIGHT_CLUSTER_CARDS}
        config={DEFAULT_MODERN_CONFIG}
      />
    </main>
  );
}
