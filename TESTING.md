# Placement Form Autofill — Testing & QA Guide

This document provides comprehensive testing procedures for the Placement Form Autofill extension, including automated tests, manual testing workflows, and troubleshooting tips.

## Test Files Overview

The project includes several test files:

- **`sample_form_basic.html`** — Simple test form with common fields (name, email, phone, etc.)
- **`sample_form_advanced.html`** — Complex form with education fields, percentages, CGPA, checkboxes, and more
- **`matcher_test.html`** — Browser-based unit tests for the matching algorithm
- **`tests/` directory** — Jest unit tests for the matcher module

## Setup

### 1. Load the Extension

1. Open `chrome://extensions` in Chrome
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the extension directory: `AutoFill Placement Forms`

### 2. Start Local Server (Recommended)

Running a local server ensures content scripts inject properly:

# Testing (concise)

This file describes the core manual and automated checks for the extension.

Manual checks
- Load the extension at `chrome://extensions` → Developer mode → Load unpacked
- Create or import a profile via the popup
- Open a sample or a real Google Form and run Preview → Apply

Automated checks
- Unit tests (matcher):

```powershell
npm install
npm test
```

Local samples
- Serve the repo root and open `sample_form_basic.html` and `sample_form_advanced.html` for quick verification:

```powershell
py -3 -m http.server 8000
# visit http://localhost:8000/sample_form_basic.html
```

Debugging
- Inspect popup: right-click extension icon → Inspect popup
- Inspect content script: Inspect page → Console (filter for `content.js` logs)
- View stored profiles:

```javascript
chrome.storage.local.get('profilesV1', console.log)
```

If you need the previous full checklist, it is archived in the project history; ask and I will restore specific sections.
- [ ] Edge (Chromium-based)

### Performance Tests

- [ ] Extension loads quickly
- [ ] Popup opens smoothly
- [ ] Autofill completes in < 2 seconds
- [ ] No memory leaks after repeated use

## Live Form Testing

### Google Forms

1. Create a test Google Form or use an existing one
2. Navigate to the form URL
3. Test autofill functionality
4. **Verify**:
   - Content script injects properly
   - Fields are detected
   - Values are filled correctly

### Common Form Types to Test

- Company job application forms
- College placement forms
- Survey forms
- Registration forms

## Troubleshooting

### Issue: Content Script Not Injecting

**Symptoms**: No autofill button appears on the page

**Solutions**:
1. Check "Enable injection" toggle in popup
2. Verify form URL matches `manifest.json` patterns
3. Refresh the page
4. Check browser console for errors
5. Ensure extension is loaded in developer mode

### Issue: Fields Not Matching

**Symptoms**: Preview shows no or few matches

**Solutions**:
1. Check field labels in the form
2. Add aliases to `matcher.js` for custom labels
3. Review matching scores in console
4. Test with `matcher_test.html`

### Issue: Values Not Filling

**Symptoms**: Preview works but fields don't fill

**Solutions**:
1. Check browser console for errors
2. Verify field types are supported
3. Test with simple forms first
4. Check if form uses custom input components

### Issue: Extension Won't Load

**Symptoms**: Extension doesn't appear in Chrome

**Solutions**:
1. Check for manifest errors
2. Verify all files are present
3. Ensure icon files exist
4. Try reloading the extension

## Debugging Tips

### Enable Verbose Logging

Add to content.js or matcher.js:
```javascript
const DEBUG = true;
if (DEBUG) console.log('Debug info:', data);
```

### Inspect Content Script

1. Right-click on the page (not the extension icon)
2. Select "Inspect"
3. Go to Console tab
4. Filter by "content.js" or "autofill"

### Inspect Popup

1. Right-click the extension icon
2. Select "Inspect popup"
3. Console tab shows popup errors

### View Storage

```javascript
// Run in popup console
chrome.storage.local.get('profilesV1', (data) => {
  console.log(data);
});
```

## Test Data

### Sample Profile 1 - Student
```json
{
  "fullName": "Rishi Kumar",
  "email": "rishi@example.com",
  "phone": "+91-9876543210",
  "rollNo": "20CS001",
  "cgpa": "8.5",
  "tenthPercent": "92",
  "twelfthPercent": "88",
  "college": "ABC College of Engineering",
  "branch": "Computer Science",
  "gender": "Male",
  "relocate": "Yes",
  "resumeLink": "https://drive.google.com/resume"
}
```

### Sample Profile 2 - Graduate
```json
{
  "fullName": "Jane Smith",
  "email": "jane.smith@example.com",
  "phone": "+1-555-0123",
  "rollNo": "18ME045",
  "cgpa": "9.2",
  "tenthPercent": "95",
  "twelfthPercent": "94",
  "college": "XYZ Institute of Technology",
  "branch": "Mechanical Engineering",
  "gender": "Female",
  "relocate": "No",
  "resumeLink": "https://linkedin.com/in/janesmith"
}
```

## Reporting Issues

When reporting test failures, include:
1. Steps to reproduce
2. Expected vs actual behavior
3. Browser version
4. Console error messages
5. Screenshots if applicable

## Next Steps

- [ ] Add Playwright E2E tests
- [ ] Set up CI/CD pipeline
- [ ] Add performance benchmarks
- [ ] Create automated regression test suite