// Reports the twoslash popups of a built docs page: `pnpm build && pnpm hover-report [slug]`
import { readFileSync, statSync } from 'node:fs';

const slug = process.argv[2] ?? 'fields';
const base = `.next/server/app/docs/${slug}`;

// RSC rows are `<id>:<json>\n`, or `<id>:T<hex byte length>,<text>` without a terminator.
function parseRows(buf) {
  const rows = new Map();
  let pos = 0;
  while (pos < buf.length) {
    const colon = buf.indexOf(':', pos);
    if (colon === -1) break;
    const id = buf.toString('utf8', pos, colon);
    if (buf[colon + 1] === 0x54) {
      const comma = buf.indexOf(',', colon);
      const end = comma + 1 + Number.parseInt(buf.toString('utf8', colon + 2, comma), 16);
      rows.set(id, buf.toString('utf8', comma + 1, end));
      pos = end;
      continue;
    }
    const newline = buf.indexOf('\n', colon);
    const end = newline === -1 ? buf.length : newline;
    try {
      rows.set(id, JSON.parse(buf.toString('utf8', colon + 1, end)));
    } catch {}
    pos = end + 1;
  }
  return rows;
}

const rows = parseRows(readFileSync(`${base}.rsc`));

function text(node) {
  const ref = typeof node === 'string' && /^\$L?([0-9a-f]+)$/.exec(node);
  if (ref && rows.has(ref[1])) return text(rows.get(ref[1]));
  if (typeof node === 'string') return node;
  if (!Array.isArray(node)) return '';
  if (node[0] === '$') return node[3]?.className?.includes('twoslash-popup-docs') ? '' : text(node[3]?.children);
  return node.map(text).join('');
}

function collect(node, found) {
  if (node === null || typeof node !== 'object') return;
  // fumadocs-twoslash renders the type of a hover inside its popup content (`nd-copy-ignore`)
  if (Array.isArray(node) && node[0] === '$' && node[3]?.className === 'nd-copy-ignore') {
    found.push(text(node[3].children));
    return;
  }
  for (const child of Object.values(node)) collect(child, found);
}

const popups = [];
for (const row of rows.values()) collect(row, popups);

const kb = (file) => `${(statSync(file).size / 1024).toFixed(0)} KB`;
console.log(`page /docs/${slug}: html ${kb(`${base}.html`)}, rsc ${kb(`${base}.rsc`)}`);
console.log(`popups: ${popups.length}, text length: ${popups.map((t) => t.length).join(', ')}`);
const longest = popups.reduce((a, b) => (b.length > a.length ? b : a), '');
console.log(`\nlongest popup (${longest.length} chars):\n${longest}`);
