# Placement Form Autofill

A Chrome extension that automates filling out placement and recruitment forms (especially Google Forms) using saved user profiles.

## Overview

This Chrome extension (Manifest V3) helps students and job seekers save time by automatically filling out repetitive placement forms. Store multiple profiles locally and autofill forms with a single click.

### Key Features

- **Multi-Profile Management**: Create, edit, and manage multiple profiles
- **Smart Field Matching**: Intelligent algorithm matches form fields to your profile data
- **Preview Before Apply**: Review detected fields before filling the form
- **Dark/Light Theme**: Toggle between themes for comfortable viewing
- **Import/Export**: Backup and transfer profiles as JSON files
- **Privacy-First**: All data stored locally, no external servers

## Project Structure

```
├── manifest.json              # Extension configuration (MV3)
├── popup.html                 # Profile management interface
├── popup.js                   # Popup logic and UI handlers
├── content.js                 # Form detection and autofill logic
├── matcher.js                 # Field matching algorithm
├── profile.schema.json        # Profile data schema
├── example_profile.json       # Sample profile
├── sample_form_basic.html     # Basic test form
├── sample_form_advanced.html  # Advanced test form
├── matcher_test.html          # Matcher unit tests
├── privacy_policy.html        # Privacy policy
└── icons/                     # Extension icons (PNG & SVG)
```

## Quick Start

### Installation (Developer Mode)

1. **Open Chrome Extensions**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)

2. **Load the Extension**
   - Click "Load unpacked"
   - Select the `AutoFill Placement Forms` folder

3. **Create Your First Profile**
   - Click the extension icon in the Chrome toolbar
   - Click "+ New Profile" button
   - Fill in your information (name, email, phone, education details, etc.)
   - Click "Save Profile"

4. **Use the Extension**
   - Open any Google Form or supported placement form
   - A floating autofill button appears on the page
   - Click it to preview and apply your profile data

### Supported Fields

The extension can autofill the following fields:
- **Personal**: Full name, email, phone number, gender
- **Education**: Roll number, CGPA, 10th percentage, 12th percentage, college name, branch/department
- **Professional**: Resume link, relocation preference
- **Custom**: Additional fields through smart matching

## How It Works

### Architecture

1. **Profile Storage**
   - Profiles saved in `chrome.storage.local` under the key `profilesV1`
   - Data structure: `{ profileName: { fullName, email, phone, ... } }`
   - All data stored locally—no cloud uploads

2. **Field Matching**
   - `matcher.js` normalizes question text and scores matches
   - Uses keyword aliases and pattern detection
   - Supports flexible matching for various form formats

3. **Content Injection**
   - `content.js` injects a floating UI on supported pages
   - Detects form fields and their labels
   - Shows preview overlay before applying values
   - Fills inputs, selects, radios, and checkboxes

4. **Smart Matching Algorithm**
   - Normalizes text (removes punctuation, case-insensitive)
   - Scores matches based on keyword overlap
   - Handles aliases (e.g., "mobile" = "phone")
   - Pattern detection for specific field types

## Privacy & Security

- ✅ **100% Local Storage**: All data stored on your device using Chrome's storage API
- ✅ **No Network Requests**: Extension contains no server communication code
- ✅ **No Tracking**: No analytics, no telemetry, no data collection
- ✅ **Open Source**: Code is transparent and auditable
- ⚠️ **Host Permissions**: Required only for Google Forms and localhost (for testing)
## Testing

### Automated Tests

The extension includes Jest unit tests for the matcher algorithm:

```powershell
# Install dependencies
npm install

# Run tests
npm test
```

### Manual Testing

#### Using Sample Forms

1. **Start a local server** (recommended for testing):
   ```powershell
   # From project directory
   python -m http.server 8000
   # or
   py -3 -m http.server 8000
   ```

2. **Open test forms**:
   - Navigate to `http://localhost:8000/sample_form_basic.html`
   - Or open `http://localhost:8000/sample_form_advanced.html`

3. **Test the flow**:
   - Create a profile in the extension popup
   - Click the injected autofill button on the form
   - Review the preview overlay
   - Click "Apply" to fill the form

#### Using Live Forms

- Test with real Google Forms to ensure compatibility
- The extension should inject on any `docs.google.com/forms/*` URL

For detailed testing procedures, see `TESTING.md`.

## Troubleshooting

### Common Issues

**Extension doesn't inject on forms**
- Check if "Enable injection" toggle is ON in the popup
- Verify the form URL matches patterns in `manifest.json`
- Refresh the page after loading the extension

**Autofill button not visible**
- Ensure you're on a supported form (Google Forms or test forms)
- Check browser console for errors
- Try reloading the extension

**Fields not matching correctly**
- The matcher uses keyword-based matching
- Some custom/unusual field labels may not match
- You can extend `matcher.js` with more aliases

**File:// URLs not working**
- Use a local HTTP server instead (see Testing section)
- Chrome restricts content script injection on file:// URLs

## Development

### Extending the Matcher

To add support for new field types:

1. Edit `matcher.js`
2. Add aliases to the `aliases` object
3. Update pattern detection in `detectPatterns()`
4. Test with `matcher_test.html`

### Adding Profile Fields

1. Update `profile.schema.json`
2. Add UI fields in `popup.html`
3. Update form handlers in `popup.js`
4. Add matching logic in `matcher.js`

## Packaging for Distribution

See `PACKAGING.md` for the complete Chrome Web Store submission checklist.

**Quick checklist:**
- ✅ Icons prepared (48x48 and 128x128 PNG)
- ✅ Privacy policy included
- ⚠️ Remove localhost permissions before production
- ⚠️ Test thoroughly with real forms
- ⚠️ Prepare screenshots and store listing

## Future Enhancements

See `POST_MVP.md` for the complete roadmap. Planned features include:
- Per-form preferred profiles
- Undo/revert autofill
- Cloud sync (opt-in)
- Playwright E2E tests
- Better resume handling
- Company-specific mappings

## Contributing

Contributions are welcome! To contribute:
1. Test the extension thoroughly
2. Document any bugs or feature requests
3. Submit clear, well-documented code
4. Follow the existing code style

## License

[Specify your license here]

## Support

For issues, questions, or feature requests, please open an issue in the repository.
