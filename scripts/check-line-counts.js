const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const MAX_LINES = 500;

// Directories and patterns to exclude from strict line count check
const excludedDirs = new Set(['node_modules', '.next', '.git', 'dist', 'build', '.gemini']);
const extensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.scss']);

// Config / generated files that are allowed exceptions if any
const exemptedFiles = new Set([
  'package-lock.json',
  'ARCHITECTURE_AUDIT.md',
  'REFACTORING_PLAN.md'
]);

const largeFiles = [];
let totalScanned = 0;

function scan(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      if (!excludedDirs.has(entry.name)) {
        scan(fullPath);
      }
    } else {
      const ext = path.extname(entry.name);
      if (extensions.has(ext) && !exemptedFiles.has(entry.name) && !exemptedFiles.has(relPath)) {
        totalScanned++;
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n').length;
        if (lines > MAX_LINES) {
          largeFiles.push({ path: relPath, lines });
        }
      }
    }
  }
}

scan(rootDir);
largeFiles.sort((a, b) => b.lines - a.lines);

console.log(`\n=== Line Count Validation Report (Limit: ${MAX_LINES} lines) ===`);
console.log(`Total source files scanned: ${totalScanned}`);

if (largeFiles.length === 0) {
  console.log(`\x1b[32m✔ SUCCESS: All ${totalScanned} source files are within the ${MAX_LINES}-line limit!\x1b[0m\n`);
  process.exit(0);
} else {
  console.log(`\x1b[31m✖ FAILURE: ${largeFiles.length} file(s) exceed ${MAX_LINES} lines:\x1b[0m`);
  largeFiles.forEach(f => {
    console.log(`  - ${f.lines} lines: ${f.path}`);
  });
  console.log('');
  process.exit(1);
}
