// Utilizziamo il termine "digit/digits" in tutto il codice

// Set footer year
document.addEventListener("DOMContentLoaded", function () {
  const yearSpan = document.getElementById("year");
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();
});

// Stato di gioco centralizzato
const gameState = {
  codeLength: 4,
  difficulty: null, // "easy", "medium", "difficult"
  secretCode: "",
  attempts: 0,
  startTime: null,
  difficultyMultiplier: 1,
  allowedAttempts: 7,
  guessedDigits: new Array(10).fill(false), // Per la difficoltà "difficult"
  campaignMode: false,
  currentCampaignLevel: null,
  clueBarState: new Array(10).fill(0), // 0=default, 1=excluded, 2=confirmed
  crypticCache: {}, // Indizi criptici persistenti per partita
};

// Mapping slider: 0 -> 4 digits, 1 -> 5 digits, 2 -> 7 digits
const sliderMapping = { 0: 4, 1: 5, 2: 7 };

// ============================================
// CAMPAIGN MODE
// ============================================
// campaignLevels, levelData, crypticMessages are defined in data.js

// Carica il progresso della campagna da localStorage
function getCampaignProgress() {
  const saved = localStorage.getItem("crackTheCode_campaignProgress");
  return saved ? parseInt(saved, 10) : 0;
}

// Salva il progresso della campagna in localStorage
function saveCampaignProgress(levelIndex) {
  const current = getCampaignProgress();
  if (levelIndex >= current) {
    localStorage.setItem("crackTheCode_campaignProgress", levelIndex + 1);
  }
}

function getHealthColor() {
  const remaining = gameState.allowedAttempts - gameState.attempts;
  if (remaining >= 6) return "#2ecc71";
  if (remaining >= 4) return "#f1c40f";
  if (remaining >= 2) return "#e67e22";
  if (remaining === 1) return "#e74c3c";
  return "#2ecc71";
}

// Elementi DOM
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
const backToMenuBtn = document.getElementById("backToMenuBtn");

const gameDiv = document.getElementById("game");
const consoleDiv = document.getElementById("console");
const guessForm = document.getElementById("guessForm");
const gameOverDiv = document.getElementById("gameOver");
const quitGameBtn = document.getElementById("quitGameBtn");
const healthBar = document.getElementById("healthBar");
const gameOverConsole = document.getElementById("gameOverConsole");

// Campaign Mode DOM elements
const campaignModeBtn = document.getElementById("campaignModeBtn");
const campaignScreen = document.getElementById("campaignScreen");
const levelGrid = document.getElementById("levelGrid");
const backFromCampaignBtn = document.getElementById("backFromCampaignBtn");

// Aggiorna la visualizzazione della lunghezza
codeLengthSlider.addEventListener("input", function () {
  gameState.codeLength = sliderMapping[this.value];
  codeLengthDisplay.textContent = gameState.codeLength + " digits";
  updateSliderTickMarks(this.value);
  updateMenuConsole();
});

// Sync slider tick marks with slider value
function updateSliderTickMarks(value) {
  const ticks = document.querySelectorAll(".slider-tick");
  ticks.forEach(tick => {
    tick.classList.remove("active");
    if (tick.dataset.value === String(value)) {
      tick.classList.add("active");
    }
  });
}

// Click handler for tick marks
document.querySelectorAll(".slider-tick").forEach(tick => {
  tick.addEventListener("click", function () {
    const value = this.dataset.value;
    codeLengthSlider.value = value;
    gameState.codeLength = sliderMapping[value];
    codeLengthDisplay.textContent = gameState.codeLength + " digits";
    updateSliderTickMarks(value);
    updateMenuConsole();
  });
});

// Gestione della selezione della difficoltà e aggiornamento della descrizione
feedbackButtons.forEach(btn => {
  btn.addEventListener("click", function () {
    feedbackButtons.forEach(b => b.classList.remove("selected"));
    this.classList.add("selected");
    gameState.difficulty = this.getAttribute("data-difficulty");
    if (gameState.difficulty === "easy") { gameState.difficultyMultiplier = 1; }
    else if (gameState.difficulty === "medium") { gameState.difficultyMultiplier = 2; }
    else if (gameState.difficulty === "difficult") { gameState.difficultyMultiplier = 3; }
    updateMenuConsole();
    descConsole.textContent = this.getAttribute("data-desc");
  });
});

