// Utilizziamo il termine "digit/digits" in tutto il codice
let codeLength = 4;
let difficulty = null; // "easy", "medium", "difficult"
let secretCode = "";
let attempts = 0;
let startTime = null;
let difficultyMultiplier = 1;
let allowedAttempts = 7; // 7 tentativi fissi

const sliderMapping = { 0: 4, 1: 5, 2: 7 };

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

const crypticMessages = [
  { digits: [2,3,5,7], message: "È un numero primo" },
  { digits: [1,2,5,0], message: "Il digit si trova nel valore delle monete in euro" },
  { digits: [1,2,3,5,8], message: "Il digit è presente nella serie di Fibonacci" },
  { digits: [1,3,5,7,9], message: "È un numero dispari" },
  { digits: [3,6,9], message: "È un multiplo di 3" },
  { digits: [4,7,6], message: "È un digit dell'anno di caduta dell'Impero Romano d'Occidente" },
  { digits: [2,4,6,8,0], message: "È un numero pari" },
  { digits: [5,6,7,8,9], message: "Il digit è maggiore di 4" },
  { digits: [0,1,2,3,4], message: "Il digit è minore di 5" },
  { digits: [2,6,7,8,9], message: "Il digit non apparirà mai nel punteggio di un game di tennis" },
  { digits: [5,7,8,9], message: "È un digit che si ottiene sommando due numeri primi" },
  { digits: [1,4,9,2], message: "È un digit dell'anno in cui è stata scoperta l'America" },
  { digits: [1,7,8,9], message: "È un digit dell'anno in cui c'è stata la rivoluzione francese" },
  { digits: [7,9], message: "È un digit che non compare mai nel numero atomico di un gas nobile" }
];

function getHealthColor() {
  let remaining = allowedAttempts - attempts;
  if (remaining >= 6) return "#66fcf1"; // Azzurro
  else if (remaining >= 4) return "#f1c40f"; // Giallo
  else if (remaining >= 2) return "#e67e22"; // Arancione
  else if (remaining === 1) return "#e74c3c"; // Rosso
  return "#66fcf1";
}

const codeLengthSlider = document.getElementById("codeLengthSlider");
const codeLengthDisplay = document.getElementById("codeLengthDisplay");
const feedbackButtons = document.querySelectorAll(".feedback-btn");
const confirmLevelBtn = document.getElementById("confirmLevelBtn");
const menuConsole = document.getElementById("menuConsole");
const menuDiv = document.getElementById("menu");
const descConsole = document.getElementById("descConsole");

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
const healthBar = document.getElementById("healthBar");

// Aggiorna la visualizzazione della lunghezza
codeLengthSlider.addEventListener("input", function() {
  codeLength = sliderMapping[this.value];
  codeLengthDisplay.textContent = codeLength + " digits";
  updateMenuConsole();
});

// Gestione della selezione della difficoltà e aggiornamento della descrizione
feedbackButtons.forEach(btn => {
  btn.addEventListener("click", function() {
    feedbackButtons.forEach(b => b.classList.remove("selected"));
    this.classList.add("selected");
    difficulty = this.getAttribute("data-difficulty");
    if (difficulty === "easy") { difficultyMultiplier = 1; }
    else if (difficulty === "medium") { difficultyMultiplier = 2; }
    else if (difficulty === "difficult") { difficultyMultiplier = 3; }
    updateMenuConsole();
    descConsole.textContent = this.getAttribute("data-desc");
  });
});

// Aggiorna la console del menu con titolo e riepilogo fisso
function updateMenuConsole() {
  if (difficulty && codeLength) {
    const data = levelData[difficulty][codeLength];
    let difficultyText = "";
    if (difficulty === "easy") difficultyText = "Facile";
    else if (difficulty === "medium") difficultyText = "Medio";
    else if (difficulty === "difficult") difficultyText = "Difficile";
    
    let lengthClass = "";
    if (codeLength == 4) lengthClass = "length-green";
    else if (codeLength == 5) lengthClass = "length-yellow";
    else if (codeLength == 7) lengthClass = "length-red";
    
    let html = `<div class="levelTitleContainer">${data.levelName}</div>`;
    html += `<div class="summaryLine">Codice: <span class="codeLengthIndicator ${lengthClass}">${codeLength} digits</span> &nbsp;|&nbsp; Difficoltà: <span class="difficultyIndicator ${difficulty}">${difficultyText}</span></div>`;
    menuConsole.innerHTML = html;
  } else {
    menuConsole.textContent = "Scegli le impostazioni per iniziare la sfida.\n\nInserisci la lunghezza del codice che vuoi crackare e quanto la AI del Codemaster può aiutarti nell'impresa";
  }
}

// Al click su "Conferma Livello"
confirmLevelBtn.addEventListener("click", function() {
  if (!difficulty) { alert("Per favore, seleziona una difficoltà!"); return; }
  const data = levelData[difficulty][codeLength];
  if (!data) { alert("Impostazioni incomplete!"); return; }
  allowedAttempts = 7;
  attempts = 0; // Reset degli attempt per il nuovo game
  updateHealthBar();
  loreConsole.innerHTML = `<strong>${data.levelName}</strong><br><br>${data.lore}<br><br><em>Tentativi disponibili: ${allowedAttempts}</em>`;
  menuDiv.classList.add("hidden");
  loreScreen.classList.remove("hidden");
});

