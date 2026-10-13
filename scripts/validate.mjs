import { lstat, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';

export const projectRoot = fileURLToPath(new URL('../', import.meta.url));
export const packageFiles = [
  '.cursor-plugin/plugin.json',
  'mcp.json',
  'assets/jestor-icon.svg',
  'README.md',
  'docs/maintaining.md',
  'docs/smoke-tests.md',
];

const ajv = new Ajv2020({ allErrors: true, strict: true });
const validators = Object.fromEntries(await Promise.all(['plugin', 'mcp'].map(async (name) => {
  const schema = JSON.parse(await readFile(new URL(`../schemas/${name}.schema.json`, import.meta.url), 'utf8'));
  return [name, ajv.compile(schema)];
})));

export function validateDocuments(plugin, mcp) {
  for (const [name, document] of Object.entries({ plugin, mcp })) {
    const validate = validators[name];
    if (!validate(document)) {
      throw new Error(`${name}.json: ${ajv.errorsText(validate.errors, { separator: '; ' })}`);
    }
  }
}

export async function validatePackage(root = projectRoot) {
  const portableManifest = await lstat(join(root, 'plugin.json')).catch((error) => {
    if (error.code !== 'ENOENT') throw error;
  });
  if (portableManifest) throw new Error('Root plugin.json would conflict with this native Cursor package');
  for (const directory of ['.cursor-plugin', 'assets', 'docs']) {
    if (!(await lstat(join(root, directory))).isDirectory()) {
      throw new Error(`${directory} must be a regular directory`);
    }
  }
  for (const file of packageFiles) {
    const stat = await lstat(join(root, file));
    if (!stat.isFile() || stat.size === 0) throw new Error(`${file} must be a nonempty regular file`);
  }
  const [plugin, mcp] = await Promise.all(['.cursor-plugin/plugin.json', 'mcp.json'].map(async (file) =>
    JSON.parse(await readFile(join(root, file), 'utf8'))));
  validateDocuments(plugin, mcp);
  return { plugin, mcp };
}

if (import.meta.main) {
  try {
    await validatePackage();
    console.log('Validated native Cursor manifests against the local Jestor schemas; package checks passed (OAuth/IDE acceptance not tested).');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
