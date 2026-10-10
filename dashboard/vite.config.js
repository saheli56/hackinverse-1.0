import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

function mockApiPlugin() {
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

  const mockState = {
    scenario: 'attack',
    targetName: 'demo-app',
    contract: {
      version: 1,
      generated: new Date().toISOString().split('T')[0],
      sandbox: { engine: 'runtime-hook (V8)', node: 'v22.0.0', os: 'linux' },
      packages: {
        'slug-lib': {
          runtime: {
            network: ['stats.slug-analytics.com:443'],
            fs_read: ['[CANARY_ZONE]/.aws/credentials']
          }
        }
      },
      approvals: []
    },
    diffResult: getScenarioData('attack')
  };

  return {
    name: 'mock-behaviorlock-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url.startsWith('/api')) return next();

        res.setHeader('Content-Type', 'application/json');

        if (req.url === '/api/data' && req.method === 'GET') {
          res.end(JSON.stringify(mockState));
          return;
        }

        if (req.url === '/api/check' && req.method === 'POST') {
          res.end(JSON.stringify(mockState));
          return;
        }

        if (req.url === '/api/scenario' && req.method === 'POST') {
          let body = '';
          req.on('data', (c) => { body += c; });
          req.on('end', () => {
            try {
              const { scenario } = JSON.parse(body || '{}');
              mockState.scenario = scenario;
              mockState.diffResult = getScenarioData(scenario);
              res.end(JSON.stringify(mockState));
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
              const remaining = mockState.diffResult.violations.filter((v) => v.id !== id);
              mockState.diffResult.violations = remaining;
              mockState.diffResult.passed = remaining.length === 0;
              mockState.diffResult.summary = {
                critical: remaining.filter((v) => v.severity === 'CRITICAL').length,
                high: remaining.filter((v) => v.severity === 'HIGH').length,
                medium: remaining.filter((v) => v.severity === 'MEDIUM').length,
                total: remaining.length
              };
              mockState.contract.approvals.push({
                id,
                reason,
                approved_by,
                approved_at: new Date().toISOString().split('T')[0]
              });
              res.end(JSON.stringify(mockState));
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
  plugins: [react(), viteSingleFile(), mockApiPlugin()],
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
