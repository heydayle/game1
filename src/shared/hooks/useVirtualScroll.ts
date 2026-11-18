import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

export interface UseVirtualScrollOptions {
  /** Total number of items in the list */
  count: number
  /** Fixed or estimated dimension per item in pixels (height for vertical, width for horizontal) */
  itemSize: number
  /** Number of extra items to render outside the visible viewport buffer */
  overscan?: number
  /** Scroll direction: 'vertical' (default) or 'horizontal' */
  direction?: 'vertical' | 'horizontal'
  /** Fallback viewport dimension in pixels when running in non-browser or JSDOM environments where clientHeight/clientWidth is 0 */
  viewportSizeFallback?: number
}

export interface VirtualItem {
  index: number
  start: number
  size: number
}

export interface UseVirtualScrollReturn {
  containerRef: (node: HTMLElement | null) => void
  virtualItems: VirtualItem[]
  totalSize: number
  startIndex: number
  endIndex: number
  isScrolling: boolean
  scrollToIndex: (index: number) => void
}

/**
 * Ultra-performant, zero-dependency virtual scroll hook.
 *
 * Supports both vertical lists (e.g. Right Drawer card roster) and
 * horizontal carousels (e.g. Floating Bottom Dock).
 *
 * Recycles DOM nodes so that only items within the visible viewport plus an
 * overscan buffer are rendered, ensuring smooth 60fps scrolling even with
 * hundreds of species cards.
 */
export function useVirtualScroll({
  count,
  itemSize,
  overscan = 2,
  direction = 'vertical',
  viewportSizeFallback = 800,
}: UseVirtualScrollOptions): UseVirtualScrollReturn {
  const containerNodeRef = useRef<HTMLElement | null>(null)
  const [scrollOffset, setScrollOffset] = useState(0)
  const [viewportSize, setViewportSize] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleScroll = useCallback(() => {
    const el = containerNodeRef.current
    if (!el) return

    const offset = direction === 'vertical' ? el.scrollTop : el.scrollLeft
    setScrollOffset(offset)
    setIsScrolling(true)

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false)
    }, 120)
  }, [direction])

  const updateViewportSize = useCallback(() => {
    const el = containerNodeRef.current
    if (!el) return
    const measured = direction === 'vertical' ? el.clientHeight : el.clientWidth
    setViewportSize(measured)
  }, [direction])

  const containerRef = useCallback(
    (node: HTMLElement | null) => {
      if (containerNodeRef.current) {
        containerNodeRef.current.removeEventListener('scroll', handleScroll)
      }
      containerNodeRef.current = node
      if (node) {
        node.addEventListener('scroll', handleScroll, { passive: true })
        const measured = direction === 'vertical' ? node.clientHeight : node.clientWidth
        setViewportSize(measured)
      }
    },
    [handleScroll, direction]
  )

  useEffect(() => {
    updateViewportSize()
    window.addEventListener('resize', updateViewportSize)
    return () => {
      window.removeEventListener('resize', updateViewportSize)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [updateViewportSize])

  // In JSDOM test runner, clientHeight/clientWidth defaults to 0.
  // Fall back to viewportSizeFallback (default 800px) so tests can inspect items without manual mocking.
  const effectiveViewport = viewportSize > 0 ? viewportSize : viewportSizeFallback

  const totalSize = count * itemSize

  const { startIndex, endIndex, virtualItems } = useMemo(() => {
    if (count <= 0) {
      return { startIndex: 0, endIndex: 0, virtualItems: [] }
    }

    const startIdx = Math.max(0, Math.floor(scrollOffset / itemSize) - overscan)
    const endIdx = Math.min(
      count - 1,
      Math.ceil((scrollOffset + effectiveViewport) / itemSize) + overscan
    )

    const items: VirtualItem[] = []
    for (let i = startIdx; i <= endIdx; i++) {
      items.push({
        index: i,
        start: i * itemSize,
        size: itemSize,
      })
    }

    return { startIndex: startIdx, endIndex: endIdx, virtualItems: items }
  }, [count, itemSize, scrollOffset, effectiveViewport, overscan])

  const scrollToIndex = useCallback(
    (index: number) => {
      const el = containerNodeRef.current
      if (!el) return
      const targetOffset = Math.max(0, Math.min(index * itemSize, totalSize - effectiveViewport))
      if (direction === 'vertical') {
        el.scrollTo({ top: targetOffset, behavior: 'smooth' })
      } else {
        el.scrollTo({ left: targetOffset, behavior: 'smooth' })
      }
    },
    [itemSize, totalSize, effectiveViewport, direction]
  )

  return {
    containerRef,
    virtualItems,
    totalSize,
    startIndex,
    endIndex,
    isScrolling,
    scrollToIndex,
  }
}

