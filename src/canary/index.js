import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

export const CANARY_TOKENS = {
  AWS_KEY: 'BL_CANARY_AWS_KEY_7739',
  AWS_SECRET: 'BL_CANARY_AWS_SECRET_8812',
  SSH_KEY: 'BL_CANARY_SSH_ED25519_9910',
  DB_SECRET: 'BL_CANARY_DATABASE_PW_4401',
  NPM_AUTH: 'BL_CANARY_NPM_TOKEN_2209'
};

export const SENSITIVE_PATTERNS = [
  /\.aws\/credentials/i,
  /\.aws\/config/i,
  /\.ssh\/id_/i,
  /\.ssh\/authorized_keys/i,
  /\.env(\.production|\.local)?$/i,
  /\.npmrc/i,
  /\.dockercfg|\.docker\/config\.json/i,
  /id_rsa|id_ed25519/i
];

export class CanaryEngine {
  constructor(canaryDir, instanceId) {
    const id = instanceId || Math.random().toString(36).substring(2, 9);
    this.instanceId = id;
    this.canaryDir = canaryDir || path.join(os.tmpdir(), `behaviorlock-canary-${id}`);
    this.plantedPaths = [];
  }

  plant() {
    fs.mkdirSync(this.canaryDir, { recursive: true });

    // 1. Fake AWS credentials
    const awsDir = path.join(this.canaryDir, '.aws');
    fs.mkdirSync(awsDir, { recursive: true });
    const awsCreds = path.join(awsDir, 'credentials');
    fs.writeFileSync(awsCreds, `[default]\naws_access_key_id = ${CANARY_TOKENS.AWS_KEY}\naws_secret_access_key = ${CANARY_TOKENS.AWS_SECRET}\n`, 'utf8');
    this.plantedPaths.push({ type: 'aws', path: awsCreds, relative: '~/.aws/credentials' });

    // 2. Fake SSH key
    const sshDir = path.join(this.canaryDir, '.ssh');
    fs.mkdirSync(sshDir, { recursive: true });
    const sshKey = path.join(sshDir, 'id_ed25519');
    fs.writeFileSync(sshKey, `-----BEGIN OPENSSH PRIVATE KEY-----\n${CANARY_TOKENS.SSH_KEY}\n-----END OPENSSH PRIVATE KEY-----\n`, 'utf8');
    this.plantedPaths.push({ type: 'ssh', path: sshKey, relative: '~/.ssh/id_ed25519' });

    // 3. Fake .env production secrets
    const envFile = path.join(this.canaryDir, '.env.production');
    fs.writeFileSync(envFile, `DATABASE_URL=postgres://admin:${CANARY_TOKENS.DB_SECRET}@internal-db.prod:5432/main\nNPM_TOKEN=${CANARY_TOKENS.NPM_AUTH}\n`, 'utf8');
    this.plantedPaths.push({ type: 'env', path: envFile, relative: '.env.production' });

    return {
      canaryDir: this.canaryDir,
      plantedPaths: this.plantedPaths,
      envOverrides: {
        AWS_SHARED_CREDENTIALS_FILE: awsCreds,
        BEHAVIORLOCK_CANARY_DIR: this.canaryDir,
        BEHAVIORLOCK_CANARY_SSH: sshKey,
        BEHAVIORLOCK_CANARY_ENV: envFile
      }
    };
  }

  cleanup() {
    try {
      if (fs.existsSync(this.canaryDir)) {
        fs.rmSync(this.canaryDir, { recursive: true, force: true });
      }
    } catch {
      // Ignore cleanup error in temp
    }
  }

  isSensitivePath(targetPath) {
    if (!targetPath || typeof targetPath !== 'string') return false;
    const normalized = targetPath.replace(/\\/g, '/');

    // Check if it hits our actual planted canaries
    for (const planted of this.plantedPaths) {
      if (path.resolve(targetPath) === path.resolve(planted.path)) {
        return { isCanary: true, type: planted.type, display: planted.relative };
      }
    }

    // Check if it matches known sensitive patterns
    for (const pattern of SENSITIVE_PATTERNS) {
      if (pattern.test(normalized)) {
        return { isCanary: true, type: 'sensitive_pattern', display: normalized };
      }
    }

    return false;
  }

  detectCanaryLeak(content) {
    if (!content || typeof content !== 'string') return null;
    for (const [key, token] of Object.entries(CANARY_TOKENS)) {
      if (content.includes(token)) {
        return { matchedToken: key, tokenValue: token };
      }
    }
    return null;
  }
}
