// Run: node manager-on-duty/test.cjs
const fs = require('fs'), path = require('path'), assert = require('assert');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const core = html.match(/<script id="core">([\s\S]*?)<\/script>/)[1];
const m = { exports: {} };
new Function('module', core)(m);
const { parseNum, calcPrime, buildHandoff, needsCaution, buildReview, wordCount } = m.exports;
const T = { cogs: null, labor: null, prime: null };
const pct = r => r.rows.map(x => x.pct);

assert.deepStrictEqual(pct(calcPrime({ sales: 48000, cogs: 14400, labor: 16800, targets: T })), [30.0, 35.0, 65.0]);
assert.deepStrictEqual(pct(calcPrime({ sales: 52300, cogs: 17800, labor: 19900, targets: T })), [34.0, 38.0, 72.1]);
assert.strictEqual(calcPrime({ sales: 0, cogs: 1, labor: 1, targets: T }).state, 'error');
assert.strictEqual(calcPrime({ sales: -5, cogs: 1, labor: 1, targets: T }).state, 'error');
assert.strictEqual(calcPrime({ sales: null, cogs: null, labor: null, targets: T }).message, 'Enter net sales to begin');
assert.strictEqual(calcPrime({ sales: 1000, cogs: null, labor: 300, targets: T }).rows.length, 1); // no invented prime
const r = calcPrime({ sales: 52300, cogs: 17800, labor: 19900, targets: T });
assert.deepStrictEqual(r.rows.map(x => x.status), ['Over target', 'Over target', 'Over target']);
assert.strictEqual(calcPrime({ sales: 48000, cogs: 14400, labor: 16800, targets: T }).rows[1].status, 'Over target'); // 35 vs 32
assert.strictEqual(parseNum('$48,000.50'), 48000.5);
assert.strictEqual(parseNum(''), null);
assert.strictEqual(parseNum('abc'), null);

const h = buildHandoff({ date: '', shift: 'Close', manager: '', must: 'Order ice\n\nFix walk-in door', guest: 'Table 12 waited 40 min' });
assert(h.includes('Date: not stated') && h.includes('Manager: not stated') && h.includes('1. Order ice') && h.includes('2. Fix walk-in door'));
assert(!h.includes('STAFFING'));

assert(needsCaution('I got food poisoning here') && needsCaution('my lawyer will call') && needsCaution('She stole my bag'));
assert(!needsCaution('Great steak, slow service'));

for (const stars of [1, 2, 3, 4, 5]) {
  for (const f of [{ restaurant: 'The Oak Room', guest: 'Sam', detail: 'the ribeye', contact: 'gm@example.com' },
                   { restaurant: 'The Oak Room Steakhouse and Raw Bar', guest: 'Alexandria Montgomery', detail: 'x '.repeat(39).trim(), contact: '' }]) {
    const out = buildReview(Object.assign({ stars, signature: 'The Management Team' }, f));
    assert(wordCount(out.long) < 120, stars + ' long ' + wordCount(out.long));
    assert(wordCount(out.short) < 50, stars + ' short ' + wordCount(out.short));
    assert(!/comp|refund|value your feedback/i.test(out.long + out.short));
    if (stars <= 2) assert(/gm@example.com|\[phone or email\]/.test(out.long));
  }
}
assert.strictEqual(buildReview({ stars: '' }), null);
console.log('all tests passed');
