# PWADC Security Shift Report EXE Build Kit v2

This build kit packages the PWADC Security Shift Report app as a Windows desktop EXE using Electron.

## Data storage location

The app now stores its primary data file here:

`\\pig-fs\Security\Supervisors\data\pwadc-shift-report-storage.json`

That includes the file-backed replacement for browser local storage, including saved report draft data and the People list.

## Fallback behavior

If the shared drive path is unavailable or not writable, the app falls back to:

`%APPDATA%\PWADC Security Shift Report\pwadc-shift-report-storage.json`

This prevents the app from failing to open if the network share is down, but the data written during fallback will be local to that machine until the share is available again.

## Important operational truth

This is a shared JSON storage model, not a full multi-user database. It is better than browser memory, but two users editing at exactly the same time can still overwrite each other's latest draft data. For shift report use, that is usually acceptable if only the current supervisor/lead is editing the report.

The baked-in People version logic is still included. If the People version in `app/index.html` changes, the app can refresh the stored People list on launch.

## Local build steps

1. Install Node.js 20 LTS.
2. Open PowerShell in this folder.
3. Run:

```powershell
npm install
npm run build:win
```

The portable EXE will be in:

`dist\PWADC-Security-Shift-Report-1.0.1.exe`

## GitHub Actions build

Workflow path:

`.github/workflows/build-windows.yml`

Paste this build kit into a GitHub repository, then run **Build Windows EXE** from the Actions tab. The finished EXE will be uploaded as an artifact.

## Updating the app

Replace:

`app/index.html`

with the newest shift report HTML file.

If People changed, update the baked-in People version in the HTML so existing users receive the new list automatically.

## Recommended deployment

Place the EXE on the shared drive or deploy it to each shift supervisor desktop. Users should run the EXE, not the old HTML file.

Keep exported PDF/Word/Excel reports in the official shift report folder using the SEC-PWADC filename.
