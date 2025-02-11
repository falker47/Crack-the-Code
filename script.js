// Variabili globali
let codeLength = 4;
let difficulty = null; // "easy", "medium", "difficult"
let secretCode = "";
let attempts = 0;
let startTime = null;
let difficultyMultiplier = 1; // easy:1, medium:2, difficult:3

// Mapping slider (0->4, 1->5, 2->7)
const sliderMapping = {
  0: 4,
  1: 5,
  2: 7
};

// Elementi DOM
const codeLengthSlider = document.getElementById("codeLengthSlider");
const codeLengthDisplay = document.getElementById("codeLengthDisplay");
const feedbackButtons = document.querySelectorAll(".feedback-btn");
const startGameBtn = document.getElementById("startGameBtn");
const menuDiv = document.getElementById("menu");

const gameDiv = document.getElementById("game");
const consoleDiv = document.getElementById("console");
const guessForm = document.getElementById("guessForm");
const gameOverDiv = document.getElementById("gameOver");
const finalMessageP = document.getElementById("finalMessage");
const restartBtn = document.getElementById("restartBtn");
const quitGameBtn = document.getElementById("quitGameBtn");

// --- Funzioni di utilità ---

// Aggiorna la visualizzazione della lunghezza in base allo slider
codeLengthSlider.addEventListener("input", function() {
  codeLength = sliderMapping[this.value];
  codeLengthDisplay.textContent = codeLength + " cifre";
});

// Selezione del feedback: evidenzia il bottone selezionato
feedbackButtons.forEach(btn => {
  btn.addEventListener("click", function() {
    // Rimuovi la classe "selected" da tutti
    feedbackButtons.forEach(b => b.classList.remove("selected"));
    this.classList.add("selected");
    difficulty = this.getAttribute("data-difficulty");
    
    // Imposta il moltiplicatore per il punteggio
    if (difficulty === "easy") {
      difficultyMultiplier = 1;
    } else if (difficulty === "medium") {
      difficultyMultiplier = 2;
    } else if (difficulty === "difficult") {
      difficultyMultiplier = 3;
    }
  });
});

// Aggiunge messaggi alla console
function addMessage(sender, text) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message", sender);
  msgDiv.textContent = text;
  consoleDiv.appendChild(msgDiv);
  // Scrolla in fondo alla console
  consoleDiv.scrollTop = consoleDiv.scrollHeight;
}

// Genera un codice segreto con cifre uniche
function generateSecretCode(length) {
  let digits = ['0','1','2','3','4','5','6','7','8','9'];
  // Shuffle
  for (let i = digits.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }
  return digits.slice(0, length).join("");
}

// Valuta il tentativo: conta hit e blow considerando duplicati nel tentativo
function evaluateGuess(guess) {
  let hit = 0;
  let blow = 0;
  let secretUsed = new Array(codeLength).fill(false);
  let guessUsed = new Array(codeLength).fill(false);

  // Prima passata: conta le hit (cifre corrette nella posizione giusta)
  for (let i = 0; i < codeLength; i++) {
    if (guess[i] === secretCode[i]) {
      hit++;
      secretUsed[i] = true;
      guessUsed[i] = true;
    }
  }
  
  // Seconda passata: per ogni cifra non ancora abbinata, verifica se esiste in un'altra posizione
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

// Feedback migliorati per ciascun livello di difficoltà
function getDifficultFeedback(hit, blow, length) {
  let total = hit + blow;
  if (total === 0) {
    return "Zero colpi... Il Codemaster ride di te.";
  } else if (total < length / 2) {
    return "Non male, ma il mistero persiste. Riprova!";
  } else if (total === length - 1) {
    return "Sei quasi arrivato, ma il Codemaster sa ancora come sfidarti.";
  } else {
    return "Il tuo tentativo è intrigante, ma non basta per svelare il segreto.";
  }
}

function getFeedbackMessage(evaluation) {
  const { hit, blow } = evaluation;
  if (difficulty === "easy") {
    const miss = codeLength - (hit + blow);
    return `Risultato: ${hit} diretti, ${blow} fuori posto, ${miss} mancati.`;
  } else if (difficulty === "medium") {
    return `Il tuo tentativo ha ${hit + blow} cifre corrette in totale. Continua!`;
  } else if (difficulty === "difficult") {
    return getDifficultFeedback(hit, blow, codeLength);
  }
  return "";
}

// Calcola il punteggio (formula semplificata)
function calculateScore(elapsedSeconds) {
  const base = codeLength * 1000 * difficultyMultiplier;
  const score = Math.round(base / (attempts * elapsedSeconds));
  return score;
}

// --- Gestione del gioco ---

// Avvio della sfida
startGameBtn.addEventListener("click", function() {
  if (!difficulty) {
    alert("Per favore, seleziona un livello di feedback!");
    return;
  }
  
  // Verifica il toggle DEV
  const devToggle = document.getElementById("devToggle");
  
  // Imposta le variabili di gioco
  secretCode = generateSecretCode(codeLength);
  attempts = 0;
  startTime = Date.now();
  
  // Reset della console e avvio della sfida
  consoleDiv.innerHTML = "";
  addMessage("codemaster", "Benvenuto, sfida accettata. Inizia a crackare il codice...");
  
  // Se il toggle DEV è attivo, mostra il codice segreto
  if (devToggle.checked) {
    addMessage("codemaster", "DEV MODE: Il codice segreto è " + secretCode);
  }
  
  // Genera il PIN input in base alla lunghezza scelta
  const pinInputContainer = document.getElementById("pinInputContainer");
  pinInputContainer.innerHTML = "";
  for (let i = 0; i < codeLength; i++) {
    let input = document.createElement("input");
    input.type = "text";
    input.maxLength = 1;
    input.classList.add("pin-input");
    input.autocomplete = "off";
    input.pattern = "[0-9]";
    pinInputContainer.appendChild(input);
  }
  
  // Aggiungi eventi per gestione del focus nei PIN input
  const pinInputs = document.querySelectorAll(".pin-input");
  pinInputs.forEach((input, index) => {
    input.addEventListener("input", function(e) {
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
  
  menuDiv.classList.add("hidden");
  gameDiv.classList.remove("hidden");
  gameOverDiv.classList.add("hidden");
  
  // Imposta il focus sul primo input PIN
  if (pinInputs.length > 0) {
    pinInputs[0].focus();
  }
});

// Gestione del tasto "Abbandona Partita"
quitGameBtn.addEventListener("click", function() {
  if (confirm("Sei sicuro di voler abbandonare la partita?")) {
    menuDiv.classList.remove("hidden");
    gameDiv.classList.add("hidden");
    gameOverDiv.classList.add("hidden");
  }
});

// Gestione dell'invio del tentativo
guessForm.addEventListener("submit", function(e) {
  e.preventDefault();
  
  const pinInputs = document.querySelectorAll(".pin-input");
  let guess = "";
  pinInputs.forEach(input => {
    guess += input.value;
  });
  
  // Validazione: il codice deve contenere esattamente il numero di cifre previsto
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
  }
  
  // Pulisce i PIN input e rimette il focus sul primo
  pinInputs.forEach(input => input.value = "");
  pinInputs[0].focus();
});

// Gestione del pulsante di restart (Ricomincia)
restartBtn.addEventListener("click", function() {
  menuDiv.classList.remove("hidden");
  gameOverDiv.classList.add("hidden");
});
