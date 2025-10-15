# Placement Form Autofill — scaffold

Autofill placement and recruitment forms (Google Forms and similar) from a local, user-managed profile.

This repository contains an MV3 Chrome extension prototype that stores one or more placement profiles in `chrome.storage.local` and injects a small UI on supported form pages to preview and apply autofill values.
- Core files
- `manifest.json` — extension manifest (MV3)
- `popup.html`, `popup.js` — profile management UI (save/import/export/delete)
- `content.js` — content script that injects UI, computes matches, and applies values
- `matcher.js` — matching engine used to map question text to profile fields (also has Jest tests)
 - `profile.schema.json`, `example_profile.json` — profile schema and example profile
 - `sample_form_basic.html`, `sample_form_advanced.html` — local sample pages for manual testing

Quick start — load the extension locally
1. Open chrome://extensions/
2. Enable "Developer mode"
3. Click "Load unpacked" and select this folder: `AutoFill Placement Forms`
4. Click the extension icon to open the popup and create or import a profile.
5. Open a Google Form (or `sample_form_*.html`) and use the injected floating UI to preview and apply autofill.
Important privacy note
- All profiles and data are stored locally using `chrome.storage.local` under the key `profilesV1` by default.
- The extension contains no network code and does not upload or share your profile data. If you later add optional cloud sync, it will be opt-in and clearly documented.
How it works (high level)
- Profiles: saved in the popup, can be exported/imported as JSON. `profilesV1` stores a map of name → profile object.
- Matcher: `matcher.js` normalizes question labels and scores candidate mappings against profile fields (name, email, phone, rollNo, cgpa, tenthPercent, twelfthPercent, resumeLink, college, branch, gender, relocate, etc.).
- Injection: `content.js` injects a floating UI on supported pages (Google Forms and local samples), shows a preview overlay of detected fields and values, and applies accepted values to inputs/selects/radios/checkboxes. A global toggle in the popup (`injectionEnabled`) controls runtime injection.
Testing
- Unit tests: run the matcher Jest tests (requires Node/npm). From the project folder run:

```powershell
npm install
npm test
```

 - Manual testing: open `sample_form_basic.html` and `sample_form_advanced.html` in your browser (file:// or served via a small local server). During development the manifest previously included localhost host permissions; those have been removed for production. Serve the samples via a small local server if needed.

Packaging & Chrome Web Store checklist
See `PACKAGING.md` for the full checklist. Key steps:
- Provide production PNG icons for 48x48 and 128x128 under `icons/` and update `manifest.json` to reference the PNGs.
- Remove local-only host permissions (`localhost`, `127.0.0.1`) from `manifest.json`.
- Zip the extension folder contents (not the parent folder) and upload to the Chrome Web Store Developer Dashboard. Include a hosted Privacy Policy URL that states data is stored locally by default.
 - Zip the extension folder contents (not the parent folder) and upload to the Chrome Web Store Developer Dashboard. Include a hosted Privacy Policy URL that states data is stored locally by default. A local copy of the privacy policy is in `privacy_policy.html`.

Developer notes & next steps
- The matcher is modular and exported for Jest. You can extend `matcher.js` with more aliases, company-specific heuristics, and higher-confidence patterns.
- Optional future features: per-form preferred profiles, undo autofill, Playwright E2E tests, optional cloud sync (opt-in), and a GitHub Actions workflow to run tests on push.

Troubleshooting
- If injection doesn't appear on a form, check the popup's "Enable injection" toggle and ensure `manifest.json` host permissions match the page URL.
- For local sample pages, either serve them from `http://localhost:PORT/` or update `manifest.json` during dev to include `file:///*` (not recommended for production).

Contact
- If you'd like me to prepare production assets (PNG icons), remove localhost host permissions, and produce a zipped extension ready for upload, tell me and I'll do it.

```

Next recommended steps:
- Implement robust `matcher.js` with aliases and scoring
- Add tests for matcher logic (Jest)
- Add preview overlay and better field detection
