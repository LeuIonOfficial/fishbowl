import { useEffect, useState } from 'react'

/**
 * Local countdown derived from a server timestamp. The server never broadcasts
 * per-second ticks — it sends `turnEndsAt` once and each client counts down here.
 */
export function useCountdown(endsAt: number | null): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!endsAt) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [endsAt])

  if (!endsAt) return 0
  return Math.max(0, Math.ceil((endsAt - now) / 1000))
}
