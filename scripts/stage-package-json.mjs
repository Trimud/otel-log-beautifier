// Takes a source extension package.json and writes a cleaned version to dest.
// Usage: node scripts/stage-package-json.mjs <src> <dest>
import fs from 'node:fs';

const [, , src, dest] = process.argv;
if (!src || !dest) {
  console.error('Usage: node stage-package-json.mjs <src> <dest>');
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(src, 'utf-8'));

// Strip workspace/dev metadata that isn't useful in the packaged vsix.
// The @otel-log-beautifier/core workspace dep is bundled into dist/extension.js
// by esbuild, so it doesn't need to ship as a dependency.
delete pkg.scripts;
delete pkg.devDependencies;
pkg.dependencies = { 'node-pty': pkg.dependencies['node-pty'] };

fs.writeFileSync(dest, JSON.stringify(pkg, null, 2));
