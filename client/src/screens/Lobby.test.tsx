import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Lobby } from './Lobby'
import { makeGame, makeState, makePlayer } from '../test/factories'

const fourPlayers = () =>
  makeState({
    players: [
      makePlayer({ id: 'p1', name: 'Host', teamId: 'A' }),
      makePlayer({ id: 'p2', name: 'Bea', teamId: 'B' }),
      makePlayer({ id: 'p3', name: 'Cy', teamId: 'A' }),
      makePlayer({ id: 'p4', name: 'Dee', teamId: 'B' }),
    ],
  })

describe('Lobby', () => {
  it('shows the room code and all players', () => {
    render(<Lobby game={makeGame({ state: fourPlayers(), meId: 'p1' })} />)
    expect(screen.getByText('WXYZ')).toBeInTheDocument()
    expect(screen.getByText('Bea')).toBeInTheDocument()
    expect(screen.getByText('Dee')).toBeInTheDocument()
  })

  it('lets the host continue when 4 players span both teams', async () => {
    const game = makeGame({ state: fourPlayers(), meId: 'p1', isHost: true })
    render(<Lobby game={game} />)
    const cont = screen.getByRole('button', { name: /everyone in/i })
    expect(cont).toBeEnabled()
    await userEvent.click(cont)
    expect(game.beginSubmit).toHaveBeenCalledOnce()
  })

  it('switches team when tapping the other team', async () => {
    const game = makeGame({ state: fourPlayers(), meId: 'p1', isHost: true })
    render(<Lobby game={game} />)
    await userEvent.click(screen.getByRole('button', { name: /join b/i }))
    expect(game.chooseTeam).toHaveBeenCalledWith('B')
  })

  it('shows a waiting message to non-hosts', () => {
    render(<Lobby game={makeGame({ state: fourPlayers(), meId: 'p2', isHost: false })} />)
    expect(screen.getByText(/waiting for the host/i)).toBeInTheDocument()
  })

  it('blocks the host from starting with too few players', () => {
    const state = makeState({
      players: [
        makePlayer({ id: 'p1', name: 'Host', teamId: 'A' }),
        makePlayer({ id: 'p2', name: 'Bea', teamId: 'B' }),
      ],
    })
    render(<Lobby game={makeGame({ state, meId: 'p1', isHost: true })} />)
    expect(screen.getByRole('button', { name: /need 4\+ players/i })).toBeDisabled()
  })
})
