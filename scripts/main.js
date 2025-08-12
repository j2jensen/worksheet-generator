// Inlined generator utilities to avoid CORS issues with ES modules when opened via file://
function rangeInclusive(a, b) {
  const start = Math.min(a, b);
  const end = Math.max(a, b);
  const out = [];
  for (let i = start; i <= end; i++) out.push(i);
  return out;
}

function buildPairs(leftSet, rightSet, dedupeCommutative) {
  const pairs = [];
  const seen = new Set();
  for (const a of leftSet) {
    for (const b of rightSet) {
      if (dedupeCommutative) {
        const a1 = Math.min(a, b);
        const b1 = Math.max(a, b);
        const key = `${a1}x${b1}`;
        if (seen.has(key)) continue;
        seen.add(key);
        pairs.push([a, b]);
      } else {
        pairs.push([a, b]);
      }
    }
  }
  return pairs;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateForConfig(cfg, options) {
  const leftSet = rangeInclusive(cfg.leftFrom, cfg.leftTo);
  const rightSet = rangeInclusive(cfg.rightFrom, cfg.rightTo);
  const totalPerPage = Math.max(1, options.problemsPerPage | 0);
  const pages = [];

  if (options.randomMode === 'deck') {
    let deck = buildPairs(leftSet, rightSet, !!options.commutativeDuplicates);
    deck = shuffle(deck);
    for (let p = 0; p < cfg.pagesCount; p++) {
      const problems = [];
      for (let i = 0; i < totalPerPage; i++) {
        if (deck.length === 0) {
          deck = buildPairs(leftSet, rightSet, !!options.commutativeDuplicates);
          deck = shuffle(deck);
        }
        const [a, b] = deck.pop();
        if (options.allowCommutativity) {
          const flip = Math.random() < 0.5;
          problems.push({ top: flip ? b : a, bottom: flip ? a : b });
        } else {
          problems.push({ top: a, bottom: b });
        }
      }
      pages.push({ problems });
    }
  } else {
    const allPairs = buildPairs(leftSet, rightSet, false);
    for (let p = 0; p < cfg.pagesCount; p++) {
      const problems = [];
      for (let i = 0; i < totalPerPage; i++) {
        const [a, b] = allPairs[Math.floor(Math.random() * allPairs.length)];
        if (options.allowCommutativity) {
          const flip = Math.random() < 0.5;
          problems.push({ top: flip ? b : a, bottom: flip ? a : b });
        } else {
          problems.push({ top: a, bottom: b });
        }
      }
      pages.push({ problems });
    }
  }
  return { pages };
}

function generate(configs, options) {
  const allPages = [];
  for (const cfg of configs) {
    const { pages } = generateForConfig(cfg, options);
    allPages.push(...pages);
  }
  return allPages;
}

const pagesContainer = document.getElementById('pages');
const form = document.getElementById('controls');
const addConfigBtn = document.getElementById('addConfigBtn');
const configsHost = document.getElementById('configs');
const configTemplate = document.getElementById('configTemplate');
const regenerateBtn = document.getElementById('regenerateBtn');
const printBtn = document.getElementById('printBtn');

function el(tag, cls) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  return e;
}

function readGlobalOptions() {
  const data = new FormData(form);
  const problemsPerPage = Math.max(1, parseInt(data.get('problemsPerPage')) || 40);
  const problemsPerRow = Math.max(1, parseInt(data.get('problemsPerRow')) || 4);
  const problemSize = data.get('problemSize') || 'medium';
  const randomMode = data.getAll('randomMode').length ? data.get('randomMode') : 'independent';
  const allowCommutativity = data.get('allowCommutativity') === 'on';
  const commutativeDuplicates = data.get('commutativeDuplicates') === 'on';
  return { problemsPerPage, problemsPerRow, randomMode, allowCommutativity, commutativeDuplicates, problemSize };
}

function readConfigs() {
  /** @type {Array<{leftFrom:number,leftTo:number,rightFrom:number,rightTo:number,pagesCount:number}>} */
  const out = [];
  const cfgEls = configsHost.querySelectorAll('.config');
  for (const cfgEl of cfgEls) {
    const getNum = (name, def) => {
      const input = cfgEl.querySelector(`input[name="${name}"]`);
      const v = parseInt(input.value);
      return Number.isFinite(v) ? v : def;
    };
    out.push({
      leftFrom: getNum('leftFrom', 1),
      leftTo: getNum('leftTo', 9),
      rightFrom: getNum('rightFrom', 1),
      rightTo: getNum('rightTo', 10),
      pagesCount: Math.max(1, getNum('pagesCount', 1)),
    });
  }
  return out;
}

function applySizeVars(size) {
  const root = document.documentElement;
  if (size === 'small') {
    root.style.setProperty('--problem-font-size', '16px');
    root.style.setProperty('--answer-height', '28px');
    root.style.setProperty('--problem-gap', '10px');
  } else if (size === 'large') {
    root.style.setProperty('--problem-font-size', '22px');
    root.style.setProperty('--answer-height', '46px');
    root.style.setProperty('--problem-gap', '14px');
  } else {
    root.style.setProperty('--problem-font-size', '20px');
    root.style.setProperty('--answer-height', '40px');
    root.style.setProperty('--problem-gap', '12px');
  }
}

function render(pages, problemsPerRow, size) {
  applySizeVars(size);
  pagesContainer.innerHTML = '';
  for (const page of pages) {
    const pageEl = el('section', 'page');
    // Ensure exactly problemsPerPage items per page grid; any extras must go to next page
    const grid = el('div', 'problems-grid');
    grid.style.gridTemplateColumns = `repeat(${problemsPerRow}, 1fr)`;
    for (const prob of page.problems) {
      const probEl = el('div', 'problem');
      const vp = el('div', 'vertical-problem');
      const op = el('div', 'op'); op.textContent = '×';
      const top = el('div', 'top'); top.textContent = String(prob.top);
      const bottom = el('div', 'bottom'); bottom.textContent = String(prob.bottom);
      const answer = el('div', 'answer');
      vp.append(op, top, bottom, answer);
      probEl.append(vp);
      grid.append(probEl);
    }
    pageEl.append(grid);
    pagesContainer.append(pageEl);
  }
}

function regenerate() {
  const options = readGlobalOptions();
  const configs = readConfigs();
  const pages = generate(configs, options);
  render(pages, options.problemsPerRow, options.problemSize);
}

function addConfig(initial) {
  // Clone template and append first; then wire listeners on appended node
  const fragment = configTemplate.content.cloneNode(true);
  configsHost.appendChild(fragment);
  const fieldset = configsHost.lastElementChild;
  const removeBtn = fieldset.querySelector('.removeConfigBtn');
  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      fieldset.remove();
      regenerate();
    });
  }

  if (!initial) {
    regenerate();
  }
}

function wireFormAutoRegenerate() {
  // Regenerate on any change to keep preview live
  form.addEventListener('input', (e) => {
    if (e.target && e.target.matches('input, select')) {
      regenerate();
    }
  });
  form.addEventListener('change', () => regenerate());
}

function main() {
  // Initial one config
  addConfig(true);
  // Prefill with a default config (1–9) x (1–10), 1 page
  regenerate();

  // Add new config button
  addConfigBtn.addEventListener('click', () => addConfig());

  // Regenerate button
  regenerateBtn.addEventListener('click', () => regenerate());

  // Print button
  printBtn.addEventListener('click', () => window.print());

  wireFormAutoRegenerate();
}

document.addEventListener('DOMContentLoaded', main);


