# Laboratorio matematico offline

Node.js 24, moduli standard, nessuna dipendenza npm. La pagina pubblica non
importa questi file. Il gioco continua a usare `script.js` e `data.js`.

## Confine fra segreto e osservazioni

`engine.mjs` custodisce il codice vero in una closure ed espone solo `submit`.
Il risultato contiene `{attempt, feedback, won, terminal}`. Il feedback Criptico
contiene stato e testo dell'indizio: **non** contiene cifra o posizione selezionata,
maschera delle conferme o cache. Il codice rivelato nell'epilogo di sconfitta non
viene usato per calcolare i candidati residui.

`solver.mjs` non importa il motore. Riceve solo configurazione pubblica, un proprio
seed e le osservazioni, il cui schema rifiuta campi extra. Ogni codice candidato
determina un proprio stato ipotetico, ricostruibile dalla storia. Questo non è
accesso allo stato del codice vero. I test confrontano il posterior con un oracolo
indipendente che enumera anche tutte le assegnazioni di cache nei casi piccoli.

Il confine è architetturale e verificato dai test, non un sandbox contro codice
malevolo. Anche il gioco pubblico è interamente client-side: DevTools può leggere
il suo stato. Il solver fornito non lo fa.

## File

| File | Responsabilità |
| --- | --- |
| `catalog.mjs` | Configurazioni e catalogo pubblico ricavati da `data.js` |
| `random.mjs` | Seed FNV-1a e PRNG Mulberry32 riproducibile |
| `core.mjs` | Spazi 10Pk, codici a 4 bit/cifra, valutazione e codec del feedback |
| `engine.mjs` | Partita con segreto privato, validazione e sette tentativi |
| `belief.mjs` | Filtraggio esatto, likelihood e stato ipotetico per codice |
| `solver.mjs` | Quattro strategie e valutazione limitata delle mosse |
| `simulate.mjs` | CLI, separazione dei flussi casuali, budget e tracce |
| `statistics.mjs` | Distribuzioni e intervalli di Wilson al 95% |
| `compare.mjs` | Confronti appaiati e correzione per confronti multipli |
| `verify.mjs` | Integrità delle tracce, feedback indipendente e replay stratificato |
| `openings.mjs` | Analisi esatta del primo feedback e limiti combinatori |

## Strategie e limiti

- `random`: ipotesi valide uniformi senza ripetere interi tentativi; ignora gli indizi.
- `elimination`: scelta uniforme fra tutti i codici ancora compatibili.
- `expected`: minimizza una stima del numero atteso di codici compatibili dopo la risposta.
- `information`: massimizza una stima di `H(risposta) − E[H(risposta | codice)]`.

Le ultime due usano al massimo **48 proposte × 256 codici ipotetici per mossa**
nel campione principale. Tre quarti delle proposte provengono dai candidati
(incluso un massimo del posterior); le altre dallo spazio legale. Nessuna proposta
già tentata viene riutilizzata. Al settimo turno scelgono un massimo del posterior
esatto, perché informazione che arriva dopo l'ultima possibilità non aiuta a vincere.

Evitare query già tentate è una scelta di queste politiche. Il gioco le ammette:
nel Criptico una ripetizione dopo un hit può rivelare un'altra cifra. Questa
possibilità non è esplorata dal solver attuale e limita l'ottimizzazione.

Il campione usato per valutare una mossa è uniforme senza rimpiazzo nel supporto,
poi pesato con le likelihood esatte e rinormalizzato nel campione. La valutazione
è esatta se il campione copre l'intero supporto, altrimenti è un'approssimazione
con possibile errore e bias da rinormalizzazione. Non vengono campionati o
eliminati approssimativamente i candidati nel filtraggio. Non si inserisce mai il
codice vero nel campione del solver. `expectedRemaining` è un proxy campionato
di supporto, non il numero effettivo di candidati misurato dopo una risposta.

Limiti API: lunghezza massima 7, alfabeto massimo 10, 604.800 codici; campioni
massimi 512 proposte, 8.192 ipotesi e 1.048.576 coppie per mossa. Non viene allocata
una matrice di tutte le coppie di codici. Lo spazio a sette cifre occupa 3.628.800
byte; il belief Criptico usa 14.515.200 byte di array, oltre agli oggetti e al runtime.

## Riprodurre il campione principale

Eseguire dalla radice del repository e scegliere prefissi di output nuovi.
Le tre esecuzioni possono essere lanciate separatamente; lo studio le ha eseguite
in parallelo, con un limite complessivo dichiarato di tre processi (384 MiB ciascuno).

```bash
node --max-old-space-size=256 analysis/simulate.mjs --games 1000 --levels 1,4,7 --seed ctc-2026-10-12-confirmatory-v1 --max-seconds 1200 --max-memory-mb 384 --out /tmp/ctc-length4
```

