import { readFileSync } from 'fs';

const file = process.argv[2];
const graph = JSON.parse(readFileSync(file, 'utf8'));

const edges = [];
for (const [parent, deps] of Object.entries(graph)) {
  for (const dep of deps) {
    if (dep.startsWith('src/components')) {
      edges.push([parent, dep]);
    }
  }
}

const clean = (p) => p.replace(/^src\/components\//, '').replace(/\.[tj]sx?$/, '').replace(/[\\/]/g, '_');

let out = 'graph TD\n';
for (const [from, to] of edges) {
  out += `  ${clean(from)} --> ${clean(to)}\n`;
}

console.log(out);
