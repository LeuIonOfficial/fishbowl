import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { translate } from './translations'
import { resolveLang, I18nProvider } from './index'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { Home } from '../screens/Home'
import { makeGame } from '../test/factories'

describe('translate()', () => {
  it('returns the string for each language', () => {
    expect(translate('ro', 'home.create')).toBe('Creează o cameră')
    expect(translate('ru', 'home.create')).toBe('Создать комнату')
    expect(translate('en', 'home.create')).toBe('Create a room')
  })

  it('interpolates variables', () => {
    expect(translate('en', 'lobby.join', { team: 'A' })).toBe('Join A')
    expect(translate('ro', 'submit.title', { n: 5 })).toBe('Adaugă 5 nume')
  })

  it('falls back to the default language (ro) for an unknown key', () => {
    expect(translate('en', 'totally.missing.key')).toBe('totally.missing.key')
  })
})

describe('resolveLang() precedence', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it('prefers a stored preference', () => {
    localStorage.setItem('fishbowl.lang', 'ru')
    expect(resolveLang()).toBe('ru')
  })

  it('uses the browser language when nothing is stored', () => {
    Object.defineProperty(navigator, 'languages', { value: ['ro-RO', 'en'], configurable: true })
    expect(resolveLang()).toBe('ro')
  })

  it('defaults to Romanian for an unsupported browser language', () => {
    Object.defineProperty(navigator, 'languages', { value: ['fr-FR'], configurable: true })
    expect(resolveLang()).toBe('ro')
  })
})

describe('LanguageSwitcher', () => {
  beforeEach(() => localStorage.clear())

  it('renders Romanian by default and switches language live', async () => {
    localStorage.setItem('fishbowl.lang', 'ro')
    render(
      <I18nProvider>
        <LanguageSwitcher />
        <Home game={makeGame()} />
      </I18nProvider>
    )
    // Romanian copy is shown.
    expect(screen.getByRole('button', { name: 'Creează o cameră' })).toBeInTheDocument()

    // Switch to English.
    await userEvent.click(screen.getByRole('button', { name: 'EN' }))
    expect(screen.getByRole('button', { name: 'Create a room' })).toBeInTheDocument()
    expect(localStorage.getItem('fishbowl.lang')).toBe('en')
  })
})
