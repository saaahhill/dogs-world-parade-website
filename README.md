# Dog's World India — Independence Day Pet Parade

Landing page + registration for the Independence Day Pet Parade by Dog's World India.

- **Date:** Saturday, 15 August 2026, 8:00 AM
- **Route:** Dr. Kashinath Ghanekar Natyagruha → Dog's World India, Manpada (~600 m)
- **Pass:** ₹299 per pet + one parent

## Structure

- `index.html` — landing page (styles + script inline)
- `register.html` — 3-step registration wizard, hands off to WhatsApp
- `sheet/Code.gs` — Apps Script that writes registrations into a Google Sheet
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

The Google Form is no longer in the flow — it demanded a Google sign-in,
which was the slowest part of signing up. Registrations are recorded in a
Google Sheet instead (below), with the WhatsApp chat as the payment thread.

To change the number, edit `WA_NUMBER` (digits only, with country code)
and `WA_SHOWN` at the top of the script in `register.html`. They are
currently `918291821712` / `+91 82918 21712`.

The message text is built in `buildMessage()` in the same script — edit
there to change what gets sent.

### If WhatsApp doesn't open

The page has a fallback: *"WhatsApp didn't open? Copy my details instead"*
copies the same message to the clipboard so it can be pasted into any chat.

## Registrations sheet

Every completed form is posted to a Google Sheet, so you get a spreadsheet
of registrants rather than a hundred chats — **including the people who fill
the form and never press send in WhatsApp.**

Each registrant is one row. The **Status** column says how far they got:

| Status | Means |
|---|---|
| `Filled form` | Finished both steps, reached the WhatsApp screen |
| `Opened WhatsApp` | Tapped through to the chat — expect their message |
| `Copied message` | Used the clipboard fallback |

A row is created at *Filled form* and **updated in place** when they open
WhatsApp — matched on a hidden `Reg ID`, so nobody appears twice.

### Setting it up

1. Create a Google Sheet — name it anything, e.g. *Pet Parade registrations*.
2. **Extensions → Apps Script**. Delete the placeholder code.
3. Paste in everything from [`sheet/Code.gs`](sheet/Code.gs). Save.
4. **Deploy → New deployment → Web app**
   - *Execute as*: **Me**
   - *Who has access*: **Anyone**
   - Deploy, approve the permission prompt (it's your own script writing to
     your own sheet), and copy the **Web app URL** — it ends in `/exec`.
5. Paste that URL into `SHEET_URL` at the top of the script in
   `register.html`, then redeploy the site (`vercel deploy --prod`).

Test it by opening the `/exec` URL in a browser — it answers with the
current registration count.

Left blank, `SHEET_URL` simply disables logging; the site works exactly as
before. Logging can never block or break a registration — it's fire and
forget, and failures are swallowed on purpose.

### Getting it into Excel

The sheet is live — refresh and new registrations are there. For an actual
`.xlsx`: **File → Download → Microsoft Excel (.xlsx)**. That's a snapshot,
so re-download when you want the latest.

### One caveat

*Who has access: Anyone* means anyone who learns the `/exec` URL could post
a fake row. That's the trade-off for a no-login endpoint, and it's the same
posture as a public Google Form. The real registrations are the ones with a
matching WhatsApp message.

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
