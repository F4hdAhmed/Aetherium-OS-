import type { AetheriumDesktopApi, AppPreferences } from '../types/contracts';
import { DEFAULT_PREFERENCES } from '../state/preferences';

const defaultPreferences: AppPreferences = DEFAULT_PREFERENCES;

const browserFallback: AetheriumDesktopApi = {
  window: {
    minimize: async () => undefined,
    toggleMaximize: async () => false,
    close: async () => undefined,
  },
  preferences: {
    load: async () => {
      const stored = localStorage.getItem('aetherium.preferences');
      return stored ? { ...defaultPreferences, ...JSON.parse(stored) } : defaultPreferences;
    },
    save: async (preferences) => {
      localStorage.setItem('aetherium.preferences', JSON.stringify(preferences));
    },
  },
  workspace: {
    open: async () => null,
    createProject: async () => null,
    reopen: async () => {
      throw new Error('Folder access is only available in the desktop application.');
    },
    refresh: async () => [],
    readFile: async () => { throw new Error('File access is only available in the desktop application.'); },
    writeFile: async () => undefined,
    createFile: async () => [],
    createFolder: async () => [],
    rename: async () => [],
    delete: async () => [],
    search: async () => [],
    gitSummary: async () => ({ isRepository: false, branch: null, changedFiles: 0 }),
    onChanged: () => () => undefined,
  },
  terminal: {
    create: async () => { throw new Error('Terminal access is only available in the desktop application.'); },
    write: async () => undefined,
    close: async () => undefined,
    onData: () => () => undefined,
    onExit: () => () => undefined,
  },
  ai: {
    stream: async () => { throw new Error('AI streaming is only available in the desktop application.'); },
    cancel: async () => undefined,
    status: async () => ({ configured: false, credentialSource: 'GEMINI_API_KEY environment variable' }),
    onEvent: () => () => undefined,
  },
};

export const desktop = window.aetherium ?? browserFallback;
