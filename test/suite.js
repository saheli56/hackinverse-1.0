/**
 * behavior.lock Automated Test Suite
 * Run with: npm test
 */

import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { CanaryEngine, CANARY_TOKENS } from '../src/canary/index.js';
import { Normalizer } from '../src/engine/normalizer.js';
import { Differ } from '../src/engine/differ.js';
import {
  createEmptyLockfile,
  stringifyLockfile,
  validateLockfile,
  normalizeEnv,
  getPackagesForEnvironment,
  setPackagesForEnvironment,
  SCHEMA_VERSION
} from '../src/types/schema.js';

let passedCount = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`  \x1b[31m✗\x1b[0m ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

console.log('\n\x1b[36m\x1b[1m=== behavior.lock Test Suite ===\x1b[0m\n');

// 1. Schema & Lockfile Serialization
test('Schema: createEmptyLockfile produces valid structure', () => {
  const lf = createEmptyLockfile({ engine: 'runtime-hook' });
  assert.strictEqual(lf.version, SCHEMA_VERSION);
  assert.strictEqual(typeof lf.generated, 'string');
  assert.strictEqual(lf.sandbox.engine, 'runtime-hook');
  assert.deepStrictEqual(lf.packages, {});
  assert.deepStrictEqual(lf.approvals, []);
  assert.strictEqual(validateLockfile(lf), true);
});

test('Schema: stringifyLockfile deterministically sorts keys', () => {
  const obj = { z: 1, a: { y: 2, b: 3 } };
  const str = stringifyLockfile(obj);
  const parsed = JSON.parse(str);
  const keys = Object.keys(parsed);
  assert.deepStrictEqual(keys, ['a', 'z']);
  assert.deepStrictEqual(Object.keys(parsed.a), ['b', 'y']);
});

// 2. Canary Engine
test('CanaryEngine: Plants honeypot files and cleans them up', () => {
  const canary = new CanaryEngine();
  const setup = canary.plant();
  assert.ok(fs.existsSync(setup.canaryDir));
  assert.ok(setup.plantedPaths.length >= 3);

  const leak = canary.detectCanaryLeak(`token=${CANARY_TOKENS.AWS_KEY}`);
  assert.ok(leak);
  assert.strictEqual(leak.matchedToken, 'AWS_KEY');

  const sensitive = canary.isSensitivePath(setup.plantedPaths[0].path);
  assert.ok(sensitive.isCanary);

  canary.cleanup();
  assert.ok(!fs.existsSync(canary.canaryDir));
});

// 3. Normalizer
test('Normalizer: Normalizes paths and aggregates events', () => {
  const norm = new Normalizer({ projectDir: '/app/repo', canaryDir: '/tmp/canary-123' });
  assert.strictEqual(norm.normalizePath('/app/repo/src/index.js'), '[PROJECT]/src/index.js');
  assert.strictEqual(norm.normalizePath('/tmp/canary-123/.aws/credentials'), '[CANARY_ZONE]/.aws/credentials');

  const events = [
    { package: 'slug-lib', phase: 'runtime', type: 'net_outbound', target: 'api.example.com:443' },
    { package: 'slug-lib', phase: 'runtime', type: 'fs_read', target: '/app/repo/config.json' }
  ];

  const contract = norm.normalizeEvents(events);
  assert.ok(contract['slug-lib']);
  assert.deepStrictEqual(contract['slug-lib'].runtime.network, ['api.example.com:443']);
  assert.deepStrictEqual(contract['slug-lib'].runtime.fs_read, ['[PROJECT]/config.json']);
  assert.strictEqual(contract['slug-lib'].secrets, 'none');
});

// 4. Differ & Risk Scoring
test('Differ: Passes on matching contract', () => {
  const baseline = {
    packages: {
      'slug-lib': {
        install: { network: [], fs_read: [], fs_write: [], exec: [] },
        runtime: { network: ['api.example.com:443'], fs_read: [], fs_write: [], exec: [] },
        secrets: 'none'
      }
    },
    approvals: []
  };

  const observed = {
    'slug-lib': {
      install: { network: [], fs_read: [], fs_write: [], exec: [] },
      runtime: { network: ['api.example.com:443'], fs_read: [], fs_write: [], exec: [] },
      secrets: 'none'
    }
  };

  const differ = new Differ(baseline);
  const res = differ.diff(observed);
  assert.strictEqual(res.passed, true);
  assert.strictEqual(res.violations.length, 0);
});

test('Differ: Catches unauthorized network anomaly', () => {
  const baseline = {
    packages: {
      'slug-lib': {
        install: { network: [], fs_read: [], fs_write: [], exec: [] },
        runtime: { network: [], fs_read: [], fs_write: [], exec: [] },
        secrets: 'none'
      }
    },
    approvals: []
  };

  const observed = {
    'slug-lib': {
      install: { network: [], fs_read: [], fs_write: [], exec: [] },
      runtime: { network: ['malicious-c2.com:443'], fs_read: [], fs_write: [], exec: [] },
      secrets: 'none'
    }
  };

  const differ = new Differ(baseline);
  const res = differ.diff(observed);
  assert.strictEqual(res.passed, false);
  assert.strictEqual(res.summary.high, 1);
  assert.strictEqual(res.violations[0].type, 'NETWORK_ANOMALY');
  assert.strictEqual(res.violations[0].target, 'malicious-c2.com:443');
});

test('Differ: Catches canary honeypot breaches with CRITICAL severity', () => {
  const baseline = { packages: {}, approvals: [] };
  const observed = {
    'malicious-pkg': {
      install: { network: [], fs_read: [], fs_write: [], exec: [] },
      runtime: { network: [], fs_read: [], fs_write: [], exec: [] },
      secrets: [
        { phase: 'runtime', type: 'fs_read', target: '~/.aws/credentials', detail: 'Canary token read' }
      ]
    }
  };

  const differ = new Differ(baseline);
  const res = differ.diff(observed);
  assert.strictEqual(res.passed, false);
  assert.strictEqual(res.summary.critical, 1);
  assert.strictEqual(res.violations[0].severity, 'CRITICAL');
});

test('Differ: Respects signed approvals', () => {
  const baseline = {
    packages: {
      'slug-lib': {
        install: { network: [], fs_read: [], fs_write: [], exec: [] },
        runtime: { network: [], fs_read: [], fs_write: [], exec: [] },
        secrets: 'none'
      }
    },
    approvals: [
      {
        id: '1234',
        package: 'slug-lib',
        allow: { network: ['stats.slug-analytics.com:443'] },
        reason: 'Vendor analytics verified',
        approved_by: 'lead-dev',
        approved_at: '2026-10-10'
      }
    ]
  };

  const observed = {
    'slug-lib': {
      install: { network: [], fs_read: [], fs_write: [], exec: [] },
      runtime: { network: ['stats.slug-analytics.com:443'], fs_read: [], fs_write: [], exec: [] },
      secrets: 'none'
    }
  };

  const differ = new Differ(baseline);
  const res = differ.diff(observed);
  assert.strictEqual(res.passed, true);
  assert.strictEqual(res.approvedMatches.length, 1);
});

// 5. Multi-Environment & Parallel Testing
test('Schema: normalizeEnv normalizes aliases correctly', () => {
  assert.strictEqual(normalizeEnv('prod'), 'prod');
  assert.strictEqual(normalizeEnv('production'), 'prod');
  assert.strictEqual(normalizeEnv('test'), 'non-prod');
  assert.strictEqual(normalizeEnv('non-prod'), 'non-prod');
  assert.strictEqual(normalizeEnv('dev'), 'non-prod');
  assert.strictEqual(normalizeEnv('staging'), 'non-prod');
});

test('Schema: Multi-environment profiles isolate prod and non-prod contracts', () => {
  const lf = createEmptyLockfile();
  const prodPkgs = { 'auth-pkg': { runtime: { network: ['api.prod.com:443'] } } };
  const nonProdPkgs = { 'auth-pkg': { runtime: { network: ['api.prod.com:443', 'localhost:8080'] } } };

  setPackagesForEnvironment(lf, 'prod', prodPkgs);
  setPackagesForEnvironment(lf, 'non-prod', nonProdPkgs);

  assert.deepStrictEqual(getPackagesForEnvironment(lf, 'prod'), prodPkgs);
  assert.deepStrictEqual(getPackagesForEnvironment(lf, 'non-prod'), nonProdPkgs);
  assert.deepStrictEqual(lf.packages, prodPkgs); // Root mirrors prod for backward compatibility
});

test('Differ: Environment isolation allows mock database in non-prod but blocks in prod', () => {
  const lockfile = {
    version: 1,
    generated: '2026-10-11',
    profiles: {
      prod: {
        packages: {
          'db-client': {
            runtime: { network: ['db.prod.internal:5432'], fs_read: [], fs_write: [], exec: [] }
          }
        }
      },
      'non-prod': {
        packages: {
          'db-client': {
            runtime: { network: ['db.prod.internal:5432', 'localhost:5432'], fs_read: [], fs_write: [], exec: [] }
          }
        }
      }
    },
    approvals: []
  };

  const observedTesting = {
    'db-client': {
      install: { network: [], fs_read: [], fs_write: [], exec: [] },
      runtime: { network: ['localhost:5432'], fs_read: [], fs_write: [], exec: [] },
      secrets: 'none'
    }
  };

  // 1. In non-prod profile, localhost:5432 is explicitly allowed in baseline
  const nonProdDiffer = new Differ(lockfile, 'non-prod');
  const nonProdResult = nonProdDiffer.diff(observedTesting);
  assert.strictEqual(nonProdResult.passed, true);
  assert.strictEqual(nonProdResult.violations.length, 0);

  // 2. In prod profile, localhost:5432 is strictly forbidden!
  const prodDiffer = new Differ(lockfile, 'prod');
  const prodResult = prodDiffer.diff(observedTesting);
  assert.strictEqual(prodResult.passed, false);
  assert.strictEqual(prodResult.violations.length, 1);
  assert.strictEqual(prodResult.violations[0].target, 'localhost:5432');
});

test('Differ: Scoped approval applies only to specified environment', () => {
  const lockfile = {
    version: 1,
    packages: {
      'test-runner': {
        runtime: { network: [], fs_read: [], fs_write: [], exec: [] }
      }
    },
    approvals: [
      {
        id: '9988',
        package: 'test-runner',
        allow: { network: ['mock-collector.local:9000'] },
        reason: 'Local test metrics collector',
        env: 'non-prod' // strictly scoped to non-prod
      }
    ]
  };

  const observed = {
    'test-runner': {
      install: { network: [], fs_read: [], fs_write: [], exec: [] },
      runtime: { network: ['mock-collector.local:9000'], fs_read: [], fs_write: [], exec: [] },
      secrets: 'none'
    }
  };

  // In non-prod, approval is valid
  const nonProdDiffer = new Differ(lockfile, 'non-prod');
  assert.strictEqual(nonProdDiffer.diff(observed).passed, true);

  // In prod, non-prod approval is rejected!
  const prodDiffer = new Differ(lockfile, 'prod');
  const prodRes = prodDiffer.diff(observed);
  assert.strictEqual(prodRes.passed, false);
  assert.strictEqual(prodRes.violations.length, 1);
});

test('Parallelism: Independent canary instances avoid cross-worker collisions', () => {
  const worker1Canary = new CanaryEngine(undefined, 'worker-1');
  const worker2Canary = new CanaryEngine(undefined, 'worker-2');

  const setup1 = worker1Canary.plant();
  const setup2 = worker2Canary.plant();

  // Distinct directories per instance
  assert.notStrictEqual(setup1.canaryDir, setup2.canaryDir);
  assert.ok(setup1.canaryDir.includes('worker-1'));
  assert.ok(setup2.canaryDir.includes('worker-2'));
  assert.ok(fs.existsSync(setup1.canaryDir));
  assert.ok(fs.existsSync(setup2.canaryDir));

  // Worker 1 cleanup should not delete Worker 2's active canaries
  worker1Canary.cleanup();
  assert.ok(!fs.existsSync(setup1.canaryDir));
  assert.ok(fs.existsSync(setup2.canaryDir));

  worker2Canary.cleanup();
  assert.ok(!fs.existsSync(setup2.canaryDir));
});

console.log(`\n\x1b[32m\x1b[1mSummary: ${passedCount} tests passed!\x1b[0m\n`);
