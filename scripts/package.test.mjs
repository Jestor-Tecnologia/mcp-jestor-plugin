import assert from 'node:assert/strict';
import { cp, mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { buildPackage } from './build.mjs';
import { packageFiles, projectRoot, validateDocuments, validatePackage } from './validate.mjs';

const original = await validatePackage();

test('source package passes, with matching manifest and tooling versions', async () => {
  validateDocuments(original.plugin, original.mcp);
  const tooling = JSON.parse(await readFile(join(projectRoot, 'package.json'), 'utf8'));
  assert.equal(original.plugin.version, tooling.version);
});

for (const [name, mutate] of [
  ['missing name', ({ plugin }) => { delete plugin.name; }],
  ['invalid plugin name', ({ plugin }) => { plugin.name = 'Invalid Name'; }],
  ['unsupported manifest property', ({ plugin }) => { plugin.extensions = { 'com.openai': {} }; }],
  ['invalid semantic version', ({ plugin }) => { plugin.version = 'latest'; }],
  ['wrong nested metadata type', ({ plugin }) => { plugin.author.name = 42; }],
  ['missing endpoint', ({ mcp }) => { delete mcp.mcpServers.jestor.url; }],
  ['different endpoint', ({ mcp }) => { mcp.mcpServers.jestor.url = 'https://example.com/mcp'; }],
  ['missing OAuth client', ({ mcp }) => { delete mcp.mcpServers.jestor.auth; }],
  ['wrong OAuth client', ({ mcp }) => { mcp.mcpServers.jestor.auth.CLIENT_ID = 'other'; }],
  ['client secret', ({ mcp }) => { mcp.mcpServers.jestor.auth.CLIENT_SECRET = 'fixture-only'; }],
  ['credential header', ({ mcp }) => { mcp.mcpServers.jestor.headers = { Authorization: 'fixture-only' }; }],
  ['operator scope', ({ mcp }) => { mcp.mcpServers.jestor.auth.scopes = ['jestor.operator']; }],
  ['extra server', ({ mcp }) => { mcp.mcpServers.extra = { command: 'node' }; }],
  ['local command on remote server', ({ mcp }) => { mcp.mcpServers.jestor.command = 'server'; }],
]) {
  test(`local Cursor contract rejects ${name}`, () => {
    const fixture = structuredClone(original);
    mutate(fixture);
    assert.throws(() => validateDocuments(fixture.plugin, fixture.mcp), /\.json:/);
  });
}

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'jestor-plugin-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const file of packageFiles) {
    await mkdir(dirname(join(root, file)), { recursive: true });
    await cp(join(projectRoot, file), join(root, file));
  }
  return root;
}

test('build stages only the allowlist, preserves bytes, and removes stale output', async (t) => {
  const root = await fixture(t);
  await writeFile(join(root, '.env'), 'TEST_FIXTURE=not-a-secret');
  const output = await buildPackage(root);
  await writeFile(join(output, 'stale.txt'), 'old build');
  assert.equal(await buildPackage(root), output);
  const files = (await readdir(output, { recursive: true, withFileTypes: true }))
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name).slice(output.length + 1).replaceAll('\\', '/'));
  assert.deepEqual(files.sort(), [...packageFiles].sort());
  for (const file of packageFiles) {
    assert.deepEqual(await readFile(join(output, file)), await readFile(join(root, file)));
  }
  await validatePackage(output);
});

test('build rejects invalid JSON before replacing an existing build', async (t) => {
  const root = await fixture(t);
  const output = await buildPackage(root);
  const previous = await readFile(join(output, 'mcp.json'));
  await writeFile(join(root, 'mcp.json'), '{broken');
  await assert.rejects(buildPackage(root), SyntaxError);
  assert.deepEqual(await readFile(join(output, 'mcp.json')), previous);
});

test('validation rejects missing and symlinked assets', async (t) => {
  const root = await fixture(t);
  const asset = join(root, 'assets/jestor-icon.svg');
  await rm(asset);
  await assert.rejects(validatePackage(root), { code: 'ENOENT' });
  await symlink(join(projectRoot, 'assets/jestor-icon.svg'), asset);
  await assert.rejects(validatePackage(root), /regular file/);
});

test('build refuses a symlinked output directory', async (t) => {
  const root = await fixture(t);
  const outside = await mkdtemp(join(tmpdir(), 'jestor-plugin-outside-'));
  t.after(() => rm(outside, { recursive: true, force: true }));
  await symlink(outside, join(root, 'dist'));
  await assert.rejects(buildPackage(root), /regular directory/);
  assert.deepEqual(await readdir(outside), []);
});

test('validation rejects an ambiguous portable manifest at the root', async (t) => {
  const root = await fixture(t);
  await writeFile(join(root, 'plugin.json'), '{}');
  await assert.rejects(validatePackage(root), /conflict/);
});
