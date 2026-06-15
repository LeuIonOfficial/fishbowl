import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { useT } from '../i18n'

export function Screen({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full flex flex-col items-center px-5 py-6 max-w-md mx-auto w-full">
      {children}
    </div>
  )
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger'
}

export function Button({ variant = 'primary', className = '', ...props }: BtnProps) {
  const base =
    'w-full rounded-2xl px-5 py-4 text-lg font-semibold transition active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100'
  const variants = {
    primary: 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20',
    ghost: 'bg-slate-800 text-slate-100',
    danger: 'bg-rose-600 text-white',
  }
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />
}

export function TeamPill({ team }: { team: 'A' | 'B' }) {
  const t = useT()
  const cls = team === 'A' ? 'bg-sky-500/20 text-sky-300' : 'bg-amber-500/20 text-amber-300'
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${cls}`}>
      {t('common.team', { team })}
    </span>
  )
}

export function Avatar({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
      style={{ backgroundColor: color }}
    >
      {name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
    </span>
  )
}
