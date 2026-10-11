/**
 * behavior.lock Data Schema and Serialization
 * Multi-environment (Prod vs Non-Prod) and Parallel Instance Architecture
 */

export const SCHEMA_VERSION = 1;

export function normalizeEnv(env = 'prod') {
  const e = String(env || '').toLowerCase().trim();
  if (['prod', 'production', 'release'].includes(e)) return 'prod';
  if (['non-prod', 'nonprod', 'test', 'staging', 'dev', 'development', 'ci'].includes(e)) return 'non-prod';
  return e;
}

export function createEmptyLockfile(meta = {}) {
  return {
    version: SCHEMA_VERSION,
    generated: new Date().toISOString().split('T')[0],
    sandbox: {
      os: process.platform,
      engine: meta.engine || 'runtime-hook',
      node: process.version
    },
    profiles: {
      prod: { packages: {} },
      'non-prod': { packages: {} }
    },
    packages: {},
    approvals: []
  };
}

export function getPackagesForEnvironment(lockfile, rawEnv = 'prod') {
  if (!lockfile || typeof lockfile !== 'object') return {};
  const env = normalizeEnv(rawEnv);

  // 1. Direct profile match
  if (lockfile.profiles?.[env]?.packages) {
    return lockfile.profiles[env].packages;
  }

  // 2. Default to root packages if available
  if (lockfile.packages && Object.keys(lockfile.packages).length > 0) {
    return lockfile.packages;
  }

  // 3. Fallback to prod profile
  if (lockfile.profiles?.prod?.packages) {
    return lockfile.profiles.prod.packages;
  }

  return {};
}

export function setPackagesForEnvironment(lockfile, rawEnv = 'prod', packages = {}) {
  const env = normalizeEnv(rawEnv);
  lockfile.profiles = lockfile.profiles || {};
  lockfile.profiles[env] = lockfile.profiles[env] || {};
  lockfile.profiles[env].packages = packages;

  // Root packages mirrors prod for backward compatibility
  if (env === 'prod') {
    lockfile.packages = packages;
  }
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
  if (!data.packages && !data.profiles) {
    throw new Error('Invalid behavior.lock: missing packages or profiles object');
  }
  return true;
}
