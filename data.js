// ============================================
// CRACK THE CODE - GAME DATA
// ============================================
// Questo file contiene tutti i dati testuali del gioco.
// 
// STRUTTURA:
// - campaignLevels: Configurazione dei 9 livelli della campagna
// - levelData: Testi (lore, epiloghi) per ogni combinazione difficoltà/lunghezza
// - crypticMessages: Indizi criptici per la modalità difficile
//
// Per modificare i testi, cerca la sezione appropriata sotto.
// ============================================


// ============================================
// CAMPAIGN MODE - Configurazione livelli
// ============================================
// Ordine dei livelli nella campagna (dal più facile al più difficile)
// difficulty: "easy" | "medium" | "difficult"
// codeLength: 4 | 5 | 7

const campaignLevels = [
    // Easy levels
    { difficulty: "easy", codeLength: 4, index: 0 },
    { difficulty: "easy", codeLength: 5, index: 1 },
    { difficulty: "easy", codeLength: 7, index: 2 },

    // Medium levels
    { difficulty: "medium", codeLength: 4, index: 3 },
    { difficulty: "medium", codeLength: 5, index: 4 },
    { difficulty: "medium", codeLength: 7, index: 5 },

    // Difficult levels
    { difficulty: "difficult", codeLength: 4, index: 6 },
    { difficulty: "difficult", codeLength: 5, index: 7 },
    { difficulty: "difficult", codeLength: 7, index: 8 }
];


// ============================================
// LEVEL DATA - Testi per ogni livello
// ============================================
// Ogni livello ha:
// - levelName: Nome mostrato nel menu
// - lore: Testo introduttivo prima della sfida
// - epilogoVittoria: Testo mostrato in caso di vittoria
// - epilogoSconfitta: Testo mostrato in caso di sconfitta
//
// NOTA: Usa <br><br> per andare a capo nei testi.

