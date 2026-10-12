import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const dataSource = readFileSync(new URL('../../data.js', import.meta.url), 'utf8');
const gameSource = readFileSync(new URL('../../script.js', import.meta.url), 'utf8');

/**
 * Load the actual browser scripts in an isolated VM with a small DOM stub.
 * This exercises game rules and event handlers, not browser layout or rendering.
 * The canvas is omitted so decorative animation does not consume injected RNG.
 */
export function loadBrowserGame({ random = Math.random, storage, isMobile = false } = {}) {
  let document;
  const elements = new Map();

  class Element {
    constructor(tagName = 'div') {
      this.tagName = tagName.toUpperCase();
      this.children = [];
      this.parentNode = null;
      this.value = '';
      this.textContent = '';
      this.dataset = {};
      this.style = {};
      this.listeners = new Map();
      this.classes = new Set();
      this.classList = {
        add: (...names) => names.forEach(name => this.classes.add(name)),
        remove: (...names) => names.forEach(name => this.classes.delete(name)),
        contains: name => this.classes.has(name),
      };
    }

    set innerHTML(value) {
      this.html = value;
      for (const child of this.children) child.parentNode = null;
      this.children = [];
    }

    get innerHTML() { return this.html ?? ''; }
    get firstChild() { return this.children[0] ?? null; }

    appendChild(child) {
      child.parentNode?.removeChild(child);
      child.parentNode = this;
      this.children.push(child);
      return child;
    }

    removeChild(child) {
      this.children.splice(this.children.indexOf(child), 1);
      child.parentNode = null;
      return child;
    }

    remove() { this.parentNode?.removeChild(this); }

    addEventListener(type, callback) {
      if (!this.listeners.has(type)) this.listeners.set(type, []);
      this.listeners.get(type).push(callback);
    }

    dispatchEvent(event) {
      for (const callback of this.listeners.get(event.type) ?? []) {
        callback.call(this, event);
      }
      return !event.defaultPrevented;
    }

    getAttribute(name) {
      return name.startsWith('data-') ? this.dataset[name.slice(5)] : this[name];
    }

    focus() {
      for (let current = this; current; current = current.parentNode) {
        if (current.classList.contains('hidden')) return;
      }
      document.activeElement = this;
    }

    blur() {
      if (document.activeElement === this) document.activeElement = document.body;
    }

    querySelectorAll(selector) {
      const matches = [];
      const visit = element => {
        for (const child of element.children) {
          if (selector.startsWith('.') && child.classList.contains(selector.slice(1))) {
            matches.push(child);
          }
          visit(child);
        }
      };
      visit(this);
      return matches;
    }
  }

  const body = new Element('body');
  const documentListeners = new Map();
  document = {
    body,
    activeElement: body,
    hidden: false,
    createElement: tagName => new Element(tagName),
    getElementById: id => elements.get(id) ?? null,
    querySelectorAll: selector => body.querySelectorAll(selector),
    querySelector(selector) {
      const match = selector.match(/^\.clue-btn\[data-digit="(\d)"\]$/);
      if (!match) return null;
      return body.querySelectorAll('.clue-btn')
        .find(element => String(element.dataset.digit) === match[1]) ?? null;
    },
    addEventListener(type, callback) {
      if (!documentListeners.has(type)) documentListeners.set(type, []);
      documentListeners.get(type).push(callback);
    },
  };

  const screenChildren = {
    menu: ['codeLengthSlider', 'codeLengthDisplay', 'confirmLevelBtn', 'menuConsole',
      'descConsole', 'campaignModeBtn'],
    loreScreen: ['loreConsole', 'startLevelBtn', 'backToMenuBtn'],
    campaignScreen: ['levelGrid', 'backFromCampaignBtn'],
    game: ['console', 'guessForm', 'healthBar', 'quitGameBtn', 'pinInputContainer',
      'clueBar', 'virtualKeyboard'],
    gameOver: ['gameOverConsole'],
    guessForm: ['submitPin'],
  };
  const ids = new Set(['year', ...Object.keys(screenChildren), ...Object.values(screenChildren).flat()]);
  for (const id of ids) {
    const element = new Element();
    element.id = id;
    elements.set(id, element);
    body.appendChild(element);
  }
  for (const [parentId, children] of Object.entries(screenChildren)) {
    for (const childId of children) elements.get(parentId).appendChild(elements.get(childId));
  }
  for (const id of ['loreScreen', 'campaignScreen', 'game', 'gameOver']) {
    elements.get(id).classList.add('hidden');
  }
  elements.get('codeLengthSlider').value = '0';
  elements.get('codeLengthDisplay').textContent = '4 cifre';

  const feedbackButtons = ['easy', 'medium', 'difficult'].map(difficulty => {
    const button = new Element('button');
    button.classList.add('feedback-btn');
    button.dataset.difficulty = difficulty;
    button.dataset.desc = difficulty;
    elements.get('menu').appendChild(button);
    return button;
  });
  for (let value = 0; value < 3; value++) {
    const tick = new Element();
    tick.classList.add('slider-tick');
    tick.dataset.value = String(value);
    elements.get('menu').appendChild(tick);
  }
  for (const key of ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'backspace', 'submit']) {
    const button = new Element('button');
    button.classList.add('vk-key');
    button.dataset.key = key;
    elements.get('virtualKeyboard').appendChild(button);
  }

  const storageValues = new Map();
  const localStorage = storage ?? {
    getItem: key => storageValues.get(key) ?? null,
    setItem: (key, value) => storageValues.set(key, String(value)),
  };
  const context = vm.createContext({
    document,
    window: { matchMedia: () => ({ matches: isMobile }), addEventListener() {} },
    localStorage,
    confirm: () => true,
    Event,
    Math: Object.assign(Object.create(Math), { random }),
    setTimeout() {},
  });
  vm.runInContext(dataSource, context, { filename: 'data.js' });
  vm.runInContext(gameSource, context, { filename: 'script.js' });
  const api = vm.runInContext(`({
    gameState, campaignLevels, levelData, crypticMessages,
    startGame, generateSecretCode, evaluateGuess, getFeedbackMessage,
    getDifficultFeedback, getCrypticFeedback, calculateScore,
    getCampaignProgress, saveCampaignProgress, renderCampaignLevels,
    startCampaignLevel, showEpilogo,
    handleVirtualDigit, handleVirtualBackspace, handleVirtualSubmit
  })`, context);
  for (const callback of documentListeners.get('DOMContentLoaded') ?? []) callback();

  const click = target => {
    const element = typeof target === 'string' ? elements.get(target) : target;
    return element.dispatchEvent(new Event('click', { cancelable: true }));
  };
  const pinInputs = () => document.querySelectorAll('.pin-input');
  const start = (secretCode = '0123', difficulty = 'easy') => {
    api.gameState.codeLength = secretCode.length;
    api.gameState.difficulty = difficulty;
    elements.get('menu').classList.add('hidden');
    elements.get('game').classList.remove('hidden');
    api.startGame();
    api.gameState.secretCode = secretCode;
  };
  const submit = guess => {
    pinInputs().forEach((input, index) => { input.value = guess[index] ?? ''; });
    elements.get('guessForm').dispatchEvent(new Event('submit', { cancelable: true }));
  };

  return { ...api, context, api, document, elements, localStorage, feedbackButtons,
    click, pinInputs, start, submit };
}
