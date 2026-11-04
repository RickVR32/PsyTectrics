# Play online: setup

The online games are at **psytectrics.com/play** (play.html). Both games use the same rules as the printed decks.

## What's free and what's unlocked

- **Free, no sign-up:** Quick round. 12 Triggers, solo or 2 players.
- **Full game:** 18 Triggers, 1–6 players, plus Softer and Harder (hidden hands) options. Unlocked for:
  - **members:** sign in on the site and it unlocks automatically
  - **anyone with a code:** the codes are printed on the thank-you cards that go in each order

## Codes

| Code | Unlocks |
|---|---|
| `ZEROPOINT` | Narcissist Card Game |
| `GOODHABITS` | Bad Habits! |

To change the codes or add more, set the Vercel env var `GAME_CODES`, for example:

`ZEROPOINT:narcissist,GOODHABITS:bad-habits,XMAS26:all`

Then redeploy. Codes are not case-sensitive, and spaces or dashes are ignored. The unlock is remembered on that device.

If you change the codes, reprint the thank-you cards with the new ones.

## Files

- `play.html`, `play.js`: the screens
- `play-engine.js`: the rules (no screen code). Balance was checked with 10,000 simulated games per setup.
- `play-cards.js`: the card text (54 cards per game)
- `lib/routes/game.js`: the code check (`/api/game`, served by `api/site.js`, so it doesn't add a Vercel function)
