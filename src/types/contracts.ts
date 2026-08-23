export type ThemeMode = 'dark' | 'light';

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
}

export interface WorkspaceInfo {
  name: string;
  path: string;
  tree: FileTreeNode[];
}

export interface RecentWorkspace {
  name: string;
  path: string;
  openedAt: number;
}

export interface AppPreferences {
  theme: ThemeMode;
  recentWorkspaces: RecentWorkspace[];
  restoreLastWorkspace: boolean;
  uiDensity: 'comfortable' | 'compact';
  autosave: 'off' | 'afterDelay';
  notifications: boolean;
  editor: {
    fontSize: number;
    tabSize: number;
    wordWrap: 'off' | 'on';
    minimap: boolean;
    lineNumbers: boolean;
  };
  terminal: { shell: string; fontSize: number };
  ai: { provider: 'gemini'; model: string; endpoint: string };
}

export interface FileContent { path: string; content: string; language: string; size: number }
export interface SearchMatch { path: string; line: number; column: number; preview: string }
export interface GitSummary { isRepository: boolean; branch: string | null; changedFiles: number }
export interface TerminalSessionInfo { id: string; name: string; cwd: string }
export interface TerminalDataEvent { sessionId: string; data: string }
export interface TerminalExitEvent { sessionId: string; exitCode: number | null }
export interface AIContextPayload {
  activeFile?: { path: string; content: string };
  selectedCode?: string;
  projectFiles?: string[];
  terminalOutput?: string;
}
export interface AIChatMessage { role: 'system' | 'user' | 'assistant'; content: string }
export interface AIRequest {
  requestId: string;
  messages: AIChatMessage[];
  context: AIContextPayload;
  model: string;
  endpoint: string;
}
export interface AIStreamEvent { requestId: string; type: 'token' | 'done' | 'error'; value?: string }

export interface AetheriumDesktopApi {
  window: {
    minimize(): Promise<void>;
    toggleMaximize(): Promise<boolean>;
    close(): Promise<void>;
  };
  preferences: {
    load(): Promise<AppPreferences>;
    save(preferences: AppPreferences): Promise<void>;
  };
  workspace: {
    open(): Promise<WorkspaceInfo | null>;
    createProject(name: string): Promise<WorkspaceInfo | null>;
    reopen(path: string): Promise<WorkspaceInfo>;
    refresh(): Promise<FileTreeNode[]>;
    readFile(path: string): Promise<FileContent>;
    writeFile(path: string, content: string): Promise<void>;
    createFile(parentPath: string, name: string): Promise<FileTreeNode[]>;
    createFolder(parentPath: string, name: string): Promise<FileTreeNode[]>;
    rename(path: string, nextName: string): Promise<FileTreeNode[]>;
    delete(path: string): Promise<FileTreeNode[]>;
    search(query: string): Promise<SearchMatch[]>;
    gitSummary(): Promise<GitSummary>;
    onChanged(listener: () => void): () => void;
  };
  terminal: {
    create(shell?: string): Promise<TerminalSessionInfo>;
    write(sessionId: string, data: string): Promise<void>;
    close(sessionId: string): Promise<void>;
    onData(listener: (event: TerminalDataEvent) => void): () => void;
    onExit(listener: (event: TerminalExitEvent) => void): () => void;
  };
  ai: {
    stream(request: AIRequest): Promise<void>;
    cancel(requestId: string): Promise<void>;
    status(): Promise<{ configured: boolean; credentialSource: string }>;
    onEvent(listener: (event: AIStreamEvent) => void): () => void;
  };
}
