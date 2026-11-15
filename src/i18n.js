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
      equity: 'View the equity curve',
      portal: 'Enter the portal',
    },
    welcomeTitle: 'Notice board',
    welcomeLead: (n) => `Welcome to <b>${n}</b>'s dungeon, traveller.`,
    welcomeBody: 'Every room holds a piece of my trading world. Explore, walk up to the glowing objects and interact.',
    welcomeRooms: [
      ['#e0a96d', '◀ Library', 'who I am and how I trade'],
      ['#f5c542', '▲ Treasure Room', 'performance and P&L'],
      ['#b48cff', '▶ Portal Room', 'socials and contacts'],
    ],
    controls: ['move', 'go there', 'interact', 'run', 'menu'],
    aboutTitle: 'About me',
    performanceTitle: 'Performance',
    payoutsTitle: 'Payouts',
    payoutsTotal: 'Total paid out',
    equityTitle: 'Equity curve',
    equityFinal: 'Final balance',
    equityPeak: 'Peak',
    equityDays: 'Days',
    equityAria: 'Equity curve',
    open: 'Open',
    portalTitle: 'Social portal',
    portalBody: 'The portal opens onto all my worlds. Choose where to go:',
    contact: 'Contact',
    menuTitle: 'Menu',
    menuBody: "Don't feel like exploring? Jump straight to it:",
    menuItems: { bio: 'About me', chest: 'Performance', equity: 'Equity curve', portal: 'Socials', welcome: 'Controls' },
    menuHint: 'Tip: pick a button and your character walks you there.',
    close: 'Close',
    sound: 'Sound',
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
      equity: 'Guarda la equity curve',
      portal: 'Entra nel portale',
    },
    welcomeTitle: 'Bacheca',
    welcomeLead: (n) => `Benvenuto nel dungeon di <b>${n}</b>, viandante.`,
    welcomeBody: 'Ogni stanza custodisce un pezzo del mio mondo da trader. Esplora, avvicinati agli oggetti che brillano e interagisci.',
    welcomeRooms: [
      ['#e0a96d', '◀ Biblioteca', 'chi sono e come opero'],
      ['#f5c542', '▲ Sala del Tesoro', 'performance e P&L'],
      ['#b48cff', '▶ Sala dei Portali', 'social e contatti'],
    ],
    controls: ['muoviti', 'vai lì', 'interagisci', 'corri', 'menu'],
    aboutTitle: 'Chi sono',
    performanceTitle: 'Performance',
    payoutsTitle: 'Payout',
    payoutsTotal: 'Totale ricevuto',
    equityTitle: 'Equity curve',
    equityFinal: 'Saldo finale',
    equityPeak: 'Picco',
    equityDays: 'Giorni',
    equityAria: 'Curva di equity',
    open: 'Apri',
    portalTitle: 'Portale dei social',
    portalBody: 'Il portale si apre su tutti i miei mondi. Scegli dove andare:',
    contact: 'Contatti',
    menuTitle: 'Menu',
    menuBody: 'Non hai voglia di esplorare? Vai dritto al punto:',
    menuItems: { bio: 'Chi sono', chest: 'Performance', equity: 'Equity curve', portal: 'Social', welcome: 'Comandi' },
    menuHint: 'Suggerimento: scegli un pulsante e il tuo personaggio ti ci porta.',
    close: 'Chiudi',
    sound: 'Audio',
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
