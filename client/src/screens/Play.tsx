import { useEffect } from 'react'
import type { Game } from '../useGame'
import { ROUND_RULES } from '@shared/types'
import { Button, Screen, TeamPill } from '../components/ui'
import { useCountdown } from '../useCountdown'

export function Play({ game }: { game: Game }) {
  const { state, currentName } = game
  const secondsLeft = useCountdown(state?.turnEndsAt ?? null)

  // Keep the clue-giver's screen awake during their turn.
  useEffect(() => {
    if (!game.isActive) return
    let lock: WakeLockSentinel | null = null
    const request = async () => {
      try {
        lock = await navigator.wakeLock?.request('screen')
      } catch {
        /* ignore */
      }
    }
    request()
    const onVisible = () => document.visibilityState === 'visible' && request()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      lock?.release().catch(() => {})
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [game.isActive])

  if (!state) return null
  const rules = ROUND_RULES[state.round]
  const activePlayer = state.players.find((p) => p.id === state.activePlayerId)
  const low = secondsLeft <= 10

  const Timer = (
    <div className={`text-6xl font-black tabular-nums ${low ? 'text-rose-400' : ''}`}>
      {secondsLeft}
    </div>
  )

  // ---- Clue-giver view ----
  if (game.isActive) {
    return (
      <Screen>
        <div className="w-full flex items-center justify-between">
          <TeamPill team={state.activeTeam} />
          <div className={`text-2xl font-black tabular-nums ${low ? 'text-rose-400' : ''}`}>
            {secondsLeft}s
          </div>
          <span className="text-slate-400 text-sm">{state.bowlCount} left</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center w-full">
          <p className="text-indigo-400 text-sm font-semibold uppercase tracking-wide">
            {rules.title}
          </p>
          <p className="text-slate-400 text-sm mb-6">{rules.rule}</p>
          <div className="rounded-3xl bg-white text-slate-900 px-6 py-12 w-full shadow-2xl">
            <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">Your word</p>
            <p className="text-4xl font-black break-words">{currentName ?? '…'}</p>
          </div>
        </div>

        <Button onClick={game.guessCorrect} disabled={!currentName} className="!py-6 !text-2xl">
          ✓ Got it!
        </Button>
        <p className="text-center text-xs text-slate-500 mt-2">
          No skipping — keep going until they guess it.
        </p>
      </Screen>
    )
  }

  // ---- Everyone else ----
  return (
    <Screen>
      <div className="flex-1 flex flex-col items-center justify-center text-center w-full">
        <TeamPill team={state.activeTeam} />
        <p className="text-2xl font-bold mt-4">{activePlayer?.name} is giving clues</p>
        <p className="text-indigo-400 mt-1">{rules.title}</p>
        <div className="my-8">{Timer}</div>
        <p className="text-slate-300 max-w-xs">{rules.rule}</p>
        <p className="text-slate-500 text-sm mt-6">{state.bowlCount} names left</p>
      </div>
    </Screen>
  )
}
