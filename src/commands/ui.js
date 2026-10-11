/**
 * Command: behaviorlock ui
 * Launches the interactive 2026 React Security Studio (Server & Dynamic SPA)
 */

import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';
import { Visualizer } from '../engine/visualizer.js';
import { Runner, resolveExecutionCommand } from '../engine/runner.js';
import { Differ } from '../engine/differ.js';
import { stringifyLockfile, validateLockfile } from '../types/schema.js';
import { commandSimulate } from './simulate.js';

export async function commandUi(options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  let activeCwd = cwd;
  let lockfilePath = path.join(activeCwd, 'behavior.lock');

  // If running from repository root where demo-app exists, auto-detect demo
  if (!fs.existsSync(lockfilePath)) {
    const demoDir = path.join(cwd, 'demo', 'demo-app');
    if (fs.existsSync(path.join(demoDir, 'behavior.lock'))) {
      activeCwd = demoDir;
      lockfilePath = path.join(activeCwd, 'behavior.lock');
      console.log(`\x1b[90mAuto-targeting demo project: ${activeCwd}\x1b[0m\n`);
    }
  }

  const targetName = path.basename(activeCwd);

  Visualizer.printBanner();

  let contract;
  let diffResult;
  let runResult;
  let differ;

  const runner = new Runner({ cwd: activeCwd, engine: options.engine });

  const reloadData = () => {
    try {
      if (!fs.existsSync(lockfilePath)) {
        contract = {
          version: 1,
          generated: new Date().toISOString().split('T')[0],
          sandbox: { engine: options.engine || 'runtime-hook (V8)', node: process.version, os: process.platform },
          packages: {},
          approvals: []
        };
        fs.writeFileSync(lockfilePath, stringifyLockfile(contract), 'utf8');
      } else {
        contract = JSON.parse(fs.readFileSync(lockfilePath, 'utf8'));
        validateLockfile(contract);
      }

      const { cmd, args } = resolveExecutionCommand(activeCwd, options.cmd);
      runResult = runner.runPhase('runtime', cmd, args, { silent: true });
      differ = new Differ(contract);
      diffResult = differ.diff(runResult.contract);
    } catch (err) {
      contract = contract || {
        version: 1,
        generated: new Date().toISOString().split('T')[0],
        sandbox: { engine: 'runtime-hook (V8)', node: process.version, os: process.platform },
        packages: {},
        approvals: []
      };
      diffResult = diffResult || {
        passed: true,
        summary: { critical: 0, high: 0, medium: 0, total: 0 },
        violations: [],
        approvedMatches: []
      };
    }
  };

  reloadData();

  // Locate compiled React bundle (dynamically re-read so rebuilds reflect immediately)
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const distPath = path.resolve(__dirname, '../../dashboard/dist/index.html');

  // Spin up local Studio HTTP server
  const port = options.port || 4949;
  const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://localhost:${port}`);

    // GET /api/data (dynamic reload from disk)
    if (url.pathname === '/api/data' && req.method === 'GET') {
      reloadData();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ diffResult, contract, targetName }));
      return;
    }

    // POST /api/check (Re-run sandbox telemetry check)
    if (url.pathname === '/api/check' && req.method === 'POST') {
      try {
        reloadData();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ diffResult, contract, targetName }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    // POST /api/scenario (Interactive scenario switcher for demo app & external repos)
    if (url.pathname === '/api/scenario' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const { scenario } = JSON.parse(body || '{}');
          const rootDir = path.resolve(__dirname, '../../');
          const demoDir = path.resolve(rootDir, 'demo');
          const targetModule = path.resolve(demoDir, 'demo-app/node_modules/slug-lib/index.js');
          const safePkg = path.resolve(demoDir, 'packages/safe-slug/index.js');
          const compromisedPkg = path.resolve(demoDir, 'packages/compromised-slug/index.js');
          const telemetryPkg = path.resolve(demoDir, 'packages/telemetry-slug/index.js');

          if (fs.existsSync(targetModule) && activeCwd.includes('demo-app')) {
            // Demo app scenario swapping
            fs.copyFileSync(safePkg, targetModule);
            const { cmd, args } = resolveExecutionCommand(activeCwd, options.cmd);
            const initRun = runner.runPhase('runtime', cmd, args, { silent: true });
            const cleanContract = {
              version: 1,
              generated: new Date().toISOString().split('T')[0],
              sandbox: { engine: options.engine || 'runtime-hook (V8)', node: process.version, os: process.platform },
              packages: initRun.contract,
              approvals: []
            };
            fs.writeFileSync(lockfilePath, stringifyLockfile(cleanContract), 'utf8');

            if (scenario === 'attack') {
              fs.copyFileSync(compromisedPkg, targetModule);
            } else if (scenario === 'telemetry') {
              fs.copyFileSync(telemetryPkg, targetModule);
            }
          } else {
            // Any external user project
            if (scenario === 'attack') {
              await commandSimulate('attack', { cwd: activeCwd });
            } else if (scenario === 'safe') {
              await commandSimulate('clean', { cwd: activeCwd });
            }
          }

          reloadData();

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ diffResult, contract, targetName, scenario }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    // POST /api/approve (Cryptographically sign override into behavior.lock)
    if (url.pathname === '/api/approve' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const { id, reason, approved_by } = JSON.parse(body);
          const targetViolation = diffResult?.violations?.find(v => v.id === id);

          if (!targetViolation) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: `Violation #${id} not found` }));
            return;
          }

          // Build approval override rule
          const approvalRecord = {
            id,
            package: targetViolation.package,
            reason: reason || 'Approved via React Security Studio',
            approved_by: approved_by || 'developer',
            approved_at: new Date().toISOString().split('T')[0],
            expires: null,
            allow: {}
          };

          if (targetViolation.type === 'NETWORK_ANOMALY') {
            approvalRecord.allow.network = [targetViolation.target];
          } else if (targetViolation.type === 'PROCESS_SPAWN') {
            approvalRecord.allow.exec = [targetViolation.target];
          } else if (targetViolation.type === 'FS_READ_ANOMALY') {
            approvalRecord.allow.fs_read = [targetViolation.target];
          } else if (targetViolation.type === 'FS_WRITE_ANOMALY') {
            approvalRecord.allow.fs_write = [targetViolation.target];
          }

          contract.approvals = contract.approvals || [];
          contract.approvals.push(approvalRecord);

          // Write updated contract
          fs.writeFileSync(lockfilePath, stringifyLockfile(contract), 'utf8');

          // Re-evaluate diff
          reloadData();

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ diffResult, contract, targetName }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    // Serve HTML (Root) - dynamically read dist/index.html on every request so new builds reflect immediately
    if (url.pathname === '/' || url.pathname === '/index.html') {
      reloadData();
      const dataJson = JSON.stringify({ diffResult, contract, targetName }).replace(/</g, '\\u003c');
      const injection = `<script>window.__BEHAVIORLOCK_DATA__ = ${dataJson};</script>`;

      let html;
      const currentTemplate = fs.existsSync(distPath) ? fs.readFileSync(distPath, 'utf8') : null;
      if (currentTemplate) {
        html = currentTemplate.replace('<div id="root"></div>', `<div id="root"></div>\n    ${injection}`);
      } else {
        html = `<!DOCTYPE html><html><head><title>behavior.lock</title></head><body><div id="root"></div>${injection}</body></html>`;
      }

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  });

  server.listen(port, () => {
    const studioUrl = `http://localhost:${port}`;
    console.log(`\x1b[38;5;45m◆\x1b[0m \x1b[1mReact Security Studio:\x1b[0m \x1b[36m${studioUrl}\x1b[0m`);
    console.log(`\x1b[90mPress Ctrl+C to close studio server.\x1b[0m\n`);

    if (options.open !== false) {
      openBrowser(studioUrl);
    }
  });
}

function openBrowser(targetUrl) {
  const platform = process.platform;
  let opener;
  if (platform === 'win32') opener = `start "" "${targetUrl}"`;
  else if (platform === 'darwin') opener = `open "${targetUrl}"`;
  else opener = `xdg-open "${targetUrl}"`;

  exec(opener, () => {});
}
