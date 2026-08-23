import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Icon, type IconName } from '../../components/icons/Icon';
import { desktop } from '../../services/desktop';
import type { AIFileChange, AppPreferences, FileTreeNode, GitSummary, SearchMatch, WorkspaceInfo } from '../../types/contracts';
import type { EditorDocument } from '../editor/EditorWorkspace';
import { SearchPanel } from '../search/SearchPanel';
import { FileTree } from './FileTree';

const EditorWorkspace = lazy(() => import('../editor/EditorWorkspace').then((module) => ({ default: module.EditorWorkspace })));
const AIPanel = lazy(() => import('../ai/AIPanel').then((module) => ({ default: module.AIPanel })));
const TerminalPanel = lazy(() => import('../terminal/TerminalPanel').then((module) => ({ default: module.TerminalPanel })));
const SettingsDialog = lazy(() => import('../settings/SettingsDialog').then((module) => ({ default: module.SettingsDialog })));

type Activity = 'explorer' | 'search' | 'source';

interface WorkbenchShellProps {
  workspace: WorkspaceInfo;
  preferences: AppPreferences;
  onPreferencesChange(preferences: AppPreferences): void;
  onOpenFolder(): void;
  onNotify(message: string, kind?: 'error' | 'info'): void;
}

const activities: { id: Activity | 'ai'; icon: IconName; label: string }[] = [
  { id: 'explorer', icon: 'files', label: 'Explorer' },
  { id: 'search', icon: 'search', label: 'Search' },
  { id: 'source', icon: 'source', label: 'Source control' },
  { id: 'ai', icon: 'sparkles', label: 'Aether AI' },
];

