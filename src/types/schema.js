/**
 * behavior.lock Data Schema and Serialization
 */

export const SCHEMA_VERSION = 1;

export function createEmptyLockfile(meta = {}) {
  return {
    version: SCHEMA_VERSION,
    generated: new Date().toISOString().split('T')[0],
    sandbox: {
      os: process.platform,
      engine: meta.engine || 'runtime-hook',
      node: process.version
    },
    packages: {},
    approvals: []
  };
}

/**
 * Deterministically sorts object keys for git-diff friendliness
 */
export function stringifyLockfile(data) {
  function sortKeys(obj) {
    if (Array.isArray(obj)) {
      return obj.map(sortKeys);
    }
    if (obj !== null && typeof obj === 'object') {
      const sorted = {};
      for (const key of Object.keys(obj).sort()) {
        sorted[key] = sortKeys(obj[key]);
      }
      return sorted;
    }
    return obj;
  }

  const sortedData = sortKeys(data);
  return JSON.stringify(sortedData, null, 2) + '\n';
}

export function validateLockfile(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid behavior.lock: root must be an object');
  }
  if (data.version !== SCHEMA_VERSION) {
    throw new Error(`Unsupported behavior.lock version: ${data.version}. Expected ${SCHEMA_VERSION}`);
  }
  if (!data.packages || typeof data.packages !== 'object') {
    throw new Error('Invalid behavior.lock: missing packages object');
  }
  return true;
}
