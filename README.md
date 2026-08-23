<p align="center">
  <img src="assets/aetherium-wordmark.png" alt="Aetherium OS" width="680">
</p>

<p align="center">
  A focused, Gemini-powered developer environment for Windows.
</p>

<p align="center">
  <a href="https://github.com/F4hdAhmed/AetheriumOS-v0.1.0/releases/latest">Download latest release</a>
  ·
  <a href="#development">Build from source</a>
  ·
  Created by Fahd Ahmed
</p>

![Aetherium OS workbench](assets/aetherium-workbench.png)

## What is Aetherium?

Aetherium OS brings project navigation, professional code editing, terminal sessions, search, Git awareness, persistent settings, and contextual AI assistance into one premium desktop workspace.

### Included in v0.1.0

- Monaco code editor with local language workers
- Workspace explorer and project-wide search
- Integrated terminal and run/build controls
- Aether AI powered by the Gemini streaming Interactions API
- Active-file, selection, project-map, and terminal context controls
- Git branch and change status
- Command palette, keyboard shortcuts, themes, and persistent preferences
- Secure Electron process boundary and workspace path validation

## Download

Download the Windows x64 installer from [GitHub Releases](https://github.com/F4hdAhmed/AetheriumOS-v0.1.0/releases).

> The v0.1.0 installer is not code-signed yet. Windows SmartScreen may show an “Unknown publisher” warning.

## Gemini configuration

Create a Gemini API key in Google AI Studio, then save it as a Windows user environment variable:

~~~cmd
setx GEMINI_API_KEY "YOUR_ACTUAL_GEMINI_KEY"
~~~

Restart Windows or sign out and back in before opening Aetherium. The default model is <code>gemini-3.5-flash</code> and can be changed in **Settings → Aether AI**.

The renderer never receives the API key. Aether sends requests only from Electron's main process to <code>generativelanguage.googleapis.com</code>.

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| Ctrl+P | Quick open |
| Ctrl+Shift+P | Command palette |
| Ctrl+O | Open folder |
| Ctrl+S | Save |
| Ctrl+Shift+S | Save all |
| Ctrl+Backtick | Toggle terminal |
| Ctrl+B | Toggle sidebar |

## Development

Requirements:

- Windows 10 or Windows 11
- Node.js 22 or newer
- npm 10 or newer
- Git available on PATH

~~~powershell
npm install
npm run dev
~~~

Verification and packaging:

~~~powershell
npm test
npm run build
npm run dist
~~~

## Security

- Electron context isolation and renderer sandboxing are enabled.
- Filesystem paths are validated against the active workspace.
- Deleted items are moved to the operating system Recycle Bin.
- AI output is never executed automatically.
- Gemini credentials remain in the Electron main process.
- The AI endpoint is pinned to Google's official Generative Language API.
- External links cannot create renderer windows.

## Status

Aetherium OS v0.1.0 is a developer preview. The next release targets code signing, automatic updates, a fuller Git interface, and the extension runtime.
