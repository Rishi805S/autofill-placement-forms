# Packaging Guide — Placement Form Autofill

This comprehensive guide outlines the steps required to package and publish the extension to the Chrome Web Store.

## Pre-Publication Checklist

### 1. Assets & Resources

#### Icons
- [x] **48x48 PNG icon** — Located at `icons/icon48_prod.png`
- [x] **128x128 PNG icon** — Located at `icons/icon128_prod.png`
- [x] Icons referenced correctly in `manifest.json`

#### Screenshots
- [ ] **Popup interface** (1280x800 or 1920x1080 recommended)
  - Show profile management interface
  - Display theme toggle
  - Show multiple profiles
- [ ] **Autofill in action** 
  - Form with autofill button visible
  - Preview overlay showing detected fields
- [ ] **Form filled**
  - Completed form with filled data
- [ ] **Optional**: GIF or video demo (< 5MB)

### 2. Manifest Validation

#### Required Checks
- [x] **Manifest Version 3** — Currently using MV3
- [x] **Minimum Permissions** — Using `storage`, `activeTab`, `scripting`
- [ ] **Remove Development Permissions**
  - Remove `http://localhost/*`
  - Remove `http://127.0.0.1/*`
  - Remove `https://localhost/*`
  - Remove `https://127.0.0.1/*`
- [x] **Production Host Permissions**
  - `*://docs.google.com/forms/*`
  - `*://forms.gle/*`

#### Manifest Cleanup Script

Before packaging, update `manifest.json`:

```json
{
  "host_permissions": [
    "*://docs.google.com/forms/*",
    "*://forms.gle/*"
  ]
}
```

### 3. Privacy & Data Handling

#### Privacy Policy
- [x] **Local Privacy Policy** — `privacy_policy.html` included
- [ ] **Host Online** — Upload to stable URL (GitHub Pages, etc.)
- [ ] **Link in manifest** (if required by Chrome Web Store)

#### Privacy Policy Requirements
Your privacy policy must clearly state:
1. What data is collected (profile information)
2. Where it's stored (locally on user's device)
3. No third-party data sharing
4. No analytics or tracking
5. User control over data (export/delete)

### 4. Store Listing Preparation

#### Short Description (132 characters max)
```
Autofill placement and job application forms with saved profiles. Fast, private, and secure.
```

#### Detailed Description

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

Supports: Name, Email, Phone, Roll Number, CGPA, Education details, Resume links, and more!
```

#### Categories
- Primary: **Productivity**
- Secondary: **Tools**

#### Language
- **English** (add more as needed)

### 5. Quality Assurance

#### Testing Checklist
- [ ] Run all unit tests: `npm test`
- [ ] Test with `sample_form_basic.html`
- [ ] Test with `sample_form_advanced.html`
- [ ] Test with real Google Forms (minimum 3 different forms)
- [ ] Test profile import/export
- [ ] Test dark/light theme
- [ ] Test on fresh Chrome profile (no cached data)
- [ ] Test with multiple profiles
- [ ] Verify no console errors
- [ ] Check memory usage (< 50MB)
- [ ] Test load time (< 1 second)

#### Browser Compatibility
- [ ] Chrome (latest version)
- [ ] Chrome (previous version)
- [ ] Microsoft Edge (Chromium)

### 6. Build Production Package

#### Step-by-Step

1. **Clean the directory**
   ```powershell
   # Remove development files
   Remove-Item node_modules -Recurse -Force
   Remove-Item tests -Recurse -Force
   Remove-Item .git -Recurse -Force
   Remove-Item *.bak
   Remove-Item *.zip
   ```

2. **Update manifest.json**
   - Remove localhost permissions
   - Verify version number
   - Double-check icons paths

3. **Create ZIP file**
   ```powershell
   # Create a production copy
   $prodFolder = "placement_autofill_production"
   New-Item -ItemType Directory -Path $prodFolder
   
   # Copy essential files
   Copy-Item manifest.json, popup.html, popup.js, content.js, matcher.js, privacy_policy.html, profile.schema.json, example_profile.json -Destination $prodFolder
   Copy-Item icons -Recurse -Destination $prodFolder
   
   # Create ZIP
   Compress-Archive -Path "$prodFolder\*" -DestinationPath "placement_autofill_v0.1.0.zip"
   ```

4. **Verify the ZIP**
   - Extract to a test folder
   - Load as unpacked extension
   - Test all functionality
   - No errors in console

#### Files to Include
- ✅ `manifest.json`
- ✅ `popup.html`
- ✅ `popup.js`
- ✅ `content.js`
- ✅ `matcher.js`
- ✅ `icons/` directory
- ✅ `privacy_policy.html`
- ✅ `profile.schema.json`
- ✅ `example_profile.json`

#### Files to Exclude
- ❌ `node_modules/`
- ❌ `tests/`
- ❌ `.git/`
- ❌ `*.bak` files
- ❌ `TESTING.md`, `POST_MVP.md`, `PACKAGING.md`
- ❌ `sample_form_*.html`
- ❌ `matcher_test.html`
- ❌ `package.json`, `package-lock.json`

### 7. Chrome Web Store Submission

#### Developer Dashboard Setup
1. **Register as Developer**
   - Visit: https://chrome.google.com/webstore/devconsole
   - Pay one-time $5 registration fee

2. **Upload Extension**
   - Click "New Item"
   - Upload your ZIP file
   - Wait for automated review (few minutes)

3. **Fill Store Listing**
   - Product name: **Placement Form Autofill**
   - Short description (see above)
   - Detailed description (see above)
   - Category: Productivity
   - Language: English
   - Upload icons (128x128, 440x280 for store tile)
   - Upload screenshots (minimum 1, maximum 5)
   - Privacy policy URL
   - Support email/website

4. **Distribution Settings**
   - Visibility: Public / Unlisted / Private
   - Regions: All regions (or select specific)
   - Pricing: Free

5. **Submit for Review**
   - Review all information
   - Submit
   - Wait for approval (typically 1-3 business days)

### 8. Post-Publication

#### Monitor
- [ ] Check reviews and ratings
- [ ] Monitor error reports in dashboard
- [ ] Track installation count
- [ ] Respond to user feedback

#### Updates
- [ ] Increment version in `manifest.json`
- [ ] Document changes
- [ ] Follow same packaging process
- [ ] Upload updated ZIP

## Common Rejection Reasons & Solutions

### Permission Justification
**Issue**: Store reviewers ask why you need certain permissions

**Solution**: Clearly document:
- `storage`: Save user profiles locally
- `activeTab`: Access current tab to fill forms
- `scripting`: Inject content scripts for form filling
- `host_permissions`: Required to access Google Forms

### Privacy Policy
**Issue**: Privacy policy is incomplete or not accessible

**Solution**: Host on a stable URL, ensure it covers:
- What data is collected
- How it's used
- Where it's stored
- User rights

### Functionality Issues
**Issue**: Extension doesn't work during review

**Solution**: 
- Include test instructions
- Provide sample profile JSON
- Link to a test form
- Record a demo video

## Version History Template

### v0.1.0 (Initial Release)
- Profile management (create, edit, delete)
- Autofill for Google Forms
- Smart field matching
- Preview before applying
- Import/Export profiles
- Dark/Light theme

## Support Resources

- Documentation: [Link to README]
- Privacy Policy: [Link to policy]
- Report Issues: [Link to issue tracker]
- Contact: [Your email]

## Additional Notes

- Chrome Web Store review typically takes 1-3 business days
- Major updates may require re-review
- Keep extension under 100MB (current size: ~500KB)
- Monitor dashboard for policy updates
- Respond to user reviews to improve ratings
