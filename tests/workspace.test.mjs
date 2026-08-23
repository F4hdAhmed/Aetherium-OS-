import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { WorkspaceService } from '../dist-electron/electron/services/workspace-service.js';

test('workspace service performs bounded text-file operations and search', async (context) => {
  const root = await fs.mkdtemp(path.join(tmpdir(), 'aetherium-workspace-'));
  const service = new WorkspaceService();
  context.after(async () => {
    service.dispose();
    await fs.rm(root, { recursive: true, force: true });
  });
  await fs.mkdir(path.join(root, 'src'));
  await fs.writeFile(path.join(root, 'src', 'hello.ts'), 'export const greeting = "hello";\n', 'utf8');

  const workspace = await service.open(root);
  assert.equal(workspace.tree[0].name, 'src');
  const file = await service.readFile(path.join('src', 'hello.ts'));
  assert.equal(file.language, 'typescript');
  assert.match(file.content, /greeting/);

  const matches = await service.search('hello');
  assert.equal(matches.length, 1);
  assert.equal(matches[0].line, 1);

  await service.create('src', 'new.ts', 'file');
  await service.writeFile(path.join('src', 'new.ts'), 'const value = 42;\n');
  await service.rename(path.join('src', 'new.ts'), 'renamed.ts');
  assert.equal((await service.readFile(path.join('src', 'renamed.ts'))).content, 'const value = 42;\n');

  await fs.writeFile(path.join(root, 'import-me.py'), 'print("imported")\n', 'utf8');
  const imported = await service.importFiles('src', [path.join(root, 'import-me.py')]);
  assert.deepEqual(imported.imported, [path.join('src', 'import-me.py')]);
  assert.equal((await service.readFile(path.join('src', 'import-me.py'))).language, 'python');

  await service.applyFileChanges([
    { path: 'src/generated/component.tsx', content: 'export function Generated() { return null; }\n' },
    { path: 'src/renamed.ts', content: 'export const value = 84;\n' },
  ]);
  assert.match((await service.readFile(path.join('src', 'generated', 'component.tsx'))).content, /Generated/);
  assert.match((await service.readFile(path.join('src', 'renamed.ts'))).content, /84/);
  await assert.rejects(() => service.applyFileChanges([{ path: '.git/config', content: 'unsafe' }]), /cannot write inside/i);
});

test('workspace service rejects paths outside the active root', async (context) => {
  const root = await fs.mkdtemp(path.join(tmpdir(), 'aetherium-security-'));
  const service = new WorkspaceService();
  context.after(async () => {
    service.dispose();
    await fs.rm(root, { recursive: true, force: true });
  });
  await service.open(root);
  await assert.rejects(() => service.readFile(path.join('..', 'outside.txt')), /outside the active workspace/i);
  assert.throws(() => service.resolveSafe(path.resolve(root, 'absolute.txt')), /absolute paths/i);
});
