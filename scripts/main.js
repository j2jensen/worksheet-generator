import { generate } from './generator.js';

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
  const randomMode = data.getAll('randomMode').length ? data.get('randomMode') : 'independent';
  const allowCommutativity = data.get('allowCommutativity') === 'on';
  const commutativeDuplicates = data.get('commutativeDuplicates') === 'on';
  return { problemsPerPage, problemsPerRow, randomMode, allowCommutativity, commutativeDuplicates };
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

function render(pages, problemsPerRow) {
  pagesContainer.innerHTML = '';
  for (const page of pages) {
    const pageEl = el('section', 'page');
    const grid = el('div', 'problems-grid');
    grid.style.gridTemplateColumns = `repeat(${problemsPerRow}, 1fr)`;
    for (const prob of page.problems) {
      const probEl = el('div', 'problem');
      const vp = el('div', 'vertical-problem');
      const op = el('div', 'op'); op.textContent = '×';
      const top = el('div', 'top'); top.textContent = String(prob.top);
      const bottom = el('div', 'bottom'); bottom.textContent = String(prob.bottom);
      const line = el('div', 'line');
      const answer = el('div', 'answer');
      vp.append(op, top, bottom, line, answer);
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
  render(pages, options.problemsPerRow);
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


