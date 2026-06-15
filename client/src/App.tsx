import { useGame } from './useGame'
import { Home } from './screens/Home'
import { Lobby } from './screens/Lobby'
import { Submit } from './screens/Submit'
import { RoundIntro } from './screens/RoundIntro'
import { Play } from './screens/Play'
import { GameOver } from './screens/GameOver'

export default function App() {
  const game = useGame()
  const { state, error } = game

  return (
    <>
      {error && (
        <div className="fixed top-3 inset-x-0 z-50 flex justify-center px-4">
          <div className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium shadow-lg">
            {error}
          </div>
        </div>
      )}
      {!state ? (
        <Home game={game} />
      ) : state.phase === 'lobby' ? (
        <Lobby game={game} />
      ) : state.phase === 'submit' ? (
        <Submit game={game} />
      ) : state.phase === 'round_intro' ? (
        <RoundIntro game={game} />
      ) : state.phase === 'playing' ? (
        <Play game={game} />
      ) : (
        <GameOver game={game} />
      )}
    </>
  )
}
