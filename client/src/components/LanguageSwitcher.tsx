import { useI18n, LANGS, LANG_LABELS } from '../i18n'

export function LanguageSwitcher() {
  const { lang, setLang } = useI18n()
  return (
    <div className="fixed top-3 right-3 z-40 flex gap-1 rounded-full bg-slate-800/80 p-1 backdrop-blur">
      {LANGS.map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={l === lang}
          className={`rounded-full px-2.5 py-1 text-xs font-bold transition ${
            l === lang ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {LANG_LABELS[l]}
        </button>
      ))}
    </div>
  )
}
