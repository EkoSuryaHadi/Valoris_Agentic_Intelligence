import { readFile, readdir } from 'node:fs/promises';

const files = [];
for (const directory of ['apps/web', 'packages/api/src', 'packages/db/src']) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isFile() && (entry.name.endsWith('.js') || entry.name === 'index.html')) files.push(`${directory}/${entry.name}`);
  }
}
const banned = [/\.innerHTML\s*=/, /\.outerHTML\s*=/, /insertAdjacentHTML\s*\(/, /document\.write\s*\(/, /\beval\s*\(/, /new\s+Function\s*\(/, /localStorage\./, /sessionStorage\./];
const findings = [];
for (const file of files) {
  const content = await readFile(file, 'utf8');
  for (const pattern of banned) if (pattern.test(content)) findings.push(`${file}: banned pattern ${pattern}`);
}
if (findings.length) {
  console.error(findings.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Security static scan passed: ${files.length} runtime files checked.`);
}
