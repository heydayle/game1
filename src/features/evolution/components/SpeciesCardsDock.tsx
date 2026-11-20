import { useMemo, useState } from "react";
import { useVirtualScroll } from "../../../shared/hooks/useVirtualScroll.js";
import { formatPopulation } from "../../../shared/utils/formatters.js";
import { SoundFX } from "../../audio/SoundFXEngine.js";
import type { SpeciesSummary } from "../genetics/types.js";
import type { OrganismDomain, TrophicRole } from "../taxonomy/types.js";

interface SpeciesCardsDockProps {
  speciesSummaries: readonly SpeciesSummary[];
  selectedSpeciesId?: string | null;
  onSelectSpecies?: (speciesId: string) => void;
  embedded?: boolean;
}

interface DomainFilterOption {
  readonly domain: OrganismDomain | "all";
  readonly label: string;
  readonly icon: string;
}

const DOMAIN_FILTERS: readonly DomainFilterOption[] = [
  { domain: "all", label: "Tất cả", icon: "🌐" },
  { domain: "flora", label: "Thực vật", icon: "🌿" },
  { domain: "fauna", label: "Động vật", icon: "🐾" },
  { domain: "fungi", label: "Nấm & Phân giải", icon: "🍄" },
  { domain: "microbe", label: "Vi sinh", icon: "🦠" },
];

interface SpeciesCardProps {
  species: SpeciesSummary;
  layout: "embedded" | "standalone";
  isSelected: boolean;
  onSelect?: (speciesId: string) => void;
}

/**
 * Dedicated SpeciesCard component customized for both embedded drawer (full-width vertical)
 * and standalone bottom dock (fixed-width horizontal carousel) layouts.
 */
