import { useCallback, useEffect, useMemo, useState } from 'react';
import { Icon } from '../components/icons/Icon';
import { CommandPalette, type AppCommand } from '../features/commands/CommandPalette';
import { StartupScreen } from '../features/startup/StartupScreen';
import { Titlebar } from '../features/titlebar/Titlebar';
import { WelcomeScreen } from '../features/welcome/WelcomeScreen';
import { WorkbenchShell } from '../features/workbench/WorkbenchShell';
import { desktop } from '../services/desktop';
import { addRecentWorkspace, DEFAULT_PREFERENCES } from '../state/preferences';
import type { AppPreferences, ThemeMode, WorkspaceInfo } from '../types/contracts';

interface Notice {
  id: number;
  kind: 'error' | 'info';
  message: string;
}

export function App() {
  const [bootState, setBootState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [startupVisible, setStartupVisible] = useState(true);
  const [startupLeaving, setStartupLeaving] = useState(false);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [workspace, setWorkspace] = useState<WorkspaceInfo | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const notify = useCallback((message: string, kind: Notice['kind'] = 'info') => {
    const next = { id: Date.now(), message, kind };
    setNotice(next);
    window.setTimeout(() => setNotice((current) => current?.id === next.id ? null : current), 4500);
  }, []);

  useEffect(() => {
    let active = true;
    const startedAt = Date.now();
    desktop.preferences.load()
      .then(async (loaded) => {
        if (!active) return;
        setPreferences(loaded);
        document.documentElement.dataset.theme = loaded.theme;
        if (loaded.restoreLastWorkspace && loaded.recentWorkspaces[0]) {
          try { setWorkspace(await desktop.workspace.reopen(loaded.recentWorkspaces[0].path)); }
          catch (error) { console.warn('Could not restore the last workspace:', error); }
        }
        const remaining = Math.max(0, 950 - (Date.now() - startedAt));
        await new Promise((resolve) => window.setTimeout(resolve, remaining));
        if (!active) return;
        setBootState('ready');
        setStartupLeaving(true);
        window.setTimeout(() => {
          if (active) setStartupVisible(false);
        }, 420);
      })
      .catch((error) => {
        console.error(error);
        if (active) setBootState('error');
      });
    return () => { active = false; };
  }, []);

  const persistPreferences = useCallback((next: AppPreferences) => {
    setPreferences(next);
    document.documentElement.dataset.theme = next.theme;
    void desktop.preferences.save(next).catch((error) => notify(`Could not save preferences: ${String(error)}`, 'error'));
  }, [notify]);

  const toggleTheme = useCallback(() => {
    const theme: ThemeMode = preferences.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    persistPreferences({ ...preferences, theme });
  }, [persistPreferences, preferences]);

  const acceptWorkspace = useCallback((nextWorkspace: WorkspaceInfo) => {
    setWorkspace(nextWorkspace);
    persistPreferences(addRecentWorkspace(preferences, { name: nextWorkspace.name, path: nextWorkspace.path }));
  }, [persistPreferences, preferences]);

  const openFolder = useCallback(async () => {
    setBusy(true);
    try {
      const nextWorkspace = await desktop.workspace.open();
      if (nextWorkspace) acceptWorkspace(nextWorkspace);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Aetherium could not open that folder.', 'error');
    } finally {
      setBusy(false);
    }
  }, [acceptWorkspace, notify]);

  const openRecent = useCallback(async (path: string) => {
    setBusy(true);
    try {
      acceptWorkspace(await desktop.workspace.reopen(path));
    } catch (error) {
      notify(error instanceof Error ? error.message : 'That workspace is no longer available.', 'error');
    } finally {
      setBusy(false);
    }
  }, [acceptWorkspace, notify]);
  const createProject = useCallback(async () => {
    const name = window.prompt('Project name');
    if (!name) return;
    setBusy(true);
    try {
      const nextWorkspace = await desktop.workspace.createProject(name);
      if (nextWorkspace) acceptWorkspace(nextWorkspace);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Aetherium could not create that project.', 'error');
    } finally {
      setBusy(false);
    }
  }, [acceptWorkspace, notify]);

  const commands = useMemo<AppCommand[]>(() => [
    { id: 'workspace.open', label: 'Open Folder', category: 'Workspace', shortcut: 'Ctrl O', icon: 'folder', run: () => void openFolder() },
    { id: 'workspace.create', label: 'Create Project', category: 'Workspace', icon: 'plus', run: () => void createProject() },
    { id: 'appearance.theme', label: `Use ${preferences.theme === 'dark' ? 'Light' : 'Dark'} Theme`, category: 'Appearance', icon: preferences.theme === 'dark' ? 'sun' : 'moon', run: toggleTheme },
    ...(workspace ? [
      { id: 'file.quick-open', label: 'Quick Open', category: 'File', shortcut: 'Ctrl P', icon: 'search' as const, run: () => dispatchWorkbenchCommand('quick-open') },
      { id: 'file.save', label: 'Save', category: 'File', shortcut: 'Ctrl S', icon: 'file' as const, run: () => dispatchWorkbenchCommand('save') },
      { id: 'file.save-all', label: 'Save All', category: 'File', shortcut: 'Ctrl Shift S', icon: 'files' as const, run: () => dispatchWorkbenchCommand('save-all') },
      { id: 'view.search', label: 'Focus Project Search', category: 'View', icon: 'search' as const, run: () => dispatchWorkbenchCommand('search') },
      { id: 'view.terminal', label: 'Toggle Terminal', category: 'View', shortcut: 'Ctrl `', icon: 'terminal' as const, run: () => dispatchWorkbenchCommand('terminal') },
      { id: 'view.ai', label: 'Toggle Aether AI', category: 'View', icon: 'sparkles' as const, run: () => dispatchWorkbenchCommand('ai') },
      { id: 'project.run', label: 'Run Project', category: 'Project', shortcut: 'F5', icon: 'arrow-right' as const, run: () => dispatchWorkbenchCommand('run') },
      { id: 'project.build', label: 'Build Project', category: 'Project', shortcut: 'Ctrl Shift B', icon: 'code' as const, run: () => dispatchWorkbenchCommand('build') },
      { id: 'preferences.open', label: 'Open Settings', category: 'Preferences', icon: 'settings' as const, run: () => dispatchWorkbenchCommand('settings') },
      { id: 'workspace.close', label: 'Close Workspace', category: 'Workspace', icon: 'close' as const, run: () => setWorkspace(null) },
    ] : []),
  ], [createProject, openFolder, preferences.theme, toggleTheme, workspace]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const modifier = event.ctrlKey || event.metaKey;
      if (modifier && event.shiftKey && event.key.toLowerCase() === 'p') {
        event.preventDefault();
        setPaletteOpen(true);
      } else if (modifier && event.key.toLowerCase() === 'o') {
        event.preventDefault();
        void openFolder();
      } else if (event.key === 'Escape') {
        setPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openFolder]);

  if (bootState === 'error') {
    return (
      <div className="startup-error">
        <span className="brand-mark brand-mark--hero"><Icon name="aetherium" size={36} /></span>
        <h1>Aetherium could not start</h1>
        <p>Your preferences could not be initialized. Restart the application and try again.</p>
        <button className="button button--primary" onClick={() => window.location.reload()}>Restart Aetherium</button>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Titlebar theme={preferences.theme} workspaceName={workspace?.name} onToggleTheme={toggleTheme} onOpenCommandPalette={() => setPaletteOpen(true)} />
      <div className="app-content">
        {workspace ? (
          <WorkbenchShell
            workspace={workspace}
            preferences={preferences}
            onPreferencesChange={persistPreferences}
            onOpenFolder={() => void openFolder()}
            onNotify={notify}
          />
        ) : (
          <WelcomeScreen recentWorkspaces={preferences.recentWorkspaces} busy={busy} onOpenFolder={() => void openFolder()} onCreateProject={() => void createProject()} onOpenRecent={(path) => void openRecent(path)} onOpenCommandPalette={() => setPaletteOpen(true)} />
        )}
      </div>
      <CommandPalette open={paletteOpen} commands={commands} onClose={() => setPaletteOpen(false)} />
      {notice && <div className={`toast toast--${notice.kind}`} role="status"><Icon name={notice.kind === 'error' ? 'close' : 'check'} size={15} /><span>{notice.message}</span><button onClick={() => setNotice(null)} aria-label="Dismiss"><Icon name="close" size={13} /></button></div>}
      {startupVisible && <StartupScreen leaving={startupLeaving} />}
    </div>
  );
}

function dispatchWorkbenchCommand(command: string) {
  window.dispatchEvent(new CustomEvent('aetherium:command', { detail: command }));
}
