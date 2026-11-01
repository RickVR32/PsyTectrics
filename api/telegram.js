/* PsyTectrics Telegram bot — one webhook for clients and for Rick (admin).
   Clients: take the Quick Check or Awareness Profile by tapping, ask questions, leave a review,
            turn monthly check-ins on/off, /delete their data.
   Admin (TELEGRAM_ADMIN_CHAT_ID): /today /stats /code SC4-… /promo CODE 20 [max] /reviews, and Approve/Reject buttons. */
const { createClient } = require('@supabase/supabase-js');
const tg = require('../lib/tg');
const { ask } = require('../lib/qa');
const E = require('../sc-engine.js');
const SC = require('../lib/source-code');
const PACKS = { 'quick-check': require('../tests/quick-check.json'), 'awareness-profile': require('../tests/awareness-profile.json') };

const db = () => createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const SITE = () => process.env.SITE_URL || 'https://psytectrics.com';
const QA_PER_DAY = 20;

const MENU = [
  [{ text: '⚡ Quick Check (3 min, free)', callback_data: 't:quick-check' }],
  [{ text: '🧭 Awareness Profile (56 questions)', callback_data: 't:awareness-profile' }],
  [{ text: '💬 Ask a question', callback_data: 'm:ask' }, { text: '⭐ Leave a review', callback_data: 'm:review' }],
  [{ text: '🔔 Monthly check-ins on/off', callback_data: 'm:checkins' }]
];
const PRIVACY = 'Before you start: your answers are stored so we can score your test and send your result. Nothing is shared. You can send /delete at any time to remove everything. This is self-reflection, not therapy or a diagnosis. <a href="' + 'https://psytectrics.com/privacy.html">Privacy</a>';

async function getUser(s, chat, from) {
  const { data } = await s.from('tg_users').select('*').eq('chat_id', chat).maybeSingle();
  if (data) return data;
  const row = { chat_id: chat, first_name: (from && from.first_name || '').slice(0, 60), consent: false, checkins: false, state: null };
  await s.from('tg_users').insert(row);
  return row;
}
const save = (s, chat, patch) => s.from('tg_users').update({ ...patch, updated_at: new Date().toISOString() }).eq('chat_id', chat);

function qText(pack, i) {
  const n = pack.items.length;
  const bar = '▓'.repeat(Math.round(i / n * 10)) + '░'.repeat(10 - Math.round(i / n * 10));
  return `<b>${tg.esc(pack.title)} ${tg.esc(pack.titleEm)}</b>\n${bar}  ${i + 1}/${n}\n\n${tg.esc(pack.items[i].text)}`;
}
function qKeys(i) {
  const row = [1, 2, 3, 4, 5].map(v => ({ text: String(v), callback_data: `a:${v}` }));
  const nav = i > 0 ? [[{ text: '← Back', callback_data: 'a:back' }, { text: '✖ Stop', callback_data: 'a:stop' }]] : [[{ text: '✖ Stop', callback_data: 'a:stop' }]];
  return [row, ...nav];
}
const SCALE_NOTE = '1 = Strongly disagree · 3 = Neutral · 5 = Strongly agree';

function resultText(pack, R, code) {
  const ty = (pack.types || {})[R.type] || { title: '', text: '' };
  const needs = R.needs.length ? R.needs.map(n => `• ${tg.esc(n.name)} <i>(${n.pattern})</i>`).join('\n') : '• Nothing major pulling you off centre.';
  return `<b>Your balance: ${tg.esc(ty.title)}</b>\n${tg.esc(ty.text)}\n\n` +
    `Level <b>${R.level}/10</b> · ${R.stage}\nLean: ${E.leanLabel(R.lean)} · Regulation ${Math.round(R.regulation)} · Drift ${R.drift.toFixed(1)}\n\n` +
    `<b>What needs balancing</b>\n${needs}` + (code ? `\n\nYour Source Code:\n<code>${code}</code>` : '');
}

