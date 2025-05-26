import fs from 'fs';

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error('Usage: node scripts/jsonToMermaid.mjs <input> <output>');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(input, 'utf8'));
const lines = ['graph TD'];
for (const [from, deps] of Object.entries(data)) {
  for (const to of deps) {
    // Only include edges within src/components for clarity
    if (to.startsWith('src/components')) {
      lines.push(`  "${from}" --> "${to}"`);
    }
  }
}
fs.writeFileSync(output, lines.join('\n'));
