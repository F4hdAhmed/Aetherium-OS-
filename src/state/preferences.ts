import type { AppPreferences, RecentWorkspace } from '../types/contracts.js';

export const DEFAULT_PREFERENCES: AppPreferences = {
  theme: 'dark',
  recentWorkspaces: [],
  restoreLastWorkspace: false,
  uiDensity: 'comfortable',
  autosave: 'off',
  notifications: true,
  editor: { fontSize: 13, tabSize: 2, wordWrap: 'off', minimap: true, lineNumbers: true },
  terminal: { shell: '', fontSize: 12 },
  ai: { provider: 'gemini', model: 'gemini-3.5-flash', endpoint: 'https://generativelanguage.googleapis.com/v1beta' },
};

export function normalizePreferences(value: unknown): AppPreferences {
  if (!value || typeof value !== 'object') return { ...DEFAULT_PREFERENCES };
  const candidate = value as Partial<AppPreferences>;
  const recentWorkspaces = Array.isArray(candidate.recentWorkspaces)
    ? candidate.recentWorkspaces
        .filter((workspace): workspace is RecentWorkspace => Boolean(
          workspace &&
          typeof workspace.name === 'string' &&
          typeof workspace.path === 'string' &&
          Number.isFinite(workspace.openedAt),
        ))
        .slice(0, 10)
    : [];

  return {
    theme: candidate.theme === 'light' ? 'light' : 'dark',
    restoreLastWorkspace: Boolean(candidate.restoreLastWorkspace),
    uiDensity: candidate.uiDensity === 'compact' ? 'compact' : 'comfortable',
    autosave: candidate.autosave === 'afterDelay' ? 'afterDelay' : 'off',
    notifications: candidate.notifications !== false,
    recentWorkspaces,
    editor: {
      fontSize: clamp(candidate.editor?.fontSize, 10, 28, DEFAULT_PREFERENCES.editor.fontSize),
      tabSize: clamp(candidate.editor?.tabSize, 1, 8, DEFAULT_PREFERENCES.editor.tabSize),
      wordWrap: candidate.editor?.wordWrap === 'on' ? 'on' : 'off',
      minimap: candidate.editor?.minimap !== false,
      lineNumbers: candidate.editor?.lineNumbers !== false,
    },
    terminal: {
      shell: typeof candidate.terminal?.shell === 'string' ? candidate.terminal.shell : '',
      fontSize: clamp(candidate.terminal?.fontSize, 9, 28, DEFAULT_PREFERENCES.terminal.fontSize),
    },
    ai: {
      provider: 'gemini',
      model: candidate.ai?.provider === 'gemini' && typeof candidate.ai.model === 'string' && candidate.ai.model.trim() && candidate.ai.model.trim() !== 'gemini-3.7-flash'
        ? candidate.ai.model.trim()
        : DEFAULT_PREFERENCES.ai.model,
      endpoint: DEFAULT_PREFERENCES.ai.endpoint,
    },
  };
}

function clamp(value: unknown, minimum: number, maximum: number, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(maximum, Math.max(minimum, value))
    : fallback;
}

export function addRecentWorkspace(
  preferences: AppPreferences,
  workspace: Omit<RecentWorkspace, 'openedAt'>,
  openedAt = Date.now(),
): AppPreferences {
  return {
    ...preferences,
    recentWorkspaces: [
      { ...workspace, openedAt },
      ...preferences.recentWorkspaces.filter((recent) => recent.path !== workspace.path),
    ].slice(0, 10),
  };
}