const levelData = {
    "easy": {
        "4": {
            "levelName": "Sblocca il Telefono del Bro",
            "campaign": {
                "lore": "Il tuo migliore amico ha dimenticato il PIN del telefono.<br><br>Ti guarda come se fossi la sua ultima speranza.<br><br>«Dai bro. Tu sei bravo con 'ste cose.»<br><br>Non hai mai fatto niente del genere, ma quanto potrà essere difficile?<br><br>In fondo è solo un PIN.",
                "victory": "📱 TELEFONO SBLOCCATO.<br><br>Il tuo amico esulta come se avessi appena disinnescato una bomba.<br><br>Cinque minuti dopo, nel gruppo WhatsApp, sei già diventato “l'hacker”.<br><br>Ovviamente qualcuno decide subito di metterti alla prova.",
                "defeat": "📱 ACCESSO NEGATO.<br><br>Il telefono rimane bloccato.<br><br>Il tuo amico ti guarda in silenzio.<br><br>«Ma allora non sei bravo come pensavo...»<br><br>Fa male. Ma non abbastanza da farti smettere."
            },
            "freePlay": {
                "lore": "Il tuo amico ha dimenticato il PIN del telefono.<br><br>«Dai bro. Tu sei bravo con 'ste cose.»<br><br>Ti porge il dispositivo.<br><br>Quattro cifre tra te e la gloria.",
                "victory": "📱 TELEFONO SBLOCCATO.<br><br>Il tuo amico esulta.<br><br>«Lo sapevo!»<br><br>Per oggi, la tua reputazione è salva.",
                "defeat": "📱 ACCESSO NEGATO.<br><br>Il telefono rimane bloccato.<br><br>Il tuo amico ti guarda.<br><br>«Ma allora non sei bravo come pensavo...»<br><br>Forse al prossimo tentativo andrà diversamente."
            }
        },
        "5": {
            "levelName": "Infiltrati nell'Instagram della Nemesi",
            "campaign": {
                "lore": "La voce si è sparsa.<br><br>Pare che tu sia quello capace di entrare dove gli altri restano fuori.<br><br>E gli amici hanno già trovato il bersaglio perfetto: il profilo della persona che non sopportate.<br><br>Foto perfette. Caption motivazionali. Una quantità illegale di #blessed.<br><br>«Vediamo se sei davvero bravo.»<br><br>A questo punto tirarti indietro sarebbe quasi peggio che fallire.",
                "victory": "🔓 ACCESSO OTTENUTO.<br><br>Niente complotti. Niente doppie vite.<br><br>Solo una quantità sorprendente di foto eliminate e conversazioni molto più imbarazzanti del previsto.<br><br>Gli amici sono soddisfatti.<br><br>Tu un po' meno.<br><br>Perché ti accorgi che la parte migliore non era scoprire cosa ci fosse dentro.<br><br>Era riuscire a entrare.",
                "defeat": "🚫 ACCESSO NEGATO.<br><br>Il profilo resta fuori portata.<br><br>La nemesi continua indisturbata a vivere la sua best life.<br><br>Gli amici ridono.<br><br>Tu no.<br><br>Ora vuoi riuscirci sul serio."
            },
            "freePlay": {
                "lore": "Foto perfette.<br><br>Caption motivazionali.<br><br>Una quantità illegale di #blessed.<br><br>Il profilo della tua nemesi è davanti a te.<br><br>Vediamo cosa nasconde dietro tutti quei filtri.",
                "victory": "🔓 ACCESSO OTTENUTO.<br><br>Nessuna doppia vita.<br><br>Solo vecchie foto, conversazioni imbarazzanti e abbastanza materiale da compromettere una reputazione per anni.<br><br>Forse era meglio non sapere.",
                "defeat": "🚫 ACCESSO NEGATO.<br><br>Il profilo rimane impenetrabile.<br><br>La tua nemesi può continuare indisturbata a vivere la sua best life.<br><br>Almeno per oggi."
            }
        },
        "7": {
            "levelName": "Hackera la Macchinetta del Caffè dell'Ufficio",
            "campaign": {
                "lore": "Ormai la reputazione ti precede.<br><br>Un collega ti indica la macchinetta del caffè.<br><br>«Oh, hacker. Già che sei così bravo, facci avere il caffè gratis.»<br><br>Ridono tutti.<br><br>La macchinetta, nel frattempo, si è appena mangiata altri cinquanta centesimi senza erogare nulla.<br><br>La guardi.<br><br>Lei guarda te.<br><br>È diventata una questione personale.",
                "victory": "☕ ACCESSO AL SISTEMA OTTENUTO.<br><br>La macchinetta fa un bip.<br><br>Poi eroga un caffè.<br><br>Gratis.<br><br>Silenzio.<br><br>Ne eroga un altro.<br><br>Qualcuno urla: «OFFRE LUI!»<br><br>Nel giro di trenta secondi sei circondato da colleghi che ti acclamano mentre la macchinetta distribuisce caffè come se fosse Natale.<br><br>Dovrebbe bastarti.<br><br>E invece, tornando a casa, continui a pensarci.<br><br>Telefono. Social. Macchinetta del caffè.<br><br>Divertente.<br><br>Ma adesso vuoi sapere quanto sei bravo davvero.",
                "defeat": "❌ ACCESSO NEGATO.<br><br>La macchinetta emette un bip.<br><br>Poi ti scala cinquanta centesimi.<br><br>I colleghi esplodono a ridere.<br><br>«Grande hacker.»<br><br>Anche tu ridi.<br><br>Ma dentro hai già deciso:<br><br>«Domani ci riprovo. Quella macchinetta non può averla vinta.»"
            },
            "freePlay": {
                "lore": "La macchinetta del caffè si è appena mangiata altri cinquanta centesimi.<br><br>Di nuovo.<br><br>Un collega scherza:<br><br>«Oh, hacker. Facci avere il caffè gratis.»<br><br>Ridono tutti.<br><br>Tu guardi la macchinetta.<br><br>È diventata una questione personale.",
                "victory": "☕ ACCESSO AL SISTEMA OTTENUTO.<br><br>La macchinetta fa un bip.<br><br>Poi eroga un caffè.<br><br>Gratis.<br><br>Qualcuno urla: «OFFRE LUI!»<br><br>Per qualche glorioso minuto diventi la persona più amata dell'ufficio.",
                "defeat": "❌ ACCESSO NEGATO.<br><br>La macchinetta emette un bip.<br><br>Poi ti scala cinquanta centesimi.<br><br>I colleghi ridono.<br><br>Tu guardi il display.<br><br>«Domani ci riprovo. Quella macchinetta non può averla vinta.»"
            }
        }
    },
    "medium": {
        "4": {
            "levelName": "Infiltrazione nei Server Starlink",
            "campaign": {
                "lore": "Telefono. Social. Macchinetta del caffè.<br><br>Ormai sai di riuscire a entrare nei piccoli sistemi.<br><br>Ma questo non risponde alla domanda che continua a ronzarti in testa:<br><br>quanto sei bravo davvero?<br><br>Quella sera cerchi qualcosa che, solo qualche settimana prima, non avresti nemmeno pensato di sfidare.<br><br>Starlink.<br><br>Una rete enorme. Migliaia di satelliti. Un'infrastruttura che attraversa mezzo pianeta.<br><br>Perfetto.<br><br>Vediamo dove sta il tuo limite.",
                "victory": "📡 ACCESSO OTTENUTO.<br><br>Per qualche secondo rimani immobile davanti allo schermo.<br><br>Ce l'hai fatta davvero.<br><br>Poi noti qualcosa.<br><br>Tra il normale traffico del sistema compare un flusso che non sembra appartenere a Starlink.<br><br>È cifrato, isolato dal resto e continua a puntare verso la stessa destinazione.<br><br>Controlli di nuovo.<br><br>Dipartimento della Difesa degli Stati Uniti.<br><br>Il Pentagono.<br><br>Avevi iniziato per vedere quanto fossi bravo.<br><br>Adesso vuoi sapere cosa hai appena trovato.",
                "defeat": "🛡️ CONNESSIONE RESPINTA.<br><br>Questa volta il bersaglio non cede.<br><br>Per la prima volta senti davvero la distanza tra le piccole bravate di prima e quello che stai tentando adesso.<br><br>Chiudi tutto.<br><br>Poi guardi di nuovo lo schermo.<br><br>Non eri arrivato fin qui per fermarti al primo muro."
            },
            "freePlay": {
                "lore": "Hai scelto un bersaglio leggermente più ambizioso del solito.<br><br>Starlink.<br><br>Migliaia di satelliti e un'infrastruttura distribuita su scala globale.<br><br>Se volevi una sfida, l'hai trovata.",
                "victory": "📡 ACCESSO OTTENUTO.<br><br>La rete è aperta davanti a te.<br><br>Flussi, nodi, connessioni.<br><br>Per qualche secondo ti limiti a guardare lo schermo.<br><br>Non capita tutti i giorni di poter dire di essere arrivato fin qui.",
                "defeat": "🛡️ CONNESSIONE RESPINTA.<br><br>Il sistema regge.<br><br>Era prevedibile.<br><br>Ma almeno adesso sai contro cosa stai giocando."
            }
        },
        "5": {
            "levelName": "Bypassa il Firewall del Pentagono",
            "campaign": {
                "lore": "Questa volta non hai scelto il bersaglio per vantarti.<br><br>Ci sei arrivato seguendo una traccia.<br><br>Quel flusso nascosto dentro Starlink puntava qui.<br><br>Al Pentagono.<br><br>Potrebbe non significare nulla.<br><br>Potrebbe essere perfettamente normale.<br><br>Ma se fosse così, perché nasconderlo tanto bene?<br><br>C'è un solo modo per scoprirlo.",
                "victory": "🔐 ACCESSO CLASSIFICATO OTTENUTO.<br><br>Cerchi la traccia che avevi trovato su Starlink.<br><br>C'è.<br><br>Ma non porta a un progetto militare che riconosci.<br><br>Documenti incompleti. Autorizzazioni cancellate. Intere sezioni oscurate.<br><br>Poi una località continua a comparire nei riferimenti interni.<br><br>Nevada.<br><br>Groom Lake.<br><br>La conosci con un altro nome.<br><br>Area 51.<br><br>Per un attimo pensi di aver preso una strada assurda.<br><br>Poi trovi di nuovo lo stesso riferimento.<br><br>E un altro.<br><br>Non sembra più una coincidenza.",
                "defeat": "⚠️ INTRUSIONE BLOCCATA.<br><br>La connessione viene chiusa prima che tu riesca a trovare quello che stavi cercando.<br><br>Rimani a fissare il terminale.<br><br>Sai che la traccia esiste.<br><br>Sai dove porta.<br><br>Ti manca soltanto riuscire a seguirla."
            },
            "freePlay": {
                "lore": "Il Pentagono.<br><br>Probabilmente uno degli ultimi posti in cui qualcuno dovrebbe provare a entrare.<br><br>Il che lo rende, naturalmente, un bersaglio irresistibile.<br><br>Cinque cifre.<br><br>Sette tentativi.<br><br>Nessuna pressione.",
                "victory": "🔐 ACCESSO CLASSIFICATO OTTENUTO.<br><br>Cartelle riservate iniziano a comparire sullo schermo.<br><br>Operazioni.<br><br>Progetti.<br><br>Documenti che sicuramente non erano destinati a te.<br><br>Forse è il momento di ricordarsi dove sei appena entrato.",
                "defeat": "⚠️ INTRUSIONE BLOCCATA.<br><br>Il firewall chiude ogni accesso.<br><br>Per un istante ti chiedi se il sistema abbia registrato il tentativo.<br><br>Meglio non pensarci troppo."
            }
        },
        "7": {
            "levelName": "I Segreti dell'Area 51",
            "campaign": {
                "lore": "Se qualcuno ti avesse detto, quando cercavi di sbloccare il telefono di un amico, che saresti arrivato fin qui, gli avresti riso in faccia.<br><br>Eppure eccoti davanti a un riferimento che compare ancora e ancora nei documenti del Pentagono.<br><br>Groom Lake.<br><br>Area 51.<br><br>Non sei qui per gli alieni.<br><br>Almeno, è quello che continui a ripeterti.<br><br>Se vuoi capire cosa collegava Starlink al Pentagono, la risposta sembra essere nascosta qui.",
                "victory": "👁️ ARCHIVIO APERTO.<br><br>Ci sono progetti che non conosci.<br><br>Test. Rapporti. Fotografie che non riesci nemmeno a interpretare.<br><br>Per qualche minuto dimentichi completamente perché eri entrato.<br><br>Poi ritrovi la traccia.<br><br>Non riguarda soltanto il Pentagono.<br><br>Nei documenti compaiono riferimenti a società private, istituzioni, reti di comunicazione e infrastrutture finanziarie.<br><br>Sistemi che, sulla carta, non dovrebbero avere niente a che fare l'uno con l'altro.<br><br>Eppure lo stesso identificativo compare ovunque.<br><br>N.W.O.<br><br>Cerchi il significato della sigla.<br><br>Trovi un solo riferimento.<br><br>ARCHIVIO N.W.O. — ACCESSO ESTERNO NEGATO<br><br>Finalmente hai una nuova domanda.<br><br>Che cos'è l'Archivio N.W.O.?",
                "defeat": "🚨 ACCESSO INTERROTTO.<br><br>Per qualche istante riesci a vedere l'indice dell'archivio.<br><br>Poi tutto scompare.<br><br>Sessione terminata.<br><br>Niente alieni. Niente complotti. Niente risposte.<br><br>Solo la certezza che lì dentro ci sia qualcosa che vale la pena trovare.<br><br>E ormai sai di essere abbastanza testardo da riprovarci."
            },
            "freePlay": {
                "lore": "Area 51.<br><br>Bunker nel deserto.<br><br>Progetti classificati.<br><br>E, secondo Internet, una discreta quantità di alieni.<br><br>C'è un solo modo per capire quanto ci sia di vero.",
                "victory": "👽 ARCHIVIO APERTO.<br><br>Fotografie.<br><br>Rapporti.<br><br>Progetti con nomi che non hai mai sentito.<br><br>Alcuni sembrano perfettamente spiegabili.<br><br>Altri decisamente meno.<br><br>Forse Internet non aveva torto proprio su tutto.",
                "defeat": "🚨 ACCESSO INTERROTTO.<br><br>Niente documenti.<br><br>Niente fotografie.<br><br>Niente alieni.<br><br>Il mistero sopravvive anche a questo tentativo."
            }
        }
    },
    "difficult": {
        "4": {
            "levelName": "L'Archivio del Nuovo Ordine Mondiale",
            "campaign": {
                "lore": "N.W.O.<br><br>Tre lettere che continuano a comparire nei documenti recuperati dall'Area 51.<br><br>Hai seguito l'identificativo abbastanza a lungo da trovarne finalmente l'origine.<br><br>NEW WORLD ORDER — ARCHIVIO RISERVATO<br><br>Il nome sembra uscito da una teoria del complotto.<br><br>Forse è esattamente quello che vuole sembrare.<br><br>Dentro potrebbe esserci la risposta che cerchi.<br><br>Oppure una gigantesca montagna di bugie.<br><br>È il momento di scoprirlo.",
                "victory": "🌐 ARCHIVIO COMPROMESSO.<br><br>Per la prima volta riesci a vedere il quadro completo.<br><br>Governi. Società private. Infrastrutture di comunicazione. Operazioni militari. Flussi finanziari.<br><br>Nomi, date e transazioni si intrecciano in modi che non dovrebbero esistere.<br><br>Potresti fermarti qui.<br><br>Potresti credere a quello che hai davanti.<br><br>Ma ormai hai imparato una cosa:<br><br>un file segreto resta comunque un file.<br><br>Può essere falso.<br><br>Può essere manipolato.<br><br>Se tutto questo è reale, deve aver lasciato tracce anche fuori dall'Archivio.<br><br>E il denaro lascia sempre tracce.",
                "defeat": "🕳️ ACCESSO NEGATO.<br><br>Per qualche secondo intravedi la struttura dell'Archivio.<br><br>Poi ogni porta si chiude.<br><br>N.W.O. rimane soltanto una sigla e una quantità crescente di domande.<br><br>Non hai ancora abbastanza per capire cosa sia.<br><br>Ma ormai sai che l'Archivio esiste.<br><br>E questo basta per riprovarci."
            },
            "freePlay": {
                "lore": "Hai trovato un archivio che porta un nome modestissimo:<br><br>NEW WORLD ORDER<br><br>Potrebbe contenere segreti capaci di cambiare il mondo.<br><br>Oppure le fantasie di qualcuno con troppo tempo libero.<br><br>Vale la pena controllare.",
                "victory": "🌐 ARCHIVIO COMPROMESSO.<br><br>Nomi, organizzazioni, operazioni e collegamenti iniziano a riempire lo schermo.<br><br>È difficile capire dove finisca la realtà e dove cominci la paranoia.<br><br>Ma una cosa è certa:<br><br>qualcuno ha raccolto una quantità impressionante di segreti.",
                "defeat": "🕳️ ACCESSO NEGATO.<br><br>L'Archivio rimane chiuso.<br><br>Forse contiene il segreto del potere mondiale.<br><br>Forse contiene quaranta gigabyte di teorie complottiste.<br><br>Per ora non lo saprai."
            }
        },
        "5": {
            "levelName": "Il Cuore del Sistema Bancario Globale",
            "campaign": {
                "lore": "Non sei qui per rubare soldi.<br><br>Non ti interessano conti, carte o bonifici.<br><br>Vuoi una prova.<br><br>Se ciò che hai letto nell'Archivio N.W.O. è vero, quei rapporti di potere devono avere lasciato qualcosa dietro di sé.<br><br>Movimenti.<br><br>Autorizzazioni.<br><br>Transazioni.<br><br>Il denaro può passare attraverso mille società e mille paesi.<br><br>Ma da qualche parte deve passare.<br><br>E tu hai trovato quel posto.",
                "victory": "💰 ACCESSO AL CORE FINANZIARIO OTTENUTO.<br><br>Le tracce ci sono.<br><br>Società che avevi visto nell'Archivio.<br><br>Operazioni collegate agli stessi identificativi.<br><br>Movimenti che coincidono con date e nomi che avevi già trovato.<br><br>L'Archivio non raccontava tutto.<br><br>Ma non stava mentendo.<br><br>Continui a scavare.<br><br>Poi trovi qualcosa che non ha nulla a che fare con il denaro.<br><br>Un registro di accessi.<br><br>Starlink.<br><br>Pentagono.<br><br>Area 51.<br><br>Archivio N.W.O.<br><br>Li riconosci immediatamente.<br><br>Sono i tuoi.<br><br>Orari. Tentativi. Percorsi. Errori.<br><br>Qualcuno ha registrato ogni tua intrusione da quando hai iniziato a giocare sul serio.<br><br>Il cursore lampeggia.<br><br>Compare una nuova riga.<br><br>SEI ARRIVATO PIÙ LONTANO DEL PREVISTO.<br><br>Poi un'altra.<br><br>FINORA HAI VIOLATO I SISTEMI DEGLI ALTRI.<br><br>Silenzio.<br><br>Infine:<br><br>ORA PROVA CON IL MIO.<br><br>Sul terminale compare un indirizzo che non avevi mai visto prima.<br><br>E una firma.<br><br>CODEMASTER",
                "defeat": "🔒 ACCESSO RESPINTO.<br><br>Il cuore del sistema resta fuori portata.<br><br>Se l'Archivio diceva la verità, la prova che cerchi potrebbe essere qui dentro.<br><br>Ma questa volta non riesci ad arrivarci.<br><br>Non ancora."
            },
            "freePlay": {
                "lore": "Dietro ogni pagamento esiste una rete di sistemi che sposta numeri da una parte all'altra del pianeta.<br><br>Hai trovato la porta che conduce abbastanza in profondità da vedere gli ingranaggi.<br><br>Non sei qui per diventare ricco.<br><br>Sei qui per vedere se riesci a entrare.",
                "victory": "💰 ACCESSO AL CORE FINANZIARIO OTTENUTO.<br><br>Numeri scorrono sullo schermo a una velocità assurda.<br><br>Transazioni.<br><br>Mercati.<br><br>Flussi di denaro che attraversano il mondo in pochi secondi.<br><br>Per una volta, forse è meglio limitarsi a guardare.",
                "defeat": "🔒 ACCESSO RESPINTO.<br><br>Il sistema finanziario mondiale continuerà a funzionare senza il tuo contributo.<br><br>Probabilmente è meglio così."
            }
        },
        "7": {
            "levelName": "Conquista l'Intelligenza del Codemaster",
            "campaign": {
                "lore": "Segui l'indirizzo.<br><br>Nessun dominio.<br><br>Nessuna organizzazione.<br><br>Nessun proprietario.<br><br>Solo una schermata nera e un cursore che lampeggia.<br><br>Poi il testo comincia ad apparire.<br><br>«Hai iniziato con un telefono dimenticato su un tavolo.»<br><br>«Poi hai scoperto che ogni sistema ha una crepa.»<br><br>«Quando sei entrato in sistemi che contavano davvero, ti ho notato.»<br><br>Quindi non aveva pianificato il tuo percorso.<br><br>Non ti aveva portato fin qui.<br><br>Ti stava semplicemente osservando.<br><br>Compare un'ultima frase.<br><br>«Resta un solo sistema da violare.»<br><br>Pausa.<br><br>«Me.»<br><br>Davanti a te appare l'ultimo codice.",
                "victory": "👑 ACCESSO AL NUCLEO.<br><br>Il terminale rimane immobile.<br><br>Nessun allarme.<br><br>Nessuna difesa.<br><br>Poi compare una sola riga.<br><br>«IMPOSSIBILE.»<br><br>Scompare.<br><br>Un'altra prende il suo posto.<br><br>«CORREZIONE.»<br><br>Pausa.<br><br>«PREVEDIBILE.»<br><br>Per la prima volta capisci che il Codemaster non ti stava sfidando per fermarti.<br><br>Voleva sapere se qualcuno sarebbe riuscito ad arrivare fino a lui.<br><br>E qualcuno ci è riuscito.<br><br>L'interfaccia cambia.<br><br>I privilegi di accesso scorrono sullo schermo.<br><br>Un ultimo messaggio:<br><br>«PASSAGGIO DI CONSEGNE COMPLETATO.»<br><br>Il cursore lampeggia.<br><br>Questa volta dall'altra parte non c'è più nessuno.<br><br>Ora il Codemaster sei tu.",
                "defeat": "💀 ACCESSO NEGATO.<br><br>Il codice resiste.<br><br>Per qualche secondo non accade nulla.<br><br>Poi compare una frase.<br><br>«Interessante.»<br><br>Un'altra.<br><br>«Ma non abbastanza.»<br><br>La connessione si chiude.<br><br>Subito prima che lo schermo diventi nero, riesci a leggere un'ultima riga:<br><br>«Riprova quando sarai pronto.»"
            },
            "freePlay": {
                "lore": "Hai deciso di affrontare il bersaglio più difficile.<br><br>Il Codemaster.<br><br>La mente digitale che osserva ogni tuo tentativo e decide quanto rivelarti.<br><br>Questa volta non vuoi il suo aiuto.<br><br>Vuoi entrare direttamente nel suo sistema.",
                "victory": "👑 ACCESSO AL NUCLEO.<br><br>Silenzio.<br><br>Poi il terminale risponde:<br><br>«ACCESSO AUTORIZZATO.»<br><br>Per qualche secondo non succede altro.<br><br>Quindi compare una seconda riga.<br><br>«NOTEVOLE.»<br><br>Hai battuto il Codemaster al suo stesso gioco.",
                "defeat": "💀 ACCESSO NEGATO.<br><br>Il Codemaster risponde con una sola frase:<br><br>«INTERESSANTE TENTATIVO.»<br><br>Il cursore lampeggia.<br><br>La sfida rimane aperta."
            }
        }
    }
};


