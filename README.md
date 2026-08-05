# Dog's World India — Independence Day Pet Parade

Landing page + registration for the Independence Day Pet Parade by Dog's World India.

- **Date:** Saturday, 15 August 2026, 8:00 AM
- **Route:** Dr. Kashinath Ghanekar Natyagruha → Dog's World India, Manpada (~600 m)
- **Pass:** ₹299 per pet + one parent

## Structure

- `index.html` — landing page (styles + script inline)
- `register.html` — 3-step registration wizard, hands off to WhatsApp
- `api/order.js`, `api/verify.js` — parked Razorpay functions (see below)
- `assets/` — logo and route map

## Deploy

Live at **https://dogs-world-parade.vercel.app**.

```
npx vercel@latest deploy --prod
```

The registration flow is plain static HTML — it also works on GitHub Pages
or Netlify. Only the parked `api/` functions need Vercel.

## How registration works (current)

`register.html` is a 3-step wizard:

1. **Your details** — name, email, mobile, city
2. **Your pet** — pet name, breed, T-shirt size, plus two optional questions
3. **Confirm on WhatsApp** — the answers are written into a ready-made
   message and the chat opens; the registrant only presses **send**

The ₹299 is settled in that conversation. There is no payment gateway and
no bank detail anywhere in this repo.

**The WhatsApp chat is the record of a registration** — the Google Form is
no longer in the flow (it demanded a Google sign-in, which was the slowest
part of signing up). Keep the chat, or copy the messages into a sheet as
they come in.

To change the number, edit `WA_NUMBER` (digits only, with country code)
and `WA_SHOWN` at the top of the script in `register.html`. They are
currently `918291821712` / `+91 82918 21712`.

The message text is built in `buildMessage()` in the same script — edit
there to change what gets sent.

### If WhatsApp doesn't open

The page has a fallback: *"WhatsApp didn't open? Copy my details instead"*
copies the same message to the clipboard so it can be pasted into any chat.

### Bringing back a payment gateway

`api/order.js` and `api/verify.js` are untouched and still deployed, and
the Razorpay checkout block plus the Google Form wiring are in git history
(`git log -- register.html`) — commits *"Take ₹299 online with Razorpay"*
and *"Swap Razorpay checkout for a manual UPI flow"*.

## Razorpay setup (parked)

1. Razorpay Dashboard → **Account & Settings → API Keys → Generate Test Key**.
   You get `rzp_test_…` (key id) and a secret shown **once** — copy it.
2. Vercel → your project → **Settings → Environment Variables**, add both
   for Production, Preview and Development:

   | Name | Value |
   |---|---|
   | `RAZORPAY_KEY_ID` | `rzp_test_…` |
   | `RAZORPAY_KEY_SECRET` | the secret from step 1 |

3. **Redeploy** (env vars only apply to new deployments).
4. Test with Razorpay's test cards — e.g. card `4111 1111 1111 1111`,
   any future expiry, any CVV, OTP `1234`. Test UPI id: `success@razorpay`.
5. When happy: finish KYC, switch the dashboard to **Live mode**, generate
   **live** keys, replace both env vars with the `rzp_live_…` pair, redeploy.

Enable the methods you want (UPI, cards, netbanking, wallets) under
**Dashboard → Settings → Payment Methods**. UPI covers GPay, PhonePe and Paytm.

### Never commit the key secret

`RAZORPAY_KEY_SECRET` must only ever live in Vercel's environment variables.
This repo is public — a leaked secret lets anyone charge or refund on the
account. The key **id** is public by design and is safe in the browser.
