// Main entry and legacy Lite URL checks; app logic is covered by test-lite-ui.mjs.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const main=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const legacy=fs.readFileSync(new URL('../lite.html',import.meta.url),'utf8');
assert.match(main, /Command Centre Lite/);
assert.ok(!main.includes('Original ↗'));
assert.match(legacy, /http-equiv="refresh" content="0; url=\.\//);
assert.match(legacy, /href="\.\/"/);
console.log('PASS: Lite is the main interface; legacy Lite link redirects to it.');
