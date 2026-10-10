#!/usr/bin/env node
import { runCLI } from '../src/cli.js';

runCLI(process.argv.slice(2)).catch((err) => {
  console.error('\x1b[31m[behaviorlock fatal error]\x1b[0m', err.message || err);
  if (process.env.DEBUG) {
    console.error(err.stack);
  }
  process.exit(1);
});
