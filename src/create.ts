import childProcess from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import klaw from 'klaw';

import dirname from './utils/dirname';
import { error, info, ready, wait } from './utils/log';
import { name } from '../package.json';

const templateDir = path.resolve(dirname, 'templates/create');

export default async function createProject() {
  const workingDir = process.cwd();

  let filesCopied = 0;
  for await (const file of klaw(templateDir))
    if (file.stats.isFile()) {
      const relative = path.relative(templateDir, file.path);
      const targetPath = path.relative(workingDir, relative);

      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.copyFileSync(file.path, targetPath);
      filesCopied += 1;
    }
  info(`Copied ${filesCopied} file${filesCopied === 1 ? '' : 's'}`);

  wait('Installing packages...');
  try {
    childProcess.execSync(`npm install`, {
      cwd: workingDir,
    });
  } catch (err) {
    error(err);
    process.exit(1);
  }

  ready(`Base ${name} project created`);
}
