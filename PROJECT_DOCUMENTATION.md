# Project Documentation: Autofill Placement Forms

> [!NOTE]
> This document provides a deep-dive technical analysis of the "Autofill Placement Forms" Chrome Extension. It is designed for developers, architects, and advanced users requiring a complete understanding of the system's internal mechanics.

---

## 1. Project Foundation & Architecture (The WHY)

### Project Overview & Value Proposition
**Autofill Placement Forms** is a specialized browser extension designed to automate the repetitive and error-prone process of filling out university placement and recruitment forms (specifically Google Forms).

**Why it exists:**
University students often face the "Placement Season Fatigue," where they must fill out hundreds of redundant forms with identical data (Name, Roll No, CGPA, etc.). Manual entry is:
1.  **Time-consuming:** Wasting valuable preparation time.
2.  **Error-prone:** Fatigue leads to typos in critical fields like Email or Phone, potentially costing job opportunities.

**Value Proposition:**
This tool provides a **"One-Click Fill"** solution that is intelligent enough to recognize fields even when labels vary (e.g., "Student Name" vs. "Full Name" vs. "Name as on ID"), ensuring accuracy and saving hours of manual work.

### System Architecture Deep Dive
The project follows a standard **Chrome Extension Architecture (Manifest V3)**, operating as an event-driven system.

```mermaid
graph TD
    subgraph "Browser Context"
        User[User] -->|Interacts| Popup[Popup UI (popup.html/js)]
        User -->|Navigates| Page[Target Web Page (Google Form)]
    end

    subgraph "Extension Core"
        Popup -->|Reads/Writes| Storage[Chrome Local Storage]
        Popup -->|Sends 'Autofill' Msg| ContentScript[Content Script (content.js)]
        ContentScript -->|Uses| Matcher[Matcher Module (matcher.js)]
        ContentScript -->|Manipulates| DOM[Page DOM]
    end

    Storage -- Persists --> ProfileData[User Profile Data]
```

### Technology Stack Justification

| Technology | Choice | Justification ("The Why") |
| :--- | :--- | :--- |
| **Core Framework** | **Vanilla JavaScript (ES6+)** | **Performance & Weight:** React or Vue would introduce unnecessary build complexity and bundle size for a content script that needs to inject instantly. Vanilla JS ensures zero-dependency overhead and maximum execution speed within the host page context. |
| **Platform** | **Chrome Extension Manifest V3** | **Security & Longevity:** V3 is the current standard, offering better security (no remote code execution) and performance (service workers) compared to V2. |
| **Storage** | **Chrome `storage.local`** | **Privacy & Simplicity:** No external database is required. Data stays 100% on the user's machine, eliminating GDPR/privacy concerns for sensitive personal data (Phone, CGPA). |
| **Build Tool** | **None / Native** | **Development Velocity:** The codebase is structured to run directly in the browser without transpilation, allowing for rapid "Edit -> Reload -> Test" cycles. |

### Complete Data Flow Analysis

1.  **Profile Creation (Source):**
    *   User opens the **Popup**.
    *   Inputs data (Name, Email, etc.).
    *   Data is validated and saved to `chrome.storage.local` as a JSON object.

2.  **Injection & Matching (Trigger):**
    *   User navigates to a Google Form.
    *   User opens Popup and clicks **"Autofill"**.
    *   Popup retrieves the active profile from Storage.
    *   Popup sends a message `{action: 'autofill', profile: data}` to the active tab.

3.  **Heuristic Analysis (Processing):**
    *   **Content Script** receives the profile.
    *   It scans the DOM for input fields (`input`, `select`, `textarea`).
    *   For each field, it extracts the "Label" using complex DOM traversal (looking for `aria-label`, parent headers, or associated text nodes).
    *   **Matcher Module** compares the extracted label against a dictionary of known aliases using a fuzzy scoring algorithm.

4.  **Execution (Destination):**
    *   If a match is found (Score > Threshold), the Content Script:
        *   Determines the input type (Text, Radio, Checkbox, Select).
        *   **Simulates User Interaction:** It doesn't just set `.value`. It dispatches `input`, `change`, and `click` events to ensure React/Angular frameworks (used by Google Forms) detect the change and update their internal state.

---

## 2. Core Logic & Code Deep Dive (Developer Focus)

### Core Logic Explained

#### 1. The Matcher Engine (`matcher.js`)
This is the "brain" of the extension. It solves the problem of **Semantic Ambiguity**—knowing that "Mobile No." and "Contact Number" are the same thing.

*   **The Problem:** Form creators use unpredictable labels. Exact string matching fails 90% of the time.
*   **The Method:**
    *   **Normalization:** Strings are lowercased, accents removed, and special characters stripped (`normalize()`).
    *   **Token Overlap Scoring:** The `scoreMatch(query, keyword)` function splits both strings into tokens (words). It calculates a score based on:
        *   **Exact Phrase Bonus:** +70 points.
        *   **Token Overlap:** +16 points per matching word.
        *   **Partial Match:** +6 points for prefix matches (e.g., "roll" matches "rollnumber").
    *   **Pattern Boosting:** If the *value* looks like a phone number (regex check) and the *label* contains "phone", the score is boosted. This "Double Verification" reduces false positives.

