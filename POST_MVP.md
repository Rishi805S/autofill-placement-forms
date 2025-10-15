Post-MVP Roadmap

This short roadmap lists reasonable follow-up items after the current MVP (autofill + preview + local profiles).

1. Per-form preferred profiles
   - Allow users to pin a profile to a specific form URL or domain.
   - UI: small pin icon in the injected floating UI.

2. Undo / granular revert
   - Keep a short undo buffer for the last applied autofill so users can revert quickly.

3. Cloud sync (opt-in)
   - Secure, opt-in sync using end-to-end encryption. Requires server infra or use of browser's sync storage (with consent).

4. Playwright E2E tests
   - Create headful tests that load real Google Forms and run the full preview/apply flow.

5. Better resume handling
   - Add a resume upload/attach UI that stores a local copy or deep-link and tries to match resume-parsed fields.

6. Company-specific mappings
   - Allow community-sourced mappings for common company forms (optional importable mapping packs).

7. Accessibility improvements
   - Ensure injected UI is keyboard-navigable and ARIA-labeled.

8. Analytics (local-only)
   - Keep usage stats locally to show the user how many fields were filled, skipped, etc. No external reporting by default.

9. Extensions & marketplace
   - Prepare screenshots, localized descriptions, and a privacy policy URL for store submission.
