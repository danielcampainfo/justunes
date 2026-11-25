# JusTunes

Piattaforma di streaming di canzoni in stile vintage (viola e nero), con interfaccia ispirata a SoundCloud e un giradischi a vinile che gira durante la riproduzione. App web installabile (PWA).

> Stato: **codice dell'app con dati segnaposto**. Entità, attributi e diagramma E/R vanno aggiunti dall'autore del progetto (vedi sezioni "Database" e "Diagramma E/R").

## Struttura

```
index.html          pagina unica (routing a hash)
manifest.json       configurazione PWA
sw.js               service worker (app disponibile offline)
css/base.css        palette (variabili), reset, tipografia
css/layout.css      griglia della home: sidebar | contenuto | pannello | player
css/components.css  card, tessere, liste di brani, chip
css/player.css      barra player e schermata giradischi
css/responsive.css  adattamento tablet e telefono
js/main.js          avvio, routing, eventi
js/config.js        file dati e nomi dei campi (da adattare allo schema E/R)
js/data.js          caricamento e accesso ai dati
js/views.js         pagine (home, artisti, playlist, ricerca, libreria)
js/components.js    pezzi di HTML riutilizzabili
js/player.js        riproduzione audio, barra e giradischi
js/utils.js, icons.js, state.js   funzioni di supporto
data/*.json         dati organizzati secondo le entità del database
audio/              file audio dei brani
img/covers/         copertine e foto artisti
```

## Pagine

- **Home** (stile Spotify): sidebar con libreria, tessere rapide, playlist, artisti, elenco brani, pannello informazioni artista, player in basso
- **Artisti** e **dettaglio artista**
- **Playlist** e **dettaglio playlist**
- **Ricerca** (brani, artisti, playlist)
- **Giradischi**: aprendo un brano compare un vinile che gira con la copertina al centro; su telefono la sidebar diventa una barra di tab in basso

## Eseguire in locale

Serve un piccolo server (il browser blocca `fetch` da `file://`):

```
python3 -m http.server 8000
```

poi apri http://localhost:8000

## Pubblicare su GitHub Pages

1. Crea una repository pubblica e carica tutti i file (la cartella `justunes` va alla radice).
2. Repository → **Settings → Pages** → Source: *Deploy from a branch* → branch `main`, cartella `/ (root)`.
3. Dopo qualche minuto l'app è su `https://TUO-UTENTE.github.io/NOME-REPO/`.

## Database (da completare)

I dati stanno in `data/`. Ogni file JSON corrisponde a un'entità. Le chiavi primarie e le chiavi esterne (es. `artista_id`) sono collegate tra loro come nel diagramma E/R. I nomi dei file e dei campi usati dall'app sono raccolti in `CONFIG` all'inizio di `js/app.js`.

_Qui: elenco delle entità con attributi, tipo, chiave, obbligatorio/opzionale._

## Diagramma E/R

_Qui: immagine del diagramma E/R (min. 10 entità, 2 relazioni N:M, 1 generalizzazione, 1 entità debole)._

## Audio

Metti i tuoi brani in `audio/` e indica il percorso nel campo `file` di `data/brani.json` (es. `"audio/mio-brano.mp3"`). La durata viene letta automaticamente dal file (il campo `durata_s` è facoltativo). Se `file` è vuoto o il file manca, l'app simula la riproduzione.

Copertine e foto degli artisti: metti le immagini in `img/covers/` e scrivi il percorso in `copertina` (brano/playlist) o `foto` (artista). Se mancano, viene mostrata una sfumatura con i colori della palette.

Usa solo musica di cui hai i diritti o con licenza libera.

## Uso dell'IA

L'IA è stata usata solo come aiuto sul codice dell'app (dichiarato nel log).


## Copertine automatiche
Per ogni brano (in ordine): campo `copertina` del JSON → immagine incorporata nell'MP3 (ID3) → ricerca iTunes (titolo + artista, serve internet, salvata in cache nel browser) → sfumatura con iniziale.
I brani con artista "Artista da verificare" non vengono cercati online: correggi l'artista in `data/brani.json` / `data/artisti.json`.
