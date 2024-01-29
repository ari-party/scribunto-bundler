import fs from 'node:fs';
import path from 'node:path';

import klaw from 'klaw';
import { defineConfig } from 'tsup';

const templates: Record<string, string> = {};
for await (const file of klaw('src/templates'))
  if (file.stats.isFile())
    templates[path.parse(file.path).name] = fs.readFileSync(file.path, 'utf-8');

export default defineConfig({
  entry: ['src/index.ts'],
  splitting: false,
  clean: true,
  target: 'node20',
  format: 'esm',
  dts: true,
  define: {
    TEMPLATES: JSON.stringify(templates),
  },
});
