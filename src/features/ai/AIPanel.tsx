import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Icon } from '../../components/icons/Icon';
import { desktop } from '../../services/desktop';
import type { AIChatMessage, AIStreamEvent, AppPreferences } from '../../types/contracts';
import type { EditorDocument } from '../editor/EditorWorkspace';

interface AIPanelProps {
  preferences: AppPreferences['ai'];
  activeDocument: EditorDocument | null;
  selectedCode: string;
  projectFiles: string[];
  terminalOutput: string;
  onClose(): void;
  onInsert(code: string): void;
}

interface DisplayMessage extends AIChatMessage { id: string }

export function AIPanel({ preferences, activeDocument, selectedCode, projectFiles, terminalOutput, onClose, onInsert }: AIPanelProps) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => { void desktop.ai.status().then((status) => setConfigured(status.configured)); }, []);
  useEffect(() => desktop.ai.onEvent((event: AIStreamEvent) => {
    setMessages((current) => current.map((message) => message.id === event.requestId && event.type === 'token'
      ? { ...message, content: message.content + (event.value ?? '') }
      : message));
    if (event.type === 'error') {
      setMessages((current) => current.map((message) => message.id === event.requestId ? { ...message, content: `Request failed: ${event.value ?? 'Unknown error'}` } : message));
      setStreamingId(null);
    }
    if (event.type === 'done') setStreamingId(null);
  }), []);
  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    const content = input.trim();
    if (!content || streamingId) return;
    const requestId = crypto.randomUUID();
    const user: DisplayMessage = { id: crypto.randomUUID(), role: 'user', content };
    const assistant: DisplayMessage = { id: requestId, role: 'assistant', content: '' };
    const history = [...messages, user].map(({ role, content }) => ({ role, content }));
    setMessages((current) => [...current, user, assistant]);
    setInput('');
    setStreamingId(requestId);
    await desktop.ai.stream({
      requestId,
      messages: history,
      model: preferences.model,
      endpoint: preferences.endpoint,
      context: {
        activeFile: activeDocument ? { path: activeDocument.path, content: activeDocument.value } : undefined,
        selectedCode: selectedCode || undefined,
        projectFiles,
        terminalOutput: terminalOutput || undefined,
      },
    });
  };

  const stop = async () => {
    if (!streamingId) return;
    await desktop.ai.cancel(streamingId);
    setStreamingId(null);
  };

  return (
    <aside className="ai-panel">
      <header className="panel-header ai-panel__header">
        <span className="ai-panel__identity">
          <i><Icon name="sparkles" size={14} /></i>
          <span><strong>Aether</strong><small>Gemini · {preferences.model}</small></span>
        </span>
        <div><span className={'ai-state ' + (configured ? 'is-online' : '')}><i />{configured ? 'LIVE' : 'OFFLINE'}</span><button title="New conversation" onClick={() => setMessages([])}><Icon name="plus" size={14} /></button><button title="Close AI" onClick={onClose}><Icon name="close" size={14} /></button></div>
      </header>
      <div className="ai-messages" ref={listRef}>
        {!messages.length && <div className="ai-empty">
          <span className="ai-empty__core"><i /><Icon name="sparkles" size={27} /></span>
          <p className="eyebrow">Aether intelligence online</p>
          <h3>Your code has a copilot.</h3>
          <p>Reason across the active file, your selection, project map, and recent terminal output.</p>
          <div className="ai-starters">
            <button onClick={() => setInput('Explain the active file and its architecture.')}><Icon name="code" size={13} /><span>Explain this file<small>Map its architecture and intent</small></span><Icon name="chevron-right" size={12} /></button>
            <button onClick={() => setInput('Review the selected code for bugs and suggest a fix.')}><Icon name="search" size={13} /><span>Review selection<small>Find bugs and improvements</small></span><Icon name="chevron-right" size={12} /></button>
            <button onClick={() => setInput('Suggest the next implementation step for this project.')}><Icon name="arrow-right" size={13} /><span>Plan next step<small>Turn context into momentum</small></span><Icon name="chevron-right" size={12} /></button>
          </div>
        </div>}
        {messages.map((message) => (
          <article key={message.id} className={`ai-message ai-message--${message.role}`}>
            <header><span>{message.role === 'user' ? 'You' : 'Aether'}</span>{message.role === 'assistant' && message.content && <div><button title="Copy response" onClick={() => void navigator.clipboard.writeText(message.content)}><Icon name="code" size={12} /></button><button title="Insert first code block" onClick={() => onInsert(extractCode(message.content))}><Icon name="arrow-right" size={12} /></button></div>}</header>
            {message.role === 'assistant'
              ? message.content
                ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                : <div className="ai-thinking"><i /><i /><i /><span>Aether is reasoning</span></div>
              : <p>{message.content}</p>}
          </article>
        ))}
      </div>
      <div className="ai-composer">
        {configured === false && <div className="ai-warning"><Icon name="sparkles" size={12} /> Connect Aether by setting <code>GEMINI_API_KEY</code>, then restart.</div>}
        <div className="ai-composer__context">
          <span className={activeDocument ? 'is-active' : ''}><Icon name="file" size={11} /> {activeDocument ? activeDocument.path.split(/[\\/]/).pop() : 'No active file'}</span>
          {selectedCode && <span className="is-active"><Icon name="code" size={11} /> {selectedCode.length} selected</span>}
        </div>
        <textarea
          aria-label="Ask Aether AI"
          placeholder="Ask Aether to explain, debug, build…"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send(); }
          }}
        />
        <div>
          <span><Icon name="sparkles" size={10} /> Context stays explicit</span>
          <button className={streamingId ? 'is-streaming' : ''} onClick={() => streamingId ? void stop() : void send()} disabled={!streamingId && !input.trim()} title={streamingId ? 'Stop response' : 'Send to Aether'}><Icon name={streamingId ? 'close' : 'arrow-right'} size={15} /></button>
        </div>
      </div>
    </aside>
  );
}

function extractCode(markdown: string) {
  return /\`\`\`[^\n]*\n([\s\S]*?)\`\`\`/.exec(markdown)?.[1]?.trim() || markdown;
}
