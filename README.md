# vkeq — Il Dungeon del Trader

Sito personale in stile **mini-game**: un dungeon 3D voxel/pixel-art (Three.js) in cui il visitatore
muove un piccolo trader tra le stanze. Ogni stanza mostra un pezzo del mio mondo.

| Stanza | Oggetto | Contenuto |
| --- | --- | --- |
| Sala d'Ingresso | Bacheca | Benvenuto + comandi |
| Biblioteca | Leggio con libro | Chi sono, mercati, stile |
| Sala del Tesoro | Forziere / maxi-schermo | Statistiche, equity curve, payout |
| Sala dei Portali | Portale / cristalli | Link ai social |

## Modificare i contenuti

Tutti i testi, i numeri e i link stanno in **`src/config.js`**: modifica quel file e basta.

## Sviluppo

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # sito statico in dist/
```

`dist/` è un sito statico: si pubblica così com'è su Netlify, Vercel, GitHub Pages o Cloudflare Pages.

## Comandi di gioco

- **WASD / frecce** muoversi · **Shift** correre
- **Click / tap** sul pavimento per camminare, su un oggetto per raggiungerlo e aprirlo
- **E / Spazio** interagire · **M** menu rapido · **Esc** chiudere
