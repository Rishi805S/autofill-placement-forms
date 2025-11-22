# Placement Form Autofill

Lightweight MV3 Chrome extension for autofilling placement/recruitment forms (Google Forms) using locally stored profiles.

## Features

- 🎯 **Smart Field Matching**: Intelligent detection of form fields using fuzzy matching
- 👤 **Multiple Profiles**: Create and manage multiple profiles for different purposes
- 🔒 **Privacy First**: All data stored locally on your device, no cloud sync
- 🎨 **Dark/Light Theme**: Customizable interface
- 📋 **Import/Export**: Backup and share profiles as JSON
- ✅ **Preview Before Apply**: Review detected fields before autofilling

## Quick Start

1. **Install the Extension**
   - Open `chrome://extensions/`
   - Enable **Developer mode**
   - Click **Load unpacked** and select this repository folder

2. **Create a Profile**
   - Click the extension icon
   - Click **+ New Profile**
   - Fill in your details and save

3. **Autofill a Form**
   - Open any Google Form
   - Click the extension icon
   - Select your profile
   - Click **Autofill Form**
   - Review the preview and apply

## Project Structure

```
├── manifest.json          # Extension configuration (MV3)
├── popup.html/js          # Profile management UI
├── content.js             # Content script for form detection and filling
├── matcher.js             # Field matching logic
├── icons/                 # Extension icons
├── privacy_policy.html    # Privacy policy
├── profile.schema.json    # Profile data schema
└── example_profile.json   # Example profile template
```

## Documentation

- **[CODE_REVIEW.md](CODE_REVIEW.md)**: In-depth code analysis and architecture
- **[PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md)**: Technical documentation
- **[TESTING.md](TESTING.md)**: Testing guidelines and procedures

---

## Packaging for Chrome Web Store

### Pre-Publication Checklist

#### 1. Update Manifest
Remove development permissions from `manifest.json`:

```json
{
  "host_permissions": [
    "*://docs.google.com/forms/*",
    "*://forms.gle/*"
    // Remove localhost entries for production
  ]
}
```

#### 2. Create Production Build

Use the included PowerShell script:

```powershell
.\scripts\package.ps1 -OutName placement_autofill_v0.1.0.zip
```

Or manually:

```powershell
# Create production folder
$prodFolder = "placement_autofill_production"
New-Item -ItemType Directory -Path $prodFolder

# Copy essential files
Copy-Item manifest.json, popup.html, popup.js, content.js, matcher.js, privacy_policy.html, profile.schema.json, example_profile.json -Destination $prodFolder
Copy-Item icons -Recurse -Destination $prodFolder

# Create ZIP
Compress-Archive -Path "$prodFolder\*" -DestinationPath "placement_autofill_v0.1.0.zip"
```

#### 3. Store Listing Information

**Short Description** (132 characters max):
```
Autofill placement and job application forms with saved profiles. Fast, private, and secure.
```

**Detailed Description**:
```
Placement Form Autofill helps students and job seekers save time by automatically filling out repetitive recruitment forms.

KEY FEATURES:
✓ Multiple profile management
✓ Smart field detection and matching
✓ Preview before applying changes
✓ Import/Export profiles
✓ Dark/Light theme
✓ 100% offline - no data sent to servers

PRIVACY FIRST:
• All data stored locally on your device
• No internet connection required
• No tracking or analytics
• No data collection

PERFECT FOR:
• Campus placement forms
• Job applications
• Google Forms
• Recruitment portals

HOW TO USE:
1. Create a profile with your information
2. Open any placement form
3. Click the autofill button
4. Review and apply your data

Supports: Name, Email, Phone, Roll Number, CGPA, Education details, and more!
```

**Categories**: Productivity, Tools

#### 4. Required Assets

- **Icons**: 128x128 PNG for store listing
- **Screenshots**: Minimum 1, maximum 5 (1280x800 or 1920x1080)
  - Popup interface showing profile management
  - Autofill preview overlay
  - Completed form example
- **Privacy Policy**: Host `privacy_policy.html` on a stable URL

#### 5. Submission Process

1. Register at [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Pay one-time $5 registration fee
3. Upload ZIP file
4. Fill store listing details
5. Submit for review (typically 1-3 business days)

### Files to Include in Production Build

✅ Include:
- `manifest.json`
- `popup.html`, `popup.js`
- `content.js`, `matcher.js`
- `icons/` directory
- `privacy_policy.html`
- `profile.schema.json`
- `example_profile.json`

❌ Exclude:
- `.git/`, `.github/`
- `node_modules/`
- `*.bak` files
- Documentation files (`.md`)
- Test files

---

## Future Roadmap

### Short-Term (v0.2.x)
- **Undo/Revert**: Restore form state before autofill
- **Keyboard Shortcuts**: `Ctrl+Shift+F` for quick autofill
- **Per-Form Profiles**: Pin specific profiles to frequently used forms

### Medium-Term (v0.3.x)
- **Confidence Indicators**: Show match quality for each field
- **Custom Field Mappings**: Add your own field aliases
- **Multi-Language Support**: Hindi, Spanish, French

### Long-Term (v1.0+)
- **AI-Powered Matching**: ML-based field detection
- **Resume Parser**: Import profile from PDF resume
- **Cloud Sync (Opt-In)**: Encrypted backup across devices
- **Accessibility**: Full WCAG 2.1 AA compliance

See full roadmap details in the [GitHub Issues](https://github.com/Rishi805S/autofill-placement-forms/issues) section.

---

## Development

### Local Testing

The extension includes test forms for development:
- Create sample forms using the example_profile.json as reference
- Test on real Google Forms before publishing

### CI/CD

GitHub Actions workflow runs on push/PR to `main`:
- Defined in `.github/workflows/ci.yml`
- Runs linting and validation checks

---

## Privacy & Data

- **Local Storage Only**: All profiles stored in `chrome.storage.local`
- **No Network Calls**: Extension works 100% offline
- **No Tracking**: No analytics or telemetry
- **User Control**: Export, import, or delete data anytime

See [privacy_policy.html](privacy_policy.html) for full details.

---

## Support

- **Issues**: [GitHub Issues](https://github.com/Rishi805S/autofill-placement-forms/issues)
- **Documentation**: See CODE_REVIEW.md and PROJECT_DOCUMENTATION.md
- **Contact**: Create an issue for support

---

## License

MIT License - See LICENSE file for details

---

**Version**: 0.1.0  
**Last Updated**: November 2025
