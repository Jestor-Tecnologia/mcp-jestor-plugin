import { copyFile, lstat, mkdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { packageFiles, projectRoot, validatePackage } from './validate.mjs';

export async function buildPackage(root = projectRoot) {
  await validatePackage(root);
  const dist = join(root, 'dist');
  await mkdir(dist, { recursive: true });
  if (!(await lstat(dist)).isDirectory()) throw new Error('dist must be a regular directory');
  const destination = join(dist, 'jestor');
  await rm(destination, { recursive: true, force: true });
  for (const file of packageFiles) {
    const target = join(destination, file);
    await mkdir(dirname(target), { recursive: true });
    await copyFile(join(root, file), target);
  }
  await validatePackage(destination);
  return destination;
}

if (import.meta.main) {
  try {
    const destination = await buildPackage();
    console.log(`Staged and validated ${packageFiles.length} plugin files in ${destination}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
