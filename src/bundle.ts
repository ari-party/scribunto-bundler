import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import Bundler from './components/bundler';
import { error, event, info, ready } from './utils/log';
import { name } from '../package.json';

import type { Config } from '.';

export interface Module {
  name: string;
  content: string;
}

export default async function bundleProject() {
  const workingDir = process.cwd();
  const configPath = path.join(workingDir, `.${name}.js`);

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

  const outPath = path.resolve(workingDir, config.out);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  const prefix = config.prefix ? `${config.prefix.trim()}\n` : '';
  const suffix = config.suffix ? `\n${config.suffix.trim()}` : '';

  const main = Bundler(modules);

  fs.writeFileSync(outPath, prefix + main.trim() + suffix, 'utf-8');

  ready(`Bundled ${modules.length.toLocaleString()} modules`);
}
