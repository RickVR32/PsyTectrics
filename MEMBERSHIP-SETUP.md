# Logins, membership and new tests: setup (about 20 minutes)

## 1. Upload
Unzip `psytectrics-accounts-membership.zip` and upload everything to GitHub (keep the folders: `api`, `lib`, `tests`).
Nothing needs deleting: old pages now redirect, and old functions are skipped by `.vercelignore`.

## 2. Supabase
1. **SQL Editor:** paste the "Accounts (logins) and membership" block from the bottom of `supabase-schema.sql` and click Run.
2. **Authentication → URL Configuration:**
   - Site URL: `https://psytectrics.com`
   - Redirect URLs: add `https://psytectrics.com/account.html`
3. **Project Settings → API Keys:** copy the **anon / publishable** key (the public one, NOT service_role).
4. Optional but recommended: **Authentication → Emails → SMTP settings**. Supabase's built-in email only sends a few sign-in emails per hour. Plugging in Resend (free tier) removes that limit, and the emails come from your own address.

## 3. Stripe (test mode first)
1. **Product catalogue → Add product:** "PsyTectrics Membership" with two **recurring** prices:
   - £7.99 per month
   - £59 per year
   Copy both price IDs (`price_…`).
2. **Settings → Billing → Customer portal:** click Activate (lets members change card / cancel themselves).
3. **Developers → Webhooks:** open your existing endpoint and **add these events**:
   `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
   (keep `checkout.session.completed`).

## 4. Vercel → Settings → Environment Variables
| Name | Value |
|---|---|
| `SUPABASE_ANON_KEY` | anon / publishable key from step 2.3 |
| `STRIPE_MEMBER_MONTHLY_PRICE_ID` | the £7.99/month price ID |
| `STRIPE_MEMBER_YEARLY_PRICE_ID` | the £59/year price ID |

Then Deployments → ⋯ → Redeploy.

## 5. Try it
1. psytectrics.com → **Sign in** (top right) → enter your email → click the link in the email.
2. Take any test while signed in: it saves to your dashboard automatically.
3. Dashboard → Join monthly → pay with test card `4242 4242 4242 4242`.
4. Retake the Awareness Profile: the button now says the report is included, and opens it without paying.
5. Dashboard → Manage billing → cancel → the membership shows as ending.

## Changing prices later
Create the new price in Stripe and swap the price ID in Vercel. The page text says £7.99 / £59. Tell Claude and it'll update the wording too.
