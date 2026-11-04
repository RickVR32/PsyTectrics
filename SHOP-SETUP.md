# Shop and pre-orders: setup

The shop is at **psytectrics.com/shop** (shop.html). Buyers choose decks and pay through Stripe Checkout. Each order goes to Supabase (`orders` table) and sends you a Telegram alert with the name, address and what to post.

## One-off steps

1. **Upload this zip to GitHub after the earlier two** (`accounts-membership`, then `logo-and-theme`, then this one). It contains newer copies of some of the same pages.
2. **Supabase → SQL Editor:** paste in `orders-table.sql`, click Run, then press Ctrl+S.
3. **Stripe → Webhooks:** nothing new to add. The shop uses `checkout.session.completed`, which you already have.
4. **Stripe → Settings → Customer emails:** turn on "Successful payments" so buyers get a receipt.
5. Redeploy on Vercel.

No Stripe products are needed. The price is set in code: £25 a deck, £3.95 UK delivery, free delivery on 2 or more.

## Settings (optional Vercel env vars)

| Variable | Default | What it does |
|---|---|---|
| `SHOP_OPEN` | `true` | Set to `false` to pause orders |
| `SHOP_MODE` | `preorder` | Change to `live` once stock arrives (labels switch from "Pre-order" to "In stock") |
| `SHOP_PRICE_PENCE` | `2500` | Price per deck in pence |
| `SHOP_SHIPPING_PENCE` | `395` | UK delivery charge in pence |
| `SHOP_FREE_SHIPPING_FROM` | `2` | Number of decks that gets free delivery (`0` = never free) |
| `SHOP_SHIP_NOTE` | (pre-order text) | Shown on the page and at checkout, e.g. "Ships w/c 7 December" |

Redeploy after changing any of them.

## Fulfilling orders

- Each order arrives in Telegram as "Pre-order — 2 × Narcissist …" with the address.
- All orders are in **Supabase → Table editor → orders**. When you post one, set `status` to `shipped` and add `shipped_at` and `tracking`.
- For refunds, refund in Stripe and set `status` to `refunded`.

## QR codes and short links

| Link | Goes to |
|---|---|
| `psytectrics.com/free` | Free Quick Check (the printed link on the thank-you cards) |
| `psytectrics.com/qr/narc` | Quick Check, tracked as `utm_campaign=narcissist-card-game` |
| `psytectrics.com/qr/kids` | Quick Check, tracked as `utm_campaign=bad-habits` |
| `psytectrics.com/shop` | The shop |

## Before Bad Habits! ships

It's a toy for ages 7–12. Before any deck is posted it needs a UKCA mark, your company name and address on the box, and a safety file. Pre-orders can be taken now, but don't ship until these are done.