function SpeciesCard({
  species,
  layout,
  isSelected,
  onSelect,
}: SpeciesCardProps) {
  const traits = species.biologicalTraits;
  const isSapient = species.tier === "sapient";
  const domainIcon = species.domainIcon ?? traits?.domainIcon ?? "🌿";
  const domainLabel = species.domainLabel ?? traits?.domainLabel ?? "Thực vật";
  const trophicRoleLabel =
    species.trophicRoleLabel ?? traits?.trophicRoleLabel ?? "Sinh vật sản xuất";
  const tierLabel = species.tierLabel ?? traits?.tierLabel ?? "Tế bào nhân sơ";
  const lineageLabel = traits?.planetaryLineageLabel;
  const scientificName =
    species.scientificName ?? traits?.scientificName ?? "Prokaryota";
  const foodChainSummary =
    species.foodChainSummary ??
    traits?.dietDescription ??
    "Quang hợp và hóa năng";
  const hungerState = species.hungerState ?? "satiated";

  const symmetryLabel =
    traits?.bodySymmetry === "bilateral"
      ? "Đối xứng 2 bên"
      : traits?.bodySymmetry === "radial"
        ? "Tỏa tròn"
        : traits?.bodySymmetry === "asymmetrical"
          ? "Bất đối xứng"
          : "Đơn bào";

  // Dynamic layout styling
  const isEmbedded = layout === "embedded";
  const cardWidthClass = isEmbedded ? "w-full" : "w-80 flex-shrink-0";

  return (
    <div
      onClick={() => {
        SoundFX.playClick();
        onSelect?.(species.id);
      }}
      className={`group relative ${cardWidthClass} h-[185px] cursor-pointer rounded-xl border p-3 transition-all duration-200 select-none flex flex-col justify-between ${
        isSapient
          ? "border-amber-500/70 bg-gradient-to-br from-amber-950/40 via-gray-950/90 to-black hover:border-amber-400 shadow-lg shadow-amber-950/30"
          : "border-white/10 bg-gray-900/80 hover:border-emerald-500/60 hover:bg-gray-900/95 shadow-md"
      } ${isSelected ? "ring-2 ring-emerald-400 shadow-emerald-950/50" : ""}`}
      style={{
        borderTopColor: species.color,
        borderTopWidth: "3px",
      }}
    >
      {/* Top Row: Name, Generation & Status */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 truncate">
          <span
            className="h-2.5 w-2.5 flex-shrink-0 rounded-full shadow-sm"
            style={{ backgroundColor: species.color }}
          />
          <h3 className="truncate text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
            {species.name}
          </h3>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[9px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800/40 px-1 py-0.2 rounded">
            Gen {species.generation}
          </span>
          <span className="flex-shrink-0 rounded px-1.5 py-0.2 text-[9px] font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-800/40">
            Đang sống
          </span>
        </div>
      </div>

      {/* Badges Row: Domain, Trophic Role, Tier, Lineage */}
      <div className="mt-1 flex flex-wrap items-center gap-1 text-[9px]">
        <span className="rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 font-semibold flex items-center gap-1">
          <span>{domainIcon}</span>
          <span>{domainLabel}</span>
        </span>
        <span className="rounded bg-gray-800/80 text-gray-300 border border-white/10 px-1.5 py-0.5 font-medium truncate max-w-[130px]">
          {trophicRoleLabel}
        </span>
        <span className="rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/40 px-1.5 py-0.5 font-mono">
          {tierLabel}
        </span>
        {lineageLabel && (
          <span className="rounded bg-indigo-950/80 text-indigo-300 border border-indigo-700/40 px-1.5 py-0.5 font-mono">
            ✨ {lineageLabel}
          </span>
        )}
      </div>

      {/* Scientific Name & Symmetry Plan */}
      <div className="mt-1 flex items-center justify-between text-[10px]">
        <span className="italic text-gray-400 truncate max-w-[200px]">
          {scientificName}
        </span>
        <span className="text-[9px] text-gray-400 bg-white/5 border border-white/10 px-1.5 py-0.2 rounded font-mono">
          {symmetryLabel}
        </span>
      </div>

      {/* Food Chain & Hunger State */}
      <div className="mt-1 rounded bg-black/40 border border-white/5 p-1.5 text-[9px] space-y-0.5">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">🍽 Chuỗi thức ăn:</span>
          <span
            className={`rounded px-1 py-0.2 text-[8px] font-bold uppercase ${
              hungerState === "starving"
                ? "bg-rose-950 text-rose-300 border border-rose-500/40"
                : hungerState === "hungry"
                  ? "bg-amber-950 text-amber-300 border border-amber-500/40"
                  : "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
            }`}
          >
            {hungerState === "starving"
              ? "🔴 Kiệt quệ / Đói"
              : hungerState === "hungry"
                ? "🟡 Đang thiếu ăn"
                : "🟢 No đủ"}
          </span>
        </div>
        <p className="text-gray-200 line-clamp-1">{foodChainSummary}</p>
      </div>

      {/* Population & Fitness Stats */}
      <div className="mt-1.5 grid grid-cols-3 gap-1 text-center text-[10px]">
        <div className="rounded bg-black/40 p-1 border border-white/5">
          <span className="text-[8px] uppercase text-gray-400 block">
            Dân số
          </span>
          <span className="font-bold text-white font-mono">
            {formatPopulation(species.population)}
          </span>
        </div>
        <div className="rounded bg-black/40 p-1 border border-white/5">
          <span className="text-[8px] uppercase text-gray-400 block">
            Thế hệ
          </span>
          <span className="font-semibold text-cyan-300">
            Gen {species.generation}
          </span>
        </div>
        <div className="rounded bg-black/40 p-1 border border-white/5">
          <span className="text-[8px] uppercase text-gray-400 block">
            Thích nghi
          </span>
          <span className="font-semibold text-amber-300">
            {(species.averageFitness * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
}

export function SpeciesCardsDock({
  speciesSummaries,
  selectedSpeciesId,
  onSelectSpecies,
  embedded = false,
}: SpeciesCardsDockProps) {
  const [isOpen, setIsOpen] = useState(embedded);
  const [activeDomain, setActiveDomain] = useState<OrganismDomain | "all">(
    "all",
  );
  const [activeRole, setActiveRole] = useState<TrophicRole | "all">("all");
  const [activeView, setActiveView] = useState<"cards" | "food_web" | "taxonomy">("cards");

  // Calculate counts per domain
  const domainCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: speciesSummaries.length,
      flora: 0,
      fauna: 0,
      fungi: 0,
      microbe: 0,
    };
    for (const s of speciesSummaries) {
      const d = s.domain ?? s.biologicalTraits?.domain ?? "microbe";
      counts[d] = (counts[d] ?? 0) + 1;
    }
    return counts;
  }, [speciesSummaries]);

  // Filter species according to selected domain and trophic role
  const filteredSpecies = useMemo(() => {
    return speciesSummaries.filter((s) => {
      const d = s.domain ?? s.biologicalTraits?.domain ?? "microbe";
      const r = s.trophicRole ?? s.biologicalTraits?.trophicRole ?? "producer";
      const matchDomain = activeDomain === "all" || d === activeDomain;
      const matchRole = activeRole === "all" || r === activeRole;
      return matchDomain && matchRole;
    });
  }, [speciesSummaries, activeDomain, activeRole]);

  // Living species sorted descending by population (từ nhiều đến ít)
  const livingSpecies = useMemo(() => {
    return filteredSpecies
      .filter((s) => !s.isExtinct)
      .sort((a, b) => b.population - a.population);
  }, [filteredSpecies]);

  // Extinct species to be rendered in collapsed 1-line history rows
  const extinctSpecies = useMemo(() => {
    return filteredSpecies.filter((s) => s.isExtinct);
  }, [filteredSpecies]);

  const totalLiving = useMemo(() => {
    return speciesSummaries.filter((s) => !s.isExtinct).length;
  }, [speciesSummaries]);

  // Trophic food chain pyramid groupings (6-level complete biological food chain)
  const trophicPyramid = useMemo(() => {
    const active = speciesSummaries.filter((s) => !s.isExtinct);
    return {
      // Legacy backwards-compatible fields
      carnivores: active.filter((s) => s.trophicRole === "carnivore"),
      herbivores: active.filter(
        (s) => s.trophicRole === "herbivore" || s.trophicRole === "omnivore",
      ),
      producers: active.filter((s) => s.trophicRole === "producer"),
      decomposers: active.filter((s) => s.trophicRole === "decomposer"),

      // 6-level biological food chain hierarchy:
      level5Apex: active.filter(
        (s) =>
          s.trophicRole !== "decomposer" &&
          s.domain !== "fungi" &&
          ((s.trophicLevel ?? 1) >= 5 || s.tier === "sapient"),
      ),
      level4Tertiary: active.filter(
        (s) =>
          s.trophicRole !== "decomposer" &&
          s.domain !== "fungi" &&
          (s.trophicLevel ?? 1) === 4 &&
          s.tier !== "sapient",
      ),
      level3Secondary: active.filter(
        (s) =>
          s.trophicRole !== "decomposer" &&
          s.domain !== "fungi" &&
          (s.trophicLevel ?? 1) === 3 &&
          s.tier !== "sapient",
      ),
      level2PrimaryConsumers: active.filter(
        (s) =>
          s.trophicRole !== "decomposer" &&
          s.domain !== "fungi" &&
          (s.trophicLevel ?? 1) === 2,
      ),
      level1Producers: active.filter(
        (s) =>
          s.trophicRole !== "decomposer" &&
          s.domain !== "fungi" &&
          (s.trophicLevel ?? 1) === 1,
      ),
      decomposersList: active.filter(
        (s) => s.trophicRole === "decomposer" || s.domain === "fungi",
      ),
    };
  }, [speciesSummaries]);

  // Virtual Scroll Integration:
  // - Embedded Layout: Vertical list with 195px item height (185px card + 10px spacing)
  // - Standalone Layout: Horizontal carousel with 332px item width (320px card + 12px spacing)
  const itemSize = embedded ? 195 : 332;
  const direction = embedded ? "vertical" : "horizontal";

  const { containerRef, virtualItems, totalSize } = useVirtualScroll({
    count: livingSpecies.length,
    itemSize,
    direction,
    overscan: 2,
    viewportSizeFallback: 800,
  });

  // Floating dock toggle button when collapsed (in non-embedded standalone mode)
  if (!isOpen && !embedded) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 font-mono">
        <button
          onClick={() => {
            SoundFX.playClick();
            setIsOpen(true);
          }}
          className="flex items-center gap-2 rounded-full border border-emerald-500/40 bg-gray-950/90 px-4 py-2 text-xs font-semibold text-emerald-300 shadow-xl backdrop-blur-md hover:bg-emerald-950/80 hover:border-emerald-400 hover:text-white transition-all group"
        >
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>
            🌿 Chuỗi Thức Ăn & Phân Loại Sinh Vật ({speciesSummaries.length})
          </span>
          <span className="text-[10px] text-gray-400 group-hover:text-emerald-300">
            ▲ Mở thẻ
          </span>
        </button>
      </div>
    );
  }

  const wrapperClass = embedded
    ? "w-full font-mono"
    : "fixed bottom-0 left-0 right-0 z-30 font-mono";

  const containerClass = embedded
    ? "w-full rounded-xl border border-white/10 bg-gray-950/80 p-3.5 shadow-xl backdrop-blur-md"
    : "mx-auto max-w-6xl rounded-t-2xl border-t border-x border-white/15 bg-gray-950/95 p-3.5 shadow-2xl backdrop-blur-2xl";

  return (
    <div className={wrapperClass}>
      <div className={containerClass}>
        {/* Header & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                Quần Xã Sinh Giới ({totalLiving} sống /{" "}
                {speciesSummaries.length} loài)
              </h2>
            </div>

            {/* View Mode Switcher */}
            <div className="flex rounded-lg border border-white/10 bg-black/40 p-0.5 text-[11px]">
              <button
                onClick={() => {
                  SoundFX.playClick();
                  setActiveView("cards");
                }}
                className={`rounded px-2.5 py-0.5 transition-all ${
                  activeView === "cards"
                    ? "bg-emerald-600 text-white font-semibold shadow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                🃏 Thẻ Loài
              </button>
              <button
                onClick={() => {
                  SoundFX.playClick();
                  setActiveView("food_web");
                }}
                className={`rounded px-2.5 py-0.5 transition-all ${
                  activeView === "food_web"
                    ? "bg-emerald-600 text-white font-semibold shadow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                🔗 Chuỗi & Mạng Lưới Thức Ăn
              </button>
              <button
                onClick={() => {
                  SoundFX.playClick();
                  setActiveView("taxonomy");
                }}
                className={`rounded px-2.5 py-0.5 transition-all ${
                  activeView === "taxonomy"
                    ? "bg-emerald-600 text-white font-semibold shadow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                🏛️ Phân Loại Học & Quần Thể
              </button>
            </div>

            {/* Domain Filter Tabs */}
            {activeView === "cards" && (
              <div className="flex flex-wrap items-center gap-1">
                {DOMAIN_FILTERS.map((f) => {
                  const count = domainCounts[f.domain] ?? 0;
                  const isActive = activeDomain === f.domain;
                  return (
                    <button
                      key={f.domain}
                      onClick={() => {
                        SoundFX.playClick();
                        setActiveDomain(f.domain);
                        setActiveRole("all");
                      }}
                      className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium transition-all ${
                        isActive
                          ? "bg-emerald-700/80 text-white shadow-md shadow-emerald-950 border border-emerald-400"
                          : "bg-gray-900/60 text-gray-400 hover:text-gray-200 hover:bg-gray-800 border border-white/5"
                      }`}
                    >
                      <span>{f.icon}</span>
                      <span>{f.label}</span>
                      <span
                        className={`ml-0.5 text-[10px] rounded-full px-1.5 py-0.2 ${
                          isActive
                            ? "bg-black/40 text-emerald-200"
                            : "bg-white/5 text-gray-400"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {!embedded && (
            <button
              onClick={() => {
                SoundFX.playClick();
                setIsOpen(false);
              }}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
              title="Thu gọn danh mục thẻ"
            >
              <span>▼ Thu gọn</span>
            </button>
          )}
        </div>

        {/* View Mode 1: Virtualized Cards Roster */}
        {activeView === "cards" && (
          <div className="mt-3">
            {livingSpecies.length === 0 && extinctSpecies.length === 0 ? (
              <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-white/10 text-xs text-gray-400">
                Chưa có loài nào thuộc nhóm sinh giới này trong sinh quyển.
              </div>
            ) : (
              <div className="space-y-3">
                {/* Active Living Species with Virtual Scrolling */}
                {livingSpecies.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-gray-400 font-semibold px-1">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Loài đang sống ({livingSpecies.length})</span>
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {embedded
                          ? "Cuộn ảo dọc • 60 FPS"
                          : "Cuộn ảo ngang • 60 FPS"}
                      </span>
                    </div>

                    {/* Virtual Scroll Container */}
                    <div
                      ref={containerRef}
                      data-testid="virtual-species-list"
                      className={
                        embedded
                          ? "relative w-full max-h-[50vh] sm:max-h-[54vh] overflow-y-auto custom-scrollbar pr-1 pb-1"
                          : "relative w-full overflow-x-auto overflow-y-hidden pb-1 custom-scrollbar"
                      }
                      style={embedded ? undefined : { height: "205px" }}
                    >
                      <div
                        style={
                          embedded
                            ? {
                                height: `${totalSize}px`,
                                position: "relative",
                                width: "100%",
                              }
                            : {
                                width: `${totalSize}px`,
                                position: "relative",
                                height: "100%",
                              }
                        }
                      >
                        {virtualItems.map((virtualNode) => {
                          const sp = livingSpecies[virtualNode.index];
                          if (!sp) return null;
                          return (
                            <div
                              key={sp.id}
                              style={
                                embedded
                                  ? {
                                      position: "absolute",
                                      top: 0,
                                      left: 0,
                                      width: "100%",
                                      height: "185px",
                                      transform: `translateY(${virtualNode.start}px)`,
                                    }
                                  : {
                                      position: "absolute",
                                      top: 0,
                                      left: 0,
                                      width: "320px",
                                      height: "195px",
                                      transform: `translateX(${virtualNode.start}px)`,
                                    }
                              }
                            >
                              <SpeciesCard
                                species={sp}
                                layout={embedded ? "embedded" : "standalone"}
                                isSelected={selectedSpeciesId === sp.id}
                                onSelect={onSelectSpecies}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Collapsed 1-Line Row Extinct Species History */}
                {extinctSpecies.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-white/10 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-gray-400 font-semibold px-1">
                      <span className="flex items-center gap-1.5">
                        <span>💀</span>
                        <span>
                          Loài đã tuyệt chủng ({extinctSpecies.length})
                        </span>
                      </span>
                      <span className="text-[10px] text-gray-500">
                        Lịch sử sinh quyển
                      </span>
                    </div>
                    <div className="max-h-36 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                      {extinctSpecies.map((sp) => {
                        const lifespan =
                          sp.lifespanRotations ??
                          (sp.extinctionRotation && sp.emergenceRotation
                            ? Math.max(
                                1,
                                sp.extinctionRotation - sp.emergenceRotation,
                              )
                            : sp.generation * 2);
                        const traits = sp.biologicalTraits;
                        return (
                          <div
                            key={sp.id}
                            onClick={() => {
                              SoundFX.playClick();
                              onSelectSpecies?.(sp.id);
                            }}
                            className="flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-gray-950/60 px-3 py-1.5 text-xs text-gray-400 hover:border-white/20 hover:bg-gray-900/60 transition-colors cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span>💀</span>
                              <span className="font-semibold text-gray-300 truncate">
                                {sp.name}
                              </span>
                              <span className="text-[10px] italic text-gray-500 truncate">
                                (
                                {sp.scientificName ??
                                  traits?.scientificName ??
                                  "Prokaryota"}
                                )
                              </span>
                              <span className="text-[9px] rounded px-1.5 py-0.2 bg-red-950/80 border border-red-500/30 text-red-300">
                                Tuyệt chủng
                              </span>
                              <span className="text-[9px] rounded px-1.5 py-0.2 bg-gray-900 border border-white/10 text-gray-400">
                                {sp.tierLabel ??
                                  traits?.tierLabel ??
                                  "Tế bào nhân sơ"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] whitespace-nowrap text-gray-400 font-mono">
                              <span className="text-amber-400/90 font-medium">
                                Đã tồn tại: {lifespan} vòng quay
                              </span>
                              <span>|</span>
                              <span>Gen {sp.generation}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* View Mode 2: Trophic Food Web & Pyramid */}
        {activeView === "food_web" && (
          <div className="mt-3 max-h-80 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
            {/* Educational Food Chain Energy Flow Diagrams */}
            <div className="rounded-xl border border-sky-500/30 bg-sky-950/25 p-2.5 text-[11px]">
              <div className="flex items-center justify-between border-b border-sky-500/20 pb-1.5 text-xs font-bold text-sky-300">
                <span className="flex items-center gap-1.5">
                  <span>🌐 Sơ Đồ Chuỗi Thức Ăn & Dòng Năng Lượng Điển Hình</span>
                </span>
                <span className="text-[10px] font-mono text-cyan-400">
                  Bậc 1 ➔ Bậc 5 ➔ Phân Giải
                </span>
              </div>
              <div className="mt-2 space-y-1.5 font-mono text-[10px]">
                <div className="rounded-lg border border-cyan-500/25 bg-black/50 p-2 text-cyan-200">
                  <div className="font-bold text-cyan-300 mb-0.5">
                    🌊 Chuỗi Dưới Nước (Aquatic Chain):
                  </div>
                  <div className="flex flex-wrap items-center gap-1 text-[9.5px]">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 font-semibold">Tảo đơn bào (Bậc 1)</span>
                    <span className="text-gray-500">➔</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/30 font-semibold">Bọ nước Daphnia (Bậc 2)</span>
                    <span className="text-gray-500">➔</span>
                    <span className="px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-500/30 font-semibold">Cá nhỏ (Bậc 3)</span>
                    <span className="text-gray-500">➔</span>
                    <span className="px-1.5 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-500/30 font-semibold">Hải cẩu (Bậc 4)</span>
                    <span className="text-gray-500">➔</span>
                    <span className="px-1.5 py-0.5 rounded bg-yellow-950/80 text-yellow-300 border border-yellow-500/30 font-semibold">Cá voi sát thủ (Bậc 5)</span>
                    <span className="text-gray-500">➔</span>
                    <span className="px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-500/30 font-semibold">Vi khuẩn phân hủy 🔄</span>
                  </div>
                </div>
                <div className="rounded-lg border border-emerald-500/25 bg-black/50 p-2 text-emerald-200">
                  <div className="font-bold text-emerald-300 mb-0.5">
                    🌿 Chuỗi Ven Bờ & Trên Cạn (Terrestrial / Shore Chain):
                  </div>
                  <div className="flex flex-wrap items-center gap-1 text-[9.5px]">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 font-semibold">Vi khuẩn lam / Tảo (Bậc 1)</span>
                    <span className="text-gray-500">➔</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/30 font-semibold">Ấu trùng / Côn trùng (Bậc 2)</span>
                    <span className="text-gray-500">➔</span>
                    <span className="px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-500/30 font-semibold">Ếch / Cá lớn (Bậc 3)</span>
                    <span className="text-gray-500">➔</span>
                    <span className="px-1.5 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-500/30 font-semibold">Cò / Chồn săn mồi (Bậc 4)</span>
                    <span className="text-gray-500">➔</span>
                    <span className="px-1.5 py-0.5 rounded bg-yellow-950/80 text-yellow-300 border border-yellow-500/30 font-semibold">Gấu / Thú ăn tạp đỉnh chuỗi (Bậc 5)</span>
                    <span className="text-gray-500">➔</span>
                    <span className="px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-500/30 font-semibold">Nấm & Vi khuẩn phân giải 🔄</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Level 5: Apex Mammals & Sapient Organisms */}
            <div className="rounded-xl border border-yellow-500/40 bg-yellow-950/20 p-2.5">
              <div className="flex items-center justify-between border-b border-yellow-500/20 pb-1.5">
                <div>
                  <span className="text-xs font-bold text-yellow-300 flex items-center gap-1.5">
                    <span>👑 Bậc 5: Động Vật Có Vú & Đỉnh Chuỗi (Apex Mammals & Sapient)</span>
                  </span>
                  <div className="text-[9.5px] text-yellow-400/80 mt-0.5">
                    Hải cẩu, cá voi sát thủ, gấu, hổ báo & sinh vật trí tuệ — Quản lý đỉnh chuỗi thức ăn
                  </div>
                </div>
                <span className="text-[10px] text-gray-400 font-mono">
                  {trophicPyramid.level5Apex.length} loài
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {trophicPyramid.level5Apex.length === 0 ? (
                  <span className="text-[10px] text-gray-400 italic">
                    Chưa xuất hiện động vật có vú đỉnh chuỗi hay sinh vật trí tuệ.
                  </span>
                ) : (
                  trophicPyramid.level5Apex.map((sp) => (
                    <div
                      key={sp.id}
                      className="rounded-lg border border-yellow-500/40 bg-gray-950/80 px-2.5 py-1.5 text-[10px] flex items-center gap-2"
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: sp.color }}
                      />
                      <strong className="text-white">{sp.name}</strong>
                      <span className="text-yellow-300 font-mono">
                        ({formatPopulation(sp.population)})
                      </span>
                      <span className="text-gray-400 text-[9px] italic">
                        Đỉnh chuỗi (Apex) ➔
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Level 4: Tertiary Consumers (Cá lớn, Chim săn cá, Bò sát) */}
            <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-2.5">
              <div className="flex items-center justify-between border-b border-red-500/20 pb-1.5">
                <div>
                  <span className="text-xs font-bold text-red-300 flex items-center gap-1.5">
                    <span>🦅 Bậc 4: Động Vật Ăn Thịt Bậc Cao (Tertiary Consumers / Apex Predators)</span>
                  </span>
                  <div className="text-[9.5px] text-red-400/80 mt-0.5">
                    Cá lớn (cá thu, cá ngừ), chim ăn cá, bò sát săn mồi — Kiểm soát số lượng động vật cấp 3
                  </div>
                </div>
                <span className="text-[10px] text-gray-400 font-mono">
                  {trophicPyramid.level4Tertiary.length} loài
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {trophicPyramid.level4Tertiary.length === 0 ? (
                  <span className="text-[10px] text-gray-400 italic">
                    Chưa có động vật săn mồi bậc 4.
                  </span>
                ) : (
                  trophicPyramid.level4Tertiary.map((sp) => (
                    <div
                      key={sp.id}
                      className="rounded-lg border border-red-500/40 bg-gray-950/80 px-2.5 py-1.5 text-[10px] flex items-center gap-2"
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: sp.color }}
                      />
                      <strong className="text-white">{sp.name}</strong>
                      <span className="text-red-300 font-mono">
                        ({formatPopulation(sp.population)})
                      </span>
                      <span className="text-gray-400 text-[9px] italic">
                        Săn cá nhỏ & bậc 2-3 ➔
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Level 3: Secondary Consumers (Cá nhỏ, Nòng nọc, Côn trùng ăn thịt) */}
            <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-2.5">
              <div className="flex items-center justify-between border-b border-rose-500/20 pb-1.5">
                <div>
                  <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                    <span>
                      🥩 Bậc 3: Động Vật Ăn Thịt & Săn Mồi (Secondary Consumers - Cá Nhỏ & Côn Trùng Săn Mồi)
                    </span>
                  </span>
                  <div className="text-[9.5px] text-rose-400/80 mt-0.5">
                    Cá nhỏ (cá cơm, cá con), nòng nọc/ếch nhái, côn trùng ăn thịt — Săn các sinh vật tiêu thụ bậc 1
                  </div>
                </div>
                <span className="text-[10px] text-gray-400 font-mono">
                  {trophicPyramid.level3Secondary.length} loài
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {trophicPyramid.level3Secondary.length === 0 ? (
                  <span className="text-[10px] text-gray-400 italic">
                    Chưa có thú săn mồi bậc 3 nào.
                  </span>
                ) : (
                  trophicPyramid.level3Secondary.map((sp) => (
                    <div
                      key={sp.id}
                      className="rounded-lg border border-rose-500/40 bg-gray-950/80 px-2.5 py-1.5 text-[10px] flex items-center gap-2"
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: sp.color }}
                      />
                      <strong className="text-white">{sp.name}</strong>
                      <span className="text-rose-300 font-mono">
                        ({formatPopulation(sp.population)})
                      </span>
                      <span className="text-gray-400 text-[9px] italic">
                        Săn động vật bậc 2 ➔
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Level 2: Primary Consumers (Herbivores & Omnivores) */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-2.5">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-1.5">
                <div>
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <span>
                      🥬 Bậc 2: Động Vật Ăn Thực Vật & Ăn Tạp (Primary Consumers & Herbivores)
                    </span>
                  </span>
                  <div className="text-[9.5px] text-amber-400/80 mt-0.5">
                    Trùng giày, bọ nước Daphnia, giáp xác, ấu trùng & động vật ăn cỏ — Chuyển hóa quang sinh khối sang động vật
                  </div>
                </div>
                <span className="text-[10px] text-gray-400 font-mono">
                  {trophicPyramid.level2PrimaryConsumers.length} loài
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {trophicPyramid.level2PrimaryConsumers.length === 0 ? (
                  <span className="text-[10px] text-gray-400 italic">
                    Chưa có động vật ăn cỏ hay giáp xác nào.
                  </span>
                ) : (
                  trophicPyramid.level2PrimaryConsumers.map((sp) => (
                    <div
                      key={sp.id}
                      className="rounded-lg border border-amber-500/40 bg-gray-950/80 px-2.5 py-1.5 text-[10px] flex items-center gap-2"
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: sp.color }}
                      />
                      <strong className="text-white">{sp.name}</strong>
                      <span className="text-amber-300 font-mono">
                        ({formatPopulation(sp.population)})
                      </span>
                      <span className="text-gray-400 text-[9px] italic">
                        Tiêu thụ thực vật ➔
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Level 1: Primary Producers (Flora / Algae / Cyanobacteria) */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-2.5">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-1.5">
                <div>
                  <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <span>
                      🌿 Bậc 1: Sinh Vật Sản Xuất Nền Tảng (Primary Producers - Thực Vật & Tảo)
                    </span>
                  </span>
                  <div className="text-[9.5px] text-emerald-400/80 mt-0.5">
                    Tảo đơn bào (lục, silic, giáp), vi khuẩn lam quang hợp & thực vật — Hấp thụ ánh sáng sao, nước và CO2
                  </div>
                </div>
                <span className="text-[10px] text-gray-400 font-mono">
                  {trophicPyramid.level1Producers.length} loài
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {trophicPyramid.level1Producers.length === 0 ? (
                  <span className="text-[10px] text-gray-400 italic">
                    Chưa có sinh vật sản xuất nào.
                  </span>
                ) : (
                  trophicPyramid.level1Producers.map((sp) => (
                    <div
                      key={sp.id}
                      className="rounded-lg border border-emerald-500/40 bg-gray-950/80 px-2.5 py-1.5 text-[10px] flex items-center gap-2"
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: sp.color }}
                      />
                      <strong className="text-white">{sp.name}</strong>
                      <span className="text-emerald-300 font-mono">
                        ({formatPopulation(sp.population)})
                      </span>
                      <span className="text-gray-400 text-[9px] italic">
                        Quang hợp mở đầu chuỗi
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Decomposers (Fungi, Saprotrophic Microbes & Benthic Organisms) */}
            <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-2.5">
              <div className="flex items-center justify-between border-b border-purple-500/20 pb-1.5">
                <div>
                  <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    <span>
                      🍄 Sinh Vật Phân Giải & Tuần Hoàn Vật Chất (Decomposers - Nấm & Vi Khuẩn Hoại Sinh)
                    </span>
                  </span>
                  <div className="text-[9.5px] text-purple-400/80 mt-0.5">
                    Vi khuẩn hoại sinh, nấm & giun/động vật đáy — Phân hủy xác chết và chất thải của mọi mắt xích thành chất vô cơ
                  </div>
                </div>
                <span className="text-[10px] text-gray-400 font-mono">
                  {trophicPyramid.decomposersList.length} loài
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {trophicPyramid.decomposersList.length === 0 ? (
                  <span className="text-[10px] text-gray-400 italic">
                    Chưa có sinh vật phân giải chuyên biệt.
                  </span>
                ) : (
                  trophicPyramid.decomposersList.map((sp) => (
                    <div
                      key={sp.id}
                      className="rounded-lg border border-purple-500/40 bg-gray-950/80 px-2.5 py-1.5 text-[10px] flex items-center gap-2"
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: sp.color }}
                      />
                      <strong className="text-white">{sp.name}</strong>
                      <span className="text-purple-300 font-mono">
                        ({formatPopulation(sp.population)})
                      </span>
                      <span className="text-gray-400 text-[9px] italic">
                        Tái sinh khoáng chất đất 🔄
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* View Mode 3: Biological Organization Levels & Linnaean Hierarchy */}
        {activeView === "taxonomy" && (
          <div className="mt-3 max-h-80 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
            {/* 1. Levels of Biological Organization */}
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/25 p-3 text-[11px] space-y-2">
              <div className="flex items-center justify-between border-b border-indigo-500/20 pb-1.5 text-xs font-bold text-indigo-300">
                <span className="flex items-center gap-1.5">
                  <span>🔬 4 Cấp Độ Tổ Chức Sinh Học (Từ Tế Bào Đến Loài)</span>
                </span>
                <span className="text-[10px] font-mono text-indigo-400">
                  Tế bào ➔ Cá thể ➔ Quần thể ➔ Loài
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] font-mono">
                <div className="rounded-lg border border-indigo-500/20 bg-black/40 p-2 space-y-1">
                  <div className="font-bold text-indigo-300 flex items-center gap-1">
                    <span>🧫</span>
                    <span>1. Tế Bào (Đơn vị cấu tạo & chức năng của sự sống)</span>
                  </div>
                  <p className="text-gray-300 text-[9.5px] leading-relaxed">
                    • <strong className="text-cyan-300">Tế bào nhân sơ (Prokaryote):</strong> Không có nhân hoàn chỉnh, cấu tạo đơn giản, chuỗi DNA trần, phân đôi nhanh (vi khuẩn lam, vi khuẩn hoại sinh).<br />
                    • <strong className="text-emerald-300">Tế bào nhân thực (Eukaryote):</strong> Có nhân được màng bao bọc và các bào quan chuyên biệt (ti thể, lục lạp). Cơ thể đa bào như động vật có vú và con người cấu tạo từ <strong className="text-amber-300">hàng nghìn tỷ tế bào nhân thực chuyên hóa sâu</strong> (thần kinh, cơ, máu, biểu mô...).
                  </p>
                </div>
                <div className="rounded-lg border border-indigo-500/20 bg-black/40 p-2 space-y-1">
                  <div className="font-bold text-indigo-300 flex items-center gap-1">
                    <span>👥</span>
                    <span>2. Loài & Quần Thể (5 Đặc trưng cơ bản)</span>
                  </div>
                  <p className="text-gray-300 text-[9.5px] leading-relaxed">
                    • <strong className="text-purple-300">Loài (Species):</strong> Tập hợp cá thể cùng kiểu hình, sinh lý, giao phối tự nhiên sinh con hữu thụ.<br />
                    • <strong className="text-amber-300">Quần thể (Population):</strong> Tập hợp cá thể cùng một loài, cùng sống trong một không gian và thời gian xác định, có khả năng sinh sản tạo thế hệ mới.<br />
                    • <strong className="text-cyan-300">5 Đặc trưng cốt lõi:</strong> Kích thước, Mật độ, Tỉ lệ giới tính (♂/♀), Nhóm tuổi, Kiểu phân bố (nhóm, đồng đều, ngẫu nhiên). Ví dụ: Quần thể thông nhựa Đông Bắc, chuột đồng trên đồng lúa.
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Linnaean Taxonomic Hierarchy: Mammalia to Homo sapiens */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-[11px] space-y-2">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-1.5 text-xs font-bold text-amber-300">
                <span className="flex items-center gap-1.5">
                  <span>👑 Thang Phân Loại Sinh Học Linnaean (Từ Giới Đến Con Người)</span>
                </span>
                <span className="text-[10px] font-mono text-amber-400">
                  Kingdom ➔ Phylum ➔ Class ➔ Order ➔ Family ➔ Genus ➔ Species
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 text-center font-mono text-[9.5px]">
                <div className="rounded-lg bg-black/50 border border-amber-500/20 p-1.5">
                  <span className="text-[8px] text-gray-400 uppercase block">1. Giới (Kingdom)</span>
                  <span className="font-bold text-white block">Animalia</span>
                  <span className="text-[8.5px] text-amber-300/80">Động vật</span>
                </div>
                <div className="rounded-lg bg-black/50 border border-amber-500/20 p-1.5">
                  <span className="text-[8px] text-gray-400 uppercase block">2. Ngành (Phylum)</span>
                  <span className="font-bold text-white block">Chordata</span>
                  <span className="text-[8.5px] text-amber-300/80">Có dây sống</span>
                </div>
                <div className="rounded-lg bg-black/50 border border-amber-500/20 p-1.5">
                  <span className="text-[8px] text-gray-400 uppercase block">3. Lớp (Class)</span>
                  <span className="font-bold text-yellow-300 block">Mammalia</span>
                  <span className="text-[8.5px] text-yellow-400/80">Động vật có vú</span>
                </div>
                <div className="rounded-lg bg-black/50 border border-amber-500/20 p-1.5">
                  <span className="text-[8px] text-gray-400 uppercase block">4. Bộ (Order)</span>
                  <span className="font-bold text-white block">Primates</span>
                  <span className="text-[8.5px] text-amber-300/80">Linh trưởng</span>
                </div>
                <div className="rounded-lg bg-black/50 border border-amber-500/20 p-1.5">
                  <span className="text-[8px] text-gray-400 uppercase block">5. Họ (Family)</span>
                  <span className="font-bold text-white block">Hominidae</span>
                  <span className="text-[8.5px] text-amber-300/80">Họ Người</span>
                </div>
                <div className="rounded-lg bg-black/50 border border-amber-500/20 p-1.5">
                  <span className="text-[8px] text-gray-400 uppercase block">6. Chi (Genus)</span>
                  <span className="font-bold text-cyan-300 block">Homo</span>
                  <span className="text-[8.5px] text-cyan-400/80">Chi Người</span>
                </div>
                <div className="rounded-lg bg-black/50 border border-emerald-500/30 p-1.5">
                  <span className="text-[8px] text-gray-400 uppercase block">7. Loài (Species)</span>
                  <span className="font-bold text-emerald-300 block italic">H. sapiens</span>
                  <span className="text-[8.5px] text-emerald-400/80">Người hiện đại</span>
                </div>
              </div>
              <div className="rounded-lg border border-yellow-500/30 bg-black/40 p-2 text-[10px] space-y-1 font-mono">
                <div className="font-bold text-yellow-300 flex items-center gap-1.5">
                  <span>🧠 Quần Thể Người (Homo sapiens) & Các Đặc Điểm Xã Hội Vượt Trội:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[9.5px] text-gray-300">
                  <div className="bg-white/5 rounded p-1.5 border border-white/5">
                    • <strong className="text-yellow-300">Tổ chức xã hội:</strong> Gia đình, thị tộc, đô thị hóa, pháp luật, văn hóa và trật tự nhà nước.
                  </div>
                  <div className="bg-white/5 rounded p-1.5 border border-white/5">
                    • <strong className="text-yellow-300">Công cụ & Kỹ thuật:</strong> Chế tác công cụ phức tạp, làm chủ năng lượng, tự động hóa và khoa học công nghệ.
                  </div>
                  <div className="bg-white/5 rounded p-1.5 border border-white/5">
                    • <strong className="text-yellow-300">Văn hóa & Giáo dục:</strong> Ngôn ngữ, chữ viết, truyền đạt tri thức và đạo đức qua các thế hệ.
                  </div>
                  <div className="bg-white/5 rounded p-1.5 border border-white/5">
                    • <strong className="text-yellow-300">Cải tạo môi trường:</strong> Y tế kéo dài tuổi thọ, nông nghiệp và kiến trúc biến đổi môi trường sống chủ động.
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Live Species Breakdown with Hierarchy & Demographics */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-gray-300 px-1 border-b border-white/10 pb-1">
                <span>📋 Danh Sách Phân Loại & Đặc Trưng Quần Thể ({livingSpecies.length} loài đang sống)</span>
                <span className="text-[10px] font-mono text-gray-500">Dữ liệu sinh thái thời gian thực</span>
              </div>
              <div className="space-y-2">
                {livingSpecies.map((sp) => {
                  const demo = sp.demographics;
                  const tax = sp.taxonomicHierarchy ?? sp.biologicalTraits?.taxonomicHierarchy;
                  const isSap = sp.tier === "sapient" || sp.biologicalTraits?.sapientArchetype === "humanoid";
                  return (
                    <div
                      key={sp.id}
                      className={`rounded-xl border p-2.5 transition-all text-[10px] font-mono ${
                        isSap
                          ? "border-yellow-500/50 bg-gradient-to-r from-yellow-950/30 via-gray-950/80 to-black"
                          : "border-white/10 bg-gray-950/70"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-white/10 pb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: sp.color }}
                          />
                          <strong className="text-xs text-white">{sp.name}</strong>
                          <span className="text-[10px] italic text-gray-400">
                            ({sp.scientificName ?? sp.biologicalTraits?.scientificName})
                          </span>
                          {isSap && (
                            <span className="px-1.5 py-0.2 rounded bg-yellow-950 text-yellow-300 border border-yellow-500/40 text-[9px] font-bold">
                              🧠 Quần thể người / Sapient
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-cyan-300 font-mono">
                          Dân số: <strong>{formatPopulation(sp.population)}</strong> cá thể
                        </div>
                      </div>

                      {/* 7-Level Linnaean Tree */}
                      {tax && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1 text-[9px] bg-black/40 p-1.5 rounded-lg border border-white/5">
                          <span className="text-gray-400 font-bold">Bậc phân loại:</span>
                          <span className="text-gray-300">{tax.kingdom}</span>
                          <span className="text-gray-500">➔</span>
                          <span className="text-gray-300">{tax.phylum}</span>
                          <span className="text-gray-500">➔</span>
                          <span className="text-amber-300 font-semibold">{tax.classRank}</span>
                          <span className="text-gray-500">➔</span>
                          <span className="text-gray-300">{tax.orderRank}</span>
                          <span className="text-gray-500">➔</span>
                          <span className="text-gray-300">{tax.familyRank}</span>
                          <span className="text-gray-500">➔</span>
                          <span className="text-cyan-300 font-bold">{tax.genusRank}</span>
                          <span className="text-gray-500">➔</span>
                          <span className="text-emerald-300 font-bold italic">{tax.speciesRank}</span>
                        </div>
                      )}

                      {/* 5 Population Demographics */}
                      {demo && (
                        <div className="mt-1.5 grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[9px]">
                          <div className="bg-black/40 rounded p-1 border border-white/5">
                            <span className="text-[8px] text-gray-400 block uppercase">Mật độ sinh thái</span>
                            <span className="text-cyan-300 font-bold">{demo.densityPerCell}</span> cá thể/ô
                          </div>
                          <div className="bg-black/40 rounded p-1 border border-white/5">
                            <span className="text-[8px] text-gray-400 block uppercase">Tỉ lệ giới tính</span>
                            <span className="text-rose-300 font-bold">{demo.sexRatio.malePct}% ♂</span> :{" "}
                            <span className="text-emerald-300 font-bold">{demo.sexRatio.femalePct}% ♀</span>
                          </div>
                          <div className="bg-black/40 rounded p-1 border border-white/5">
                            <span className="text-[8px] text-gray-400 block uppercase">Tháp nhóm tuổi</span>
                            <span className="text-gray-300">
                              Non: <strong className="text-amber-300">{demo.ageStructure.preReproductivePct}%</strong> |{" "}
                              Trưởng thành: <strong className="text-emerald-300">{demo.ageStructure.reproductivePct}%</strong> |{" "}
                              Già: <strong className="text-gray-400">{demo.ageStructure.postReproductivePct}%</strong>
                            </span>
                          </div>
                          <div className="bg-black/40 rounded p-1 border border-white/5">
                            <span className="text-[8px] text-gray-400 block uppercase">Kiểu phân bố</span>
                            <span className="text-purple-300 font-medium truncate block" title={demo.distributionLabel}>
                              {demo.distributionLabel}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Cellular Grade Note */}
                      {demo?.cellularGradeDetail && (
                        <div className="mt-1 text-[8.5px] text-gray-400 italic">
                          Cấu trúc tế bào: {demo.cellularGradeDetail.specialization}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
