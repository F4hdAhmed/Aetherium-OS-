import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/icons/Icon';
import type { RecentWorkspace } from '../../types/contracts';

interface WelcomeScreenProps {
  recentWorkspaces: RecentWorkspace[];
  busy: boolean;
  onOpenFolder(): void;
  onCreateProject(): void;
  onOpenRecent(path: string): void;
  onOpenCommandPalette(): void;
  onSupport(): void;
}

export function WelcomeScreen({ recentWorkspaces, busy, onOpenFolder, onCreateProject, onOpenRecent, onOpenCommandPalette, onSupport }: WelcomeScreenProps) {
  return (
    <main className="welcome">
      <div className="welcome__ambient welcome__ambient--one" />
      <div className="welcome__ambient welcome__ambient--two" />
      <div className="welcome__scanline" />
      <section className="welcome__hero">
        <div className="welcome__signal">
          <span><i /> SYSTEM ONLINE</span>
          <span>BUILD 001 / FAHD AHMED</span>
        </div>
        <div className="welcome__identity">
          <div className="brand-mark brand-mark--hero">
            <span className="brand-mark__orbit" />
            <Icon name="aetherium" size={38} />
          </div>
          <p className="eyebrow">The intelligent developer environment</p>
        </div>
        <h1 className="welcome__wordmark">AETHERIUM<span>OS</span></h1>
        <h2>Enter your<br /><em>creative orbit.</em></h2>
        <p className="welcome__lead">
          Code, terminal, projects, and Aether intelligence—composed into one focused command surface.
        </p>
        <div className="welcome__actions">
          <Button variant="primary" icon="folder" onClick={onOpenFolder} disabled={busy}>
            {busy ? 'Opening…' : 'Open folder'}
          </Button>
          <Button icon="plus" onClick={onCreateProject} disabled={busy}>Create project</Button>
          <Button icon="command" onClick={onOpenCommandPalette}>Explore commands</Button>
          <Button icon="heart" onClick={onSupport}>Support</Button>
        </div>
        <p className="welcome__hint"><kbd>CTRL</kbd><span>+</span><kbd>O</kbd><span>OPEN WORKSPACE</span><b /><kbd>CTRL</kbd><span>+</span><kbd>SHIFT</kbd><span>+</span><kbd>P</kbd><span>COMMANDS</span></p>
      </section>

      <aside className="welcome__recents" aria-label="Recent workspaces">
        <div className="welcome__recents-glow" />
        <div className="section-heading">
          <div>
            <p className="eyebrow">Launch bay</p>
            <h3>Recent missions</h3>
          </div>
          <Icon name="arrow-right" size={17} />
        </div>
        {recentWorkspaces.length > 0 ? (
          <div className="recent-list">
            {recentWorkspaces.slice(0, 5).map((workspace) => (
              <button className="recent-item" key={workspace.path} onClick={() => onOpenRecent(workspace.path)} disabled={busy}>
                <span className="recent-item__icon"><Icon name="folder" size={17} /></span>
                <span className="recent-item__copy">
                  <strong>{workspace.name}</strong>
                  <small>{workspace.path}</small>
                </span>
                <Icon name="chevron-right" size={14} />
              </button>
            ))}
          </div>
        ) : (
          <div className="recent-empty">
            <span><Icon name="code" size={22} /></span>
            <strong>No missions in orbit</strong>
            <p>Open a local codebase and Aetherium will remember your trajectory.</p>
          </div>
        )}
        <div className="welcome__principles">
          <span><Icon name="check" size={13} /> Local-first</span>
          <span><Icon name="check" size={13} /> Keyboard-ready</span>
          <span><Icon name="check" size={13} /> Gemini powered</span>
        </div>
      </aside>

      <footer className="welcome__footer">
        <span className="welcome__coordinates">AETH / 00.01</span>
        <span className="welcome__version">AETHERIUM OS · CREATED BY FAHD AHMED</span>
        <span className="welcome__status"><i /> ALL SYSTEMS NOMINAL</span>
      </footer>
    </main>
  );
}
