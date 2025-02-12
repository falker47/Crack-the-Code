// Variabili globali
let codeLength = 4;
let difficulty = null; // "easy", "medium", "difficult"
let secretCode = "";
let attempts = 0;
let startTime = null;
let difficultyMultiplier = 1; // easy:1, medium:2, difficult:3
let allowedAttempts = 0;

// Mapping slider (0->4, 1->5, 2->7)
const sliderMapping = { 0: 4, 1: 5, 2: 7 };

// Mapping dei livelli: per ciascun binomio (difficoltà + lunghezza) c'è il nome e la lore
const levelData = {
  "easy": {
    4: {
      levelName: "Sblocca il Telefono del Bro",
      lore: "Il telefono del tuo amico è incustodito e nasconde segreti che solo tu puoi sbloccare. Un piccolo gesto che potrebbe cambiare le sorti di una serata."
    },
    5: {
      levelName: "Hackera l'account Instagram di quella persona poco simpatica",
      lore: "Dietro i post patinati si nascondono verità scomode. Metti alla prova il tuo ingegno per scoprire cosa si cela dietro i filtri."
    },
    7: {
      levelName: "Hackera la vending machine del tuo ufficio",
      lore: "La vending machine dell'ufficio non è solo un distributore di snack: potrebbe custodire segreti nascosti tra le sue monete."
    }
  },
  "medium": {
    4: {
      levelName: "Accedi al server privato di Starlink",
      lore: "Starlink custodisce informazioni riservate in un server segreto. Solo un vero hacker potrà penetrare le sue difese."
    },
    5: {
      levelName: "Bypassa il firewall del Pentagono",
      lore: "Il Pentagono protegge i suoi segreti con firewall impenetrabili, ma il tuo ingegno potrebbe essere la chiave per abbatterli."
    },
    7: {
      levelName: "Scopri i segreti dell'Area 51",
      lore: "L'Area 51 è avvolta nel mistero e custodisce segreti extraterrestri. Preparati a svelare l'ignoto e a mettere in discussione tutto ciò che credevi di sapere."
    }
  },
  "difficult": {
    4: {
      levelName: "Accedi all'Archivio del Nuovo Ordine Mondiale",
      lore: "Nel cuore del Nuovo Ordine Mondiale, archivi segreti attendono di essere scoperti. Il potere è nelle tue mani."
    },
    5: {
      levelName: "Hackera le banche mondiali",
      lore: "Dietro le quinte delle banche si celano verità nascoste. Dimostra il tuo ingegno e accedi ai segreti delle finanze globali."
    },
    7: {
      levelName: "Prendi possesso della AI del Codemaster",
      lore: "La AI del Codemaster è una mente potente e misteriosa. Diventa il suo padrone e riscrivi le regole del potere digitale."
    }
  }
};

// Elementi DOM
const codeLengthSlider = document.getElementById("codeLengthSlider");
const codeLengthDisplay = document.getElementById("codeLengthDisplay");
const feedbackButtons = document.querySelectorAll(".feedback-btn");
const confirmLevelBtn = document.getElementById("confirmLevelBtn");
const menuConsole = document.getElementById("menuConsole");
const menuDiv = document.getElementById("menu");

const loreScreen = document.getElementById("loreScreen");
const loreConsole = document.getElementById("loreConsole");
const startLevelBtn = document.getElementById("startLevelBtn");

const gameDiv = document.getElementById("game");
const consoleDiv = document.getElementById("console");
const guessForm = document.getElementById("guessForm");
const gameOverDiv = document.getElementById("gameOver");
const finalMessageP = document.getElementById("finalMessage");
const restartBtn = document.getElementById("restartBtn");
const quitGameBtn = document.getElementById("quitGameBtn");

// Aggiorna la visualizzazione della lunghezza
codeLengthSlider.addEventListener("input", function() {
  codeLength = sliderMapping[this.value];
  codeLengthDisplay.textContent = codeLength + " cifre";
  updateMenuConsole();
});

// Gestione della selezione della difficoltà
feedbackButtons.forEach(btn => {
  btn.addEventListener("click", function() {
    feedbackButtons.forEach(b => b.classList.remove("selected"));
    this.classList.add("selected");
    difficulty = this.getAttribute("data-difficulty");
    if (difficulty === "easy") {
      difficultyMultiplier = 1;
    } else if (difficulty === "medium") {
      difficultyMultiplier = 2;
    } else if (difficulty === "difficult") {
      difficultyMultiplier = 3;
    }
    updateMenuConsole();
  });
});