// Aggiorna la console del menu con titolo e riepilogo fisso
function updateMenuConsole() {
  const { difficulty, codeLength } = gameState;
  if (difficulty && codeLength) {
    const data = levelData[difficulty][codeLength];
    const difficultyTextMap = { easy: "Facile", medium: "Medio", difficult: "Difficile" };
    const lengthClassMap = { 4: "length-green", 5: "length-yellow", 7: "length-red" };
    const difficultyText = difficultyTextMap[difficulty] || "";
    const lengthClass = lengthClassMap[codeLength] || "";

    let html = `<div class="levelTitleContainer">${data.levelName}</div>`;
    html += `<div class="summaryLine">Codice: <span class="codeLengthIndicator ${lengthClass}">${codeLength} digits</span><span class="separator-desktop"> | </span><br class="separator-mobile">Difficoltà: <span class="difficultyIndicator ${difficulty}">${difficultyText}</span></div>`;
    menuConsole.innerHTML = html;
  } else {
    menuConsole.textContent = "Scegli le impostazioni per iniziare la sfida.\n\nInserisci la lunghezza del codice che vuoi crackare e quanto la AI del Codemaster può aiutarti nell'impresa";
  }
}

// Al click su "Conferma Livello"
confirmLevelBtn.addEventListener("click", function () {
  if (!gameState.difficulty) {
    addMessage("codemaster", "Per favore, seleziona una difficoltà!");
    descConsole.textContent = "Seleziona una difficoltà per continuare.";
    return;
  }
  const data = levelData[gameState.difficulty][gameState.codeLength];
  if (!data) {
    descConsole.textContent = "Impostazioni incomplete!";
    return;
  }
  gameState.allowedAttempts = 7;
  gameState.attempts = 0;
  updateHealthBar();
  loreConsole.innerHTML = `<strong>${data.levelName}</strong><br><br>${data.lore}<br><br><em>Tentativi disponibili: ${gameState.allowedAttempts}</em>`;
  menuDiv.classList.add("hidden");
  loreScreen.classList.remove("hidden");
});



// Al click su "Parti la Sfida!"
startLevelBtn.addEventListener("click", function () {
  loreScreen.classList.add("hidden");
  gameDiv.classList.remove("hidden");
  startGame();
});

// ============================================
// CAMPAIGN MODE EVENT LISTENERS
// ============================================

// Apre la schermata Campagna
campaignModeBtn.addEventListener("click", function () {
  menuDiv.classList.add("hidden");
  campaignScreen.classList.remove("hidden");
  renderCampaignLevels();
});

// Torna al menu dalla campagna
backFromCampaignBtn.addEventListener("click", function () {
  campaignScreen.classList.add("hidden");
  menuDiv.classList.remove("hidden");
});

// Modifica il comportamento del tasto "Torna al Menu" nel lore per gestire la campagna
backToMenuBtn.addEventListener("click", function () {
  loreScreen.classList.add("hidden");
  if (gameState.campaignMode) {
    campaignScreen.classList.remove("hidden");
    renderCampaignLevels();
  } else {
    menuDiv.classList.remove("hidden");
  }
});

// Genera la griglia dei livelli della campagna
function renderCampaignLevels() {
  levelGrid.innerHTML = "";
  const progress = getCampaignProgress();

  campaignLevels.forEach((level, idx) => {
    const data = levelData[level.difficulty][level.codeLength];
    const isUnlocked = idx <= progress;
    const isCompleted = idx < progress;

    const card = document.createElement("div");
    card.classList.add("level-card");
    if (!isUnlocked) card.classList.add("locked");
    if (isCompleted) card.classList.add("completed");

    // Traduzione difficoltà
    let diffText = "";
    if (level.difficulty === "easy") diffText = "Facile";
    else if (level.difficulty === "medium") diffText = "Medio";
    else diffText = "Difficile";

    card.innerHTML = `
      <div class="level-number">Livello ${idx + 1}</div>
      <div class="level-name">${data.levelName}</div>
      <div class="level-difficulty ${level.difficulty}">${diffText}</div>
    `;

    if (isUnlocked) {
      card.addEventListener("click", function () {
        startCampaignLevel(idx);
      });
    }

    levelGrid.appendChild(card);
  });
}

