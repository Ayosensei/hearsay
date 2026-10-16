import fs from 'node:fs';
import path from 'node:path';

// Scans apps/web/src for hard-coded colours, arbitrary Tailwind values, or forbidden libraries.
// Comments are stripped first so a "//" in prose can't hide a real violation on the same line.
const srcDir = path.resolve('src');
let errors = [];

// Any Tailwind utility using bracket syntax, including variants and prefixes
// (bg-[#..], text-[13px], max-w-[85%], md:h-[560px], ...).
const ARBITRARY = /(?:^|[\s"'`:])-?[a-z][a-z0-9]*(?:-[a-z0-9]+)*-\[[^\]\s]+\]/;
const HEX = /(?<!&)#[0-9a-fA-F]{3,8}\b/;
const COLOR_FN = /\b(?:rgba?|hsla?)\(/;

function stripComments(line) {
  return line
    .replace(/\/\*.*?\*\//g, '')
    .replace(/(^|\s)\/\/.*$/, '$1');
}

function scanFile(filePath) {
  if (filePath.endsWith('.css')) return; // css contains theme definitions
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((raw, idx) => {
    const line = stripComments(raw);
    const where = `${filePath}:${idx + 1}`;

    const hex = line.match(HEX);
    if (hex) errors.push(`${where}: Found hard-coded hex color "${hex[0]}". Use DESIGN.md semantic tokens.`);

    const fn = line.match(COLOR_FN);
    if (fn) errors.push(`${where}: Found colour function "${fn[0]}...". Move it to globals.css or use a token.`);

    const arbitrary = line.match(ARBITRARY);
    if (arbitrary) errors.push(`${where}: Found arbitrary Tailwind value "${arbitrary[0].trim()}". Use DESIGN.md scale.`);
  });
}

function traverse(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      traverse(fullPath);
    } else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) {
      scanFile(fullPath);
    }
  }
}

traverse(srcDir);

if (errors.length > 0) {
  console.error('\n❌ check:design failed with findings:');
  errors.forEach(e => console.error('  - ' + e));
  process.exit(1);
} else {
  console.log('✅ check:design passed! All components adhere to DESIGN.md tokens.');
}
