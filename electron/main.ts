import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AIRequest, AppPreferences } from '../src/types/contracts.js';
import { DEFAULT_PREFERENCES, normalizePreferences } from '../src/state/preferences.js';
import { AIService } from './services/ai-service.js';
import { TerminalService } from './services/terminal-service.js';
import { WorkspaceService } from './services/workspace-service.js';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const workspace = new WorkspaceService();
const terminals = new TerminalService();
const ai = new AIService();
let mainWindow: BrowserWindow | null = null;

function preferencesPath() {
  return path.join(app.getPath('userData'), 'preferences.json');
}

async function loadPreferences(): Promise<AppPreferences> {
  try {
    return withCaptureWorkspace(normalizePreferences(JSON.parse(await fs.readFile(preferencesPath(), 'utf8'))));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') console.error('Could not load preferences:', error);
    return withCaptureWorkspace({ ...DEFAULT_PREFERENCES });
  }
}

function withCaptureWorkspace(preferences: AppPreferences): AppPreferences {
  const captureWorkspace = process.env.AETHERIUM_CAPTURE_WORKSPACE;
  if (!captureWorkspace) return preferences;
  return {
    ...preferences,
    restoreLastWorkspace: true,
    recentWorkspaces: [{ name: path.basename(captureWorkspace), path: captureWorkspace, openedAt: Date.now() }],
  };
}

async function savePreferences(preferences: AppPreferences) {
  await fs.mkdir(path.dirname(preferencesPath()), { recursive: true });
  await fs.writeFile(preferencesPath(), JSON.stringify(normalizePreferences(preferences), null, 2), 'utf8');
}

function registerIpcHandlers() {
  ipcMain.handle('window:minimize', () => mainWindow?.minimize());
  ipcMain.handle('window:toggle-maximize', () => {
    if (!mainWindow) return false;
    if (mainWindow.isMaximized()) mainWindow.unmaximize(); else mainWindow.maximize();
    return mainWindow.isMaximized();
  });
  ipcMain.handle('window:close', () => mainWindow?.close());
  ipcMain.handle('preferences:load', () => loadPreferences());
  ipcMain.handle('preferences:save', (_event, preferences: AppPreferences) => savePreferences(preferences));

  ipcMain.handle('workspace:open', async () => {
    const selection = await dialog.showOpenDialog(mainWindow!, { title: 'Open a folder in Aetherium OS', properties: ['openDirectory'] });
    return selection.canceled ? null : workspace.open(selection.filePaths[0]);
  });
  ipcMain.handle('workspace:create-project', async (_event, projectName: string) => {
    const name = projectName.trim();
    if (!name || name === '.' || name === '..' || /[\\/:*?"<>|]/.test(name)) throw new Error('Enter a valid project name.');
    const selection = await dialog.showOpenDialog(mainWindow!, { title: 'Choose where to create the project', properties: ['openDirectory', 'createDirectory'] });
    if (selection.canceled) return null;
    const projectPath = path.join(selection.filePaths[0], name);
    await fs.mkdir(projectPath);
    return workspace.open(projectPath);
  });
  ipcMain.handle('workspace:reopen', (_event, folderPath: string) => workspace.open(folderPath));
  ipcMain.handle('workspace:refresh', () => workspace.readTree());
  ipcMain.handle('workspace:read-file', (_event, relativePath: string) => workspace.readFile(relativePath));
  ipcMain.handle('workspace:write-file', (_event, relativePath: string, content: string) => workspace.writeFile(relativePath, content));
  ipcMain.handle('workspace:create-file', (_event, parentPath: string, name: string) => workspace.create(parentPath, name, 'file'));
  ipcMain.handle('workspace:create-folder', (_event, parentPath: string, name: string) => workspace.create(parentPath, name, 'directory'));
  ipcMain.handle('workspace:rename', (_event, relativePath: string, nextName: string) => workspace.rename(relativePath, nextName));
  ipcMain.handle('workspace:delete', async (_event, relativePath: string) => {
    await shell.trashItem(workspace.resolveSafe(relativePath));
    return workspace.readTree();
  });
  ipcMain.handle('workspace:search', (_event, query: string) => workspace.search(query));
  ipcMain.handle('workspace:git-summary', () => workspace.gitSummary());

  ipcMain.handle('terminal:create', (_event, requestedShell?: string) => {
    if (!workspace.activeRoot) throw new Error('Open a workspace before creating a terminal.');
    return terminals.create(workspace.activeRoot, requestedShell);
  });
  ipcMain.handle('terminal:write', (_event, sessionId: string, data: string) => terminals.write(sessionId, data));
  ipcMain.handle('terminal:close', (_event, sessionId: string) => terminals.close(sessionId));

  ipcMain.handle('ai:status', () => ai.status());
  ipcMain.handle('ai:stream', async (_event, request: AIRequest) => ai.stream(request));
  ipcMain.handle('ai:cancel', (_event, requestId: string) => ai.cancel(requestId));

  workspace.setChangeListener(() => mainWindow?.webContents.send('workspace:changed'));
  terminals.onData = (event) => mainWindow?.webContents.send('terminal:data', event);
  terminals.onExit = (event) => mainWindow?.webContents.send('terminal:exit', event);
  ai.onEvent = (event) => mainWindow?.webContents.send('ai:event', event);
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 620,
    show: false,
    frame: false,
    backgroundColor: '#0b0c10',
    webPreferences: {
      preload: path.join(currentDirectory, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  mainWindow.once('ready-to-show', () => mainWindow?.show());
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('Renderer process exited:', details.reason, details.exitCode);
  });
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedUrl) => {
    console.error('Renderer failed to load:', errorCode, errorDescription, validatedUrl);
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) void shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.once('did-finish-load', () => {
    const capturePath = process.env.AETHERIUM_CAPTURE_PATH;
    if (!capturePath || !mainWindow) return;
    setTimeout(async () => {
      if (!mainWindow) return;
      const openFile = process.env.AETHERIUM_CAPTURE_OPEN_FILE;
      if (openFile) {
        await mainWindow.webContents.executeJavaScript(`
          Array.from(document.querySelectorAll('.tree-node__row'))
            .find((element) => element.textContent?.trim().endsWith(${JSON.stringify(openFile)}))
            ?.click();
        `);
        await new Promise((resolve) => setTimeout(resolve, 1400));
      }
      const image = await mainWindow.webContents.capturePage();
      await fs.mkdir(path.dirname(capturePath), { recursive: true });
      await fs.writeFile(capturePath, image.toPNG());
      workspace.dispose();
      terminals.dispose();
      app.exit(0);
    }, Number(process.env.AETHERIUM_CAPTURE_DELAY ?? (process.env.AETHERIUM_CAPTURE_WORKSPACE ? 2200 : 1100)));
  });
  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) await mainWindow.loadURL(devServerUrl);
  else await mainWindow.loadFile(path.join(currentDirectory, '../../dist/index.html'));
}

app.whenReady().then(async () => {
  registerIpcHandlers();
  await createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) void createWindow(); });
});

app.on('before-quit', () => {
  workspace.dispose();
  terminals.dispose();
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
