import { useEffect, useRef } from 'react';
import Editor, { loader, type OnMount } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import type { editor } from 'monaco-editor';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import TypeScriptWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import { Icon } from '../../components/icons/Icon';
import type { AppPreferences, FileContent, ThemeMode } from '../../types/contracts';

loader.config({ monaco });
(self as typeof self & {
  MonacoEnvironment: { getWorker(moduleId: string, label: string): Worker };
}).MonacoEnvironment = {
  getWorker(_moduleId, label) {
    if (label === 'json') return new JsonWorker();
    if (label === 'css' || label === 'scss' || label === 'less') return new CssWorker();
    if (label === 'html' || label === 'handlebars' || label === 'razor') return new HtmlWorker();
    if (label === 'typescript' || label === 'javascript') return new TypeScriptWorker();
    return new EditorWorker();
  },
};

export interface EditorDocument extends FileContent {
  value: string;
  savedValue: string;
}

interface EditorWorkspaceProps {
  documents: EditorDocument[];
  activePath: string | null;
  theme: ThemeMode;
  settings: AppPreferences['editor'];
  reveal?: { path: string; line: number; column: number; nonce: number } | null;
  onActivate(path: string): void;
  onClose(path: string): void;
  onChange(path: string, value: string): void;
  onSave(path: string): void;
  onCursor(line: number, column: number): void;
  onSelection(code: string): void;
  onToggleSidebar(): void;
  onRun(): void;
}

export function EditorWorkspace(props: EditorWorkspaceProps) {
  const active = props.documents.find((document) => document.path === props.activePath) ?? null;
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const saveRef = useRef(props.onSave);
  saveRef.current = props.onSave;

  const handleMount: OnMount = (instance, monaco) => {
    editorRef.current = instance;
    instance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (props.activePath) saveRef.current(props.activePath);
    });
    instance.onDidChangeCursorPosition((event) => props.onCursor(event.position.lineNumber, event.position.column));
    instance.onDidChangeCursorSelection(() => props.onSelection(instance.getModel()?.getValueInRange(instance.getSelection()!) ?? ''));
    instance.focus();
  };

  useEffect(() => {
    if (!props.reveal || props.reveal.path !== props.activePath || !editorRef.current) return;
    const position = { lineNumber: props.reveal.line, column: props.reveal.column };
    editorRef.current.setPosition(position);
    editorRef.current.revealPositionInCenter(position);
    editorRef.current.focus();
  }, [props.activePath, props.reveal]);

  return (
    <section className="editor-space">
      <div className="editor-tabs">
        <div className="editor-tabs__scroll">
          {props.documents.map((document) => {
            const dirty = document.value !== document.savedValue;
            return (
              <button key={document.path} className={`editor-tab ${document.path === props.activePath ? 'is-active' : ''}`} onClick={() => props.onActivate(document.path)} title={document.path}>
                <Icon name="file" size={13} />
                <span>{document.path.split(/[\\/]/).pop()}</span>
                {dirty && <i className="dirty-dot" />}
                <span className="tab-close" role="button" onClick={(event) => { event.stopPropagation(); props.onClose(document.path); }}><Icon name="close" size={11} /></span>
              </button>
            );
          })}
        </div>
        <div className="editor-tabs__tools"><button onClick={props.onRun} title="Run project (F5)"><Icon name="arrow-right" size={15} /></button><button onClick={props.onToggleSidebar} title="Toggle sidebar"><Icon name="panel" size={15} /></button></div>
      </div>
      {active ? (
        <Editor
          path={active.path}
          language={active.language}
          value={active.value}
          theme={props.theme === 'dark' ? 'vs-dark' : 'light'}
          onMount={handleMount}
          onChange={(value) => props.onChange(active.path, value ?? '')}
          options={{
            automaticLayout: true,
            fontFamily: '"Cascadia Code", "SFMono-Regular", Consolas, monospace',
            fontSize: props.settings.fontSize,
            tabSize: props.settings.tabSize,
            wordWrap: props.settings.wordWrap,
            minimap: { enabled: props.settings.minimap },
            lineNumbers: props.settings.lineNumbers ? 'on' : 'off',
            smoothScrolling: true,
            cursorSmoothCaretAnimation: 'on',
            padding: { top: 12 },
            renderWhitespace: 'selection',
            scrollBeyondLastLine: false,
            bracketPairColorization: { enabled: true },
          }}
        />
      ) : (
        <div className="editor-empty">
          <div className="editor-empty__mark"><Icon name="aetherium" size={70} /></div>
          <p className="eyebrow">Workspace ready</p>
          <h2>Open a file to begin</h2>
          <p>Select a text file from Explorer, use project search, or press Ctrl+P for quick access.</p>
          <div className="editor-shortcuts"><span>Quick open <kbd>Ctrl P</kbd></span><span>Commands <kbd>Ctrl Shift P</kbd></span><span>Terminal <kbd>Ctrl `</kbd></span></div>
        </div>
      )}
    </section>
  );
}
