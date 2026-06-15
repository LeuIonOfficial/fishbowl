import { createContext, useCallback, useContext, useState, ReactNode } from 'react'
import { translate, Lang, LANGS, DEFAULT_LANG } from './translations'

export type { Lang } from './translations'
export { LANGS, LANG_LABELS } from './translations'

const LANG_KEY = 'fishbowl.lang'

type Translator = (key: string, vars?: Record<string, string | number>) => string

function isLang(v: string | null | undefined): v is Lang {
  return !!v && (LANGS as readonly string[]).includes(v)
}

/** Preference order: ?lang=  →  localStorage  →  browser language  →  ro. */
export function resolveLang(): Lang {
  try {
    const fromUrl = new URLSearchParams(location.search).get('lang')
    if (isLang(fromUrl)) return fromUrl
    const stored = localStorage.getItem(LANG_KEY)
    if (isLang(stored)) return stored
    const prefs = navigator.languages?.length ? navigator.languages : [navigator.language]
    for (const p of prefs) {
      const code = p.slice(0, 2).toLowerCase()
      if (isLang(code)) return code
    }
  } catch {
    /* SSR / non-browser */
  }
  return DEFAULT_LANG
}

interface I18n {
  lang: Lang
  setLang: (l: Lang) => void
  t: Translator
}

const I18nContext = createContext<I18n | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const l = resolveLang()
    if (typeof document !== 'undefined') document.documentElement.lang = l
    return l
  })

  const setLang = useCallback((l: Lang) => {
    try {
      localStorage.setItem(LANG_KEY, l)
    } catch {
      /* ignore */
    }
    if (typeof document !== 'undefined') document.documentElement.lang = l
    setLangState(l)
  }, [])

  const t = useCallback<Translator>((key, vars) => translate(lang, key, vars), [lang])

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext)
  if (ctx) return ctx
  // Fallback for components rendered without a provider (e.g. unit tests):
  // a read-only translator bound to the resolved language.
  const lang = resolveLang()
  return { lang, setLang: () => {}, t: (key, vars) => translate(lang, key, vars) }
}

export function useT(): Translator {
  return useI18n().t
}
