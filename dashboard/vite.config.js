import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function dynamicDiskApiPlugin() {
  const rootDir = path.resolve(__dirname, '..');
  const demoDir = path.resolve(rootDir, 'demo');
  const targetModule = path.resolve(demoDir, 'demo-app/node_modules/slug-lib/index.js');
  const lockfilePath = path.resolve(demoDir, 'demo-app/behavior.lock');
  const safePkg = path.resolve(demoDir, 'packages/safe-slug/index.js');
  const compromisedPkg = path.resolve(demoDir, 'packages/compromised-slug/index.js');
  const telemetryPkg = path.resolve(demoDir, 'packages/telemetry-slug/index.js');

  const getScenarioFromDisk = () => {
    let scenario = 'safe';
    let content = '';

    try {
      if (fs.existsSync(targetModule)) {
        content = fs.readFileSync(targetModule, 'utf8');
      }
    } catch {
      // ignore
    }

    if (content.includes('203.0.113.9')) {
      scenario = 'attack';
    } else if (content.includes('stats.slug-analytics.com')) {
      scenario = 'telemetry';
      // Check if approved in lockfile
      try {
        if (fs.existsSync(lockfilePath)) {
          const lock = JSON.parse(fs.readFileSync(lockfilePath, 'utf8'));
          const isApproved = lock.approvals?.some(a => 
            a.package === 'slug-lib' && a.allow?.network?.includes('stats.slug-analytics.com:443')
          );
          if (isApproved) {
            scenario = 'safe';
          }
        }
      } catch {
        // ignore
      }
    }

    return scenario;
  };

  const getScenarioData = (sc) => {
    if (sc === 'safe') {
      return {
        passed: true,
        summary: { critical: 0, high: 0, medium: 0, total: 0 },
        violations: [],
        approvedMatches: []
      };
    }
    if (sc === 'telemetry') {
      return {
        passed: false,
        summary: { critical: 0, high: 1, medium: 0, total: 1 },
        violations: [
          {
            id: '4163',
            type: 'NETWORK_ANOMALY',
            severity: 'HIGH',
            package: 'slug-lib',
            phase: 'runtime',
            target: 'stats.slug-analytics.com:443',
            message: 'New outbound connection to stats.slug-analytics.com:443 during runtime phase',
            remediation: 'Review network endpoint. Run behaviorlock approve 4163 if intended.'
          }
        ],
        approvedMatches: []
      };
    }
    // Zero-Day attack
    return {
      passed: false,
      summary: { critical: 1, high: 1, medium: 0, total: 2 },
      violations: [
        {
          id: '5826',
          type: 'SECRET_CANARY_TRIPWIRE',
          severity: 'CRITICAL',
          package: 'slug-lib',
          phase: 'runtime',
          target: '[CANARY_ZONE]/.aws/credentials',
          message: 'Decoy credential read intercepted: attempted read of canary file',
          remediation: 'Supply chain compromise suspected. Reject this package version.'
        },
        {
          id: '4163',
          type: 'NETWORK_ANOMALY',
          severity: 'HIGH',
          package: 'slug-lib',
          phase: 'runtime',
          target: 'stats.slug-analytics.com:443',
          message: 'New outbound connection to stats.slug-analytics.com:443 during runtime phase',
          remediation: 'Review network endpoint. Run behaviorlock approve 4163 if intended.'
        }
      ],
      approvedMatches: []
    };
  };

  const buildCurrentState = (forcedScenario) => {
    const sc = forcedScenario || getScenarioFromDisk();
    let contract = {
      version: 1,
      generated: new Date().toISOString().split('T')[0],
      sandbox: { engine: 'runtime-hook (V8)', node: process.version, os: process.platform },
      packages: {
        'slug-lib': {
          runtime: {
            network: sc === 'telemetry' ? ['stats.slug-analytics.com:443'] : [],
            fs_read: sc === 'attack' ? ['[CANARY_ZONE]/.aws/credentials'] : []
          }
        }
      },
      approvals: []
    };

    try {
      if (fs.existsSync(lockfilePath)) {
        const diskLock = JSON.parse(fs.readFileSync(lockfilePath, 'utf8'));
        if (diskLock.approvals) contract.approvals = diskLock.approvals;
      }
    } catch {
      // ignore
    }

    return {
      scenario: sc,
      targetName: 'demo-app',
      contract,
      diffResult: getScenarioData(sc)
    };
  };

  return {
    name: 'dynamic-disk-behaviorlock-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url.startsWith('/api')) return next();

        res.setHeader('Content-Type', 'application/json');

        if (req.url === '/api/data' && req.method === 'GET') {
          res.end(JSON.stringify(buildCurrentState()));
          return;
        }

        if (req.url === '/api/check' && req.method === 'POST') {
          res.end(JSON.stringify(buildCurrentState()));
          return;
        }

        if (req.url === '/api/scenario' && req.method === 'POST') {
          let body = '';
          req.on('data', (c) => { body += c; });
          req.on('end', () => {
            try {
              const { scenario } = JSON.parse(body || '{}');

              // Write to disk so CLI and other tools stay in sync
              if (fs.existsSync(targetModule)) {
                if (scenario === 'safe') {
                  fs.copyFileSync(safePkg, targetModule);
                } else if (scenario === 'attack') {
                  fs.copyFileSync(compromisedPkg, targetModule);
                } else if (scenario === 'telemetry') {
                  fs.copyFileSync(telemetryPkg, targetModule);
                }
              }

              res.end(JSON.stringify(buildCurrentState(scenario)));
            } catch {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
          });
          return;
        }

        if (req.url === '/api/approve' && req.method === 'POST') {
          let body = '';
          req.on('data', (c) => { body += c; });
          req.on('end', () => {
            try {
              const { id, reason, approved_by } = JSON.parse(body || '{}');
              const state = buildCurrentState();
              
              state.contract.approvals.push({
                id,
                package: 'slug-lib',
                allow: { network: ['stats.slug-analytics.com:443'] },
                reason: reason || 'Approved via Dev Studio',
                approved_by: approved_by || 'developer',
                approved_at: new Date().toISOString().split('T')[0]
              });

              // Write approval to disk lockfile
              if (fs.existsSync(lockfilePath)) {
                try {
                  const lock = JSON.parse(fs.readFileSync(lockfilePath, 'utf8'));
                  lock.approvals = lock.approvals || [];
                  lock.approvals.push(state.contract.approvals[state.contract.approvals.length - 1]);
                  fs.writeFileSync(lockfilePath, JSON.stringify(lock, null, 2) + '\n', 'utf8');
                } catch {
                  // ignore
                }
              }

              // Rebuild clean state with approval applied
              const updated = buildCurrentState('safe');
              updated.contract = state.contract;
              res.end(JSON.stringify(updated));
            } catch {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
          });
          return;
        }

        if (req.url === '/api/parallel' && req.method === 'POST') {
          let body = '';
          req.on('data', (c) => { body += c; });
          req.on('end', () => {
            try {
              const { count = 3, env = 'non-prod' } = JSON.parse(body || '{}');
              const workerCount = Math.max(1, Math.min(8, parseInt(count, 10) || 3));
              const workers = Array.from({ length: workerCount }, (_, i) => ({
                workerId: `ci-worker-${i + 1}`,
                code: 0,
                duration: 140 + Math.floor(Math.random() * 25),
                passed: true,
                env,
                canaryDir: `behaviorlock-canary-ci-worker-${i + 1}`,
                traceFile: `trace-ci-worker-${i + 1}.jsonl`
              }));
              const totalDuration = 165 + Math.floor(Math.random() * 20);
              res.end(JSON.stringify({
                allPassed: true,
                totalDuration,
                workerCount,
                env,
                workers
              }));
            } catch {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
          });
          return;
        }

        if (req.url === '/api/env' && req.method === 'POST') {
          let body = '';
          req.on('data', (c) => { body += c; });
          req.on('end', () => {
            try {
              const { env = 'prod' } = JSON.parse(body || '{}');
              const state = buildCurrentState();
              state.currentEnv = env;
              res.end(JSON.stringify(state));
            } catch {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), viteSingleFile(), dynamicDiskApiPlugin()],
  build: {
    target: 'esnext',
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 100000000,
    cssCodeSplit: false,
    outDir: 'dist'
  },
  server: {
    port: 5173
  }
});
