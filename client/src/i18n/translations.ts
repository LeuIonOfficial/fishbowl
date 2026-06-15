export const LANGS = ['ro', 'ru', 'en'] as const
export type Lang = (typeof LANGS)[number]

// Romanian is the primary language.
export const DEFAULT_LANG: Lang = 'ro'

export const LANG_LABELS: Record<Lang, string> = { ro: 'RO', ru: 'RU', en: 'EN' }

type Dict = Record<string, string>

const en: Dict = {
  'home.tagline': 'The party guessing game. Grab some friends.',
  'home.create': 'Create a room',
  'home.or': 'or join',
  'home.code': 'ROOM CODE',
  'home.join': 'Join room',
  'home.footer': '4+ players · 2 teams · 3 rounds',

  'lobby.roomCode': 'Room code',
  'lobby.shareHint': 'Tap the code to share the join link',
  'lobby.renameHint': '(tap to rename)',
  'lobby.join': 'Join {team}',
  'lobby.joined': 'Joined',
  'lobby.waitingTeam': 'Waiting to pick a team: {names}',
  'lobby.continue': 'Everyone in — continue',
  'lobby.needPlayers': 'Need {min}+ players on 2 teams',
  'lobby.playersCount': '{count}/{min} players · each team needs ≥1',
  'lobby.waitingHost': 'Waiting for the host to start…',

  'common.leave': 'Leave',
  'common.team': 'Team {team}',

  'submit.title': 'Add {n} names',
  'submit.subtitle': 'People, characters, celebrities — keep them secret!',
  'submit.placeholder': 'e.g. Cleopatra',
  'submit.submit': 'Submit names',
  'submit.filled': '{filled}/{n} filled',
  'submit.done': "You're in the bowl!",
  'submit.ready': '{submitted} / {total} players ready',
  'submit.start': 'Start the game',
  'submit.waitingEveryone': 'Waiting for everyone…',

  'round.next': 'Next up',
  'round.namesLeftBowl': '{count} names left in the bowl',
  'round.start': "I'm ready — start my turn",
  'round.waitingFor': 'Waiting for {name} to start…',
  'round.1.title': 'Round 1 — Describe',
  'round.1.rule': 'Say anything except the name itself. No skipping.',
  'round.2.title': 'Round 2 — Two Words',
  'round.2.rule': 'Describe using a maximum of 2 words. No skipping.',
  'round.3.title': 'Round 3 — Act It Out',
  'round.3.rule': 'Charades only — no words at all. No skipping.',

  'play.yourWord': 'Your word',
  'play.gotIt': '✓ Got it!',
  'play.noSkip': 'No skipping — keep going until they guess it.',
  'play.givingClues': '{name} is giving clues',
  'play.namesLeft': '{count} names left',
  'play.left': '{count} left',

  'over.win': 'Team {team} wins! 🏆',
  'over.tie': "It's a tie!",
  'over.playAgain': 'Play again',
  'over.waitingRestart': 'Waiting for the host to restart…',
}

const ro: Dict = {
  'home.tagline': 'Jocul de ghicit pentru petreceri. Adună-ți prietenii.',
  'home.create': 'Creează o cameră',
  'home.or': 'sau intră',
  'home.code': 'COD CAMERĂ',
  'home.join': 'Intră în cameră',
  'home.footer': '4+ jucători · 2 echipe · 3 runde',

  'lobby.roomCode': 'Cod cameră',
  'lobby.shareHint': 'Apasă pe cod pentru a partaja linkul',
  'lobby.renameHint': '(apasă pentru a redenumi)',
  'lobby.join': 'Intră în {team}',
  'lobby.joined': 'În echipă',
  'lobby.waitingTeam': 'Așteptăm să aleagă echipa: {names}',
  'lobby.continue': 'Toți sunt aici — continuă',
  'lobby.needPlayers': 'Sunt necesari {min}+ jucători în 2 echipe',
  'lobby.playersCount': '{count}/{min} jucători · fiecare echipă are nevoie de ≥1',
  'lobby.waitingHost': 'Se așteaptă ca gazda să înceapă…',

  'common.leave': 'Ieși',
  'common.team': 'Echipa {team}',

  'submit.title': 'Adaugă {n} nume',
  'submit.subtitle': 'Persoane, personaje, celebrități — ține-le secrete!',
  'submit.placeholder': 'ex. Cleopatra',
  'submit.submit': 'Trimite numele',
  'submit.filled': '{filled}/{n} completate',
  'submit.done': 'Ești în bol!',
  'submit.ready': '{submitted} / {total} jucători gata',
  'submit.start': 'Începe jocul',
  'submit.waitingEveryone': 'Se așteaptă toți jucătorii…',

  'round.next': 'Urmează',
  'round.namesLeftBowl': '{count} nume rămase în bol',
  'round.start': 'Sunt gata — începe tura mea',
  'round.waitingFor': 'Se așteaptă ca {name} să înceapă…',
  'round.1.title': 'Runda 1 — Descrie',
  'round.1.rule': 'Spune orice în afară de nume. Fără a sări peste.',
  'round.2.title': 'Runda 2 — Două cuvinte',
  'round.2.rule': 'Descrie folosind maximum 2 cuvinte. Fără a sări peste.',
  'round.3.title': 'Runda 3 — Mimează',
  'round.3.rule': 'Doar mimă — fără cuvinte. Fără a sări peste.',

  'play.yourWord': 'Cuvântul tău',
  'play.gotIt': '✓ Ghicit!',
  'play.noSkip': 'Fără a sări peste — continuă până ghicesc.',
  'play.givingClues': '{name} oferă indicii',
  'play.namesLeft': '{count} nume rămase',
  'play.left': '{count} rămase',

  'over.win': 'Echipa {team} câștigă! 🏆',
  'over.tie': 'Egalitate!',
  'over.playAgain': 'Joacă din nou',
  'over.waitingRestart': 'Se așteaptă ca gazda să repornească…',
}

