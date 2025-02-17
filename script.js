// Utilizziamo il termine "digit/digits" in tutto il codice

let codeLength = 4;
let difficulty = null; // "easy", "medium", "difficult"
let secretCode = "";
let attempts = 0;
let startTime = null;
let difficultyMultiplier = 1;
let allowedAttempts = 7; // 7 tentativi fissi

// Mapping slider: 0 -> 4 digits, 1 -> 5 digits, 2 -> 7 digits
const sliderMapping = { 0: 4, 1: 5, 2: 7 };

const levelData = {
  "easy": {
    4: {
      levelName: "Sblocca il Telefono del Bro",
      lore: "Il telefono del tuo amico è incustodito e nasconde segreti che solo tu puoi sbloccare. Un piccolo gesto che potrebbe cambiare le sorti di una serata.",
      epilogoVittoria: "Il telefono è ora aperto: i segreti del Bro sono tuoi. La notte si riempie di nuove possibilità.",
      epilogoSconfitta: "Il Bro ha protetto il suo telefono, lasciandoti nell'oscurità. I segreti rimangono nascosti."
    },
    5: {
      levelName: "Hackera l'account Instagram di quella persona poco simpatica",
      lore: "Dietro i post patinati si nascondono verità scomode. Metti alla prova il tuo ingegno per scoprire cosa si cela dietro i filtri.",
      epilogoVittoria: "L'account è stato violato e i segreti sono esposti. Il potere dell'informazione è tuo.",
      epilogoSconfitta: "L'account resta impenetrabile. Il mistero rimane, e la tua sfida fallisce."
    },
    7: {
      levelName: "Hackera la vending machine del tuo ufficio",
      lore: "La vending machine dell'ufficio non è solo un distributore di snack: potrebbe custodire segreti nascosti tra le sue monete.",
      epilogoVittoria: "La vending machine è ora sotto il tuo controllo: ogni snack e segreto sono a portata di mano.",
      epilogoSconfitta: "La vending machine rimane inaccessibile e i suoi segreti immutati. La sfida non è riuscita."
    }
  },
  "medium": {
    4: {
      levelName: "Accedi al server privato di Starlink",
      lore: "Starlink custodisce informazioni riservate in un server segreto. Solo un vero hacker potrà penetrare le sue difese.",
      epilogoVittoria: "Il server è stato violato: ora hai accesso a dati top secret. Il mondo non sarà più lo stesso.",
      epilogoSconfitta: "Il server rimane inaccessibile. I segreti di Starlink sfuggono alle tue mani."
    },
    5: {
      levelName: "Bypassa il firewall del Pentagono",
      lore: "Il Pentagono protegge i suoi segreti con firewall impenetrabili, ma il tuo ingegno potrebbe essere la chiave per abbatterli.",
      epilogoVittoria: "Il firewall è stato superato: ora detieni informazioni che pochi possono sognare.",
      epilogoSconfitta: "Il firewall ha bloccato il tuo accesso. Il Pentagono rimane un baluardo inespugnabile."
    },
    7: {
      levelName: "Scopri i segreti dell'Area 51",
      lore: "L'Area 51 è avvolta nel mistero e custodisce segreti extraterrestri. Preparati a svelare l'ignoto e a mettere in discussione tutto ciò che credevi di sapere.",
      epilogoVittoria: "I segreti dell'Area 51 sono stati svelati: la verità sugli extraterrestri è ora alla tua portata.",
      epilogoSconfitta: "L'Area 51 rimane un mistero impenetrabile, e i segreti degli alieni continuano a celarsi."
    }
  },
  "difficult": {
    4: {
      levelName: "Accedi all'Archivio del Nuovo Ordine Mondiale",
      lore: "Nel cuore del Nuovo Ordine Mondiale, archivi segreti attendono di essere scoperti. Il potere è nelle tue mani.",
      epilogoVittoria: "Hai infranto l'archivio segreto: il mondo digitale piega il suo potere al tuo comando.",
      epilogoSconfitta: "Gli archivi rimangono intatti, e il Nuovo Ordine Mondiale continua il suo oscuro dominio."
    },
    5: {
      levelName: "Hackera le banche mondiali",
      lore: "Dietro le quinte delle banche si celano verità nascoste. Dimostra il tuo ingegno e accedi ai segreti delle finanze globali.",
      epilogoVittoria: "Le banche sono state hackerate: i segreti finanziari sono ora un'arma nelle tue mani.",
      epilogoSconfitta: "Le banche hanno mantenuto i loro segreti, lasciandoti nell'oscurità finanziaria."
    },
    7: {
      levelName: "Prendi possesso della AI del Codemaster",
      lore: "La AI del Codemaster è una mente potente e misteriosa. Diventa il suo padrone e riscrivi le regole del potere digitale.",
      epilogoVittoria: "Hai conquistato la AI del Codemaster: il futuro del cyberspazio è sotto il tuo controllo.",
      epilogoSconfitta: "La AI rimane intoccata, e il Codemaster continua a dominare il cyberspazio."
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
  attempts = 0;
  updateHealthBar();
  loreConsole.innerHTML = `<strong>${data.levelName}</strong><br><br>${data.lore}<br><br><em>Tentativi disponibili: ${allowedAttempts}</em>`;
  menuDiv.classList.add("hidden");
  loreScreen.classList.remove("hidden");
});

// Tasto per tornare al Menu nel lore
backToMenuBtn.addEventListener("click", function() {
  loreScreen.classList.add("hidden");
  menuDiv.classList.remove("hidden");
});

// Al click su "Parti la Sfida!"
startLevelBtn.addEventListener("click", function() {
  loreScreen.classList.add("hidden");
  gameDiv.classList.remove("hidden");
  startGame();
});

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

// Avvia la sfida: resetta health bar, clue board, genera il digit segreto, crea gli input PIN
function startGame() {
  const devToggle = document.getElementById("devToggle");
  secretCode = generateSecretCode(codeLength);
  attempts = 0;
  startTime = Date.now();
  updateHealthBar();
  resetClueBoard();
  consoleDiv.innerHTML = "";
  addMessage("codemaster", "Scansione... Vulnerabilità individuate:\nInizia a crackare il digit!");
  if (devToggle.checked) {
    addMessage("codemaster", "DEV MODE: Il digit segreto è " + secretCode);
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
      if (!/^\d$/.test(this.value)) { this.value = ""; return; }
      let allFilled = true;
      pinInputs.forEach(inp => { if (inp.value === "") allFilled = false; });
      if (allFilled) { pinInputs.forEach(inp => inp.blur()); }
      if (index < pinInputs.length - 1) { pinInputs[index + 1].focus(); }
    });
    input.addEventListener("keydown", function(e) {
      if (e.key === "Backspace" && this.value === "" && index > 0) { pinInputs[index - 1].focus(); }
    });
  });
  if (pinInputs.length > 0) { pinInputs[0].focus(); }
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
  let hit = 0, blow = 0,misses = 0;
  let evaluationList = new Array(codeLength).fill(0); //2: digit posizionato corretamente, 1: digit presente ma posizione errata, 0: digit assente
  for (let i = 0; i < codeLength; i++) {
    if (guess[i] === secretCode[i]) { 
      hit++;  
      evaluationList[i] = 2; 
    } else if (secretCode.includes(guess[i])){
      blow++;
      evaluationList[i] = 1;
    }
  }
  misses = codeLength - (hit + blow);
  return {evaluationList, hit, blow, misses };
}

