# Packaging checklist — Placement Form Autofill

This file lists the steps to prepare the extension for the Chrome Web Store. Follow the checklist and ensure all items are complete before publishing.

1. Prepare assets
   - [ ] App icons: provide 128x128 and 48x48 PNGs (SVGs may work but PNG is safer). Place in `icons/` and reference in `manifest.json`.
   - [ ] At least one screenshot (1280x800 recommended) showing the popup and the injected preview overlay.

2. Validate manifest
   - [ ] `manifest.json` must be version 3 and include only the minimum permissions required (`storage`, `activeTab`, `scripting`).
   - [ ] Limit `host_permissions` to the domains you need (docs.google.com/forms/* and forms.gle/*). Remove localhost entries for production.

3. Privacy & Data Handling
   - [ ] Add a privacy policy (host it on a stable URL) that explains: data is stored locally, no default uploads, optional cloud sync requires explicit opt-in.
   - [ ] Include a short privacy blurb in the store listing and README.

4. Prepare README & Store listing
   - [ ] Clear description, features list, screenshots, and contact/support info.
   - [ ] Short usage instructions (how to load and use the extension).

5. QA and automated tests
   - [ ] Run `npm test` to validate matcher behavior.
   - [ ] Manually test with sample forms and with a few live Google Forms to ensure injection and preview work correctly.

6. Build package
   - [ ] Remove local-only host permissions from `manifest.json`.
   - [ ] Zip the extension folder contents (not the parent folder).

7. Submission
   - [ ] Sign in to Chrome Web Store Developer Dashboard and upload the ZIP.
   - [ ] Fill the store listing, upload icons/screenshots, supply privacy policy URL.
   - [ ] Publish as unlisted/paid as per your preference.

Notes
- If you plan to support cloud-sync later, you'll need to add a server-side privacy and security review.
- Test the produced ZIP locally by loading it as unpacked in `chrome://extensions` before upload.

---
If you'd like, I can: 
- create PNG icons from existing SVG placeholders,
- remove `localhost` host permissions and produce a production-ready ZIP,
- scaffold a GitHub Actions workflow to run `npm test` on push.
