import crypto from 'crypto';

const QR_SECRET = process.env.VENDOR_QR_SECRET || 'vitecomm-vendor-qr-mvp-secret-key';

/**
 * Vendor generates a signed QR code based on the client's verification code (RG06).
 * Like JWT: the vendor takes the client's code, adds their order context, and signs it.
 * The system can later verify this signed token to prove the driver met the vendor.
 */
export function generateVendorQRToken(orderId, clientCode) {
  const ts = Date.now();
  const payload = `${orderId}:${clientCode}:${ts}`;
  const sig = crypto
    .createHmac('sha256', QR_SECRET)
    .update(payload)
    .digest('hex')
    .substring(0, 16);
  return JSON.stringify({ v: 1, t: 'vendor', p: payload, s: sig });
}

/**
 * Client generates a signed QR code for driver acceptance or finalization.
 * The QR encodes orderId + clientCode + action + timestamp, signed with HMAC.
 * Driver scans this to prove physical proximity to the client.
 * action: 'accept' | 'finalize'
 */
export function generateClientQRToken(orderId, clientCode, action) {
  if (action !== 'accept' && action !== 'finalize') return null;
  const ts = Date.now();
  const payload = `${orderId}:${clientCode}:${action}:${ts}`;
  const sig = crypto
    .createHmac('sha256', QR_SECRET)
    .update(payload)
    .digest('hex')
    .substring(0, 16);
  return JSON.stringify({ v: 1, t: 'client', p: payload, s: sig });
}

/**
 * Verify a scanned QR token (vendor or client).
 * Returns { orderId, clientCode, action } if valid, null otherwise.
 * Only signed tokens are accepted — plain text codes are rejected.
 */
export function verifyQRToken(scannedText) {
  if (!scannedText) return null;

  try {
    const data = JSON.parse(scannedText);
    if (data.v === 1 && data.p && data.s) {
      const expectedSig = crypto
        .createHmac('sha256', QR_SECRET)
        .update(data.p)
        .digest('hex')
        .substring(0, 16);
      if (data.s !== expectedSig) return null;

      const parts = data.p.split(':');

      // Vendor token: orderId:clientCode:timestamp
      if (data.t === 'vendor' && parts.length === 3) {
        const [orderId, clientCode, ts] = parts;
        const age = Date.now() - parseInt(ts, 10);
        if (age > 86400000 || age < 0) return null;
        return { orderId: parseInt(orderId, 10), clientCode, action: 'collect', tokenType: 'vendor' };
      }

      // Client token: orderId:clientCode:action:timestamp
      if (data.t === 'client' && parts.length === 4) {
        const [orderId, clientCode, action, ts] = parts;
        if (action !== 'accept' && action !== 'finalize') return null;
        const age = Date.now() - parseInt(ts, 10);
        if (age > 3600000 || age < 0) return null; // 1h expiry for client QR
        return { orderId: parseInt(orderId, 10), clientCode, action, tokenType: 'client' };
      }
    }
  } catch {
    // Not JSON — reject
  }

  return null;
}

// Keep backward-compatible alias
export const verifyVendorQRToken = verifyQRToken;
