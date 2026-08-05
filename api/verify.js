/* ============================================================
   POST /api/verify  —  confirms a payment really happened.

   Razorpay signs every successful payment with your key secret:
       signature = HMAC_SHA256(order_id + "|" + payment_id, secret)

   The browser can fake a success screen; it cannot fake this
   signature, because the secret never leaves the server.
   ============================================================ */

const crypto = require('crypto');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return res.status(500).json({ error: 'Payments are not configured yet.' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  const orderId   = String(body.razorpay_order_id   || '');
  const paymentId = String(body.razorpay_payment_id || '');
  const signature = String(body.razorpay_signature  || '');

  if (!orderId || !paymentId || !signature) {
    return res.status(400).json({ valid: false, error: 'Missing payment details.' });
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(orderId + '|' + paymentId)
    .digest('hex');

  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signature, 'utf8');
  const valid = a.length === b.length && crypto.timingSafeEqual(a, b);

  if (!valid) {
    console.warn('signature mismatch for order', orderId);
    return res.status(400).json({ valid: false, error: 'Payment could not be verified.' });
  }

  return res.status(200).json({ valid: true, paymentId: paymentId });
};