// Funzione per aggiornare la console del menu con il titolo del livello e la riga fissa riassuntiva
function updateMenuConsole() {
  if (difficulty && codeLength) {
    const data = levelData[difficulty][codeLength];
    let difficultyText = "";
    if(difficulty === "easy") difficultyText = "Facile";
    else if(difficulty === "medium") difficultyText = "Medio";
    else if(difficulty === "difficult") difficultyText = "Difficile";
    
    // Imposta la classe in base al codeLength per il colore
    let lengthClass = "";
    if (codeLength == 4) lengthClass = "length-green";
    else if (codeLength == 5) lengthClass = "length-yellow";
    else if (codeLength == 7) lengthClass = "length-red";
    
    // Utilizziamo due div: uno per il titolo e uno fisso per il riepilogo
    let html = `<div class="levelTitleContainer">${data.levelName}</div>`;
    html += `<div class="summaryLine">Codice: <span class="codeLengthIndicator ${lengthClass}">${codeLength} cifre</span> &nbsp;|&nbsp; Difficoltà: <span class="difficultyIndicator ${difficulty}">${difficultyText}</span></div>`;
    menuConsole.innerHTML = html;
  } else {
    // Testo iniziale con doppio invio per la riga vuota
    menuConsole.textContent = "Scegli le impostazioni per iniziare la sfida.\n\nInserisci la lunghezza del codice che vuoi crackare e quanto la AI del Codemaster può aiutarti";
  }
}

// Al click sul pulsante "Conferma Livello"
confirmLevelBtn.addEventListener("click", function() {
  if (!difficulty) {
    alert("Per favore, seleziona una difficoltà!");
    return;
  }
  const data = levelData[difficulty][codeLength];
  if (!data) {
    alert("Impostazioni incomplete!");
    return;
  }
  // Imposta i tentativi consentiti in base alla difficoltà
  if (difficulty === "easy") {
    allowedAttempts = 20;
  } else if (difficulty === "medium") {
    allowedAttempts = 15;
  } else if (difficulty === "difficult") {
    allowedAttempts = 10;
  }
  loreConsole.innerHTML = `<strong>${data.levelName}</strong><br><br>${data.lore}<br><br><em>Tentativi disponibili: ${allowedAttempts}</em>`;
  menuDiv.classList.add("hidden");
  loreScreen.classList.remove("hidden");
});

// Al click sul pulsante "Parti la Sfida!" passa al gioco
startLevelBtn.addEventListener("click", function() {
  loreScreen.classList.add("hidden");
  gameDiv.classList.remove("hidden");
  startGame();
});

// Avvia la sfida: genera il codice segreto, crea gli input PIN, ecc.
function startGame() {
  const devToggle = document.getElementById("devToggle");
  secretCode = generateSecretCode(codeLength);
  attempts = 0;
  startTime = Date.now();
  consoleDiv.innerHTML = "";
  addMessage("codemaster", "Benvenuto, sfida accettata. Inizia a crackare il codice...");
  if (devToggle.checked) {
    addMessage("codemaster", "DEV MODE: Il codice segreto è " + secretCode);
  }
  const pinInputContainer = document.getElementById("pinInputContainer");
  pinInputContainer.innerHTML = "";
  for (let i = 0; i < codeLength; i++) {
    let input = document.createElement("input");
    input.type = "tel";
    input.inputMode = "numeric";
    input.maxLength = 1;
    input.classList.add("pin-input");
    input.autocomplete = "off";
    input.pattern = "[0-9]";
    pinInputContainer.appendChild(input);
  }
  const pinInputs = document.querySelectorAll(".pin-input");
  pinInputs.forEach((input, index) => {
    input.addEventListener("input", function() {
      if (!/^\d$/.test(this.value)) {
        this.value = "";
        return;
      }
      if (index < pinInputs.length - 1) {
        pinInputs[index + 1].focus();
      }
    });
    input.addEventListener("keydown", function(e) {
      if (e.key === "Backspace" && this.value === "" && index > 0) {
        pinInputs[index - 1].focus();
      }
    });
  });
  if (pinInputs.length > 0) {
    pinInputs[0].focus();
  }
}

// Funzione per aggiungere messaggi alla console
function addMessage(sender, text) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message", sender);
  msgDiv.textContent = text;
  consoleDiv.appendChild(msgDiv);
  consoleDiv.scrollTop = consoleDiv.scrollHeight;
}

// Genera un codice segreto con cifre uniche
function generateSecretCode(length) {
  let digits = ['0','1','2','3','4','5','6','7','8','9'];
  for (let i = digits.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }
  return digits.slice(0, length).join("");
}