// Avvia un livello della campagna
function startCampaignLevel(levelIndex) {
  const level = campaignLevels[levelIndex];
  gameState.campaignMode = true;
  gameState.currentCampaignLevel = levelIndex;

  gameState.difficulty = level.difficulty;
  gameState.codeLength = level.codeLength;

  const diffMultiplierMap = { easy: 1, medium: 2, difficult: 3 };
  gameState.difficultyMultiplier = diffMultiplierMap[gameState.difficulty] || 1;

  const data = levelData[gameState.difficulty][gameState.codeLength];
  gameState.allowedAttempts = 7;
  gameState.attempts = 0;
  updateHealthBar();
  loreConsole.innerHTML = `<strong>Livello ${levelIndex + 1}: ${data.levelName}</strong><br><br>${data.lore}<br><br><em>Tentativi disponibili: ${gameState.allowedAttempts}</em>`;

  campaignScreen.classList.add("hidden");
  loreScreen.classList.remove("hidden");
}


// Aggiorna la health bar: mostra sempre 7 blocchi; per 7-6 usa verde, 5-4 giallo, 3-2 arancione, 1 rosso
function updateHealthBar() {
  const remaining = gameState.allowedAttempts - gameState.attempts;
  let blocksHTML = "";
  for (let i = 0; i < gameState.allowedAttempts; i++) {
    if (i < remaining) {
      let blockClass = "healthBlock ";
      if (remaining >= 6) { blockClass += "full-green"; }
      else if (remaining >= 4) { blockClass += "full-yellow"; }
      else if (remaining >= 2) { blockClass += "full-orange"; }
      else if (remaining === 1) { blockClass += "full-red blinking"; }
      blocksHTML += `<span class="${blockClass}"></span>`;
    } else {
      let blockClass = "healthBlock empty ";
      if (remaining >= 6) { blockClass += "empty-green"; }
      else if (remaining >= 4) { blockClass += "empty-yellow"; }
      else if (remaining >= 2) { blockClass += "empty-orange"; }
      else if (remaining === 1) { blockClass += "empty-red"; }
      blocksHTML += `<span class="${blockClass}"></span>`;
    }
  }
  healthBar.innerHTML = blocksHTML;
}

// Avvia la sfida: resetta health bar, genera il digit segreto, crea gli input PIN
function startGame() {
  gameState.secretCode = generateSecretCode(gameState.codeLength);
  gameState.attempts = 0;
  gameState.guessedDigits.fill(false);
  gameState.crypticCache = {};
  gameState.startTime = Date.now();
  updateHealthBar();

  // Crea gli input PIN
  const pinInputContainer = document.getElementById("pinInputContainer");
  pinInputContainer.innerHTML = "";

  // Detect mobile to disable native keyboard
  const isMobile = window.matchMedia("(max-width: 768px)").matches;

  for (let i = 0; i < gameState.codeLength; i++) {
    let input = document.createElement("input");
    input.type = "tel";
    input.maxLength = 1;
    input.classList.add("pin-input");
    input.autocomplete = "off";
    input.pattern = "[0-9]";

    // On mobile, prevent native keyboard by making inputs readonly
    if (isMobile) {
      input.readOnly = true;
      input.inputMode = "none";
    } else {
      input.inputMode = "numeric";
    }

    pinInputContainer.appendChild(input);
  }

  consoleDiv.innerHTML = "";
  addMessage("codemaster", "Scansione... Vulnerabilità individuate:\nInizia a crackare il digit!");

  const pinInputs = document.querySelectorAll(".pin-input");
  pinInputs.forEach((input, index) => {
    input.addEventListener("input", function () {
      if (!/^\d$/.test(this.value)) { this.value = ""; return; }
      let allFilled = true;
      pinInputs.forEach(inp => { if (inp.value === "") allFilled = false; });
      if (allFilled) { pinInputs.forEach(inp => inp.blur()); }
      if (index < pinInputs.length - 1) { pinInputs[index + 1].focus(); }
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Backspace" && this.value === "" && index > 0) {
        pinInputs[index - 1].focus();
      }
      // Submit on Enter when all inputs are filled
      if (e.key === "Enter") {
        e.preventDefault();
        let allFilled = true;
        pinInputs.forEach(inp => { if (inp.value === "") allFilled = false; });
        if (allFilled) {
          guessForm.dispatchEvent(new Event("submit", { cancelable: true }));
        }
      }
    });
  });
  if (pinInputs.length > 0) { pinInputs[0].focus(); }

  // Inizializza la Clue Bar semplificata (0-9)
  initClueBar();
}

