# vkeq dungeon: development, admin and hosting notes

Sito personale in stile **mini-game**: un dungeon 3D voxel/pixel-art (Three.js) in cui il visitatore
muove un piccolo trader tra le stanze. Ogni stanza mostra un pezzo del mio mondo.

| Stanza | Oggetto | Contenuto |
| --- | --- | --- |
| Sala d'Ingresso | Bacheca, barili, casse | Benvenuto + comandi, aneddoti su petrolio e futures |
| Biblioteca | Leggio, scaffali, PC | Chi sono, citazioni di trading, aneddoti sui mercati |
| Sala del Tesoro | Forziere, oro | Statistiche, equity curve, payout, aneddoti sull'oro |
| Sala dei Portali | Portale, loghi 3D | Link ai social |

## Modificare i contenuti (pannello admin)

Tutti i testi, i numeri e i link stanno in `src/content.json` e si modificano dal pannello admin
(payout, statistiche, social, bio, equity curve), senza toccare il codice.

- **Dal sito**: lucchetto in basso a destra → password admin → si apre il pannello.
- **Prima volta** (per creare la password): apri `https://vkeq.trade/admin.html`, accedi con un token GitHub
  *fine-grained* (permesso *Contents: Read and write* solo su questo repository), poi menu **⋮ → Imposta password**.
  Il token viene salvato nel repo solo cifrato con la password (`public/admin-key.json`, AES-GCM + PBKDF2):
  usa una password lunga e unica. Se il token scade, rifai questo passaggio con un token nuovo.
- **Pubblica** fa un commit di `src/content.json`: GitHub Pages ricostruisce il sito in 1-2 minuti.
- **Anteprima** apre il dungeon con le modifiche prima di pubblicarle.
- **In locale** (`npm run dev`): `http://localhost:5173/admin.html` non chiede login e **Salva** scrive il file su disco.

## Sviluppo

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # sito statico in dist/
```

## Pubblicazione (GitHub Pages)

Il sito si pubblica da solo con GitHub Actions (`.github/workflows/deploy.yml`) a ogni push su `main`,
compresi i salvataggi fatti con **Pubblica** dal pannello admin.

Il dominio è **vkeq.trade** (file `public/CNAME`; con il CNAME la build usa il percorso `/`).

Da fare una volta sola:
1. GitHub → *Settings → Pages → Build and deployment → Source: **GitHub Actions***.
2. Namecheap → *Domain List → vkeq.trade → Manage → Advanced DNS*: elimina i record di parcheggio
   e aggiungi
   - 4 record **A**, host `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - 1 record **CNAME**, host `www`, valore `vkeq.github.io.`
3. GitHub → *Settings → Pages → Custom domain*: `vkeq.trade` → Save, poi spunta **Enforce HTTPS**
   quando diventa disponibile (il certificato arriva da solo, di solito in meno di un'ora).

## Comandi di gioco

- **WASD / frecce** muoversi · **Shift** correre
- **Click / tap** sul pavimento per camminare, su un oggetto per raggiungerlo e aprirlo
- **E / Spazio** interagire · **M** menu rapido · **Esc** chiudere
