import { program } from 'commander';

import bundleProject from './bundle';
import createProject from './create';
import { name, description, version } from '../package.json';

program
  .name(name)
  .description(description)
  .version(version)
  .option('--create', `create a ${name} project`);

const options = program.parse().opts<{ create?: boolean }>();

if (options.create) createProject();
else bundleProject();

// eslint-disable-next-line import/prefer-default-export
export type { Config } from './config';
