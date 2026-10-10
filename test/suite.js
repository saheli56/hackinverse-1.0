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
import { createEmptyLockfile, stringifyLockfile, validateLockfile, SCHEMA_VERSION } from '../src/types/schema.js';

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

console.log(`\n\x1b[32m\x1b[1mSummary: ${passedCount} tests passed!\x1b[0m\n`);
