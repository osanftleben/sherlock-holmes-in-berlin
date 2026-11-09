// Syntaxprüfung aller Quelldateien (ohne Abhängigkeiten): node tools/check.js
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(import.meta.url), '..', '..');
const files = [];
(function walk(dir) {
  for (const n of readdirSync(dir)) {
    if (n === 'node_modules' || n.startsWith('.')) continue;
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p);
    else if (n.endsWith('.js')) files.push(p);
  }
})(root);

let bad = 0;
for (const f of files) {
  const r = spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' });
  if (r.status !== 0) {
    bad++;
    console.log(`\n✗ ${relative(root, f)}\n${(r.stderr || '').split('\n').slice(0, 6).join('\n')}`);
  }
}
console.log(bad ? `\n${bad} von ${files.length} Dateien fehlerhaft.` : `Alle ${files.length} Dateien syntaktisch in Ordnung.`);
process.exit(bad ? 1 : 0);