// ---------- client side ----------
async function client(s, msg, cb) {
  const chat = (msg || cb.message).chat.id;
  const from = msg ? msg.from : cb.from;
  const u = await getUser(s, chat, from);
  const text = msg && (msg.text || '').trim();

  if (text === '/delete') {
    await s.from('tg_users').delete().eq('chat_id', chat);
    return tg.send(chat, 'Done — everything we held about you in this bot has been deleted. Send /start any time to begin again.');
  }
  if (text === '/start' || text === '/menu') {
    await save(s, chat, { state: null });
    return tg.send(chat, `Hi ${tg.esc(u.first_name || 'there')} 👋 I'm the PsyTectrics bot. I can run your test right here, answer questions, or take a review.\n\nWhat would you like to do?`, MENU);
  }

  if (cb) {
    const d = cb.data || '';
    tg.answer(cb.id);
    const mid = cb.message.message_id;
    if (d === 'consent') { await save(s, chat, { consent: true }); return startTest(s, chat, mid, u.test); }
    if (d.startsWith('t:')) {
      const test = d.slice(2); if (!PACKS[test]) return;
      if (!u.consent) { await save(s, chat, { test }); return tg.edit(chat, mid, PRIVACY, [[{ text: 'OK, start →', callback_data: 'consent' }]]); }
      await save(s, chat, { test });
      return startTest(s, chat, mid, test);
    }
    if (d.startsWith('a:')) return answerQ(s, chat, mid, u, d.slice(2));
    if (d === 'm:ask') { await save(s, chat, { state: 'ask' }); return tg.send(chat, 'Sure — type your question and I\'ll answer.'); }
    if (d === 'm:review') {
      return tg.send(chat, 'Thank you! How would you rate PsyTectrics?', [[1, 2, 3, 4, 5].map(v => ({ text: '⭐'.repeat(v), callback_data: `r:${v}` })).slice(0, 3), [4, 5].map(v => ({ text: '⭐'.repeat(v), callback_data: `r:${v}` }))]);
    }
    if (d.startsWith('r:')) {
      await save(s, chat, { state: 'review', review_rating: +d.slice(2) });
      return tg.send(chat, 'Lovely. Now type your review in a sentence or two. Start it with <b>#free</b> if you got your report free or discounted (we label those, as the law asks).');
    }
    if (d === 'm:checkins') {
      const on = !u.checkins; await save(s, chat, { checkins: on });
      return tg.send(chat, on ? '🔔 Monthly check-ins are on. Once a month I\'ll send a 3-minute Quick Check so you can see if your level is moving. Tap again to stop.' : '🔕 Monthly check-ins are off.');
    }
    return;
  }

  // free text
  if (!text) return;
  if (u.state === 'review') {
    let body = text.slice(0, 600), incentivised = false;
    if (/^#free\b/i.test(body)) { incentivised = true; body = body.replace(/^#free\s*/i, ''); }
    const { data: rv } = await s.from('reviews').insert({ name: u.first_name || 'Telegram user', rating: u.review_rating || 5, text: body, incentivised, source: 'telegram', status: 'pending' }).select().single();
    await save(s, chat, { state: null, review_rating: null });
    if (rv) await notifyReview(rv);
    return tg.send(chat, 'Thank you — your review has been sent. It\'ll appear on the site once it\'s checked. 🙏', MENU);
  }
  // anything else is a question (rate-limited)
  const today = new Date().toISOString().slice(0, 10);
  const count = u.qa_day === today ? (u.qa_count || 0) : 0;
  if (count >= QA_PER_DAY) return tg.send(chat, 'I\'ve answered a lot today! For anything else, email hello@psytectrics.com and Ric will reply.');
  await save(s, chat, { qa_day: today, qa_count: count + 1, state: null });
  const a = await ask(text);
  if (a.unanswered || a.crisis) tg.admin(`${a.crisis ? '⚠️ Possible crisis message' : '❓ Unanswered question'} from ${tg.esc(u.first_name || chat)}:\n"${tg.esc(text.slice(0, 300))}"`);
  return tg.send(chat, tg.esc(a.text));
}

async function startTest(s, chat, mid, test) {
  const pack = PACKS[test]; if (!pack) return tg.edit(chat, mid, 'Pick a test:', MENU);
  await save(s, chat, { test, idx: 0, answers: [], state: 'test' });
  await tg.edit(chat, mid, `${tg.esc(pack.title)} ${tg.esc(pack.titleEm)} — ${pack.items.length} statements. Answer how you <i>usually</i> are, not how you'd like to be.\n${SCALE_NOTE}`);
  return tg.send(chat, qText(pack, 0), qKeys(0));
}

async function answerQ(s, chat, mid, u, v) {
  const pack = PACKS[u.test];
  if (!pack || u.state !== 'test') return tg.edit(chat, mid, 'That test has ended. Pick one:', MENU);
  let idx = u.idx || 0; const answers = Array.isArray(u.answers) ? u.answers.slice() : [];
  if (v === 'stop') { await save(s, chat, { state: null }); return tg.edit(chat, mid, 'Stopped. Your answers so far are saved — pick the same test to start over.', MENU); }
  if (v === 'back') { idx = Math.max(0, idx - 1); answers.length = idx; }
  else { const n = +v; if (!(n >= 1 && n <= 5)) return; answers[idx] = n; idx++; }
  if (idx < pack.items.length) {
    await save(s, chat, { idx, answers });
    return tg.edit(chat, mid, qText(pack, idx), qKeys(idx));
  }
  // finished
  const prevLevel = u.last_level;
  const keyed = {}; pack.items.forEach((it, i) => keyed[it.id] = answers[i]);
  const R = E.score(pack, keyed);
  let code = null; try { code = SC.encode({ test: pack.id, answers, level: R.level, type: R.type }); } catch (e) { console.error('code', e.message); }
  await save(s, chat, { idx: 0, answers: [], state: null, last_check: new Date().toISOString(), last_level: R.level });
  await s.from('test_results').insert({ test: pack.id, email: `telegram:${chat}`, marketing_opt_in: !!u.checkins, answers, result: { level: R.level, type: R.type, source: 'telegram', code } });
  await tg.edit(chat, mid, `✅ ${tg.esc(pack.title)} ${tg.esc(pack.titleEm)} complete.`);
  const prev = prevLevel ? `\n\nLast time you were Level ${prevLevel} — ${R.level > prevLevel ? 'you\'ve moved closer to centre 👏' : R.level < prevLevel ? 'a bit further from centre this month. Worth a look at what\'s changed.' : 'steady.'}` : '';
  const url = code ? `${SITE()}/test.html?code=${encodeURIComponent(code)}` : `${SITE()}/test.html?t=${pack.id}`;
  const keys = [[{ text: pack.id === 'awareness-profile' ? '📄 See your Balance Map & unlock the full report' : '🗺 See your Balance Map', url }],
    ...(pack.id === 'quick-check' ? [[{ text: '🧭 Take the full Awareness Profile', callback_data: 't:awareness-profile' }]] : []),
    [{ text: '🔔 Monthly check-ins on/off', callback_data: 'm:checkins' }]];
  tg.admin(`🧪 Telegram ${pack.id} done — Level ${R.level}, ${R.type}`);
  return tg.send(chat, resultText(pack, R, code) + prev, keys);
}

// ---------- admin side ----------
async function notifyReview(rv) {
  return tg.admin(`⭐ New review (${'⭐'.repeat(rv.rating)}) from ${tg.esc(rv.name)} via ${rv.source}${rv.incentivised ? ' — <b>free/discounted</b>' : ''}:\n\n"${tg.esc(rv.text)}"`,
    [[{ text: '✅ Approve — post to site', callback_data: `rv:ok:${rv.id}` }, { text: '🗑 Reject', callback_data: `rv:no:${rv.id}` }]]);
}

async function adminCmd(s, msg, cb) {
  const chat = (msg || cb.message).chat.id;
  if (cb) {
    const m = (cb.data || '').match(/^rv:(ok|no):(.+)$/);
    if (!m) return client(s, null, cb); // admin can also use the client buttons
    const status = m[1] === 'ok' ? 'approved' : 'rejected';
    await s.from('reviews').update({ status, reviewed_at: new Date().toISOString() }).eq('id', m[2]);
    tg.answer(cb.id, status === 'approved' ? 'Posted to the site' : 'Rejected');
    return tg.edit(chat, cb.message.message_id, `${cb.message.text}\n\n${status === 'approved' ? '✅ Approved — live on the site' : '🗑 Rejected'}`);
  }
  const [cmd, ...args] = (msg.text || '').trim().split(/\s+/);
  const since = d => new Date(Date.now() - d * 86400000).toISOString();
  if (cmd === '/today' || cmd === '/stats' || cmd === '/sales') {
    const days = cmd === '/today' ? 1 : 30;
    const [{ count: tests }, { data: paid }, { count: reqs }, { count: pending }, { count: subs }] = await Promise.all([
      s.from('test_results').select('id', { count: 'exact', head: true }).gte('created_at', since(days)),
      s.from('profile_reports').select('id').eq('paid', true).gte('created_at', since(days)),
      s.from('report_requests').select('id', { count: 'exact', head: true }).eq('paid', true).gte('created_at', since(days)),
      s.from('reviews').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      s.from('tg_users').select('chat_id', { count: 'exact', head: true }).eq('checkins', true)
    ]);
    return tg.send(chat, `<b>${days === 1 ? 'Last 24 hours' : 'Last 30 days'}</b>\nFree tests taken: ${tests || 0}\nAwareness Profiles sold: ${(paid || []).length}\nObserver/Business paid: ${reqs || 0}\nReviews waiting: ${pending || 0}\nMonthly check-in subscribers: ${subs || 0}`);
  }
  if (cmd === '/code') {
    try {
      const d = SC.decode(args.join(' ')); const pack = PACKS[d.test] || require(`../tests/${d.test}.json`);
      const keyed = {}; pack.items.forEach((it, i) => keyed[it.id] = d.answers[i]);
      return tg.send(chat, `<b>${tg.esc(d.test)}</b> · taken ${d.date}\n\n` + resultText(pack, E.score(pack, keyed)) + `\n\nAnswers: <code>${d.answers.join('')}</code>`);
    } catch (e) { return tg.send(chat, `Couldn't open that code: ${tg.esc(e.message)}`); }
  }
  if (cmd === '/promo') {
    const [name, pct, max] = args;
    if (!name || !(+pct > 0 && +pct <= 100)) return tg.send(chat, 'Usage: <code>/promo FAMILY20 20 [max uses]</code>');
    try {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      const coupon = await stripe.coupons.create({ percent_off: +pct, duration: 'once', name: `${name.toUpperCase()} ${pct}%` });
      await stripe.promotionCodes.create({ coupon: coupon.id, code: name.toUpperCase(), ...(max ? { max_redemptions: +max } : {}) });
      return tg.send(chat, `✅ Code <code>${tg.esc(name.toUpperCase())}</code> — ${pct}% off${max ? `, ${max} uses` : ''}. Buyers enter it at checkout. Remind them to tick "free/discounted" when they review.`);
    } catch (e) { return tg.send(chat, `Stripe said: ${tg.esc(e.message)}`); }
  }
  if (cmd === '/reviews') {
    const { data } = await s.from('reviews').select('*').eq('status', 'pending').order('created_at').limit(10);
    if (!data || !data.length) return tg.send(chat, 'No reviews waiting. 👍');
    for (const rv of data) await notifyReview(rv);
    return;
  }
  if (cmd === '/help' || cmd === '/admin') {
    return tg.send(chat, '<b>Admin</b>\n/today — last 24h\n/stats — last 30 days\n/code SC4-… — decode a Source Code\n/promo NAME 20 [max] — make a discount code\n/reviews — reviews waiting\n\n/start shows the client menu.');
  }
  return client(s, msg, null);
}

module.exports = async (req, res) => {
  if (req.method === 'GET') return require('../lib/telegram-cron')(req, res); // daily Vercel cron
  if (req.method !== 'POST') return res.status(405).end();
  if (!process.env.TELEGRAM_WEBHOOK_SECRET || req.headers['x-telegram-bot-api-secret-token'] !== process.env.TELEGRAM_WEBHOOK_SECRET) return res.status(401).end();
  const upd = req.body || {};
  const msg = upd.message, cb = upd.callback_query;
  try {
    const chat = String((msg && msg.chat.id) || (cb && cb.message && cb.message.chat.id) || '');
    if (!chat) return res.status(200).end();
    if ((msg && msg.chat.type !== 'private') || (cb && cb.message.chat.type !== 'private')) return res.status(200).end();
    const s = db();
    if (chat === String(process.env.TELEGRAM_ADMIN_CHAT_ID)) await adminCmd(s, msg, cb);
    else await client(s, msg, cb);
  } catch (e) { console.error('telegram error', e); }
  res.status(200).end(); // always 200 so Telegram doesn't retry
};
module.exports.notifyReview = notifyReview;
