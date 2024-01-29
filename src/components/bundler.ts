import fs from 'node:fs';
import path from 'node:path';

import formatString from '@robertsspaceindustries/sub';

import dirname from '../utils/dirname';

import type { Module } from '../bundle';

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

export default function Bundler(modules: Module[]) {
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