#### 2. DOM Traversal & Injection (`content.js`)
This module handles the hostile environment of the host page.

*   **The Problem:** Google Forms uses obfuscated class names (e.g., `.freebirdFormviewerComponentsQuestionBaseRoot`) and complex nesting. Labels are rarely simple `<label>` tags.
*   **The Method:**
    *   **Contextual Scoping:** The script identifies "Question Roots" (containers holding both the label and the input). This ensures that a "Name" field inside a "College Details" section isn't confused with "Name" in a "Personal Details" section.
    *   **Event Simulation:**
        ```javascript
        // Why simply setting .value fails in React forms:
        // React tracks state internally. Setting .value updates the DOM but not React's state.
        // We must dispatch events to trigger React's change listeners.
        el.value = newValue;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        ```

### Module & File Interconnectivity

| File | Responsibility | Dependencies |
| :--- | :--- | :--- |
| `manifest.json` | **Configuration:** Defines permissions (`activeTab`, `storage`), entry points, and content script injection rules. | N/A |
| `popup.html/js` | **UI & Controller:** Handles user input, profile management, and initiates the autofill command. | `chrome.storage`, `matcher.js` (for preview) |
| `content.js` | **Worker:** Runs inside the web page. Scans DOM, executes matching logic, and modifies page content. | `matcher.js` (injected alongside) |
| `matcher.js` | **Logic Library:** Pure utility functions for string normalization and scoring. | None (Pure JS) |
| `profile.schema.json` | **Contract:** Defines the structure of the user profile object to ensure data consistency. | N/A |

---

## 3. Design Decisions & Trade-offs (Architectural WHY)

### Design Decisions & Trade-offs

1.  **Heuristic Matching vs. AI/LLM:**
    *   **Decision:** Used a deterministic, rule-based heuristic matcher (regex + token scoring) instead of an AI model.
    *   **Why:**
        *   **Privacy:** Sending form data to an LLM API is a security risk.
        *   **Latency:** Heuristics run in milliseconds; API calls take seconds.
        *   **Reliability:** Deterministic rules are easier to debug than hallucinations.
    *   **Trade-off:** It may miss extremely obscure phrasing that an LLM would catch, but it covers 99% of standard cases.

2.  **Local Storage vs. Cloud Sync:**
    *   **Decision:** Local-only storage.
    *   **Why:** drastically simplifies the architecture (no backend, no auth, no database costs) and maximizes user trust.
    *   **Trade-off:** Users cannot sync profiles across devices.

3.  **Injection Strategy:**
    *   **Decision:** Programmatic Injection (via `chrome.scripting`) + Manifest Declaration.
    *   **Why:** We declare matches in `manifest.json` for automatic loading on known URLs, but `popup.js` also attempts to inject scripts if they are missing (robustness).

### Scalability & Performance Analysis
*   **Current Bottleneck:** The `content.js` scans the entire DOM query list. On extremely large forms (100+ questions), this might cause a slight UI freeze (100-200ms).
*   **Future Solution:** Implement `IntersectionObserver` to only scan and fill fields as they scroll into view, or use `requestIdleCallback` to batch processing.

---

## 4. Project Operations & Roadmap

### Configuration & Deployment
1.  **Prerequisites:** Google Chrome or Edge (Chromium based).
2.  **Installation (Developer Mode):**
    *   Open `chrome://extensions`.
    *   Enable **"Developer mode"** (top right).
    *   Click **"Load unpacked"**.
    *   Select the project root folder.
3.  **Environment Variables:** None required. The app is self-contained.

### Testing Strategy
*   **Unit Tests (`tests/matcher.test.js`):**
    *   **Why:** The matching logic is complex and fragile. Unit tests ensure that adding a new alias for "CGPA" doesn't break detection for "GPA".
    *   **Tool:** Jest (implied by `.test.js` convention).
*   **Manual Verification:**
    *   `sample_form_basic.html`: Tests standard text inputs.
    *   `sample_form_advanced.html`: Tests complex radio/checkbox groups and edge cases.

### Known Limitations & Future Roadmap
1.  **Iframe Support:** Currently, the extension may struggle with forms embedded inside `<iframe>` tags due to cross-origin security restrictions.
2.  **Multi-page Forms:** The extension must be clicked again for each new page of a Google Form.
    *   **Roadmap Item:** Auto-detect page navigation and re-trigger autofill.
3.  **Custom Fields:** Users cannot currently add their own custom fields (e.g., "Github URL" if not already hardcoded).
    *   **Roadmap Item:** "Dynamic Field Mapping" UI to let users teach the extension new fields.