```bash
node --max-old-space-size=256 analysis/simulate.mjs --games 1000 --levels 2,5,8 --seed ctc-2026-10-12-confirmatory-v1 --max-seconds 1200 --max-memory-mb 384 --out /tmp/ctc-length5
```

```bash
node --max-old-space-size=256 analysis/simulate.mjs --games 1000 --levels 3,6,9 --seed ctc-2026-10-12-confirmatory-v1 --max-seconds 1200 --max-memory-mb 384 --out /tmp/ctc-length7
```

```bash
node analysis/compare.mjs --out /tmp/ctc-comparison.json /tmp/ctc-length4 /tmp/ctc-length5 /tmp/ctc-length7
```

Su Windows sostituire `/tmp/ctc-...` con un percorso locale nuovo, per esempio
`./ctc-length4`. Ogni comando è indipendente ed è su una sola riga.

Ogni prefisso produce `.json` (metadati, hash sorgenti, riepiloghi) e `.jsonl`
(una riga per partita). Le tracce archiviate nel repository sono compresse in
`.jsonl.gz`; `compare.mjs` legge entrambi i formati. Gli hash dei sorgenti, il seed,
le opzioni e le singole osservazioni consentono il controllo dell'esperimento.
Tempi, consumo di CPU e RSS dipendono dalla macchina e non sono bit-per-bit
riproducibili; codice, indizi, mosse e statistiche di esito lo sono.

`results/source-v1.json.gz` conserva testo e SHA-256 dei dieci sorgenti esatti
della raccolta. Il wrapper finale aggiunge soltanto la protezione dalle collisioni
con manifest/tracce compressi già esistenti; modello e politiche sono identici.
Gli hash del manifest descrivono i sorgenti raccolti, mentre `baseCommit` indica
il commit di partenza del checkout, prima dell'aggiunta del laboratorio.

La prima traccia a quattro cifre era incompleta: il controllo ha rilevato 21 righe
mancanti, sospeso la pubblicazione e richiesto un replay integrale di 12.000
partite. Le 11.979 righe disponibili e tutti i riepiloghi statistici coincidono
con il replay. `results/recovery.json` documenta la promozione del run validato;
`collection-incident-v1.json.gz` conserva l'evidenza originale invalidata. Il
manifest a quattro cifre mantiene il prefisso effettivamente usato nel replay,
anche se i file finali si chiamano `length4.*`. La causa della sostituzione della
traccia non è accertata. `artifacts.json` registra i digest finali.

Il budget di tempo e RSS viene controllato fra le partite: può essere superato
per la durata/memoria di una singola partita. Se scatta, il manifest termina
`incomplete` e i dati parziali restano visibili; il comparatore li rifiuta. Nessun
timeout viene trasformato in una sconfitta e nessuna politica viene ridotta in corsa.
Il limite V8 `--max-old-space-size` riguarda l'heap e non tutti i buffer; il budget
RSS include anche questi ultimi. Un'interruzione esterna brusca può lasciare
`running`, che è ugualmente inadmissibile per il confronto finale.

Il seed del codice dipende da seed principale, lunghezza e indice partita: le
politiche e le modalità a pari lunghezza affrontano gli stessi segreti. Gli indizi
usano un flusso sequenziale separato e comune fra politiche: quando cambiano ordine
o cifre selezionate non sono necessariamente uguali le assegnazioni cifra→indizio.
Ogni solver ha un proprio flusso casuale, separato dal motore. Sono PRNG da
simulazione, senza garanzia crittografica.

## Verificare

```bash
node --check data.js
node --check script.js
node test/validate-data.mjs
node --test
node analysis/verify.mjs
```

I test includono generazione/parità con il prodotto, tutti gli indizi, likelihood
su mondi piccoli esaustivi, seed, confine osservabile, sette tentativi, regressioni
di interfaccia/stato e formule statistiche. Lo smoke Chrome reale vive separatamente
in `tools/browser-smoke.mjs` e viene eseguito dalla CI quando Chrome è disponibile.

`verify.mjs` legge in streaming le tre tracce archiviate, controlla ogni feedback
pubblico con una valutazione indipendente, ricalcola tutti i riepiloghi ed esegue
108 replay stratificati (trial 0, 499, 999 per cella). Richiede i dieci hash dei
sorgenti dell'archivio; non esegue il codice contenuto nello snapshot. I limiti
sono 9 prefissi, 10.000 partite per cella, 360.000 righe complessive, 256 MiB
decompressi per traccia e 64 KiB per riga. Il comando predefinito verifica
specificamente i dati pubblicati di questo studio. Per altri esperimenti si
possono fornire prefissi e uno snapshot dei sorgenti corrispondente con
`--snapshot`; `--no-replay` limita il controllo a integrità, feedback e riepiloghi,
ma la CI mantiene il replay abilitato.
