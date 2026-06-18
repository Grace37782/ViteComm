import crypto from 'crypto';

const QR_SECRET = process.env.VENDOR_QR_SECRET || 'vitecomm-vendor-qr-mvp-secret-key';

/**
 * Vendor generates a signed QR code based on the client's verification code (RG06).
 * Like JWT: the vendor takes the client's code, adds their order context, and signs it.
 * The driver scans this with real-time camera to prove physical presence at vendor.
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
 * Verify a scanned vendor QR token.
 * Returns { orderId, clientCode } if valid, null otherwise.
 * Only signed tokens are accepted — plain text codes are rejected.
 */
export function verifyVendorQRToken(scannedText) {
  if (!scannedText) return null;

  try {
    const data = JSON.parse(scannedText);
    if (data.v === 1 && data.t === 'vendor' && data.p && data.s) {
      const expectedSig = crypto
        .createHmac('sha256', QR_SECRET)
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
    // Not JSON — reject
  }

  return null;
}

/**
 * Generate a finalize QR token for the client to show at delivery.
 * This QR is signed with the vendor's scanned QR token + client's code,
 * creating a three-level chain: client code → vendor QR → finalize QR.
 * The driver must have scanned the vendor QR to complete this chain.
 */
export function generateFinalizeQRToken(orderId, clientCode, vendorQRToken) {
  if (!vendorQRToken) return null;
  // Hash the vendor QR token to keep the QR size manageable
  const vendorHash = crypto.createHash('sha256').update(vendorQRToken).digest('hex').substring(0, 16);
  const ts = Date.now();
  const payload = `${orderId}:${clientCode}:${vendorHash}:${ts}`;
  const sig = crypto
    .createHmac('sha256', QR_SECRET)
    .update(payload)
    .digest('hex')
    .substring(0, 16);
  return JSON.stringify({ v: 1, t: 'finalize', p: payload, s: sig });
}

/**
 * Verify a scanned finalize QR token against the stored vendor QR token.
 * Returns { orderId, clientCode } if valid, null otherwise.
 */
export function verifyFinalizeQRToken(scannedText, storedVendorQRToken) {
  if (!scannedText || !storedVendorQRToken) return null;

  try {
    const data = JSON.parse(scannedText);
    if (data.v === 1 && data.t === 'finalize' && data.p && data.s) {
      // Recompute expected signature using the stored vendor QR token
      const vendorHash = crypto.createHash('sha256').update(storedVendorQRToken).digest('hex').substring(0, 16);
      const expectedPayload = data.p; // orderId:clientCode:vendorHash:timestamp
      const expectedSig = crypto
        .createHmac('sha256', QR_SECRET)
        .update(expectedPayload)
        .digest('hex')
        .substring(0, 16);
      if (data.s !== expectedSig) return null;

      const parts = data.p.split(':');
      if (parts.length !== 4) return null;

      const [orderId, clientCode, scannedVendorHash, ts] = parts;

      // Verify the vendor hash matches the stored vendor QR token
      if (scannedVendorHash !== vendorHash) return null;

      const age = Date.now() - parseInt(ts, 10);
      if (age > 3600000 || age < 0) return null; // 1h expiry

      return { orderId: parseInt(orderId, 10), clientCode };
    }
  } catch {
    // Not JSON — reject
  }

  return null;
}
