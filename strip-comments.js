const fs = require('fs');
const path = require('path');

function stripComments(content) {
  // Replace multi-line comments
  content = content.replace(/\/\*[\s\S]*?\*\//g, '');
  // Replace single-line comments, making sure we don't remove "http://" or "https://"
  content = content.replace(/(?<![A-Za-z0-9_-]+:)\/\/.*/g, '');
  return content;
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (!['node_modules', '.next', '.git'].includes(file)) {
        processDirectory(fullPath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.css')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const newContent = stripComments(content);
      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`Stripped comments from: ${fullPath}`);
      }
    }
  }
}

processDirectory(path.join(__dirname, 'src'));
processDirectory(path.join(__dirname, 'socket-server'));
console.log('Finished removing comments.');
