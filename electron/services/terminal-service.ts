import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import path from 'node:path';
import type { TerminalDataEvent, TerminalExitEvent, TerminalSessionInfo } from '../../src/types/contracts.js';

interface Session {
  info: TerminalSessionInfo;
  process: ChildProcessWithoutNullStreams;
}

export class TerminalService {
  private sessions = new Map<string, Session>();
  onData?: (event: TerminalDataEvent) => void;
  onExit?: (event: TerminalExitEvent) => void;

  create(cwd: string, requestedShell?: string): TerminalSessionInfo {
    const id = crypto.randomUUID();
    const shell = requestedShell?.trim() || (process.platform === 'win32' ? (process.env.COMSPEC || 'cmd.exe') : (process.env.SHELL || '/bin/sh'));
    const args = process.platform === 'win32' && /powershell/i.test(shell) ? ['-NoLogo', '-NoExit'] : [];
    const child = spawn(shell, args, {
      cwd,
      env: { ...process.env, TERM: 'xterm-256color' },
      windowsHide: true,
      stdio: 'pipe',
    });
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (data: string) => this.onData?.({ sessionId: id, data }));
    child.stderr.on('data', (data: string) => this.onData?.({ sessionId: id, data }));
    child.on('error', (error) => this.onData?.({ sessionId: id, data: `\r\nShell failed: ${error.message}\r\n` }));
    child.on('exit', (exitCode) => {
      this.sessions.delete(id);
      this.onExit?.({ sessionId: id, exitCode });
    });
    const info = { id, name: path.basename(shell).replace(/\.exe$/i, ''), cwd };
    this.sessions.set(id, { info, process: child });
    return info;
  }

  write(id: string, data: string) {
    const session = this.sessions.get(id);
    if (!session) throw new Error('Terminal session is no longer running.');
    session.process.stdin.write(data);
  }

  close(id: string) {
    const session = this.sessions.get(id);
    if (!session) return;
    session.process.kill();
    this.sessions.delete(id);
  }

  dispose() {
    for (const session of this.sessions.values()) session.process.kill();
    this.sessions.clear();
  }
}

