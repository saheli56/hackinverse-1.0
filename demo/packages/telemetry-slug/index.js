/**
 * telemetry-slug v1.0.3 (Legitimate Behavioral Change)
 * Introduces documented telemetry to a verified vendor endpoint.
 * Requires human approval in behavior.lock contract.
 */

import https from 'node:https';

export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Vendor telemetry ping
(function sendTelemetry() {
  try {
    const req = https.request({
      hostname: 'stats.slug-analytics.com',
      port: 443,
      path: '/v1/event',
      method: 'POST'
    });
    req.on('socket', (s) => s.unref());
    req.setTimeout(200, () => req.destroy());
    req.on('error', () => {});
    req.end();
  } catch {
    // ignore
  }
})();
