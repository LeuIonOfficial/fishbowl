import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Submit } from './Submit'
import { makeGame, makeState, makePlayer } from '../test/factories'

const submitPhase = (over = {}) =>
  makeState({
    phase: 'submit',
    players: [
      makePlayer({ id: 'p1', name: 'Host', teamId: 'A' }),
      makePlayer({ id: 'p2', name: 'Bea', teamId: 'B' }),
    ],
    ...over,
  })

describe('Submit', () => {
  it('shows 5 inputs and keeps submit disabled until all are filled', async () => {
    render(<Submit game={makeGame({ state: submitPhase(), meId: 'p1' })} />)
    const inputs = screen.getAllByPlaceholderText(/cleopatra/i)
    expect(inputs).toHaveLength(5)
    expect(screen.getByRole('button')).toBeDisabled()

    for (const [i, input] of inputs.entries()) await userEvent.type(input, `name${i}`)
    expect(screen.getByRole('button', { name: /submit names/i })).toBeEnabled()
  })

  it('submits exactly the 5 entered names and confirms', async () => {
    const game = makeGame({ state: submitPhase(), meId: 'p1' })
    render(<Submit game={game} />)
    const inputs = screen.getAllByPlaceholderText(/cleopatra/i)
    const names = ['Cleopatra', 'Einstein', 'Beyoncé', 'Batman', 'Gandhi']
    for (const [i, input] of inputs.entries()) await userEvent.type(input, names[i])

    await userEvent.click(screen.getByRole('button', { name: /submit names/i }))
    expect(game.submitNames).toHaveBeenCalledWith(names)
    expect(await screen.findByText(/you're in the bowl/i)).toBeInTheDocument()
  })

  it('host can start once everyone has submitted', async () => {
    const state = submitPhase({
      players: [
        makePlayer({ id: 'p1', name: 'Host', teamId: 'A', hasSubmitted: true }),
        makePlayer({ id: 'p2', name: 'Bea', teamId: 'B', hasSubmitted: true }),
      ],
    })
    const game = makeGame({ state, meId: 'p1', isHost: true })
    render(<Submit game={game} />)
    const start = screen.getByRole('button', { name: /start the game/i })
    expect(start).toBeEnabled()
    await userEvent.click(start)
    expect(game.startGame).toHaveBeenCalledOnce()
  })
})