// Al click su "Parti la Sfida!"
startLevelBtn.addEventListener("click", function() {
  loreScreen.classList.add("hidden");
  gameDiv.classList.remove("hidden");
  startGame();
});

// Aggiorna la health bar: mostra sempre 7 blocchi
function updateHealthBar() {
  let remaining = allowedAttempts - attempts;
  let blocksHTML = "";
  for (let i = 0; i < allowedAttempts; i++) {
    if (i < remaining) {
      let blockClass = "healthBlock ";
      if (remaining >= 6) { blockClass += "full-blue"; }
      else if (remaining >= 4) { blockClass += "full-yellow"; }
      else if (remaining >= 2) { blockClass += "full-orange"; }
      else if (remaining === 1) { blockClass += "full-red blinking"; }
      blocksHTML += `<span class="${blockClass}"></span>`;
    } else {
      let blockClass = "healthBlock empty ";
      if (remaining >= 6) { blockClass += "empty-blue"; }
      else if (remaining >= 4) { blockClass += "empty-yellow"; }
      else if (remaining >= 2) { blockClass += "empty-orange"; }
      else if (remaining === 1) { blockClass += "empty-red"; }
      blocksHTML += `<span class="${blockClass}"></span>`;
    }
  }
  healthBar.innerHTML = blocksHTML;
}

// Avvia la sfida: genera il digit segreto, crea gli input PIN, resetta health bar
function startGame() {
  const devToggle = document.getElementById("devToggle");
  secretCode = generateSecretCode(codeLength);
  attempts = 0;
  startTime = Date.now();
  updateHealthBar();
  consoleDiv.innerHTML = "";
  addMessage("codemaster", "Scansione... Vulnerabilità individuate:\nInizia a crackare il digit!");
  if (devToggle.checked) { addMessage("codemaster", "DEV MODE: Il digit segreto è " + secretCode); }
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
      if (!/^\d$/.test(this.value)) { this.value = ""; return; }
      if (index < pinInputs.length - 1) { pinInputs[index + 1].focus(); }
    });
    input.addEventListener("keydown", function(e) {
      if (e.key === "Backspace" && this.value === "" && index > 0) { pinInputs[index - 1].focus(); }
    });
  });
  if (pinInputs.length > 0) { pinInputs[0].focus(); }
}

// Aggiunge un messaggio alla console; i messaggi del giocatore vengono allineati a sinistra e colorati come la health bar attuale
function addMessage(sender, text) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message", sender);
  if (sender === "player") {
    msgDiv.style.textAlign = "left";
    msgDiv.style.color = getHealthColor();
  }
  msgDiv.textContent = text;
  consoleDiv.appendChild(msgDiv);
  consoleDiv.scrollTop = consoleDiv.scrollHeight;
}

// Genera un digit segreto con digits unici
function generateSecretCode(length) {
  let digits = ['0','1','2','3','4','5','6','7','8','9'];
  for (let i = digits.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }
  return digits.slice(0, length).join("");
}

// Valuta il tentativo: calcola hit e blow
function evaluateGuess(guess) {
  let hit = 0, blow = 0;
  let secretUsed = new Array(codeLength).fill(false);
  let guessUsed = new Array(codeLength).fill(false);
  for (let i = 0; i < codeLength; i++) {
    if (guess[i] === secretCode[i]) { hit++; secretUsed[i] = true; guessUsed[i] = true; }
  }
  for (let i = 0; i < codeLength; i++) {
    if (!guessUsed[i]) {
      for (let j = 0; j < codeLength; j++) {
        if (!secretUsed[j] && guess[i] === secretCode[j]) { blow++; secretUsed[j] = true; break; }
      }
    }
  }
  return { hit, blow };
}

