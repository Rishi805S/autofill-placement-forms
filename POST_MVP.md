# Post-MVP Roadmap

This document outlines planned features and improvements for the Placement Form Autofill extension after the initial release.

## Current Status (v0.1.0)

✅ **Completed Features:**
- Multi-profile management (create, edit, delete)
- Smart field matching with keyword aliases
- Preview before applying changes
- Import/Export profiles as JSON
- Dark/Light theme support
- Floating UI injection on forms
- Support for text, select, radio, and checkbox fields
- Local-first data storage

## Short-Term Goals (v0.2.x)

### 1. Enhanced User Experience

#### 1.1 Per-Form Preferred Profiles
**Priority**: High  
**Effort**: Medium

- Allow users to pin a specific profile to a form URL or domain
- Auto-select the pinned profile when visiting that form
- UI: Small pin icon in profile cards and injected UI
- Storage: Map of `{ formDomain: profileName }`

**Benefits**: 
- Reduces clicks for frequently used forms
- Prevents accidental wrong profile selection

#### 1.2 Undo/Revert Functionality
**Priority**: High  
**Effort**: Low

- Store form state before autofill
- Add "Undo" button after applying changes
- Keep history for the last 3 autofill actions
- Clear history when navigating away

**Benefits**:
- Recovery from accidental autofill
- Better user confidence

#### 1.3 Keyboard Shortcuts
**Priority**: Medium  
**Effort**: Low

- `Ctrl+Shift+F`: Open autofill preview
- `Ctrl+Shift+P`: Open profile manager
- `Alt+A`: Apply autofill (when preview is open)
- Make all UI keyboard-navigable

**Benefits**:
- Power user efficiency
- Accessibility improvement

## Medium-Term Goals (v0.3.x)

### 2. Advanced Features

#### 2.1 Field Confidence Indicators
**Priority**: Medium  
**Effort**: Medium

- Show confidence score (0-100%) for each match
- Color-code matches (green: high, yellow: medium, red: low)
- Allow users to override low-confidence matches
- Add "Explain match" tooltip

**Benefits**:
- Transparency in matching algorithm
- Better user trust

#### 2.2 Custom Field Mappings
**Priority**: Medium  
**Effort**: High

- Allow users to add custom aliases for fields
- Per-form custom mappings
- Export/Import mapping packs
- Community-shared mappings

**Benefits**:
- Support for unusual form layouts
- Company-specific terminology

#### 2.3 Multi-Language Support
**Priority**: Low  
**Effort**: Medium

- Internationalize UI strings
- Support for non-English form fields
- Language-specific matching aliases
- Initial languages: Hindi, Spanish, French

**Benefits**:
- Broader user base
- International student support

### 3. Data & Privacy

#### 3.1 Cloud Sync (Opt-In)
**Priority**: Low  
**Effort**: Very High

- Optional encrypted cloud backup
- End-to-end encryption
- Chrome Sync API integration (simpler)
- OR custom server with authentication
- Clear consent UI

**Technical Requirements**:
- Encryption library (e.g., Web Crypto API)
- Backend server (if not using Chrome Sync)
- Privacy policy updates
- Security audit

**Benefits**:
- Sync across devices
- Backup and restore

#### 3.2 Profile Templates
**Priority**: Medium  
**Effort**: Low

- Pre-built profile templates (e.g., "Student", "Professional")
- Quick-start for new users
- Save custom templates
- Share templates (anonymized)

**Benefits**:
- Faster onboarding
- Best practice sharing

#### 3.3 Data Export Formats
**Priority**: Low  
**Effort**: Low

- Support CSV export
- Support PDF generation (resume-like)
- Batch export all profiles
- Scheduled auto-backup

## Long-Term Goals (v1.0+)

### 4. Intelligence & Automation

#### 4.1 AI-Powered Matching
**Priority**: Low  
**Effort**: Very High

- Use ML for better field detection
- Learn from user corrections
- Semantic matching (beyond keywords)
- Handle complex multi-part questions

**Technical Approach**:
- TensorFlow.js for client-side ML
- Train on anonymized form data
- Federated learning (optional)

#### 4.2 Form Change Detection
**Priority**: Low  
**Effort**: Medium

- Detect when forms are updated
- Alert users to new fields
- Suggest profile updates
- Track form version history

