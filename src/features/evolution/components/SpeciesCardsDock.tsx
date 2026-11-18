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
  const [activeView, setActiveView] = useState<"cards" | "food_web">("cards");

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

  // Trophic food chain pyramid groupings
  const trophicPyramid = useMemo(() => {
    const active = speciesSummaries.filter((s) => !s.isExtinct);
    return {
      carnivores: active.filter((s) => s.trophicRole === "carnivore"),
      herbivores: active.filter(
        (s) => s.trophicRole === "herbivore" || s.trophicRole === "omnivore",
      ),
      producers: active.filter((s) => s.trophicRole === "producer"),
      decomposers: active.filter((s) => s.trophicRole === "decomposer"),
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
          <div className="mt-3 max-h-64 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
            {/* Level 3: Apex & Carnivores */}
            <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-2.5">
              <div className="flex items-center justify-between border-b border-rose-500/20 pb-1.5">
                <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <span>
                    🥩 Bậc 3: Động Vật Ăn Thịt & Săn Mồi (Apex & Secondary
                    Carnivores)
                  </span>
                </span>
                <span className="text-[10px] text-gray-400 font-mono">
                  {trophicPyramid.carnivores.length} loài
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {trophicPyramid.carnivores.length === 0 ? (
                  <span className="text-[10px] text-gray-400 italic">
                    Chưa có thú săn mồi nào.
                  </span>
                ) : (
                  trophicPyramid.carnivores.map((sp) => (
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
                        Săn động vật ăn cỏ ➔
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Level 2: Herbivores & Omnivores */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-2.5">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-1.5">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <span>
                    🥬 Bậc 2: Động Vật Ăn Thực Vật & Ăn Tạp (Primary Consumers &
                    Herbivores)
                  </span>
                </span>
                <span className="text-[10px] text-gray-400 font-mono">
                  {trophicPyramid.herbivores.length} loài
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {trophicPyramid.herbivores.length === 0 ? (
                  <span className="text-[10px] text-gray-400 italic">
                    Chưa có động vật ăn cỏ nào.
                  </span>
                ) : (
                  trophicPyramid.herbivores.map((sp) => (
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

            {/* Level 1: Primary Producers (Flora / Algae) */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-2.5">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-1.5">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <span>
                    🌿 Bậc 1: Sinh Vật Sản Xuất Nền Tảng (Primary Producers -
                    Thực Vật & Tảo)
                  </span>
                </span>
                <span className="text-[10px] text-gray-400 font-mono">
                  {trophicPyramid.producers.length} loài
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {trophicPyramid.producers.length === 0 ? (
                  <span className="text-[10px] text-gray-400 italic">
                    Chưa có sinh vật sản xuất nào.
                  </span>
                ) : (
                  trophicPyramid.producers.map((sp) => (
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
                        Quang hợp ánh sáng sao
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Decomposers (Fungi & Microbes) */}
            {trophicPyramid.decomposers.length > 0 && (
              <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-2.5">
                <div className="flex items-center justify-between border-b border-purple-500/20 pb-1.5">
                  <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    <span>
                      🍄 Sinh Vật Phân Giải & Tái Tạo Khoáng (Decomposers - Nấm
                      & Vi Khuẩn Hoại Sinh)
                    </span>
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {trophicPyramid.decomposers.length} loài
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {trophicPyramid.decomposers.map((sp) => (
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
                        Tái sinh khoáng chất đất
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
