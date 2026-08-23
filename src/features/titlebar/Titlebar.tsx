import { Icon } from '../../components/icons/Icon';
import { desktop } from '../../services/desktop';
import type { ThemeMode } from '../../types/contracts';

interface TitlebarProps {
  theme: ThemeMode;
  workspaceName?: string;
  onToggleTheme(): void;
  onOpenCommandPalette(): void;
}

export function Titlebar({ theme, workspaceName, onToggleTheme, onOpenCommandPalette }: TitlebarProps) {
  return (
    <header className="titlebar">
      <div className="titlebar__brand" aria-label="Aetherium OS">
        <span className="brand-mark brand-mark--small"><Icon name="aetherium" size={17} /></span>
        <span className="titlebar__name">AETHERIUM</span>
        <span className="titlebar__edition">OS / 0.1</span>
      </div>
      <button className="titlebar__command" onClick={onOpenCommandPalette}>
        <Icon name="search" size={14} />
        <span>{workspaceName ? `${workspaceName} / Search commands` : 'Search the Aetherium command system'}</span>
        <kbd>Ctrl Shift P</kbd>
      </button>
      <div className="titlebar__actions">
        <button className="icon-button titlebar__utility" onClick={onToggleTheme} aria-label={`Use ${theme === 'dark' ? 'light' : 'dark'} theme`} title="Toggle theme">
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
        </button>
        <button className="window-control" onClick={() => void desktop.window.minimize()} aria-label="Minimize"><Icon name="minus" size={14} /></button>
        <button className="window-control" onClick={() => void desktop.window.toggleMaximize()} aria-label="Maximize"><Icon name="maximize" size={12} /></button>
        <button className="window-control window-control--close" onClick={() => void desktop.window.close()} aria-label="Close"><Icon name="close" size={14} /></button>
      </div>
    </header>
  );
}