const ru: Dict = {
  'home.tagline': 'Весёлая игра в угадайку. Зовите друзей.',
  'home.create': 'Создать комнату',
  'home.or': 'или войти',
  'home.code': 'КОД КОМНАТЫ',
  'home.join': 'Войти в комнату',
  'home.footer': '4+ игрока · 2 команды · 3 раунда',

  'lobby.roomCode': 'Код комнаты',
  'lobby.shareHint': 'Нажмите на код, чтобы поделиться ссылкой',
  'lobby.renameHint': '(нажмите, чтобы переименовать)',
  'lobby.join': 'В команду {team}',
  'lobby.joined': 'В команде',
  'lobby.waitingTeam': 'Выбирают команду: {names}',
  'lobby.continue': 'Все в сборе — продолжить',
  'lobby.needPlayers': 'Нужно {min}+ игроков в 2 командах',
  'lobby.playersCount': '{count}/{min} игроков · в каждой команде нужен ≥1',
  'lobby.waitingHost': 'Ожидание начала от ведущего…',

  'common.leave': 'Выйти',
  'common.team': 'Команда {team}',

  'submit.title': 'Добавьте {n} имён',
  'submit.subtitle': 'Люди, персонажи, знаменитости — держите в секрете!',
  'submit.placeholder': 'напр. Клеопатра',
  'submit.submit': 'Отправить имена',
  'submit.filled': '{filled}/{n} заполнено',
  'submit.done': 'Вы в чаше!',
  'submit.ready': '{submitted} / {total} игроков готовы',
  'submit.start': 'Начать игру',
  'submit.waitingEveryone': 'Ожидание всех игроков…',

  'round.next': 'Следующий',
  'round.namesLeftBowl': '{count} имён осталось в чаше',
  'round.start': 'Я готов — начать мой ход',
  'round.waitingFor': 'Ожидание начала от {name}…',
  'round.1.title': 'Раунд 1 — Опиши',
  'round.1.rule': 'Говорите что угодно, кроме самого имени. Без пропусков.',
  'round.2.title': 'Раунд 2 — Два слова',
  'round.2.rule': 'Описывайте максимум 2 словами. Без пропусков.',
  'round.3.title': 'Раунд 3 — Покажи',
  'round.3.rule': 'Только пантомима — совсем без слов. Без пропусков.',

  'play.yourWord': 'Ваше слово',
  'play.gotIt': '✓ Угадали!',
  'play.noSkip': 'Без пропусков — продолжайте, пока не угадают.',
  'play.givingClues': '{name} объясняет',
  'play.namesLeft': '{count} имён осталось',
  'play.left': '{count} осталось',

  'over.win': 'Команда {team} побеждает! 🏆',
  'over.tie': 'Ничья!',
  'over.playAgain': 'Играть снова',
  'over.waitingRestart': 'Ожидание перезапуска от ведущего…',
}

export const translations: Record<Lang, Dict> = { ro, ru, en }

export function translate(
  lang: Lang,
  key: string,
  vars?: Record<string, string | number>
): string {
  let s = translations[lang]?.[key] ?? translations[DEFAULT_LANG][key] ?? key
  if (vars) {
    for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v))
  }
  return s
}
