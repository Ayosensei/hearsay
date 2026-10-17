import fs from 'node:fs';

// DESIGN.md remains the source; components never duplicate palette literals.
const design = fs.readFileSync('DESIGN.md', 'utf8');
const palette = design.split('colors:\n')[1]?.split('typography:')[0] ?? '';
const declarations = [...palette.matchAll(/^  ([\w-]+): "(#[0-9A-Fa-f]+)"/gm)]
  .map(([, name, value]) => `  --color-${name}: ${value};`).join('\n');
if (!declarations) throw new Error('No DESIGN.md palette found');
const target = 'apps/web/src/app/globals.css';
const css = fs.readFileSync(target, 'utf8');
fs.writeFileSync(target, css.replace(/(@theme \{)[\s\S]*?(  --font-serif:)/,
  `$1\n${declarations}\n\n$2`));
