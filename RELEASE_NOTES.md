# Aetherium OS v0.1.2

This release adds an optional, QR-only way to support Aetherium while keeping the complete developer experience free and unrestricted.

## New in this release

- Premium Support Aetherium donation dialog
- Google Pay/UPI QR scanning without displaying or copying a payment address as text
- Support entry points on the welcome screen, command palette, and workbench status bar
- Clear no-subscription, no-recurring-payment, and no-feature-locking language
- Additional Fahd Ahmed creator watermarks on the welcome and donation surfaces
- Responsive donation layout with keyboard and backdrop dismissal

## Also included

- In-app creation and import of text/code files
- Reviewable Aether AI multi-file plans with explicit Apply and Reject controls
- Workspace path, protected-folder, symbolic-link, binary-content, and unsaved-edit safeguards

## Installation

1. Download <code>Aetherium-OS-0.1.2-x64.exe</code>.
2. Run the installer.
3. Windows SmartScreen may display an “Unknown publisher” warning because this preview is not code-signed.
4. To use Aether AI, set <code>GEMINI_API_KEY</code> as a Windows user environment variable and restart Aetherium.

## Verification

- Automated tests: 8 passing
- TypeScript validation: passing
- Donation dialog: app-native visual QA completed
- Platform: Windows x64

## Known preview limitations

- The Windows installer is not code-signed.
- Donations are voluntary and are not connected to accounts, licenses, entitlements, or recurring billing.
- Git integration currently provides status information; staging and commit controls are planned.
