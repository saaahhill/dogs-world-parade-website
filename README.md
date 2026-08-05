# Dog's World India — Independence Day Pet Parade

Landing page + registration for the Independence Day Pet Parade by Dog's World India.

- **Date:** Saturday, 15 August 2026, 8:00 AM
- **Route:** Dr. Kashinath Ghanekar Natyagruha → Dog's World India, Manpada (~600 m)
- **Pass:** ₹299 per pet + one parent

## Structure

- `index.html` — landing page (styles + script inline)
- `register.html` — 4-step registration wizard with Razorpay payment
- `api/order.js` — creates the ₹299 Razorpay order (server-side)
- `api/verify.js` — verifies the payment signature (server-side)
- `assets/` — logo and route map

## Deploy (Vercel — required for payments)

The two files in `api/` are serverless functions. They only run on Vercel
(or Netlify Functions with small changes). **On GitHub Pages the payment
button will not work** — the page then tells people to pay at the venue.

1. [vercel.com/new](https://vercel.com/new) → import this GitHub repo.
2. Framework preset: **Other**. No build command, no output directory.
3. Deploy.

## Razorpay setup

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

## How the payment works

1. Browser asks `/api/order` for an order. The **amount (₹299) is set in
   `api/order.js`**, never sent by the browser, so it cannot be edited to ₹1.
2. Razorpay Checkout opens. Razorpay handles the card/UPI details — the site
   never sees them.
3. On success Razorpay returns a signature. `/api/verify` recomputes it as
   `HMAC_SHA256(order_id|payment_id, key_secret)` and only then does the page
   mark the registration paid. A faked success screen cannot pass this.
4. The registrant's name, email, mobile, pet, breed and T-shirt size are
   attached to the order as **notes**, so even someone who pays and then
   closes the tab is visible in the Razorpay dashboard.

To change the price, edit `AMOUNT_PAISE` in `api/order.js` (in paise:
`29900` = ₹299) and the display text in `register.html`.

## Registrations

Answers still go to the existing Google Form / responses sheet.
`register.html` currently uses `SUBMIT_MODE = 'redirect'` because the form is
set to *Collect email addresses: Verified*, which requires a Google sign-in.
Switching that off (and adding a plain **Email** question) lets you set
`SUBMIT_MODE = 'direct'` so people never leave the site — see the comment at
the top of the script in `register.html`.

The Razorpay payment id is shown on the confirmation screen and stored in the
Razorpay dashboard. To get it into the sheet too, add a **Payment ID** short
answer question to the form and put its `entry.…` id into `FIELDS.paymentId`.
