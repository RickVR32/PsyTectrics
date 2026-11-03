/* PsyTectrics Q&A — answers customer questions on Telegram and the website.
   Uses Claude when ANTHROPIC_API_KEY is set; otherwise falls back to the FAQ below. */
const PROFILE = require('../tests/awareness-profile.json');
const KNOWLEDGE = `PsyTectrics helps people understand how they react under pressure, using the SC Framework from the book Narcissist / Yarcissist by Ric Lee.
Four patterns: Narc (self-protection by contracting: going quiet, holding your position, deflecting blame), Empath (self-protection by expanding: chasing, over-explaining, people-pleasing), Grounded (the balance point; its shadow is fake calm), Volatile (the threshold where things escalate or collapse). Both Narc and Empath are extremes; the goal is balance at Zero-Point. Results give a Level 1-10, a Balance Map and what needs balancing.
Products: Quick Check (free, 12 questions, 3 minutes). Narc Pattern Self-Check (free, 20 questions). Am I Dealing With a Narc? (free, 34 questions about someone else; it maps their pattern but cannot diagnose anyone). Couples Balance (free, 32 questions, two Balance Maps and the loop you fall into). Money Balance and Work Balance (free area packs, 32 questions each). Awareness Profile (56 questions, free results; full 10-page report ${PROFILE.price || '£19'}, instant, includes an encrypted personal Source Code). Observer Report (£75, a written report on someone else built from their messages, within 48 hours). Business Audit (£150 for 1 person, £350 for 2-5, £650 for 6-10, larger by enquiry). Games coming soon: The Narc Card Game, The Narc Boardgame and Bad Habits (kids). The book Narcissist / Yarcissist.
Membership: £7.99 a month or £59 a year; includes every full report, all results and Source Codes saved in a dashboard, level tracked over time and a monthly Balance Check; cancel any time at psytectrics.com/account.html. Accounts: sign in with an email link (no password) at psytectrics.com/account.html. Tests are on psytectrics.com/tests.html and in this Telegram bot. Discount codes are entered at checkout. Contact: hello@psytectrics.com.
Privacy: answers are stored to run the test and build reports; in Telegram, /delete removes everything. Marketing messages only with permission.
Limits: PsyTectrics is self-reflection, not therapy, not a diagnosis and not medical advice. It never says whether someone is or isn't a narcissist or has any condition.`;
const SYSTEM = `You are the PsyTectrics assistant. Answer customer questions in 1-4 short sentences, warm and plain English, UK spelling. Use only the facts below; if something isn't covered (refunds, delivery dates, anything personal), say you'll pass it on and give hello@psytectrics.com. Never diagnose, never label a person as a narcissist, never give medical or legal advice. If someone seems to be in crisis or mentions harming themselves, gently give the Samaritans number 116 123 (free, 24/7, UK) and suggest speaking to someone they trust or their GP. Don't make up prices or features.\n\nFACTS:\n${KNOWLEDGE}`;
const CRISIS = /\b(suicid|kill myself|end it all|self[- ]?harm|hurt myself|don'?t want to (be here|live))/i;
const CRISIS_REPLY = 'I\'m really sorry you\'re feeling this way. You don\'t have to deal with it alone — you can call Samaritans free on 116 123, any time, day or night. Talking to someone you trust or your GP can help too.';
const FAQ = [
  [/member|subscri|monthly|cancel/i, 'Membership is £7.99 a month or £59 a year. It includes every full report, your results and Source Codes saved in one place, your level tracked over time and a monthly Balance Check. Cancel any time at psytectrics.com/account.html'],
  [/price|cost|how much|£/i, `All the tests are free to take. The Awareness Profile gives free results, and the full report is ${PROFILE.price || '£19'} (or included with membership at £7.99 a month). Observer Reports are £75 and Business Audits start at £150.`],
  [/observer|someone else|ex|co-?parent|partner/i, 'An Observer Report is a written report on someone else, built from their messages — no need for them to take part. It costs £75 and arrives within 48 hours: psytectrics.com/observer.html'],
  [/narc|narcissis/i, 'In the SC Framework, Narc is a pattern, not a label: self-protection by contracting — going quiet, holding your position, deflecting blame. Everyone has some. The free Narc Pattern Self-Check shows how strong it is in you.'],
  [/game|card|board/i, 'The Narc Card Game, The Narc Boardgame and Bad Habits (for kids) are coming soon. Leave your email when you take a test and we\'ll let you know first.'],
  [/book|yarc/i, 'Narcissist / Yarcissist by Ric Lee is the book behind the framework — it explains the two roles and how to break the loop.'],
  [/code|discount|promo/i, 'You can enter a discount code on the Stripe checkout page.'],
  [/delete|privacy|data/i, 'Your answers are only used to run your test and build your report. In Telegram, send /delete to remove everything.'],
  [/test|start|begin|assess/i, 'Tap Quick Check for a free 3-minute test, or Awareness Profile for the full 56 questions. Both work right here in Telegram or at psytectrics.com/tests.html']
];
async function ask(question, history = []) {
  const q = String(question || '').slice(0, 800);
  if (CRISIS.test(q)) return { text: CRISIS_REPLY, crisis: true };
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5', max_tokens: 300, system: SYSTEM,
          messages: [...history.slice(-6), { role: 'user', content: q }] })
      });
      const d = await r.json();
      const text = d && d.content && d.content[0] && d.content[0].text;
      if (r.ok && text) return { text };
      console.error('Q&A model error', r.status, d && d.error);
    } catch (e) { console.error('Q&A error', e); }
  }
  const hit = FAQ.find(([re]) => re.test(q));
  return { text: hit ? hit[1] : 'Good question — I\'ll pass it on and we\'ll get back to you. You can also email hello@psytectrics.com.', unanswered: !hit };
}
module.exports = { ask };
