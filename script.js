// Utilizziamo il termine "digit/digits" in tutto il codice

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

const levelData = {
  "easy": {
    4: {
      levelName: "Sblocca il Telefono del Bro",
      lore: "Il tuo amico ha dimenticato il PIN del suo dispositivo e ha bisogno proprio di una persona con le tue skills.<br>Un piccolo gesto che potrebbe essere il preludio di qualcosa di più grande.<br>But stay humble, per ora devi dimostrare di essere un vero bro.",
      epilogoVittoria: "Il telefono è stato sbloccato: il tuo amico ti è eternamente riconoscente e ti offrirà uno Spritz la prossima volta che fare ape.<br>Urrà!",
      epilogoSconfitta: "Messaggio di sistema: Il telefono sarà bloccato per 345674 giorni.<br>Il tuo amico è visibilmente disperato siccome a malapena si può permettere di mangiare la pasta con il tonno.<br>Press F to pay respects."
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
  { digits: [1,2,3,5,8], message: "Il digit è presente nella serie di Fibonacci" },

  { digits: [2,3,5,7], message: "È un numero primo" },
  { digits: [1,2,5,0], message: "Il digit si trova nel valore delle monete in euro" },
  { digits: [5,7,8,9], message: "È un digit che si ottiene sommando due numeri primi" },
  
  { digits: [3,6,9], message: "È un multiplo di 3" },
  { digits: [4,7,6], message: "È un digit dell'anno di caduta dell'Impero Romano d'Occidente" },
  { digits: [1,4,9], message: "È un quadrato perfetto" },
  { digits: [2,4,8], message: "È una potenza di 2" },

  { digits: [2,6], message: "È un digit che appare nel numero atomico del ferro" },
  { digits: [1,2], message: "È un digit che appare nel numero delle fatiche di Eracle" },
  { digits: [4,7], message: "È un digit che appare nel numero atomico dell'argento" },
  { digits: [7,9], message: "È un digit che appare nel numero atomico dell'oro" },
  { digits: [2,9], message: "È un digit che appare nel numero di giorni di febbraio in un anno bisestile" },
  { digits: [0,1], message: "È un digit booleano" },
  { digits: [7,9], message: "È un digit che non compare mai nel numero atomico di un gas nobile" },
  { digits: [1,8], message: "È la più piccola cifra dispari... oppure la più grande pari" },
  { digits: [8,0], message: "È un digit dell'anno dell'incoronazione di Carlo Magno" },
  { digits: [1,5], message: "Il digit appare sia nel giorno che nell'anno di nascita di Galileo" },
  { digits: [3,5], message: "Il digit è un numero dispari diverso da 1 che puoi ottenere lanciando un dado a 6 facce" },

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
    html += `<div class="summaryLine">Codice: <span class="codeLengthIndicator ${lengthClass}">${codeLength} digits</span><span class="separator-desktop"> | </span><br class="separator-mobile">Difficoltà: <span class="difficultyIndicator ${difficulty}">${difficultyText}</span></div>`;
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
  guessedDigits.fill(false)
  startTime = Date.now();
  updateHealthBar();
  
  // Crea prima gli input PIN
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
  
  // Poi crea le clue card allineate con gli input
  clueBoard.innerHTML = "";
  createClueCards();
  
  consoleDiv.innerHTML = "";
  addMessage("codemaster", "Scansione... Vulnerabilità individuate:\nInizia a crackare il digit!");
  if (devToggle.checked) {
    addMessage("codemaster", "DEV MODE: Il digit segreto è " + secretCode);
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
  if (difficulty === "easy") {
    let iconLine = "";
    for (let i = 0; i < codeLength; i++) {
      if (evaluationList[i] === 2) iconLine += "🟢";
      else if (evaluationList[i] === 1) iconLine += "🟡";
      else {
        iconLine += "⚪";
        excludeFromCards(guess[i]);
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
    for (let i = 0; i < 10; i++){
      if (guessedDigits[i] && !guess.includes(String(i))){guessedDigits[i] = false;}
    }
    for (let i = 0; i < codeLength; i++) {
      if (evaluationList[i] === 2 && !guessedDigits[parseInt(guess[i])]) { candidateIndex = i; isHit = true; guessedDigits[parseInt(guess[i])] = true; break; }
      if (evaluationList[i] != 2 && guessedDigits[parseInt(guess[i])]) {guessedDigits[parseInt(guess[i])] = false;}
    }
    if (candidateIndex === -1) {
      for (let i = 0; i < codeLength; i++) {
        if (secretCode.includes(guess[i]) && !guessedDigits[parseInt(guess[i])]) { candidateIndex = i; isHit = false; break; }
      }
    }
    if (candidateIndex === -1) {
      if (guessedDigits.includes(true)) {return "Scansione... Vulnerabilità individuate:\nNessun nuovo digit rilevato.";}
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
  let epilogoText = "Esito sfida:\n\n";
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

quitGameBtn.addEventListener("click", function() {
  if (confirm("Sei sicuro di voler abbandonare la partita?")) {
    attempts = 0;
    updateHealthBar();
    menuDiv.classList.remove("hidden");
    gameDiv.classList.add("hidden");
    gameOverDiv.classList.add("hidden");
  }
});

// Funzione per costruire la griglia di una clue card
function buildClueCardGrid(card) {
  // Ricrea il contenuto della card in modalità "espansa" (cioè, la griglia completa)
  card.innerHTML = "";
  // Definiamo le righe: prima riga 3 elementi, seconda 4, terza 3
  const rows = [
    [0, 1, 2],
    [3, 4, 5, 6],
    [7, 8, 9]
  ];
  if (card.dataset.correctDigit !== "" && card.dataset.expanded === "false"){
    createChosenCard(card);
    return;
  }
  rows.forEach(rowDigits => {
    digitsState = JSON.parse(card.dataset.digitsState); //0: default, 1: excluded, 2: correct
    const row = document.createElement("div");
    row.classList.add("clue-row");
    rowDigits.forEach(digit => {
      const span = document.createElement("span");
      span.classList.add("clue-option");
      span.textContent = digit;
      // Se questo numero è quello corretto già salvato, imposta lo stato "correct"
      if (digitsState[digit] === 2) {
        span.dataset.state = "correct";
        span.style.opacity = "1";
        span.style.color = "#2ecc71";
        span.style.fontWeight = "bold";
      } else if (digitsState[digit] === 1){
        span.dataset.state = "excluded";
        span.style.opacity = "0.3";
      } else {
        span.dataset.state = "default";
        span.style.opacity = "1";
        span.style.color = "";
        span.style.fontWeight = "";
      }
      // Aggiunge il listener per il ciclo degli stati
      span.addEventListener("click", function(e) {
        e.stopPropagation(); // Impedisci al click di propagarsi alla card
        // Se la card non è espansa, espandi prima e non processare l'opzione
        if (card.dataset.expanded === "false") {
          expandClueCard(card);
          return;
        }
        // Ciclo degli stati: default -> excluded -> correct -> default
        if (this.dataset.state === "default") {
          this.dataset.state = "excluded";
          this.style.opacity = "0.3";
          digitsState[digit] = 1;
        } else if (this.dataset.state === "excluded") {
          // Prima, resetta altre opzioni in "correct" nella stessa card
          const options = card.querySelectorAll(".clue-option");
          options.forEach(opt => {
            if (opt.dataset.state === "correct") {
              opt.dataset.state = "default";
              opt.style.opacity = "1";
              opt.style.color = "";
              opt.style.fontWeight = "";
              digitsState[parseInt(opt.textContent)] = 0;
            }
          });
          this.dataset.state = "correct";
          this.style.opacity = "1";
          this.style.color = "#2ecc71";
          this.style.fontWeight = "bold";
          card.dataset.correctDigit = this.textContent;
          digitsState[digit] = 2;
        } else { // Se già "correct", torna a default
          this.dataset.state = "default";
          this.style.opacity = "1";
          this.style.color = "";
          this.style.fontWeight = "";
          card.dataset.correctDigit = "";
          digitsState[digit] = 0;
        }
        card.dataset.digitsState = JSON.stringify(digitsState);
      });
      row.appendChild(span);
    });
    card.appendChild(row);
  });
}

// Funzione per creare le clue cards dinamiche
function createClueCards() {
  const clueBoard = document.getElementById("clueBoard");
  // Svuota il contenitore per ricreare tutte le card
  clueBoard.innerHTML = "";
  
  // Ottieni le posizioni degli input per allineare le clue card
  const pinInputs = document.querySelectorAll(".pin-input");
  const inputPositions = [];
  
  pinInputs.forEach(input => {
    const rect = input.getBoundingClientRect();
    const boardRect = clueBoard.getBoundingClientRect();
    inputPositions.push({
      left: rect.left - boardRect.left + (rect.width / 2) - 25, // 25 è metà della larghezza della card
      top: 0
    });
  });
  
  for (let pos = 0; pos < codeLength; pos++) {
    const card = document.createElement("div");
    card.classList.add("clue-card");
    card.dataset.expanded = "false"; // Inizialmente chiusa
    card.dataset.correctDigit = "";   // Nessun numero corretto scelto
    card.dataset.digitsState = JSON.stringify(new Array(10).fill(0));
    card.style.position = "absolute";
    card.style.left = inputPositions[pos].left + "px";
    card.style.top = inputPositions[pos].top + "px";
    
    buildClueCardGrid(card);
    
    // Listener per l'espansione della card
    card.addEventListener("click", function(e) {
      // Se il click è su un'opzione, il listener dell'opzione già gestisce
      if (e.target.classList.contains("clue-option")) return;
      // Se la card non è espansa, espandila
      if (card.dataset.expanded === "false") {
        expandClueCard(card);
      } else {
        collapseClueCard(card);
      }
    });
    
    clueBoard.appendChild(card);
  }
}

// Funzione per espandere una clue card
function expandClueCard(card) {
  document.querySelectorAll(".clue-card.expanded").forEach(otherCard => {
    if (otherCard !== card) collapseClueCard(otherCard);
  });
  card.dataset.expanded = "true";
  card.classList.add("expanded");
  
  // Calcola la posizione per l'espansione
  const rect = card.getBoundingClientRect();
  const boardRect = document.getElementById("clueBoard").getBoundingClientRect();
  
  // Adatta le dimensioni in base alla larghezza dello schermo
  let expandedWidth = 120;
  let expandedHeight = 120;
  
  // Riduci le dimensioni su schermi piccoli
  if (window.innerWidth <= 480) {
    expandedWidth = 100;
    expandedHeight = 100;
    card.style.width = expandedWidth + "px";
    card.style.height = expandedHeight + "px";
  }
  
  // Centra la card espansa rispetto alla sua posizione originale
  const offsetX = (expandedWidth - parseInt(getComputedStyle(card).width)) / 2;
  card.style.transform = `translate(-${offsetX}px, -${expandedHeight}px)`;
  
  // Ricostruisci la griglia per assicurarti che tutte le opzioni siano visibili
  buildClueCardGrid(card);
  
  // Aggiungi un event listener per chiudere la card quando si fa tap/click all'esterno
  setTimeout(() => {
    document.addEventListener('click', closeCardOnOutsideClick);
  }, 10);
}

// Funzione per chiudere la card quando si fa tap/click all'esterno
function closeCardOnOutsideClick(e) {
  const expandedCards = document.querySelectorAll(".clue-card.expanded");
  if (expandedCards.length === 0) {
    document.removeEventListener('click', closeCardOnOutsideClick);
    return;
  }
  
  let clickedInsideCard = false;
  expandedCards.forEach(card => {
    if (card.contains(e.target)) {
      clickedInsideCard = true;
    }
  });
  
  if (!clickedInsideCard) {
    expandedCards.forEach(card => {
      collapseClueCard(card);
    });
    document.removeEventListener('click', closeCardOnOutsideClick);
  }
}

function collapseClueCard(card) {
  card.dataset.expanded = "false";
  card.classList.remove("expanded");
  card.style.transform = "translate(0, 0)";
  // Ricostruisci la card in modalità "chiusa"
  buildClueCardGrid(card);
  
  // Rimuovi l'event listener quando la card viene chiusa
  document.removeEventListener('click', closeCardOnOutsideClick);
}

//Esclude un digit da tutte le clue card
function excludeFromCards(digit) {
  document.querySelectorAll(".clue-card").forEach(card => {
    state = JSON.parse(card.dataset.digitsState);
    if (state[digit] !== 1) {
      if (state[digit] === 2) {card.dataset.correctDigit = ""}
      state[digit] = 1;
    }
    card.dataset.digitsState = JSON.stringify(state);
    buildClueCardGrid(card);
  });
}

//Trasforma la card in modo da mostrare solo la cifra corretta
function createChosenCard(card) {
  const chosen = document.createElement("span");
  chosen.classList.add("clue-option", "chosen");
  chosen.textContent = card.dataset.correctDigit;
  chosen.addEventListener("click", function(e) {
    e.stopPropagation(); 
    if (card.dataset.expanded === "false") {
      expandClueCard(card);
      return;
    }
  });
  card.appendChild(chosen);
}

// Listener globale per chiudere le clue card espanse se si clicca fuori
document.addEventListener("click", function(e) {
  document.querySelectorAll(".clue-card.expanded").forEach(card => {
    if (!card.contains(e.target)) {
      collapseClueCard(card);
    }
  });
});