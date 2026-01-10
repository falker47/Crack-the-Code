// Utilizziamo il termine "digit/digits" in tutto il codice

// Set footer year
document.addEventListener("DOMContentLoaded", function () {
  const yearSpan = document.getElementById("year");
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();
});

let codeLength = 4;
let difficulty = null; // "easy", "medium", "difficult"
let secretCode = "";
let attempts = 0;
let startTime = null;
let difficultyMultiplier = 1;
let allowedAttempts = 7; // 7 tentativi fissi
let guessedDigits = new Array(10).fill(false); //Per permettere al sistema dei feedback di ignorare le cifre già riportate come corrette nella difficoltà difficile.

// Mapping slider: 0 -> 4 digits, 1 -> 5 digits, 2 -> 7 digits
const sliderMapping = { 0: 4, 1: 5, 2: 7 };

// ============================================
// CAMPAIGN MODE
// ============================================
// campaignLevels, levelData, crypticMessages are defined in data.js

let campaignMode = false; // true se stiamo giocando in modalità campagna
let currentCampaignLevel = null; // Indice del livello corrente in campaignLevels

// Carica il progresso della campagna da localStorage
function getCampaignProgress() {
  const saved = localStorage.getItem("crackTheCode_campaignProgress");
  return saved ? parseInt(saved) : 0; // Ritorna l'indice del primo livello non completato
}

// Salva il progresso della campagna in localStorage
function saveCampaignProgress(levelIndex) {
  const current = getCampaignProgress();
  if (levelIndex >= current) {
    localStorage.setItem("crackTheCode_campaignProgress", levelIndex + 1);
  }
}

function getHealthColor() {
  let remaining = allowedAttempts - attempts;
  if (remaining >= 6) return "#2ecc71"; // verde
  else if (remaining >= 4) return "#f1c40f"; // giallo
  else if (remaining >= 2) return "#e67e22"; // arancione
  else if (remaining === 1) return "#e74c3c"; // rosso
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
const finalMessageP = document.getElementById("finalMessage");
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
  codeLength = sliderMapping[this.value];
  codeLengthDisplay.textContent = codeLength + " digits";
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
    codeLength = sliderMapping[value];
    codeLengthDisplay.textContent = codeLength + " digits";
    updateSliderTickMarks(value);
    updateMenuConsole();
  });
});

