# Crack the Code — analisi matematica e bilanciamento

**Data dello studio:** 12 ottobre 2026. **Baseline verificata live:** `main` al commit
`b8959e247b8a44217d470cc6bfd9c6d01be2b42a`. Sviluppo sul branch
`analysis/mathematical-solver-balance`.

## Esito

Il laboratorio offline riproduce le nove configurazioni effettive, filtra
esattamente i codici compatibili e confronta quattro politiche con casualità
riproducibile. Il campione principale comprende **36.000 partite: 1.000 per
ciascuna delle 36 coppie configurazione/strategia**. I numeri descrivono i solver
qui specificati; non esiste una probabilità unica del «giocatore razionale» senza
definire strategia, conoscenze e risorse.

La progressione ha due punti critici: il passaggio al Sintetico a sette cifre e
il finale Criptico a sette cifre. Il ritorno a quattro cifre nel livello 7 riduce
nettamente la difficoltà misurata rispetto al livello 6. La struttura approvata
può sostenere tre archi di difficoltà, ma i risultati non sostengono una crescita
strettamente monotona dal primo al nono livello.

Una prova distinta dalle simulazioni esclude una garanzia di vittoria in sette
tentativi nel Criptico a cinque e sette cifre. Non dimostra che quelle partite
si vincano soltanto per fortuna, né misura la frequenza dei casi sfavorevoli.
L'abilità ha un effetto misurabile; il budget finito e gli indizi casuali possono
comunque lasciare più codici compatibili quando bisogna scegliere l'ultimo.

## 1. Fonti, ricognizione e regole osservate

