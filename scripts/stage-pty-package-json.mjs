// Strips build-time fields from node-pty's package.json for the staged vsix.
// We ship a prebuilt binary so node-addon-api, gyp config, and build scripts
// aren't needed at runtime.
// Usage: node scripts/stage-pty-package-json.mjs <src> <dest>
import fs from 'node:fs';

const [, , src, dest] = process.argv;
if (!src || !dest) {
  console.error('Usage: node stage-pty-package-json.mjs <src> <dest>');
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(src, 'utf-8'));

delete pkg.dependencies;
delete pkg.devDependencies;
delete pkg.scripts;
delete pkg.gypfile;

fs.writeFileSync(dest, JSON.stringify(pkg, null, 2));
