import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useVirtualScroll } from '../useVirtualScroll.js'

describe('useVirtualScroll', () => {
  it('returns empty array when count is 0', () => {
    const { result } = renderHook(() =>
      useVirtualScroll({
        count: 0,
        itemSize: 200,
      })
    )

    expect(result.current.virtualItems).toEqual([])
    expect(result.current.totalSize).toBe(0)
    expect(result.current.startIndex).toBe(0)
    expect(result.current.endIndex).toBe(0)
  })

  it('calculates virtual items and total size for vertical lists', () => {
    const { result } = renderHook(() =>
      useVirtualScroll({
        count: 50,
        itemSize: 200,
        overscan: 2,
        direction: 'vertical',
        viewportSizeFallback: 600,
      })
    )

    // With 600px viewport and 200px itemSize:
    // Visible: 0, 1, 2 (3 items). With overscan 2: items 0 to 4 (5 items total)
    expect(result.current.totalSize).toBe(50 * 200) // 10000px
    expect(result.current.startIndex).toBe(0)
    expect(result.current.endIndex).toBe(5)
    expect(result.current.virtualItems.length).toBe(6) // indices 0, 1, 2, 3, 4, 5
    expect(result.current.virtualItems[0]!.start).toBe(0)
    expect(result.current.virtualItems[1]!.start).toBe(200)
    expect(result.current.virtualItems[2]!.start).toBe(400)
  })

  it('calculates virtual items and total size for horizontal lists', () => {
    const { result } = renderHook(() =>
      useVirtualScroll({
        count: 30,
        itemSize: 320,
        overscan: 1,
        direction: 'horizontal',
        viewportSizeFallback: 960,
      })
    )

    expect(result.current.totalSize).toBe(30 * 320)
    expect(result.current.startIndex).toBe(0)
    expect(result.current.virtualItems.length).toBeGreaterThan(0)
    expect(result.current.virtualItems[0]!.size).toBe(320)
  })

  it('updates visible items when scrolling occurs', () => {
    const mockContainer = document.createElement('div')
    Object.defineProperty(mockContainer, 'clientHeight', { value: 600, configurable: true })
    Object.defineProperty(mockContainer, 'scrollTop', { value: 0, writable: true, configurable: true })

    const { result } = renderHook(() =>
      useVirtualScroll({
        count: 100,
        itemSize: 200,
        overscan: 1,
        direction: 'vertical',
      })
    )

    act(() => {
      result.current.containerRef(mockContainer)
    })

    // Simulate scrolling down by 1000px (item index 5)
    act(() => {
      mockContainer.scrollTop = 1000
      mockContainer.dispatchEvent(new Event('scroll'))
    })

    // At scrollTop = 1000:
    // Math.floor(1000 / 200) = 5. With overscan 1: startIndex = 4
    // Math.ceil((1000 + 600) / 200) = 8. With overscan 1: endIndex = 9
    expect(result.current.startIndex).toBe(4)
    expect(result.current.endIndex).toBe(9)
    expect(result.current.virtualItems.map((v) => v.index)).toEqual([4, 5, 6, 7, 8, 9])
  })

  it('provides scrollToIndex utility', () => {
    const mockContainer = document.createElement('div')
    mockContainer.scrollTo = vi.fn()
    Object.defineProperty(mockContainer, 'clientHeight', { value: 600, configurable: true })

    const { result } = renderHook(() =>
      useVirtualScroll({
        count: 50,
        itemSize: 200,
        direction: 'vertical',
      })
    )

    act(() => {
      result.current.containerRef(mockContainer)
    })

    act(() => {
      result.current.scrollToIndex(10)
    })

    expect(mockContainer.scrollTo).toHaveBeenCalledWith({
      top: 2000,
      behavior: 'smooth',
    })
  })
})

