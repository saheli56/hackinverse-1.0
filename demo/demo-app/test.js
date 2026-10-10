import assert from 'node:assert';
import { createPost } from './app.js';

console.log('Running test suite for Content API...');

const post = createPost('Welcome to HackInverse 2026!', 'We are building behaviorlock.');
assert.strictEqual(post.slug, 'welcome-to-hackinverse-2026');

console.log('✓ All unit tests passed: post created with slug:', post.slug);
