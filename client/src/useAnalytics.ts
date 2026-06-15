import { useEffect, useRef } from 'react'
import type { PublicState } from '@shared/types'
import { trackEvent } from './analytics'

export function useAnalytics(state: PublicState | null): void {
  const prevPhaseRef = useRef<string | null>(null)
  const prevLastGuessedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!state) {
      prevPhaseRef.current = null
      prevLastGuessedRef.current = null
      return
    }

    const prev = prevPhaseRef.current
    const { phase, round } = state

    if (prev !== null && prev !== phase) {
      if (phase === 'round_intro' && round === 1) {
        trackEvent('game_started', { players: state.players.length })
      } else if (phase === 'round_intro' && round > 1) {
        trackEvent('round_started', { round })
      } else if (phase === 'game_over') {
        trackEvent('game_completed', {
          winner: state.winner,
          scoreA: state.scores.A,
          scoreB: state.scores.B,
        })
      }
    }

    if (
      state.lastGuessed &&
      state.lastGuessed !== prevLastGuessedRef.current &&
      phase === 'playing'
    ) {
      trackEvent('name_guessed', { round })
    }

    prevPhaseRef.current = phase
    prevLastGuessedRef.current = state.lastGuessed
  }, [state])
}
