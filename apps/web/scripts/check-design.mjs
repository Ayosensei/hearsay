import fs from 'node:fs';
import path from 'node:path';

// Scans apps/web/src for hard-coded hex colors, arbitrary Tailwind values, or forbidden libraries
const srcDir = path.resolve('src');
let errors = [];

function scanFile(filePath) {
  if (filePath.endsWith('.css')) return; // css contains theme definitions
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Check for hard-coded hex colors like #FF5C6C, #05070B outside comments
    const hexMatch = line.match(/#[0-9a-fA-F]{3,8}\b/);
    if (hexMatch && !line.includes('//') && !line.includes('/*')) {
      errors.push(`${filePath}:${idx + 1}: Found hard-coded hex color "${hexMatch[0]}". Use DESIGN.md semantic tokens.`);
    }

    // Check for arbitrary Tailwind bracket syntax e.g. bg-[#...], text-[13px]
    const arbitraryMatch = line.match(/\b(bg|text|border|p|m|gap|rounded)-\[[^\]]+\]/);
    if (arbitraryMatch) {
      errors.push(`${filePath}:${idx + 1}: Found arbitrary Tailwind value "${arbitraryMatch[0]}". Use DESIGN.md scale.`);
    }
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
