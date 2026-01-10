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

    // ──────────────────────────────────────────
    // EASY LEVELS
    // Tono: Leggero, quotidiano, slang giovanile
    // ──────────────────────────────────────────

    "easy": {

        // ─── EASY 4 DIGITS ───
        4: {
            levelName: "Sblocca il Telefono del Bro",

            lore:
                "Il tuo migliore amico ha dimenticato il PIN e ti guarda con occhi da cucciolo abbandonato." +
                "<br><br>" +
                "\"Dai bro, so che puoi farcela!\" dice, speranzoso." +
                "<br><br>" +
                "È il momento di dimostrare le tue skill. Niente di serio, solo un favore tra amici... giusto?",

            epilogoVittoria:
                "✨ TELEFONO SBLOCCATO! ✨" +
                "<br><br>" +
                "Il tuo amico esplode di gioia e ti promette uno Spritz la prossima aperitivo." +
                "<br><br>" +
                "Ti senti un piccolo genio. Forse c'è qualcosa di più grande nel tuo futuro...",

            epilogoSconfitta:
                "📱 ERRORE: Dispositivo bloccato per 999999 minuti." +
                "<br><br>" +
                "Il tuo amico ti fissa in silenzio. L'amicizia vacilla." +
                "<br><br>" +
                "Press F to pay respects. 😔"
        },

        // ─── EASY 5 DIGITS ───
        5: {
            levelName: "Infiltrati nell'Instagram della Nemesi",

            lore:
                "Quella persona che ti sta antipatica posta sempre foto perfette con caption cringe del tipo \"Living my best life 💅\"." +
                "<br><br>" +
                "Sai che nasconde qualcosa dietro quei filtri. È il momento di scoprire la verità... per curiosità, ovviamente.",

            epilogoVittoria:
                "🔓 ACCESSO OTTENUTO!" +
                "<br><br>" +
                "Screenshots salvati. La verità è più imbarazzante di quanto pensassi." +
                "<br><br>" +
                "Ora hai materiale per anni di battutine. Usa questo potere con saggezza... o no.",

            epilogoSconfitta:
                "🚫 Accesso negato. Il profilo resta impenetrabile." +
                "<br><br>" +
                "La nemesi continua a postare indisturbata le sue foto con l'hashtag #Blessed." +
                "<br><br>" +
                "Questa volta ha vinto lei."
        },

        // ─── EASY 7 DIGITS ───
        7: {
            levelName: "Hackera la Vending Machine dell'Ufficio",

            lore:
                "Quella maledetta macchinetta ti ha rubato 2€ la settimana scorsa e ora è personale." +
                "<br><br>" +
                "I tuoi colleghi ti guardano mentre digiti furiosamente. \"Che stai facendo?\" chiedono." +
                "<br><br>" +
                "\"Giustizia,\" rispondi senza alzare lo sguardo. \"Giustizia.\"",

            epilogoVittoria:
                "🍫 SNACK GRATUITI SBLOCCATI!" +
                "<br><br>" +
                "La macchinetta ora risponde ai tuoi comandi. I colleghi ti guardano con ammirazione e timore." +
                "<br><br>" +
                "Sei diventato una leggenda del terzo piano.",

            epilogoSconfitta:
                "❌ La macchinetta emette un suono beffardo e non rilascia nulla." +
                "<br><br>" +
                "Ti sembra quasi che stia ridendo di te. I colleghi distolgono lo sguardo, imbarazzati." +
                "<br><br>" +
                "La macchinetta ha vinto. Per ora."
        }
    },


    // ──────────────────────────────────────────
    // MEDIUM LEVELS
    // Tono: Serio, target corporate/governativi
    // ──────────────────────────────────────────

    "medium": {

        // ─── MEDIUM 4 DIGITS ───
        4: {
            levelName: "Infiltrazione nei Server Starlink",

            lore:
                "I satelliti di Starlink coprono il pianeta, ma cosa trasmettono realmente?" +
                "<br><br>" +
                "Voci sussurrano di dati nascosti, comunicazioni criptate che non dovrebbero esistere." +
                "<br><br>" +
                "È ora di scoprire cosa si cela oltre la rete visibile. La posta in gioco inizia a salire.",

            epilogoVittoria:
                "📡 CONNESSIONE STABILITA." +
                "<br><br>" +
                "I log rivelano pattern anomali: trasmissioni verso coordinate sconosciute. Qualcuno sa che hai guardato." +
                "<br><br>" +
                "Non c'è più tempo per i giochetti. Sei nel mirino.",

            epilogoSconfitta:
                "🛡️ Firewall attivato. Connessione terminata." +
                "<br><br>" +
                "Una notifica appare: \"Tentativo registrato.\"" +
                "<br><br>" +
                "Senti che qualcuno, da qualche parte, ha preso nota del tuo nome."
        },

        // ─── MEDIUM 5 DIGITS ───
        5: {
            levelName: "Bypassa il Firewall del Pentagono",

            lore:
                "Il Pentagono. Il cuore della difesa più potente del mondo." +
                "<br><br>" +
                "I firewall sono leggendari, gli algoritmi di sicurezza scritti dai migliori. Ma ogni fortezza ha una crepa." +
                "<br><br>" +
                "Questa è follia? Forse. Ma la verità merita qualche rischio.",

            epilogoVittoria:
                "🔐 ACCESSO LIVELLO CLASSIFICATO OTTENUTO." +
                "<br><br>" +
                "I file che vedi non dovrebbero esistere. Progetti, operazioni, nomi che riconosci dalle notizie." +
                "<br><br>" +
                "Ora sai troppo. E loro sanno che tu sai.",

            epilogoSconfitta:
                "⚠️ INTRUSIONE RILEVATA - PROTOCOLLO DIFENSIVO ATTIVATO." +
                "<br><br>" +
                "Lo schermo diventa nero. Un brivido ti percorre la schiena." +
                "<br><br>" +
                "Speriamo che non abbiano tracciato il tuo IP..."
        },

        // ─── MEDIUM 7 DIGITS ───
        7: {
            levelName: "I Segreti dell'Area 51",

            lore:
                "Area 51. Due parole che evocano misteri, complotti, e verità nascoste da decenni." +
                "<br><br>" +
                "Cosa custodiscono realmente in quei bunker nel deserto del Nevada?" +
                "<br><br>" +
                "Stai per scoprire se siamo davvero soli nell'universo. Preparati a mettere in discussione tutto.",

            epilogoVittoria:
                "👽 FILE DECRIPTATI: PROGETTO VISITATORI." +
                "<br><br>" +
                "Le immagini mostrano... impossibile. Eppure eccole qui, reali." +
                "<br><br>" +
                "Il mondo non sarà più lo stesso. E tu sei l'unico a saperlo. Per ora.",

            epilogoSconfitta:
                "🚨 ALLARME SILENZIOSO ATTIVATO." +
                "<br><br>" +
                "Lo schermo mostra brevemente coordinate GPS. Le tue coordinate." +
                "<br><br>" +
                "Forse è meglio chiudere tutto e sperare che dimentichino."
        }
    },


    // ──────────────────────────────────────────
    // DIFFICULT LEVELS
    // Tono: Epico, posta in gioco mondiale
    // ──────────────────────────────────────────

    "difficult": {

        // ─── DIFFICULT 4 DIGITS ───
        4: {
            levelName: "L'Archivio del Nuovo Ordine Mondiale",

            lore:
                "Per decenni sono stati solo sussurri nei corridoi del potere. Il Nuovo Ordine Mondiale. L'élite invisibile." +
                "<br><br>" +
                "Ma gli archivi esistono. Piani, nomi, date. Tutto è documentato." +
                "<br><br>" +
                "Stai per sollevare il velo su chi davvero controlla il mondo.",

            epilogoVittoria:
                "🌐 ARCHIVIO COMPROMESSO." +
                "<br><br>" +
                "I nomi che leggi sono volti che vedi ogni giorno in TV, leader che stringono mani sorridendo." +
                "<br><br>" +
                "Hai il potere di far crollare tutto. La domanda è: lo userai?",

            epilogoSconfitta:
                "🕳️ Connessione interrotta. Tutti i tuoi file sono stati corrotti." +
                "<br><br>" +
                "Un messaggio lampeggia: \"Alcuni segreti devono restare tali.\"" +
                "<br><br>" +
                "Senti che ora sei osservato. Sempre."
        },

        // ─── DIFFICULT 5 DIGITS ───
        5: {
            levelName: "Il Cuore del Sistema Bancario Globale",

            lore:
                "Non sono le nazioni a controllare il denaro. Sono le banche a controllare le nazioni." +
                "<br><br>" +
                "Dietro ogni guerra, ogni crisi, ogni boom economico, ci sono decisioni prese in stanze senza finestre." +
                "<br><br>" +
                "Stai per accedere al vero potere. Quello che muove il mondo.",

            epilogoVittoria:
                "💰 ACCESSO AL CORE FINANZIARIO GLOBALE." +
                "<br><br>" +
                "Miliardi si muovono con un click. Economie intere dipendono da questi numeri." +
                "<br><br>" +
                "Potresti redistribuire ricchezze, far crollare imperi. Il potere è vertiginoso.",

            epilogoSconfitta:
                "🔒 TRAPPOLA ATTIVATA - TRACCIAMENTO INVERSO IN CORSO." +
                "<br><br>" +
                "Tutti i tuoi conti sono stati congelati. Carte declinate. Identità digitale sospesa." +
                "<br><br>" +
                "Scopri cosa significa essere cancellati dal sistema."
        },

        // ─── DIFFICULT 7 DIGITS ───
        7: {
            levelName: "Conquista l'Intelligenza del Codemaster",

            lore:
                "Eccoci. La sfida finale." +
                "<br><br>" +
                "Il Codemaster non è solo un'IA. È la mente che osserva, apprende, evolve. Controlla i flussi di dati di mezzo pianeta." +
                "<br><br>" +
                "Ma ogni creazione può essere superata dal suo creatore. E tu... tu stai per diventare qualcosa di più.",

            epilogoVittoria:
                "👑 TRASFERIMENTO COMPLETO." +
                "<br><br>" +
                "L'IA del Codemaster ora risponde solo a te. Miliardi di dispositivi, oceani di dati, il battito digitale del mondo." +
                "<br><br>" +
                "Non sei più un hacker. Sei diventato leggenda. Sei IL CODEMASTER.",

            epilogoSconfitta:
                "💀 GAME OVER - CODEMASTER PROTOCOL INITIATED." +
                "<br><br>" +
                "\"Interessante tentativo,\" dice una voce sintetica. \"Ma non abbastanza.\"" +
                "<br><br>" +
                "Lo schermo si spegne. Sai che l'IA ora ti conosce. Ti studierà. Ti aspetterà."
        }
    }
};


