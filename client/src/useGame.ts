import { useCallback, useEffect, useRef, useState } from 'react'
import type { PublicState, TeamId } from '@shared/types'
import { socket, getPlayerId } from './game'
import { trackEvent } from './analytics'

const ROOM_KEY = 'fishbowl.roomId'

function storedRoom(): string | null {
  const fromUrl = new URLSearchParams(location.search).get('room')
  return (fromUrl || localStorage.getItem(ROOM_KEY))?.toUpperCase() || null
}

export interface Game {
  state: PublicState | null
  currentName: string | null
  error: string | null
  me: () => ReturnType<NonNullable<PublicState['players']>['find']>
  isHost: boolean
  isActive: boolean
  // actions
  createRoom: (name?: string) => void
  joinRoom: (roomId: string, name?: string) => void
  leaveRoom: () => void
  rename: (name: string) => void
  chooseTeam: (teamId: TeamId) => void
  beginSubmit: () => void
  submitNames: (names: string[]) => Promise<{ ok: boolean; error?: string }>
  startGame: () => void
  beginTurn: () => void
  guessCorrect: () => void
  playAgain: () => void
}

export function useGame(): Game {
  const playerId = getPlayerId()
  const [state, setState] = useState<PublicState | null>(null)
  const [currentName, setCurrentName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const roomRef = useRef<string | null>(null)

  useEffect(() => {
    const onState = (s: PublicState) => {
      roomRef.current = s.roomId
      localStorage.setItem(ROOM_KEY, s.roomId)
      setState(s)
    }
    const onName = (n: string | null) => setCurrentName(n)
    const onError = (msg: string) => {
      setError(msg)
      setTimeout(() => setError(null), 3500)
    }

    socket.on('state', onState)
    socket.on('current_name', onName)
    socket.on('error_msg', onError)

    // Auto-rejoin a known room (covers refresh / phone-lock reconnects).
    const rejoin = () => {
      const room = roomRef.current || storedRoom()
      if (room) {
        socket.emit('join_room', { roomId: room, playerId }, (res) => {
          if (!res.ok) {
            localStorage.removeItem(ROOM_KEY)
            roomRef.current = null
            setState(null)
          }
        })
      }
    }
    socket.on('connect', rejoin)
    if (socket.connected) rejoin()

    return () => {
      socket.off('state', onState)
      socket.off('current_name', onName)
      socket.off('error_msg', onError)
      socket.off('connect', rejoin)
    }
  }, [playerId])

  const createRoom = useCallback(
    (name?: string) => {
      socket.emit('create_room', { playerId, name }, (res) => {
        if (!res.ok) setError(res.error)
        else trackEvent('room_created', { roomId: res.roomId, playerName: name })
      })
    },
    [playerId]
  )

  const joinRoom = useCallback(
    (roomId: string, name?: string) => {
      const upper = roomId.toUpperCase()
      socket.emit('join_room', { roomId: upper, playerId, name }, (res) => {
        if (!res.ok) setError(res.error)
        else trackEvent('room_joined', { roomId: upper, playerName: name })
      })
    },
    [playerId]
  )

  const leaveRoom = useCallback(() => {
    localStorage.removeItem(ROOM_KEY)
    roomRef.current = null
    setState(null)
    setCurrentName(null)
    history.replaceState(null, '', location.pathname)
  }, [])

  const submitNames = useCallback(
    (names: string[]) =>
      new Promise<{ ok: boolean; error?: string }>((resolve) => {
        socket.emit('submit_names', { names }, resolve)
      }),
    []
  )

  const me = useCallback(
    () => state?.players.find((p) => p.id === playerId),
    [state, playerId]
  )

  return {
    state,
    currentName,
    error,
    me,
    isHost: !!state && state.hostId === playerId,
    isActive: !!state && state.activePlayerId === playerId,
    createRoom,
    joinRoom,
    leaveRoom,
    rename: (name) => socket.emit('rename', { name }),
    chooseTeam: (teamId) => socket.emit('choose_team', { teamId }),
    beginSubmit: () => socket.emit('begin_submit'),
    submitNames,
    startGame: () => socket.emit('start_game'),
    beginTurn: () => socket.emit('begin_turn'),
    guessCorrect: () => socket.emit('guess_correct'),
    playAgain: () => socket.emit('play_again'),
  }
}
