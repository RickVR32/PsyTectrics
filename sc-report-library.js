/* SC Report Library v4 — every paragraph the automated report can use.
   Codes have three states: ok (balanced), lean (leaning), hot (needs balancing). */
(function (root) {
const TYPES = {
  narc:  { name: 'The Fortress', tag: 'When pressure rises, you pull the walls in — steady inside, hard to reach from outside.',
    intro: 'Under threat, your nervous system contracts. You go quieter, lean on logic, hold your position and cut the input down until you feel steady again. It is a protective strategy you learned because it worked. The cost is that the people closest to you can feel shut out at exactly the moment they most want you in the room. This report describes how you respond, not who you are — and contraction, once you can see it happening, becomes a choice instead of a reflex.' },
  empath:{ name: 'The Bridge', tag: 'When distance opens up, you rush to close it — warm, generous, and sometimes running on empty.',
    intro: 'Under threat, your nervous system expands. You reach for connection, explain, reassure and try to fix things before they settle. It comes from care, and people feel looked after around you. The cost is that your own limits disappear, silence feels unbearable, and pursuing can push the other person further away. This report describes how you respond, not who you are — and expansion, once you can see it happening, becomes a choice instead of a reflex.' },
  loop:  { name: 'The Pendulum', tag: 'You swing between shutting down and chasing — both roles firing, sometimes in the same argument.',
    intro: 'Your answers show both protective roles running hard. Some days you go quiet and hold your ground; other days you push for resolution and can\'t let it rest. From outside it can look balanced, because neither side wins for long. From inside it is tiring, because the loop never quite switches off. This report describes how you respond, not who you are — and the swing slows down the moment you can name which side you\'re on.' },
  mixed: { name: 'The Crossroads', tag: 'No single role takes over — which side you go to depends on who, where and how tired you are.',
    intro: 'Neither protective role clearly dominates for you. With some people you pull back; with others you lean in. That flexibility is useful, but it also means your balance depends heavily on the situation. This report shows which codes are steady and which ones tip first when the pressure is on, so you know where your balance is most fragile.' },
  zero:  { name: 'The Observer', tag: 'You can feel the pull of the loop without being pulled into it.',
    intro: 'Your answers put you close to Zero-Point. Emotion still arrives — you just tend to notice it while it is happening, and neither role takes over for long. That is the Observer position the book describes, and it is a skill, not a personality trait. This report shows where it holds best and where it still slips under real pressure.' }
};
const STAGES = {
  Instinct: 'At this level, reaction comes before thought. Threat feels physical and the response is immediate — people often say afterwards, "I don\'t know what came over me". It is the starting ring on the board, and everyone spends time here.',
  Reaction: 'At this level, emotion still leads, but language arrives. You argue, defend and justify, and certainty is high. Awareness is present, but it is fused with the feeling. The next step up is simply noticing the reaction while it happens.',
  Observation: 'At this level, change becomes possible. You start to notice — "I\'m reacting", "this feels familiar" — while emotion is still present. It is the entry point the book describes: the loop loses some of its grip the moment it is seen.',
  Regulation: 'At this level, you can slow the pace, steady your tone and let emotion be there without escalating. You can pause, reflect and respond on purpose most of the time. What is left is holding it under the heaviest pressure.',
  Presence: 'At this level, awareness takes little effort. Emotion moves through without sticking, conflict becomes information, and your sense of self is not on the line. It is the ring closest to Zero-Point.'
};
const MEASURES = {
  charge:    { low: 'Low — the protective roles are fairly quiet for you.', moderate: 'Moderate — the roles switch on under pressure, then settle.', high: 'High — the roles are running hard, even when the situation doesn\'t call for it.' },
  regulation:{ low: 'Low — at your threshold, things tip quickly into escalation or shutdown.', moderate: 'Moderate — you hold steady most of the time, with some tipping points.', high: 'High — you can usually hold steady even when it gets intense.' },
  drift:     { low: 'Low — how you see yourself and what you actually do line up closely.', moderate: 'Moderate — some gap between the version of you that you describe and the one that shows up under pressure.', high: 'High — a clear gap between how you see yourself and what happens under pressure. Worth looking at gently.' }
};
const CODES = {
  intention:  { ok: 'You can say what you want and still leave room for the other person\'s answer. You don\'t need to win the outcome to feel safe in it, which makes you easy to work things out with.',
                lean: 'Most of the time you hold your position loosely, but when you feel challenged the grip tightens. You may catch yourself arguing for the outcome rather than the point.',
                hot: 'When you feel challenged, protecting your position comes first — your answers said things need to go your way for you to feel safe. It\'s armour, not arrogance, but to others it can feel like there is no room to move.' },
  presence:   { ok: 'You stay in hard conversations. When you need space you say so, so people don\'t read your pauses as rejection.',
                lean: 'You can stay present, but there is a point where you start to close down — shorter answers, more logic, less of you in the room.',
                hot: 'When emotions rise, you go quiet or switch to facts. Inside it is overload — "I need less input to steady myself". Outside it lands as coldness, and the other person usually pushes harder.' },
  ownership:  { ok: 'You can say "I got that wrong" without it costing you much. That one habit shortens most arguments you\'re in.',
                lean: 'You can own your part, but it often comes with a "but" attached — an explanation that softens the admission.',
                hot: 'Owning a mistake feels risky, so you tend to find the reason it wasn\'t really your fault. It protects you in the moment and quietly costs trust over time.' },
  impact:     { ok: 'You notice how you\'re landing while it\'s happening, and adjust. People feel seen by you even when you disagree.',
                lean: 'You usually notice your impact, but under pressure that awareness arrives late.',
                hot: 'You often only realise how you came across after the fact. By then the other person has already reacted to the version of you they saw.' },
  balance:    { ok: 'You can support people without disappearing in the process. You give, and you still know where you end.',
                lean: 'You give generously, and sometimes past the point where it\'s good for you — especially when someone pulls away.',
                hot: 'When someone pulls away, you feel you have to fix it now, and you keep explaining until you feel understood. It comes from caring, and it can push the other person further back.' },
  connection: { ok: 'You can feel close without constant reassurance, and silence doesn\'t panic you. That gives the people around you room to breathe.',
                lean: 'Mostly secure, but a slow reply or a quiet evening can start a story in your head about what it means.',
                hot: 'Silence and slow replies feel like danger, and you\'ll say yes to keep the peace even when you mean no. Your system is reaching for safety through connection.' },
  clearhead:  { ok: 'When emotions run high, you can slow yourself down before you respond. That pause is one of your biggest assets.',
                lean: 'You usually think clearly under emotion — until you feel disconnected. Then urgency takes over.',
                hot: 'When you feel disconnected, emotion floods in and you push harder. The more urgent it feels, the less the other person can hear.' },
  holding:    { ok: 'You can be there for someone who\'s struggling without taking their feelings on as your own.',
                lean: 'You hold your ground with most people, but with the ones you love most, their pain can become yours.',
                hot: 'When someone you care about is struggling, you lose yourself in it. You carry it as if it were yours, which leaves nobody steady in the room.' },
  coreself:   { ok: 'You feel like the same person wherever you are, and strong feelings don\'t knock you off who you are.',
                lean: 'You\'re mostly yourself, but some feelings stay behind a calm surface longer than they should.',
                hot: 'You hold your feelings in so well that people rarely know what\'s happening for you. It looks like calm — the book calls it suppression — and it tends to come out later, bigger.' },
  integrity:  { ok: 'Your actions match your values, and you go back to repair things after conflict instead of letting them slide.',
                lean: 'You mean what you say, but repair is the step you skip most often once things calm down.',
                hot: 'Once things calm down, you\'d rather move on than revisit it, and the story you tell yourself tends to protect your self-image. That\'s relief, not resolution — so the loop resets.' },
  consistency:{ ok: 'You\'re the same whether or not anyone\'s watching. People find you predictable in the best way.',
                lean: 'You\'re steady most of the time, but uncertainty makes you tighten up.',
                hot: 'When things feel uncertain, you become rigid or controlling. It makes the world feel safe again, and others can feel boxed in by it.' },
  honesty:    { ok: 'You can look straight at a decision that shows you were wrong. That honesty is what drives your growth.',
                lean: 'You\'ll look honestly at most things, but some decisions you\'d rather not reopen.',
                hot: 'You tend to avoid looking at decisions that might show you acted wrongly. What isn\'t looked at can\'t be changed.' },
  purpose:    { ok: 'You can turn strong feelings into something useful and still act with a plan. Your intensity is fuel, not fire.',
                lean: 'Your energy is real, and sometimes it runs ahead of the plan.',
                hot: 'You go all-in, then drop things completely, and your mood can swing between extremes. The energy is a strength that hasn\'t found its direction yet.' },
  pattern:    { ok: 'You can spot your loops while they\'re happening, and you know your early warning signs.',
                lean: 'You recognise your patterns, but usually a beat too late to change them.',
                hot: 'You see your patterns but keep repeating them, and small things can tip you over without warning. Insight alone isn\'t enough — which is exactly the book\'s point.' },
  limit:      { ok: 'When you hit your limit, you can step away calmly and come back later.',
                lean: 'You usually step away before it goes too far, but not every time.',
                hot: 'In heated moments you say or do things you can\'t take back. That\'s capacity being exceeded, not who you are — and capacity can be rebuilt.' },
  cycles:     { ok: 'You\'re actively working on your cycles, not just naming them.',
                lean: 'You\'ve started working on your cycles; some still reset before they\'re resolved.',
                hot: 'After a blow-up or a shutdown, things reset without being resolved — so the next trigger starts from where the last one left off.' }
};
const PATTERN_TEXT = {
  Narc:     { what: 'Self-protection by contracting — going quiet, holding your position, cutting the input down.', gift: 'Steadiness. You don\'t get swept away, and in a crisis you can think when others can\'t.' },
  Empath:   { what: 'Self-protection by expanding — reaching out, explaining, fixing, keeping the connection alive.', gift: 'Warmth. People feel cared for and noticed around you, and you rarely let a relationship drift without trying.' },
  Grounded: { what: 'The balance point — staying present with emotion without obeying it. Its shadow is fake calm: holding it all in, or holding on too tightly.', gift: 'Reliability. When it is working, people trust you because you are the same person every time.' },
  Volatile: { what: 'The threshold — the point where capacity runs out and things escalate or collapse.', gift: 'Intensity. The same energy that tips you over is what makes you passionate, driven and impossible to ignore.' }
};
const WORK_WITH_ME = {
  Narc:     ['Give me a moment before expecting an answer — I\'ll come back to it.', 'One point at a time works better than everything at once.', 'Tell me what you need, rather than what I did wrong.'],
  Empath:   ['If you need space, tell me — and tell me when you\'ll come back to it.', 'A quick "we\'re okay" goes a long way with me.', 'Don\'t go silent without a word; that\'s the hardest thing for me.'],
  Grounded: ['If I say "I\'m fine", it\'s worth asking twice.', 'Come back to it once things have calmed down — I might not raise it myself.'],
  Volatile: ['If I\'m escalating, slow down rather than match me.', 'Let\'s agree a pause word we both respect, and use it early.'],
  steady:   ['Be direct with me — I can handle it.', 'Disagreement doesn\'t threaten me; say what you think.']
};
root.SCReportLibrary = { TYPES, STAGES, MEASURES, CODES, PATTERN_TEXT, WORK_WITH_ME };
if (typeof module !== 'undefined') module.exports = root.SCReportLibrary;
})(typeof window !== 'undefined' ? window : globalThis);
