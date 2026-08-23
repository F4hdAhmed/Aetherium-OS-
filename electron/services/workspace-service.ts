import { promises as fs, watch, type FSWatcher } from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type {
  AIFileChange,
  FileContent,
  FileTreeNode,
  GitSummary,
  ImportedFilesResult,
  SearchMatch,
  WorkspaceInfo,
} from '../../src/types/contracts.js';

const execFileAsync = promisify(execFile);
const ignored = new Set(['.git', 'node_modules', 'dist', 'dist-electron', 'release', 'build', 'coverage', '.aetherium-qa', '.codex-local-tools']);
const languageByExtension: Record<string, string> = {
  '.js': 'javascript', '.jsx': 'javascript', '.mjs': 'javascript', '.cjs': 'javascript',
  '.ts': 'typescript', '.tsx': 'typescript', '.json': 'json', '.css': 'css', '.scss': 'scss',
  '.html': 'html', '.md': 'markdown', '.py': 'python', '.java': 'java', '.cs': 'csharp',
  '.cpp': 'cpp', '.c': 'c', '.h': 'cpp', '.rs': 'rust', '.go': 'go', '.php': 'php',
  '.rb': 'ruby', '.xml': 'xml', '.yaml': 'yaml', '.yml': 'yaml', '.sql': 'sql',
  '.sh': 'shell', '.ps1': 'powershell', '.bat': 'bat', '.vue': 'vue', '.svelte': 'svelte',
};

export class WorkspaceService {
  private root: string | null = null;
  private watcher: FSWatcher | null = null;
  private changeTimer: NodeJS.Timeout | null = null;
  private onChange: (() => void) | null = null;

  get activeRoot() {
    return this.root;
  }

  setChangeListener(listener: () => void) {
    this.onChange = listener;
  }

  async open(folderPath: string): Promise<WorkspaceInfo> {
    const resolved = path.resolve(folderPath);
    const details = await fs.stat(resolved);
    if (!details.isDirectory()) throw new Error('The selected workspace is not a folder.');
    this.root = resolved;
    this.startWatcher();
    return { name: path.basename(resolved), path: resolved, tree: await this.readTree() };
  }

  async readTree(): Promise<FileTreeNode[]> {
    const root = this.requireRoot();
    let count = 0;
    const visit = async (directory: string, depth: number): Promise<FileTreeNode[]> => {
      if (depth > 8 || count > 4000) return [];
      const entries = (await fs.readdir(directory, { withFileTypes: true }))
        .filter((entry) => !ignored.has(entry.name))
        .sort((a, b) => a.isDirectory() === b.isDirectory()
          ? a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
          : a.isDirectory() ? -1 : 1);
      const nodes: FileTreeNode[] = [];
      for (const entry of entries) {
        if (++count > 4000) break;
        const absolute = path.join(directory, entry.name);
        const relative = path.relative(root, absolute);
        if (entry.isSymbolicLink()) continue;
        if (entry.isDirectory()) nodes.push({ name: entry.name, path: relative, type: 'directory', children: await visit(absolute, depth + 1) });
        else if (entry.isFile()) nodes.push({ name: entry.name, path: relative, type: 'file' });
      }
      return nodes;
    };
    return visit(root, 0);
  }

  async readFile(relativePath: string): Promise<FileContent> {
    const absolute = this.resolveSafe(relativePath);
    const stat = await fs.stat(absolute);
    if (!stat.isFile()) throw new Error('The selected item is not a file.');
    if (stat.size > 5 * 1024 * 1024) throw new Error('Files larger than 5 MB are not supported in the editor.');
    const buffer = await fs.readFile(absolute);
    if (buffer.includes(0)) throw new Error('Binary files cannot be opened in the text editor.');
    return {
      path: path.relative(this.requireRoot(), absolute),
      content: buffer.toString('utf8'),
      language: languageByExtension[path.extname(absolute).toLowerCase()] ?? 'plaintext',
      size: stat.size,
    };
  }

  async writeFile(relativePath: string, content: string) {
    const absolute = this.resolveSafe(relativePath);
    await fs.writeFile(absolute, content, 'utf8');
  }

