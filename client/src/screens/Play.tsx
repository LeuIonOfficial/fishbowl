import { useEffect } from 'react'
import type { Game } from '../useGame'
import { Button, Screen, TeamPill } from '../components/ui'
import { useCountdown } from '../useCountdown'
import { useT } from '../i18n'

export function Play({ game }: { game: Game }) {
  const t = useT()
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
  const roundTitle = t(`round.${state.round}.title`)
  const roundRule = t(`round.${state.round}.rule`)
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
          <span className="text-slate-400 text-sm">{t('play.left', { count: state.bowlCount })}</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center w-full">
          <p className="text-indigo-400 text-sm font-semibold uppercase tracking-wide">
            {roundTitle}
          </p>
          <p className="text-slate-400 text-sm mb-6">{roundRule}</p>
          <div className="rounded-3xl bg-white text-slate-900 px-6 py-12 w-full shadow-2xl">
            <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">
              {t('play.yourWord')}
            </p>
            <p className="text-4xl font-black break-words">{currentName ?? '…'}</p>
          </div>
        </div>

        <Button onClick={game.guessCorrect} disabled={!currentName} className="!py-6 !text-2xl">
          {t('play.gotIt')}
        </Button>
        <p className="text-center text-xs text-slate-500 mt-2">{t('play.noSkip')}</p>
      </Screen>
    )
  }

  // ---- Everyone else ----
  return (
    <Screen>
      <div className="flex-1 flex flex-col items-center justify-center text-center w-full">
        <TeamPill team={state.activeTeam} />
        <p className="text-2xl font-bold mt-4">
          {t('play.givingClues', { name: activePlayer?.name ?? '' })}
        </p>
        <p className="text-indigo-400 mt-1">{roundTitle}</p>
        <div className="my-8">{Timer}</div>
        <p className="text-slate-300 max-w-xs">{roundRule}</p>
        <p className="text-slate-500 text-sm mt-6">{t('play.namesLeft', { count: state.bowlCount })}</p>
      </div>
    </Screen>
  )
}
