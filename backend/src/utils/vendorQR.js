import crypto from 'crypto';

const VENDOR_QR_SECRET = process.env.VENDOR_QR_SECRET || 'vitecomm-vendor-qr-mvp-secret-key';

/**
 * Vendor generates a signed QR code based on the client's verification code (RG06).
 * Like JWT: the vendor takes the client's code, adds their order context, and signs it.
 * The system can later verify this signed token to prove the driver met the vendor.
 */
export function generateVendorQRToken(orderId, clientCode) {
  const ts = Date.now();
  const payload = `${orderId}:${clientCode}:${ts}`;
  const sig = crypto
    .createHmac('sha256', VENDOR_QR_SECRET)
    .update(payload)
    .digest('hex')
    .substring(0, 16);
  return JSON.stringify({ v: 1, p: payload, s: sig });
}

/**
 * Verify a scanned vendor QR token.
 * Returns { orderId, clientCode } if valid, null otherwise.
 * Also accepts plain text codes as fallback (manual entry).
 */
export function verifyVendorQRToken(scannedText) {
  if (!scannedText) return null;

  // Try JSON signed token first
  try {
    const data = JSON.parse(scannedText);
    if (data.v === 1 && data.p && data.s) {
      const expectedSig = crypto
        .createHmac('sha256', VENDOR_QR_SECRET)
        .update(data.p)
        .digest('hex')
        .substring(0, 16);
      if (data.s !== expectedSig) return null;

      const parts = data.p.split(':');
      if (parts.length !== 3) return null;

      const [orderId, clientCode, ts] = parts;
      const age = Date.now() - parseInt(ts, 10);
      if (age > 86400000 || age < 0) return null; // 24h expiry

      return { orderId: parseInt(orderId, 10), clientCode };
    }
  } catch {
    // Not JSON — fall through
  }

  // Fallback: plain text code (manual entry or raw code scan)
  return { orderId: null, clientCode: scannedText.trim() };
}