// Aggiunge un messaggio alla console; per i messaggi del giocatore, usa il colore della health bar PRIMA dell'aggiornamento e grassetto
function addMessage(sender, text) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message", sender);
  if (sender === "player") {
    msgDiv.style.textAlign = "left";
    msgDiv.style.fontWeight = "bold";
    msgDiv.style.color = getHealthColor();
  }
  msgDiv.textContent = text;
  consoleDiv.appendChild(msgDiv);
  while (consoleDiv.children.length > 50) {
    consoleDiv.removeChild(consoleDiv.firstChild);
  }
  consoleDiv.scrollTop = consoleDiv.scrollHeight;
}

// Genera un digit segreto con digits unici
function generateSecretCode(length) {
  let digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  for (let i = digits.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }
  return digits.slice(0, length).join("");
}

// Valuta il tentativo: calcola hit e blow
function evaluateGuess(guess) {
  const { codeLength, secretCode } = gameState;
  let hit = 0, blow = 0;
  const evaluationList = new Array(codeLength).fill(0); // 2=hit, 1=blow, 0=miss
  for (let i = 0; i < codeLength; i++) {
    if (guess[i] === secretCode[i]) {
      hit++;
      evaluationList[i] = 2;
    } else if (secretCode.includes(guess[i])) {
      blow++;
      evaluationList[i] = 1;
    }
  }
  const misses = codeLength - (hit + blow);
  return { evaluationList, hit, blow, misses };
}

// Feedback dei tentativi
function getRandomPhrase(phrases) {
  return phrases[Math.floor(Math.random() * phrases.length)];
}

function getFeedbackMessage(evaluation, guess) {
  const { evaluationList, hit, blow, misses } = evaluation;
  const { difficulty, codeLength } = gameState;

  if (difficulty === "easy") {
    let iconLine = "";
    for (let i = 0; i < codeLength; i++) {
      if (evaluationList[i] === 2) iconLine += "🟢";
      else if (evaluationList[i] === 1) iconLine += "🟡";
      else {
        iconLine += "⚪";
        excludeFromClueBar(guess[i]);
      }
    }
    const phrase = getRandomPhrase([
      "Stai andando alla grande!",
      "Continua così, hacker!",
      "Attenzione: sei sulla strada giusta!",
      "Non mollare, il successo è vicino!"
    ]);
    return `Scansione... Vulnerabilità individuate:\n${iconLine}\n${phrase}`;
  }

  if (difficulty === "medium") {
    const totalLine = `${hit}🟢 | ${blow}🟡 | ${misses}⚪`;
    const phrase = getRandomPhrase([
      "Il sistema è in allerta, ma sei ancora in gioco!",
      "Continua ad analizzare i dati...",
      "Ogni tentativo conta, hacker!",
      "Non perdere la concentrazione!"
    ]);
    return `Scansione... Vulnerabilità individuate:\n${totalLine}\n${phrase}`;
  }

  if (difficulty === "difficult") {
    return getDifficultFeedback(evaluationList, guess);
  }

  return "";
}