Sono stati letti [README](../README.md), [script.js](../script.js), [data.js](../data.js),
il test dati preesistente e la CI, oltre alle
[specifiche editoriali canoniche](https://docs.google.com/document/d/1e97gYlZ-yRZGhjnrtOmEMMaIZ2JSoeUdYDbn13wMte0/edit)
e alle policy operative pertinenti. La missione usa la
[card Trello esistente](https://trello.com/c/SfPsGk8N).
All'avvio il repository remoto aveva il solo branch `main` e nessuna PR aperta
sovrapposta. L'implementazione non assume che la baseline storica sia corrente:
il riferimento è stato verificato sul remoto.

### Regole tecniche

Il generatore mescola tutte le dieci cifre `0..9` con Fisher–Yates, eseguendo nove
scelte casuali, e prende le prime 4, 5 o 7. Lo zero iniziale è ammesso. Codici e
tentativi devono avere cifre distinte. La validazione avviene prima del consumo
del tentativo. Ripetere un intero tentativo valido è permesso dal prodotto.

A ogni posizione, una cifra uguale al segreto è un hit; una cifra presente
altrove è un blow; una cifra assente è un miss. Con cifre distinte non serve la
contabilità delle molteplicità richiesta da altre varianti di Mastermind.
La vittoria viene controllata prima dell'esaurimento dei tentativi: un codice
corretto alla settima mossa vinceva già nella baseline.

| Modalità pubblica | Identificatore | Osservazione fornita |
| --- | --- | --- |
| Completo | `easy` | Per ogni posizione del tentativo: hit, blow o miss |
| Sintetico | `medium` | Conteggio totale di hit, blow e miss; nessuna associazione alle posizioni |
| Criptico | `difficult` | Un solo status hit/blow e una frase, oppure il messaggio senza indizio; selezione e cache dipendono dalla storia |

Tutte le nove combinazioni esistono sia nella campagna sia nella partita libera.
L'ordine della campagna è Completo 4/5/7, Sintetico 4/5/7, Criptico 4/5/7;
sono sempre concessi sette tentativi. I nomi dei livelli derivano direttamente
da `data.js`. La modalità di accesso cambia narrativa e persistenza, non la
matematica della singola configurazione.

### Informazioni pubbliche e segrete

Sono pubblici la configurazione scelta, le regole, i tentativi precedenti,
i feedback, i tentativi rimasti e l'esito di vittoria/sconfitta. La barra degli
indizi contiene annotazioni manuali del giocatore; nel Completo esclude anche
automaticamente le cifre appena osservate come assenti, senza aggiungere
informazione al feedback già ricevuto. Non espone la maschera interna delle
conferme Criptico. Il punteggio dipende anche dal tempo, ma viene mostrato dopo
la vittoria e non aiuta a decifrare prima il codice. Il codice corretto rivelato
nell'epilogo di sconfitta è escluso dal conteggio dei candidati residui.

Sono segreti durante il gioco il codice effettivo, la cifra scelta per l'indizio,
la maschera interna delle cifre già confermate e la cache degli indizi. Il motore
matematico custodisce questi dati in una closure ed espone soltanto `submit`.
Il solver riceve `{attempt, feedback, won, terminal}` e la propria casualità.
Non riceve né legge il motore, il codice vero o il suo seed. Il coordinatore
conosce il segreto per eseguire la partita e lo registra nella traccia soltanto
a partita conclusa, per consentire la verifica a posteriori.

Il codice pubblico è client-side: chi usa DevTools può leggere `gameState` e il
catalogo. Questo non costituisce un ambiente anti-cheat. Il confine verificato
qui riguarda il comportamento del solver fornito; non è un sandbox contro un
programma ostile. Non è emersa una rivelazione automatica del segreto attraverso
il normale feedback prima dell'esito.

## 2. Metodo matematico

### Spazio esatto, prior e casualità

Lo spazio contiene tutte le permutazioni senza ripetizione:

| Cifre | Codici `10!/(10−n)!` | Entropia iniziale |
| ---: | ---: | ---: |
| 4 | 5.040 | 12,299208 bit |
| 5 | 30.240 | 14,884171 bit |
| 7 | 604.800 | 19,206099 bit |

Fisher–Yates produce un prior uniforme se le scelte intere sono uniformi.
L'implementazione non presenta un bias algoritmico identificato. I test
confrontano le estrazioni con il prodotto e verificano esaustivamente piccoli
alfabeti. Non si certifica la qualità statistica o crittografica di `Math.random`
dei browser; il laboratorio usa Mulberry32 con derivazione FNV-1a dei seed,
strumenti riproducibili per simulazione e non per crittografia.

Il filtraggio considera **tutti** i codici dello spazio; non scarta ipotesi per
campionamento. Il calcolo delle probabilità usa virgola mobile, mentre
l'appartenenza al supporto e i predicati di feedback sono discreti.

### Il Criptico è casuale e ha memoria

Per ogni codice ipotetico, il selettore cerca da sinistra il primo hit non ancora
confermato. Se non esiste, cerca da sinistra la prima cifra presente e non
confermata; questa produce un blow. Solo la cifra dell'hit selezionato viene
marcata. Se nessuna cifra è selezionabile, si osserva uno dei due messaggi senza
indizio, secondo l'esistenza di precedenti conferme.

Alla prima selezione di una cifra viene scelta uniformemente una delle frasi
associate; la frase è poi riutilizzata dalla cache. Il catalogo attuale contiene
32 testi distinti e 72 associazioni cifra/frase. Il numero di frasi disponibili
per le cifre `0..9` è `[9,9,8,6,7,7,6,7,6,7]`.

Ogni candidato mantiene il proprio stato ipotetico. La likelihood di una nuova
frase è `1/k_d`; un riuso coerente della cache vale `1`, una contraddizione vale
`0`. La cifra effettivamente scelta non viene svelata al solver. Anche la priorità
da sinistra e l'assenza di vittoria entrano nel filtro: sono conseguenze delle
regole, applicate separatamente a ogni ipotesi.

Le probabilità posteriori non sono in generale uniformi. Per esempio, dopo
`0123`, hit e «È un numero primo.», la probabilità che la cifra selezionata sia 3
è circa 54,33%; uniformando tutti i candidati compatibili sarebbe circa 47,15%.
La derivazione e gli oracoli indipendenti sono nelle
[note matematiche](MATHEMATICAL_NOTES.md) e nei
[test del posterior](../test/analysis/posterior.test.mjs).

Il solver assume di conoscere le regole del selettore e le associazioni del
catalogo pubblico nel repository. Un giocatore che conosce solo la frase
mostrata, e non questi dettagli, dispone operativamente di meno conoscenza.
Questa differenza è essenziale nell'interpretazione delle percentuali.

## 3. Algoritmi confrontati

| Politica | Decisione | Limite interpretativo |
| --- | --- | --- |
| `random` | Codice valido uniforme, senza ripetere interi tentativi; ignora il feedback | Baseline di fortuna, non una strategia di deduzione |
| `elimination` | Codice uniforme nel supporto esatto ancora compatibile | Usa i vincoli, ma non privilegia i candidati con posterior maggiore |
| `expected` | Minimizza una stima del numero atteso di codici compatibili dopo la risposta | Euristica di un turno, con campioni e proxy del supporto |
| `information` | Massimizza una stima dell'informazione mutua tra segreto e risposta | Euristica informativa di un turno; non un ottimo globale su sette turni |

Per l'informazione si usa `H(risposta) − E[H(risposta | codice)]`.
Sottrarre il secondo termine evita di premiare il puro rumore della scelta
casuale della frase. Nel Completo e nel Sintetico quel termine è zero.

Le politiche informative valutano al massimo 48 proposte contro 256 codici
campionati dal supporto. Circa tre quarti delle proposte provengono dai candidati,
includendo un massimo del posterior; le altre sono sonde nello spazio legale.
Il supporto viene campionato uniformemente senza rimpiazzo; i pesi esatti vengono
poi rinormalizzati nel campione. Questa stima può avere errore e bias da
rinormalizzazione. Quando tutto il supporto rientra nel campione, la valutazione
della singola proposta è esatta; la ricerca fra tutte le proposte resta limitata.

Al settimo turno `expected` e `information` scelgono un codice con probabilità
posteriore massima: raccogliere informazione senza poterla più usare non aiuta
l'obiettivo di vincere. Non si effettua una ricerca esaustiva dell'albero delle
strategie. Non si costruisce una matrice di tutte le coppie di codici.

Tutte le politiche dello studio evitano di ripetere interi tentativi. È una
scelta del solver, non una nuova regola del gioco. Nel Criptico ripetere una
query dopo un hit può rivelare un'altra cifra non marcata; tali ripetizioni non
sono esplorate da queste politiche e rappresentano un limite dell'ottimizzazione.
Una ripetizione dopo un blow, a stato invariato, riemette invece la stessa frase
in cache e non genera un'indicazione casuale nuova.

## 4. Disegno sperimentale e incertezza

Un pilot distinto dal campione finale ha stimato il costo: 10 partite per cella
su sei configurazioni e tre politiche, 180 partite totali, circa 7,05 secondi.
È servito a fissare un budget sostenibile di 48 × 256, senza ottimizzare i
parametri sui risultati del campione principale.

- **Seed principale:** `ctc-2026-10-12-confirmatory-v1`.
- **Campione:** 1.000 partite per configurazione e strategia; 9 × 4 × 1.000 = 36.000.
- **Appaiamento:** stesso segreto per indice di partita e lunghezza tra modalità e politiche. Sono 3.000 estrazioni di segreti riutilizzate nei confronti, non 36.000 segreti indipendenti.
- **Flussi separati:** codice, indizi e solver hanno PRNG distinti. Il seed del solver dipende dalla politica; il solver non riceve quello del segreto.
- **Indizi tra politiche:** il flusso sequenziale è comune, ma cambiare l'ordine delle cifre selezionate può cambiare l'assegnazione cifra→frase. Non si presume che politiche diverse vedano identiche cache per cifra.
- **Budget:** tre processi al massimo; 1.200 secondi e 384 MiB RSS per processo; heap V8 256 MiB. I budget si controllano fra partite e possono essere superati del costo di una singola partita.

Un'interruzione produce un esperimento `incomplete` o, se esterna e brusca,
`running`; il comparatore rifiuta entrambi. Non si convertono timeout in sconfitte,
non si riduce una politica durante la raccolta e non si interrompe anticipatamente
una cella in base ai suoi risultati.

Gli intervalli binomiali di Wilson al 95% quantificano l'incertezza di
campionamento per ciascuna cella; la formula è documentata da
[NIST](https://www.itl.nist.gov/div898/handbook/prc/section2/prc241.htm).
Non quantificano l'errore della scelta euristica, le differenze fra giocatori o
un eventuale errore sistematico del modello. I confronti fra politiche/modalità
usano gli esiti appaiati, test binomiale esatto sui discordanti (McNemar) e
Bonferroni separatamente su 9 confronti di modalità e 27 di politiche.
Gli intervalli delle singole percentuali non sono intervalli simultanei.

Il 100% su 1.000 partite corrisponde a un intervallo Wilson circa
99,62–100%; non prova una garanzia universale. Nessuna vittoria nel campione
non equivale a probabilità zero. Per `random`, indipendentemente dal feedback,
la probabilità teorica sotto prior uniforme è esattamente `7/N`:
0,138889% a quattro cifre, 0,023148% a cinque e 0,001157% a sette.

## 5. Risultati delle nove configurazioni

### Strategia informativa: percentuali e tentativi

Le medie sulle vinte escludono le sconfitte; le medie su tutte le partite contano sette tentativi per ogni sconfitta. Il denominatore di ciascuna riga è 1.000.

| Livello | Configurazione | Vittorie | Win rate | Wilson 95% | Tentativi, vinte | Tentativi, tutte |
| ---: | --- | ---: | ---: | --- | ---: | ---: |
| 1 | 4 / Completo | 1000/1.000 | 100,0% | 99,62–100,00% | 3,916 | 3,916 |
| 2 | 5 / Completo | 1000/1.000 | 100,0% | 99,62–100,00% | 3,964 | 3,964 |
| 3 | 7 / Completo | 1000/1.000 | 100,0% | 99,62–100,00% | 4,383 | 4,383 |
| 4 | 4 / Sintetico | 999/1.000 | 99,9% | 99,44–99,98% | 5,248 | 5,250 |
| 5 | 5 / Sintetico | 993/1.000 | 99,3% | 98,56–99,66% | 5,771 | 5,780 |
| 6 | 7 / Sintetico | 587/1.000 | 58,7% | 55,62–61,71% | 6,532 | 6,725 |
| 7 | 4 / Criptico | 980/1.000 | 98,0% | 96,93–98,70% | 5,861 | 5,884 |
| 8 | 5 / Criptico | 782/1.000 | 78,2% | 75,54–80,65% | 6,551 | 6,649 |
| 9 | 7 / Criptico | 148/1.000 | 14,8% | 12,73–17,14% | 6,791 | 6,969 |

### Sensibilità alla politica

Percentuali empiriche, sempre su 1.000 partite per cella. Gli intervalli di tutte le 36 celle sono nei manifest.

| Livello | Configurazione | Casuale | Eliminazione | Residuo atteso | Informativa |
| ---: | --- | ---: | ---: | ---: | ---: |
| 1 | 4 / Completo | 0,2% | 100,0% | 100,0% | 100,0% |
| 2 | 5 / Completo | 0,0% | 100,0% | 100,0% | 100,0% |
| 3 | 7 / Completo | 0,0% | 100,0% | 100,0% | 100,0% |
| 4 | 4 / Sintetico | 0,2% | 98,4% | 99,9% | 99,9% |
| 5 | 5 / Sintetico | 0,0% | 96,8% | 99,3% | 99,3% |
| 6 | 7 / Sintetico | 0,0% | 48,0% | 58,3% | 58,7% |
| 7 | 4 / Criptico | 0,2% | 67,4% | 98,3% | 98,0% |
| 8 | 5 / Criptico | 0,0% | 42,7% | 77,0% | 78,2% |
| 9 | 7 / Criptico | 0,0% | 8,2% | 13,2% | 14,8% |

La scelta della mossa conta molto: nel Criptico a cinque cifre si passa dal 42,7% dell’eliminazione al 78,2% dell’informativa. A sette cifre il guadagno esiste, dall’8,2% al 14,8%, ma il finale resta severo per entrambe. `expected` e `information` non mostrano differenze statisticamente rilevate in nessuna configurazione dopo la correzione dichiarata: non c’è evidenza per proclamare un vincitore universale fra le due.

### Distribuzione dei tentativi, strategia informativa

Le colonne 1..7 contano esclusivamente le vittorie a quel tentativo; l’ultima conta le sconfitte dopo sette tentativi. Ogni riga somma a 1.000.

| Livello | 1 | 2 | 3 | 4 | 5 | 6 | 7 | Sconfitte |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 0 | 6 | 209 | 649 | 135 | 1 | 0 | 0 |
| 2 | 0 | 2 | 215 | 601 | 181 | 1 | 0 | 0 |
| 3 | 0 | 6 | 112 | 444 | 371 | 65 | 2 | 0 |
| 4 | 1 | 1 | 29 | 118 | 445 | 379 | 26 | 1 |
| 5 | 0 | 0 | 8 | 54 | 271 | 484 | 176 | 7 |
| 6 | 0 | 0 | 2 | 6 | 40 | 169 | 370 | 413 |
| 7 | 1 | 1 | 4 | 31 | 251 | 494 | 198 | 20 |
| 8 | 0 | 0 | 2 | 15 | 37 | 224 | 504 | 218 |
| 9 | 0 | 0 | 0 | 1 | 4 | 20 | 123 | 852 |

### Candidati residui nelle sconfitte

Il conteggio è dopo il feedback del settimo tentativo e prima della rivelazione del codice nell’epilogo. Le vittorie hanno un solo candidato. P90 indica il 90° percentile empirico; “uno solo” conta identificazioni arrivate dopo l’ultima scelta utile.

| Livello | Sconfitte | Residuo medio | Mediana | P90 | Massimo | Con uno solo |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 0 | — | — | — | — | 0 |
| 2 | 0 | — | — | — | — | 0 |
| 3 | 0 | — | — | — | — | 0 |
| 4 | 1 | 1,000 | 1 | 1 | 1 | 1 |
| 5 | 7 | 1,000 | 1 | 1 | 1 | 7 |
| 6 | 413 | 2,274 | 2 | 5 | 17 | 200 |
| 7 | 20 | 1,300 | 1 | 2 | 4 | 16 |
| 8 | 218 | 2,069 | 2 | 4 | 10 | 108 |
| 9 | 852 | 10,863 | 6 | 24 | 201 | 80 |

Nessuna sconfitta informativa aveva già un unico candidato prima del settimo tentativo. Al livello 8, 108 delle 218 sconfitte terminano con un solo candidato: l’ultimo feedback ha identificato il codice, ma non esiste un ottavo tentativo. Questo non è un errore nella condizione di vittoria. I manifest contengono anche i residui a ogni turno; quelle statistiche sono condizionate alle partite che raggiungono il turno, perché quelle già vinte sono terminate.

### Differenze fra modalità: confronti appaiati

Il segno positivo indica una percentuale di vittoria maggiore nella prima modalità. Le inferenze riguardano `information` con il budget dichiarato.

| Cifre | Confronto | Differenza, punti % | p corretto (9 confronti) | Rilevata al 5% |
| ---: | --- | ---: | ---: | --- |
| 4 | Completo − Sintetico | +0,1 | 1,000000 | No |
| 4 | Completo − Criptico | +2,0 | 1,717e-5 | Sì |
| 4 | Sintetico − Criptico | +1,9 | 0,000189 | Sì |
| 5 | Completo − Sintetico | +0,7 | 0,140625 | No |
| 5 | Completo − Criptico | +21,8 | 4,273e-65 | Sì |
| 5 | Sintetico − Criptico | +21,1 | 2,191e-55 | Sì |
| 7 | Completo − Sintetico | +41,3 | 8,509e-124 | Sì |
| 7 | Completo − Criptico | +85,2 | 5,994e-256 | Sì |
| 7 | Sintetico − Criptico | +43,9 | 3,900e-90 | Sì |

Il Criptico si distingue dalle altre modalità a tutte e tre le lunghezze. Fra Completo e Sintetico a quattro/cinque cifre non si rileva una differenza di vittorie dopo Bonferroni; questo non prova equivalenza. Le medie descrittive dei tentativi mostrano comunque maggiore lavoro per il Sintetico. A sette cifre le tre percentuali sono nettamente separate.

### Casi di sconfitta riproducibili

**Sintetico 4, trial 665:** segreto `6390`, registrato solo a partita conclusa. Le ipotesi sono `7268`, `2134`, `0581`, `3795`, `9147`, `3609`, `6093`; i candidati scendono a 1.440, 378, 84, 10, 4, 2, 1. L’ultimo tentativo è sbagliato e identifica indirettamente il codice corretto troppo tardi.

**Criptico 7, trial 0:** segreto `2815639`, sempre noto solo al motore durante la partita. La traccia mostra gli indizi effettivamente osservati, senza cifra selezionata segreta.

| Tentativo | Ipotesi | Feedback pubblico | Candidati |
| ---: | --- | --- | ---: |
| 1 | `7832409` | hit: È il cubo di 2. | 53.760 |
| 2 | `6817459` | hit: Compare nel numero delle fatiche di Eracle. | 5040 |
| 3 | `5816974` | blow: È il numero delle dita di una mano. | 1498 |
| 4 | `2817450` | hit: Compare in almeno uno dei valori delle monete in euro. | 346 |
| 5 | `2817605` | hit: È un multiplo di 3. | 74 |
| 6 | `2813705` | blow: È un multiplo di 3. | 23 |
| 7 | `2810653` | blow: È il numero delle dita di una mano. | 8 |

Rimangono otto codici compatibili. Questa singola sconfitta non dimostra che nessun’altra strategia avrebbe potuto vincere quel segreto/cache. Tutte le sconfitte e i relativi seed sono conservati nelle tracce; i manifest includono tre esempi per cella.


## 6. Informazione esatta e garanzie

Questa sezione contiene risultati combinatori esaustivi, distinti dal campione.
Per le aperture `0123`, `01234`, `0123456`:

| Cifre | Completo: bit | Sintetico: bit | Criptico: bit |
| ---: | ---: | ---: | ---: |
| 4 | 5,109148 | 2,771152 | 2,327613 |
| 5 | 6,678739 | 3,054929 | 2,224587 |
| 7 | 8,691534 | 3,077500 | 2,157745 |

La lunghezza aumenta molto lo spazio dei segreti. Il Completo rivela più stati
posizionali per tentativo; il Sintetico resta compresso in pochi conteggi; il
Criptico continua a parlare di una sola cifra selezionata. A sette cifre, inoltre,
due insiemi di sette cifre su dieci si intersecano in almeno quattro elementi:
all'inizio non si può ricevere il ramo «nessuna cifra».

La ricerca su tutte le 640.080 aperture Criptico trova massimi di informazione
immediata di 2,762691 bit con `6859`, 2,660465 con `65894` e 2,509356 con `1673894`.
Sono estremi del primo turno in virgola mobile, non aperture certificate ottime
per vincere entro sette tentativi. Non si può moltiplicare l'informazione del
primo turno per sette: posterior e cache cambiano con lo storico.

### La vittoria può essere garantita?

| Criptico | Minimo necessario dimostrato per una garanzia | Conclusione corretta |
| --- | ---: | --- |
| 4 cifre | Almeno 7 tentativi | Una garanzia in 6 è impossibile; il caso 7 resta aperto |
| 5 cifre | Almeno 8 tentativi | Una garanzia in 7 è impossibile; non si dimostra che 8 bastino |
| 7 cifre | Almeno 9 tentativi | Una garanzia anche in 8 è impossibile; non si dimostra che 9 bastino |

Le prove fissano cache ammesse, di probabilità positiva. Se il feedback ammette
al massimo `b` risposte perdenti per nodo, un albero di `t` tentativi può vincere
su al massimo `1+b+...+b^(t−1)` codici: ogni query può indovinare direttamente
un solo codice.

A cinque cifre, la cache Fibonacci su sei cifre genera un sottospazio di
720 segreti; una separazione per la prima query e il ramo blow critico della
seconda escludono sette turni. A sette cifre bastano due frasi ammesse per
coprire nove cifre e 181.440 codici; con al massimo cinque rami perdenti,
otto turni coprono al più 97.656 codici. I conteggi e tutti i quantificatori sono
nelle [prove complete](MATHEMATICAL_NOTES.md#6-prove-sui-tentativi-necessari-per-una-garanzia).

Le cache usate nella prova possono essere rare. Un giocatore può trovarsi a
scegliere fra più alternative indistinguibili entro il budget, ma ciò non rende
ogni partita del livello una lotteria. Una prova di impossibilità della garanzia
non è una stima della win rate né una misura del divertimento.

## 7. Audit delle meccaniche e correzioni

Sono stati riprodotti i seguenti difetti della baseline, prima delle correzioni.
Le regressioni sono in [test/gameplay.test.mjs](../test/gameplay.test.mjs).

| Difetto | Caso minimo riproducibile sulla baseline | Correzione applicata |
| --- | --- | --- |
| Impostazioni libere incoerenti dopo la campagna | Selezionare Criptico/7 nel menu, aprire campagna, aprire la descrizione del livello 1, tornare alla campagna e al menu: controlli ancora Criptico/7 ma stato interno Completo/4 | Salvare e ripristinare la configurazione libera all'ingresso/uscita dalla campagna |
| Input finale perde il focus desktop | Avviare una partita desktop, digitare le quattro cifre e premere Enter: l'ultimo input era stato sfocato e il suo handler non riceveva più Enter | Conservare il focus sull'ultimo input; gli altri comportamenti della tastiera restano coperti |
| Errori di storage interrompono campagna o vittoria | Far sollevare `SecurityError` a `getItem` all'apertura, oppure `QuotaExceededError` a `setItem` vincendo un livello | Gestire l'eccezione e mantenere progresso nella sessione; lo storage indisponibile non può offrire persistenza dopo la chiusura |
| Progresso persistito malformato sblocca o blocca livelli impropriamente | Impostare `crackTheCode_campaignProgress` a `2junk`, `1.5`, `-1`, `10`, `Infinity` o testo non numerico, poi aprire la campagna | Accettare solo valori interi nell'intervallo 0..9; preservare il progresso valido della sessione |
| Un callback tardivo può cambiare un esito concluso | Dopo sette errori, invocare un ulteriore submit sintetico con il codice corretto; oppure inviarlo dopo abbandono/vittoria | Stato `isActive` e limite controllati prima di qualsiasi elaborazione; nessun ottavo tentativo accettato |

L'ultimo difetto non significa che l'interfaccia normale offrisse un ottavo
pulsante: i controlli erano già nascosti. È una violazione riproducibile del
confine dello stato di partita con un evento tardivo/programmatico. La vittoria
al settimo tentativo, la generazione, la valutazione dei feedback e il calcolo
del punteggio erano già corretti e sono preservati.

È stato inoltre corretto un difetto del nuovo strumento durante la review:
un prefisso già archiviato come `.json` + `.jsonl.gz` poteva essere riutilizzato
e il manifest sovrascritto. Due nuove regressioni hanno riprodotto il problema;
il runner ora rifiuta collisioni su tutti e tre i suffissi e conserva la
creazione esclusiva del file di traccia.

La successiva revisione indipendente ha riprodotto un secondo difetto del
laboratorio: `createGame({length:8, mode:'easy', secret:'01234567'})` accettava
uno spazio oltre il limite dichiarato, mentre `CodeSpace` e la generazione
casuale lo rifiutavano. La causa era la validazione dello spazio eseguita solo
durante la generazione del segreto. Il motore ora riusa la stessa validazione
anche con un segreto esplicito, con regressione dedicata per lunghezza e
alfabeto. Le nove configurazioni, le probabilità e le tracce dello studio non
cambiano; il replay ne verifica l'equivalenza.

### Coerenza degli indizi: cosa è verificato e cosa resta interpretazione

Il modello non ha trovato feedback meccanicamente contraddittori rispetto al
catalogo e al selettore. Sono stati verificati tutti i 32 indizi su tutte le
cifre ammesse, gli hit/blow, le cache e le traiettorie di conferma. Le proprietà
matematiche del catalogo sono coerenti con le convenzioni dichiarate nelle note.

Resta una reale ambiguità linguistica: «Compare nella successione di Fibonacci.»
intende un termine a una cifra, inclusi 0 e 1, ma si può leggere come una cifra
che compare nella scrittura di un termine. Nella seconda lettura anche 4 compare
in 34, 6 in 610, 7 in 377 e 9 in 89. Un lettore può quindi fare un'inferenza
ragionevole diversa da quella codificata. Non è stato modificato il copy approvato.
Le frasi culturali, storiche e chimiche non sono certificate come univoche per
ogni possibile interpretazione.

Anche «Nessuna nuova informazione ricavabile da questo tentativo.» può comunque
eliminare ipotesi: significa che non è selezionabile alcuna cifra non marcata,
non che il messaggio abbia informazione matematica zero. Questa distinzione
merita una futura decisione editoriale, senza cambiare implicitamente il
predicato del gioco.

Il catalogo assegna a ogni cifra una frase singleton, ma la probabilità di
riceverla alla prima selezione varia fra 1/9 e 1/6. La cache conserva per tutta
la partita anche le frasi meno discriminanti. È variabilità prevista dalle
regole attuali, non un bug corretto per aumentare le vittorie.

## 8. Risorse, riproduzione e validazione

Ambiente: Node.js **v24.19.0**, Linux x64, Intel Xeon Platinum 8370C @ 2,80 GHz. Tutti i gruppi finali risultano `complete`; nessun controllo del budget tra partite ha segnalato un superamento.

| Lunghezza, 12.000 partite | Tempo trascorso | CPU | Massimo RSS campionato tra partite |
| --- | ---: | ---: | ---: |
| 4 cifre | 51,85 s | 52,43 s | 182,00 MiB |
| 5 cifre | 131,69 s | 132,60 s | 242,46 MiB |
| 7 cifre | 837,10 s | 856,64 s | 273,18 MiB |

Le esecuzioni finali totalizzano **1041,67 secondi CPU**; il massimo RSS campionato per processo è **273,18 MiB**. Il campo storico `peakRssMB` conserva questo massimo dei campioni, non il picco assoluto del processo misurato dal sistema operativo: picchi transitori durante una partita possono non essere osservati. Il primo batch è stato eseguito con tre processi concorrenti, mentre il recupero completo a quattro cifre è stato eseguito successivamente: i tempi sono misure di raccolta, non un benchmark controllato fra lunghezze. Il pilot e la prima esecuzione invalidata a quattro cifre sono costi aggiuntivi; quest’ultima aveva impiegato 80,12 s wall / 80,69 s CPU.

**Controllo indipendente delle evidenze:** 36.000 partite, 213.090 turni, 36 riepiloghi ricalcolati identici e 108 replay (trial 0, 499, 999 per ogni cella) identici anche nelle scelte interne del solver. Tutti i dieci digest nell’archivio sorgenti sono stati verificati. La compressione preserva esattamente i byte delle tracce; [artifacts.json](../analysis/results/artifacts.json) contiene conteggi e SHA-256.

### Incidente di integrità rilevato e recupero

Il controllo ha rilevato che la prima traccia a quattro cifre conteneva 11.979 righe, mentre il manifest completo ne dichiarava 12.000: mancavano i trial 979..999 del livello 7 / `information`. Il file risultava creato dopo il manifest finale e conservava un `mtime` precedente, evidenza compatibile con la sostituzione da una copia anticipata. **L’origine della sostituzione non è accertata.** Non viene dichiarato un bug di troncatura del runner senza una riproduzione di quella causa.

La pubblicazione è stata sospesa. Manifest, traccia incompleta, hash e metadati sono conservati in [collection-incident-v1.json.gz](../analysis/results/collection-incident-v1.json.gz). Sono state rieseguite tutte le 12.000 partite a quattro cifre, da una copia dei sorgenti esatti dell’archivio e con gli stessi parametri. Tutte le 11.979 righe disponibili sono byte-identiche al replay e tutti i 12 riepiloghi statistici coincidono; tempi/RSS sono stati sostituiti dalle misure del nuovo run. Il manifest conserva il prefisso effettivo `length4-replay`; i file validati sono stati promossi ai nomi `length4.*`. [recovery.json](../analysis/results/recovery.json) documenta il confronto. L’intero dataset finale è poi passato nuovamente dal controllo indipendente e dal comparatore.



I [comandi completi](../analysis/README.md#riprodurre-il-campione-principale)
ricreano i tre esperimenti con prefissi nuovi. I riepiloghi originali sono
[length4.json](../analysis/results/length4.json),
[length5.json](../analysis/results/length5.json) e
[length7.json](../analysis/results/length7.json); le tracce di tutte le partite
sono gli omonimi `.jsonl.gz`. [comparison.json](../analysis/results/comparison.json)
contiene tutti i confronti appaiati e i riepiloghi delle 36 celle.

[source-v1.json.gz](../analysis/results/source-v1.json.gz) conserva testo e SHA-256
dei dieci sorgenti esatti impiegati nella raccolta. `baseCommit` nei manifest
identifica la baseline del checkout, non pretende che il laboratorio nuovo fosse
già incluso in quel commit: i sorgenti eseguiti sono identificati dagli hash e
dall'archivio. Dopo la raccolta sono stati aggiunti il controllo delle collisioni
di output in `simulate.mjs` e la validazione uniforme dei limiti dello spazio in
`createGame`, anche con segreto esplicito. Il modello e le politiche sulle nove
configurazioni sono immutati. Il replay verifica anche l'equivalenza delle tracce
con i sorgenti finali.

Il confine osservabile, la distribuzione dei codici piccoli, tutte le modalità e
le cache sono verificati da test indipendenti. I test di parità includono 1.080
generazioni con gli stessi consumi casuali del prodotto e 1.008 submit sulle nove
configurazioni. L'oracolo del posterior enumera separatamente segreti e cache
nei casi piccoli e confronta supporto, probabilità e risposte future.

La suite locale finale ha superato **92/92 test**. Il comando
`node analysis/verify.mjs` controlla le tracce compresse, tutti i feedback pubblici,
i 36 riepiloghi e i 108 replay senza modificare gli input; è incluso nella CI.
Le regressioni del verificatore rifiutano anche manifest completi con righe
mancanti, campi segreti aggiunti alle osservazioni, riepiloghi alterati e sorgenti
con digest non corrispondenti. Gli esiti del browser reale sono un gate separato.

La CI mantiene il controllo dati esistente, aggiunge `node --test` e uno smoke
Chrome reale senza dipendenze npm. Lo smoke usa input desktop e Enter nativi,
verifica vittoria/sconfitta al settimo tentativo, esiti terminali, passaggio
campagna/libera e tastiera virtuale a viewport mobile. La verifica mobile usa
pressioni CDP del mouse sui pulsanti a 390 px: non equivale a un test su un
dispositivo fisico o su tutti i browser. Chrome non è disponibile nel container
locale; l'esecuzione reale è affidata al job CI su Ubuntu 24.04. Il suo esito va
letto sul commit della PR, senza attribuire un PASS ai soli test VM.

I limiti massimi delle API sono 604.800 codici, 512 proposte, 8.192 ipotesi
campionate e 1.048.576 coppie per mossa. A sette cifre lo spazio occupa 3.628.800
byte e il belief Criptico 14.515.200 byte di array, oltre al runtime e agli oggetti.
Le tracce sono compresse dopo la raccolta verificando l'identità dei byte dopo
decompressione. Il comparatore rifiuta esperimenti incompleti, seed diversi,
trial non appaiati e discrepanze fra vittorie nelle tracce e nei manifest.

## 9. Interpretazione del bilanciamento

**Il Completo funziona da ingresso accessibile per il solver.** Tutte le politiche che eliminano incompatibilità vincono 1.000/1.000 in ciascuna lunghezza. La strategia informativa passa da circa 3,92 a 4,38 tentativi medi fra quattro e sette cifre: cresce il lavoro, ma sette tentativi offrono margine nel campione. Questo non misura il carico di memoria o l’esperienza di un umano.

**Il Sintetico introduce una compressione sostanziale.** A quattro/cinque cifre quasi tutte le partite vengono ancora vinte, usando circa 5,25/5,77 tentativi sulle vinte. A sette cifre la win rate scende al 58,7%, con molte soluzioni individuate o ristrette soltanto dopo l’ultima possibilità. La maggiore lunghezza non è compensata da una quantità proporzionale di feedback.

**Il Criptico richiede sia inferenza sia conoscenza del sistema degli indizi.** A quattro cifre una politica informativa vince il 98,0%, mentre la semplice eliminazione si ferma al 67,4%. A cinque cifre il divario è 78,2% contro 42,7%. A sette cifre la politica informativa arriva al 14,8%; nelle sconfitte il residuo mediano è 6 e il P90 è 24, dopo il settimo feedback. Il campione mostra una difficoltà severa, non l’impossibilità assoluta di vincere.

**La progressione non è monotona nella win rate.** Il livello 6 (Sintetico/7) è molto più impegnativo del livello 7 (Criptico/4): 58,7% contro 98,0%. Questo passaggio cambia simultaneamente lunghezza e feedback; descriverlo come effetto puro della modalità sarebbe scorretto. Può rappresentare un nuovo arco di apprendimento prima dei livelli 8 e 9. La struttura a nove livelli rimane approvata e non è stata riordinata.

**Il giudizio sul bilanciamento è condizionato all’obiettivo di prodotto.** Un finale raro da completare può essere coerente con una sfida deliberatamente selettiva. Se l’obiettivo fosse garantire la vittoria per ogni segreto e ogni cache ammessa entro sette tentativi, le prove escludono tale garanzia per il Criptico/5 e /7. Un obiettivo più debole, vincere quasi sempre in media, non è escluso da quelle prove: per valutarlo servirebbero strategie ulteriori e misurazioni. La bassa percentuale del finale con i solver qui provati lo rende un candidato prioritario per una valutazione di prodotto. Stabilire se sia divertente richiede playtest: il solver non misura piacere, tensione narrativa, perseveranza o frustrazione.


## 10. Raccomandazioni, separate dall'implementazione

Le seguenti opzioni richiedono una decisione successiva. Nessuna è stata usata
per migliorare artificialmente le statistiche dello studio e nessuna modifica
la narrativa o l'identità dei nove livelli in questa PR.

1. **Rendere comprensibile il Criptico prima di toccarne la difficoltà.** Valutare una spiegazione accessibile della selezione da sinistra, delle conferme e della cache; chiarire l'ambiguità Fibonacci e il significato del messaggio senza indizio. Il vantaggio è ridurre errori dovuti alla lettura delle regole; una nuova formulazione del copy va approvata editorialmente.
2. **Stabilire il target del finale sulla base di playtest umani.** Il dato del solver permette di identificare il livello 9 come il punto più severo, ma non misura frustrazione, apprendimento o soddisfazione. Distinguere chi conosce il catalogo da chi apprende soltanto dai messaggi; misurare tentativi, abbandoni e comprensione degli indizi prima di scegliere una win rate obiettivo.
3. **Se il finale risulta eccessivamente punitivo, confrontare varianti isolate.** Candidati sono un piccolo budget aggiuntivo di tentativi oppure un'informazione aggiuntiva condizionata; entrambi cambiano regole e vanno simulati su un nuovo campione. I limiti «almeno 8/9» non sono una prescrizione e non promettono una garanzia con quei numeri.
4. **Valutare la varianza del catalogo mantenendo la memoria coerente.** Una selezione per classe informativa, o una gestione esplicita degli indizi molto ampi, potrebbe ridurre disparità fra cache iniziali. Va prima definita una nuova distribuzione e misurato l'effetto: scegliere sempre frasi singleton o riestrarre tacitamente a ogni turno snaturerebbe il modello attuale.
5. **Conservare i nove livelli e valutare la curva per gruppi.** La riduzione di difficoltà fra livello 6 e 7 è compatibile con l'apprendimento di un nuovo feedback. Non si propone di riordinare la campagna approvata. Un eventuale ribilanciamento deve essere valutato nelle configurazioni esistenti e discusso separatamente dall'identità narrativa.
6. **Per migliorare la stima algoritmica, estendere il laboratorio.** Provare look-ahead limitato, budget maggiori, ripetizioni informative dopo hit e aperture ottimizzate, su seed nuovi. Questi esperimenti possono migliorare la prestazione del solver senza alterare il prodotto; i risultati attuali rimangono riferiti alle politiche archiviate.

## 11. Limiti dichiarati

- Nessuna strategia ottima su sette turni è stata calcolata. Un risultato negativo del solver non dimostra che una scelta migliore non potesse vincere quella partita.
- Le prove di impossibilità della garanzia sono separate e valgono per il catalogo attuale; non sono stime di frequenza.
- Il campione è finito, appaiato e generato da PRNG; gli intervalli non coprono tutti gli errori di modellazione o il comportamento umano.
- Il filtraggio è esaustivo, ma le decisioni informative sono campionate, di un turno e senza ripetizioni di query. Il catalogo è noto al solver.
- Residuo 1 dopo il settimo errore significa identificazione arrivata troppo tardi, non vittoria. Un numero elevato di candidati non esprime da solo l'incertezza se il posterior è non uniforme.
- Tempi e RSS sono misure dell'ambiente e della concorrenza dichiarati, non requisiti prestazionali garantiti su altri dispositivi. L'RSS è campionato tra partite e non certifica l'assenza di picchi transitori oltre il budget.
- Lo storage bloccato consente soltanto un fallback di sessione; la persistenza oltre la sessione non può essere garantita senza storage funzionante.
- Lo smoke Chrome copre flussi mirati; non sostituisce verifiche di accessibilità, dispositivi fisici, Safari/Firefox o playtest editoriali.
- Non sono stati cambiati `data.js`, la narrativa, i nomi/ordine dei livelli, HTML o CSS. Le sole modifiche al prodotto correggono difetti riprodotti di input e stato; il laboratorio resta offline.
