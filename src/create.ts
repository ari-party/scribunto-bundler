import childProcess from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import formatString from '@robertsspaceindustries/sub';

import { event, ready, wait, warn } from './utils/log';
import { name, version } from '../package.json';

const files = {
  [`.${name}.js`]: TEMPLATES.config,
  'package.json': formatString(TEMPLATES.package, {
    name,
    version,
  }),
  '.gitignore': TEMPLATES['.gitignore'],
  'src/main.lua': '',
};

export default function createProject() {
  const workingDir = process.cwd();

  for (const file of Object.keys(files)) {
    const target = path.join(workingDir, file);
    if (!fs.existsSync(target)) {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, files[file], 'utf-8');
      event(`Created file ${file}`);
    } else warn(`File ${file} already exists`);
  }

  wait('Installing packages...');
  childProcess.execSync(`npm install`, {
    cwd: workingDir,
  });

  ready(`Base ${name} project created`);
}
