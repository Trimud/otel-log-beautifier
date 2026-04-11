import * as esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

await esbuild.build({
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outdir: 'dist',
  format: 'cjs',
  platform: 'node',
  target: 'node18',
  external: ['vscode', 'node-pty'],
  alias: {
    '@otel-log-beautifier/core': path.resolve(__dirname, '../core/src/index.ts'),
  },
  sourcemap: true,
  minify: false,
});
