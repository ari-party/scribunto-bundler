import fs from 'node:fs';
import path from 'node:path';

import { nanoid } from 'nanoid';

import { warn } from './log';

import type { Module } from '../bundle';

const requireRegex = /(?<!\w)require[("' ]+(.*?)[)"' ]+/g;
const escapeRegExp = (string: string) =>
  string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const customRequireRegex = (name: string) =>
  new RegExp(`(?<!\\w)require[("' ](${escapeRegExp(name)})[)"' ]+`, 'g');

export default async function index(mainLuaFile: string): Promise<Module[]> {
  const modules: Module[] = [];
  const mainDir = path.dirname(mainLuaFile);

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
      const requirePath = match[1];
      const namePath = requirePath.split('.').join('/').split('/');

      let targetFile: string | undefined;

      if (requirePath.startsWith('@self/')) {
        const selfPath = requirePath.substring('@self/'.length);
        const selfNamePath = selfPath.split('.').join('/').split('/');
        const potentialSelfFile = path.resolve(
          mainDir,
          ...selfNamePath.slice(0, -1),
          `${selfNamePath[selfNamePath.length - 1]}.lua`,
        );
        const potentialSelfFileLuau = `${potentialSelfFile}u`;
        const potentialSelfInit = path.resolve(mainDir, selfPath, 'init.luau');

        if (fs.existsSync(potentialSelfFile)) targetFile = potentialSelfFile;
        else if (fs.existsSync(potentialSelfFileLuau))
          targetFile = potentialSelfFileLuau;
        else if (fs.existsSync(potentialSelfInit))
          targetFile = potentialSelfInit;
      } else {
        // Existing relative path resolution
        const thisDirFile = path.resolve(
          path.dirname(filePath),
          ...namePath.slice(0, -1),
          `${namePath[namePath.length - 1]}.lua`,
        );
        if (fs.existsSync(thisDirFile)) targetFile = thisDirFile;
        else {
          const thisDirFileLuau = `${thisDirFile}u`;
          if (fs.existsSync(thisDirFileLuau)) targetFile = thisDirFileLuau;
        }

        const mainDirFile = path.resolve(
          mainDir,
          ...namePath.slice(0, -1),
          `${namePath[namePath.length - 1]}.lua`,
        );
        if (fs.existsSync(mainDirFile)) targetFile = mainDirFile;
        else {
          const mainDirFileLuau = `${mainDirFile}u`;
          if (fs.existsSync(mainDirFileLuau)) targetFile = mainDirFileLuau;
        }
      }

      if (targetFile) {
        const existing = modules.find((v) => v.path === targetFile);

        const requiredByObject = {
          name: requirePath,
          path: filePath,
        };

        if (existing)
          modules[modules.indexOf(existing)].requiredBy.push(requiredByObject);
        else await recursive(targetFile, false, requiredByObject);
      } else
        warn(
          `Could not resolve module: ${requirePath} required by ${filePath}`,
        );
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
