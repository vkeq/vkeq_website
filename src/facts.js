// Random market anecdotes shown by interactive objects around the dungeon.
// Each category: title + list of { en, it }.

export const FACTS = {
  trading: {
    title: { en: 'Trading terminal', it: 'Terminale di trading' },
    icon: '💻',
    items: [
      { en: 'The CME launched E-mini S&P 500 futures (ES) in 1997 and E-mini Nasdaq-100 futures (NQ) in 1999, opening index futures to smaller traders.', it: 'Il CME ha lanciato i futures E-mini S&P 500 (ES) nel 1997 e gli E-mini Nasdaq-100 (NQ) nel 1999, aprendo i futures sugli indici ai trader più piccoli.' },
      { en: 'On 19 October 1987, "Black Monday", the Dow Jones fell 22.6% in a single session: still its worst day in percentage terms.', it: 'Il 19 ottobre 1987, il "Lunedì Nero", il Dow Jones perse il 22,6% in una sola seduta: ancora oggi il suo giorno peggiore in percentuale.' },
      { en: 'During the Flash Crash of 6 May 2010 the Dow dropped almost 1,000 points in minutes, then recovered most of it within the hour.', it: 'Durante il Flash Crash del 6 maggio 2010 il Dow perse quasi 1.000 punti in pochi minuti, recuperandone gran parte entro un\'ora.' },
      { en: 'Candlestick charts come from 18th-century Japan, where they are traditionally credited to the rice trader Munehisa Homma.', it: 'I grafici a candele nascono nel Giappone del XVIII secolo e sono tradizionalmente attribuiti al mercante di riso Munehisa Homma.' },
      { en: 'The New York Stock Exchange traces back to the Buttonwood Agreement of 1792, signed by 24 brokers on Wall Street.', it: 'La Borsa di New York nasce dal Buttonwood Agreement del 1792, firmato da 24 broker a Wall Street.' },
      { en: 'SPY, launched in January 1993, was the first US-listed ETF. QQQ followed in March 1999.', it: 'SPY, lanciato a gennaio 1993, è stato il primo ETF quotato negli Stati Uniti. QQQ è arrivato a marzo 1999.' },
      { en: 'The CBOE introduced the VIX, the market\'s "fear index", in 1993. It measures the 30-day volatility implied by S&P 500 options.', it: 'Il CBOE ha introdotto il VIX, l\'"indice della paura", nel 1993. Misura la volatilità a 30 giorni implicita nelle opzioni sull\'S&P 500.' },
      { en: 'The Chicago Board Options Exchange opened in 1973, the same year the Black-Scholes option pricing model was published.', it: 'Il Chicago Board Options Exchange ha aperto nel 1973, lo stesso anno in cui è stato pubblicato il modello di Black-Scholes per prezzare le opzioni.' },
    ],
  },
  gold: {
    title: { en: 'Gold', it: 'Oro' },
    icon: '🪙',
    items: [
      { en: 'All the gold ever mined, roughly 210,000 tonnes, would fit in a cube about 22 metres on each side.', it: 'Tutto l\'oro mai estratto, circa 210.000 tonnellate, starebbe in un cubo di circa 22 metri di lato.' },
      { en: 'On 15 August 1971 President Nixon suspended the dollar\'s convertibility into gold, ending the Bretton Woods system.', it: 'Il 15 agosto 1971 il presidente Nixon sospese la convertibilità del dollaro in oro, mettendo fine al sistema di Bretton Woods.' },
      { en: 'With Executive Order 6102 in 1933, Americans were required to hand most of their gold coins and bullion to the Federal Reserve.', it: 'Con l\'Executive Order 6102 del 1933, gli americani furono obbligati a consegnare alla Federal Reserve gran parte delle monete e dei lingotti d\'oro.' },
      { en: 'A COMEX gold futures contract (GC) covers 100 troy ounces. A troy ounce is 31.1 grams, heavier than a regular ounce (28.35 g).', it: 'Un contratto futures sull\'oro del COMEX (GC) vale 100 once troy. Un\'oncia troy pesa 31,1 grammi, più di un\'oncia normale (28,35 g).' },
      { en: 'Gold is so malleable that a single gram can be beaten into a sheet of about one square metre.', it: 'L\'oro è così malleabile che un solo grammo può essere battuto fino a formare un foglio di circa un metro quadrato.' },
      { en: 'The United States holds the largest official gold reserve in the world: a little over 8,100 tonnes.', it: 'Gli Stati Uniti hanno la riserva d\'oro ufficiale più grande del mondo: poco più di 8.100 tonnellate.' },
    ],
  },
  oil: {
    title: { en: 'Oil barrels', it: 'Barili di petrolio' },
    icon: '🛢️',
    items: [
      { en: 'An oil barrel holds 42 US gallons (about 159 litres), a size fixed by Pennsylvania producers in the 1860s.', it: 'Un barile di petrolio contiene 42 galloni USA (circa 159 litri), misura fissata dai produttori della Pennsylvania negli anni 1860.' },
      { en: 'On 20 April 2020 the May WTI futures contract settled at -$37.63: for the first time, sellers paid buyers to take the oil.', it: 'Il 20 aprile 2020 il future WTI di maggio chiuse a -37,63 $: per la prima volta i venditori pagavano chi comprava il petrolio.' },
      { en: 'One NYMEX crude oil futures contract (CL) is 1,000 barrels, delivered in Cushing, Oklahoma, the "pipeline crossroads of the world".', it: 'Un contratto futures sul greggio del NYMEX (CL) vale 1.000 barili, consegnati a Cushing, in Oklahoma, "l\'incrocio degli oleodotti del mondo".' },
      { en: 'Brent crude takes its name from the Brent field in the North Sea, which Shell named after the brent goose.', it: 'Il greggio Brent prende il nome dal giacimento Brent nel Mare del Nord, che Shell chiamò come l\'oca colombaccio (brent goose).' },
      { en: 'The 1973 oil embargo roughly quadrupled the price of crude, from about $3 to about $12 a barrel.', it: 'L\'embargo petrolifero del 1973 quadruplicò circa il prezzo del greggio, da circa 3 $ a circa 12 $ al barile.' },
      { en: 'In July 2008 crude oil hit a record of about $147 a barrel, just months before the financial crisis sent it below $40.', it: 'A luglio 2008 il greggio toccò il record di circa 147 $ al barile, pochi mesi prima che la crisi finanziaria lo portasse sotto i 40 $.' },
    ],
  },
  futures: {
    title: { en: 'Futures & options', it: 'Futures e opzioni' },
    icon: '📦',
    items: [
      { en: 'The Dojima Rice Exchange in Osaka, officially recognised in 1730, is considered the first organised futures market.', it: 'Il Dojima Rice Exchange di Osaka, riconosciuto ufficialmente nel 1730, è considerato il primo mercato futures organizzato.' },
      { en: 'The Chicago Board of Trade was founded in 1848 to bring order to the grain trade of the Midwest.', it: 'Il Chicago Board of Trade fu fondato nel 1848 per mettere ordine nel commercio di cereali del Midwest.' },
      { en: 'Aristotle tells how Thales of Miletus paid in advance for the right to use olive presses, then profited from a big harvest: an early option.', it: 'Aristotele racconta che Talete di Mileto pagò in anticipo il diritto di usare i frantoi e guadagnò grazie a un raccolto abbondante: una delle prime opzioni.' },
      { en: 'Micro E-mini futures (MES, MNQ) launched in May 2019 at one tenth the size of the classic E-mini contracts.', it: 'I futures Micro E-mini (MES, MNQ) sono nati a maggio 2019, grandi un decimo dei classici contratti E-mini.' },
      { en: '"Triple witching" is the third Friday of March, June, September and December, when stock index futures, index options and stock options expire together.', it: 'Il "triple witching" è il terzo venerdì di marzo, giugno, settembre e dicembre, quando scadono insieme futures sugli indici, opzioni sugli indici e opzioni sulle azioni.' },
    ],
  },
  books: {
    title: { en: 'Old trading books', it: 'Vecchi libri di trading' },
    icon: '📚',
    items: [
      { en: '"Be fearful when others are greedy, and greedy when others are fearful." Warren Buffett, 1986 letter to shareholders.', it: '"Abbi paura quando gli altri sono avidi, e sii avido quando gli altri hanno paura." Warren Buffett, lettera agli azionisti del 1986.' },
      { en: '"The market can remain irrational longer than you can remain solvent." Often attributed to John Maynard Keynes.', it: '"Il mercato può restare irrazionale più a lungo di quanto tu possa restare solvibile." Frase spesso attribuita a John Maynard Keynes.' },
      { en: '"Cut your losses short and let your winners run." One of the oldest rules in trading.', it: '"Taglia le perdite e lascia correre i profitti." Una delle regole più antiche del trading.' },
      { en: '"It\'s not whether you\'re right or wrong, but how much money you make when you\'re right and how much you lose when you\'re wrong." George Soros.', it: '"Non conta se hai ragione o torto, ma quanto guadagni quando hai ragione e quanto perdi quando hai torto." George Soros.' },
      { en: '"Plan your trade and trade your plan." A classic trading-floor saying.', it: '"Pianifica il trade e segui il piano." Un classico detto dei floor di trading.' },
      { en: '"The trend is your friend, until the end when it bends." Wall Street proverb.', it: '"Il trend è tuo amico, finché non gira." Proverbio di Wall Street.' },
    ],
  },
};

const last = {};
// Random item, never the same one twice in a row.
export function randomFact(cat) {
  const list = FACTS[cat].items;
  let i = Math.floor(Math.random() * list.length);
  if (list.length > 1 && i === last[cat]) i = (i + 1) % list.length;
  last[cat] = i;
  return list[i];
}
