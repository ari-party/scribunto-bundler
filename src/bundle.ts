import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

import todec from '2dec';
import formatString from '@robertsspaceindustries/sub';
import * as prettier from 'prettier';

import dirname from './utils/dirname';
import { error, event, info, ready } from './utils/log';
import { name } from '../package.json';

import type { Config } from '.';

const bundlerDir = path.resolve(dirname, 'templates/bundler');
const bundlerManagerTemplate = fs.readFileSync(
  path.join(bundlerDir, 'manager.lua'),
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
  name: string;
  content: string;
}

function formatLua(code: string): Promise<string> {
  return prettier.format(code, {
    plugins: ['@prettier/plugin-lua'],
    parser: 'lua',
  });
}

function generateMain(modules: Module[]) {
  const formattedModules = [];
  for (const module of modules)
    formattedModules.push(
      formatString(
        bundlerModuleTemplate,
        {
          name: module.name,
          content: module.content,
        },
        {
          prefix: '--{{',
        },
      ),
    );

  return [
    bundlerManagerTemplate,
    formattedModules.join('\n'),
    bundlerReturnTemplate,
  ].join('\n');
}

export default async function bundleProject() {
  const startTime = performance.now();
  const workingDir = process.cwd();
  const configPath = path.join(workingDir, 'bundler.config.js');

  info(`Using ${configPath}`);

  if (!fs.existsSync(configPath))
    return error(`Missing ${name} configuration file`);

  const { default: config }: { default: Config } = await import(
    `${os.platform() === 'win32' ? 'file://' : ''}${configPath}`
  );

  const mainFilePath = path.resolve(workingDir, config.main);
  const modules: Module[] = [];

  modules.push({
    name: 'bundler_main',
    content: fs.readFileSync(mainFilePath, 'utf-8'),
  });
  event('Loaded main module');

  const mainDir = path.dirname(mainFilePath);
  for (const module of config.modules ?? []) {
    modules.push({
      name: module.name,
      content: fs.readFileSync(path.resolve(mainDir, module.path), 'utf-8'),
    });
    event(`Loaded module ${module.name}`);
  }

  const prefix = config.prefix ? `${config.prefix.trim()}\n` : '';
  const suffix = config.suffix ? `\n${config.suffix.trim()}` : '';
  const main = generateMain(modules);

  const outPath = path.relative(workingDir, config.out);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(
    outPath,
    await formatLua(prefix + main.trim() + suffix),
    'utf-8',
  );

  ready(
    `Bundled ${modules.length.toLocaleString()} module${modules.length === 1 ? '' : 's'} in ${todec((performance.now() - startTime) / 1_000, 3)}s`,
  );
}