// Logica feedback per difficoltà "difficult" estratta in funzione dedicata
function getDifficultFeedback(evaluationList, guess) {
  const { codeLength, secretCode, guessedDigits } = gameState;

  // Cerca prima un digit hit (posizione corretta) non ancora confermato
  let candidateIndex = -1;
  let isHit = false;

  for (let i = 0; i < codeLength; i++) {
    const digitValue = parseInt(guess[i], 10);
    if (evaluationList[i] === 2 && !guessedDigits[digitValue]) {
      candidateIndex = i;
      isHit = true;
      guessedDigits[digitValue] = true;
      break;
    }
  }

  // Se nessun hit, cerca un digit presente ma in posizione sbagliata
  if (candidateIndex === -1) {
    for (let i = 0; i < codeLength; i++) {
      const digitValue = parseInt(guess[i], 10);
      if (secretCode.includes(guess[i]) && !guessedDigits[digitValue]) {
        candidateIndex = i;
        isHit = false;
        break;
      }
    }
  }

  // Nessun candidato trovato
  if (candidateIndex === -1) {
    const hasConfirmed = guessedDigits.includes(true);
    return hasConfirmed
      ? "Scansione... Vulnerabilità individuate:\nNessun nuovo digit rilevato."
      : "Scansione... Vulnerabilità individuate:\nNessun digit rilevato.";
  }

  const statusText = isHit ? "è stato inserito correttamente!" : "è presente!";
  const candidateDigit = parseInt(guess[candidateIndex], 10);
  return `Scansione... Vulnerabilità individuate:\nUn digit ${statusText}\n${getCrypticFeedback(candidateDigit)}`;
}

function getCrypticFeedback(digit) {
  if (gameState.crypticCache[digit]) return gameState.crypticCache[digit];
  let candidates = crypticMessages.filter(cond => cond.digits.includes(digit));
  if (candidates.length === 0) { candidates = [{ message: "Il digit è avvolto nel mistero." }]; }
  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  gameState.crypticCache[digit] = chosen.message;
  return chosen.message;
}

function calculateScore(elapsedSeconds) {
  const base = gameState.codeLength * 1000 * gameState.difficultyMultiplier;
  const attemptBonus = Math.max(0, gameState.allowedAttempts - gameState.attempts) * 500;
  const timeBonus = Math.max(0, 120 - elapsedSeconds) * 10;
  return Math.round(base + attemptBonus + timeBonus);
}

guessForm.addEventListener("submit", function (e) {
  e.preventDefault();
  // Cattura il colore della health bar prima dell'aggiornamento
  const currentColor = getHealthColor();
  const pinInputs = document.querySelectorAll(".pin-input");
  let guess = "";
  pinInputs.forEach(input => { guess += input.value; });

  const regex = new RegExp(`^\\d{${gameState.codeLength}}$`);
  if (!regex.test(guess)) {
    addMessage("codemaster", `Il digit segreto deve essere composto da ${gameState.codeLength} digits. Riprova.`);
    pinInputs.forEach(input => input.value = "");
    pinInputs[0].focus();
    return;
  }

  if (new Set(guess).size !== gameState.codeLength) {
    addMessage("codemaster", "Ogni digit deve essere unico. Riprova.");
    pinInputs.forEach(input => input.value = "");
    pinInputs[0].focus();
    return;
  }

  // Mostra il tentativo del giocatore in grassetto, allineato a sinistra, col colore catturato
  let playerMsg = document.createElement("div");
  playerMsg.classList.add("message", "player");
  playerMsg.style.textAlign = "left";
  playerMsg.style.fontWeight = "bold";
  playerMsg.style.color = currentColor;
  playerMsg.textContent = guess;
  consoleDiv.appendChild(playerMsg);
  consoleDiv.scrollTop = consoleDiv.scrollHeight;

  gameState.attempts++;
  const evaluation = evaluateGuess(guess);
  const feedbackMsg = getFeedbackMessage(evaluation, guess);
  addMessage("codemaster", feedbackMsg);
  updateHealthBar();

  if (guess === gameState.secretCode) {
    const elapsedSeconds = Math.max((Date.now() - gameState.startTime) / 1000, 1);
    const score = calculateScore(elapsedSeconds);
    showGameOver("COMPLIMENTI! SISTEMA VIOLATO", "#2ecc71", true, score);
  } else if (gameState.allowedAttempts - gameState.attempts <= 0) {
    showGameOver("ERRORE CRITICO! SEI STATO SCOPERTO!", "#e74c3c", false, gameState.secretCode);
  }

  pinInputs.forEach(input => input.value = "");
  pinInputs[0].focus();
});

