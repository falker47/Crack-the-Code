# Crack the Code: La Sfida del Codemaster

![Crack the Code](crack-the-code.webp)

Puzzle game browser-based ispirato a **Mastermind**: devi ricostruire un codice numerico segreto a cifre uniche sfruttando feedback progressivamente meno espliciti.

**Live demo:** https://falker47.github.io/Crack-the-Code/

## Modalità

### Partita libera

Scegli:

- lunghezza del codice: **4, 5 o 7 cifre**;
- difficoltà: **Facile, Medio o Difficile**;
- hai **7 tentativi** per trovare il codice.

### Campagna

La campagna contiene **9 livelli**, cioè tutte le combinazioni tra le tre lunghezze e le tre difficoltà. I livelli si sbloccano in sequenza e il progresso viene salvato localmente nel browser tramite `localStorage`.

## Feedback

| Difficoltà | Feedback |
| --- | --- |
| **Facile** | Indicatore posizione-per-posizione: cifra corretta, presente altrove o assente |
| **Medio** | Solo conteggi complessivi di hit, presenti fuori posizione e assenti |
| **Difficile** | Un singolo indizio criptico su una cifra rilevata, senza quadro completo del tentativo |

Il **Codemaster** è un personaggio/interfaccia narrativa del gioco: non viene usato alcun modello AI o servizio esterno.

## Regole

- il codice segreto usa cifre **tutte diverse**;
- anche ogni tentativo deve usare cifre diverse;
- verde = cifra corretta nella posizione corretta;
- giallo = cifra presente ma in posizione diversa;
- bianco = cifra assente;
- la **Clue Bar** permette di segnare manualmente cifre escluse o confermate;
- in Facile le cifre sicuramente assenti vengono escluse automaticamente.

## Scope corrente

Il progetto è considerato un gioco single-player completo nel suo scope attuale: **Partita libera + campagna locale da 9 livelli**.

Multiplayer, leaderboard, effetti sonori o altre espansioni possono essere valutati in futuro, ma non fanno parte della release corrente e non sono mantenuti come backlog pubblico nel README.

## Avvio locale

Non ci sono dipendenze runtime o build step.

```bash
git clone https://github.com/falker47/Crack-the-Code.git
cd Crack-the-Code
python -m http.server
```

Poi apri `http://localhost:8000`.

## Verifica

La CI controlla la sintassi JavaScript e la coerenza dei dati della campagna:

```bash
node --check data.js
node --check script.js
node test/validate-data.mjs
```

## Struttura

```
├── index.html
├── style.css
├── script.js
├── data.js
├── crack-the-code.webp
└── test/
    └── validate-data.mjs
```

## Implementazione

- HTML5
- CSS3
- JavaScript Vanilla
- `localStorage` per il progresso campagna
- nessun backend e nessuna dipendenza runtime

## Autore

**Maurizio Falconi** — [falker47](https://github.com/falker47)

[Portfolio](https://falker47.github.io/Nexus-portfolio/)