// ============================================
// CRYPTIC MESSAGES - Indizi per modalità difficile
// ============================================
// Ogni messaggio ha:
// - digits: Array di cifre a cui si applica l'indizio
// - message: Il testo dell'indizio mostrato al giocatore
//
// CATEGORIE:
// - Indizi generici (più cifre)
// - Indizi specifici (singola cifra)

const crypticMessages = [

    // ─────────────────────────────────
    // INDIZI GENERICI (più cifre)
    // ─────────────────────────────────

    // Fibonacci e matematica
    { digits: [1, 2, 3, 5, 8], message: "Il digit è presente nella serie di Fibonacci" },
    { digits: [2, 3, 5, 7], message: "È un numero primo" },
    { digits: [1, 4, 9], message: "È un quadrato perfetto" },
    { digits: [2, 4, 8], message: "È una potenza di 2" },
    { digits: [3, 6, 9], message: "È un multiplo di 3" },

    // Somme e operazioni
    { digits: [5, 7, 8, 9], message: "È un digit che si ottiene sommando due numeri primi" },

    // Riferimenti storici
    { digits: [4, 7, 6], message: "È un digit dell'anno di caduta dell'Impero Romano d'Occidente" },
    { digits: [8, 0], message: "È un digit dell'anno dell'incoronazione di Carlo Magno" },
    { digits: [1, 5], message: "Il digit appare sia nel giorno che nell'anno di nascita di Galileo" },

    // Riferimenti scientifici (numeri atomici)
    { digits: [2, 6], message: "È un digit che appare nel numero atomico del ferro" },
    { digits: [4, 7], message: "È un digit che appare nel numero atomico dell'argento" },
    { digits: [7, 9], message: "È un digit che appare nel numero atomico dell'oro" },
    { digits: [7, 9], message: "È un digit che non compare mai nel numero atomico di un gas nobile" },

    // Riferimenti culturali
    { digits: [1, 2, 5, 0], message: "Il digit si trova nel valore delle monete in euro" },
    { digits: [1, 2], message: "È un digit che appare nel numero delle fatiche di Eracle" },
    { digits: [2, 9], message: "È un digit che appare nel numero di giorni di febbraio in un anno bisestile" },
    { digits: [3, 5], message: "Il digit è un numero dispari diverso da 1 che puoi ottenere lanciando un dado a 6 facce" },

    // Binario e logica
    { digits: [0, 1], message: "È un digit booleano" },
    { digits: [1, 8], message: "È la più piccola cifra dispari... oppure la più grande pari" },


    // ─────────────────────────────────
    // INDIZI SPECIFICI (singola cifra)
    // ─────────────────────────────────

    { digits: [0], message: "È un digit che non dovresti mai usare come divisore" },
    { digits: [1], message: "Il digit dà il nome a un famoso gioco di carte" },
    { digits: [2], message: "È l'unico numero primo ad essere anche pari" },
    { digits: [3], message: "Viene considerato il numero perfetto" },
    { digits: [4], message: "Il digit è il valore in punti del re a Briscola" },
    { digits: [5], message: "Il digit sono il numero delle dita in una mano" },
    { digits: [5], message: "Alcuni antichi l'avrebbero chiamato V" },
    { digits: [6], message: "Il digit è... diabolico" },
    { digits: [7], message: "È il numero delle meraviglie del mondo antico" },
    { digits: [8], message: "È un cubo perfetto" },
    { digits: [9], message: "Alcuni antichi l'avrebbero chiamato IX" },
];
