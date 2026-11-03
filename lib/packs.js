/* Every engine (v4) test, loaded statically so Vercel bundles them, plus one scoring helper.
   Couples tests are scored twice: once for "me", once for "partner". */
const E = require('../sc-engine.js');
const PACKS = {
  'awareness-profile': require('../tests/awareness-profile.json'),
  'quick-check': require('../tests/quick-check.json'),
  'narc-check': require('../tests/narc-check.json'),
  'dealing-with-narc': require('../tests/dealing-with-narc.json'),
  'couples': require('../tests/couples.json'),
  'money': require('../tests/money.json'),
  'work': require('../tests/work.json')
};
const NAMES = {
  'awareness-profile': 'Awareness Profile', 'quick-check': 'Quick Check', 'narc-check': 'Narc Pattern Self-Check',
  'dealing-with-narc': 'Am I Dealing With a Narc?', 'couples': 'Couples Balance', 'money': 'Money Balance', 'work': 'Work Balance'
};
function score(pack, answers) {
  const keyed = {}; pack.items.forEach((it, i) => { if (answers[i] != null) keyed[it.id] = answers[i]; });
  if (pack.couples) {
    const part = who => ({ ...pack, items: pack.items.filter(i => i.who === who) });
    return { couples: true, me: E.score(part('me'), keyed), partner: E.score(part('partner'), keyed) };
  }
  return E.score(pack, keyed);
}
function pairKey(a, b) {
  const t = [a.type, b.type];
  if (t.includes('loop')) return 'loop+any';
  if (t.includes('narc') && t.includes('empath')) return 'narc+empath';
  if (t[0] === 'narc' && t[1] === 'narc') return 'narc+narc';
  if (t[0] === 'empath' && t[1] === 'empath') return 'empath+empath';
  return 'steady';
}
const valid = (pack, answers) => Array.isArray(answers) && answers.length === pack.items.length && answers.every(a => Number.isInteger(a) && a >= 1 && a <= 5);
module.exports = { PACKS, NAMES, score, pairKey, valid };
