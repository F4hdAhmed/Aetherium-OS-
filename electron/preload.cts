import { contextBridge, ipcRenderer } from 'electron';
import type {
  AetheriumDesktopApi,
  AIFileChange,
  AIRequest,
  AIStreamEvent,
  AppPreferences,
  TerminalDataEvent,
  TerminalExitEvent,
} from '../src/types/contracts.js';

function subscribe<T>(channel: string, listener: (event: T) => void) {
  const handler = (_electronEvent: Electron.IpcRendererEvent, payload: T) => listener(payload);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
}

const api: AetheriumDesktopApi = {
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    toggleMaximize: () => ipcRenderer.invoke('window:toggle-maximize'),
    close: () => ipcRenderer.invoke('window:close'),
  },
  preferences: {
    load: () => ipcRenderer.invoke('preferences:load'),
    save: (preferences: AppPreferences) => ipcRenderer.invoke('preferences:save', preferences),
  },
  workspace: {
    open: () => ipcRenderer.invoke('workspace:open'),
    createProject: (name: string) => ipcRenderer.invoke('workspace:create-project', name),
    reopen: (path: string) => ipcRenderer.invoke('workspace:reopen', path),
    refresh: () => ipcRenderer.invoke('workspace:refresh'),
    readFile: (path: string) => ipcRenderer.invoke('workspace:read-file', path),
    writeFile: (path: string, content: string) => ipcRenderer.invoke('workspace:write-file', path, content),
    createFile: (parentPath: string, name: string) => ipcRenderer.invoke('workspace:create-file', parentPath, name),
    createFolder: (parentPath: string, name: string) => ipcRenderer.invoke('workspace:create-folder', parentPath, name),
    importFiles: (parentPath: string) => ipcRenderer.invoke('workspace:import-files', parentPath),
    applyFileChanges: (changes: AIFileChange[]) => ipcRenderer.invoke('workspace:apply-file-changes', changes),
    rename: (path: string, nextName: string) => ipcRenderer.invoke('workspace:rename', path, nextName),
    delete: (path: string) => ipcRenderer.invoke('workspace:delete', path),
    search: (query: string) => ipcRenderer.invoke('workspace:search', query),
    gitSummary: () => ipcRenderer.invoke('workspace:git-summary'),
    onChanged: (listener: () => void) => subscribe<void>('workspace:changed', listener),
  },
  terminal: {
    create: (shell?: string) => ipcRenderer.invoke('terminal:create', shell),
    write: (sessionId: string, data: string) => ipcRenderer.invoke('terminal:write', sessionId, data),
    close: (sessionId: string) => ipcRenderer.invoke('terminal:close', sessionId),
    onData: (listener: (event: TerminalDataEvent) => void) => subscribe('terminal:data', listener),
    onExit: (listener: (event: TerminalExitEvent) => void) => subscribe('terminal:exit', listener),
  },
  ai: {
    stream: (request: AIRequest) => ipcRenderer.invoke('ai:stream', request),
    cancel: (requestId: string) => ipcRenderer.invoke('ai:cancel', requestId),
    status: () => ipcRenderer.invoke('ai:status'),
    onEvent: (listener: (event: AIStreamEvent) => void) => subscribe('ai:event', listener),
  },
};

contextBridge.exposeInMainWorld('aetherium', api);