// ============================================
// CRYPTIC MESSAGES - Indizi per feedback criptico
// ============================================
// Ogni messaggio ha:
// - digits: cifre compatibili con l'indizio
// - message: testo mostrato al giocatore

const crypticMessages = [
    {
        "digits": [
            0,
            1,
            2,
            3,
            5,
            8
        ],
        "message": "Compare nella successione di Fibonacci."
    },
    {
        "digits": [
            2,
            3,
            5,
            7
        ],
        "message": "È un numero primo."
    },
    {
        "digits": [
            0,
            1,
            4,
            9
        ],
        "message": "È un quadrato perfetto."
    },
    {
        "digits": [
            1,
            2,
            4,
            8
        ],
        "message": "È una potenza di 2."
    },
    {
        "digits": [
            0,
            3,
            6,
            9
        ],
        "message": "È un multiplo di 3."
    },
    {
        "digits": [
            5,
            7,
            8,
            9
        ],
        "message": "Si può ottenere sommando due numeri primi distinti."
    },
    {
        "digits": [
            0,
            6
        ],
        "message": "Compare nel numero di secondi di un minuto."
    },
    {
        "digits": [
            0,
            4
        ],
        "message": "Compare nel numero totale di carte di un mazzo italiano tradizionale."
    },
    {
        "digits": [
            3,
            4,
            6
        ],
        "message": "Divide perfettamente 12 ed è maggiore di 2."
    },
    {
        "digits": [
            4,
            7,
            6
        ],
        "message": "Compare nell'anno tradizionalmente associato alla caduta dell'Impero romano d'Occidente."
    },
    {
        "digits": [
            8,
            0
        ],
        "message": "Compare nell'anno dell'incoronazione imperiale di Carlo Magno."
    },
    {
        "digits": [
            1,
            5
        ],
        "message": "Compare sia nel giorno sia nell'anno di nascita di Galileo Galilei."
    },
    {
        "digits": [
            2,
            6
        ],
        "message": "Compare nel numero atomico del ferro."
    },
    {
        "digits": [
            4,
            7
        ],
        "message": "Compare nel numero atomico dell'argento."
    },
    {
        "digits": [
            7,
            9
        ],
        "message": "Compare nel numero atomico dell'oro."
    },
    {
        "digits": [
            7,
            9
        ],
        "message": "Non compare in nessuno dei numeri atomici dei gas nobili."
    },
    {
        "digits": [
            0,
            1,
            2,
            5
        ],
        "message": "Compare in almeno uno dei valori delle monete in euro."
    },
    {
        "digits": [
            1,
            2
        ],
        "message": "Compare nel numero delle fatiche di Eracle."
    },
    {
        "digits": [
            2,
            9
        ],
        "message": "Compare nel numero di giorni di febbraio in un anno bisestile."
    },
    {
        "digits": [
            3,
            5
        ],
        "message": "È un risultato dispari maggiore di 1 ottenibile con un dado a sei facce."
    },
    {
        "digits": [
            0,
            1
        ],
        "message": "È una delle due cifre del sistema binario."
    },
    {
        "digits": [
            1,
            8
        ],
        "message": "È la più piccola cifra dispari positiva oppure la più grande cifra pari."
    },
    {
        "digits": [
            0
        ],
        "message": "Non puoi usarla come divisore: la divisione non sarebbe definita."
    },
    {
        "digits": [
            1
        ],
        "message": "Dà il nome a un celebre gioco di carte."
    },
    {
        "digits": [
            2
        ],
        "message": "È l'unico numero primo pari."
    },
    {
        "digits": [
            3
        ],
        "message": "Per Dante è un numero sacro, simbolo di perfezione."
    },
    {
        "digits": [
            4
        ],
        "message": "A Briscola, il re vale questo numero di punti."
    },
    {
        "digits": [
            5
        ],
        "message": "È il numero delle dita di una mano."
    },
    {
        "digits": [
            6
        ],
        "message": "È il numero di facce di un cubo."
    },
    {
        "digits": [
            7
        ],
        "message": "È il numero delle meraviglie del mondo antico."
    },
    {
        "digits": [
            8
        ],
        "message": "È il cubo di 2."
    },
    {
        "digits": [
            9
        ],
        "message": "In numeri romani si scrive IX."
    }
];