  async create(parentPath: string, name: string, kind: 'file' | 'directory') {
    this.validateName(name);
    const parent = parentPath ? this.resolveSafe(parentPath) : this.requireRoot();
    const target = path.join(parent, name);
    this.assertWithinRoot(target);
    if (kind === 'directory') await fs.mkdir(target);
    else await fs.writeFile(target, '', { flag: 'wx' });
    return this.readTree();
  }

  async importFiles(parentPath: string, sourcePaths: string[]): Promise<ImportedFilesResult> {
    if (!Array.isArray(sourcePaths) || !sourcePaths.length || sourcePaths.length > 50) throw new Error('Select between 1 and 50 files.');
    const parent = parentPath ? this.resolveSafe(parentPath) : this.requireRoot();
    const parentStat = await fs.stat(parent);
    if (!parentStat.isDirectory()) throw new Error('Choose a project folder as the import destination.');
    const prepared: { target: string; relative: string; buffer: Buffer }[] = [];
    const seen = new Set<string>();
    for (const sourcePath of sourcePaths) {
      const name = path.basename(sourcePath);
      this.validateName(name);
      const key = name.toLocaleLowerCase();
      if (seen.has(key)) throw new Error(`More than one selected file is named ${name}.`);
      seen.add(key);
      const stat = await fs.stat(sourcePath);
      if (!stat.isFile()) throw new Error(`${name} is not a regular file.`);
      if (stat.size > 10 * 1024 * 1024) throw new Error(`${name} is larger than the 10 MB import limit.`);
      const buffer = await fs.readFile(sourcePath);
      if (buffer.includes(0)) throw new Error(`${name} appears to be binary. Aetherium imports text and code files only.`);
      const target = path.join(parent, name);
      this.assertWithinRoot(target);
      try {
        await fs.access(target);
        throw new Error(`${name} already exists in the destination folder.`);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      }
      prepared.push({ target, relative: path.relative(this.requireRoot(), target), buffer });
    }
    for (const file of prepared) await fs.writeFile(file.target, file.buffer, { flag: 'wx' });
    return { tree: await this.readTree(), imported: prepared.map((file) => file.relative) };
  }

  async applyFileChanges(changes: AIFileChange[]) {
    if (!Array.isArray(changes) || !changes.length || changes.length > 20) throw new Error('Aether can apply between 1 and 20 files at a time.');
    let totalBytes = 0;
    const prepared: { absolute: string; content: string }[] = [];
    const seen = new Set<string>();
    for (const change of changes) {
      if (!change || typeof change.path !== 'string' || typeof change.content !== 'string') throw new Error('Aether returned an invalid file plan.');
      const relativePath = change.path.trim().replace(/[/\\]+/g, path.sep);
      if (!relativePath || relativePath.endsWith(path.sep)) throw new Error('Every Aether file change needs a valid file path.');
      const key = relativePath.toLocaleLowerCase();
      if (seen.has(key)) throw new Error(`Aether proposed ${relativePath} more than once.`);
      seen.add(key);
      this.assertWritableRelativePath(relativePath);
      const bytes = Buffer.byteLength(change.content, 'utf8');
      if (bytes > 1024 * 1024) throw new Error(`${relativePath} exceeds the 1 MB AI file limit.`);
      totalBytes += bytes;
      if (totalBytes > 5 * 1024 * 1024) throw new Error('The Aether file plan exceeds the 5 MB total limit.');
      const absolute = this.resolveSafe(relativePath);
      await this.assertNoSymbolicLink(absolute);
      prepared.push({ absolute, content: change.content });
    }
    for (const change of prepared) {
      await fs.mkdir(path.dirname(change.absolute), { recursive: true });
      await fs.writeFile(change.absolute, change.content, 'utf8');
    }
    return this.readTree();
  }

  async rename(relativePath: string, nextName: string) {
    this.validateName(nextName);
    const source = this.resolveSafe(relativePath);
    const target = path.join(path.dirname(source), nextName);
    this.assertWithinRoot(target);
    await fs.rename(source, target);
    return this.readTree();
  }

