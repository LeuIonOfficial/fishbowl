import { useState } from 'react'
import type { Game } from '../useGame'
import { Button, Screen } from '../components/ui'
import { useT } from '../i18n'

export function Home({ game }: { game: Game }) {
  const t = useT()
  const [code, setCode] = useState('')

  return (
    <Screen>
      <div className="flex-1" />
      <div className="text-center mb-10">
        <div className="text-6xl mb-3">🐠</div>
        <h1 className="text-4xl font-black tracking-tight">Fishbowl</h1>
        <p className="text-slate-400 mt-2">{t('home.tagline')}</p>
      </div>

      <div className="w-full space-y-3">
        <Button onClick={() => game.createRoom()}>{t('home.create')}</Button>

        <div className="flex items-center gap-3 py-2 text-slate-500 text-sm">
          <div className="h-px flex-1 bg-slate-700" /> {t('home.or')}{' '}
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
      <div className="flex-1" />
      <p className="text-xs text-slate-600 mt-6">{t('home.footer')}</p>
    </Screen>
  )
}
