// Static guard (dashboard Part E.3): fail if any non-read Composio slug string
// appears anywhere in src/. Read verbs: GET / LIST / SEARCH / FIND / RETRIEVE.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../src', import.meta.url));
const SLUG_RE = /['"`](OUTLOOK|ASANA|LINKEDIN)_([A-Z_]+)['"`]/g;
const READ_VERB = /^(GET|LIST|SEARCH|FIND|RETRIEVE)/;

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (['.ts', '.tsx', '.mjs', '.js'].includes(extname(p))) out.push(p);
  }
  return out;
}

let violations = [];
for (const file of walk(ROOT)) {
  // The test file intentionally references write slugs to assert they're rejected.
  if (file.endsWith('client.test.mjs')) continue;
  const text = readFileSync(file, 'utf8');
  let m;
  while ((m = SLUG_RE.exec(text))) {
    const verbAndRest = m[2];
    if (!READ_VERB.test(verbAndRest)) {
      violations.push(`${file}: ${m[1]}_${verbAndRest}`);
    }
  }
}

if (violations.length) {
  console.error('❌ Non-read Composio slug(s) found in src/:');
  for (const v of violations) console.error('   ' + v);
  process.exit(1);
}
console.log('✅ No write/mutating Composio slugs in src/.');
