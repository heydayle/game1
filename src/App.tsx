import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { SoundFX } from "./features/audio/SoundFXEngine.js";
import { DisasterControlHUD } from "./features/disasters/components/DisasterControlHUD.js";
import type { DisasterType } from "./features/disasters/types.js";
import { BiomeGridGenerator } from "./features/environment/climate/BiomeGridGenerator.js";
import {
  RightEvolutionDrawer,
  type EvolutionTabType,
} from "./features/evolution/components/RightEvolutionDrawer.js";
import {
  SapientEvolutionLogHUD,
  type SapientLogEntry,
} from "./features/evolution/components/SapientEvolutionLogHUD.js";
import { SpeciationAlertToast } from "./features/evolution/components/SpeciationAlertToast.js";
import type {
  BiologicalTraits,
  EvolutionTier,
} from "./features/evolution/taxonomy/types.js";
import { GenesisModal } from "./features/genesis/components/GenesisModal.js";
import { WelcomeOnboardingModal } from "./features/genesis/components/WelcomeOnboardingModal.js";
import { ResetDataConfirmationModal } from "./features/persistence/components/ResetDataConfirmationModal.js";
import { SaveManagerModal } from "./features/persistence/components/SaveManagerModal.js";
import { useAutoSave } from "./features/persistence/hooks/useAutoSave.js";
import { AutoSaveService } from "./features/persistence/services/AutoSaveService.js";
import { Planet } from "./features/planet/components/Planet.js";
import { PlanetInspectHUD } from "./features/planet/components/PlanetInspectHUD.js";
import type { PlanetInspectData } from "./features/planet/components/PlanetSurface.js";
import { KeyboardShortcutsModal } from "./features/simulation/components/KeyboardShortcutsModal.js";
import { SimulationControlsCenterHUD } from "./features/simulation/components/SimulationControlsCenterHUD.js";
import { useSimulation } from "./features/simulation/hooks/useSimulation.js";
import { SceneCanvas } from "./rendering/canvas/SceneCanvas.js";
import { usePlanetStore } from "./stores/planet-store.js";

/**
 * Determines whether a species qualifies as a modern intelligent higher multicellular organism
 * ("sinh vật bậc cao thuộc nhánh hiện đại có trí thông minh - là một sinh vật đa bào
 * giống con người hoặc động vật hiện đại ngày nay").
 *
 * Normal organisms (microbes, plants, fungi, simple colonies, sponges, jellyfish, or normal animals)
 * MUST NEVER trigger the 10-second auto-pause.
 */
export function isModernIntelligentHigherOrganism(
  traits?: BiologicalTraits | null,
  tier?: EvolutionTier | string | null,
): boolean {
  if (!traits) {
    // Không có dữ liệu đặc tính sinh học để xác thực -> coi là bình thường, không tạm dừng
    return false;
  }

  // 1. Phải là động vật đa bào (fauna) - TUYỆT ĐỐI KHÔNG PHẢI vi sinh vật, thực vật, hay nấm
  if (traits.domain !== "fauna") {
    return false;
  }

  // 2. Không chấp nhận các sinh vật bình thường thuộc các cấp bậc thấp hoặc trung bình
  const actualTier = traits.tier ?? tier;
  if (
    actualTier === "prokaryote" ||
    actualTier === "unicellular" ||
    actualTier === "eukaryote" ||
    actualTier === "simple_multicellular" ||
    actualTier === "differentiated_tissue" ||
    actualTier === "primitive_animal" ||
    actualTier === "complex_bilaterian"
  ) {
    return false;
  }

  // 3. Cơ thể phải thuộc nhánh hiện đại đối xứng hai bên (bilateral)
  if (traits.bodySymmetry !== "bilateral") {
    return false;
  }

  // 4. Phải là sinh vật đa bào bậc cao có trí thông minh hiện đại:
  // - Cấp bậc trí tuệ ('sapient')
  // - Hoặc có hình thái trí tuệ rõ rệt (humanoid giống con người, hoặc động vật hiện đại có trí thông minh như Thủy tộc/Dực nhân/Cryo-Titan)
  const isSapientTier = actualTier === "sapient";
  const hasSapientArchetype = Boolean(traits.sapientArchetype);

  if (!isSapientTier && !hasSapientArchetype) {
    return false;
  }

  // 5. Nếu là động vật bậc cao thông thường (advanced) mà không có hình thái trí tuệ, không tạm dừng
  if (actualTier === "advanced" && !hasSapientArchetype) {
    return false;
  }

  return true;
}

