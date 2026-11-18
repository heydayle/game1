import { describe, expect, it, vi } from "vitest";
import { GenesisEngine } from "../../../genesis/services/GenesisEngine.js";
import { CURRENT_SAVE_SCHEMA_VERSION, type WorldSave } from "../../types.js";
import { SaveManagerModal } from "../SaveManagerModal.js";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

describe("SaveManagerModal", () => {
  const dummyPlanet = GenesisEngine.generatePlanet({}, 42);

  const mockSave: WorldSave = {
    schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
    metadata: {
      saveId: "save_test",
      name: "Test World",
      savedAt: Date.now(),
      schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
      planetName: dummyPlanet.name,
      rotations: 20,
      totalPopulation: 100,
      activeSpeciesCount: 1,
      lifeStage: "inhabited",
      dominantAtmosphere: "nitrogen",
    },
    planetConfig: dummyPlanet,
    clock: { rotations: 20, speed: 1, status: "idle", accumulatedMs: 0 },
    evolution: {
      currentGeneration: 2,
      nextOrganismId: 10,
      nextSpeciesId: 2,
      species: [],
      organisms: [],
      prebiotic: { stage: "inhabited", organicComplexity: 100 },
    },
    disasters: {
      activeDisasters: [],
      nextDisasterId: 1,
      lastPulseRotation: -1,
    },
  };

  it("renders nothing when closed", () => {
    const { container } = render(
      <SaveManagerModal
        isOpen={false}
        onClose={vi.fn()}
        currentPlanet={dummyPlanet}
        currentRotations={10}
        onExportCurrentState={vi.fn()}
        onLoadState={vi.fn()}
        onPlanetLoaded={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders header, input, and action buttons when open", async () => {
    render(
      <SaveManagerModal
        isOpen={true}
        onClose={vi.fn()}
        currentPlanet={dummyPlanet}
        currentRotations={10}
        onExportCurrentState={vi.fn()}
        onLoadState={vi.fn()}
        onPlanetLoaded={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/WORLD ARCHIVES & PERSISTENCE PROTOCOL/i),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: /Archive World/i }),
    ).toBeInTheDocument();
  });

  it("calls onExportCurrentState when save button is clicked", async () => {
    const onExport = vi.fn().mockResolvedValue(mockSave);
    render(
      <SaveManagerModal
        isOpen={true}
        onClose={vi.fn()}
        currentPlanet={dummyPlanet}
        currentRotations={10}
        onExportCurrentState={onExport}
        onLoadState={vi.fn()}
        onPlanetLoaded={vi.fn()}
      />,
    );

    const saveBtn = screen.getByRole("button", { name: /Archive World/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(onExport).toHaveBeenCalled();
    });
  });

  it("formats large totalPopulation in save items with formatPopulation (k, m, ∞)", async () => {
    const hugeSaveMeta = {
      saveId: "save_huge",
      name: "Huge Population World",
      savedAt: Date.now(),
      schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
      planetName: dummyPlanet.name,
      rotations: 50,
      totalPopulation: 2_500_000,
      activeSpeciesCount: 4,
      lifeStage: "inhabited" as const,
      dominantAtmosphere: "nitrogen" as const,
    };

    // Save metadata directly to IndexedDB mock
    const { IndexedDBService } = await import("../../services/IndexedDBService.js");
    await IndexedDBService.saveWorld({
      ...mockSave,
      metadata: hugeSaveMeta,
    });

    render(
      <SaveManagerModal
        isOpen={true}
        onClose={vi.fn()}
        currentPlanet={dummyPlanet}
        currentRotations={50}
        onExportCurrentState={vi.fn()}
        onLoadState={vi.fn()}
        onPlanetLoaded={vi.fn()}
      />
    );

    await waitFor(() => {
      // 2,500,000 should be formatted as '2.5m'
      expect(screen.getByText(/Pop: 2.5m/i)).toBeInTheDocument();
    });
  });
});
