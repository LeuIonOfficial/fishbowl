import { createGameServer } from './server'

const PORT = Number(process.env.PORT) || 3001

createGameServer(PORT).then(({ port }) => {
  console.log(`Fishbowl server listening on http://localhost:${port}`)
})
