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

## Payments — manual UPI (current)

Step 3 of `register.html` currently takes payment **straight into the
partnership merchant UPI account**: QR code, UPI id, an "Open UPI App and
Pay ₹299" intent link, and a box for the payer's transaction reference.

Nothing on the page can confirm a transfer, so it never claims one — it
shows **"Payment submitted — verification pending"** and the confirmation
screen says the spot is held once the transfer is checked by hand.
"Pay at the venue instead" stays as a fallback.

To switch it on, set these at the top of the script in `register.html`
(search for `MANUAL UPI PAYMENT`) and add the QR image:

| What | Where |
|---|---|
| Merchant UPI id | `var UPI_ID = 'name@bank';` |
| Name shown in the payer's app | `var UPI_NAME` |
| QR image | save it as `assets/upi-qr.png` |

Until `UPI_ID` is set the QR and the pay button stay hidden and the page
asks people to pay at the venue — no dead buttons, no broken image.

Only the UPI id and the QR ever appear on the page. **Never put the account
number, IFSC, netbanking login or any bank credential in this repo** — they
are not needed to receive money and the repo is public.

### Reconciling

Every submitted reference lands in the registration response. Match each one
against the credits in the merchant account before treating a spot as
confirmed — the reference is typed in by the payer and is not proof on its own.

### Going back to Razorpay

`api/order.js` and `api/verify.js` are untouched and still deployed. To
restore automatic checkout, put back the checkout script tag in the `<head>`

```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

and restore the Razorpay pay block from git history (`git log -- register.html`,
commit *"Take ₹299 online with Razorpay"*), then set the env vars below.

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

### Missing questions

The form has no question for the email address, the payment method or the UPI
reference, so those three answers are collected on the page but **do not reach
the responses sheet yet**. Add them to the Google Form as *Short answer*
questions and paste their `entry.…` ids into `FIELDS` in `register.html`:

| Add this question | Fill in |
|---|---|
| Email | `FIELDS.email` |
| Payment method | `FIELDS.method` |
| UPI transaction reference | `FIELDS.txnRef` |

The entry id of a question can be read off the form's prefill link
(⋮ → Get pre-filled link).
