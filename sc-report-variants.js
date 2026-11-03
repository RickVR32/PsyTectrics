/* Second wording for every code paragraph (ok / lean / hot). sc-report.js picks one version per
   person from their Source Code, so a report always reads the same for them but two people with
   the same scores don't get identical text. */
(function (root) {
  const CODES_ALT = {
    intention: {
      ok: "You can name what you want without needing to steer where it lands. People can push back on you without it turning into a contest, which makes decisions with you feel fair.",
      lean: "You're mostly open, but there's a point where a challenge starts to feel like a threat. Past that point you argue to hold ground rather than to find the best answer. Notice when the topic stops mattering and the winning starts to.",
      hot: "Your answers suggest that feeling safe depends on things going your way. When challenged, you defend first and listen later. It protects you, but the people around you may stop offering ideas because it feels pointless."
    },
    presence: {
      ok: "You can stay in the room, literally and emotionally, when things get heated. And when you do need a break, you say so instead of disappearing. That alone heads off most escalations.",
      lean: "You can stay present up to a point, then you start to withdraw: shorter answers, more logic, less eye contact. The other person often reads this as you not caring, when really you're overloaded.",
      hot: "When emotions rise, you shut down or go to facts. It's how you get steady again, but to the other person it can feel like a door closing. This is often the move that starts the chase on their side."
    },
    ownership: {
      ok: "You can say \"that was me\" without wrapping it in reasons. That makes repair quick, and it gives the other person permission to own their part too.",
      lean: "You'll own things, but often with a \"but\" attached, or only once the other person has admitted their part first. The apology lands half-heartedly even when you mean it.",
      hot: "Your answers show a strong pull to prove it wasn't really your fault. That keeps your self-image intact, but it leaves the other person carrying the blame, and resentment builds quietly."
    },
    impact: {
      ok: "You notice how you're landing while it's happening, and you adjust. People feel seen by you, even in disagreements.",
      lean: "You usually notice your impact, just a little late: after the conversation, or when someone points it out. The awareness is there; the timing is what needs work.",
      hot: "You often only find out how you came across after the damage is done. It isn't that you don't care: under pressure your attention goes inward, and the other person drops out of view."
    },
    balance: {
      ok: "You can let someone be upset without rushing in to fix it, and you can support them without losing yourself. That steadiness is calming to be around.",
      lean: "When someone pulls back, you feel the urge to explain or fix, and sometimes you act on it before you've checked whether it's needed. Saying less would often help more.",
      hot: "Distance from someone you care about feels urgent, so you explain, reassure and fix until you feel understood. It comes from care, but it can overwhelm the other person and push them further away."
    },
    connection: {
      ok: "You can feel close to people without needing constant proof. Silence doesn't automatically mean something's wrong to you, which gives relationships room to breathe.",
      lean: "Mostly you feel secure, but a slow reply or a change in tone can set off worry. You may find yourself checking or saying yes just to keep things smooth.",
      hot: "Silence or a slow reply can feel like a threat, so you reach for reassurance or say yes to keep the peace. Connection matters so much that your own needs and noes get lost."
    },
    clearhead: {
      ok: "When feelings run high, you can slow down and think before you act. You respond rather than react, which keeps hard conversations workable.",
      lean: "You can think clearly most of the time, but when you feel disconnected your emotions start driving. You may push harder exactly when stepping back would work better.",
      hot: "Once you feel disconnected, emotion takes the wheel and you push harder for a response. Thinking clearly comes back later, often after the moment has gone wrong."
    },
    holding: {
      ok: "You can be there for someone who's struggling without taking their feelings on as your own. You hold your ground kindly, which makes you both safe and solid.",
      lean: "You can hold your ground, but when someone you love is struggling, their state starts to become yours. Your limits slip a little at a time.",
      hot: "When someone you care about is struggling, you lose yourself in it. Their mood becomes your job, and your own limits disappear until you're exhausted."
    },
    coreself: {
      ok: "You feel like the same person whoever you're with, and strong feelings don't knock you off who you are. People know where they stand with you.",
      lean: "Your sense of self is mostly steady, but under pressure you keep a calm surface while things build underneath. People may not realise how much is going on with you.",
      hot: "You hold things in so well that the people around you rarely know what's really happening inside. It looks like calm. It's actually containment, and it costs you."
    },
    integrity: {
      ok: "Your actions line up with the values you talk about, and you go back to repair things after a conflict. That consistency builds deep trust.",
      lean: "You mean what you say, but after a conflict you'd often rather move on than revisit it. Things get smoothed over rather than sorted, and small cracks stay.",
      hot: "Your answers suggest you sometimes tell yourself stories that protect your self-image, and you'd rather move on than talk about what happened. Unrepaired moments pile up between you and others."
    },
    consistency: {
      ok: "You behave the same whether or not you're being watched, and people can predict how you'll respond. That predictability is a form of safety for the people close to you.",
      lean: "You're mostly consistent, but uncertainty can make you more rigid or controlling than usual. Others may notice you change when you're unsure.",
      hot: "When you feel uncertain, you tighten up: more rules, more control, less flexibility. To others it can feel like a different version of you shows up under stress."
    },
    honesty: {
      ok: "You can look straight at a decision even when it shows you got it wrong. That honesty with yourself is the root of real change.",
      lean: "You'll look at your own choices, but some are easier to avoid than others. The ones that would hurt most to examine tend to stay unexamined.",
      hot: "You tend to steer away from looking at decisions that might show you acted wrongly. It protects you in the moment, and it means the same mistakes have room to repeat."
    },
    purpose: {
      ok: "You can turn strong feelings into something useful and still act with a plan. Intensity becomes fuel rather than chaos.",
      lean: "You have direction, but strong moods can pull you off it. You may go hard at something, then lose momentum when the feeling fades.",
      hot: "You go all-in, then drop things completely, and your mood can swing between extremes. The energy is real; it just isn't steered yet."
    },
    pattern: {
      ok: "You can spot your loops while they're happening and you know your early warning signs. That gives you a moment to choose differently.",
      lean: "You can see your patterns, mostly in hindsight. Catching them in the moment is the next step, and the place where change happens.",
      hot: "You know your patterns but keep repeating them, and small things can tip you over without warning. Insight alone isn't breaking the loop yet."
    },
    limit: {
      ok: "When you hit your limit, you can step away calmly and come back later. You protect the relationship from your worst moments.",
      lean: "You usually catch your limit, but not always. Now and then something slips out in the heat of the moment that takes a while to undo.",
      hot: "In heated moments you can say or do things you can't take back. Your limit arrives faster than your brakes, and repair afterwards becomes a regular job."
    },
    cycles: {
      ok: "You're actively working to break your cycles, not just recognising them. Arguments end with something resolved rather than simply paused.",
      lean: "You're aware of your cycles and trying, but things still sometimes reset without being properly resolved. Old arguments come back wearing new clothes.",
      hot: "After a blow-up or a shutdown, things reset as if nothing happened. Nothing gets resolved, so the same cycle is waiting for the next trigger."
    }
  };
  // stable 0/1 choice per person and code
  function pick(seed, id) {
    let h = 2166136261; const s = String(seed || '') + '|' + id;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0) % 2;
  }
  root.SCReportVariants = { CODES_ALT, pick };
  if (typeof module !== 'undefined') module.exports = root.SCReportVariants;
})(typeof window !== 'undefined' ? window : globalThis);
