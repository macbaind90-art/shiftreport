# PWADC Security Shift Report EXE Build Kit v3

This build packages the PWADC Security Shift Report as a Windows desktop app.

## Storage

Primary shared data folder:

`\\pig-fs\Security\Supervisors\data`

Primary shared storage file:

`\\pig-fs\Security\Supervisors\data\pwadc-shift-report-storage.json`

Submitted/exported report PDFs created through the desktop email workflow are saved to:

`\\pig-fs\Security\Supervisors\data\reports`

If the network path is unavailable or not writable, the app falls back to the user's local app data folder.

## Outlook email with PDF attachment

The desktop app can create the shift report PDF, save it to the reports folder, open Outlook, create the routed email draft, and attach the PDF automatically.

This requires:

- Windows
- Microsoft Outlook desktop installed
- Outlook profile configured for the user
- PowerShell enabled enough to run local COM automation

The app does not silently send the email. It creates the draft and displays it for review. The supervisor still sends it.

## Build locally

```powershell
npm install
npm run build:win
```

The portable EXE will be created in `dist`.

## GitHub Actions

Workflow path:

`.github/workflows/build-windows.yml`


## v4 email behavior

Default send mode is now **Save PDF + Open Email**. This saves the PDF to the shared reports folder, copies the PDF path to the clipboard when possible, then opens the workstation's default mail app. This matches the Outlook/profile Windows already uses correctly.

The **Classic Outlook Attach** button still uses Outlook COM automation and can auto-attach the PDF, but it depends on classic Outlook opening the correct profile. If that workstation opens the wrong Outlook instance, use the default send mode.