  async search(query: string): Promise<SearchMatch[]> {
    const search = query.trim().toLocaleLowerCase();
    if (!search) return [];
    const root = this.requireRoot();
    const matches: SearchMatch[] = [];
    const scan = async (directory: string): Promise<void> => {
      if (matches.length >= 500) return;
      const entries = await fs.readdir(directory, { withFileTypes: true });
      for (const entry of entries) {
        if (matches.length >= 500 || ignored.has(entry.name) || entry.isSymbolicLink()) continue;
        const absolute = path.join(directory, entry.name);
        if (entry.isDirectory()) await scan(absolute);
        else if (entry.isFile()) {
          const stat = await fs.stat(absolute);
          if (stat.size > 1024 * 1024) continue;
          const buffer = await fs.readFile(absolute);
          if (buffer.includes(0)) continue;
          const lines = buffer.toString('utf8').split(/\r?\n/);
          lines.forEach((line, index) => {
            const column = line.toLocaleLowerCase().indexOf(search);
            if (column >= 0 && matches.length < 500) matches.push({
              path: path.relative(root, absolute),
              line: index + 1,
              column: column + 1,
              preview: line.trim().slice(0, 240),
            });
          });
        }
      }
    };
    await scan(root);
    return matches;
  }

  async gitSummary(): Promise<GitSummary> {
    const root = this.requireRoot();
    try {
      const [{ stdout: branch }, { stdout: status }] = await Promise.all([
        execFileAsync('git', ['branch', '--show-current'], { cwd: root, windowsHide: true }),
        execFileAsync('git', ['status', '--porcelain'], { cwd: root, windowsHide: true }),
      ]);
      return { isRepository: true, branch: branch.trim() || 'HEAD', changedFiles: status.trim() ? status.trim().split(/\r?\n/).length : 0 };
    } catch {
      return { isRepository: false, branch: null, changedFiles: 0 };
    }
  }

  resolveSafe(relativePath: string) {
    if (path.isAbsolute(relativePath)) throw new Error('Absolute paths are not accepted.');
    const target = path.resolve(this.requireRoot(), relativePath);
    this.assertWithinRoot(target);
    return target;
  }

  dispose() {
    this.watcher?.close();
    this.watcher = null;
  }

  private requireRoot() {
    if (!this.root) throw new Error('Open a workspace first.');
    return this.root;
  }

  private assertWithinRoot(target: string) {
    const root = this.requireRoot();
    const relative = path.relative(root, target);
    if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('The path is outside the active workspace.');
  }

  private validateName(name: string) {
    if (!name.trim() || name === '.' || name === '..' || /[\\/:*?"<>|]/.test(name)) throw new Error('Enter a valid file or folder name.');
  }

  private assertWritableRelativePath(relativePath: string) {
    if (path.isAbsolute(relativePath)) throw new Error('Absolute paths are not accepted.');
    const segments = relativePath.split(/[\\/]/).filter(Boolean);
    if (!segments.length || segments.some((segment) => segment === '.' || segment === '..')) throw new Error('The file path is outside the active workspace.');
    const protectedSegment = segments.find((segment) => ignored.has(segment) || segment === '.git');
    if (protectedSegment) throw new Error(`Aether cannot write inside ${protectedSegment}.`);
  }

  private async assertNoSymbolicLink(target: string) {
    const root = this.requireRoot();
    const parts = path.relative(root, target).split(path.sep);
    let current = root;
    for (const part of parts) {
      current = path.join(current, part);
      try {
        const stat = await fs.lstat(current);
        if (stat.isSymbolicLink()) throw new Error('Aether cannot write through symbolic links.');
        if (current === target && stat.isDirectory()) throw new Error('Aether cannot replace a folder with a file.');
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') break;
        throw error;
      }
    }
  }

  private startWatcher() {
    this.watcher?.close();
    const root = this.requireRoot();
    try {
      this.watcher = watch(root, { recursive: true }, (_event, filename) => {
        if (!filename || [...ignored].some((part) => filename.split(/[\\/]/).includes(part))) return;
        if (this.changeTimer) clearTimeout(this.changeTimer);
        this.changeTimer = setTimeout(() => this.onChange?.(), 220);
      });
    } catch {
      this.watcher = null;
    }
  }
}
