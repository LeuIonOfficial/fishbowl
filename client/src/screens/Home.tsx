import { useState } from 'react'
import type { Game } from '../useGame'
import { Button, Screen } from '../components/ui'
import { useT } from '../i18n'

const ROUNDS = [
  { emoji: '💬', key: 'r1' },
  { emoji: '✌️', key: 'r2' },
  { emoji: '🤫', key: 'r3' },
] as const

export function Home({ game }: { game: Game }) {
  const t = useT()
  const [code, setCode] = useState('')

  return (
    <Screen>
      {/* Brand */}
      <div className="text-center pt-6 pb-8">
        <h1 className="text-5xl font-black leading-none tracking-tight">
          <span className="text-slate-400 font-extralight">explica</span>
          <span className="text-white"> normal</span>
        </h1>
        <p className="text-slate-400 mt-3 text-sm">{t('home.tagline')}</p>
      </div>

      {/* How to play */}
      <div className="w-full mb-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3 px-1">
          {t('home.howto')}
        </p>
        <div className="space-y-2">
          {(['step1', 'step2', 'step3'] as const).map((k, i) => (
            <div key={k} className="flex items-center gap-3 rounded-2xl bg-slate-800 px-4 py-3">
              <span className="text-indigo-400 font-black text-sm w-4 shrink-0">{i + 1}</span>
              <p className="text-sm text-slate-200">{t(`home.${k}`)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Rounds */}
      <div className="w-full flex gap-2 mb-8">
        {ROUNDS.map(({ emoji, key }) => (
          <div key={key} className="flex-1 rounded-2xl bg-slate-800 p-3 text-center">
            <div className="text-xl mb-1">{emoji}</div>
            <p className="text-xs font-bold text-white leading-tight">{t(`home.${key}`)}</p>
            <p className="text-xs text-slate-500 mt-0.5 leading-tight">{t(`home.${key}.desc`)}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="w-full space-y-3">
        <Button onClick={() => game.createRoom()}>{t('home.create')}</Button>

        <div className="flex items-center gap-3 py-1 text-slate-500 text-sm">
          <div className="h-px flex-1 bg-slate-700" />
          {t('home.or')}
          <div className="h-px flex-1 bg-slate-700" />
        </div>

        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 4))}
          placeholder={t('home.code')}
          autoCapitalize="characters"
          autoComplete="off"
          className="w-full rounded-2xl bg-slate-800 px-5 py-4 text-center text-2xl font-bold tracking-[0.3em] uppercase placeholder:tracking-normal placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <Button variant="ghost" disabled={code.length !== 4} onClick={() => game.joinRoom(code)}>
          {t('home.join')}
        </Button>
      </div>

      <p className="text-xs text-slate-600 mt-6 mb-2">{t('home.footer')}</p>
    </Screen>
  )
}
