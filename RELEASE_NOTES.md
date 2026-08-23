# Aetherium OS v0.1.1

Aetherium can now bring text and code files into a workspace entirely through its own explorer, while Aether AI can propose safe, reviewable multi-file project changes.

## New in this release

- Create files with any text or code extension from the Aetherium explorer
- Import up to 50 text/code files into the project root or a selected folder
- Aether AI can propose creating or updating as many as 20 project files
- Every Aether file plan shows paths and sizes before writing
- Explicit Apply and Reject controls; AI changes are never automatic
- Open unsaved edits are protected by an additional overwrite warning
- AI writes are confined to the active workspace and blocked from `.git`, dependencies, build output, releases, symbolic links, and binary content

## Installation

1. Download <code>Aetherium-OS-0.1.1-x64.exe</code>.
2. Run the installer.
3. Windows SmartScreen may display an “Unknown publisher” warning because this preview is not code-signed.
4. To use Aether AI, set <code>GEMINI_API_KEY</code> as a Windows user environment variable and restart Aetherium.

## Verification

- Automated tests: 8 passing
- TypeScript validation: passing
- Platform: Windows x64

## Known preview limitations

- The Windows installer is not code-signed.
- Google Pay subscriptions are not included yet; pricing, billing period, QR asset, and secure payment verification still need to be defined.
- Git integration currently provides status information; staging and commit controls are planned.