function showGameOver(finalText, outcomeColor, won, scoreOrSecret) {
  // Salva il progresso della campagna se vittoria
  if (won && gameState.campaignMode && gameState.currentCampaignLevel !== null) {
    saveCampaignProgress(gameState.currentCampaignLevel);
  }

  // Mostra la console di game over
  gameOverDiv.innerHTML = "";
  gameOverConsole.innerHTML = "";
  gameOverDiv.appendChild(gameOverConsole);
  let endMsg = document.createElement("div");
  endMsg.style.textAlign = "center";
  endMsg.style.fontSize = "1.5em";
  endMsg.style.fontWeight = "bold";
  endMsg.style.color = outcomeColor;
  endMsg.textContent = finalText;
  gameOverConsole.appendChild(endMsg);

  // Aggiungi il pulsante "Continua" per passare alla console di epilogo
  let continueBtn = document.createElement("button");
  continueBtn.textContent = "Continua";
  continueBtn.style.marginTop = "10px";
  continueBtn.addEventListener("click", function () {
    showEpilogo(won, scoreOrSecret);
  });
  gameOverConsole.appendChild(continueBtn);

  gameOverDiv.classList.remove("hidden");
  gameDiv.classList.add("hidden");
}

function showEpilogo(won, scoreOrSecret) {
  // Crea una console per l'epilogo con la stessa larghezza della console di gameplay
  let epilogoConsole = document.createElement("div");
  epilogoConsole.classList.add("console-window");
  epilogoConsole.id = "epilogoConsole";

  // Recupera i dati del livello corrente per il testo epilogo
  const data = levelData[gameState.difficulty][gameState.codeLength];
  let epilogoText = "<strong>Esito sfida:</strong><br><br>";
  if (won) {
    epilogoText += data.epilogoVittoria;
    epilogoText += `<br><br>Punteggio: ${scoreOrSecret}`;
  } else {
    epilogoText += data.epilogoSconfitta;
    epilogoText += `<br><br>Il digit era: ${scoreOrSecret}`;
  }
  epilogoConsole.innerHTML = epilogoText;

  // Crea il pulsante per tornare al menu/campagna
  let backBtn = document.createElement("button");
  backBtn.textContent = gameState.campaignMode ? "↩ Torna alla Campagna" : "↩ Torna al Menu";
  backBtn.style.marginTop = "10px";
  backBtn.addEventListener("click", function () {
    epilogoConsole.remove();
    gameOverDiv.classList.add("hidden");
    gameOverConsole.style.display = "block";

    if (gameState.campaignMode) {
      campaignScreen.classList.remove("hidden");
      renderCampaignLevels();
      gameState.campaignMode = false;
      gameState.currentCampaignLevel = null;
    } else {
      menuDiv.classList.remove("hidden");
    }
  });

  // Svuota il contenuto di gameOverDiv e inserisci la console di epilogo e il pulsante
  gameOverDiv.innerHTML = "";
  gameOverDiv.appendChild(epilogoConsole);
  gameOverDiv.appendChild(backBtn);
}

quitGameBtn.addEventListener("click", function () {
  if (confirm("Sei sicuro di voler abbandonare la partita?")) {
    gameState.attempts = 0;
    updateHealthBar();
    gameDiv.classList.add("hidden");
    gameOverDiv.classList.add("hidden");

    if (gameState.campaignMode) {
      campaignScreen.classList.remove("hidden");
      renderCampaignLevels();
      gameState.campaignMode = false;
      gameState.currentCampaignLevel = null;
    } else {
      menuDiv.classList.remove("hidden");
    }
  }
});

// ============================================
// CLUE BAR SEMPLIFICATA
// ============================================

// Inizializza la Clue Bar con 10 pulsanti (0-9)
function initClueBar() {
  const clueBar = document.getElementById("clueBar");
  clueBar.innerHTML = "";
  gameState.clueBarState.fill(0); // Reset state

  for (let digit = 0; digit < 10; digit++) {
    const btn = document.createElement("button");
    btn.type = "button"; // Prevent form submission
    btn.classList.add("clue-btn");
    btn.textContent = digit;
    btn.dataset.digit = digit;
    btn.dataset.state = "default";

    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      cycleClueState(this, digit);
    });

    clueBar.appendChild(btn);
  }
}

