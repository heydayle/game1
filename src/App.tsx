import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { SoundFX } from "./features/audio/SoundFXEngine.js";
import { DisasterControlHUD } from "./features/disasters/components/DisasterControlHUD.js";
import { BiomeGridGenerator } from "./features/environment/climate/BiomeGridGenerator.js";
import { BiogeochemicalHUD } from "./features/environment/components/BiogeochemicalHUD.js";
import { EcosystemHUD } from "./features/evolution/components/EcosystemHUD.js";
import { GenesisModal } from "./features/genesis/components/GenesisModal.js";
import { SaveManagerModal } from "./features/persistence/components/SaveManagerModal.js";
import { Planet } from "./features/planet/components/Planet.js";
import { PlanetInspectHUD } from "./features/planet/components/PlanetInspectHUD.js";
import type { PlanetInspectData } from "./features/planet/components/PlanetSurface.js";
import { DebugPanel } from "./features/simulation/components/DebugPanel.js";
import { KeyboardShortcutsModal } from "./features/simulation/components/KeyboardShortcutsModal.js";
import { WelcomeOnboardingModal } from "./features/genesis/components/WelcomeOnboardingModal.js";
import { useSimulation } from "./features/simulation/hooks/useSimulation.js";
import { SceneCanvas } from "./rendering/canvas/SceneCanvas.js";
import { usePlanetStore } from "./stores/planet-store.js";
import type { DisasterType } from "./features/disasters/types.js";

