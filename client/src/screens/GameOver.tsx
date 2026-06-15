import type { Game } from '../useGame'
import { Button, Screen } from '../components/ui'
import { Scoreboard } from '../components/Scoreboard'

export function GameOver({ game }: { game: Game }) {
  const { state } = game
  if (!state) return null

  const title =
    state.winner === 'tie'
      ? "It's a tie!"
      : `Team ${state.winner} wins! 🏆`

  return (
    <Screen>
      <div className="flex-1" />
      <div className="text-center w-full">
        <div className="text-6xl mb-3">🎉</div>
        <h1 className="text-3xl font-black mb-6">{title}</h1>
        <Scoreboard state={state} />
      </div>
      <div className="flex-1" />
      <div className="w-full space-y-2">
        {game.isHost ? (
          <Button onClick={game.playAgain}>Play again</Button>
        ) : (
          <p className="text-center text-slate-400">Waiting for the host to restart…</p>
        )}
        <Button variant="ghost" className="!py-2 !text-sm" onClick={game.leaveRoom}>
          Leave
        </Button>
      </div>
    </Screen>
  )
}
