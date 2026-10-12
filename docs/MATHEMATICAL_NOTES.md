# Note matematiche: feedback, informazione e limiti dei sette tentativi

## Risultati e ambito

Questa analisi descrive le regole pubbliche di `Crack the Code`: cifre decimali
distinte, zero iniziale ammesso, lunghezze 4, 5 e 7. Le fonti del modello sono
[`evaluateGuess`, `getDifficultFeedback` e `getCrypticFeedback`](../script.js),
il [catalogo degli indizi e la campagna](../data.js). Il riferimento iniziale
dell'audit è il commit `b8959e247b8a44217d470cc6bfd9c6d01be2b42a`.

I risultati principali sono:

- Il posterior del feedback Criptico richiede pesi probabilistici, uno stato di
  cifre confermate per ogni codice candidato e una cache per cifra. Conservare
  soltanto un insieme uniforme di codici compatibili non riproduce il gioco.
- I calcoli del primo turno sono esaustivi. La scelta casuale della frase
  aggiunge entropia all'output, ma quella componente non è informazione sul
  segreto e deve essere sottratta.
- Con il catalogo attuale, nessuna strategia può garantire la vittoria in sette
  tentativi nel Criptico a cinque o sette cifre. Per sette cifre si può escludere
  anche una garanzia in otto tentativi.
- Queste impossibilità riguardano il caso peggiore su segreti e indizi ammessi.
  Non sono percentuali di sconfitta e non dicono che otto o nove tentativi bastino.
  Per il Criptico a quattro cifre qui si prova soltanto che sei tentativi non
  possono bastare a garantire la vittoria; la garanzia in sette resta aperta.

Le procedure sono in [analysis/openings.mjs](../analysis/openings.mjs).
I [test](../test/analysis/openings.test.mjs) confrontano le formule con
un'enumerazione indipendente e verificano i conteggi utilizzati nelle prove.
I conteggi interi sono esatti; probabilità ed entropie sono calcolate con
aritmetica IEEE-754. Non si usano campionamenti per i risultati di questo file.

## 1. Spazio dei codici

Con un alfabeto di `m` cifre e un codice di lunghezza `n`, il numero di codici è

$$
N=P(m,n)=\frac{m!}{(m-n)!}.
$$

Il modello probabilistico assume che la permutazione casuale del generatore
sia uniforme, quindi ogni codice valido ha prior `1/N`.

| Lunghezza | Codici possibili | Entropia iniziale, bit |
| --- | ---: | ---: |
| 4 | 5.040 | 12,299208 |
| 5 | 30.240 | 14,884171 |
| 7 | 604.800 | 19,206099 |

La campagna contiene tutte le nove coppie modalità/lunghezza, nell'ordine
Completo 4/5/7, Sintetico 4/5/7, Criptico 4/5/7. L'ordine è una configurazione
del prodotto; da solo non dimostra che ogni passaggio sia più difficile del
precedente. Tutte le configurazioni concedono sette tentativi.

## 2. Stato e selezione nel Criptico

Per ciascun segreto ipotetico `s`, siano `H` l'insieme delle cifre già marcate
da un feedback di tipo hit e `K` la cache delle frasi assegnate alle cifre.
Entrambi sono vuoti all'inizio.

Per una query `g`, il selettore esegue queste operazioni:

1. Cerca da sinistra il primo indice `i` con `g[i] = s[i]` e `g[i]` fuori da
   `H`. Se lo trova, emette hit e aggiunge **soltanto quella cifra** a `H`.
2. Se il primo passaggio non trova nulla, cerca da sinistra la prima cifra
   di `g` presente in `s` e fuori da `H`. Emette blow. Non aggiunge la cifra
   a `H`.
3. Se non trova una cifra selezionabile, emette il messaggio senza indizio.
   Il testo dipende dal fatto che almeno una cifra sia stata marcata in passato.

La seconda ricerca dà davvero un blow: se la cifra selezionata fosse anche
correttamente posizionata, sarebbe stata trovata nella prima ricerca.