// Feedback in base alla difficoltà
function getFeedbackMessage(evaluation, guess) {
  if (difficulty === "easy") {
    let iconLine = "";
    for (let i = 0; i < codeLength; i++) {
      if (guess[i] === secretCode[i]) iconLine += "🟢";
      else if (secretCode.includes(guess[i])) iconLine += "🟡";
      else iconLine += "⚪";
    }
    const phrases = [
      "Stai andando alla grande!",
      "Continua così, hacker!",
      "Attenzione: sei sulla strada giusta!",
      "Non mollare, il successo è vicino!"
    ];
    let phrase = phrases[Math.floor(Math.random() * phrases.length)];
    return `Scansione... Vulnerabilità individuate:\n${iconLine}\n${phrase}`;
  } else if (difficulty === "medium") {
    const { hit, blow } = evaluation;
    const misses = codeLength - (hit + blow);
    const totalLine = `${hit}🟢 | ${blow}🟡 | ${misses}⚪`;
    const phrases = [
      "Il sistema è in allerta, ma sei ancora in gioco!",
      "Continua ad analizzare i dati...",
      "Ogni tentativo conta, hacker!",
      "Non perdere la concentrazione!"
    ];
    let phrase = phrases[Math.floor(Math.random() * phrases.length)];
    return `Scansione... Vulnerabilità individuate:\n${totalLine}\n${phrase}`;
  } else if (difficulty === "difficult") {
    const { hit, blow } = evaluation;
    let candidateIndex = -1;
    let isHit = false;
    for (let i = 0; i < codeLength; i++) {
      if (guess[i] === secretCode[i]) { candidateIndex = i; isHit = true; break; }
    }
    if (candidateIndex === -1) {
      for (let i = 0; i < codeLength; i++) {
        if (secretCode.includes(guess[i])) { candidateIndex = i; isHit = false; break; }
      }
    }
    if (candidateIndex === -1) return "Scansione... Vulnerabilità individuate:\nNessun digit rilevato.";
    const statusText = isHit ? "è stato inserito correttamente!" : "è presente!";
    let candidateDigit = parseInt(guess[candidateIndex]);
    return `Scansione... Vulnerabilità individuate:\nUn digit ${statusText}\n${getCrypticFeedback(candidateDigit)}`;
  }
  return "";
}

function getCrypticFeedback(digit) {
  let candidates = crypticMessages.filter(cond => cond.digits.includes(digit));
  if (candidates.length === 0) { candidates = [{ message: "Il digit è avvolto nel mistero." }]; }
  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  return chosen.message;
}

function calculateScore(elapsedSeconds) {
  const base = codeLength * 1000 * difficultyMultiplier;
  return Math.round(base / (attempts * elapsedSeconds));
}

guessForm.addEventListener("submit", function(e) {
  e.preventDefault();
  const pinInputs = document.querySelectorAll(".pin-input");
  let guess = "";
  pinInputs.forEach(input => { guess += input.value; });
  
  const regex = new RegExp(`^\\d{${codeLength}}$`);
  if (!regex.test(guess)) {
    addMessage("codemaster", `Il digit segreto deve essere composto da ${codeLength} digits. Riprova.`);
    pinInputs.forEach(input => input.value = "");
    pinInputs[0].focus();
    return;
  }
  
  attempts++;
  addMessage("player", guess);
  const evaluation = evaluateGuess(guess);
  const feedbackMsg = getFeedbackMessage(evaluation, guess);
  addMessage("codemaster", feedbackMsg);
  updateHealthBar();
  
  if (guess === secretCode) {
    const elapsedSeconds = Math.max((Date.now() - startTime) / 1000, 1);
    const score = calculateScore(elapsedSeconds);
    addMessage("codemaster", "Digit sbloccato! Bravo, hai completato la sfida.");
    addMessage("codemaster", `Tentativi: ${attempts} | Tempo: ${elapsedSeconds.toFixed(1)} sec | Punteggio: ${score}`);
    finalMessageP.textContent = `Sfida completata in ${attempts} tentativi e ${elapsedSeconds.toFixed(1)} secondi. Punteggio: ${score}`;
    gameOverDiv.classList.remove("hidden");
    gameDiv.classList.add("hidden");
  } else {
    if (allowedAttempts - attempts <= 0) {
      addMessage("codemaster", `Tentativi esauriti! Il sistema ti ha scoperto! Il digit segreto era ${secretCode}.`);
      finalMessageP.textContent = `Tentativi esauriti! Il sistema ti ha scoperto! Il digit era ${secretCode}.`;
      gameOverDiv.classList.remove("hidden");
      gameDiv.classList.add("hidden");
    }
  }
  
  pinInputs.forEach(input => input.value = "");
  pinInputs[0].focus();
});

quitGameBtn.addEventListener("click", function() {
  if (confirm("Sei sicuro di voler abbandonare la partita?")) {
    attempts = 0;
    updateHealthBar();
    menuDiv.classList.remove("hidden");
    gameDiv.classList.add("hidden");
    gameOverDiv.classList.add("hidden");
  }
});

restartBtn.addEventListener("click", function() {
  attempts = 0;
  updateHealthBar();
  menuDiv.classList.remove("hidden");
  gameOverDiv.classList.add("hidden");
});

// Clue Board: cicla tra stati "none" -> "green" -> "yellow" -> "white" -> "none"
document.querySelectorAll(".clue-digit").forEach(digitElem => {
  digitElem.addEventListener("click", function() {
    let currentState = this.getAttribute("data-state");
    let nextState;
    if (currentState === "none") nextState = "green";
    else if (currentState === "green") nextState = "yellow";
    else if (currentState === "yellow") nextState = "white";
    else nextState = "none";
    this.setAttribute("data-state", nextState);
    this.classList.remove("clue-green", "clue-yellow", "clue-white");
    if (nextState === "green") this.classList.add("clue-green");
    else if (nextState === "yellow") this.classList.add("clue-yellow");
    else if (nextState === "white") this.classList.add("clue-white");
  });
});
