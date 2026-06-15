// Auto-generated anonymous identities, à la Google Docs ("Anonymous Aardvark").
// English names are used as stable keys; the client translates them for display.

const ADJECTIVES = [
  'Sneaky', 'Brave', 'Jolly', 'Witty', 'Calm', 'Mighty', 'Swift', 'Clever',
  'Fuzzy', 'Wild', 'Lucky', 'Bold', 'Quiet', 'Sunny', 'Grumpy', 'Dizzy',
  'Cosmic', 'Royal', 'Spicy', 'Gentle',
]

const ANIMALS = [
  'Bear', 'Fox', 'Wolf', 'Lion', 'Tiger', 'Panda', 'Penguin', 'Dolphin',
  'Eagle', 'Owl', 'Monkey', 'Rabbit', 'Koala', 'Elephant', 'Giraffe', 'Hedgehog',
  'Raven', 'Octopus', 'Llama', 'Narwhal',
]

export const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f43f5e', '#a855f7',
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** A random "Adjective Animal" name not already taken in the room. */
export function generateAnimalName(taken: Set<string>): string {
  for (let i = 0; i < 50; i++) {
    const name = `${pick(ADJECTIVES)} ${pick(ANIMALS)}`
    if (!taken.has(name)) return name
  }
  return `${pick(ADJECTIVES)} ${pick(ANIMALS)} ${Math.floor(Math.random() * 1000)}`
}

export function pickColor(index: number): string {
  return COLORS[index % COLORS.length]
}
