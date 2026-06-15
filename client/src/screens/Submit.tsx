import { useState } from 'react'
import type { Game } from '../useGame'
import { NAMES_PER_PLAYER } from '@shared/types'
import { Button, Screen } from '../components/ui'

export function Submit({ game }: { game: Game }) {
  const { state } = game
  const me = game.me()
  const [names, setNames] = useState<string[]>(Array(NAMES_PER_PLAYER).fill(''))
  const [done, setDone] = useState(!!me?.hasSubmitted)
  if (!state) return null

  const teamed = state.players.filter((p) => p.teamId)
  const submitted = teamed.filter((p) => p.hasSubmitted).length
  const allReady = teamed.length > 0 && submitted === teamed.length
  const filled = names.filter((n) => n.trim()).length

  const submit = async () => {
    const res = await game.submitNames(names)
    if (res.ok) setDone(true)
  }

  if (done || me?.hasSubmitted) {
    return (
      <Screen>
        <div className="flex-1" />
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold">You're in the bowl!</h2>
          <p className="text-slate-400 mt-2">
            {submitted} / {teamed.length} players ready
          </p>
        </div>
        <div className="flex-1" />
        <div className="w-full">
          {game.isHost ? (
            <Button disabled={!allReady} onClick={game.startGame}>
              {allReady ? 'Start the game' : 'Waiting for everyone…'}
            </Button>
          ) : (
            <p className="text-center text-slate-400">Waiting for the host to start…</p>
          )}
        </div>
      </Screen>
    )
  }

  return (
    <Screen>
      <div className="w-full text-center mb-4">
        <h2 className="text-2xl font-bold">Add {NAMES_PER_PLAYER} names</h2>
        <p className="text-slate-400 text-sm mt-1">
          People, characters, celebrities — keep them secret!
        </p>
      </div>
      <div className="w-full space-y-2">
        {names.map((n, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-6 text-center text-slate-500 font-bold">{i + 1}</span>
            <input
              value={n}
              onChange={(e) => {
                const next = [...names]
                next[i] = e.target.value
                setNames(next)
              }}
              placeholder="e.g. Cleopatra"
              className="flex-1 rounded-xl bg-slate-800 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        ))}
      </div>
      <div className="flex-1" />
      <div className="w-full mt-6">
        <Button disabled={filled !== NAMES_PER_PLAYER} onClick={submit}>
          {filled === NAMES_PER_PLAYER ? 'Submit names' : `${filled}/${NAMES_PER_PLAYER} filled`}
        </Button>
      </div>
    </Screen>
  )
}