// Feedback dei tentativi
function getFeedbackMessage(evaluation, guess) {
  const {evaluationList, hit, blow, misses } = evaluation;
  console.log(evaluation)
  if (difficulty === "easy") {
    let iconLine = "";
    for (let i = 0; i < codeLength; i++) {
      if (evaluationList[i] === 2) iconLine += "🟢";
      else if (evaluationList[i] === 1) iconLine += "🟡";
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
  // Mostra la console di game over (con le stesse dimensioni della console di gameplay)
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
  continueBtn.addEventListener("click", function() {
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
  let epilogoText = "Esito sfida\n\n";
  if (won) {
    epilogoText += data.epilogoVittoria;
    epilogoText += `\n\nPunteggio: ${scoreOrSecret}`;
  } else {
    epilogoText += data.epilogoSconfitta;
    epilogoText += `\n\nIl digit era: ${scoreOrSecret}`;
  }
  epilogoConsole.textContent = epilogoText;
  
  // Crea il pulsante per tornare al menu principale
  let backBtn = document.createElement("button");
  backBtn.textContent = "↩ Torna al Menu";
  backBtn.style.marginTop = "10px";
  backBtn.addEventListener("click", function() {
    epilogoConsole.remove();
    gameOverDiv.classList.add("hidden");
    // Ripristina gameOverConsole per la prossima partita
    gameOverConsole.style.display = "block";
    menuDiv.classList.remove("hidden");
  });
  
  // Svuota il contenuto di gameOverDiv e inserisci la console di epilogo e il pulsante
  gameOverDiv.innerHTML = "";
  gameOverDiv.appendChild(epilogoConsole);
  gameOverDiv.appendChild(backBtn);
}

function resetClueBoard() {
  document.querySelectorAll(".clue-digit").forEach(elem => {
    elem.setAttribute("data-state", "none");
    elem.classList.remove("clue-green", "clue-yellow", "clue-white");
  });
}

quitGameBtn.addEventListener("click", function() {
  if (confirm("Sei sicuro di voler abbandonare la partita?")) {
    attempts = 0;
    updateHealthBar();
    resetClueBoard();
    menuDiv.classList.remove("hidden");
    gameDiv.classList.add("hidden");
    gameOverDiv.classList.add("hidden");
  }
});

// Clue Board: Ciclo degli stati: none -> white -> yellow -> green -> none
document.querySelectorAll(".clue-digit").forEach(digitElem => {
  digitElem.addEventListener("click", function() {
    let currentState = this.getAttribute("data-state");
    let nextState;
    if (currentState === "none") nextState = "white";
    else if (currentState === "white") nextState = "yellow";
    else if (currentState === "yellow") nextState = "green";
    else nextState = "none";
    this.setAttribute("data-state", nextState);
    this.classList.remove("clue-green", "clue-yellow", "clue-white");
    if (nextState === "green") this.classList.add("clue-green");
    else if (nextState === "yellow") this.classList.add("clue-yellow");
    else if (nextState === "white") this.classList.add("clue-white");
  });
});
