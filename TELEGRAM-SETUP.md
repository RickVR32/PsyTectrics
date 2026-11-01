# Telegram bot, Q&A and reviews: setup (about 15 minutes)

## 1. Create the bot
1. In Telegram, open **@BotFather** and send `/newbot`. Name it e.g. *PsyTectrics*, username e.g. `PsyTectricsBot`.
2. Copy the **token** it gives you.
3. Still in BotFather: `/setcommands`, pick the bot, paste:
   ```
   start - Menu: tests, questions, reviews
   delete - Delete everything the bot holds about you
   ```

## 2. Find your own chat ID (makes you the admin)
Message **@userinfobot** and it replies with your ID (a number). That's `TELEGRAM_ADMIN_CHAT_ID`.

## 3. Add these in Vercel → Project → Settings → Environment Variables
| Name | Value |
|---|---|
| `TELEGRAM_BOT_TOKEN` | token from BotFather |
| `TELEGRAM_ADMIN_CHAT_ID` | your number from @userinfobot |
| `TELEGRAM_WEBHOOK_SECRET` | any long random text (letters/numbers only), e.g. 40 characters |
| `CRON_SECRET` | another long random text (Vercel sends it to the daily job) |
| `ANTHROPIC_API_KEY` | optional — makes the Q&A answer anything. Without it, the bot uses the built-in FAQ |

Already needed from before: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SC_CODE_KEY`, `SITE_URL`, `STRIPE_SECRET_KEY`.

Redeploy after adding them.

## 4. Run the new database blocks
Supabase → SQL Editor → paste the **tg_users** and **reviews** blocks from the bottom of `supabase-schema.sql` → Run.

## 5. Connect Telegram to the site (one time)
Open this in your browser, with your values swapped in:
```
https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://psytectrics.com/api/telegram&secret_token=<WEBHOOK_SECRET>&allowed_updates=["message","callback_query"]
```
It should reply `"ok":true`.

## 6. Try it
- Message your bot `/help` and you get the admin commands.
- Message `/start` from another account (or a friend's) and you get the client menu.

## What you can do from your phone
| Command | Does |
|---|---|
| `/today` | Last 24 hours: tests, sales, reviews waiting |
| `/stats` | Same for 30 days |
| `/code SC4-…` | Opens any client's Source Code and shows their result |
| `/promo FAMILY20 20 10` | Makes a Stripe code: 20% off, 10 uses (leave off the last number for unlimited) |
| `/reviews` | Re-sends any reviews waiting for approval |

You'll also get pinged automatically for: every sale, every new review (with **Approve / Reject** buttons, and approved reviews go live on the homepage within 5 minutes), questions the bot couldn't answer, any message that sounds like a crisis, and a morning summary at 8am UK (9am in summer).

## Notes
- Reviews ticked "free or discounted" are labelled on the site. UK law (DMCC Act) requires that, so keep it on.
- The old placeholder testimonials on the homepage were removed. Until you approve your first real review, that section stays hidden.
- Clients can take the Quick Check and the full Awareness Profile in Telegram. The result links to the site, where they can see the Balance Map and pay for the full report (Stripe, not in Telegram).
- Monthly check-ins: clients turn them on with one tap. Once a month the bot sends them a Quick Check and tells them whether their level moved.
