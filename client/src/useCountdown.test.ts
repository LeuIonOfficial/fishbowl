import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useCountdown } from './useCountdown'

describe('useCountdown', () => {
  it('returns 0 when there is no deadline', () => {
    const { result } = renderHook(() => useCountdown(null))
    expect(result.current).toBe(0)
  })

  it('reports the seconds remaining until the deadline', () => {
    const { result } = renderHook(() => useCountdown(Date.now() + 5_000))
    expect(result.current).toBeGreaterThan(3)
    expect(result.current).toBeLessThanOrEqual(5)
  })

  it('never goes negative once the deadline has passed', () => {
    const { result } = renderHook(() => useCountdown(Date.now() - 1_000))
    expect(result.current).toBe(0)
  })
})