export function WorkbenchShell({ workspace, preferences, onPreferencesChange, onOpenFolder, onNotify }: WorkbenchShellProps) {
  const [tree, setTree] = useState(workspace.tree);
  const [documents, setDocuments] = useState<EditorDocument[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [activity, setActivity] = useState<Activity>('explorer');
  const [leftWidth, setLeftWidth] = useState(260);
  const [rightWidth, setRightWidth] = useState(360);
  const [bottomHeight, setBottomHeight] = useState(220);
  const [leftVisible, setLeftVisible] = useState(true);
  const [rightVisible, setRightVisible] = useState(true);
  const [bottomVisible, setBottomVisible] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [reveal, setReveal] = useState<{ path: string; line: number; column: number; nonce: number } | null>(null);
  const [cursor, setCursor] = useState({ line: 1, column: 1 });
  const [selectedCode, setSelectedCode] = useState('');
  const [terminalOutput, setTerminalOutput] = useState('');
  const [git, setGit] = useState<GitSummary>({ isRepository: false, branch: null, changedFiles: 0 });
  const autosaveTimer = useRef<number | null>(null);
  const activeDocument = documents.find((document) => document.path === activePath) ?? null;
  const projectFiles = useMemo(() => flattenFiles(tree), [tree]);
  const hasPackageJson = projectFiles.some((file) => file.replace(/\\/g, '/').toLowerCase() === 'package.json');
  const handleTerminalOutput = useCallback((data: string) => {
    setTerminalOutput((value) => (value + data).slice(-12000));
  }, []);

  const refreshTree = useCallback(async () => {
    try {
      setTree(await desktop.workspace.refresh());
      setGit(await desktop.workspace.gitSummary());
    } catch (error) { onNotify(error instanceof Error ? error.message : String(error), 'error'); }
  }, [onNotify]);

  useEffect(() => {
    setTree(workspace.tree);
    setDocuments([]);
    setActivePath(null);
    void desktop.workspace.gitSummary().then(setGit);
  }, [workspace.path]);
  useEffect(() => desktop.workspace.onChanged(() => void refreshTree()), [refreshTree]);
  useEffect(() => () => { if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current); }, []);

  const openFile = useCallback(async (path: string, location?: { line: number; column: number }) => {
    if (documents.some((document) => document.path === path)) {
      setActivePath(path);
      if (location) setReveal({ path, ...location, nonce: Date.now() });
      return;
    }
    try {
      const content = await desktop.workspace.readFile(path);
      setDocuments((current) => [...current, { ...content, value: content.content, savedValue: content.content }]);
      setActivePath(path);
      if (location) setReveal({ path, ...location, nonce: Date.now() });
    } catch (error) { onNotify(error instanceof Error ? error.message : String(error), 'error'); }
  }, [documents, onNotify]);

  const saveFile = useCallback(async (path: string) => {
    const document = documents.find((item) => item.path === path);
    if (!document || document.value === document.savedValue) return;
    try {
      await desktop.workspace.writeFile(path, document.value);
      setDocuments((current) => current.map((item) => item.path === path ? { ...item, savedValue: item.value } : item));
      onNotify(`Saved ${path}`);
    } catch (error) { onNotify(error instanceof Error ? error.message : String(error), 'error'); }
  }, [documents, onNotify]);

  const saveAll = useCallback(async () => {
    const dirty = documents.filter((document) => document.value !== document.savedValue);
    await Promise.all(dirty.map((document) => desktop.workspace.writeFile(document.path, document.value)));
    setDocuments((current) => current.map((document) => ({ ...document, savedValue: document.value })));
    if (dirty.length) onNotify(`Saved ${dirty.length} file${dirty.length === 1 ? '' : 's'}`);
  }, [documents, onNotify]);

  const changeDocument = (path: string, value: string) => {
    setDocuments((current) => current.map((document) => document.path === path ? { ...document, value } : document));
    if (preferences.autosave === 'afterDelay') {
      if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
      autosaveTimer.current = window.setTimeout(() => void desktop.workspace.writeFile(path, value).then(() => {
        setDocuments((current) => current.map((document) => document.path === path ? { ...document, savedValue: value } : document));
      }), 1100);
    }
  };

  const closeDocument = (path: string) => {
    const document = documents.find((item) => item.path === path);
    if (document?.value !== document?.savedValue && !window.confirm(`Close ${path} without saving?`)) return;
    const index = documents.findIndex((item) => item.path === path);
    const remaining = documents.filter((item) => item.path !== path);
    setDocuments(remaining);
    if (activePath === path) setActivePath(remaining[Math.min(index, remaining.length - 1)]?.path ?? null);
  };

  const createEntry = async (parentPath: string, kind: 'file' | 'directory') => {
    const name = window.prompt(kind === 'file' ? 'New file name (include any code extension, such as app.tsx or main.py)' : 'New folder name');
    if (!name) return;
    try {
      const nextTree = kind === 'file'
        ? await desktop.workspace.createFile(parentPath, name)
        : await desktop.workspace.createFolder(parentPath, name);
      setTree(nextTree);
      if (kind === 'file') void openFile([parentPath, name].filter(Boolean).join('\\'));
    } catch (error) { onNotify(error instanceof Error ? error.message : String(error), 'error'); }
  };

  const importFiles = async (parentPath: string) => {
    try {
      const result = await desktop.workspace.importFiles(parentPath);
      if (!result) return;
      setTree(result.tree);
      if (result.imported[0]) await openFile(result.imported[0]);
      onNotify(`Imported ${result.imported.length} file${result.imported.length === 1 ? '' : 's'}`);
    } catch (error) { onNotify(error instanceof Error ? error.message : String(error), 'error'); }
  };

  const applyAIFileChanges = async (changes: AIFileChange[]) => {
    const normalize = (value: string) => value.replace(/\\/g, '/').toLocaleLowerCase();
    const affected = new Set(changes.map((change) => normalize(change.path)));
    const dirty = documents.filter((document) => affected.has(normalize(document.path)) && document.value !== document.savedValue);
    if (dirty.length && !window.confirm(`Aether's plan will replace unsaved edits in ${dirty.map((document) => document.path).join(', ')}. Continue?`)) {
      throw new Error('File plan cancelled because it would replace unsaved edits.');
    }
    try {
      const nextTree = await desktop.workspace.applyFileChanges(changes);
      setTree(nextTree);
      let nextDocuments = await Promise.all(documents.map(async (document) => {
        if (!affected.has(normalize(document.path))) return document;
        const file = await desktop.workspace.readFile(document.path);
        return { ...file, value: file.content, savedValue: file.content };
      }));
      const first = await desktop.workspace.readFile(changes[0].path);
      if (!nextDocuments.some((document) => normalize(document.path) === normalize(first.path))) {
        nextDocuments = [...nextDocuments, { ...first, value: first.content, savedValue: first.content }];
      }
      setDocuments(nextDocuments);
      setActivePath(first.path);
      onNotify(`Applied Aether plan to ${changes.length} file${changes.length === 1 ? '' : 's'}`);
    } catch (error) {
      onNotify(error instanceof Error ? error.message : String(error), 'error');
      throw error;
    }
  };

  const renameEntry = async (node: FileTreeNode) => {
    const nextName = window.prompt('Rename to', node.name);
    if (!nextName || nextName === node.name) return;
    try {
      setTree(await desktop.workspace.rename(node.path, nextName));
      const prefix = node.path.replace(/[^\\/]+$/, '');
      const nextPath = `${prefix}${nextName}`;
      setDocuments((current) => current.map((document) => {
        if (document.path === node.path || document.path.startsWith(`${node.path}\\`)) return { ...document, path: `${nextPath}${document.path.slice(node.path.length)}` };
        return document;
      }));
      if (activePath === node.path || activePath?.startsWith(`${node.path}\\`)) setActivePath(`${nextPath}${activePath.slice(node.path.length)}`);
    } catch (error) { onNotify(error instanceof Error ? error.message : String(error), 'error'); }
  };

  const deleteEntry = async (node: FileTreeNode) => {
    if (!window.confirm(`Move "${node.name}" to the Recycle Bin?`)) return;
    try {
      setTree(await desktop.workspace.delete(node.path));
      setDocuments((current) => current.filter((document) => document.path !== node.path && !document.path.startsWith(`${node.path}\\`)));
      if (activePath === node.path || activePath?.startsWith(`${node.path}\\`)) setActivePath(null);
      onNotify(`Moved ${node.name} to the Recycle Bin`);
    } catch (error) { onNotify(error instanceof Error ? error.message : String(error), 'error'); }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const modifier = event.ctrlKey || event.metaKey;
      if (modifier && !event.shiftKey && event.key.toLowerCase() === 's') { event.preventDefault(); if (activePath) void saveFile(activePath); }
      if (modifier && event.shiftKey && event.key.toLowerCase() === 's') { event.preventDefault(); void saveAll(); }
      if (modifier && event.key === '`') { event.preventDefault(); setBottomVisible((value) => !value); }
      if (modifier && event.key.toLowerCase() === 'p' && !event.shiftKey) { event.preventDefault(); setQuickOpen(true); }
      if (modifier && !event.shiftKey && event.key.toLowerCase() === 'b') { event.preventDefault(); setLeftVisible((value) => !value); }
      if (event.key === 'F5') { event.preventDefault(); runProject('npm run dev', 'development'); }
      if (modifier && event.shiftKey && event.key.toLowerCase() === 'b') { event.preventDefault(); runProject('npm run build', 'build'); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activePath, hasPackageJson, saveAll, saveFile]);
  useEffect(() => {
    const runCommand = (event: Event) => {
      const command = (event as CustomEvent<string>).detail;
      if (command === 'quick-open') setQuickOpen(true);
      if (command === 'save' && activePath) void saveFile(activePath);
      if (command === 'save-all') void saveAll();
      if (command === 'search') { setActivity('search'); setLeftVisible(true); }
      if (command === 'terminal') setBottomVisible((value) => !value);
      if (command === 'ai') setRightVisible((value) => !value);
      if (command === 'settings') setSettingsOpen(true);
      if (command === 'run') runProject('npm run dev', 'development');
      if (command === 'build') runProject('npm run build', 'build');
    };
    window.addEventListener('aetherium:command', runCommand);
    return () => window.removeEventListener('aetherium:command', runCommand);
  }, [activePath, hasPackageJson, saveAll, saveFile]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (documents.some((document) => document.value !== document.savedValue)) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [documents]);

  const startHorizontalDrag = (side: 'left' | 'right') => (event: React.PointerEvent) => {
    event.preventDefault();
    document.body.classList.add('is-resizing');
    document.onpointermove = (moveEvent) => side === 'left'
      ? setLeftWidth(Math.min(430, Math.max(190, moveEvent.clientX - 48)))
      : setRightWidth(Math.min(560, Math.max(280, window.innerWidth - moveEvent.clientX)));
    document.onpointerup = stopDrag;
  };
  const startVerticalDrag = (event: React.PointerEvent) => {
    event.preventDefault();
    document.body.classList.add('is-resizing');
    document.onpointermove = (moveEvent) => setBottomHeight(Math.min(430, Math.max(120, window.innerHeight - moveEvent.clientY - 22)));
    document.onpointerup = stopDrag;
  };
  const stopDrag = () => {
    document.body.classList.remove('is-resizing');
    document.onpointermove = null;
    document.onpointerup = null;
  };

  const selectActivity = (next: Activity | 'ai') => {
    if (next === 'ai') setRightVisible((visible) => !visible);
    else { setActivity(next); setLeftVisible(true); }
  };
  const runProject = (command: string, label: string) => {
    if (!hasPackageJson) { onNotify('No package.json was found. Run the appropriate command directly in Terminal.', 'error'); return; }
    if (!window.confirm(`Run the project ${label} command?\n\n${command}`)) return;
    setBottomVisible(true);
    window.setTimeout(() => window.dispatchEvent(new CustomEvent('aetherium:terminal-command', { detail: command })), 500);
  };

  return (
    <>
      <main
        className={`workbench density--${preferences.uiDensity}`}
        style={{
          gridTemplateColumns: `48px ${leftVisible ? `${leftWidth}px 4px` : '0 0'} minmax(300px, 1fr) ${rightVisible ? `4px ${rightWidth}px` : '0 0'}`,
          gridTemplateRows: `minmax(260px, 1fr) ${bottomVisible ? `4px ${bottomHeight}px` : '0 0'} 22px`,
        }}
      >
        <nav className="activity-bar">
          <div>{activities.map((item) => <button key={item.id} className={(item.id === activity || (item.id === 'ai' && rightVisible)) ? 'is-active' : ''} onClick={() => selectActivity(item.id)} title={item.label}><Icon name={item.icon} size={21} /></button>)}</div>
          <div><button title="Settings" onClick={() => setSettingsOpen(true)}><Icon name="settings" size={20} /></button></div>
        </nav>

        {leftVisible && <aside className="side-panel">
          <header className="panel-header"><span>{activity === 'source' ? 'Source control' : activity}</span><div>{activity === 'explorer' && <><button title="New file" onClick={() => void createEntry('', 'file')}><Icon name="file" size={14} /></button><button title="New folder" onClick={() => void createEntry('', 'directory')}><Icon name="folder" size={14} /></button><button title="Import text or code files" onClick={() => void importFiles('')}><Icon name="arrow-right" size={14} /></button></>}<button title="Refresh" onClick={() => void refreshTree()}><Icon name="refresh" size={14} /></button></div></header>
          {activity === 'explorer' && <><div className="workspace-label"><Icon name="chevron-down" size={11} /><strong>{workspace.name}</strong></div><FileTree nodes={tree} activePath={activePath ?? undefined} onOpen={(path) => void openFile(path)} onCreate={(parent, kind) => void createEntry(parent, kind)} onImport={(parent) => void importFiles(parent)} onRename={(node) => void renameEntry(node)} onDelete={(node) => void deleteEntry(node)} /></>}
          {activity === 'search' && <SearchPanel onOpen={(match: SearchMatch) => void openFile(match.path, match)} />}
          {activity === 'source' && <div className="source-summary"><span><Icon name="branch" size={18} /></span><h3>{git.isRepository ? git.branch : 'No Git repository'}</h3><p>{git.isRepository ? `${git.changedFiles} changed file${git.changedFiles === 1 ? '' : 's'}` : 'Initialize Git from the integrated terminal to begin tracking this workspace.'}</p></div>}
        </aside>}
        {leftVisible && <div className="resizer resizer--vertical" onPointerDown={startHorizontalDrag('left')} />}

        <Suspense fallback={<ModuleLoading label="Loading editor…" />}><EditorWorkspace documents={documents} activePath={activePath} theme={preferences.theme} settings={preferences.editor} reveal={reveal} onActivate={setActivePath} onClose={closeDocument} onChange={changeDocument} onSave={(path) => void saveFile(path)} onCursor={(line, column) => setCursor({ line, column })} onSelection={setSelectedCode} onRun={() => runProject('npm run dev', 'development')} onToggleSidebar={() => setLeftVisible((value) => !value)} /></Suspense>

        {rightVisible && <div className="resizer resizer--vertical" onPointerDown={startHorizontalDrag('right')} />}
        {rightVisible && <Suspense fallback={<ModuleLoading label="Loading Aether AI…" />}><AIPanel preferences={preferences.ai} activeDocument={activeDocument} selectedCode={selectedCode} projectFiles={projectFiles} terminalOutput={terminalOutput} onClose={() => setRightVisible(false)} onInsert={(code) => { if (activePath) changeDocument(activePath, `${activeDocument?.value ?? ''}\n${code}\n`); }} onApplyFileChanges={applyAIFileChanges} /></Suspense>}

        {bottomVisible && <div className="resizer resizer--horizontal" onPointerDown={startVerticalDrag} />}
        {bottomVisible && <Suspense fallback={<ModuleLoading label="Starting terminal…" />}><TerminalPanel settings={preferences.terminal} theme={preferences.theme} onClosePanel={() => setBottomVisible(false)} onOutput={handleTerminalOutput} /></Suspense>}

        <footer className="status-bar">
          <div><span><Icon name="branch" size={12} /> {git.branch ?? 'no repository'}</span><span>{git.changedFiles} changes</span></div>
          <span className="status-bar__signature">Aetherium <i /> Fahd Ahmed</span>
          <div><button onClick={() => setBottomVisible((value) => !value)}><Icon name="terminal" size={12} /> Terminal</button><span>{activeDocument?.language ?? 'Plain Text'}</span><span>Ln {cursor.line}, Col {cursor.column}</span><span>UTF-8</span><Icon name="bell" size={13} /></div>
        </footer>
      </main>
      <Suspense fallback={null}><SettingsDialog open={settingsOpen} preferences={preferences} onChange={onPreferencesChange} onClose={() => setSettingsOpen(false)} /></Suspense>
      <QuickOpen open={quickOpen} files={projectFiles} onClose={() => setQuickOpen(false)} onOpen={(path) => { setQuickOpen(false); void openFile(path); }} />
    </>
  );
}

function ModuleLoading({ label }: { label: string }) {
  return <div className="module-loading"><span><Icon name="aetherium" size={20} /></span>{label}</div>;
}

function flattenFiles(nodes: FileTreeNode[]): string[] {
  return nodes.flatMap((node) => node.type === 'file' ? [node.path] : flattenFiles(node.children ?? []));
}

function QuickOpen({ open, files, onClose, onOpen }: { open: boolean; files: string[]; onClose(): void; onOpen(path: string): void }) {
  const [query, setQuery] = useState('');
  useEffect(() => { if (open) setQuery(''); }, [open]);
  if (!open) return null;
  const matches = files.filter((file) => file.toLowerCase().includes(query.toLowerCase())).slice(0, 80);
  return <div className="modal-layer" onMouseDown={onClose}><section className="quick-open" onMouseDown={(event) => event.stopPropagation()}><div><Icon name="search" size={17} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Escape') onClose(); if (event.key === 'Enter' && matches[0]) onOpen(matches[0]); }} placeholder="Search files by name…" /></div><main>{matches.map((file) => <button key={file} onClick={() => onOpen(file)}><Icon name="file" size={14} /><span>{file.split(/[\\/]/).pop()}<small>{file}</small></span></button>)}</main></section></div>;
}
