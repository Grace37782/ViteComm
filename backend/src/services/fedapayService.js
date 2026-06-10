import crypto from 'crypto';

const FEDAPAY_BASE_URL =
  process.env.FEDAPAY_BASE_URL ||
  (process.env.FEDAPAY_ENVIRONMENT === 'production'
    ? 'https://api.fedapay.com'
    : 'https://sandbox-api.fedapay.com');

const FEDAPAY_SECRET_KEY = process.env.FEDAPAY_SECRET_KEY;
const FEDAPAY_WEBHOOK_SECRET = process.env.FEDAPAY_WEBHOOK_SECRET;

const PAYMENT_METHOD_MAP = {
  momo: 'mtn_bj',
  moov: 'moov_bj',
  celtis: 'celtis_bj',
};

function formatPhoneForBenin(phone) {
  let cleaned = phone.replace(/\s/g, '').replace(/-/g, '');
  if (cleaned.startsWith('+229')) return cleaned;
  if (cleaned.startsWith('22901')) return '+' + cleaned;
  if (cleaned.startsWith('01')) return '+229' + cleaned;
  return cleaned;
}

export async function initiatePayment(transaction) {
  const phone = transaction.telephone
    ? formatPhoneForBenin(transaction.telephone)
    : undefined;

  const payload = {
    description: `Commande ViteComm #${transaction.id_commande}`,
    amount: Math.round(transaction.montant),
    currency: { iso: transaction.devise || 'XOF' },
    reference: transaction.transaction_id,
    callback_url: `${process.env.APP_URL}/api/webhooks/fedapay`,
    return_url: `${process.env.APP_URL.replace(':5000', ':5173')}/client/paiement?ref=${transaction.transaction_id}`,
  };

  if (phone) {
    payload.customer = {
      firstname: transaction.client_prenom || 'Client',
      lastname: transaction.client_nom || 'ViteComm',
      phone_number: { number: phone, country: 'BJ' },
    };
  }

  const method = PAYMENT_METHOD_MAP[transaction.mode_paiement];
  if (method) {
    payload.method = method;
  }

  const response = await fetch(`${FEDAPAY_BASE_URL}/v1/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${FEDAPAY_SECRET_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Erreur lors de l\'initiation du paiement');
  }

  const txData = data?.['v1/transaction'] || data?.data?.transaction || data?.transaction || data;

  const checkoutUrl =
    txData?.payment_url ||
    data?.data?.payment_url ||
    data?.transaction?.payment_url ||
    data?.transaction?.url ||
    data?.url ||
    data?.checkout_url ||
    data?.payment_url;

  if (!checkoutUrl) {
    throw new Error('Aucune URL de paiement reçue de FedaPay');
  }

  return { checkout_url: checkoutUrl, fedapay_id: String(txData?.id || data?.data?.id || data?.transaction?.id) };
}

export function verifyWebhookSignature(payload, signatureHeader) {
  if (!signatureHeader || !FEDAPAY_WEBHOOK_SECRET) return null;

  const parts = {};
  for (const part of signatureHeader.split(',')) {
    const [key, value] = part.split('=');
    parts[key] = value;
  }

  const timestamp = parts.t;
  const signature = parts.s;

  if (!timestamp || !signature) return null;

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) return null;

  const expected = crypto
    .createHmac('sha256', FEDAPAY_WEBHOOK_SECRET)
    .update(`${timestamp}.${payload}`)
    .digest('hex');

  const sigBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');

  if (sigBuffer.length !== expectedBuffer.length) return null;

  const isValid = crypto.timingSafeEqual(sigBuffer, expectedBuffer);

  return isValid ? { timestamp, event: null } : null;
}

export function generateTransactionId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'TXN-';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function verifyTransactionStatus(fedapayId) {
  if (!fedapayId || !FEDAPAY_SECRET_KEY) return null;
  try {
    const response = await fetch(`${FEDAPAY_BASE_URL}/v1/transactions/${fedapayId}`, {
      headers: { Authorization: `Bearer ${FEDAPAY_SECRET_KEY}` },
    });
    if (!response.ok) return null;
    const data = await response.json();
    const tx = data?.['v1/transaction'] || data?.data?.transaction || data?.transaction || data;
    return tx?.status || null;
  } catch {
    return null;
  }
}
