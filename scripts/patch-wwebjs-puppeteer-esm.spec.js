'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { applyPuppeteerEsmPatch } = require('./patch-wwebjs-puppeteer-esm');

test('moves Puppeteer loading into asynchronous initialization exactly once', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wwebjs-puppeteer-'));
  const file = path.join(dir, 'Client.js');
  fs.writeFileSync(file, "const puppeteer = require('puppeteer');\nclass Client {\n    async initialize() {\n        return puppeteer.launch();\n    }\n}\n");
  assert.deepEqual(applyPuppeteerEsmPatch(file), { skipped: false });
  const patched = fs.readFileSync(file, 'utf8');
  assert.doesNotMatch(patched, /require\('puppeteer'\)/);
  assert.match(patched, /async initialize\(\) \{\n        const puppeteer = await import\('puppeteer'\);/);
  assert.deepEqual(applyPuppeteerEsmPatch(file), { skipped: true });
  assert.equal(fs.readFileSync(file, 'utf8'), patched);
});

test('rejects an unknown upstream Client shape', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wwebjs-puppeteer-'));
  const file = path.join(dir, 'Client.js');
  fs.writeFileSync(file, 'class Client {}\n');
  assert.throws(() => applyPuppeteerEsmPatch(file), /unsupported/);
});