La priorità contiene informazione implicita. Un hit alla posizione `j` esclude
hit non marcati nelle posizioni precedenti. Un blow implica che non esista
alcun hit non marcato nell'intera query, e che le cifre non marcate precedenti
alla cifra selezionata siano assenti dal codice. Un feedback senza indizio
implica che tutte le cifre della query non già marcate siano assenti.

Il giocatore normalmente non conosce quale cifra sia stata selezionata:
una frase può essere compatibile con più cifre. Le implicazioni appena elencate
devono quindi essere applicate separatamente a ogni ipotesi, senza trasformare
arbitrariamente la frase in una singola identità.

### Una sola traiettoria di stato per codice candidato

Fissati un codice ipotetico e lo storico delle query, la sequenza delle cifre
selezionate è deterministica. Perciò non serve enumerare tutti gli
assegnamenti possibili dell'intera cache in ogni aggiornamento. Ogni codice
compatibile mantiene un solo insieme `H` e una sola cache parzialmente nota.
Quando la sua cifra selezionata riceve una frase per la prima volta, quella
frase osservata determina la corrispondente voce di cache per quell'ipotesi.

Questa proprietà non autorizza a usare lo stato reale del motore: il solver
ricostruisce lo stato per tutti i codici ipotetici usando soltanto query ed
esiti pubblici. Il flag pubblico di vittoria è parte dell'osservazione. Dopo
un tentativo perdente va eliminato anche il codice identico alla query,
indipendentemente dall'indizio emesso. Il codice rivelato nell'epilogo di
sconfitta non entra nell'inferenza precedente a tale rivelazione.

## 3. Likelihood esatta e cache

Sia `A_d` l'insieme delle righe del catalogo compatibili con la cifra `d` e
sia `k_d = |A_d|`. Il gioco sceglie uniformemente una di queste righe alla
prima selezione di `d`; poi riusa la frase memorizzata.

Nel catalogo attuale tutti i testi sono distinti. Per un candidato che
seleziona la cifra `d`, il fattore di likelihood della frase osservata `h` è:

| Stato ipotetico della cache | Fattore |
| --- | ---: |
| `K[d]` assente e `h` compatibile con `d` | `1/k_d`, poi `K[d] = h` |
| `K[d] = h` già presente | `1` |
| `K[d]` presente ma diversa da `h` | `0` |
| `h` incompatibile con `d` | `0` |

Anche lo status osservato deve coincidere con quello prodotto dal selettore
ipotetico. Il feedback senza indizio è deterministico e non crea una voce di
cache. Se in futuro più righe avessero lo stesso testo, la probabilità della
prima emissione sarebbe la loro molteplicità divisa per `k_d`;
[`catalog.mjs`](../analysis/catalog.mjs) rifiuta tale caso per evitare di
trattarlo erroneamente come una singola riga.

L'aggiornamento è quindi

$$
p_{t+1}(s)=\frac{p_t(s)L(y_t\mid s,g_t,H_t(s),K_t(s))}
{\sum_u p_t(u)L(y_t\mid u,g_t,H_t(u),K_t(u))}.
$$

Le cifre confermate vengono aggiornate soltanto per l'hit selezionato.
Marcare tutti gli hit, marcare un blow o scegliere una cifra compatibile con
la frase a caso cambierebbe il modello.

### Esempio di posterior non uniforme

Con apertura `0123`, lo status hit e la frase «È un numero primo.» possono
selezionare la cifra 2 o la cifra 3. Ci sono rispettivamente 399 e 356 codici
che selezionano quelle cifre. Tuttavia `k_2=8` e `k_3=6`, quindi la probabilità
posteriore che sia stata selezionata la cifra 3 è

$$
\frac{356/6}{399/8+356/6}=0{,}5433040824.
$$

Un filtro che uniformasse tutti i 755 codici compatibili darebbe invece
`356/755 = 0,4715231788`. Anche senza eliminare il codice corretto, tale filtro
calcolerebbe probabilità e scelte informative diverse.

Ripetere la stessa query dopo un blow non fa avanzare `H`; il selettore ritrova
la stessa cifra e la cache restituisce la stessa frase. Tale ripetizione non
fornisce una nuova estrazione indipendente. Una frase uguale in query diverse,
invece, potrebbe provenire da cifre diverse e richiede la simulazione delle
cache di ogni ipotesi.

