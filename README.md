# vkeq — Il Dungeon del Trader

Sito personale in stile **mini-game**: un dungeon 3D voxel/pixel-art (Three.js) in cui il visitatore
muove un piccolo trader tra le stanze. Ogni stanza mostra un pezzo del mio mondo.

| Stanza | Oggetto | Contenuto |
| --- | --- | --- |
| Sala d'Ingresso | Bacheca, barili, casse | Benvenuto + comandi, aneddoti su petrolio e futures |
| Biblioteca | Leggio, scaffali, PC | Chi sono, citazioni di trading, aneddoti sui mercati |
| Sala del Tesoro | Forziere, oro | Statistiche, equity curve, payout, aneddoti sull'oro |
| Sala dei Portali | Portale, loghi 3D | Link ai social |

## Modificare i contenuti (pannello admin)

Tutti i testi, i numeri e i link stanno in `src/content.json` e si modificano da **`/admin.html`**
(payout, statistiche, social, bio, equity curve), senza toccare il codice.

- **In locale** (`npm run dev`): apri `http://localhost:5173/admin.html`, modifica e premi **Salva**.
- **Sul sito online**: apri `https://<tuo-dominio>/admin.html` e accedi con un token GitHub
  (fine-grained, permesso *Contents: Read and write* solo su questo repository).
  **Pubblica** fa un commit di `src/content.json`; Vercel/Netlify ricostruiscono il sito in 1-2 minuti.
  Il token resta solo nel tuo browser: senza token nessuno può modificare il sito.
- **Anteprima** apre il dungeon con le modifiche prima di pubblicarle.

## Sviluppo

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # sito statico in dist/
```

## Pubblicazione (GitHub Pages)

Il sito si pubblica da solo con GitHub Actions (`.github/workflows/deploy.yml`) a ogni push su `main`,
compresi i salvataggi fatti con **Pubblica** dal pannello admin.

Da fare una volta sola: *Settings → Pages → Build and deployment → Source: **GitHub Actions***.
Il sito sarà su `https://vkeq.github.io/vkeq_website/`.

Dominio personale: aggiungi il file `public/CNAME` con il dominio (es. `vkeq.com`) e configura il DNS
come indicato da GitHub; la build passa da sola al percorso `/`.

## Comandi di gioco

- **WASD / frecce** muoversi · **Shift** correre
- **Click / tap** sul pavimento per camminare, su un oggetto per raggiungerlo e aprirlo
- **E / Spazio** interagire · **M** menu rapido · **Esc** chiudere
