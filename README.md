# Placement Form Autofill

Lightweight MV3 Chrome extension prototype for autofilling placement/recruitment forms (Google Forms and similar) using a local profile stored in `chrome.storage.local`.

Contents
- `manifest.json` — extension manifest (MV3)
- `popup.html`, `popup.js` — profile create/import/export UI
- `content.js` — content script that detects questions, shows a preview, and applies values
- `matcher.js` — matching helpers and tests
- `profile.schema.json`, `example_profile.json` — profile schema and example
- `sample_form_basic.html`, `sample_form_advanced.html` — local samples for manual testing

Quick start
1. Open `chrome://extensions/`
2. Enable Developer mode
3. Click Load unpacked and select this repository folder
4. Open the extension popup, create or import a profile
5. Open a form (or the sample pages) and run the preview/apply flow

CI
- This repository includes a GitHub Actions workflow that runs unit tests on push/PR to `main`.
- The workflow is defined at `.github/workflows/ci.yml`.

Packaging
- Use the included PowerShell script to create a production zip on Windows:

```powershell
cd 'C:\Users\Rishi\Documents\AutoFill Placement Forms'
.
\scripts\package.ps1 -OutName placement_autofill_v0.1.0.zip
```

Note: The script copies core files and `icons/` into a temporary build folder and zips them.

Testing
- Unit tests (Jest):

```powershell
npm install
npm test
```

- Manual testing: serve the sample pages and open them in Chrome (recommended):

```powershell
py -3 -m http.server 8000
# visit http://localhost:8000/sample_form_basic.html
```

Notes
- Profiles are stored locally in `chrome.storage.local` (key `profilesV1`). No network calls by default.
- See `PACKAGING.md` for publishing guidance and `POST_MVP.md` for future ideas.

If you want, I can tidy further: replace graduation year text input with a dropdown of common years, add AF_DEBUG mode, or create a small test harness for matcher logic.

---
Updated: concise docs and removed temporary files during a cleanup pass.
```
