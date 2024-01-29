import formatString from '@robertsspaceindustries/sub';

import type { Module } from '../bundle';

const bundlerManagerTemplate = TEMPLATES.bundler;
const bundlerModuleTemplate = TEMPLATES.bundlerModule;
const bundlerReturnTemplate = TEMPLATES.bundlerReturn;

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