export default function App() {
  const {
    snapshot,
    isReady,
    start,
    pause,
    setSpeed,
    syncPlanet,
    seedPopulation,
    triggerStress,
    triggerDisaster,
    sparkBiogenesis,
    exportState,
    loadState,
  } = useSimulation();
  const {
    currentPlanet,
    openGenesisModal,
    randomizePlanet,
    loadPlanet,
    loadDefaultPlanet,
  } = usePlanetStore();
  const [inspectData, setInspectData] = useState<PlanetInspectData | null>(
    null,
  );
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isCinematic, setIsCinematic] = useState(false);
  const [isHudVisible, setIsHudVisible] = useState(true);
  const [isSoundMuted, setIsSoundMuted] = useState(() => SoundFX.getMuted());
  const isRestoringSaveRef = useRef(false);

  // Check first-time user welcome modal
  useEffect(() => {
    if (typeof localStorage !== "undefined") {
      const welcomed = localStorage.getItem("evolution_sandbox_welcomed");
      if (!welcomed) {
        setIsWelcomeModalOpen(true);
      }
    }
  }, []);

  const sunDirection = useMemo(() => new THREE.Vector3(6, 3, 5), []);

  // Calculate planetary biome distribution stats
  const biomeDistribution = useMemo(() => {
    const grid = BiomeGridGenerator.generateGrid(currentPlanet);
    return BiomeGridGenerator.calculateDistributionStats(grid);
  }, [currentPlanet]);

  // Audio helpers
  const toggleSound = () => {
    const nextMuted = SoundFX.toggleMute();
    setIsSoundMuted(nextMuted);
  };

  const handleTriggerDisaster = (disasterType: DisasterType, severity = 0.8) => {
    SoundFX.playDisaster(disasterType, severity);
    triggerDisaster(disasterType, severity);
  };

  const handleSparkBiogenesis = () => {
    SoundFX.playBiogenesisSpark();
    sparkBiogenesis();
  };

  const handleOpenGenesis = () => {
    SoundFX.playClick();
    openGenesisModal();
  };

  const handleStartCustomGenesis = () => {
    SoundFX.playClick();
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("evolution_sandbox_welcomed", "true");
    }
    setIsWelcomeModalOpen(false);
    openGenesisModal();
  };

  const handleSelectDefaultPlanet = () => {
    SoundFX.playClick();
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("evolution_sandbox_welcomed", "true");
    }
    setIsWelcomeModalOpen(false);
    loadDefaultPlanet();
  };

  const handleOpenSaveManager = () => {
    SoundFX.playClick();
    setIsSaveModalOpen(true);
  };

  const handleRandomizePlanet = () => {
    SoundFX.playClick();
    randomizePlanet();
  };

  // Sync current planet configuration with the Simulation Web Worker
  useEffect(() => {
    if (isReady && currentPlanet) {
      if (isRestoringSaveRef.current) {
        // Skip re-sync reset when restoring a saved world
        isRestoringSaveRef.current = false;
        return;
      }
      syncPlanet(currentPlanet);
    }
  }, [isReady, currentPlanet, syncPlanet]);

  // Global Keyboard Shortcuts (Phase 8 Polish)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      // Ctrl+S / Cmd+S: Save Manager
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        SoundFX.playClick();
        setIsSaveModalOpen(true);
        return;
      }

      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        SoundFX.playClick();
        if (snapshot.status === "running") {
          pause();
        } else {
          start();
        }
        return;
      }

      if (e.key === "1") {
        SoundFX.playClick();
        setSpeed(1);
      } else if (e.key === "2") {
        SoundFX.playClick();
        setSpeed(10);
      } else if (e.key === "3") {
        SoundFX.playClick();
        setSpeed(100);
      } else if (e.key === "4") {
        SoundFX.playClick();
        setSpeed(1000);
      } else if (e.key.toLowerCase() === "c") {
        SoundFX.playClick();
        setIsCinematic((prev) => !prev);
      } else if (e.key.toLowerCase() === "m") {
        toggleSound();
      } else if (e.key.toLowerCase() === "h") {
        SoundFX.playClick();
        setIsHudVisible((prev) => !prev);
      } else if (e.key.toLowerCase() === "g") {
        handleOpenGenesis();
      } else if (e.key === "?") {
        SoundFX.playClick();
        setIsShortcutsModalOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [snapshot.status, pause, start, setSpeed]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black select-none">
      {/* 3D Scene */}
      <SceneCanvas
        sunPosition={[sunDirection.x, sunDirection.y, sunDirection.z]}
        isCinematic={isCinematic}
      >
        <Planet
          radius={1.6}
          axialTiltDeg={currentPlanet.axialTiltDeg}
          rotations={snapshot.rotations}
          partialRotation={snapshot.partialRotation}
          sunDirection={sunDirection}
          seed={currentPlanet.seed}
          oceanLevel={currentPlanet.oceanLevel}
          iceCapLatitude={currentPlanet.iceCapLatitude}
          atmosphereColor={currentPlanet.atmosphereColor}
          biomeCells={snapshot.biomeCells}
          perturbations={snapshot.perturbations}
          activeDisasters={snapshot.activeDisasters}
          biogeochemical={snapshot.biogeochemical}
          onInspect={setInspectData}
        />
      </SceneCanvas>

      {/* Floating HUD toggle pill when HUDs are hidden (Cinematic mode) */}
      {!isHudVisible && (
        <button
          onClick={() => {
            SoundFX.playClick();
            setIsHudVisible(true);
          }}
          className="fixed bottom-4 right-4 z-20 rounded-full border border-white/20 bg-gray-950/80 px-3 py-1.5 font-mono text-xs text-gray-300 shadow-xl backdrop-blur-md hover:bg-white/10 hover:text-white transition-all"
        >
          👁 Show HUDs (H)
        </button>
      )}

      {/* Main HUD Overlays (toggleable with 'H') */}
      {isHudVisible && (
        <>
          {/* Planetary Disaster Arsenal & Alert Banner (Top-Center) */}
          <DisasterControlHUD
            activeDisasters={snapshot.activeDisasters}
            perturbations={snapshot.perturbations}
            onTriggerDisaster={handleTriggerDisaster}
          />

          {/* Biogeochemical & Atmospheric Matrix HUD (Left-Side) */}
          <BiogeochemicalHUD
            biogeochemical={snapshot.biogeochemical}
            rotations={snapshot.rotations}
            partialRotation={snapshot.partialRotation}
          />

          {/* Top Header & Navigation Bar */}
          <div className="fixed top-4 left-4 z-10 font-mono">
            <h1 className="text-sm font-semibold tracking-wider text-white uppercase drop-shadow">
              Evolution Sandbox
            </h1>
            <p className="text-[11px] text-cyan-400 font-medium">
              Phase 8 — Optimization, Visual Polish & Audio-Visual Immersion
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button
                onClick={handleOpenGenesis}
                className="rounded bg-blue-600/80 hover:bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white transition-all shadow-md backdrop-blur-sm"
              >
                ✦ Genesis (G)
              </button>
              <button
                onClick={handleOpenSaveManager}
                className="rounded bg-cyan-700/80 hover:bg-cyan-600 px-2.5 py-1 text-xs font-semibold text-white transition-all shadow-md backdrop-blur-sm"
              >
                💾 Archives
              </button>
              <button
                onClick={handleRandomizePlanet}
                className="rounded bg-gray-800/80 hover:bg-gray-700 px-2.5 py-1 text-xs font-medium text-gray-300 transition-all border border-white/10 backdrop-blur-sm"
                title="Randomize Planetary Seed"
              >
                ↻ Roll Seed
              </button>
              <button
                onClick={() => {
                  SoundFX.playClick();
                  setIsCinematic((prev) => !prev);
                }}
                className={`rounded px-2 py-1 text-xs font-medium transition-all border backdrop-blur-sm ${
                  isCinematic
                    ? "bg-amber-600/80 border-amber-400 text-white shadow-md shadow-amber-500/20"
                    : "bg-gray-800/80 border-white/10 text-gray-300 hover:bg-gray-700"
                }`}
                title="Toggle Cinematic Auto-Orbit Camera (C)"
              >
                {isCinematic ? "🎥 Orbit: ON" : "🎥 Orbit: OFF"}
              </button>
              <button
                onClick={toggleSound}
                className={`rounded px-2 py-1 text-xs font-medium transition-all border backdrop-blur-sm ${
                  !isSoundMuted
                    ? "bg-emerald-700/80 border-emerald-400 text-white shadow-md shadow-emerald-500/20"
                    : "bg-gray-800/80 border-white/10 text-gray-400 hover:bg-gray-700"
                }`}
                title="Toggle Sound Effects & Audio (M)"
              >
                {!isSoundMuted ? "🔊 Audio: ON" : "🔇 Audio: MUTE"}
              </button>
              <button
                onClick={() => {
                  SoundFX.playClick();
                  setIsShortcutsModalOpen(true);
                }}
                className="rounded bg-gray-800/80 hover:bg-gray-700 px-2 py-1 text-xs font-medium text-cyan-300 transition-all border border-cyan-500/30 backdrop-blur-sm"
                title="Keyboard Shortcuts & Controls (?)"
              >
                ⌨ ?
              </button>
            </div>
          </div>

          {/* Planetary Inspection Readout HUD (Top-Right) */}
          <PlanetInspectHUD
            inspectData={inspectData}
            planetName={currentPlanet.name}
            surfaceTemperatureCelsius={currentPlanet.surfaceTemperatureCelsius}
            axialTiltDeg={currentPlanet.axialTiltDeg}
            rotations={snapshot.rotations}
            onOpenGenesis={handleOpenGenesis}
          />

          {/* Biosphere Monitor & Evolution Controls (Bottom-Right) */}
          <EcosystemHUD
            totalPopulation={snapshot.totalPopulation}
            activeSpeciesCount={snapshot.activeSpeciesCount}
            extinctSpeciesCount={snapshot.extinctSpeciesCount}
            averageFitness={snapshot.averageFitness}
            generation={snapshot.generation}
            speciesSummaries={snapshot.speciesSummaries}
            biomeDistribution={biomeDistribution}
            prebioticState={snapshot.prebioticState}
            onSeedLife={() => {
              SoundFX.playClick();
              seedPopulation(40);
            }}
            onTriggerStress={() => {
              SoundFX.playClick();
              triggerStress(0.8);
            }}
            onSparkBiogenesis={handleSparkBiogenesis}
          />

          {/* Simulation Engine Debug & Controls (Bottom-Left) */}
          <DebugPanel />
        </>
      )}

      {/* Genesis Questionnaire & Dossier Modal */}
      <GenesisModal />

      {/* World Archives & Save Manager Modal */}
      <SaveManagerModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        currentPlanet={currentPlanet}
        currentRotations={snapshot.rotations}
        onExportCurrentState={exportState}
        onLoadState={loadState}
        onPlanetLoaded={(planetConfig) => {
          isRestoringSaveRef.current = true;
          loadPlanet(planetConfig);
        }}
      />

      {/* First-Time Welcome & Onboarding Modal */}
      <WelcomeOnboardingModal
        isOpen={isWelcomeModalOpen}
        onStartCustomGenesis={handleStartCustomGenesis}
        onSelectDefaultPlanet={handleSelectDefaultPlanet}
      />

      {/* Keyboard Shortcuts Guide Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />
    </div>
  );
}

