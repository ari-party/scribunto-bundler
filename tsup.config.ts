import { defineConfig } from 'tsup';

export default defineConfig({
  outDir: 'dist',
  entry: ['src/index.ts'],
  clean: true,
  sourcemap: false,
  splitting: false,
  target: 'node20',
  format: 'esm',
  dts: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
});
