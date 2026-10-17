/** Load Puppeteer 25 from whatsapp-web.js's asynchronous initialization path. */
'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_CLIENT = path.join(__dirname, '..', 'node_modules', 'whatsapp-web.js', 'src', 'Client.js');
const FIND_IMPORT = "const puppeteer = require('puppeteer');";
const FIND_INITIALIZE = '    async initialize() {\n';
const REPLACE_INITIALIZE =
  '    async initialize() {\n' +
  "        const puppeteer = await import('puppeteer');\n";

function count(source, needle) {
  return source.split(needle).length - 1;
}

function applyPuppeteerEsmPatch(clientFile = DEFAULT_CLIENT) {
  if (!fs.existsSync(clientFile)) throw new Error(`Client.js not found at ${clientFile}`);
  let source = fs.readFileSync(clientFile, 'utf8');
  const importCount = count(source, FIND_IMPORT);
  const patchedCount = count(source, REPLACE_INITIALIZE);
  const initializeCount = count(source, FIND_INITIALIZE);
  if (importCount === 0 && patchedCount === 1) return { skipped: true };
  if (importCount !== 1 || initializeCount !== 1 || patchedCount !== 0) {
    throw new Error('unsupported whatsapp-web.js Client.js shape for Puppeteer ESM patch');
  }
  source = source.replace(`${FIND_IMPORT}\n`, '');
  source = source.replace(FIND_INITIALIZE, REPLACE_INITIALIZE);
  fs.writeFileSync(clientFile, source);
  return { skipped: false };
}

if (require.main === module) {
  try {
    const result = applyPuppeteerEsmPatch();
    console.log(`patch-wwebjs-puppeteer-esm: ${result.skipped ? 'already patched' : 'applied'}`);
  } catch (error) {
    if (process.argv.includes('--best-effort')) console.warn(`patch-wwebjs-puppeteer-esm: ${error.message}`);
    else {
      console.error(`patch-wwebjs-puppeteer-esm: ${error.message}`);
      process.exitCode = 1;
    }
  }
}

module.exports = { applyPuppeteerEsmPatch };
