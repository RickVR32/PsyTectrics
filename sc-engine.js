/* SC Engine v4 — one scoring engine for every PsyTectrics test.
   A test is a list of items. Each item belongs to a pattern (Narc, Empath, Grounded, Volatile),
   a node (one of the 8 codes or 4 apps) and a side:
     light  = the healthy expression (conscious layer)
     shadow = the distorted expression (subconscious layer)
     recog  = Observer Code, conscious: "I know I do this"
     role   = Observer Code, subconscious: the role actually running
   Answers are 1–5. Nothing is reverse-scored. Short tests simply have fewer items. */
(function (root) {
  const PATTERNS = ['Narc', 'Empath', 'Grounded', 'Volatile'];
  const STAGES = ['Instinct', 'Reaction', 'Observation', 'Regulation', 'Presence'];

  // The framework's 12 nodes: 2 Source Codes + 1 App per pattern (the second App per pattern
  // is folded into the same node set for display). Fix text points to the book.
  const NODES = {
    intention:  { pattern: 'Narc', name: 'Intention', fix: 'Say what you want, then leave room for their answer.', ch: 'Ch 15 · Language for the Narc role' },
    presence:   { pattern: 'Narc', name: 'Presence', fix: 'Name it instead of going quiet: "I\'m not ignoring you, I need a moment."', ch: 'Ch 15 · Language for the Narc role' },
    ownership:  { pattern: 'Narc', name: 'Ownership', fix: 'Repair out loud: "I know I escalated. I want to take responsibility."', ch: 'Ch 15 · Repair language' },
    impact:     { pattern: 'Narc', name: 'Impact', fix: 'Shift from content to process: "I think we\'re talking past each other."', ch: 'Ch 13 · Practical interruption tools' },
    balance:    { pattern: 'Empath', name: 'Balance', fix: 'Say less than you feel driven to say.', ch: 'Ch 15 · Language for the Empath role' },
    connection: { pattern: 'Empath', name: 'Connection', fix: 'Turn pursuit into disclosure: "I\'m scared of the silence."', ch: 'Ch 15 · Language for the Empath role' },
    clearhead:  { pattern: 'Empath', name: 'Clear Head', fix: 'Regulate before you explain: pause and slow your breathing first.', ch: 'Ch 13 · How awareness returns' },
    holding:    { pattern: 'Empath', name: 'Holding Ground', fix: 'Acknowledge without taking it on: "I can see this is hard for you."', ch: 'Ch 15 · Acknowledging without agreeing' },
    coreself:   { pattern: 'Grounded', name: 'Core Self', fix: 'Let feelings show early and small, before they build up behind the calm.', ch: 'Ch 10 · Balance vs suppression' },
    integrity:  { pattern: 'Grounded', name: 'Integrity', fix: 'Don\'t skip repair once things calm down — go back to it with awareness.', ch: 'Ch 7 · The emotional hangover' },
    consistency:{ pattern: 'Grounded', name: 'Consistency', fix: 'Use the conversation container: frame, share, reflect, close.', ch: 'Ch 16 · Structured conversations' },
    honesty:    { pattern: 'Grounded', name: 'Honesty', fix: 'Spot the story you\'re telling yourself before you react to it.', ch: 'Ch 3 · Trigger, story, reaction' },
    purpose:    { pattern: 'Volatile', name: 'Purpose', fix: 'Give intensity a direction: one plan, one next step, before you act.', ch: 'Ch 9.5 · The Volatile role' },
    pattern:    { pattern: 'Volatile', name: 'Pattern', fix: 'Learn your early warning signs and act on the first one.', ch: 'Ch 13 · Your earliest escalation signal' },
    limit:      { pattern: 'Volatile', name: 'Limit', fix: 'Exit with clarity: "I can\'t do this right now. Let\'s come back to it."', ch: 'Ch 13 · When interruption fails' },
    cycles:     { pattern: 'Volatile', name: 'Breaking Cycles', fix: 'React a little differently, then make sure the moment ends safely.', ch: 'Ch 17 · Rewiring the loop' }
  };

  const to100 = v => (v - 1) / 4 * 100;
  const mean = xs => xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null;

  function score(test, answers) {
    const nodes = {}, pat = {};
    PATTERNS.forEach(p => { pat[p] = { light: [], shadow: [], recog: [], role: [] }; });
    for (const item of test.items) {
      const v = answers[item.id];
      if (v == null) continue;
      const s = to100(+v);
      pat[item.pattern][item.side].push(s);
      if (item.node && (item.side === 'light' || item.side === 'shadow')) {
        nodes[item.node] = nodes[item.node] || { light: [], shadow: [] };
        nodes[item.node][item.side].push(s);
      }
    }
    // Node scores
    const N = {};
    for (const [id, n] of Object.entries(nodes)) {
      const def = (test.nodes && test.nodes[id]) || NODES[id] || { name: id };
      const light = mean(n.light), shadow = mean(n.shadow);
      N[id] = { id, pattern: def.pattern || (test.items.find(i => i.node === id) || {}).pattern, name: def.name, fix: def.fix, ch: def.ch,
        light, shadow, balance: light != null && shadow != null ? light - shadow : null };
    }
    // Pattern scores: shadow includes the Observer Code role item
    const P = {};
    PATTERNS.forEach(p => {
      const x = pat[p];
      P[p] = { light: mean(x.light), shadow: mean([...x.shadow, ...x.role]), recog: mean(x.recog), role: mean(x.role) };
    });
    const v0 = (x, d) => x == null ? d : x;
    const lean = v0(P.Empath.shadow, 50) - v0(P.Narc.shadow, 50);               // −100 Narc … +100 Empath
    const charge = (v0(P.Narc.shadow, 50) + v0(P.Empath.shadow, 50)) / 2;        // how hard the roles run
    const regulation = (v0(P.Grounded.light, 50) + (100 - v0(P.Volatile.shadow, 50))) / 2;
    const both = Object.values(N).filter(n => n.balance != null);
    const overlap = both.length ? mean(both.map(n => Math.min(n.light, n.shadow))) : 0;
    const gaps = PATTERNS.map(p => P[p].role != null && P[p].recog != null ? Math.max(0, P[p].role - P[p].recog) : null).filter(x => x != null);
    const ocGap = gaps.length ? mean(gaps) : 0;
    const drift = (0.7 * overlap + 0.3 * ocGap) / 20;                            // 0–5
    const d = Math.hypot(lean / 100, charge / 100, (100 - regulation) / 100, drift / 5) / 2;
    const level = Math.max(1, Math.min(10, Math.round(10 - 9 * d / 0.66)));
    const ring = Math.ceil(level / 2);
    const needs = both.map(n => ({ ...n, imbalance: n.shadow - n.light }))
      .filter(n => n.imbalance > 0).sort((a, b) => b.imbalance - a.imbalance).slice(0, 3);
    // Ratio kept for display: each pattern's share of total shadow
    const shTot = PATTERNS.reduce((s, p) => s + v0(P[p].shadow, 0), 0) || 1;
    const ratio = {}; let acc = 0;
    PATTERNS.forEach((p, i) => { ratio[p] = i < 3 ? Math.round(v0(P[p].shadow, 0) / shTot * 100) : 100 - acc; acc += ratio[p]; });
    let type;
    if (charge < 35 && regulation > 65) type = 'zero';
    else if (Math.abs(lean) < 20) type = charge >= 55 ? 'loop' : 'mixed';
    else type = lean < 0 ? 'narc' : 'empath';
    return { version: 'v4', type, level, ring, stage: STAGES[ring - 1], lean, charge, regulation, drift, distance: d,
      overlap, ocGap, ratio, patterns: P, nodes: N, needs };
  }

  const leanLabel = l => { const a = Math.abs(Math.round(l)); return a < 10 ? 'Centred' : (l < 0 ? 'Narc ' : 'Empath ') + a; };

  root.SCEngine = { score, NODES, PATTERNS, STAGES, leanLabel };
  if (typeof module !== 'undefined') module.exports = root.SCEngine;
})(typeof window !== 'undefined' ? window : globalThis);