## 4. Audit meccanico del catalogo

Il catalogo contiene 32 frasi distinte, 72 appartenenze cifra/frase e copre
tutte le cifre. Le cardinalità degli insiemi compatibili sono:

| Cifre compatibili per frase | Numero di frasi |
| ---: | ---: |
| 1 | 10 |
| 2 | 13 |
| 3 | 2 |
| 4 | 6 |
| 6 | 1 |

Ogni cifra ha esattamente una frase associata a un insieme singleton.

| Cifra | `k_d` | Probabilità della frase singleton alla prima selezione |
| ---: | ---: | ---: |
| 0 | 9 | 1/9 |
| 1 | 9 | 1/9 |
| 2 | 8 | 1/8 |
| 3 | 6 | 1/6 |
| 4 | 7 | 1/7 |
| 5 | 7 | 1/7 |
| 6 | 6 | 1/6 |
| 7 | 7 | 1/7 |
| 8 | 6 | 1/6 |
| 9 | 7 | 1/7 |

Questa probabilità resta associata alla prima estrazione: una cache poco
distintiva non diventa più precisa aspettando nuovi turni sulla stessa cifra.
Inoltre un insieme non singleton può identificare una cifra in una query
specifica, quando le altre cifre compatibili non compaiono nella query o sono
già escluse dallo storico.

Nelle proprietà matematiche del catalogo non emerge un falso positivo con le
convenzioni usuali: `0 = 0²`, `0 = 3·0`, `1 = 2⁰`; le somme di due primi
distinti ammesse sono `5 = 2+3`, `7 = 2+5`, `8 = 3+5`, `9 = 2+7`.

Esiste però un'ambiguità semantica concreta in «Compare nella successione di
Fibonacci.». Il catalogo intende essere un termine a una cifra e include zero.
Se il lettore interpreta invece «compare» come essere una cifra nella
scrittura di un termine, compaiono anche 4 in 34, 6 in 610, 7 in 377 e 9 in 89.
Per quella lettura l'indizio non restringe affatto alle sei cifre catalogate.

L'audit qui certifica le corrispondenze meccaniche del catalogo e le proprietà
matematiche appena esplicitate. Non certifica come univoche tutte le frasi
culturali, storiche o chimiche: servirebbero una definizione precisa della
lettura e fonti primarie per le relative affermazioni. La verità di una frase
per una cifra non dimostra automaticamente che nessun'altra cifra possa
soddisfare una lettura ragionevole della stessa frase.

Anche il testo «Nessuna nuova informazione ricavabile da questo tentativo.»
va distinto dal contenuto logico: può escludere cifre non marcate della query.
Questa è una limitazione della descrizione testuale, non una contraddizione
nel predicato restituito dal selettore.

## 5. Informazione esatta del primo turno

Per una query fissata `g`, l'informazione sul segreto è

$$
I(S;Y\mid g)=H(Y\mid g)-\sum_s p(s)H(Y\mid S=s,g).
$$

Nel Completo e nel Sintetico la risposta è deterministica, quindi il secondo
termine vale zero. Nel Criptico al primo turno vale `log₂(k_d)` per un codice
perdente che seleziona `d`, e zero per il messaggio senza indizio. La vittoria
viene trattata come un esito distinto: la frase generata sul codice vincente
non aggiunge informazione una volta noto che la query è corretta.

### Formule per le partizioni del selettore

Definiamo, con `P(m,n)=0` se `n>m`,

$$
D(m,n,k)=\sum_{r=0}^{k}(-1)^r\binom{k}{r}P(m-r,n-r).
$$

È il numero di iniezioni di lunghezza `n` su `m` cifre che evitano `k`
corrispondenze posizione/cifra specificate. Per l'indice zero-based `j`:

$$
\begin{aligned}
h_j &= D(m-1,n-1,j),\\
b_j &= D(m-j,n,n-j)-D(m-j-1,n,n-j-1),\\
z &= P(m-n,n).
\end{aligned}
$$