#### 4.3 Auto-Fill Suggestions
**Priority**: Low  
**Effort**: High

- Suggest profile updates based on new forms
- Detect missing fields in profile
- Smart defaults based on patterns
- Pre-fill new forms without preview (optional)

### 5. Integration & Ecosystem

#### 5.1 Resume Parser Integration
**Priority**: Medium  
**Effort**: High

- Parse resume PDFs to create profiles
- Extract structured data
- Support multiple resume formats
- Update profiles from resume

**Technical Considerations**:
- PDF.js for parsing
- OCR for scanned resumes
- Privacy concerns (process locally)

#### 5.2 LinkedIn Integration
**Priority**: Low  
**Effort**: Very High

- Import profile from LinkedIn
- Sync changes (opt-in)
- OAuth authentication
- Rate limit handling

**Challenges**:
- LinkedIn API restrictions
- Privacy implications
- Terms of service compliance

#### 5.3 Company-Specific Plugins
**Priority**: Low  
**Effort**: High

- Plugin architecture for custom forms
- Community marketplace for plugins
- Verified plugin system
- Safe sandbox execution

### 6. Testing & Quality

#### 6.1 Automated Testing
**Priority**: High  
**Effort**: High

- Playwright E2E tests for real forms
- Visual regression testing
- Performance benchmarks
- Continuous integration

**Benefits**:
- Catch regressions early
- Confident releases
- Quality assurance

#### 6.2 Error Reporting
**Priority**: Medium  
**Effort**: Medium

- Optional error telemetry
- Anonymous usage statistics
- Crash reporting
- User-controlled opt-in

**Benefits**:
- Faster bug fixes
- Data-driven improvements

### 7. Accessibility & Compliance

#### 7.1 Full Accessibility Support
**Priority**: High  
**Effort**: Medium

- WCAG 2.1 AA compliance
- Screen reader optimization
- High contrast mode
- Focus indicators
- ARIA labels everywhere

#### 7.2 Enterprise Features
**Priority**: Low  
**Effort**: Very High

- Admin policies
- Centralized profile management
- Compliance reporting
- GDPR/CCPA tools
- SSO integration

## Community & Ecosystem

### Documentation
- [ ] Video tutorials
- [ ] Interactive demo
- [ ] FAQ section
- [ ] Troubleshooting guide
- [ ] API documentation (if applicable)

### Community Building
- [ ] Discord/Slack community
- [ ] GitHub Discussions
- [ ] User feedback forum
- [ ] Feature request voting
- [ ] Bug bounty program

### Partnerships
- [ ] University partnerships
- [ ] Job portal integrations
- [ ] Career services collaboration
- [ ] Educational institutions

## Technical Debt & Refactoring

### Code Quality
- [ ] TypeScript migration
- [ ] Modularize content.js (currently 1300+ lines)
- [ ] Separate UI components
- [ ] State management library
- [ ] Comprehensive JSDoc comments

### Performance
- [ ] Lazy load popup
- [ ] Virtual scrolling for large profile lists
- [ ] Debounce/throttle user inputs
- [ ] Optimize matching algorithm
- [ ] Bundle size reduction

### Security
- [ ] Content Security Policy hardening
- [ ] XSS prevention review
- [ ] Dependency audit
- [ ] Security.txt file
- [ ] Vulnerability disclosure process

## Metrics for Success

### User Engagement
- Daily active users
- Profile creation rate
- Forms filled per user
- Retention rate (7-day, 30-day)

### Quality Metrics
- Match accuracy (user corrections)
- Error rate
- Time saved per form
- User satisfaction score

### Growth Metrics
- Install rate
- Uninstall rate
- Review ratings
- Feature adoption rate

## Release Schedule

- **v0.2.0**: Q2 2025 - Enhanced UX (undo, keyboard shortcuts)
- **v0.3.0**: Q3 2025 - Advanced features (confidence scores, custom mappings)
- **v0.4.0**: Q4 2025 - Testing & quality improvements
- **v1.0.0**: Q1 2026 - Stable release with cloud sync (opt-in)

## Contributing

We welcome contributions! Priority areas:
1. Bug fixes and stability
2. Matcher algorithm improvements
3. UI/UX enhancements
4. Documentation
5. Test coverage

See `README.md` for contribution guidelines.
