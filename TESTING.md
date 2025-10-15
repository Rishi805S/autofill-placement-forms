Placement Form Autofill — Testing & QA

This document describes how to run manual tests and the matcher browser tests without requiring npm. It includes sample pages you can open locally and steps to exercise the extension behaviors.

Files added for testing
- `sample_form_basic.html` — A small Google-Forms-like page with text inputs, radio buttons, selects, and textarea.
- `sample_form_advanced.html` — More fields: percentage, CGPA, checkboxes, resume link, etc.
- `matcher_test.html` — (already in repository) Browser-run matcher unit-like tests.

Quick manual test (no server required)
1. Open `chrome://extensions` in Chrome and enable "Developer mode".
2. Click "Load unpacked" and select the extension directory `c:\Users\Rishi\Documents\AutoFill Placement Forms`.
3. Open the file `sample_form_basic.html` in Chrome. Use File → Open File or drag-and-drop the file into the browser. Note: content scripts run on file:// URLs only if the extension has host permissions — instead, host the file using a quick local server if the content script doesn't inject automatically (see next section).

Running with a simple local server (recommended)
- On Windows PowerShell, run:

```powershell
# from the workspace root
cd 'C:\Users\Rishi\Documents\AutoFill Placement Forms'
# Python 3 simple HTTP server
py -3 -m http.server 8000
# or if python launcher not installed
python -m http.server 8000
```

- Open `http://localhost:8000/sample_form_basic.html` in Chrome.
- The extension's content script should auto-inject a floating Autofill control in the top-right of the page.

Testing steps
- With a saved profile in the popup (load or create one), click the injected Autofill button.
- A preview overlay should appear listing detected fields and proposed values. Review and click "Apply selected".
- Observe that text inputs/textarea are populated and radio/select/checkboxes are selected where appropriate. Fields that were skipped due to low confidence remain unchanged.

Matcher tests
- Open `matcher_test.html` in the browser (e.g. http://localhost:8000/matcher_test.html).
- The page runs matcher cases and shows pass/fail counts and individual scores. Use it to iterate on `matcher.js`.

Notes & troubleshooting
- If the injected UI doesn't appear on file:// paths, run a local server as described above.
- If the extension doesn't load, ensure `manifest.json` has no invalid icon entries and that you selected the correct directory.
- For more advanced automated testing, we can add Jest + Playwright in a follow-up step (requires npm).

Next steps
- Convert `matcher_test.html` to a Jest unit suite if you'd like automated runs. I can scaffold `package.json` and a minimal test runner when you allow using npm locally.

Contact
- If tests fail, paste the console logs or a screenshot and I will triage the matching behavior and update heuristics in `matcher.js`.