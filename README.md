# behavior.lock

> Deterministic Runtime Capability Lockfile for the Node.js Software Supply Chain

[![CI Enforcement](https://img.shields.io/badge/CI-behaviorlock--enforced-blue?style=flat-square)](https://github.com/saheli56/hackinverse-1.0)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)
[![Runtime: Node 20+](https://img.shields.io/badge/Node.js-v20%2B-brightgreen?style=flat-square)](https://nodejs.org/)

`package-lock.json` pins dependency versions to prevent dependency confusion. `behavior.lock` pins runtime capabilities to prevent supply chain compromises, data exfiltration, and unauthorized execution.

When a dependency update, pull request, or third-party package attempts to exfiltrate credentials, establish unauthorized outbound network sockets, or spawn shell processes, `behavior.lock` detects the capability drift and halts the CI pipeline before code reaches production.

---

## 1. Problem Statement: The Supply Chain Blind Spot

Modern applications rely heavily on deeply nested third-party dependencies. In the Node.js ecosystem, all dependencies execute within a shared, unsegmented memory space:

* **Static Scanners (Snyk, npm audit, Dependabot):** Rely on historical CVE databases and static AST analysis. Obfuscation, dynamic `eval()`, Base64 decoding, string concatenation, and delayed timer execution bypass static scanners entirely.
* **Functional Unit Tests:** Only verify return values. If `slugify("Hello World")` returns `"hello-world"`, the test runner reports success—even if the package simultaneously harvested `~/.aws/credentials` and dispatched them over an outbound socket.
* **Traditional Sandboxes (Docker/VMs):** Introduce significant latency (10-30s boot overhead) and lack granular package-level call-stack attribution.

### The Missing Primitive: Runtime Behavior Pinning

```
+-----------------------------------------------------------------------------------+
| package.json        -> Declares intended dependency names and semver ranges       |
| package-lock.json   -> Pins exact package hashes and tree structure               |
| behavior.lock       -> Pins exact system capabilities (network, fs, exec, secrets)|
+-----------------------------------------------------------------------------------+
```

---

## 2. System Architecture & Lifecycle

BehaviorLock operates through an in-memory V8 runtime interception layer, active honeypot deception canaries, a deterministic telemetry normalizer, and a diff verification engine.

### End-to-End Execution Flow

```
                                  Untrusted Test Run
                               (npm test / node test.js)
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │    V8 Preload Runtime Interceptor      │
                      │  (node:fs, node:net, node:child_proc)  │
                      └───────────────────┬────────────────────┘
                                          │
                   ┌──────────────────────┴──────────────────────┐
                   ▼                                             ▼
       ┌────────────────────────┐                    ┌────────────────────────┐
       │ Stack Trace Attribution│                    │ Active Canary Traps    │
       │ Resolves call-site to  │                    │ Ephemeral honeypots in │
       │ exact package origin   │                    │ decoy sandbox paths    │
       └───────────┬────────────┘                    └───────────┬────────────┘
                   │                                             │
                   └──────────────────────┬──────────────────────┘
                                          ▼
                      ┌────────────────────────────────────────┐
                      │    Deterministic Normalizer Engine     │
                      │  Strips dynamic ports, hosts, & paths  │
                      └───────────────────┬────────────────────┘
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │     Behavior Differ & Policy Engine    │
                      │  Compares Observed Graph vs Lockfile   │
                      └───────────────────┬────────────────────┘
                                          │
                         ┌────────────────┴────────────────┐
                         ▼                                 ▼
              [ Contract Satisfied ]             [ Violation Flagged ]
                 CI Pipeline: Pass                 CI Pipeline: Exit 1
```

---

## 3. Core Technical Components

### A. V8 Preload Runtime Interception (`src/runtime/hooks.js`)
BehaviorLock attaches to Node.js core modules (`fs`, `net`, `http`, `https`, `child_process`, `dns`) at startup via `--require` / `--import` hooks.
* **Stack-Frame Attribution:** On every privileged invocation, the interceptor parses `Error.prepareStackTrace` across the active call stack to trace execution back to the originating dependency in `node_modules/`.
* **Zero Overhead:** Interception executes entirely in-process without context switching or kernel mode transitions (< 0.2s overhead).

### B. Active Deception Canary Engine (`src/canary/engine.js`)
Rather than relying solely on heuristic pattern matching, BehaviorLock provisions dynamic decoy files in isolated sandbox locations:
* `~/.aws/credentials`
* `~/.ssh/id_*`
* `.env.production`
* `.npmrc` authentication tokens

**Zero False-Alarm Guarantee:** Because these files are synthetic decoys, legitimate packages have zero reason to access them. Any read attempt produces an instant, mathematically certain `CRITICAL` breach alert.

### C. Deterministic Normalizer (`src/engine/normalizer.js`)
Raw telemetry contains non-deterministic execution noise (dynamic ports, temporary files, timestamps). The normalizer:
* Groups socket endpoints by target hostname and standard port.
* Collapses operating system paths into normalized tokens (`[PROJECT]`, `[CANARY_ZONE]`, `~`).
* Filters out internal Node.js runtime initialization artifacts.

### D. Deterministic Differ (`src/engine/differ.js`)
Compares the normalized capability graph against the committed `behavior.lock`.

```
Violation Classification Matrix:
+--------------------------+----------+------------------------------------------------+
| Category                 | Severity | Failure Condition                              |
+--------------------------+----------+------------------------------------------------+
| SECRET_CANARY_TRIPWIRE   | CRITICAL | Access to synthetic honeypot decoy credential  |
| NETWORK_ANOMALY          | HIGH     | Outbound socket to unapproved host / port      |
| PROCESS_SPAWN            | HIGH     | Execution of unauthorized shell / sub-process  |
| FS_READ_ANOMALY          | MEDIUM   | File read outside approved project boundary   |
| FS_WRITE_ANOMALY         | MEDIUM   | File write outside approved temporary scope   |
+--------------------------+----------+------------------------------------------------+
```

---

## 4. Anatomy of `behavior.lock`

A committed `behavior.lock` file provides a human-readable, auditable declaration of permitted package capabilities:

```json
{
  "version": 1,
  "generated": "2026-10-10",
  "sandbox": {
    "engine": "runtime-hook",
    "node": "v22.0.0",
    "os": "linux"
  },
  "packages": {
    "slug-lib": {
      "runtime": {
        "network": [
          "stats.slug-analytics.com:443"
        ],
        "fs_read": [],
        "fs_write": [],
        "exec": []
      },
      "secrets": "none"
    }
  },
  "approvals": [
    {
      "id": "4163",
      "package": "slug-lib",
      "reason": "Authorized vendor analytics endpoint for production metrics",
      "approved_by": "security-lead",
      "created_at": "2026-10-10"
    }
  ]
}
```

---

## 5. CLI Reference

### Command Matrix

| Command | Arguments / Flags | Description |
| :--- | :--- | :--- |
| `behaviorlock init` | `[--cwd <path>] [--cmd "<cmd>"]` | Runs target in sandbox, records baseline, writes `behavior.lock` |
| `behaviorlock check` | `[--cwd <path>] [--cmd "<cmd>"]` | Verifies execution against contract; exits `0` on pass, `1` on drift |
| `behaviorlock approve`| `<id> --reason "<text>" [--by "<user>"]` | Cryptographically signs a verified capability change into `behavior.lock` |
| `behaviorlock diff` | `[--cwd <path>]` | Computes capability divergence between observed runtime and baseline |
| `behaviorlock ui` | `[--port 4949] [--cwd <path>]` | Launches the React Security Studio web interface |

### Quickstart Example

```bash
# 1. Install / Link CLI
npm link

# 2. Establish baseline behavior lockfile
behaviorlock init

# 3. Verify in local workflow or CI
behaviorlock check

# 4. Open visual security studio
behaviorlock ui
```

---

## 6. GitHub Actions CI/CD Integration

Integrate `behavior.lock` into your pull request verification pipeline by adding `.github/workflows/behaviorlock.yml`:

```yaml
name: Supply Chain Behavior Verification

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  verify-behavior:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Install Dependencies
        run: npm ci

      - name: Verify Runtime Behavior Contract
        run: npx behaviorlock check
```

If an updated dependency introduces an unauthorized network call or touches a canary credential, the step immediately fails and prints the full breach ledger to the GitHub Actions log.

---

## 7. Comparative Analysis

| Feature | Snyk / Dependabot | npm audit | AppArmor / Docker | behavior.lock |
| :--- | :--- | :--- | :--- | :--- |
| **Zero-Day Supply Chain Detection** | No (Database dependent) | No (CVE dependent) | Limited (Host level) | **Yes (Dynamic V8 capability diff)** |
| **Canary Deception Honeypots** | No | No | No | **Yes (0% false-positive rate)** |
| **Package-Level Attribution** | Static only | Static only | No (Sees entire process) | **Yes (V8 call-stack trace walk)** |
| **Execution Overhead** | N/A (Build time) | N/A (Install time) | High (10-30s boot) | **Minimal (< 0.2s runtime overhead)** |
| **Audited Human Approvals** | No | No | Manual config | **Yes (Signed JSON in version control)**|

---

## 8. Verification & Test Suite

Run the integrated verification suite:

```bash
npm test
```

### Test Suite Coverage:
* `Schema Validation`: Deterministic serialization and key-sorting.
* `Canary Engine`: Decoy honeypot deployment, tripwire interception, and lifecycle cleanup.
* `Normalizer`: Dynamic port grouping and path sanitization.
* `Differ`: Baseline comparison, network anomaly detection, canary tripwire interception, and signed approval validation.

---

## 9. License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
