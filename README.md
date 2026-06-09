# PWADC Security Shift Report EXE Build Kit v6

This build packages the PWADC Security Shift Report as a Windows desktop app.

## Storage

Primary shared data folder:

`\\pig-fs\Security\Supervisors\data`

Primary shared storage file:

`\\pig-fs\Security\Supervisors\data\pwadc-shift-report-storage.json`

If the network path is unavailable or not writable, the app falls back to the user's local app data folder.

## PDF saving behavior

Report PDFs now save to the current Windows user's Downloads folder only.

Example:

`C:\Users\<username>\Downloads\SEC-PWADC-2026-05-29-1.pdf`

There is no secondary/shared reports save location. Supervisors are responsible for moving the PDF where it belongs after attaching/sending it.

## Email behavior

Default send mode is **Save PDF to Downloads + Open Email**. This saves the PDF to Downloads, copies the PDF path to the clipboard when possible, then opens the workstation's default mail app. This matches the Outlook/profile Windows already uses correctly.

The **Classic Outlook Attach** button still uses Outlook COM automation and can auto-attach the PDF, but it depends on classic Outlook opening the correct profile. If that workstation opens the wrong Outlook instance, use the default send mode.

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
