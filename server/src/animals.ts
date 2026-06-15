// Auto-generated anonymous identities, à la Google Docs ("Anonymous Aardvark").

const WORDS: Record<string, { adj: string[]; animal: string[] }> = {
  ro: {
    adj: [
      'Șiret', 'Curajos', 'Vesel', 'Isteț', 'Calm', 'Puternic', 'Rapid', 'Deștept',
      'Pufos', 'Sălbatic', 'Norocos', 'Îndrăzneț', 'Liniștit', 'Însorit', 'Morocănos', 'Amețit',
      'Cosmic', 'Regal', 'Picant', 'Blând',
    ],
    animal: [
      'Vidră', 'Uliu', 'Panda', 'Linx', 'Gecko', 'Morsă', 'Bursuc', 'Stârc',
      'Koala', 'Elan', 'Corb', 'Tapir', 'Dihor', 'Lamă', 'Narval', 'Arici',
      'Pinguin', 'Zimbru', 'Mantis', 'Caracatiță',
    ],
  },
  ru: {
    adj: [
      'Хитрый', 'Смелый', 'Весёлый', 'Мудрый', 'Спокойный', 'Могучий', 'Быстрый', 'Ловкий',
      'Пушистый', 'Дикий', 'Удачливый', 'Дерзкий', 'Тихий', 'Солнечный', 'Ворчливый', 'Сонный',
      'Космический', 'Царский', 'Острый', 'Нежный',
    ],
    animal: [
      'Выдра', 'Сокол', 'Панда', 'Рысь', 'Геккон', 'Морж', 'Барсук', 'Цапля',
      'Коала', 'Лось', 'Ворон', 'Тапир', 'Хорёк', 'Лама', 'Нарвал', 'Ёжик',
      'Пингвин', 'Зубр', 'Мантис', 'Осьминог',
    ],
  },
  en: {
    adj: [
      'Sneaky', 'Brave', 'Jolly', 'Witty', 'Calm', 'Mighty', 'Swift', 'Clever',
      'Fuzzy', 'Wild', 'Lucky', 'Bold', 'Quiet', 'Sunny', 'Grumpy', 'Dizzy',
      'Cosmic', 'Royal', 'Spicy', 'Gentle',
    ],
    animal: [
      'Otter', 'Falcon', 'Panda', 'Lynx', 'Gecko', 'Walrus', 'Badger', 'Heron',
      'Koala', 'Moose', 'Raven', 'Tapir', 'Ferret', 'Llama', 'Narwhal', 'Hedgehog',
      'Penguin', 'Bison', 'Mantis', 'Octopus',
    ],
  },
}

export const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f43f5e', '#a855f7',
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** A random "Adjective Animal" name not already taken in the room. */
export function generateAnimalName(taken: Set<string>, lang = 'ro'): string {
  const { adj, animal } = WORDS[lang] ?? WORDS.ro
  for (let i = 0; i < 50; i++) {
    const name = `${pick(adj)} ${pick(animal)}`
    if (!taken.has(name)) return name
  }
  return `${pick(adj)} ${pick(animal)} ${Math.floor(Math.random() * 1000)}`
}

export function pickColor(index: number): string {
  return COLORS[index % COLORS.length]
}
