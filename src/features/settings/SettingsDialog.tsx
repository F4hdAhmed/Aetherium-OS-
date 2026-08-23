import { Icon } from '../../components/icons/Icon';
import type { AppPreferences } from '../../types/contracts';

interface SettingsDialogProps {
  open: boolean;
  preferences: AppPreferences;
  onChange(preferences: AppPreferences): void;
  onClose(): void;
}

export function SettingsDialog({ open, preferences, onChange, onClose }: SettingsDialogProps) {
  if (!open) return null;
  const patch = <K extends keyof AppPreferences>(key: K, value: AppPreferences[K]) => onChange({ ...preferences, [key]: value });
  return (
    <div className="modal-layer settings-layer" onMouseDown={onClose}>
      <section className="settings-dialog" role="dialog" aria-modal="true" aria-label="Settings" onMouseDown={(event) => event.stopPropagation()}>
        <header><div><Icon name="settings" size={18} /><div><p className="eyebrow">Preferences</p><h2>Settings</h2></div></div><button onClick={onClose} aria-label="Close settings"><Icon name="close" size={16} /></button></header>
        <div className="settings-body">
          <nav><a href="#appearance">Appearance</a><a href="#editor">Editor</a><a href="#terminal">Terminal</a><a href="#ai">Aether AI</a><a href="#application">Application</a></nav>
          <main>
            <SettingsSection id="appearance" title="Appearance" description="Control Aetherium's visual experience.">
              <Setting label="Color theme"><select value={preferences.theme} onChange={(event) => patch('theme', event.target.value as AppPreferences['theme'])}><option value="dark">Aetherium Dark</option><option value="light">Aetherium Light</option></select></Setting>
              <Setting label="UI density"><select value={preferences.uiDensity} onChange={(event) => patch('uiDensity', event.target.value as AppPreferences['uiDensity'])}><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></Setting>
            </SettingsSection>
            <SettingsSection id="editor" title="Editor" description="Configure Monaco editing behavior.">
              <Setting label="Font size"><input type="number" min="10" max="28" value={preferences.editor.fontSize} onChange={(event) => patch('editor', { ...preferences.editor, fontSize: Number(event.target.value) })} /></Setting>
              <Setting label="Tab size"><input type="number" min="1" max="8" value={preferences.editor.tabSize} onChange={(event) => patch('editor', { ...preferences.editor, tabSize: Number(event.target.value) })} /></Setting>
              <Setting label="Word wrap"><Toggle checked={preferences.editor.wordWrap === 'on'} onChange={(checked) => patch('editor', { ...preferences.editor, wordWrap: checked ? 'on' : 'off' })} /></Setting>
              <Setting label="Minimap"><Toggle checked={preferences.editor.minimap} onChange={(checked) => patch('editor', { ...preferences.editor, minimap: checked })} /></Setting>
              <Setting label="Line numbers"><Toggle checked={preferences.editor.lineNumbers} onChange={(checked) => patch('editor', { ...preferences.editor, lineNumbers: checked })} /></Setting>
            </SettingsSection>
            <SettingsSection id="terminal" title="Terminal" description="Choose the shell and terminal typography.">
              <Setting label="Shell executable"><input value={preferences.terminal.shell} placeholder="System default" onChange={(event) => patch('terminal', { ...preferences.terminal, shell: event.target.value })} /></Setting>
              <Setting label="Font size"><input type="number" min="9" max="28" value={preferences.terminal.fontSize} onChange={(event) => patch('terminal', { ...preferences.terminal, fontSize: Number(event.target.value) })} /></Setting>
            </SettingsSection>
            <SettingsSection id="ai" title="Aether AI" description="Aether uses the official Gemini Interactions API. Credentials remain isolated in the Electron main process.">
              <Setting label="Model"><input value={preferences.ai.model} onChange={(event) => patch('ai', { ...preferences.ai, model: event.target.value })} /></Setting>
              <p className="setting-note">Set <code>GEMINI_API_KEY</code> before launching. API keys are never stored in renderer settings or exposed to the editor.</p>
            </SettingsSection>
            <SettingsSection id="application" title="Application" description="Control persistence and notifications.">
              <Setting label="Autosave after delay"><Toggle checked={preferences.autosave === 'afterDelay'} onChange={(checked) => patch('autosave', checked ? 'afterDelay' : 'off')} /></Setting>
              <Setting label="Notifications"><Toggle checked={preferences.notifications} onChange={(checked) => patch('notifications', checked)} /></Setting>
              <Setting label="Restore last workspace"><Toggle checked={preferences.restoreLastWorkspace} onChange={(checked) => patch('restoreLastWorkspace', checked)} /></Setting>
            </SettingsSection>
          </main>
        </div>
      </section>
    </div>
  );
}

function SettingsSection({ id, title, description, children }: { id: string; title: string; description: string; children: React.ReactNode }) {
  return <section id={id} className="settings-section"><h3>{title}</h3><p>{description}</p><div>{children}</div></section>;
}
function Setting({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="setting-row"><span>{label}</span>{children}</label>;
}
function Toggle({ checked, onChange }: { checked: boolean; onChange(checked: boolean): void }) {
  return <button type="button" role="switch" aria-checked={checked} className={`toggle ${checked ? 'is-on' : ''}`} onClick={() => onChange(!checked)}><i /></button>;
}
