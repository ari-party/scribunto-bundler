import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

import todec from '2dec';
import formatString from '@robertsspaceindustries/sub';

import dirname from './utils/dirname';
import { error, info, ready } from './utils/log';
import index from './utils/lua';
import { name } from '../package.json';

import type { Config } from '.';

const bundlerDir = path.resolve(dirname, 'templates/bundler');
const bundlerResolverTemplate = fs.readFileSync(
  path.join(bundlerDir, 'resolver.lua'),
  'utf-8',
);
const bundlerModuleTemplate = fs.readFileSync(
  path.join(bundlerDir, 'module.lua'),
  'utf-8',
);
const bundlerReturnTemplate = fs.readFileSync(
  path.join(bundlerDir, 'return.lua'),
  'utf-8',
);

export interface Module {
  id: string;
  path: string;
  content: string;
  requiredBy: Array<{ name: string; path: string }>;
}

function generateMain(modules: Module[]) {
  const formattedModules = [];

  for (const module of modules)
    formattedModules.push(
      formatString(
        bundlerModuleTemplate,
        {
          id: module.id,
          content: module.content.replaceAll(/\$/g, '$$$$'),
        },
        {
          prefix: '--{{',
        },
      ),
    );

  return [
    bundlerResolverTemplate,
    formattedModules.join('\n'),
    bundlerReturnTemplate,
  ].join('\n');
}

export default async function bundleProject() {
  const startTime = performance.now();
  const workingDir = process.cwd();
  const configPath = path.join(workingDir, 'bundler.config.js');

  if (!fs.existsSync(configPath))
    return error(`Missing ${name} configuration file`);

  info(`Using config: ${configPath}`);

  const { default: config }: { default: Config } = await import(
    `${os.platform() === 'win32' ? 'file://' : ''}${configPath}`
  );

  const modules = await index(path.resolve(workingDir, config.main));

  const outPath = path.relative(workingDir, config.out);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  fs.writeFileSync(
    outPath,
    (config.prefix ? `${config.prefix.trim()}\n` : '') +
      generateMain(modules) +
      (config.suffix ? `\n${config.suffix.trim()}` : ''),
    'utf-8',
  );

  ready(
    `Bundled ${modules.length.toLocaleString()} module${modules.length === 1 ? '' : 's'} in ${todec((performance.now() - startTime) / 1_000, 3)}s`,
  );
}
