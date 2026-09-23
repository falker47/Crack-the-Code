import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../data.js', import.meta.url), 'utf8');
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(
  source + '\n;globalThis.__ctc = { campaignLevels, levelData, crypticMessages };',
  sandbox
);

const { campaignLevels, levelData, crypticMessages } = sandbox.__ctc;
const expectedDifficulties = ['easy', 'medium', 'difficult'];
const expectedLengths = [4, 5, 7];

if (!Array.isArray(campaignLevels) || campaignLevels.length !== 9) {
  throw new Error(`Expected 9 campaign levels, found ${campaignLevels?.length ?? 'none'}`);
}

const combinations = new Set(
  campaignLevels.map(level => `${level.difficulty}:${level.codeLength}`)
);

for (const difficulty of expectedDifficulties) {
  for (const length of expectedLengths) {
    const key = `${difficulty}:${length}`;
    if (!combinations.has(key)) {
      throw new Error(`Missing campaign combination ${key}`);
    }

    const data = levelData?.[difficulty]?.[length];
    if (!data) throw new Error(`Missing levelData for ${key}`);

    if (typeof data.levelName !== 'string' || data.levelName.trim() === '') {
      throw new Error(`Missing levelName for ${key}`);
    }

    for (const mode of ['campaign', 'freePlay']) {
      const narrative = data[mode];
      if (!narrative || typeof narrative !== 'object') {
        throw new Error(`Missing ${mode} narrative for ${key}`);
      }

      for (const field of ['lore', 'victory', 'defeat']) {
        if (typeof narrative[field] !== 'string' || narrative[field].trim() === '') {
          throw new Error(`Missing ${mode}.${field} for ${key}`);
        }
      }
    }
  }
}

if (combinations.size !== 9) {
  throw new Error('Campaign contains duplicate difficulty/length combinations');
}

if (!Array.isArray(crypticMessages) || crypticMessages.length === 0) {
  throw new Error('Cryptic hint catalog is empty');
}

for (const [index, hint] of crypticMessages.entries()) {
  if (!Array.isArray(hint.digits) || hint.digits.length === 0) {
    throw new Error(`Hint ${index} has no digits`);
  }
  if (typeof hint.message !== 'string' || hint.message.trim() === '') {
    throw new Error(`Hint ${index} has no message`);
  }
  for (const digit of hint.digits) {
    if (!Number.isInteger(digit) || digit < 0 || digit > 9) {
      throw new Error(`Hint ${index} contains invalid digit ${digit}`);
    }
  }
}

for (let digit = 0; digit <= 9; digit++) {
  if (!crypticMessages.some(hint => hint.digits.includes(digit))) {
    throw new Error(`No cryptic hints available for digit ${digit}`);
  }
}

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
if (html.indexOf('<script src="data.js"></script>') > html.indexOf('<script src="script.js"></script>')) {
  throw new Error('data.js must load before script.js');
}

console.log('Crack-the-Code data validation passed.');
