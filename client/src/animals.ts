import type { Lang } from './i18n'

type Translations = Partial<Record<Exclude<Lang, 'en'>, string>>

const ADJ: Record<string, Translations> = {
  Sneaky:  { ro: 'Șiret',      ru: 'Хитрый' },
  Brave:   { ro: 'Curajos',    ru: 'Смелый' },
  Jolly:   { ro: 'Vesel',      ru: 'Весёлый' },
  Witty:   { ro: 'Isteț',      ru: 'Мудрый' },
  Calm:    { ro: 'Calm',       ru: 'Спокойный' },
  Mighty:  { ro: 'Puternic',   ru: 'Могучий' },
  Swift:   { ro: 'Rapid',      ru: 'Быстрый' },
  Clever:  { ro: 'Deștept',    ru: 'Ловкий' },
  Fuzzy:   { ro: 'Pufos',      ru: 'Пушистый' },
  Wild:    { ro: 'Sălbatic',   ru: 'Дикий' },
  Lucky:   { ro: 'Norocos',    ru: 'Удачливый' },
  Bold:    { ro: 'Îndrăzneț',  ru: 'Дерзкий' },
  Quiet:   { ro: 'Liniștit',   ru: 'Тихий' },
  Sunny:   { ro: 'Însorit',    ru: 'Солнечный' },
  Grumpy:  { ro: 'Morocănos',  ru: 'Ворчливый' },
  Dizzy:   { ro: 'Amețit',     ru: 'Сонный' },
  Cosmic:  { ro: 'Cosmic',     ru: 'Космический' },
  Royal:   { ro: 'Regal',      ru: 'Царский' },
  Spicy:   { ro: 'Picant',     ru: 'Острый' },
  Gentle:  { ro: 'Blând',      ru: 'Нежный' },
}

const ANIMAL: Record<string, Translations> = {
  Bear:     { ro: 'Urs',         ru: 'Медведь' },
  Fox:      { ro: 'Vulpe',       ru: 'Лиса' },
  Wolf:     { ro: 'Lup',         ru: 'Волк' },
  Lion:     { ro: 'Leu',         ru: 'Лев' },
  Tiger:    { ro: 'Tigru',       ru: 'Тигр' },
  Panda:    { ro: 'Panda',       ru: 'Панда' },
  Penguin:  { ro: 'Pinguin',     ru: 'Пингвин' },
  Dolphin:  { ro: 'Delfin',      ru: 'Дельфин' },
  Eagle:    { ro: 'Vultur',      ru: 'Орёл' },
  Owl:      { ro: 'Bufniță',     ru: 'Сова' },
  Monkey:   { ro: 'Maimuță',     ru: 'Обезьяна' },
  Rabbit:   { ro: 'Iepure',      ru: 'Кролик' },
  Koala:    { ro: 'Koala',       ru: 'Коала' },
  Elephant: { ro: 'Elefant',     ru: 'Слон' },
  Giraffe:  { ro: 'Girafă',      ru: 'Жираф' },
  Hedgehog: { ro: 'Arici',       ru: 'Ёжик' },
  Raven:    { ro: 'Corb',        ru: 'Ворон' },
  Octopus:  { ro: 'Caracatiță',  ru: 'Осьминог' },
  Llama:    { ro: 'Lamă',        ru: 'Лама' },
  Narwhal:  { ro: 'Narval',      ru: 'Нарвал' },
}

/**
 * Translates an auto-generated "Adjective Animal" English name to the given language.
 * Custom names (not in the lookup tables) pass through unchanged.
 */
export function translateAnimalName(name: string, lang: Lang): string {
  if (lang === 'en') return name
  const parts = name.split(' ')
  if (parts.length !== 2) return name
  const [adj, animal] = parts
  const a = ADJ[adj]?.[lang as 'ro' | 'ru']
  const b = ANIMAL[animal]?.[lang as 'ro' | 'ru']
  return a && b ? `${a} ${b}` : name
}
