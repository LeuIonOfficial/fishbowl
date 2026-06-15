import type { PublicState, TeamId } from '@shared/types'

const STYLES: Record<TeamId, { active: string; label: string }> = {
  A: { active: 'bg-sky-500/20 ring-2 ring-sky-400', label: 'text-sky-300' },
  B: { active: 'bg-amber-500/20 ring-2 ring-amber-400', label: 'text-amber-300' },
}

export function Scoreboard({ state }: { state: PublicState }) {
  return (
    <div className="w-full grid grid-cols-2 gap-3">
      {(['A', 'B'] as TeamId[]).map((t) => {
        const active = state.activeTeam === t && state.phase !== 'game_over'
        const s = STYLES[t]
        return (
          <div
            key={t}
            className={`rounded-2xl p-3 text-center ${active ? s.active : 'bg-slate-800/50'}`}
          >
            <div className={`${s.label} text-xs font-bold`}>TEAM {t}</div>
            <div className="text-3xl font-black">{state.scores[t]}</div>
          </div>
        )
      })}
    </div>
  )
}
