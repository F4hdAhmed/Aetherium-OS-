import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon, type IconName } from '../../components/icons/Icon';

export interface AppCommand {
  id: string;
  label: string;
  category: string;
  shortcut?: string;
  icon: IconName;
  run(): void;
}

interface CommandPaletteProps {
  open: boolean;
  commands: AppCommand[];
  onClose(): void;
}

export function CommandPalette({ open, commands, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useMemo(() => {
    const search = query.trim().toLowerCase();
    return commands.filter((command) => `${command.category} ${command.label}`.toLowerCase().includes(search));
  }, [commands, query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  if (!open) return null;

  const execute = (command: AppCommand | undefined) => {
    if (!command) return;
    onClose();
    command.run();
  };

  return (
    <div className="modal-layer" onMouseDown={onClose} role="presentation">
      <section className="command-palette" role="dialog" aria-modal="true" aria-label="Command palette" onMouseDown={(event) => event.stopPropagation()}>
        <div className="command-palette__input">
          <Icon name="search" size={18} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') onClose();
              if (event.key === 'ArrowDown') { event.preventDefault(); setActiveIndex((index) => Math.min(index + 1, results.length - 1)); }
              if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex((index) => Math.max(index - 1, 0)); }
              if (event.key === 'Enter') execute(results[activeIndex]);
            }}
            placeholder="Type a command or search actions…"
          />
          <kbd>Esc</kbd>
        </div>
        <div className="command-palette__label">{results.length ? 'Available commands' : 'No matching commands'}</div>
        <div className="command-list">
          {results.map((command, index) => (
            <button
              key={command.id}
              className={index === activeIndex ? 'is-active' : ''}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => execute(command)}
            >
              <span className="command-list__icon"><Icon name={command.icon} size={16} /></span>
              <span><small>{command.category}</small>{command.label}</span>
              {command.shortcut && <kbd>{command.shortcut}</kbd>}
            </button>
          ))}
        </div>
        <footer className="command-palette__footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
          <span><kbd>↵</kbd> Run</span>
        </footer>
      </section>
    </div>
  );
}

