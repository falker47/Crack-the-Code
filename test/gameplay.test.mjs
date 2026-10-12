import test from 'node:test';
import assert from 'node:assert/strict';
import { loadBrowserGame } from './helpers/browser.mjs';

const outcome = game => game.elements.get('gameOverConsole').children[0]?.textContent;
const messages = game => game.elements.get('console').children.map(element => element.textContent);

test('a correct seventh guess wins', () => {
  const game = loadBrowserGame();
  game.start();
  for (let attempt = 0; attempt < 6; attempt++) game.submit('4567');
  assert.equal(game.elements.get('game').classList.contains('hidden'), false);
  game.submit('0123');
  assert.equal(game.gameState.attempts, 7);
  assert.equal(outcome(game), 'CODICE DECIFRATO');
});

test('an incorrect seventh guess ends the game permanently', () => {
  const game = loadBrowserGame();
  game.start();
  for (let attempt = 0; attempt < 7; attempt++) game.submit('4567');
  assert.equal(outcome(game), 'TENTATIVI ESAURITI');
  const history = messages(game);
  game.submit('0123');
  assert.equal(game.gameState.attempts, 7);
  assert.equal(outcome(game), 'TENTATIVI ESAURITI');
  assert.deepEqual(messages(game), history);
});

test('submitting after victory cannot replace it with a defeat', () => {
  const game = loadBrowserGame();
  game.start();
  game.submit('0123');
  const history = messages(game);
  for (let attempt = 0; attempt < 7; attempt++) game.submit('4567');
  assert.equal(game.gameState.attempts, 1);
  assert.equal(outcome(game), 'CODICE DECIFRATO');
  assert.deepEqual(messages(game), history);
});

test('submitting after quitting cannot complete an abandoned campaign level', () => {
  const game = loadBrowserGame();
  game.start();
  game.gameState.campaignMode = true;
  game.gameState.currentCampaignLevel = 0;
  game.click('quitGameBtn');
  const history = messages(game);
  game.submit('0123');
  assert.equal(game.gameState.attempts, 0);
  assert.equal(game.elements.get('gameOver').classList.contains('hidden'), true);
  assert.equal(game.getCampaignProgress(), 0);
  assert.deepEqual(messages(game), history);
});

test('invalid and repeated digits do not consume attempts', () => {
  const game = loadBrowserGame();
  game.start();
  for (const guess of ['12', '1123', 'abcd', '12 3']) game.submit(guess);
  assert.equal(game.gameState.attempts, 0);
  game.submit('4567');
  assert.equal(game.gameState.attempts, 1);
});

test('a new game accepts guesses after a finished game', () => {
  const game = loadBrowserGame();
  game.start();
  game.submit('0123');
  game.start('4567');
  game.submit('4567');
  assert.equal(game.gameState.attempts, 1);
  assert.equal(outcome(game), 'CODICE DECIFRATO');
});

for (const returnPath of ['lore', 'quit', 'victory']) {
  test(`free-play settings survive returning from campaign via ${returnPath}`, () => {
    const game = loadBrowserGame();
    game.click(game.feedbackButtons[2]);
    const slider = game.elements.get('codeLengthSlider');
    slider.value = '2';
    slider.dispatchEvent(new Event('input'));
    game.click('campaignModeBtn');
    game.click(game.elements.get('levelGrid').children[0]);

    if (returnPath === 'lore') {
      game.click('backToMenuBtn');
    } else {
      game.click('startLevelBtn');
      if (returnPath === 'quit') {
        game.click('quitGameBtn');
      } else {
        game.submit(game.gameState.secretCode);
        game.click(game.elements.get('gameOverConsole').children[1]);
        game.click(game.elements.get('gameOver').children[1]);
      }
    }
    game.click('backFromCampaignBtn');

    assert.equal(game.gameState.difficulty, 'difficult');
    assert.equal(game.gameState.codeLength, 7);
    assert.equal(game.gameState.difficultyMultiplier, 3);
    assert.equal(game.gameState.campaignMode, false);
    assert.equal(game.gameState.currentCampaignLevel, null);
    assert.equal(game.feedbackButtons[2].classList.contains('selected'), true);
    assert.equal(game.elements.get('codeLengthDisplay').textContent, '7 cifre');
    game.click('confirmLevelBtn');
    assert.ok(game.elements.get('loreConsole').innerHTML.includes(game.levelData.difficult[7].freePlay.lore));
  });
}

