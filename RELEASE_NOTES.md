# Aetherium OS v0.1.3

This release fixes file and project creation controls that could appear unresponsive in the installed Electron application.

## Fixed and improved

- Replaced unsupported browser-style prompts with native Aetherium dialogs
- Added clearly labeled New File, Folder, and Import buttons to the explorer
- Added quick file types for Text, Markdown, JavaScript, TypeScript, React, Python, HTML, CSS, JSON, Java, C++, C#, Rust, Go, and SQL
- Any custom text or code extension can still be entered manually
- Newly created files open in Monaco immediately
- Rename and Create Project now use reliable in-app dialogs too
- Added a dedicated Aether AI “Create project files” starter
- Aether file plans remain review-only until Apply changes is selected

## Also included

- Optional QR-only donations with no subscription or feature locking
- Fahd Ahmed creator watermarks
- Workspace boundaries and AI file-write safeguards

## Installation

1. Download <code>Aetherium-OS-0.1.3-x64.exe</code>.
2. Run the installer. It replaces the previous preview installation.
3. Windows SmartScreen may display an “Unknown publisher” warning because this preview is not code-signed.
4. To use Aether AI, set <code>GEMINI_API_KEY</code> and restart Aetherium.

## Verification

- Automated tests: 8 passing
- TypeScript validation: passing
- New File dialog: app-native visual QA completed
- Platform: Windows x64
