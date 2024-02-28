import fs from 'node:fs';
import path from 'node:path';

import { nanoid } from 'nanoid';

import type { Module } from '../bundle';

const requireRegex = /(?<!\w)require[("' ]+(.*?)[)"' ]+/g;
const customRequireRegex = (name: string) =>
  new RegExp(`(?<!\\w)require[("' ]+(${name})[)"' ]+`, 'g');

export default async function index(mainLuaFile: string): Promise<Module[]> {
  const modules: Module[] = [];

  async function recursive(
    filePath: string,
    isMain?: boolean,
    requiredBy?: { name: string; path: string },
  ) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    modules.push({
      content: fileContent,
      id: isMain ? 'bundler_main' : nanoid(),
      path: filePath,
      requiredBy: requiredBy ? [requiredBy] : [],
    });

    for (const match of [...fileContent.matchAll(requireRegex)]) {
      const namePath = match[1].split('.');

      let targetFile: string | undefined;

      const thisDirFile = path.resolve(
        path.dirname(filePath),
        ...namePath.slice(0, -1),
        `${namePath[namePath.length - 1]}.lua`,
      );

      if (fs.existsSync(thisDirFile)) targetFile = thisDirFile;

      const mainDirFile = path.resolve(
        path.dirname(mainLuaFile),
        ...namePath.slice(0, -1),
        `${namePath[namePath.length - 1]}.lua`,
      );

      if (fs.existsSync(mainDirFile)) targetFile = mainDirFile;

      if (targetFile) {
        const existing = modules.find((v) => v.path === targetFile);

        const requiredByObject = {
          name: match[1],
          path: filePath,
        };

        if (existing)
          modules[modules.indexOf(existing)].requiredBy.push(requiredByObject);
        else await recursive(targetFile, false, requiredByObject);
      }
    }

    for (const { id, requiredBy: moduleRequiredBy } of modules)
      for (const requiredByPart of moduleRequiredBy) {
        const moduleIndex = modules.findIndex(
          (v) => v.path === requiredByPart.path,
        );
        if (moduleIndex === -1) continue;

        modules[moduleIndex].content = modules[moduleIndex].content.replace(
          customRequireRegex(requiredByPart.name),
          `_bundler_load("${id}")`,
        );
      }
  }

  await recursive(mainLuaFile, true);

  return modules;
}