// Valuta il tentativo: calcola hit e blow (gestendo eventuali duplicati nel tentativo)
function evaluateGuess(guess) {
  let hit = 0, blow = 0;
  let secretUsed = new Array(codeLength).fill(false);
  let guessUsed = new Array(codeLength).fill(false);
  for (let i = 0; i < codeLength; i++) {
    if (guess[i] === secretCode[i]) {
      hit++;
      secretUsed[i] = true;
      guessUsed[i] = true;
    }
  }
  for (let i = 0; i < codeLength; i++) {
    if (!guessUsed[i]) {
      for (let j = 0; j < codeLength; j++) {
        if (!secretUsed[j] && guess[i] === secretCode[j]) {
          blow++;
          secretUsed[j] = true;
          break;
        }
      }
    }
  }
  return { hit, blow };
}

// Feedback grafico per modalità facile; testuale per le altre
function getFeedbackMessage(evaluation) {
  const { hit, blow } = evaluation;
  if (difficulty === "easy") {
    const misses = codeLength - (hit + blow);
    return `Feedback: ${"🟢".repeat(hit)} ${"🟡".repeat(blow)} ${"⚪".repeat(misses)}`;
  } else if (difficulty === "medium") {
    const total = hit + blow;
    if (total === 1) {
      return "Il tuo tentativo ha 1 cifra corretta in totale. Continua!";
    } else {
      return `Il tuo tentativo ha ${total} cifre corrette in totale. Continua!`;
    }
  } else if (difficulty === "difficult") {
    let total = hit + blow;
    if (total === 0) {
      return "Zero colpi... Il Codemaster ride di te.";
    } else if (total < codeLength / 2) {
      return "Non male, ma il mistero persiste. Riprova!";
    } else if (total === codeLength - 1) {
      return "Sei quasi arrivato, ma il Codemaster sa ancora come sfidarti.";
    } else {
      return "Il tuo tentativo è intrigante, ma non basta per svelare il segreto.";
    }
  }
  return "";
}

// Calcola il punteggio (formula semplificata)
function calculateScore(elapsedSeconds) {
  const base = codeLength * 1000 * difficultyMultiplier;
  return Math.round(base / (attempts * elapsedSeconds));
}

// Gestione dell'invio del tentativo
guessForm.addEventListener("submit", function(e) {
  e.preventDefault();
  const pinInputs = document.querySelectorAll(".pin-input");
  let guess = "";
  pinInputs.forEach(input => { guess += input.value; });
  
  const regex = new RegExp(`^\\d{${codeLength}}$`);
  if (!regex.test(guess)) {
    addMessage("codemaster", `Il codice deve essere composto da ${codeLength} cifre. Riprova.`);
    pinInputs.forEach(input => input.value = "");
    pinInputs[0].focus();
    return;
  }
  
  attempts++;
  addMessage("player", guess);
  const evaluation = evaluateGuess(guess);
  const feedbackMsg = getFeedbackMessage(evaluation);
  addMessage("codemaster", feedbackMsg);
  
  if (guess === secretCode) {
    const elapsedSeconds = Math.max((Date.now() - startTime) / 1000, 1);
    const score = calculateScore(elapsedSeconds);
    addMessage("codemaster", "Codice sbloccato! Bravo, hai completato la sfida.");
    addMessage("codemaster", `Tentativi: ${attempts} | Tempo: ${elapsedSeconds.toFixed(1)} sec | Punteggio: ${score}`);
    finalMessageP.textContent = `Sfida completata in ${attempts} tentativi e ${elapsedSeconds.toFixed(1)} secondi. Punteggio: ${score}`;
    gameOverDiv.classList.remove("hidden");
    gameDiv.classList.add("hidden");
  } else {
    let remaining = allowedAttempts - attempts;
    if (remaining > 0) {
      addMessage("codemaster", `Tentativi rimanenti: ${remaining}`);
    } else {
      addMessage("codemaster", `Tentativi esauriti! Il codice segreto era ${secretCode}.`);
      finalMessageP.textContent = `Tentativi esauriti! Il codice era ${secretCode}.`;
      gameOverDiv.classList.remove("hidden");
      gameDiv.classList.add("hidden");
    }
  }
  
  pinInputs.forEach(input => input.value = "");
  pinInputs[0].focus();
});

// Tasto "Abbandona Partita"
quitGameBtn.addEventListener("click", function() {
  if (confirm("Sei sicuro di voler abbandonare la partita?")) {
    menuDiv.classList.remove("hidden");
    gameDiv.classList.add("hidden");
    gameOverDiv.classList.add("hidden");
  }
});

// Pulsante di restart (Ricomincia)
restartBtn.addEventListener("click", function() {
  menuDiv.classList.remove("hidden");
  gameOverDiv.classList.add("hidden");
});

// Gestione della Clue Board: alterna stato "marked" al click
document.querySelectorAll(".clue-digit").forEach(digit => {
  digit.addEventListener("click", function() {
    this.classList.toggle("marked");
  });
});
