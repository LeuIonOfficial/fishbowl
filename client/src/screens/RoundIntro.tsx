import type { Game } from '../useGame'
import { Avatar, Button, Screen, TeamPill } from '../components/ui'
import { Scoreboard } from '../components/Scoreboard'
import { useI18n } from '../i18n'
import { translateAnimalName } from '../animals'

export function RoundIntro({ game }: { game: Game }) {
  const { t, lang } = useI18n()
  const { state } = game
  if (!state) return null
  const activePlayer = state.players.find((p) => p.id === state.activePlayerId)

  return (
    <Screen>
      <Scoreboard state={state} />

      <div className="flex-1 flex flex-col items-center justify-center text-center w-full">
        <div className="text-indigo-400 font-bold uppercase tracking-wide text-sm">
          {t(`round.${state.round}.title`)}
        </div>
        <p className="text-slate-300 mt-2 max-w-xs">{t(`round.${state.round}.rule`)}</p>

        <div className="mt-8 rounded-2xl bg-slate-800/60 p-5 w-full">
          <p className="text-slate-400 text-sm">{t('round.next')}</p>
          {activePlayer && (
            <div className="flex items-center justify-center gap-2 mt-2">
              <Avatar name={translateAnimalName(activePlayer.name, lang)} color={activePlayer.color} />
              <span className="text-xl font-bold">{translateAnimalName(activePlayer.name, lang)}</span>
              <TeamPill team={state.activeTeam} />
            </div>
          )}
          <p className="text-slate-500 text-sm mt-3">
            {t('round.namesLeftBowl', { count: state.bowlCount })}
          </p>
        </div>
      </div>

      <div className="w-full">
        {game.isActive ? (
          <Button onClick={game.beginTurn}>{t('round.start')}</Button>
        ) : (
          <p className="text-center text-slate-400 pb-2">
            {t('round.waitingFor', { name: activePlayer ? translateAnimalName(activePlayer.name, lang) : '' })}
          </p>
        )}
      </div>
    </Screen>
  )
}
