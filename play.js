/* PsyTectrics Play: the screens around play-engine.js */
(function () {
  const E = window.PTGame, $ = id => document.getElementById(id);
  const SAVE = 'pt-play-save', UNLOCK = 'pt-play-unlock', PREFS = 'pt-play-prefs';
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- look of each card type ---------- */
  const LOOK = {
    narcissist: {
      trigger: ['TRIGGER', '#060B18', '#00D4FF', '⚡', 1], narc: ['NARC', '#C4622D', '#fff', '▼'], empath: ['EMPATH', '#1D9E75', '#fff', '◆'],
      grounded: ['GROUNDED', '#534AB7', '#fff', '●'], volatile: ['VOLATILE', '#A0426B', '#fff', '▲'], held: ['HELD', '#A0426B', '#fff', '✦'],
      pause: ['OBSERVER · PAUSE', '#0B1020', '#00D4FF', '◉', 1], shield: ['OBSERVER · SHIELD', '#0B1020', '#00D4FF', '◈', 1]
    },
    'bad-habits': {
      uhoh: ['UH-OH!', '#2F6FED', '#fff'], bad: ['BAD HABIT', '#F2843A', '#fff'], good: ['GOOD HABIT', '#22A35A', '#fff'], ask: ['ASK!', '#F5C518', '#2B2100'],
      breathe: ['BREATHE', '#4CC3EE', '#08303D'], loop: ['HABIT LOOP!', '#E5484D', '#fff'], held: ['LOOP HELD!', '#22A35A', '#fff']
    }
  };
  const FX = {
    narcissist: { grounded: c => c.d ? 'Bank it, then draw 1 card.' : 'Bank it.', narc: () => 'Burn 1 extra Trigger.', empath: () => 'Burn 1 extra Trigger.',
      pause: () => 'Play instead of a response: no Trigger burned. Draw 2, keep 1.', shield: () => 'Keep in hand. Cancels the next Volatile.',
      volatile: () => 'Burn 2 Triggers, lose 1 banked card.', held: () => 'Add it to the bank.',
      trigger: c => c.p ? '<b>Pressure:</b> if the bank is empty, play Grounded or burn 1 extra Trigger.' : c.w ? '<b>Witness:</b> say which card you\'ll play before you play it.' : 'Talk it through. Whoever\'s turn it is plays one card.' },
    'bad-habits': { good: () => 'Put it in the Jar.', ask: () => 'Ask it out loud. Everyone has a go at answering. Then it goes in the Jar.', bad: () => 'Throw away 1 more Uh-oh! card.',
      breathe: () => 'No Uh-oh! card thrown away. Pick up 2, keep 1.', loop: () => 'Throw away 2 Uh-oh! cards and take 1 out of the Jar.', held: () => 'Put it in the Jar!',
      uhoh: () => 'What would YOU do? Everyone helps choose.' }
  };
  function face(kind, col) { // little drawn faces for Bad Habits!
    const D = '#1B1B2F', st = `stroke="${D}" stroke-width="6" fill="none" stroke-linecap="round"`;
    let eyes = `<circle cx="35" cy="42" r="5" fill="${D}"/><circle cx="65" cy="42" r="5" fill="${D}"/>`;
    const m = { uhoh: `<ellipse cx="50" cy="68" rx="8" ry="10" fill="${D}"/>`, bad: `<path d="M33 72 Q50 58 67 72" ${st}/><path d="M27 32 L42 37 M73 32 L58 37" ${st}/>`,
      good: `<path d="M32 62 Q50 80 68 62" ${st}/>`, ask: `<path d="M40 66 Q50 60 60 66" ${st}/><text x="76" y="30" font-size="30" font-weight="700" fill="${D}">?</text>`,
      breathe: `<circle cx="50" cy="68" r="6" ${st}/>`, loop: `<path d="M30 70 Q40 60 50 70 T70 70" ${st}/><path d="M28 34 L42 40 M72 34 L58 40" ${st}/>`, held: `<path d="M30 60 Q50 84 70 60" ${st}/>` }[kind] || '';
    if (kind === 'breathe') eyes = `<path d="M29 43 L41 43 M59 43 L71 43" ${st}/>`;
    if (kind === 'held') eyes = `<path d="M28 44 Q35 36 42 44 M58 44 Q65 36 72 44" ${st}/>`;
    return `<svg class="face" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="52" r="44" fill="${col}"/><circle cx="50" cy="52" r="44" fill="#fff" opacity=".35"/>${eyes}${m}</svg>`;
  }
  function cardHTML(game, c, opts = {}) {
    const L = LOOK[game][c.t]; const [name, bg, fg, sym, dark] = L;
    const kids = game === 'bad-habits', fx = FX[game][c.t](c);
    const q = c.q, long = q.replace(/<[^>]+>/g, '').length > (kids ? 62 : 74);
    const tag = opts.tag || 'div';
    const attrs = opts.attrs || '';
    return `<${tag} class="card${dark ? ' dark' : ''}${kids ? ' kids' : ''}${opts.cls ? ' ' + opts.cls : ''}" ${attrs}>
      <div class="band" style="background:${bg};color:${fg}"><span>${name}</span>${sym ? `<i>${sym}</i>` : ''}</div>
      <div class="q${long ? ' long' : ''}">${kids ? face(c.t, bg) : ''}<span>${q}</span></div>
      <div class="fx"${kids ? ` style="background:${bg}22"` : ''}>${fx}</div>${opts.warn ? `<span class="warn">${opts.warn}</span>` : ''}</${tag}>`;
  }

  /* ---------- access ---------- */
  let unlocked = store.get(UNLOCK, {}); let member = false;
  const canFull = g => member || !!unlocked[g] || !!unlocked.all;
  if (window.PTAuth) PTAuth.ready.then(async () => { if (!PTAuth.user()) return; const me = await PTAuth.me(); if (me && me.member && me.member.active) { member = true; if (!$('sSetup').hidden) renderSetup(); } });

  /* ---------- screens ---------- */
  let hinted = 0, G = null, S = null, sel = -1, prefs = store.get(PREFS, { players: 1, names: [], softer: false, harder: false });
  function show(id) {
    ['sHome', 'sSetup', 'sTable', 'sEnd'].forEach(s => $(s).hidden = s !== id);
    const inGame = id === 'sTable';
    $('btnRules').hidden = !(id === 'sTable' || id === 'sSetup'); $('btnQuit').hidden = !inGame;
    window.scrollTo(0, 0);
  }
  function setGame(g) {
    G = g; document.body.dataset.game = g || '';
    if (!g) delete document.body.dataset.game;
    document.querySelector('meta[name=theme-color]').content = g === 'bad-habits' ? '#2F6FED' : '#060B18';
    $('barTitle').textContent = g ? E.GAMES[g].name : 'PsyTectrics card games';
  }

  // HOME
  function home() {
    setGame(null); show('sHome');
    const saved = store.get(SAVE, null);
    $('resume').hidden = !saved;
    if (saved) { try { const s = E.load(saved); $('resumeText').textContent = `${E.GAMES[s.game].name} in progress: ${s.bank.length}/${s.target} banked, ${s.triggers.length} ${E.GAMES[s.game].triggerName}s left.`; } catch (e) { store.del(SAVE); $('resume').hidden = true; } }
  }
  document.querySelectorAll('[data-pick]').forEach(b => b.onclick = () => { setGame(b.dataset.pick); mode = canFull(G) ? 'full' : 'quick'; renderSetup(); show('sSetup'); });
  $('btnResume').onclick = () => { try { S = E.load(store.get(SAVE)); setGame(S.game); show('sTable'); $('feed').innerHTML = ''; feed('Game resumed.'); renderTable(); if (S.status === 'between') between(); } catch (e) { store.del(SAVE); home(); } };
  $('btnDiscard').onclick = () => { store.del(SAVE); home(); };

  // SETUP
  let mode = 'quick';
  function renderSetup() {
    const full = canFull(G);
    $('setupTitle').textContent = E.GAMES[G].name;
    $('fullTag').textContent = full ? (member ? 'Member' : 'Unlocked') : '🔒 Unlock';
    document.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
    const max = mode === 'quick' ? 2 : 6; if (prefs.players > max) prefs.players = max;
    $('segPlayers').innerHTML = Array.from({ length: 6 }, (_, i) => i + 1).map(n => `<button type="button" data-n="${n}" aria-pressed="${n === prefs.players}" ${n > 2 && !full ? 'aria-describedby="fullTag"' : ''}>${n}${n > 2 && !full ? '<span class="lock">🔒</span>' : ''}</button>`).join('');
    $('segPlayers').querySelectorAll('button').forEach(b => b.onclick = () => {
      const n = +b.dataset.n;
      if (n > 2 && !full) return openUnlock();
      if (n > 2) mode = 'full';
      prefs.players = n; renderSetup();
    });
    const n = prefs.players;
    $('namesField').hidden = n < 2;
    $('names').innerHTML = Array.from({ length: n }, (_, i) => `<input data-i="${i}" maxlength="16" placeholder="Player ${i + 1}" value="${esc(prefs.names[i] || '')}" aria-label="Player ${i + 1} name"/>`).join('');
    $('names').querySelectorAll('input').forEach(inp => inp.oninput = () => { prefs.names[+inp.dataset.i] = inp.value.trim(); });
    $('optsField').hidden = mode !== 'full';
    $('harderRow').hidden = n < 2;
    $('optSofter').checked = !!prefs.softer; $('optHarder').checked = !!prefs.harder;
    const g = E.GAMES[G], trig = mode === 'quick' ? E.QUICK_TRIGGERS : 18;
    let target = g.target[mode][n] - (mode === 'full' && prefs.softer ? 1 : 0);
    $('summary').innerHTML = `<b>${n === 1 ? 'Solo' : n + ' players, pass-and-play'}</b> · ${trig} ${g.triggerName} cards · fill the ${g.bankName} with <b>${target}</b> to win.` + (G === 'narcissist' ? ' Watch out for the Loop Trap: Narc straight after Empath (or the reverse) burns one more.' : ' Everyone helps choose!');
  }
  document.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => {
    if (b.dataset.mode === 'full' && !canFull(G)) return openUnlock();
    mode = b.dataset.mode; renderSetup();
  });
  $('optSofter').onchange = e => { prefs.softer = e.target.checked; renderSetup(); };
  $('optHarder').onchange = e => { prefs.harder = e.target.checked; };
  $('btnBack').onclick = home;
  $('btnStart').onclick = () => {
    const n = prefs.players;
    const names = n === 1 ? ['You'] : Array.from({ length: n }, (_, i) => prefs.names[i] || 'Player ' + (i + 1));
    store.set(PREFS, prefs);
    S = E.create({ game: G, players: names, quick: mode === 'quick', softer: mode === 'full' && prefs.softer, harder: mode === 'full' && n > 1 && prefs.harder });
    persist(); show('sTable'); $('feed').innerHTML = ''; sel = -1;
    feed(`New game: ${S.totalTriggers} ${E.GAMES[G].triggerName} cards, ${S.target} to win.`);
    renderTable();
    playEvents(S.setupEvents || [], () => { if (S.status === 'won') return finish(); next(); });
  };

  /* ---------- table ---------- */
  const name = i => S.players[i].name, solo = () => S.players.length === 1;
  const label = c => E.GAMES[S.game].label[c.t] || c.t;
  function renderHud() {
    const g = E.GAMES[S.game];
    $('clockLab').textContent = g.triggerName + ' cards left'; $('clockNum').textContent = S.triggers.length;
    const left = S.triggers.length, burned = S.burned.length;
    $('pips').innerHTML = Array.from({ length: S.totalTriggers }, (_, i) => `<span class="pip ${i < left ? 'left' : i < left + burned ? 'burn' : ''}"></span>`).join('');
    $('bankLab').textContent = g.bankName === 'jar' ? 'Good Habits Jar' : 'Grounded bank'; $('bankNum').textContent = `${S.bank.length} / ${S.target}`;
    $('slots').innerHTML = Array.from({ length: S.target }, (_, i) => `<span class="slot ${i < S.bank.length ? 'on' : ''}"></span>`).join('');
    $('players').hidden = solo();
    $('players').innerHTML = S.players.map((p, i) => `<span class="pl ${i === S.turn ? 'on' : ''}">${esc(p.name)}</span>`).join('');
  }
  function bump(id) { const el = $(id); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); setTimeout(() => el.classList.remove('bump'), 300); }
  function renderTrigger(anim) {
    const g = E.GAMES[S.game];
    if (S.current) {
      $('trigger').innerHTML = cardHTML(S.game, S.current, { cls: 'big' + (anim ? ' flip' : '') });
      $('talk').textContent = solo() ? '' : `${S.players[S.turn].name}'s turn`;
    } else {
      $('trigger').innerHTML = `<div class="card big back-card">${S.game === 'narcissist' ? '<img src="images/brand/icon-dark.svg" alt=""/>' : 'BAD<br>HABITS!'}</div>`;
      $('talk').textContent = S.triggers.length + ' ' + g.triggerName + ' cards left in the clock.';
    }
  }
  function renderHand(anim) {
    const P = S.players[S.turn], ok = E.playable(S), hide = S.harder && S.status === 'between';
    $('handWho').textContent = solo() ? 'Your hand' : `${P.name}'s hand`;
    const trap = c => S.game === 'narcissist' && E.effect(S, c) === 'burn' && S.last && S.last !== c.t && E.effect(S, { t: S.last }) === 'burn' ? 'LOOP TRAP +1' : '';
    const press = c => S.current && S.current.p && !S.bank.length && E.effect(S, c) !== 'bank' && E.effect(S, c) !== 'pause' ? 'PRESSURE +1' : '';
    $('hand').innerHTML = hide ? '' : P.hand.map((c, i) => cardHTML(S.game, c, { tag: 'button', cls: (i === sel ? 'sel' : '') + (anim ? ' deal' : ''), warn: S.status === 'turn' ? (trap(c) || press(c)) : '',
      attrs: `type="button" data-i="${i}" aria-pressed="${i === sel}" aria-label="${esc(label(c))}: ${esc(c.q.replace(/<[^>]+>/g, ''))}" ${S.status !== 'turn' || !ok[i] ? 'disabled' : ''} style="animation-delay:${i * 60}ms"` })).join('');
    $('hand').querySelectorAll('.card').forEach(b => b.onclick = () => {
      const i = +b.dataset.i;
      if (sel === i) return doPlay(); // second tap plays it
      sel = i; renderHand(); $('btnPlay').disabled = false;
      $('btnPlay').textContent = 'Play ' + label(P.hand[i]);
    });
    const turn = S.status === 'turn';
    $('btnPlay').disabled = !turn || sel < 0; if (sel < 0) $('btnPlay').textContent = 'Play card';
    $('btnHint').disabled = !turn;
    $('handHint').textContent = turn ? 'Tap a card, then play it' : '';
    $('btnPlay').parentElement.hidden = !turn; $('nextRow').hidden = S.status !== 'between';
  }
  function renderTable(anim) { renderHud(); renderTrigger(anim); renderHand(anim); }

  function feed(html) { const p = document.createElement('p'); p.innerHTML = html; $('feed').prepend(p); }
  function toast(html, kind) {
    const box = $('toasts'); while (box.children.length >= 2) box.firstChild.remove();
    const t = document.createElement('div'); t.className = 'toast ' + (kind || ''); t.innerHTML = html; box.appendChild(t);
    setTimeout(() => { t.style.transition = 'opacity .4s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 400); }, 2200);
  }
  // show the engine's events one by one so players can follow what happened
  function playEvents(evs, done) {
    const g = E.GAMES[S.game], T = g.triggerName, list = evs.slice(); let cur = null;
    (function step() {
      if (!list.length) { renderHud(); return done && done(); }
      const e = list.shift(); let wait = 0;
      switch (e.k) {
        case 'play': cur = e.card; feed(`<b>${esc(name(e.player))}</b> played <b>${esc(label(e.card))}</b>.`); break;
        case 'bank': toast(`<b>${esc(label(e.card))}</b> ${g.bankName === 'jar' ? 'goes in the Jar' : 'banked'} · ${S.bank.length}/${S.target}`, 'good'); bump('bankNum'); wait = 350; break;
        case 'burn': if (e.n) { const why = { response: (cur ? label(cur) : '') + ' response', loop: 'Loop Trap', pressure: 'Pressure', volatile: 'Volatile' }[e.why] || '';
          if (e.why !== 'volatile') toast(`🔥 ${e.n} ${T} burned${why ? ' · ' + why : ''}.`, 'bad'); feed(`${e.n} ${T} burned (${why}).`); bump('clockNum'); wait = 350; } break;
        case 'loop': toast('<b>Loop Trap!</b> Narc after Empath (or the reverse) burns one more.', 'bad'); vibrate(80); break;
        case 'vol': toast(`<b>${esc(label(e.card).replace(/!*$/, '!'))}</b> ${esc(e.card.q.replace(/<[^>]+>/g, ''))} Burn 2, lose 1 from the ${g.bankName}.`, 'vol'); feed(`<b>${esc(label(e.card))}</b> drawn: 2 burned, 1 lost.`);
          document.body.classList.add('shake'); setTimeout(() => document.body.classList.remove('shake'), 450); vibrate([60, 40, 60]); wait = 900; break;
        case 'lose1': bump('bankNum'); break;
        case 'shield': toast(`🛡️ <b>${esc(name(e.by))}'s Shield</b> cancelled a Volatile card. Nothing happens.`, 'good'); feed(`${esc(name(e.by))}'s Shield blocked a Volatile.`); wait = 700; break;
        case 'held': toast(`✦ <b>${esc(label(e.card))}</b> ${esc(e.card.q.replace(/<[^>]+>/g, ''))} +1 to the ${g.bankName}.`, 'good'); feed(`${esc(label(e.card))} drawn: +1.`); bump('bankNum'); wait = 800; break;
        case 'kept': feed(`Kept <b>${esc(label(e.card))}</b>.`); break;
        case 'reshuffle': feed('Discards shuffled into a new deck.'); break;
        case 'win': case 'lose': break;
      }
      renderHud();
      setTimeout(step, wait);
    })();
  }
  function vibrate(p) { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} }

  function persist() { if (S && S.status !== 'won' && S.status !== 'lost') store.set(SAVE, E.save(S)); else store.del(SAVE); }

  function next() { // start the next turn (after pass screen if needed)
    const ev = E.startTurn(S); persist();
    if (S.status === 'lost' || S.status === 'won') return finish();
    sel = -1; renderTable(true);
    feed(`${solo() ? '' : '<b>' + esc(name(S.turn)) + '</b> flips: '}${esc(S.current.q.replace(/<[^>]+>/g, ''))}`);
    if (S.current.w) toast('<b>Witness:</b> say out loud which card you\'ll play before you play it.');
    if (S.current.p && !S.bank.length) toast('<b>Pressure:</b> the bank is empty. Play Grounded, or burn 1 extra Trigger.', 'bad');
  }
  function between() {
    renderTable();
    if (solo()) { $('btnNext').textContent = `Next ${E.GAMES[S.game].triggerName} →`; return; }
    $('btnNext').textContent = `Pass to ${S.players[S.turn].name} →`;
  }
  $('btnNext').onclick = () => {
    if (S.status !== 'between') return;
    if (solo()) return next();
    $('passWho').textContent = S.players[S.turn].name;
    $('passNote').textContent = S.harder ? 'Hands are hidden. Only look at your own cards.' : 'Ready? Flip the next Trigger when you\'ve got it.';
    $('oPass').hidden = false; $('btnPassGo').focus();
  };
  $('btnPassGo').onclick = () => { $('oPass').hidden = true; next(); };

  function doPlay() {
    if (sel < 0 || S.status !== 'turn') return;
    const i = sel; sel = -1;
    const ev = E.play(S, i); persist();
    $('btnPlay').disabled = true;
    renderHand();
    playEvents(ev, () => {
      if (S.status === 'won' || S.status === 'lost') return finish();
      if (S.status === 'choose') return openChoose();
      between();
    });
  }
  $('btnPlay').onclick = doPlay;
  $('btnHint').onclick = () => {
    if (S.status !== 'turn') return;
    sel = E.hint(S); renderHand();
    const c = S.players[S.turn].hand[sel]; $('btnPlay').textContent = 'Play ' + label(c); $('btnPlay').disabled = false;
    const e = E.effect(S, c);
    if (hinted++ < 2) toast(e === 'bank' ? 'Bank it: that\'s the only way to win.' : e === 'pause' ? 'No good card? Pause: nothing burns and you draw two.' : 'No good card this time. This one costs the least.');
  };

  function openChoose() {
    $('chooseH').textContent = S.game === 'narcissist' ? 'Pause. Keep one.' : 'Breathe. Keep one.';
    $('chooseRow').innerHTML = S.pending.map((c, i) => cardHTML(S.game, c, { tag: 'button', attrs: `type="button" data-i="${i}"` })).join('');
    $('chooseRow').querySelectorAll('.card').forEach(b => b.onclick = () => {
      $('oChoose').hidden = true;
      const ev = E.choose(S, +b.dataset.i); persist();
      playEvents(ev, () => { if (S.status === 'won' || S.status === 'lost') return finish(); between(); });
    });
    $('oChoose').hidden = false; $('chooseRow').querySelector('.card').focus();
  }

  /* ---------- end ---------- */
  function finish() {
    persist(); renderHud();
    const won = S.status === 'won', g = E.GAMES[S.game], kids = S.game === 'bad-habits';
    setTimeout(() => {
      show('sEnd');
      $('endBox').classList.toggle('lost', !won);
      $('endBadge').textContent = won ? (kids ? '🫙' : '◎') : (kids ? '🌀' : '∞');
      $('endEyebrow').textContent = won ? (solo() ? 'You won' : 'You all won') : 'Not this time';
      $('endTitle').textContent = won ? (kids ? 'The Jar is full. Great teamwork!' : 'Zero-Point. Nobody took the bait.') : (kids ? 'The Uh-ohs won this time.' : 'The loop wins this time.');
      $('endLead').textContent = won ? `${S.bank.length} ${kids ? 'good habits in the Jar' : 'Grounded moments banked'} with ${S.triggers.length} ${g.triggerName} cards to spare.` : `${S.bank.length} of ${S.target} ${kids ? 'in the Jar' : 'banked'}. ${kids ? 'Have another go!' : 'Same table, new loop? Try again.'}`;
      const st = S.stats;
      $('endStats').innerHTML = [[S.turns, 'turns'], [S.burned.length, g.triggerName + ' burned'], [kids ? st.volatile : st.loopTraps, kids ? 'habit loops' : 'loop traps']]
        .map(([n, l]) => `<div class="stat"><b>${n}</b><span>${esc(l)}</span></div>`).join('');
      // Honest mode: which code each player reached for most
      const groups = kids ? { good: 'Good habits', ask: 'Good habits', bad: 'Bad habits', breathe: 'Breathe' } : { grounded: 'Grounded', narc: 'Narc', empath: 'Empath', pause: 'Observer', shield: 'Observer' };
      $('honest').innerHTML = `<h3>${kids ? 'What everyone played' : 'Honest mode: what you reached for'}</h3>` + S.players.map(p => {
        const t = {}; Object.entries(p.played).forEach(([k, n]) => { const gk = groups[k] || k; t[gk] = (t[gk] || 0) + n; });
        const top = Object.entries(t).sort((a, b) => b[1] - a[1]);
        return `<p><b>${esc(p.name)}</b><span>${top.length ? top.map(([k, n]) => `${esc(k)} ${n}`).join(' · ') : 'no cards played'}</span></p>`;
      }).join('');
      $('promoImg').src = kids ? 'images/shop/bad-habits.webp' : 'images/shop/narcissist-card-game.webp';
      $('promoLink').href = 'shop.html#' + S.game;
    }, 700);
  }
  $('btnAgain').onclick = () => { setGame(S.game); renderSetup(); show('sSetup'); };
  $('btnOther').onclick = home;
  $('btnQuit').onclick = () => { if (confirm('Leave this game? It stays saved so you can resume it from the start screen.')) home(); };

  /* ---------- rules ---------- */
  const RULES = {
    narcissist: `<h3>Goal</h3><ul><li>Bank enough <b>Grounded</b> cards before the <b>Triggers</b> run out. Win or lose together.</li></ul>
      <h3>Each turn</h3><ul><li>Flip a Trigger and read it out. Talk it through.</li><li><b>Grounded:</b> bank it.</li><li><b>Narc or Empath:</b> burn 1 extra Trigger. The clock runs down faster.</li><li><b>Loop Trap:</b> a Narc straight after an Empath, or the reverse, burns one more.</li><li><b>Observer · Pause:</b> play it instead of a response. Nothing burns. Draw 2, keep 1.</li><li>Draw back to 3 and pass on.</li></ul>
      <h3>Special cards</h3><ul><li><b>Volatile</b> happens the moment it's drawn: burn 2 Triggers, lose 1 banked card. A <b>Shield</b> in anyone's hand cancels it automatically.</li><li><b>Held</b>, the rare good one, goes straight in the bank.</li><li><b>Pressure</b> Triggers: if the bank is empty, play Grounded or burn 1 more.</li></ul>
      <h3>Bank to win</h3><ul><li>Solo 4 · 2 players 5 · 3 players 6 · 4 players 7 · 5–6 players 8. Quick round: solo 3, 2 players 4.</li></ul>`,
    'bad-habits': `<h3>The goal</h3><ul><li>Work as a team to fill the <b>Good Habits Jar</b> before the <b>Uh-oh!</b> cards run out.</li></ul>
      <h3>Take turns</h3><ul><li>Turn over an Uh-oh! card and read it out.</li><li>Everyone looks at the cards and helps choose.</li><li><b>Good Habit</b> or <b>Ask!</b>: put it in the Jar.</li><li><b>Bad Habit</b>: throw away 1 more Uh-oh! card.</li><li><b>Breathe</b>: nothing thrown away. Pick up 2, keep 1.</li><li>Pick up a new card and pass it on.</li></ul>
      <h3>Surprise cards</h3><ul><li><b>Habit Loop!</b> happens as soon as it's picked up: throw away 2 Uh-oh! cards and take 1 out of the Jar.</li><li><b>Loop Held!</b> goes straight in the Jar.</li></ul>
      <h3>Fill the Jar</h3><ul><li>Solo 6 · 2 players 7 · 3 or more 8. Quick round: solo 4, 2 players 5.</li></ul>`
  };
  $('btnRules').onclick = () => { $('rulesBody').innerHTML = RULES[G || 'narcissist']; $('oRules').hidden = false; };
  document.querySelectorAll('[data-close]').forEach(b => b.onclick = () => b.closest('.overlay').hidden = true);
  document.querySelectorAll('.overlay').forEach(o => o.addEventListener('click', e => { if (e.target === o && o.id !== 'oChoose' && o.id !== 'oPass') o.hidden = true; }));

  /* ---------- unlock ---------- */
  function openUnlock() { $('unlockErr').textContent = ''; $('unlockCode').value = ''; $('oUnlock').hidden = false; setTimeout(() => $('unlockCode').focus(), 50); }
  $('unlockForm').onsubmit = async e => {
    e.preventDefault();
    const code = $('unlockCode').value.trim(); if (!code) return;
    $('unlockErr').textContent = 'Checking…';
    try {
      const r = await fetch('/api/game', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) throw new Error(d.error || 'That code didn\'t work. Check the card in your box.');
      (d.games || []).forEach(g => unlocked[g] = true); store.set(UNLOCK, unlocked);
      $('oUnlock').hidden = true; mode = 'full'; renderSetup();
      toast('Unlocked. Enjoy the full game!', 'good');
    } catch (err) { $('unlockErr').textContent = err.message; }
  };

  // keyboard: 1-4 select, Enter plays
  document.addEventListener('keydown', e => {
    if (!S || $('sTable').hidden || !$('oChoose').hidden || !$('oPass').hidden || e.target.tagName === 'INPUT') return;
    if (/^[1-4]$/.test(e.key) && S.status === 'turn') { const i = +e.key - 1; if (S.players[S.turn].hand[i] && E.playable(S)[i]) { sel = i; renderHand(); $('btnPlay').disabled = false; $('btnPlay').textContent = 'Play ' + label(S.players[S.turn].hand[i]); } }
    if (e.key === 'Enter' && S.status === 'turn' && sel >= 0 && document.activeElement.tagName !== 'BUTTON') doPlay();
  });

  // deep links: play.html#narcissist / #bad-habits
  const h = location.hash.slice(1);
  if (E.GAMES[h]) { setGame(h); mode = canFull(h) ? 'full' : 'quick'; renderSetup(); show('sSetup'); } else home();
})();
