import { useState } from 'react'
import type { Game } from '../useGame'
import type { TeamId } from '@shared/types'
import { MIN_PLAYERS } from '@shared/types'
import { Avatar, Button, Screen } from '../components/ui'
import { useI18n } from '../i18n'
import { translateAnimalName } from '../animals'

export function Lobby({ game }: { game: Game }) {
  const { t, lang } = useI18n()
  const { state } = game
  const me = game.me()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(me?.name ?? '')
  if (!state) return null

  const teams: Record<TeamId, typeof state.players> = {
    A: state.players.filter((p) => p.teamId === 'A'),
    B: state.players.filter((p) => p.teamId === 'B'),
  }
  const unassigned = state.players.filter((p) => !p.teamId)
  const canStart =
    state.players.length >= MIN_PLAYERS && teams.A.length > 0 && teams.B.length > 0

  const share = () => {
    const url = `${location.origin}${location.pathname}?room=${state.roomId}`
    if (navigator.share) navigator.share({ title: 'Explica Normal', url }).catch(() => {})
    else navigator.clipboard?.writeText(url)
  }

  return (
    <Screen>
      <div className="w-full text-center mb-4">
        <p className="text-slate-400 text-sm">{t('lobby.roomCode')}</p>
        <button
          onClick={share}
          data-testid="room-code"
          className="text-5xl font-black tracking-[0.2em] active:scale-95 transition"
        >
          {state.roomId}
        </button>
        <p className="text-xs text-slate-500 mt-1">{t('lobby.shareHint')}</p>
      </div>

      {/* Identity */}
      <div className="w-full rounded-2xl bg-slate-800/60 p-3 mb-4 flex items-center gap-3">
        {me && <Avatar name={translateAnimalName(me.name, lang)} color={me.color} />}
        {editing ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              game.rename(name)
              setEditing(false)
            }}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            className="flex-1 bg-transparent text-lg font-semibold focus:outline-none"
          />
        ) : (
          <button className="flex-1 text-left text-lg font-semibold" onClick={() => setEditing(true)}>
            {me ? translateAnimalName(me.name, lang) : ''}{' '}
            <span className="text-slate-500 text-sm">{t('lobby.renameHint')}</span>
          </button>
        )}
      </div>

      {/* Teams */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {(['A', 'B'] as TeamId[]).map((team) => {
          const ring = team === 'A' ? 'ring-sky-500/20' : 'ring-amber-500/20'
          const label = team === 'A' ? 'text-sky-300' : 'text-amber-300'
          return (
            <div key={team} className={`rounded-2xl bg-slate-800/40 p-3 ring-1 ${ring}`}>
              <div className={`${label} font-bold mb-2`}>{t('common.team', { team })}</div>
              <ul className="space-y-2 min-h-[3rem]">
                {teams[team].map((p) => (
                  <li key={p.id} className="flex items-center gap-2 text-sm">
                    <Avatar name={translateAnimalName(p.name, lang)} color={p.color} />
                    <span className={p.connected ? '' : 'opacity-40'}>{translateAnimalName(p.name, lang)}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant="ghost"
                className="mt-3 !py-2 !text-sm"
                disabled={me?.teamId === team}
                onClick={() => game.chooseTeam(team)}
              >
                {me?.teamId === team ? t('lobby.joined') : t('lobby.join', { team })}
              </Button>
            </div>
          )
        })}
      </div>

      {unassigned.length > 0 && (
        <p className="text-slate-500 text-sm mt-3">
          {t('lobby.waitingTeam', { names: unassigned.map((p) => translateAnimalName(p.name, lang)).join(', ') })}
        </p>
      )}

      <div className="flex-1" />

      <div className="w-full mt-6 space-y-2">
        {game.isHost ? (
          <>
            <Button disabled={!canStart} onClick={game.beginSubmit}>
              {canStart ? t('lobby.continue') : t('lobby.needPlayers', { min: MIN_PLAYERS })}
            </Button>
            {!canStart && (
              <p className="text-center text-xs text-slate-500">
                {t('lobby.playersCount', { count: state.players.length, min: MIN_PLAYERS })}
              </p>
            )}
          </>
        ) : (
          <p className="text-center text-slate-400">{t('lobby.waitingHost')}</p>
        )}
        <Button variant="ghost" className="!py-2 !text-sm" onClick={game.leaveRoom}>
          {t('common.leave')}
        </Button>
      </div>
    </Screen>
  )
}