// Cicla lo stato del pulsante: default → excluded → confirmed → default
function cycleClueState(btn, digit) {
  const currentState = gameState.clueBarState[digit];

  if (currentState === 0) {
    // Default → Excluded
    gameState.clueBarState[digit] = 1;
    btn.classList.remove("confirmed");
    btn.classList.add("excluded");
    btn.dataset.state = "excluded";
  } else if (currentState === 1) {
    // Excluded → Confirmed
    gameState.clueBarState[digit] = 2;
    btn.classList.remove("excluded");
    btn.classList.add("confirmed");
    btn.dataset.state = "confirmed";
  } else {
    // Confirmed → Default
    gameState.clueBarState[digit] = 0;
    btn.classList.remove("confirmed", "excluded");
    btn.dataset.state = "default";
  }
}

// Esclude automaticamente un digit dalla clue bar (usato in modalità Easy)
function excludeFromClueBar(digit) {
  const digitNum = parseInt(digit);
  if (gameState.clueBarState[digitNum] === 0) { // Solo se è in stato default
    gameState.clueBarState[digitNum] = 1;
    const btn = document.querySelector(`.clue-btn[data-digit="${digitNum}"]`);
    if (btn) {
      btn.classList.add("excluded");
      btn.dataset.state = "excluded";
    }
  }
}

// ============================================
// VIRTUAL KEYBOARD
// ============================================

// Initialize virtual keyboard event listeners
function initVirtualKeyboard() {
  const virtualKeyboard = document.getElementById("virtualKeyboard");
  if (!virtualKeyboard) return;

  const keys = virtualKeyboard.querySelectorAll(".vk-key");

  keys.forEach(key => {
    key.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      const keyValue = this.dataset.key;

      if (keyValue === "backspace") {
        handleVirtualBackspace();
      } else if (keyValue === "submit") {
        handleVirtualSubmit();
      } else {
        handleVirtualDigit(keyValue);
      }
    });
  });
}

// Handle digit input from virtual keyboard
function handleVirtualDigit(digit) {
  const pinInputs = document.querySelectorAll(".pin-input");

  // Find the first empty input
  for (let i = 0; i < pinInputs.length; i++) {
    if (pinInputs[i].value === "") {
      pinInputs[i].value = digit;
      // Visual feedback
      pinInputs[i].style.transform = "scale(1.1)";
      setTimeout(() => {
        pinInputs[i].style.transform = "scale(1)";
      }, 100);
      break;
    }
  }
}

// Handle backspace from virtual keyboard
function handleVirtualBackspace() {
  const pinInputs = document.querySelectorAll(".pin-input");

  // Find the last filled input and clear it
  for (let i = pinInputs.length - 1; i >= 0; i--) {
    if (pinInputs[i].value !== "") {
      pinInputs[i].value = "";
      // Visual feedback
      pinInputs[i].style.transform = "scale(0.9)";
      setTimeout(() => {
        pinInputs[i].style.transform = "scale(1)";
      }, 100);
      break;
    }
  }
}

// Handle submit from virtual keyboard
function handleVirtualSubmit() {
  const guessForm = document.getElementById("guessForm");
  if (guessForm) {
    guessForm.dispatchEvent(new Event("submit", { cancelable: true }));
  }
}

// Initialize virtual keyboard when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  initVirtualKeyboard();
});

// ============================================
// MATRIX RAIN ANIMATION
// ============================================

(function initMatrixRain() {
  const canvas = document.getElementById("matrixCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let animationId = null;
  let lastFrame = 0;
  const frameInterval = 33; // ~30fps

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%^&*(){}[]|/<>";
  const charArray = chars.split("");
  const fontSize = 14;
  const columns = Math.floor(canvas.width / fontSize);

  const drops = [];
  for (let i = 0; i < columns; i++) {
    drops[i] = Math.random() * -100;
  }

  function draw(timestamp) {
    animationId = requestAnimationFrame(draw);

    // Throttle to ~30fps
    if (timestamp - lastFrame < frameInterval) return;
    lastFrame = timestamp;

    ctx.fillStyle = "rgba(11, 12, 16, 0.05)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#45a29e";
    ctx.font = fontSize + "px monospace";

    for (let i = 0; i < drops.length; i++) {
      const text = charArray[Math.floor(Math.random() * charArray.length)];
      ctx.fillText(text, i * fontSize, drops[i] * fontSize);

      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }

  // Pausa quando la tab non è visibile
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    } else {
      if (!animationId) {
        animationId = requestAnimationFrame(draw);
      }
    }
  });

  animationId = requestAnimationFrame(draw);
})();