Per `h_j` si fissa l'hit in `j` ed escludono gli hit precedenti. Per `b_j`
si escludono dal codice le cifre precedenti della query, si vietano tutti gli
hit, poi si sottraggono i codici che escludono anche la cifra in `j`.
I conteggi `h_j` includono il codice vincente; per l'informazione viene tolto
un codice da `h_0` e aggiunto un esito di vittoria di probabilità `1/N`.

| Lunghezza | Conteggi hit da sinistra | Conteggi blow da sinistra | Senza cifra |
| --- | --- | --- | ---: |
| 4 | 504, 448, 399, 356 | 1197, 846, 570, 360 | 360 |
| 5 | 3024, 2688, 2394, 2136, 1909 | 8544, 5005, 2680, 1260, 480 | 120 |
| 7 | 60480, 53760, 47880, 42720, 38180, 34176, 30637 | 205056, 70677, 18444, 2790, 0, 0, 0 | 0 |

A sette cifre, due insiemi di sette cifre su dieci condividono almeno quattro
elementi. Perciò all'inizio non può apparire la risposta senza cifra e il
primo elemento comune non può trovarsi oltre la quarta posizione della query.
Questo argomento vale all'inizio, quando non esistono cifre marcate.

### Aperture canoniche

| Apertura | Completo: informazione, bit | Sintetico: informazione, bit | Criptico: informazione, bit |
| --- | ---: | ---: | ---: |
| `0123` | 5,109148 | 2,771152 | 2,327613 |
| `01234` | 6,678739 | 3,054929 | 2,224587 |
| `0123456` | 8,691534 | 3,077500 | 2,157745 |

Nel Criptico la scomposizione è:

| Apertura | Entropia dell'output | Entropia della scelta casuale dell'indizio | Informazione sul segreto | Entropia posteriore media |
| --- | ---: | ---: | ---: | ---: |
| `0123` | 5,154714 | 2,827101 | 2,327613 | 9,971595 |
| `01234` | 5,258981 | 3,034393 | 2,224587 | 12,659583 |
| `0123456` | 5,192004 | 3,034259 | 2,157745 | 17,048354 |

Tutte le colonne sono espresse in bit. Contare i messaggi diversi o usare
soltanto l'entropia dell'output sovrastimerebbe l'informazione disponibile.

### Ricerca esaustiva delle aperture Criptico

Ogni query valida è stata valutata usando le stesse partizioni per posizione
e le effettive probabilità degli indizi per le cifre della query.

| Lunghezza | Query valutate | Apertura con informazione massima | Informazione massima, bit | Apertura con informazione minima | Informazione minima, bit |
| --- | ---: | --- | ---: | --- | ---: |
| 4 | 5.040 | `6859` | 2,762691 | `1258` | 2,196989 |
| 5 | 30.240 | `65894` | 2,660465 | `12580` | 2,083834 |
| 7 | 604.800 | `1673894` | 2,509356 | `1258039` | 2,100797 |

Si tratta di estremi su tutte le aperture nel calcolo in virgola mobile,
non di una ricerca delle strategie ottime su sette turni. Il massimo di
informazione immediata può differire dal massimo della probabilità di
vittoria finale. Non è corretto moltiplicare l'informazione del primo turno
per sei o sette per ottenere una prova: query, posterior e cache cambiano
nei turni successivi.

## 6. Prove sui tentativi necessari per una garanzia

### Lemma di capacità dell'albero

Fissiamo preventivamente una cache ammessa. Il gioco può essere visto così
perché ogni cifra estrae la propria frase una volta e poi la conserva.
Un assegnamento specifico di frasi compatibili ha probabilità positiva nel
modello del gioco. Con cache fissata il feedback è deterministico.

Se ogni query ha al massimo `b` esiti **perdenti**, una strategia con `t`
tentativi può vincere su al massimo

$$
C_b(t)=1+b+\cdots+b^{t-1},\qquad C_b(0)=0
$$

segreti distinti. Infatti una query vince soltanto sul codice tentato e ogni
ramo perdente dispone di `t-1` tentativi: `C_b(t)=1+bC_b(t-1)`.
Il limite resta valido se alcuni rami sono impossibili o se la query non è
un codice candidato; in quei casi sovrastima la capacità.

