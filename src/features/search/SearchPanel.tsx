import { useEffect, useState } from 'react';
import { Icon } from '../../components/icons/Icon';
import { desktop } from '../../services/desktop';
import type { SearchMatch } from '../../types/contracts';

export function SearchPanel({ onOpen }: { onOpen(match: SearchMatch): void }) {
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<SearchMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!query.trim()) { setMatches([]); setLoading(false); return; }
    const timer = window.setTimeout(async () => {
      setLoading(true); setError('');
      try { setMatches(await desktop.workspace.search(query)); }
      catch (reason) { setError(reason instanceof Error ? reason.message : String(reason)); }
      finally { setLoading(false); }
    }, 280);
    return () => window.clearTimeout(timer);
  }, [query]);
  return (
    <div className="search-panel">
      <div className="search-input"><Icon name="search" size={14} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search text across files" /></div>
      <div className="search-summary">{loading ? 'Searching…' : error || (query ? `${matches.length} results` : 'Type to search the workspace')}</div>
      <div className="search-results">
        {matches.map((match, index) => (
          <button key={`${match.path}:${match.line}:${index}`} onClick={() => onOpen(match)}>
            <strong>{match.path}</strong>
            <span><i>{match.line}:{match.column}</i>{match.preview}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

