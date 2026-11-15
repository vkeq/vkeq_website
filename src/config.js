// ============================================================
//  CONTENUTI DEL SITO — modifica qui testi, numeri e link.
//  Tutto quello che vedi nel dungeon viene letto da questo file.
// ============================================================

export const CONFIG = {
  name: 'vkeq',
  tagline: 'Day Trader · Futures & Indici',

  // ---------- Biblioteca (Chi sono) ----------
  bio: {
    title: 'Chi sono',
    avatarInitial: 'V',
    paragraphs: [
      "Ciao, sono vkeq. Faccio day trading a tempo pieno: entro ed esco dal mercato nella stessa giornata, senza posizioni overnight.",
      "Ho iniziato come tanti, bruciando conti e cercando il setup perfetto. Poi ho capito che il vantaggio vero sta nella disciplina: poche regole, rispettate sempre.",
      "Qui condivido il mio percorso, i numeri reali e cosa ho imparato. Benvenuto nel mio dungeon: esplora le stanze per scoprire tutto.",
    ],
    facts: [
      { label: 'Mercati', value: 'NQ · ES · DAX' },
      { label: 'Stile', value: 'Intraday / Scalping' },
      { label: 'Sessione', value: 'Apertura New York' },
      { label: 'Esperienza', value: '5+ anni' },
      { label: 'Piattaforma', value: 'TradingView' },
      { label: 'Regola n.1', value: 'Mai rischiare più dell’1% per trade' },
    ],
  },

  // ---------- Sala del Tesoro (Performance / P&L) ----------
  performance: {
    title: 'Performance',
    period: 'Gen 2025 – Ott 2025',
    stats: [
      { label: 'P&L netto', value: '+$48.250', good: true },
      { label: 'Win rate', value: '58%' },
      { label: 'Profit factor', value: '1,92' },
      { label: 'Max drawdown', value: '-6,4%', bad: true },
      { label: 'Trade totali', value: '412' },
      { label: 'Payout ricevuti', value: '9' },
    ],
    // Curva di equity (saldo cumulativo, in $). Sostituisci con i tuoi dati.
    equity: [
      0, 420, 310, 890, 1250, 1100, 1740, 2300, 2050, 2900, 3600, 3350, 4100, 4950, 4700,
      5600, 6400, 6100, 7300, 8200, 7900, 9100, 10400, 9800, 11200, 12600, 12100, 13900,
      15200, 14600, 16800, 18300, 17500, 19900, 21800, 21000, 23600, 25400, 24200, 27000,
      29300, 28100, 31200, 33800, 32500, 35900, 38400, 37100, 40600, 43200, 41800, 45100,
      46900, 48250,
    ],
    payouts: [
      { firm: 'Prop Firm #1', amount: '$3.200', date: 'Mar 2025' },
      { firm: 'Prop Firm #2', amount: '$5.750', date: 'Mag 2025' },
      { firm: 'Prop Firm #1', amount: '$4.100', date: 'Lug 2025' },
      { firm: 'Prop Firm #3', amount: '$7.900', date: 'Set 2025' },
    ],
    disclaimer:
      'I risultati passati non garantiscono risultati futuri. Niente di quanto pubblicato è consulenza finanziaria. Il trading comporta un rischio elevato di perdita del capitale.',
  },

  // ---------- Sala dei Portali (Social / contatti) ----------
  socials: [
    { id: 'youtube', label: 'YouTube', handle: '@vkeq', url: 'https://youtube.com/@vkeq', color: '#ff4040', desc: 'Recap delle sessioni e live trading.' },
    { id: 'instagram', label: 'Instagram', handle: '@vkeq', url: 'https://instagram.com/vkeq', color: '#e1306c', desc: 'Dietro le quinte e risultati giornalieri.' },
    { id: 'x', label: 'X / Twitter', handle: '@vkeq', url: 'https://x.com/vkeq', color: '#e8e8f0', desc: 'Idee di trading e pensieri sul mercato.' },
    { id: 'discord', label: 'Discord', handle: 'vkeq community', url: 'https://discord.gg/', color: '#5865f2', desc: 'La community: si fa trading insieme.' },
    { id: 'tradingview', label: 'TradingView', handle: 'vkeq', url: 'https://tradingview.com/u/vkeq/', color: '#2ec4ff', desc: 'I miei grafici e le idee pubblicate.' },
  ],
  contactEmail: 'contatti@vkeq.com',
};
