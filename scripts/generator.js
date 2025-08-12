// Utilities for generating multiplication problems based on configurations

/**
 * @typedef {Object} GlobalOptions
 * @property {'independent'|'deck'} randomMode
 * @property {boolean} commutativeDuplicates // Only relevant in deck mode
 * @property {boolean} allowCommutativity // If true, randomly flip top/bottom
 * @property {number} problemsPerPage
 * @property {number} problemsPerRow
 */

/**
 * @typedef {Object} Config
 * @property {number} leftFrom
 * @property {number} leftTo
 * @property {number} rightFrom
 * @property {number} rightTo
 * @property {number} pagesCount
 */

/**
 * Build an array of integers from a..b inclusive.
 * @param {number} a
 * @param {number} b
 * @returns {number[]}
 */
export function rangeInclusive(a, b) {
  const start = Math.min(a, b);
  const end = Math.max(a, b);
  const out = [];
  for (let i = start; i <= end; i++) out.push(i);
  return out;
}

/**
 * Generate all unique pairs (a,b) from leftSet x rightSet. If dedupeCommutative is true,
 * only include pairs where a<=b when both sets equal; otherwise include all pairs.
 * When sets differ, dedupeCommutative means we dedupe (a,b) vs (b,a) across Cartesian product.
 * @param {number[]} leftSet
 * @param {number[]} rightSet
 * @param {boolean} dedupeCommutative
 * @returns {[number, number][]}
 */
export function buildPairs(leftSet, rightSet, dedupeCommutative) {
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
        pairs.push([a1, b1]);
      } else {
        pairs.push([a, b]);
      }
    }
  }
  return pairs;
}

/**
 * Fisher–Yates shuffle in-place.
 * @param {any[]} arr
 */
export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generate problems for one configuration according to global options.
 * @param {Config} cfg
 * @param {GlobalOptions} options
 * @returns {{ pages: Array<{ problems: Array<{ top:number, bottom:number }> }> }}
 */
export function generateForConfig(cfg, options) {
  const leftSet = rangeInclusive(cfg.leftFrom, cfg.leftTo);
  const rightSet = rangeInclusive(cfg.rightFrom, cfg.rightTo);
  const totalPerPage = Math.max(1, options.problemsPerPage | 0);
  const pages = [];

  if (options.randomMode === 'deck') {
    // Build deck once per configuration and consume across pages
    let deck = buildPairs(leftSet, rightSet, !!options.commutativeDuplicates);
    deck = shuffle(deck);

    for (let p = 0; p < cfg.pagesCount; p++) {
      const problems = [];
      for (let i = 0; i < totalPerPage; i++) {
        if (deck.length === 0) {
          // Rebuild and reshuffle deck when exhausted
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
    // Independent draws per problem
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

/**
 * Generate for multiple configurations and flatten pages
 * @param {Config[]} configs
 * @param {GlobalOptions} options
 */
export function generate(configs, options) {
  const allPages = [];
  for (const cfg of configs) {
    const { pages } = generateForConfig(cfg, options);
    allPages.push(...pages);
  }
  return allPages;
}


