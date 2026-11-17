import type { PlanetInspectData } from './PlanetSurface.js'
import type { BiomeType } from '../utils/planet-math.js'

interface PlanetInspectHUDProps {
  inspectData: PlanetInspectData | null
  planetName?: string
  surfaceTemperatureCelsius?: number
  axialTiltDeg?: number
  rotations: number
  onOpenGenesis?: () => void
}

const BIOME_LABELS: Record<BiomeType, { label: string; color: string; desc: string }> = {
  ice_cap: {
    label: 'Polar Ice Cap',
    color: 'text-sky-200',
    desc: 'Glacial cryosphere, low solar radiation',
  },
  mountain: {
    label: 'Mountain Range',
    color: 'text-stone-300',
    desc: 'High elevation rocky terrain',
  },
  highland: {
    label: 'Highland Forest',
    color: 'text-emerald-300',
    desc: 'Temperate canopy, moderate precipitation',
  },
  lowland: {
    label: 'Lowland Plains',
    color: 'text-green-400',
    desc: 'Fertile grasslands and river basins',
  },
  beach: {
    label: 'Coastal Shoreline',
    color: 'text-amber-200',
    desc: 'Intertidal ecosystem and coastal margins',
  },
  shallow_ocean: {
    label: 'Continental Shelf',
    color: 'text-cyan-400',
    desc: 'Sunlit neritic marine zone',
  },
  deep_ocean: {
    label: 'Abyssal Ocean',
    color: 'text-blue-500',
    desc: 'Deep marine basin, high pressure',
  },
}

export function PlanetInspectHUD({
  inspectData,
  planetName = 'Novum Prime',
  surfaceTemperatureCelsius = 15,
  axialTiltDeg = 23.44,
  rotations,
  onOpenGenesis,
}: PlanetInspectHUDProps) {
  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 z-10 w-72 rounded-lg border border-white/10 bg-gray-950/85 p-3.5 font-mono text-xs shadow-xl backdrop-blur-md"
    >
      <div className="mb-2 flex items-center justify-between border-b border-white/10 pb-2">
        <div>
          <span className="text-[10px] tracking-wider text-blue-400 uppercase font-semibold block">
            {planetName}
          </span>
          <span className="text-[10px] text-gray-400">
            {surfaceTemperatureCelsius}°C • Tilt {axialTiltDeg.toFixed(1)}°
          </span>
        </div>
        {onOpenGenesis && (
          <button
            onClick={onOpenGenesis}
            className="pointer-events-auto rounded bg-blue-600/30 border border-blue-500/40 px-2 py-1 text-[10px] font-semibold text-blue-300 hover:bg-blue-600/50 transition-colors"
          >
            Genesis
          </button>
        )}
      </div>

      <div className="space-y-1.5 text-gray-300">
        <div className="flex justify-between">
          <span className="text-gray-400">Total Rotations</span>
          <span className="font-semibold text-white">{Math.floor(rotations).toLocaleString()}</span>
        </div>

        {inspectData ? (
          <div className="mt-2.5 border-t border-white/10 pt-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Coordinates</span>
              <span className="text-white">
                {inspectData.latLong.latitude >= 0 ? `${inspectData.latLong.latitude}°N` : `${Math.abs(inspectData.latLong.latitude)}°S`},{' '}
                {inspectData.latLong.longitude >= 0 ? `${inspectData.latLong.longitude}°E` : `${Math.abs(inspectData.latLong.longitude)}°W`}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Local Climate</span>
              <span className="text-amber-200">
                {inspectData.localTemperatureCelsius !== undefined
                  ? `${inspectData.localTemperatureCelsius}°C`
                  : `${surfaceTemperatureCelsius}°C`}
              </span>
            </div>

            <div className="mt-1 flex justify-between">
              <span className="text-gray-400">Surface Zone</span>
              <span
                className={`font-semibold ${
                  BIOME_LABELS[inspectData.biome]?.color || 'text-white'
                }`}
              >
                {BIOME_LABELS[inspectData.biome]?.label || inspectData.biome}
              </span>
            </div>

            <p className="mt-1 text-[11px] text-gray-400">
              {BIOME_LABELS[inspectData.biome]?.desc}
            </p>
          </div>
        ) : (
          <div className="mt-2.5 border-t border-white/10 pt-2 text-center text-gray-400 text-[11px]">
            Hover over planet surface to inspect
          </div>
        )}
      </div>
    </div>
  )
}