export default function App() {
  const {
    snapshot,
    isReady,
    start,
    pause,
    reset,
    setSpeed,
    syncPlanet,
    seedPopulation,
    triggerStress,
    triggerDisaster,
    setAutoDisasters,
    sparkBiogenesis,
    catalyzeChemistry,
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
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string | null>(
    null,
  );
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);
  const [activeRightTab, setActiveRightTab] =
    useState<EvolutionTabType>("ecosystem");
  const [isCinematic, setIsCinematic] = useState(false);
  const [isHudVisible, setIsHudVisible] = useState(true);
  const [isSoundMuted, setIsSoundMuted] = useState(() => SoundFX.getMuted());
  const isRestoringSaveRef = useRef(false);

  // Sapient Intelligence Emergence - Persistent Bottom-Left Log
  const [sapientLogs, setSapientLogs] = useState<SapientLogEntry[]>([]);
  const handledSapientSpeciesIdsRef = useRef(new Set<string>());

  // Monitor for emergence of intelligent / sapient species
  useEffect(() => {
    const events = snapshot.speciationEvents ?? [];
    let newlyFoundSapientSpecies: SapientLogEntry | null = null;

    for (const ev of events) {
      const isModernIntelligent = isModernIntelligentHigherOrganism(
        ev.traits,
        ev.tier,
      );

      if (
        isModernIntelligent &&
        !handledSapientSpeciesIdsRef.current.has(ev.speciesId)
      ) {
        handledSapientSpeciesIdsRef.current.add(ev.speciesId);
        newlyFoundSapientSpecies = {
          id: `sapient_log_${ev.speciesId}_${Date.now()}`,
          speciesId: ev.speciesId,
          speciesName: ev.speciesName,
          scientificName: ev.scientificName ?? ev.traits?.scientificName,
          tier: ev.tier ?? "sapient",
          tierLabel: ev.tierLabel ?? "Sinh vật Trí tuệ Bậc cao",
          sapientArchetype: ev.traits?.sapientArchetype,
          sapientLabel: ev.traits?.sapientLabel,
          color: ev.color,
          rotation: snapshot.rotations,
          generation: snapshot.generation,
          description: ev.description,
          timestamp: Date.now(),
        };
        break;
      }
    }

    if (!newlyFoundSapientSpecies && snapshot.speciesSummaries) {
      for (const sp of snapshot.speciesSummaries) {
        const isModernIntelligent =
          !sp.isExtinct &&
          isModernIntelligentHigherOrganism(sp.biologicalTraits, sp.tier);

        if (
          isModernIntelligent &&
          !handledSapientSpeciesIdsRef.current.has(sp.id)
        ) {
          handledSapientSpeciesIdsRef.current.add(sp.id);
          newlyFoundSapientSpecies = {
            id: `sapient_log_${sp.id}_${Date.now()}`,
            speciesId: sp.id,
            speciesName: sp.name,
            scientificName:
              sp.scientificName ?? sp.biologicalTraits?.scientificName,
            tier: sp.tier ?? "sapient",
            tierLabel: sp.tierLabel ?? "Sinh vật Trí tuệ Bậc cao",
            sapientArchetype: sp.biologicalTraits?.sapientArchetype,
            sapientLabel: sp.biologicalTraits?.sapientLabel,
            color: sp.color,
            rotation: snapshot.rotations,
            generation: sp.generation,
            description: `Khai mở trí năng: Loài ${sp.name} đã tiến hóa thành Sinh vật đa bào bậc cao có trí thông minh hiện đại!`,
            timestamp: Date.now(),
          };
          break;
        }
      }
    }

    if (newlyFoundSapientSpecies) {
      const entry = newlyFoundSapientSpecies;
      setSapientLogs((prev) => [entry, ...prev]);
      SoundFX.playSpeciation();
    }
  }, [
    snapshot.speciationEvents,
    snapshot.speciesSummaries,
    snapshot.rotations,
    snapshot.generation,
  ]);

  const handleDismissSapientLog = (logId: string) => {
    setSapientLogs((prev) => prev.filter((l) => l.id !== logId));
  };

  const handleDismissAllSapientLogs = () => {
    setSapientLogs([]);
  };

  // Auto-Save Lifecycle: restores on load, saves on exit / beforeunload / visibilitychange
  const { restoredToast, dismissToast } = useAutoSave({
    isReady,
    currentPlanet,
    rotations: snapshot.rotations,
    exportState,
    loadState,
    loadPlanet,
    onRestoringSave: () => {
      isRestoringSaveRef.current = true;
    },
  });

  // Check first-time user welcome modal (only if no existing auto-save)
  useEffect(() => {
    if (typeof localStorage !== "undefined") {
      const welcomed = localStorage.getItem("evolution_sandbox_welcomed");
      const hasAutoSave = AutoSaveService.hasCachedAutoSave();
      if (!welcomed && !hasAutoSave) {
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

  const prevActiveDisasterIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const currentIds = new Set(snapshot.activeDisasters.map((d) => d.id));
    for (const disaster of snapshot.activeDisasters) {
      if (!prevActiveDisasterIdsRef.current.has(disaster.id)) {
        SoundFX.playDisaster(disaster.type, disaster.severity);
      }
    }
    prevActiveDisasterIdsRef.current = currentIds;
  }, [snapshot.activeDisasters]);

  const handleTriggerDisaster = (
    disasterType: DisasterType,
    severity = 0.8,
  ) => {
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

  const handleResetAllData = async () => {
    SoundFX.playDisaster("volcanic_eruption", 0.5);
    // 1. Wipe all persistent data (IndexedDB world saves, auto-save session, localStorage flags)
    await AutoSaveService.wipeAllData();

    // 2. Reset simulation worker & clocks
    reset();

    // 3. Reset planet state to default
    const defaultPlanet = loadDefaultPlanet();
    syncPlanet(defaultPlanet, true);

    // 4. Close any active panels or modals
    setIsResetModalOpen(false);
    setIsSaveModalOpen(false);
    setIsRightDrawerOpen(false);
    setSelectedSpeciesId(null);
    setInspectData(null);

    // 5. Open Welcome Onboarding Modal so player can create their new planet!
    setIsWelcomeModalOpen(true);
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

      {/* Auto-Restored Session Banner Toast */}
      {restoredToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 rounded-lg border border-cyan-500/40 bg-gray-950/90 px-4 py-2 font-mono text-xs text-cyan-300 shadow-xl shadow-cyan-950/40 backdrop-blur-md">
          <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
          <span>{restoredToast}</span>
          <button
            onClick={dismissToast}
            className="ml-2 text-gray-400 hover:text-white transition-colors"
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* Speciation Event Announcement Toast & Decisions (Center Top-Down) */}
      <SpeciationAlertToast
        events={snapshot.speciationEvents}
        onSelectSpecies={(id) => {
          setSelectedSpeciesId(id);
          setActiveRightTab("species");
          setIsRightDrawerOpen(true);
        }}
      />

      {/* Persistent Bottom-Left Log for Sapient Intelligence Emergence */}
      <SapientEvolutionLogHUD
        logs={sapientLogs}
        countdownSeconds={null}
        savedSpeed={snapshot.speed}
        onDismiss={handleDismissSapientLog}
        onDismissAll={handleDismissAllSapientLogs}
        onSelectSpecies={(id) => {
          setSelectedSpeciesId(id);
          setActiveRightTab("species");
          setIsRightDrawerOpen(true);
        }}
      />

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
          {/* Planetary Disaster Notifications, Status & Process (Left-Side) */}
          <DisasterControlHUD
            activeDisasters={snapshot.activeDisasters}
            perturbations={snapshot.perturbations}
            onTriggerDisaster={handleTriggerDisaster}
            autoDisastersEnabled={snapshot.autoDisastersEnabled ?? true}
            onToggleAutoDisasters={setAutoDisasters}
          />

          {/* Top Header & Navigation Bar (Top-Left) */}
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
                onClick={() => {
                  SoundFX.playClick();
                  setIsResetModalOpen(true);
                }}
                className="rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 px-2.5 py-1 text-xs font-semibold text-rose-300 transition-all shadow-md backdrop-blur-sm flex items-center gap-1"
                title="Xóa toàn bộ dữ liệu và bắt đầu thế giới mới"
              >
                <span>🗑️</span>
                <span>Chơi mới (Reset)</span>
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

          {/* Planetary Temperature, Climate & Inspection Readout HUD (Top-Right) */}
          <PlanetInspectHUD
            inspectData={inspectData}
            planetName={currentPlanet.name}
            surfaceTemperatureCelsius={currentPlanet.surfaceTemperatureCelsius}
            axialTiltDeg={currentPlanet.axialTiltDeg}
            rotations={snapshot.rotations}
            onOpenGenesis={handleOpenGenesis}
          />

          {/* Unified Right-Side Tabbed Drawer (1/3 Screen Slide-In for Ecosystem, Species & Biogeochemistry) */}
          <RightEvolutionDrawer
            isOpen={isRightDrawerOpen}
            activeTab={activeRightTab}
            onClose={() => setIsRightDrawerOpen(false)}
            onToggleTab={(tab) => {
              if (isRightDrawerOpen && activeRightTab === tab) {
                setIsRightDrawerOpen(false);
              } else {
                setActiveRightTab(tab);
                setIsRightDrawerOpen(true);
              }
            }}
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
            onCatalyzeChemistry={(type) => {
              SoundFX.playClick();
              catalyzeChemistry(type);
            }}
            selectedSpeciesId={selectedSpeciesId}
            onSelectSpecies={(id) => setSelectedSpeciesId(id)}
            biogeochemical={snapshot.biogeochemical}
            rotations={snapshot.rotations}
            partialRotation={snapshot.partialRotation}
          />

          {/* Unified Simulation Controls: Speed & Rotations (Bottom-Center) */}
          <SimulationControlsCenterHUD
            rotations={snapshot.rotations}
            partialRotation={snapshot.partialRotation}
            speed={snapshot.speed}
            status={snapshot.status}
            onStart={start}
            onPause={pause}
            onSetSpeed={setSpeed}
          />
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
        onOpenResetModal={() => setIsResetModalOpen(true)}
      />

      {/* Wipe All Data & New Game Confirmation Modal */}
      <ResetDataConfirmationModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirmReset={handleResetAllData}
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
