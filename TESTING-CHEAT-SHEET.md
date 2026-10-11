# behavior.lock · Testing Cheat Sheet

A concise command reference for live demonstration and judging evaluation.

---

## 1. Global Setup (Run Once)
Makes the `behaviorlock` command globally executable from any terminal or folder:
```bash
npm link
```

---

## 2. Automated Test Suite (13 Tests)
Runs full automated verification of schema, normalizer, honeypots, diff engine, environment profiles, and worker isolation:
```bash
npm test
```

---

## 3. Parallel Testing & Worker Isolation

### A. Run 3 Parallel Instances Concurrently
Spawns 3 sandboxed instances in parallel with isolated canary directories and trace files:
```bash
behaviorlock check --parallel 3 --env non-prod
```

### B. Assign Different Real Tasks to Different Workers
Runs distinct commands across workers simultaneously in parallel:
```bash
behaviorlock check --env non-prod --tasks "npm test, node app.js, node test.js"
```

### C. Run the Parallel Concurrency Benchmark Script
Measures concurrent execution across workers in sub-200ms:
```bash
npm run test:parallel
```

### D. Run Worker with Isolated CI Instance ID
```bash
behaviorlock check --instance ci-worker-1 --env non-prod
```

---

## 4. Multi-Environment Profiles (`prod` vs `non-prod`)

### Check Under Strict Production (Zero-Trust)
```bash
behaviorlock check --env prod
```

### Check Under Non-Production (Allows Test Fixtures & Local Mocks)
```bash
behaviorlock check --env non-prod
```

---

## 5. Testing Any Other Repository or Folder

### Option A: From Inside That Folder
```bash
cd "C:\path\to\your-other-repo"
behaviorlock init
behaviorlock check
```

### Option B: From Anywhere Using `--cwd`
```bash
# Initialize baseline contract
behaviorlock init --cwd "C:\path\to\your-other-repo"

# Verify execution against contract
behaviorlock check --cwd "C:\path\to\your-other-repo"

# Run parallel tests on that repository
behaviorlock check --cwd "C:\path\to\your-other-repo" --parallel 3 --env non-prod
```

---

## 6. Attack Simulation & Clean-Up (Test on Any Repo)

### Step 1: Inject Simulated Supply-Chain Attack
Generates test exploit accessing decoy honeypot, pinging remote host, and spawning child process:
```bash
behaviorlock simulate attack
```

### Step 2: Verify Interception (Blocks with Exit Code 1)
```bash
behaviorlock check
```

### Step 3: Clean Up Test Files (1 Command)
Restores working tree to a completely clean state:
```bash
behaviorlock simulate clean
```

---

## 7. Cryptographic Approvals & Audit Trail

### Approve a Legitimate Capability Drift
```bash
behaviorlock approve <violation-id> --reason "Vendor analytics verified by SecOps"
```

### Scope an Approval Strictly to Non-Production
```bash
behaviorlock approve <violation-id> --reason "Local WireMock mock permitted for test" --env non-prod
```

### Temporary Approval with Auto-Expiration Date
```bash
behaviorlock approve <violation-id> --reason "Temporary migration waiver" --expires 2027-01-01
```

---

## 8. Web Security Studio Dashboard

### Launch Interactive React Dashboard
```bash
behaviorlock ui
```

### Launch Web Dashboard for Another Repository
```bash
behaviorlock ui --cwd "C:\path\to\your-other-repo"
```
*(In the web dashboard, use the top navbar `ENV` button to toggle profiles, and the `Parallel CI` tab to trigger multi-worker runs.)*
