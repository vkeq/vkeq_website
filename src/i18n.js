// Language handling: English is the default, Italian is the only alternative.
const STRINGS = {
  en: {
    introSub: "THE TRADER'S DUNGEON",
    introStart: 'PRESS ENTER TO START',
    introStartTouch: 'TAP TO START',
    introHint: 'WASD / arrows / click to move · E to interact',
    introHintTouch: 'Tap the floor to move · tap objects to interact',
    menu: 'MENU',
    rooms: { entrance: 'Entrance Hall', treasury: 'Treasure Room', bio: 'Library', social: 'Portal Room' },
    labels: {
      welcome: 'WELCOME',
      about: 'ABOUT ME',
      performance: 'PERFORMANCE',
      social: 'SOCIALS',
      toTreasury: '↑ TREASURE',
      toLibrary: '← LIBRARY',
      toPortals: 'PORTALS →',
    },
    prompts: {
      welcome: 'Read the notice board',
      bio: 'Read the book',
      chest: 'Open the chest',
      portal: 'Enter the portal',
      pc: 'Use the trading PC',
      books: 'Browse the books',
      gold: 'Inspect the gold',
      oil: 'Inspect the oil barrels',
      crates: 'Open the crates',
    },
    welcomeTitle: 'Notice board',
    welcomeLead: (n) => `Welcome to <b>${n}</b>'s dungeon, traveller.`,
    welcomeBody: 'Every room holds a piece of my trading world. Walk up to objects and interact: barrels, gold, books and the PC also hide market anecdotes.',
    welcomeRooms: [
      ['#e0a96d', '◀ Library', 'who I am and how I trade'],
      ['#f5c542', '▲ Treasure Room', 'performance and P&L'],
      ['#b48cff', '▶ Portal Room', 'socials and contacts'],
    ],
    controls: ['move', 'go there', 'interact', 'run', 'menu'],
    controlsTouch: ['Tap the floor to walk there', 'Tap an object or the A button to interact', 'MENU jumps straight to any room'],
    aboutTitle: 'About me',
    performanceTitle: 'Performance',
    payoutsTitle: 'Payouts',
    payoutsTotal: 'Total paid out',
    equityAria: 'Equity curve',
    another: 'Another one',
    open: 'Open',
    portalTitle: 'Social portal',
    portalBody: 'The portal opens onto all my worlds. Choose where to go:',
    contact: 'Contact',
    menuTitle: 'Menu',
    menuBody: "Don't feel like exploring? Jump straight to it:",
    menuItems: { bio: 'About me', chest: 'Performance', portal: 'Socials', welcome: 'Notice board' },
    menuHint: 'Tip: pick a button and your character walks you there.',
    close: 'Close',
    music: 'Music',
    effects: 'Sound effects',
    adminTitle: 'Admin access',
    adminBody: 'Enter the admin password to edit payouts, links and the rest of the site.',
    adminPassword: 'Password',
    adminEnter: 'Enter',
    adminChecking: 'Checking…',
    adminWrong: 'Wrong password.',
    adminNotSetup: 'The admin password has not been set yet. Open the admin page and log in with the GitHub token once to create it.',
    adminOpen: 'Open admin page',
    language: 'Language',
  },
  it: {
    introSub: 'IL DUNGEON DEL TRADER',
    introStart: 'PREMI INVIO PER ENTRARE',
    introStartTouch: 'TOCCA PER ENTRARE',
    introHint: 'WASD / frecce / click per muoverti · E per interagire',
    introHintTouch: 'Tocca il pavimento per muoverti · tocca gli oggetti per interagire',
    menu: 'MENU',
    rooms: { entrance: "Sala d'Ingresso", treasury: 'Sala del Tesoro', bio: 'Biblioteca', social: 'Sala dei Portali' },
    labels: {
      welcome: 'BENVENUTO',
      about: 'CHI SONO',
      performance: 'PERFORMANCE',
      social: 'SOCIAL',
      toTreasury: '↑ TESORO',
      toLibrary: '← BIBLIOTECA',
      toPortals: 'PORTALI →',
    },
    prompts: {
      welcome: 'Leggi la bacheca',
      bio: 'Leggi il libro',
      chest: 'Apri il forziere',
      portal: 'Entra nel portale',
      pc: 'Usa il PC di trading',
      books: 'Sfoglia i libri',
      gold: "Esamina l'oro",
      oil: 'Esamina i barili di petrolio',
      crates: 'Apri le casse',
    },
    welcomeTitle: 'Bacheca',
    welcomeLead: (n) => `Benvenuto nel dungeon di <b>${n}</b>, viandante.`,
    welcomeBody: 'Ogni stanza custodisce un pezzo del mio mondo da trader. Avvicinati agli oggetti e interagisci: barili, oro, libri e PC nascondono anche aneddoti sui mercati.',
    welcomeRooms: [
      ['#e0a96d', '◀ Biblioteca', 'chi sono e come opero'],
      ['#f5c542', '▲ Sala del Tesoro', 'performance e P&L'],
      ['#b48cff', '▶ Sala dei Portali', 'social e contatti'],
    ],
    controls: ['muoviti', 'vai lì', 'interagisci', 'corri', 'menu'],
    controlsTouch: ['Tocca il pavimento per camminare', 'Tocca un oggetto o il tasto A per interagire', 'MENU ti porta subito in ogni stanza'],
    aboutTitle: 'Chi sono',
    performanceTitle: 'Performance',
    payoutsTitle: 'Payout',
    payoutsTotal: 'Totale ricevuto',
    equityAria: 'Curva di equity',
    another: 'Un altro',
    open: 'Apri',
    portalTitle: 'Portale dei social',
    portalBody: 'Il portale si apre su tutti i miei mondi. Scegli dove andare:',
    contact: 'Contatti',
    menuTitle: 'Menu',
    menuBody: 'Non hai voglia di esplorare? Vai dritto al punto:',
    menuItems: { bio: 'Chi sono', chest: 'Performance', portal: 'Social', welcome: 'Bacheca' },
    menuHint: 'Suggerimento: scegli un pulsante e il tuo personaggio ti ci porta.',
    close: 'Chiudi',
    music: 'Musica',
    effects: 'Effetti sonori',
    adminTitle: 'Accesso admin',
    adminBody: 'Inserisci la password admin per modificare payout, link e il resto del sito.',
    adminPassword: 'Password',
    adminEnter: 'Entra',
    adminChecking: 'Controllo…',
    adminWrong: 'Password sbagliata.',
    adminNotSetup: "La password admin non è ancora stata impostata. Apri la pagina admin e accedi una volta con il token GitHub per crearla.",
    adminOpen: 'Apri la pagina admin',
    language: 'Lingua',
  },
};

export const LANGS = ['en', 'it'];
let lang = 'en';
try {
  const saved = localStorage.getItem('vkeq-lang');
  if (LANGS.includes(saved)) lang = saved;
} catch {}
const url = new URLSearchParams(location.search).get('lang');
if (LANGS.includes(url)) lang = url;
document.documentElement.lang = lang;

const listeners = new Set();

export function getLang() {
  return lang;
}

export function setLang(l) {
  if (!LANGS.includes(l) || l === lang) return;
  lang = l;
  document.documentElement.lang = l;
  try {
    localStorage.setItem('vkeq-lang', l);
  } catch {}
  listeners.forEach((fn) => fn(l));
}

export function onLangChange(fn) {
  listeners.add(fn);
}

// UI string
export function t(key) {
  return key.split('.').reduce((o, k) => o?.[k], STRINGS[lang]) ?? key;
}

// Content field: either a plain value or { en, it }
export function tr(v) {
  if (v && typeof v === 'object' && !Array.isArray(v) && ('en' in v || 'it' in v)) return v[lang] ?? v.en ?? v.it;
  return v;
}

export function locale() {
  return lang === 'it' ? 'it-IT' : 'en-US';
}