// Gestione della selezione della difficoltà e aggiornamento della descrizione
feedbackButtons.forEach(btn => {
  btn.addEventListener("click", function () {
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
    html += `<div class="summaryLine">Codice: <span class="codeLengthIndicator ${lengthClass}">${codeLength} digits</span><span class="separator-desktop"> | </span><br class="separator-mobile">Difficoltà: <span class="difficultyIndicator ${difficulty}">${difficultyText}</span></div>`;
    menuConsole.innerHTML = html;
  } else {
    menuConsole.textContent = "Scegli le impostazioni per iniziare la sfida.\n\nInserisci la lunghezza del codice che vuoi crackare e quanto la AI del Codemaster può aiutarti nell'impresa";
  }
}

// Al click su "Conferma Livello"
confirmLevelBtn.addEventListener("click", function () {
  if (!difficulty) { alert("Per favore, seleziona una difficoltà!"); return; }
  const data = levelData[difficulty][codeLength];
  if (!data) { alert("Impostazioni incomplete!"); return; }
  allowedAttempts = 7;
  attempts = 0;
  updateHealthBar();
  loreConsole.innerHTML = `<strong>${data.levelName}</strong><br><br>${data.lore}<br><br><em>Tentativi disponibili: ${allowedAttempts}</em>`;
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
  if (campaignMode) {
    campaignScreen.classList.remove("hidden");
    renderCampaignLevels(); // Refresh per mostrare eventuali progressi
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
  campaignMode = true;
  currentCampaignLevel = levelIndex;

  // Imposta difficoltà e lunghezza codice
  difficulty = level.difficulty;
  codeLength = level.codeLength;

  if (difficulty === "easy") difficultyMultiplier = 1;
  else if (difficulty === "medium") difficultyMultiplier = 2;
  else difficultyMultiplier = 3;

  // Mostra la schermata lore
  const data = levelData[difficulty][codeLength];
  allowedAttempts = 7;
  attempts = 0;
  updateHealthBar();
  loreConsole.innerHTML = `<strong>Livello ${levelIndex + 1}: ${data.levelName}</strong><br><br>${data.lore}<br><br><em>Tentativi disponibili: ${allowedAttempts}</em>`;

  campaignScreen.classList.add("hidden");
  loreScreen.classList.remove("hidden");
}


// Aggiorna la health bar: mostra sempre 7 blocchi; per 7-6 usa verde, 5-4 giallo, 3-2 arancione, 1 rosso
function updateHealthBar() {
  let remaining = allowedAttempts - attempts;
  let blocksHTML = "";
  for (let i = 0; i < allowedAttempts; i++) {
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
  const devToggle = document.getElementById("devToggle");
  secretCode = generateSecretCode(codeLength);
  attempts = 0;
  guessedDigits.fill(false)
  startTime = Date.now();
  updateHealthBar();

  // Crea gli input PIN
  const pinInputContainer = document.getElementById("pinInputContainer");
  pinInputContainer.innerHTML = "";

  // Detect mobile to disable native keyboard
  const isMobile = window.matchMedia("(max-width: 768px)").matches;

  for (let i = 0; i < codeLength; i++) {
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
  if (devToggle && devToggle.checked) {
    addMessage("codemaster", "DEV MODE: Il digit segreto è " + secretCode);
  }

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

// Rimuovi tutte le funzioni relative alla clueboard:
// - createClueCards()
// - buildClueCardGrid()
// - expandClueCard()
// - collapseClueCard()
// - excludeFromCards()
// - createChosenCard()
// - closeCardOnOutsideClick()
// E tutti i relativi event listener

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
  let hit = 0, blow = 0, misses = 0;
  let evaluationList = new Array(codeLength).fill(0); //2: digit posizionato corretamente, 1: digit presente ma posizione errata, 0: digit assente
  for (let i = 0; i < codeLength; i++) {
    if (guess[i] === secretCode[i]) {
      hit++;
      evaluationList[i] = 2;
    } else if (secretCode.includes(guess[i])) {
      blow++;
      evaluationList[i] = 1;
    }
  }
  misses = codeLength - (hit + blow);
  return { evaluationList, hit, blow, misses };
}

// Feedback dei tentativi
function getFeedbackMessage(evaluation, guess) {
  const { evaluationList, hit, blow, misses } = evaluation;
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
    const phrases = [
      "Stai andando alla grande!",
      "Continua così, hacker!",
      "Attenzione: sei sulla strada giusta!",
      "Non mollare, il successo è vicino!"
    ];
    let phrase = phrases[Math.floor(Math.random() * phrases.length)];
    return `Scansione... Vulnerabilità individuate:\n${iconLine}\n${phrase}`;
  } else if (difficulty === "medium") {
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
    let candidateIndex = -1;
    let isHit = false;
    for (let i = 0; i < 10; i++) {
      if (guessedDigits[i] && !guess.includes(String(i))) { guessedDigits[i] = false; }
    }
    for (let i = 0; i < codeLength; i++) {
      if (evaluationList[i] === 2 && !guessedDigits[parseInt(guess[i])]) { candidateIndex = i; isHit = true; guessedDigits[parseInt(guess[i])] = true; break; }
      if (evaluationList[i] != 2 && guessedDigits[parseInt(guess[i])]) { guessedDigits[parseInt(guess[i])] = false; }
    }
    if (candidateIndex === -1) {
      for (let i = 0; i < codeLength; i++) {
        if (secretCode.includes(guess[i]) && !guessedDigits[parseInt(guess[i])]) { candidateIndex = i; isHit = false; break; }
      }
    }
    if (candidateIndex === -1) {
      if (guessedDigits.includes(true)) { return "Scansione... Vulnerabilità individuate:\nNessun nuovo digit rilevato."; }
      return "Scansione... Vulnerabilità individuate:\nNessun digit rilevato.";
    }

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

guessForm.addEventListener("submit", function (e) {
  e.preventDefault();
  // Cattura il colore della health bar prima dell'aggiornamento
  const currentColor = getHealthColor();
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

  // Mostra il tentativo del giocatore in grassetto, allineato a sinistra, col colore catturato
  let playerMsg = document.createElement("div");
  playerMsg.classList.add("message", "player");
  playerMsg.style.textAlign = "left";
  playerMsg.style.fontWeight = "bold";
  playerMsg.style.color = currentColor;
  playerMsg.textContent = guess;
  consoleDiv.appendChild(playerMsg);
  consoleDiv.scrollTop = consoleDiv.scrollHeight;

  attempts++;
  const evaluation = evaluateGuess(guess);
  const feedbackMsg = getFeedbackMessage(evaluation, guess);
  addMessage("codemaster", feedbackMsg);
  updateHealthBar();

  if (guess === secretCode) {
    const elapsedSeconds = Math.max((Date.now() - startTime) / 1000, 1);
    const score = calculateScore(elapsedSeconds);
    // Vittoria: esito positivo in verde
    showGameOver("COMPLIMENTI! SISTEMA VIOLATO", "#2ecc71", true, score);
  } else {
    if (allowedAttempts - attempts <= 0) {
      // Sconfitta: esito negativo in rosso
      showGameOver("ERRORE CRITICO! SEI STATO SCOPERTO!", "#e74c3c", false, secretCode);
    }
  }

  pinInputs.forEach(input => input.value = "");
  pinInputs[0].focus();
});

function showGameOver(finalText, outcomeColor, won, scoreOrSecret) {
  // Salva il progresso della campagna se vittoria
  if (won && campaignMode && currentCampaignLevel !== null) {
    saveCampaignProgress(currentCampaignLevel);
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
  const data = levelData[difficulty][codeLength];
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
  backBtn.textContent = campaignMode ? "↩ Torna alla Campagna" : "↩ Torna al Menu";
  backBtn.style.marginTop = "10px";
  backBtn.addEventListener("click", function () {
    epilogoConsole.remove();
    gameOverDiv.classList.add("hidden");
    gameOverConsole.style.display = "block";

    if (campaignMode) {
      campaignScreen.classList.remove("hidden");
      renderCampaignLevels(); // Refresh per mostrare i progressi aggiornati
      campaignMode = false;
      currentCampaignLevel = null;
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
    attempts = 0;
    updateHealthBar();
    gameDiv.classList.add("hidden");
    gameOverDiv.classList.add("hidden");

    if (campaignMode) {
      campaignScreen.classList.remove("hidden");
      renderCampaignLevels();
      campaignMode = false;
      currentCampaignLevel = null;
    } else {
      menuDiv.classList.remove("hidden");
    }
  }
});

// ============================================
// CLUE BAR SEMPLIFICATA
// ============================================

// Stato della clue bar: 0 = default, 1 = excluded, 2 = confirmed
let clueBarState = new Array(10).fill(0);

// Inizializza la Clue Bar con 10 pulsanti (0-9)
function initClueBar() {
  const clueBar = document.getElementById("clueBar");
  clueBar.innerHTML = "";
  clueBarState.fill(0); // Reset state

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
  const currentState = clueBarState[digit];

  if (currentState === 0) {
    // Default → Excluded
    clueBarState[digit] = 1;
    btn.classList.remove("confirmed");
    btn.classList.add("excluded");
    btn.dataset.state = "excluded";
  } else if (currentState === 1) {
    // Excluded → Confirmed
    clueBarState[digit] = 2;
    btn.classList.remove("excluded");
    btn.classList.add("confirmed");
    btn.dataset.state = "confirmed";
  } else {
    // Confirmed → Default
    clueBarState[digit] = 0;
    btn.classList.remove("confirmed", "excluded");
    btn.dataset.state = "default";
  }
}

// Esclude automaticamente un digit dalla clue bar (usato in modalità Easy)
function excludeFromClueBar(digit) {
  const digitNum = parseInt(digit);
  if (clueBarState[digitNum] === 0) { // Solo se è in stato default
    clueBarState[digitNum] = 1;
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

  // Resize canvas to window size
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  // Matrix characters (mix of numbers, letters, and symbols)
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%^&*(){}[]|/<>";
  const charArray = chars.split("");

  const fontSize = 14;
  const columns = Math.floor(canvas.width / fontSize);

  // Array to track y position of each column
  const drops = [];
  for (let i = 0; i < columns; i++) {
    drops[i] = Math.random() * -100; // Start above screen at random positions
  }

  function draw() {
    // Semi-transparent black to create fade effect
    ctx.fillStyle = "rgba(11, 12, 16, 0.05)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Green text
    ctx.fillStyle = "#45a29e";
    ctx.font = fontSize + "px monospace";

    for (let i = 0; i < drops.length; i++) {
      // Random character
      const text = charArray[Math.floor(Math.random() * charArray.length)];

      // Draw the character
      ctx.fillText(text, i * fontSize, drops[i] * fontSize);

      // Reset drop to top with random delay when it goes off screen
      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }

      drops[i]++;
    }
  }

  // Run animation at ~30fps
  setInterval(draw, 33);
})();