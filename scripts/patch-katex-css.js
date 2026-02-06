'use strict';

const fs = require('fs');
const path = require('path');

const targets = [
  path.join(__dirname, '..', 'node_modules', 'katex', 'dist', 'katex.min.css'),
  path.join(__dirname, '..', 'node_modules', 'katex', 'dist', 'katex.css')
];

const pattern = /\.katex\s*\*{[^}]*}/g;

targets.forEach((filePath) => {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const next = content.replace(pattern, '');

  if (next !== content) {
    fs.writeFileSync(filePath, next, 'utf8');
    console.log(`[patch-katex-css] Patched ${path.basename(filePath)}`);
  } else {
    console.log(`[patch-katex-css] No changes for ${path.basename(filePath)}`);
  }
});