Le due formulazioni del feedback senza indizio non creano un ramo aggiuntivo
nello stesso nodo. A parità di storico, l'esistenza di almeno una cifra
marcata dipende dal fatto che sia comparso almeno un hit, già osservabile.

Le prove concedono anche al giocatore di conoscere il sottospazio di segreti
e la cache scelta. È informazione aggiuntiva: un'impossibilità persiste quando
il giocatore reale ne sa meno. Per strategie randomizzate si può fissare il
seme del solver; il medesimo limite vale per ciascun seme. Non viene quindi
ottenuta una garanzia certa aggiungendo casualità alla strategia.

### Quattro cifre: almeno sette tentativi necessari

Sia `A={0,1,2,3,5,8}`. Consideriamo i `P(6,4)=360` segreti composti da quattro
cifre di `A` e fissiamo per ogni cifra la frase Fibonacci. Ci sono al massimo
tre esiti perdenti: hit, blow, nessun indizio.

Se la prima query contiene `a` cifre di `A`, i conteggi sono:

| `a` | Hit perdenti | Blow | Nessun indizio | Vittoria |
| ---: | ---: | ---: | ---: | ---: |
| 0 | 0 | 0 | 360 | 0 |
| 1 | 60 | 180 | 120 | 0 |
| 2 | 108 | 228 | 24 | 0 |
| 3 | 147 | 213 | 0 | 0 |
| 4 | 178 | 181 | 0 | 1 |

Con sei tentativi iniziali ne resterebbero cinque dopo la prima query, con
capacità `C_3(5)=121`. Ogni riga ha un ramo più grande di 121. Quindi una
garanzia in sei tentativi è impossibile. Non segue né la possibilità né
l'impossibilità di una garanzia in sette.

### Cinque cifre: una garanzia in sette tentativi è impossibile

Usiamo lo stesso `A` e la stessa cache Fibonacci. I segreti sono ora
`P(6,5)=720`; restano al massimo tre esiti perdenti per query.

| Cifre `a` della prima query appartenenti ad `A` | Hit perdenti | Blow | Nessun indizio | Vittoria |
| ---: | ---: | ---: | ---: | ---: |
| 1 | 120 | 480 | 120 | 0 |
| 2 | 216 | 504 | 0 | 0 |
| 3 | 294 | 426 | 0 | 0 |
| 4 | 358 | 362 | 0 | 0 |
| 5 | 410 | 309 | 0 | 1 |

`a=0` non è possibile: fuori da `A` esistono solo quattro cifre, ma la query
deve contenerne cinque distinte. Dopo la prima query restano sei tentativi e
`C_3(6)=364`. Ogni riga tranne `a=4` ha già un ramo maggiore di 364.

Per `a=4`, consideriamo il ramo blow di 362 codici. Non essendo stato emesso
alcun hit, nessuna cifra è marcata. Qualunque seconda query cade in uno dei
due casi seguenti:

- Contiene almeno due cifre di `A`. Ogni segreto ne contiene cinque su sei,
  quindi esiste sempre una cifra comune non marcata. Non può apparire il
  feedback senza indizio. Restano al più un vincitore e due rami, ciascuno
  con cinque tentativi: capacità massima `1+2·C_3(5)=243`, inferiore a 362.
- Contiene una sola cifra `d` di `A`. Non può vincere perché contiene quattro
  cifre sicuramente esterne al codice. Al più 120 dei 362 segreti possono
  avere `d` nella posizione interrogata (`P(5,4)=120`); al più 120 possono
  escludere `d` (`P(5,5)=120`). Il ramo blow conserva quindi almeno
  `362−120−120=122` codici, più di `C_3(5)=121`.

Ogni possibile prima query e ogni prosecuzione critica sono coperte.
Di conseguenza non esiste una garanzia in sette tentativi; ne servirebbero
almeno otto. Questa è una condizione necessaria, non una prova di sufficienza.

### Sette cifre: una garanzia richiede almeno nove tentativi

Consideriamo i segreti a sette cifre dall'alfabeto `{0,1,2,3,4,5,6,7,8}`,
cioè `P(9,7)=181440` codici. Il catalogo ammette questa cache:

