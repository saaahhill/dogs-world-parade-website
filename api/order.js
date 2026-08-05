/* ============================================================
   POST /api/order  —  creates a ₹299 Razorpay order.

   The amount is set HERE, on the server, never taken from the
   browser, so nobody can register for ₹1 by editing the page.

   Needs two environment variables on Vercel:
     RAZORPAY_KEY_ID      rzp_test_… while testing, rzp_live_… when live
     RAZORPAY_KEY_SECRET  never goes in this repo
   ============================================================ */

const AMOUNT_PAISE = 29900;          /* ₹299.00 */
const CURRENCY     = 'INR';

function clean(v, max) {
  return String(v == null ? '' : v).trim().slice(0, max || 120);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const keyId  = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !secret) {
    return res.status(500).json({ error: 'Payments are not configured yet.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  /* Everything the registrant has told us so far rides along on the
     order. If they pay and then close the tab before finishing the
     form, the full details are still sitting in the Razorpay
     dashboard against the payment. */
  const notes = {
    name:    clean(body.name),
    email:   clean(body.email),
    mobile:  clean(body.mobile),
    city:    clean(body.city),
    pet:     clean(body.petName),
    breed:   clean(body.breed),
    tshirt:  clean(body.size),
    event:   'Independence Day Pet Parade 2026'
  };

  const receipt = 'parade_' + Date.now().toString(36);

  try {
    const rzp = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(keyId + ':' + secret).toString('base64')
      },
      body: JSON.stringify({
        amount: AMOUNT_PAISE,
        currency: CURRENCY,
        receipt: receipt,
        notes: notes
      })
    });

    const order = await rzp.json();

    if (!rzp.ok) {
      const msg = (order && order.error && order.error.description) || 'Could not start the payment.';
      console.error('razorpay order failed', order);
      return res.status(502).json({ error: msg });
    }

    /* key_id is public — it is meant to be used by the browser. */
    return res.status(200).json({
      orderId:  order.id,
      amount:   order.amount,
      currency: order.currency,
      keyId:    keyId
    });
  } catch (err) {
    console.error('razorpay order error', err);
    return res.status(502).json({ error: 'Could not reach the payment gateway.' });
  }
};
