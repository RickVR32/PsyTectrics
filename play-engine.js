/* PsyTectrics card games: rules engine (no DOM). Same rules as the printed decks.
   Narcissist Card Game and Bad Habits! share it; each game's card types map to an effect:
     bank   - goes in the bank / jar                 burn  - burn 1 extra Trigger (Narc/Empath, Bad Habit)
     pause  - nothing burns, draw 2 keep 1            shield - stays in hand, cancels the next Volatile
     vol    - resolves when drawn: burn 2, lose 1     held  - resolves when drawn: +1 to the bank
   Usage: const s = PTGame.create({ game, players:['Ric','Sam'], quick:false, softer:false });
          PTGame.startTurn(s) -> events;  PTGame.play(s, handIndex) -> events;  PTGame.choose(s, i) -> events
          s.status: 'turn' (waiting for a card) | 'choose' (pause: pick 1 of s.pending) | 'between' | 'won' | 'lost' */
(function (root) {
  const GAMES = {
    'narcissist': {
      name: 'Narcissist Card Game', trigger: 'trigger', triggerName: 'Trigger', bankName: 'bank', hand: 3,
      effect: { grounded: 'bank', narc: 'burn', empath: 'burn', pause: 'pause', shield: 'shield', volatile: 'vol', held: 'held' },
      loopTrap: true, // Narc straight after Empath (or the reverse) burns 1 more
      target: { full: [0, 4, 5, 6, 7, 8, 8], quick: [0, 3, 4] },
      label: { trigger: 'Trigger', grounded: 'Grounded', narc: 'Narc', empath: 'Empath', pause: 'Pause', shield: 'Shield', volatile: 'Volatile', held: 'Held' }
    },
    'bad-habits': {
      name: 'Bad Habits!', trigger: 'uhoh', triggerName: 'Uh-oh!', bankName: 'jar', hand: 3,
      effect: { good: 'bank', ask: 'bank', bad: 'burn', breathe: 'pause', loop: 'vol', held: 'held' },
      loopTrap: false,
      target: { full: [0, 6, 7, 8, 8, 8, 8], quick: [0, 4, 5] },
      label: { uhoh: 'Uh-oh!', good: 'Good Habit', ask: 'Ask!', bad: 'Bad Habit', breathe: 'Breathe', loop: 'Habit Loop!', held: 'Loop Held!' }
    }
  };
  const QUICK_TRIGGERS = 12, MAX_PLAYERS = 6;

  function rng(seed) { // mulberry32, so games can be replayed in tests
    if (seed == null) return Math.random;
    let a = seed >>> 0;
    return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function shuffle(a, r) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  function create(opts) {
    const G = GAMES[opts.game]; if (!G) throw new Error('Unknown game');
    const cards = (opts.cards || (typeof PTCards !== 'undefined' ? PTCards : require('./play-cards.js')))[opts.game];
    const names = (opts.players || ['You']).slice(0, MAX_PLAYERS);
    const quick = !!opts.quick && names.length <= 2;
    const r = rng(opts.seed);
    let id = 0; const tag = c => Object.assign({ id: id++ }, c);
    const s = {
      game: opts.game, quick, softer: !!opts.softer, harder: !!opts.harder, seed: opts.seed == null ? null : opts.seed,
      players: names.map(n => ({ name: String(n).slice(0, 16) || 'Player', hand: [], played: {} })),
      triggers: shuffle(cards.filter(c => c.t === G.trigger).map(tag), r),
      deck: shuffle(cards.filter(c => c.t !== G.trigger).map(tag), r),
      discard: [], bank: [], burned: [], used: [], current: null, turn: 0, turns: 0, last: null,
      stats: { burnedByResponse: 0, loopTraps: 0, volatile: 0, shields: 0, held: 0, pressure: 0, pauses: 0 },
      status: 'between', pending: null, log: []
    };
    if (quick) s.triggers = s.triggers.slice(0, QUICK_TRIGGERS);
    s.totalTriggers = s.triggers.length;
    const t = G.target[quick ? 'quick' : 'full'][names.length];
    s.target = Math.max(1, t - (s.softer ? 1 : 0));
    s._r = r;
    const ev = [];
    s.players.forEach((p, i) => fill(s, i, ev));
    s.setupEvents = ev; // volatile/held drawn during the deal
    checkWin(s, ev);
    return s;
  }

  const eff = (s, c) => GAMES[s.game].effect[c.t];
  const R = s => s._r || (s._r = rng(s.seed == null ? null : s.seed + s.turns * 7919));

  function draw(s, ev) {
    if (!s.deck.length) {
      if (!s.discard.length) return null;
      s.deck = shuffle(s.discard, R(s)); s.discard = []; ev.push({ k: 'reshuffle' });
    }
    return s.deck.pop();
  }
  function burn(s, n, why, ev) {
    let done = 0;
    for (let i = 0; i < n && s.triggers.length; i++) { s.burned.push(s.triggers.pop()); done++; }
    ev.push({ k: 'burn', n: done, why });
    return done;
  }
  function checkWin(s, ev) {
    if (s.status !== 'won' && s.bank.length >= s.target) { s.status = 'won'; s.pending = null; ev.push({ k: 'win' }); return true; }
    return s.status === 'won';
  }
  // draw one card, resolving Volatile / Held the moment they appear
  function take(s, ev) {
    for (;;) {
      const c = draw(s, ev); if (!c) return null;
      const e = eff(s, c);
      if (e === 'vol') {
        const holder = s.players.findIndex(p => p.hand.some(h => eff(s, h) === 'shield'));
        if (holder >= 0) {
          const h = s.players[holder].hand, i = h.findIndex(x => eff(s, x) === 'shield');
          s.discard.push(h.splice(i, 1)[0], c); s.stats.shields++;
          ev.push({ k: 'shield', card: c, by: holder });
          continue;
        }
        s.stats.volatile++;
        ev.push({ k: 'vol', card: c });
        burn(s, 2, 'volatile', ev);
        if (s.bank.length) { s.discard.push(s.bank.pop()); ev.push({ k: 'lose1' }); }
        s.discard.push(c); continue;
      }
      if (e === 'held') { s.bank.push(c); s.stats.held++; ev.push({ k: 'held', card: c }); if (checkWin(s, ev)) return null; continue; }
      return c;
    }
  }
  function fill(s, pi, ev) {
    const h = s.players[pi].hand;
    while (h.length < GAMES[s.game].hand && s.status !== 'won') { const c = take(s, ev); if (!c) break; h.push(c); }
  }

  function startTurn(s) {
    const ev = [];
    if (s.status === 'won' || s.status === 'lost') return ev;
    if (s.bank.length >= s.target) { checkWin(s, ev); return ev; }
    if (!s.triggers.length) { s.status = 'lost'; ev.push({ k: 'lose' }); return ev; }
    s.current = s.triggers.pop(); s.turns++;
    s.status = 'turn';
    ev.push({ k: 'flip', card: s.current, player: s.turn });
    return ev;
  }

  // Which cards in the current hand can be played (a Shield only if nothing else can be)
  function playable(s) {
    const h = s.players[s.turn].hand;
    const ok = h.map(c => eff(s, c) !== 'shield');
    if (!ok.some(Boolean)) return h.map(() => true);
    return ok;
  }

  function play(s, i) {
    const ev = [];
    if (s.status !== 'turn') return ev;
    const P = s.players[s.turn], c = P.hand[i];
    if (!c || !playable(s)[i]) return ev;
    P.hand.splice(i, 1);
    const e = eff(s, c), G = GAMES[s.game];
    P.played[c.t] = (P.played[c.t] || 0) + 1;
    ev.push({ k: 'play', card: c, player: s.turn, effect: e });
    if (e === 'bank') {
      s.bank.push(c); s.last = c.t;
      ev.push({ k: 'bank', card: c });
      if (checkWin(s, ev)) return ev;
      if (c.d) { const x = take(s, ev); if (x) P.hand.push(x); ev.push({ k: 'drew' }); if (s.status === 'won') return ev; }
    } else if (e === 'pause') {
      s.discard.push(c); s.stats.pauses++;
      const opts = [take(s, ev), s.status === 'won' ? null : take(s, ev)].filter(Boolean);
      if (s.status === 'won') { P.hand.push(...opts); return ev; }
      if (opts.length > 1) { s.pending = opts; s.status = 'choose'; ev.push({ k: 'choose', options: opts }); return ev; }
      if (opts.length === 1) P.hand.push(opts[0]);
    } else {
      s.discard.push(c);
      if (e === 'burn') {
        burn(s, 1, 'response', ev); s.stats.burnedByResponse++;
        if (G.loopTrap && s.last && s.last !== c.t && GAMES[s.game].effect[s.last] === 'burn') { burn(s, 1, 'loop', ev); s.stats.loopTraps++; ev.push({ k: 'loop' }); }
        s.last = c.t;
      }
      // Pressure Trigger: empty bank and no Grounded played -> burn 1 more
      if (s.current && s.current.p && !s.bank.length) { burn(s, 1, 'pressure', ev); s.stats.pressure++; }
    }
    return endTurn(s, ev);
  }

  function choose(s, i) {
    const ev = [];
    if (s.status !== 'choose' || !s.pending || !s.pending[i]) return ev;
    const P = s.players[s.turn];
    P.hand.push(s.pending[i]);
    s.pending.forEach((c, j) => { if (j !== i) s.discard.push(c); });
    s.pending = null; s.status = 'turn';
    ev.push({ k: 'kept', card: P.hand[P.hand.length - 1] });
    return endTurn(s, ev);
  }

  function endTurn(s, ev) {
    if (s.current) s.used.push(s.current); s.current = null;
    fill(s, s.turn, ev);
    if (checkWin(s, ev)) return ev;
    s.turn = (s.turn + 1) % s.players.length;
    s.status = 'between';
    ev.push({ k: 'next', player: s.turn });
    return ev;
  }

  // The move a sensible player makes (used by tests and the "hint" button)
  function hint(s) {
    if (s.status === 'choose') { const i = s.pending.findIndex(c => eff(s, c) === 'bank'); return i < 0 ? 0 : i; }
    const h = s.players[s.turn].hand, ok = playable(s);
    const pick = f => h.findIndex((c, i) => ok[i] && f(c));
    let i = pick(c => eff(s, c) === 'bank'); if (i >= 0) return i;
    i = pick(c => eff(s, c) === 'pause'); if (i >= 0) return i;
    // a response that doesn't spring the Loop Trap
    i = pick(c => eff(s, c) === 'burn' && (!GAMES[s.game].loopTrap || !s.last || s.last === c.t || GAMES[s.game].effect[s.last] !== 'burn')); if (i >= 0) return i;
    return ok.indexOf(true);
  }

  // Save / load (the RNG is not saved; a reloaded game reshuffles with Math.random)
  function save(s) { const o = Object.assign({}, s); delete o._r; delete o.setupEvents; return JSON.stringify(o); }
  function load(str) { const s = JSON.parse(str); if (!GAMES[s.game]) throw new Error('bad save'); s._r = Math.random; return s; }

  const API = { GAMES, QUICK_TRIGGERS, MAX_PLAYERS, create, startTurn, play, choose, playable, hint, save, load, effect: eff };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.PTGame = API;
})(this);
