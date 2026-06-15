import type { Game } from '../useGame'
import { ROUND_RULES } from '@shared/types'
import { Avatar, Button, Screen, TeamPill } from '../components/ui'
import { Scoreboard } from '../components/Scoreboard'

export function RoundIntro({ game }: { game: Game }) {
  const { state } = game
  if (!state) return null
  const rules = ROUND_RULES[state.round]
  const activePlayer = state.players.find((p) => p.id === state.activePlayerId)

  return (
    <Screen>
      <Scoreboard state={state} />

      <div className="flex-1 flex flex-col items-center justify-center text-center w-full">
        <div className="text-indigo-400 font-bold uppercase tracking-wide text-sm">
          {rules.title}
        </div>
        <p className="text-slate-300 mt-2 max-w-xs">{rules.rule}</p>

        <div className="mt-8 rounded-2xl bg-slate-800/60 p-5 w-full">
          <p className="text-slate-400 text-sm">Next up</p>
          {activePlayer && (
            <div className="flex items-center justify-center gap-2 mt-2">
              <Avatar name={activePlayer.name} color={activePlayer.color} />
              <span className="text-xl font-bold">{activePlayer.name}</span>
              <TeamPill team={state.activeTeam} />
            </div>
          )}
          <p className="text-slate-500 text-sm mt-3">{state.bowlCount} names left in the bowl</p>
        </div>
      </div>

      <div className="w-full">
        {game.isActive ? (
          <Button onClick={game.beginTurn}>I'm ready — start my turn</Button>
        ) : (
          <p className="text-center text-slate-400 pb-2">
            Waiting for {activePlayer?.name} to start…
          </p>
        )}
      </div>
    </Screen>
  )
}