- Fibonacci per `{0,1,2,3,5,8}`;
- la frase sull'anno della caduta dell'Impero romano d'Occidente per `{4,6,7}`.

Ogni cifra del segreto riceve quindi una di due sole frasi. Gli esiti perdenti
sono al massimo cinque: due frasi per ciascuno degli status hit e blow, più
il feedback senza indizio. Ma

$$
C_5(8)=1+5+\cdots+5^7=97656 < 181440.
$$

Neppure otto tentativi possono garantire la vittoria. Ne sono necessari
almeno nove; non si afferma che nove siano sufficienti.

Una prova più debole può utilizzare tutti i 604800 segreti: assegnando
Fibonacci alle sue sei cifre, la frase sull'anno alle cifre 4, 6 e 7, e
«È un quadrato perfetto.» alla cifra 9, bastano tre frasi. Ci sono al massimo
sette esiti perdenti e `C_7(7)=137257<604800`.

### Significato delle prove

| Criptico | Limite inferiore provato sui tentativi necessari per una garanzia | Cosa non viene dimostrato |
| --- | ---: | --- |
| 4 cifre | almeno 7 | Che 7 bastino oppure non bastino |
| 5 cifre | almeno 8 | Che 8 bastino, o quale sia la win rate in 7 |
| 7 cifre | almeno 9 | Che 9 bastino, o quale sia la win rate in 7 |

Gli assegnamenti di cache usati hanno probabilità positiva ma possono essere
rari. Le prove non quantificano la frequenza delle partite difficili nel
generatore ordinario. Per una percentuale di vittoria servono una strategia
specificata e prove esaustive o simulazioni con campionamento e incertezza
dichiarati. Una strategia che vince una percentuale alta non costituisce una
garanzia; una prova di impossibilità della garanzia non implica una percentuale
di vittoria bassa.

## 7. Riproduzione e limiti di calcolo

Eseguire dalla radice del repository:

```bash
node --test test/analysis/openings.test.mjs
node analysis/openings.mjs
node analysis/openings.mjs --best
```

Il secondo comando emette JSON con le aperture canoniche, le cardinalità,
le tre misure informative e i conteggi delle prove. Il terzo valuta tutte
le 640080 query delle tre lunghezze e aggiunge gli estremi Criptico.
Il JSON identifica il catalogo con un digest SHA-256 della sua rappresentazione
serializzata e riporta il metodo di calcolo.

Una ricerca esplicitamente limitata può essere eseguita così:

```bash
node analysis/openings.mjs --best --lengths 7 --max-guesses 1000
```

In quel caso viene valutato il primo migliaio di query in ordine
lessicografico; `complete:false` segnala che gli estremi riguardano soltanto
quel prefisso. Non si tratta di un campione casuale né di un massimo globale.
Il limite massimo ammesso è 604800 query per lunghezza. Non ci sono cambiamenti
silenziosi di strategia o campionamento dipendenti dal tempo di esecuzione.

Le partizioni del selettore richiedono somme finite di inclusione-esclusione.
Il Completo e il Sintetico vengono verificati enumerando tutti i segreti per
la query scelta. La ricerca delle aperture Criptico riusa le partizioni per
posizione, quindi non enumera di nuovo tutti i segreti per ogni query.
Il lavoro per ogni apertura è proporzionale alle appartenenze degli indizi
delle sue cifre, con un numero fisso di bucket di output. Lo spazio massimo
di codici enumerato è 604800 e la ricerca non contiene una diramazione
ricorsiva su strategie future.

La CI verifica enumerazioni indipendenti su spazi piccoli, la partizione
completa a quattro cifre, i valori canonici di tutte le lunghezze, il caso
limite di un solo codice, la sottrazione dell'entropia casuale, il trattamento
della vittoria, il comportamento dei budget e l'ottimo dell'apertura a quattro
cifre. Le ricerche complete a cinque e sette cifre restano nel comando offline
esplicito. Le formule intere delle prove usano anche `BigInt` per la capacità
degli alberi; le entropie non sono certificate con intervalli di arrotondamento.
