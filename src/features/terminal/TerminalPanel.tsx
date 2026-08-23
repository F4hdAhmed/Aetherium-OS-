import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { Icon } from '../../components/icons/Icon';
import { desktop } from '../../services/desktop';
import type { AppPreferences, TerminalSessionInfo, ThemeMode } from '../../types/contracts';

function TerminalView({ session, active, fontSize, theme, onOutput }: { session: TerminalSessionInfo; active: boolean; fontSize: number; theme: ThemeMode; onOutput?(data: string): void }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  useEffect(() => {
    if (!hostRef.current) return;
    const terminal = new Terminal({
      convertEol: true,
      cursorBlink: true,
      fontFamily: '"Cascadia Code", "SFMono-Regular", Consolas, monospace',
      fontSize,
      scrollback: 5000,
      theme: theme === 'dark'
        ? { background: '#0e1015', foreground: '#cdd2de', cursor: '#8a7cff', selectionBackground: '#7565f655' }
        : { background: '#f7f8fb', foreground: '#303644', cursor: '#6657e8', selectionBackground: '#6657e833' },
    });
    const fit = new FitAddon();
    terminal.loadAddon(fit);
    terminal.open(hostRef.current);
    terminalRef.current = terminal;
    const input = terminal.onData((data) => void desktop.terminal.write(session.id, data));
    const stopData = desktop.terminal.onData((event) => {
      if (event.sessionId === session.id) {
        terminal.write(event.data);
        onOutput?.(event.data);
      }
    });
    const stopExit = desktop.terminal.onExit((event) => {
      if (event.sessionId === session.id) terminal.writeln(`\r\n[Process exited with code ${event.exitCode ?? 'unknown'}]`);
    });
    const observer = new ResizeObserver(() => { if (hostRef.current?.offsetParent) fit.fit(); });
    observer.observe(hostRef.current);
    requestAnimationFrame(() => fit.fit());
    return () => {
      observer.disconnect(); stopData(); stopExit(); input.dispose(); terminal.dispose(); terminalRef.current = null;
    };
  }, [fontSize, onOutput, session.id, theme]);
  useEffect(() => { if (active) requestAnimationFrame(() => terminalRef.current?.focus()); }, [active]);
  return <div ref={hostRef} className="xterm-host" style={{ display: active ? 'block' : 'none' }} />;
}

interface TerminalPanelProps {
  settings: AppPreferences['terminal'];
  theme: ThemeMode;
  onClosePanel(): void;
  onOutput?(data: string): void;
}

export function TerminalPanel({ settings, theme, onClosePanel, onOutput }: TerminalPanelProps) {
  const [sessions, setSessions] = useState<TerminalSessionInfo[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const createSession = async () => {
    try {
      setError('');
      const session = await desktop.terminal.create(settings.shell || undefined);
      setSessions((current) => [...current, session]);
      setActiveId(session.id);
      return session;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
      return null;
    }
  };
  useEffect(() => { if (!sessions.length) void createSession(); }, []);
  useEffect(() => {
    const runCommand = async (event: Event) => {
      const command = (event as CustomEvent<string>).detail;
      let sessionId = activeId;
      if (!sessionId) sessionId = (await createSession())?.id ?? null;
      if (sessionId) await desktop.terminal.write(sessionId, `${command}\r`);
    };
    window.addEventListener('aetherium:terminal-command', runCommand);
    return () => window.removeEventListener('aetherium:terminal-command', runCommand);
  }, [activeId, settings.shell]);
  const closeSession = async (id: string) => {
    await desktop.terminal.close(id);
    setSessions((current) => current.filter((session) => session.id !== id));
    setActiveId((current) => current === id ? sessions.find((session) => session.id !== id)?.id ?? null : current);
  };
  return (
    <section className="bottom-panel">
      <header>
        <div className="terminal-tabs">
          {sessions.map((session, index) => (
            <button key={session.id} className={session.id === activeId ? 'is-active' : ''} onClick={() => setActiveId(session.id)}>
              {session.name} {index + 1}
              <span role="button" onClick={(event) => { event.stopPropagation(); void closeSession(session.id); }}><Icon name="close" size={10} /></span>
            </button>
          ))}
          {!sessions.length && <button className="is-active">Terminal</button>}
        </div>
        <div><button title="New terminal" onClick={() => void createSession()}><Icon name="plus" size={14} /></button><button title="Close panel" onClick={onClosePanel}><Icon name="close" size={14} /></button></div>
      </header>
      {error ? <div className="terminal-error">{error}</div> : <div className="terminal-stack">{sessions.map((session) => <TerminalView key={session.id} session={session} active={session.id === activeId} fontSize={settings.fontSize} theme={theme} onOutput={onOutput} />)}</div>}
    </section>
  );
}