test('visiting campaign does not choose a free-play difficulty for the player', () => {
  const game = loadBrowserGame();
  game.click('campaignModeBtn');
  game.click(game.elements.get('levelGrid').children[0]);
  game.click('backToMenuBtn');
  game.click('backFromCampaignBtn');
  game.click('confirmLevelBtn');
  assert.equal(game.gameState.difficulty, null);
  assert.equal(game.elements.get('menu').classList.contains('hidden'), false);
  assert.equal(game.elements.get('loreScreen').classList.contains('hidden'), true);
});

for (const saved of ['garbage', '-1', '2junk', '1.5', '10', 'Infinity']) {
  test(`invalid campaign progress ${JSON.stringify(saved)} leaves the first level playable`, () => {
    const game = loadBrowserGame({ storage: { getItem: () => saved, setItem() {} } });
    game.renderCampaignLevels();
    assert.equal(game.getCampaignProgress(), 0);
    const cards = game.elements.get('levelGrid').children;
    assert.equal(cards.filter(card => !card.classList.contains('locked')).length, 1);
    assert.equal(cards[0].classList.contains('locked'), false);
  });
}

test('valid stored campaign progress is restored without unlocking extra levels', () => {
  for (let completed = 0; completed <= 9; completed++) {
    const game = loadBrowserGame({ storage: { getItem: () => String(completed), setItem() {} } });
    game.renderCampaignLevels();
    assert.equal(game.getCampaignProgress(), completed);
    const cards = game.elements.get('levelGrid').children;
    assert.equal(cards.filter(card => card.classList.contains('completed')).length, completed);
    assert.equal(cards.filter(card => !card.classList.contains('locked')).length, Math.min(9, completed + 1));
  }
});

test('unavailable browser storage does not prevent opening campaign', () => {
  const game = loadBrowserGame({ storage: {
    getItem() { throw new Error('Storage access denied'); },
    setItem() { throw new Error('Storage access denied'); },
  } });
  assert.doesNotThrow(() => game.click('campaignModeBtn'));
  const cards = game.elements.get('levelGrid').children;
  assert.equal(cards.length, 9);
  assert.equal(cards[0].classList.contains('locked'), false);
});

test('a failed save preserves the victory and unlocks the next level for this session', () => {
  const game = loadBrowserGame({ storage: {
    getItem: () => '0',
    setItem() { throw new Error('Storage quota exceeded'); },
  } });
  game.click('campaignModeBtn');
  game.click(game.elements.get('levelGrid').children[0]);
  game.click('startLevelBtn');
  assert.doesNotThrow(() => game.submit(game.gameState.secretCode));
  assert.equal(outcome(game), 'CODICE DECIFRATO');
  assert.equal(game.getCampaignProgress(), 1);
  game.renderCampaignLevels();
  assert.equal(game.elements.get('levelGrid').children[1].classList.contains('locked'), false);
  game.submit('4567');
  assert.equal(game.gameState.attempts, 1);
});

test('replaying earlier campaign levels never reduces saved progress', () => {
  const game = loadBrowserGame();
  game.saveCampaignProgress(3);
  game.saveCampaignProgress(0);
  assert.equal(game.getCampaignProgress(), 4);
  assert.equal(game.localStorage.getItem('crackTheCode_campaignProgress'), '4');
});

test('typing the final desktop digit keeps Enter available to submit', () => {
  const game = loadBrowserGame();
  game.start();
  const inputs = game.pinInputs();
  for (let index = 0; index < inputs.length; index++) {
    assert.equal(game.document.activeElement === inputs[index], true);
    inputs[index].value = '4567'[index];
    inputs[index].dispatchEvent(new Event('input'));
  }
  assert.equal(game.document.activeElement === inputs.at(-1), true);
  const enter = Object.assign(new Event('keydown', { cancelable: true }), { key: 'Enter' });
  game.document.activeElement.dispatchEvent(enter);
  assert.equal(game.gameState.attempts, 1);
  assert.ok(messages(game).includes('4567'));
});

test('virtual keyboard still enters and submits a guess on mobile', () => {
  const game = loadBrowserGame({ isMobile: true });
  game.start();
  const keys = game.elements.get('virtualKeyboard').children;
  for (const digit of '4567') game.click(keys.find(key => key.dataset.key === digit));
  assert.equal(game.pinInputs().map(input => input.value).join(''), '4567');
  game.click(keys.find(key => key.dataset.key === 'submit'));
  assert.equal(game.gameState.attempts, 1);
  assert.ok(messages(game).includes('4567'));
});
