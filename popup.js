let currentProfile = null;
let copiedProfileData = null;

// function document.getElementById(id) { return document.getElementById(id) }
function $(id) { return document.getElementById(id) }

// This function displays status messages to the user (like "Profile saved" or error messages)
function setStatus(msg, isError) {
  console.log(msg);                  // Logs message to browser console for debugging
  const s = $('status');             // Gets the status div element
  if (s) {
    s.textContent = msg || '';       // Sets the message text (or clears it if empty)
    s.style.color = isError ? '#c00' : '#666';  // Red if error, gray if normal
    if (msg) {
      setTimeout(() => s.textContent = '', 3000);  // Auto-clear after 3 seconds
    }
  }
}

// This function validates profile data before saving to ensure required fields are filled correctly:
function validateProfile(p) {
  if (!p.fullName || p.fullName.trim().length < 3)
    return 'Full name is required';

  if (!p.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p.email))
    return 'A valid email is required';

  return null;
}

// This function retrieves all profiles stored in Chrome local storage:
function getProfiles(callback) {
  chrome.storage.local.get(['profilesV1'], (res) => {
    callback(res.profilesV1 || {});
  });
}

// This function saves the provided map of profiles to Chrome local storage:
function saveProfilesMap(map, cb) {
  chrome.storage.local.set({ profilesV1: map }, cb || (() => { }));
}

// This function shows the main view of the popup (profile list):
// What it does:
// Makes the profile list screen visible
// Hides the profile form screen

// When it's called:
// When user clicks the "Back" button (←)
// After saving a profile
// On popup load (initial state)
function showMainView() {
  $('mainView').style.display = 'block';   // Show main view
  $('formView').style.display = 'none';    // Hide form view
}

// This function shows the form view for creating or editing a profile:
// What it does:
// Hides the profile list screen
// Makes the profile form screen visible

// When it's called:
// When user clicks "+ New Profile" button
// When user opens an existing profile (double-click or menu → Open)
function showFormView() {
  $('mainView').style.display = 'none';    // Hide main view
  $('formView').style.display = 'block';   // Show form view
}

// This function visually highlights a selected profile in the profile list:
// What it does:
// Adds a "selected" class to the profile card of the selected profile
// Removes the "selected" class from all other profile cards

// When it's called:
// When user double-clicks a profile card
// When user opens an existing profile (double-click or menu → Open)

// Expected input/output
// Input: The name of the profile to select
// Output: The profile card of the selected profile is highlighted

// Why is this needed
// To visually highlight the selected profile in the profile list
function selectProfile(name) {
  const cards = document.querySelectorAll('.profile-card');
  cards.forEach(card => {
    if (card.dataset.name === name) {
      card.classList.add('selected');
    } else {
      card.classList.remove('selected');
    }
  });
}

// This function builds a profile object from the form data:
// What it does:
// Creates a profile object with the following properties:
// version: 1
// fullName: The value of the "Full Name" input field
// email: The value of the "Email" input field
// phone: The value of the "Phone" input field
// rollNo: The value of the "Roll No." input field
// cgpa: The value of the "CGPA" input field
// tenthPercent: The value of the "10th Percentage" input field
// twelfthPercent: The value of the "12th Percentage" input field
// graduationYear: The value of the "Graduation Year" input field
// college: The value of the "College" input field
// branch: The value of the "Branch" input field
// gender: The value of the "Gender" input field
// relocate: The value of the "Relocate" input field
// city: The value of the "City" input field
// highestQualification: The value of the "Highest Qualification" input field
// hasBacklogs: The value of the "Has Backlogs" input field
// backlogCount: The value of the "Backlog Count" input field
// dob: The value of the "DOB" input field
// nationality: The value of the "Nationality" input field

// When it's called:
// When user clicks the "Save" button

// Expected input/output
// Input: The form data
// Output: A profile object

// Why is this needed
// To create a profile object from the form data
function buildProfileFromForm() {
  return {
    version: 1,
    fullName: $('fullName').value || '',
    email: $('email').value || '',
    phone: $('phone').value || '',
    rollNo: $('rollNo').value || '',
    cgpa: $('cgpa').value || '',
    tenthPercent: $('tenthPercent').value || '',
    twelfthPercent: $('twelfthPercent').value || '',
    graduationYear: $('graduationYear').value || '',
    college: $('college').value || '',
    branch: $('branch').value || '',
    gender: $('gender').value || '',
    relocate: $('relocate').value || '',
    city: $('city').value || '',
    highestQualification: $('highestQualification').value || '',
    hasBacklogs: $('hasBacklogs').value || '',
    backlogCount: $('backlogCount').value || '',
    dob: $('dob').value || '',
    nationality: $('nationality').value || '',
    lastUpdated: Date.now()
  };
}

// This function loads a profile into the form:
// What it does:
// Sets the profile name in the form
// Sets the profile data in the form fields
// When it's called:
// When user double-clicks a profile card
// When user opens an existing profile (double-click or menu → Open)

// Expected input and output
// Input: The profile object and the profile name
// Output: The form is populated with the profile data

// Why is this needed
// To populate the form with the profile data
function loadProfileIntoForm(profile, name) {
  if (!profile) return;
  $('profileName').value = name || '';
  $('fullName').value = profile.fullName || '';
  $('email').value = profile.email || '';
  $('phone').value = profile.phone || '';
  $('rollNo').value = profile.rollNo || '';
  $('cgpa').value = profile.cgpa || '';
  $('tenthPercent').value = profile.tenthPercent || '';
  $('twelfthPercent').value = profile.twelfthPercent || '';
  $('graduationYear').value = profile.graduationYear || '';
  $('college').value = profile.college || '';
  $('branch').value = profile.branch || '';
  $('gender').value = profile.gender || '';
  $('relocate').value = profile.relocate || '';
  // new fields
  try { $('city').value = profile.city || ''; } catch (e) { }
  try { $('highestQualification').value = profile.highestQualification || ''; } catch (e) { }
  try { $('hasBacklogs').value = profile.hasBacklogs || ''; } catch (e) { }
  try { $('backlogCount').value = profile.backlogCount || ''; } catch (e) { }
  try { $('dob').value = profile.dob || ''; } catch (e) { }
  try { $('nationality').value = profile.nationality || ''; } catch (e) { }
}

// This function clears the form:
// What it does:
// Resets the form to its default state
// When it's called:
// When user clicks the "Clear" button
// Expected input and output
// Input: None
// Output: The form is reset to its default state
// Why is this needed
// To reset the form to its default state
function clearForm() {
  $('profileForm').reset();
}

// This function creates a profile card:
// What it does:
// Creates a profile card with the following properties:
// name: The name of the profile
// profile: The profile object
// When it's called:
// When user double-clicks a profile card
// When user opens an existing profile (double-click or menu → Open)
// Expected input and output
// Input: The profile object and the profile name
// Output: The profile card is created
// Why is this needed
// To create a profile card for the profile
function createProfileCard(name, profile) {
  const card = document.createElement('div');
  card.className = 'profile-card';
  card.dataset.name = name;

  const icon = document.createElement('div');
  icon.className = 'profile-icon';
  icon.textContent = name.substring(0, 2).toUpperCase();

  const info = document.createElement('div');
  info.className = 'profile-info';

  const profileName = document.createElement('div');
  profileName.className = 'profile-name';
  profileName.textContent = name;

  const meta = document.createElement('div');
  meta.className = 'profile-meta';
  meta.textContent = profile.email || '';

  const menu = document.createElement('div');
  menu.className = 'card-menu';
  menu.innerHTML = `
    <button class="menu-button" type="button">⋮</button>
  `;

  info.appendChild(profileName);
  info.appendChild(meta);
  card.appendChild(icon);
  card.appendChild(info);
  card.appendChild(menu);

  // attach a data-holder for floating menu actions
  // dataset is a JavaScript property that accesses HTML data-* attributes
  // menu.dataset.name = name creates: <div data-name="Work Profile"></div>
  menu.dataset.name = name;

  return card;
}

// This function toggles the theme:
// What it does:
// Toggles the theme between light and dark
// When it's called:
// When user clicks the theme toggle button
// Expected input and output
// Input: None
// Output: The theme is toggled
// Why is this needed
// To toggle the theme between light and dark
function toggleTheme() {
  const currentTheme = document.body.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  // set on both html and body to ensure cascading of CSS variables
  try { document.documentElement.setAttribute('data-theme', newTheme); } catch (e) { }
  try { document.body.setAttribute('data-theme', newTheme); } catch (e) { }

  const icon = $('themeToggle').querySelector('.theme-icon');
  // sun for light, moon for dark
  icon.textContent = newTheme === 'light' ? '☀' : '🌙';

  chrome.storage.local.set({ theme: newTheme });
}

// This function loads the theme:
// What it does:
// Loads the theme from Chrome storage
// When it's called:
// When the popup is opened
// Expected input and output
// Input: None
// Output: The theme is loaded
// Why is this needed
// To load the theme from Chrome storage
function loadTheme() {
  chrome.storage.local.get(['theme'], (result) => {
    const theme = result.theme || 'dark';
    try { document.documentElement.setAttribute('data-theme', theme); } catch (e) { }
    try { document.body.setAttribute('data-theme', theme); } catch (e) { }
    $('themeToggle').querySelector('.theme-icon').textContent = theme === 'light' ? '☀' : '🌙';
  });
}

// This function displays all saved profiles as cards in the profile list UI:
// What it does:
// Renders the profile list in the popup
// When it's called:
// When the popup is opened
// Expected input and output
// Input: None
// Output: The profile list is rendered
// Why is this needed
// To render the profile list in the popup
function renderProfileList() {
  getProfiles((profiles) => {
    const list = $('profileList');
    list.innerHTML = '';

    Object.entries(profiles)
      .sort((a, b) => (b[1].lastUpdated || 0) - (a[1].lastUpdated || 0))
      .forEach(([name, profile]) => {
        const card = createProfileCard(name, profile);
        list.appendChild(card);
      });
  });
}

// This function handles menu actions:
// What it does:
// Handles menu actions for profiles
// When it's called:
// When the user clicks on a profile card
// Expected input and output
// Input: The action and profile name
// Output: The profile is opened, copied, or deleted
// Why is this needed
// To handle menu actions for profiles
function handleMenuAction(action, profileName) {
  switch (action) {
    case 'open':
      getProfiles((map) => {
        if (map[profileName]) {
          loadProfileIntoForm(map[profileName], profileName);
          $('formTitle').textContent = 'Edit Profile';
          showFormView();
        }
      });
      break;
    case 'copy':
      getProfiles((map) => {
        if (map[profileName]) {
          copiedProfileData = map[profileName];
          setStatus('Profile copied!');
        }
      });
      break;
    case 'delete':
      getProfiles((map) => {
        if (map[profileName]) {
          delete map[profileName];
          saveProfilesMap(map, () => {
            renderProfileList();
            setStatus('Profile deleted');
            if (currentProfile === profileName) {
              currentProfile = null;
              selectProfile(null);
            }
          });
        }
      });
      break;
  }
}

// This function handles menu actions:
// What it does:
// Handles menu actions for profiles
// When it's called:
// When the user clicks on a profile card
document.addEventListener('DOMContentLoaded', () => {
  loadTheme();
  renderProfileList();
  showMainView();

  // Theme toggle
  $('themeToggle').addEventListener('click', toggleTheme);

  // Create new profile button
  $('createProfileBtn').addEventListener('click', () => {
    clearForm();
    $('formTitle').textContent = 'Create Profile';
    showFormView();
  });

  // Back button
  $('backButton').addEventListener('click', () => {
    showMainView();
  });

  // Profile card clicks (for menu)
  $('profileList').addEventListener('click', (e) => {
    const card = e.target.closest('.profile-card');
    if (!card) return;

    const menuButton = e.target.closest('.menu-button');
    if (menuButton) {
      e.stopPropagation();
      // close any existing floating menu
      const existing = document.querySelector('.floating-menu');
      if (existing) existing.remove();
      // build floating menu appended to body so it won't scroll inside list
      const fm = document.createElement('div'); fm.className = 'floating-menu';
      const name = menuButton.parentElement.dataset.name || card.dataset.name;
      const items = [['open', '📝 Open'], ['copy', '📋 Copy'], ['delete', '🗑️ Delete']];
      items.forEach(([action, label]) => { const it = document.createElement('div'); it.className = 'menu-item'; it.dataset.action = action; it.dataset.name = name; it.textContent = label; fm.appendChild(it); });
      document.body.appendChild(fm);
      // position near the button
      const rect = menuButton.getBoundingClientRect();
      fm.style.top = `${rect.bottom + window.scrollY + 6}px`;
      fm.style.left = `${rect.left + window.scrollX - fm.offsetWidth + rect.width}px`;
      return;
    }

    const menuItem = e.target.closest('.menu-item');
    if (menuItem) {
      const action = menuItem.dataset.action;
      const name = menuItem.dataset.name;
      handleMenuAction(action, name);
      menuItem.closest('.floating-menu') && menuItem.closest('.floating-menu').remove();
      e.stopPropagation();
      return;
    }

    // Single click for selection
    const name = card.dataset.name;
    if (currentProfile === name) {
      currentProfile = null;
      selectProfile(null);
    } else {
      currentProfile = name;
      selectProfile(name);
    }
  });

  // Profile card double-click to open
  // What it does:
  // Opens the profile when double-clicking on a profile card
  // When it's called:
  // When the user double-clicks on a profile card
  // Expected input and output:
  // Input: None
  // Output: The profile is opened
  // Why is this needed:
  // To open the profile when double-clicking on a profile card
  $('profileList').addEventListener('dblclick', (e) => {
    const card = e.target.closest('.profile-card');
    if (!card) return;

    const name = card.dataset.name;
    handleMenuAction('open', name);
  });

  // Close menu dropdowns when clicking outside
  // What it does:
  // Closes any floating menu when clicking outside
  // When it's called:
  // When the user clicks outside the floating menu
  // Expected input and output:
  // Input: None
  // Output: The floating menu is closed
  // Why is this needed:
  // To close the floating menu when clicking outside
  document.addEventListener('click', (e) => {
    // close any floating menu when clicking outside
    const fm = document.querySelector('.floating-menu');
    if (fm && !e.target.closest('.floating-menu') && !e.target.closest('.menu-button')) {
      fm.remove();
    }
    // handle clicks on floating menu items (they are appended to body)
    const item = e.target.closest('.floating-menu .menu-item');
    if (item) {
      const action = item.dataset.action;
      const name = item.dataset.name;
      handleMenuAction(action, name);
      item.closest('.floating-menu') && item.closest('.floating-menu').remove();
    }
  });

  // Paste button
  // What it does:
  // Handles paste button click
  // When it's called:
  // When the user clicks the paste button
  // Expected input and output:
  // Input: None
  // Output: The profile data is pasted into the form
  // Why is this needed:
  // To handle paste button click
  $('pasteBtn').addEventListener('click', () => {
    if (copiedProfileData) {
      loadProfileIntoForm(copiedProfileData);
      setStatus('Profile data pasted');
    } else {
      setStatus('No profile data copied', true);
    }
  });

  // Cancel edit button in form (if present)
  const cancelEdit = $('cancelEdit'); if (cancelEdit) cancelEdit.addEventListener('click', () => { showMainView(); });

  // Profile form submission
  // What it does:
  // Handles profile form submission
  // When it's called:
  // When the user submits the profile form
  // Expected input and output:
  // Input: The profile form data
  // Output: The profile is saved
  // Why is this needed:
  // To handle profile form submission
  $('profileForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('profileName').value.trim();
    if (!name) {
      setStatus('Profile name is required', true);
      return;
    }

    const profile = buildProfileFromForm();
    const error = validateProfile(profile);
    if (error) {
      setStatus(error, true);
      return;
    }

    getProfiles((map) => {
      if (map[name] && !confirm(`Override existing profile "${name}"?`)) return;

      map[name] = profile;
      saveProfilesMap(map, () => {
        renderProfileList();
        showMainView();
        setStatus('Profile saved');
        selectProfile(name);
        currentProfile = name;
      });
    });
  });

  // Autofill button
  // What it does:
  // Handles autofill button click
  // When it's called:
  // When the user clicks the autofill button
  // Expected input and output:
  // Input: None
  // Output: The profile data is autofilled into the form
  // Why is this needed:
  // To handle autofill button click
  $('autofillBtn').addEventListener('click', () => {
    if (!currentProfile) {
      setStatus('Please select a profile first', true);
      return;
    }

    getProfiles((map) => {
      const profile = map[currentProfile];
      if (!profile) {
        setStatus('Selected profile not found', true);
        return;
      }

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0]) {
          setStatus('No active tab found', true);
          return;
        }
        const tabId = tabs[0].id;
        chrome.tabs.sendMessage(tabId, { action: "autofill", profile: profile }, response => {
          if (chrome.runtime.lastError) {
            // try to inject content scripts and retry once
            setStatus('Content script not present. Injecting and retrying...');
            try {
              chrome.scripting.executeScript({ target: { tabId }, files: ['matcher.js', 'content.js'] }, () => {
                // retry
                chrome.tabs.sendMessage(tabId, { action: "autofill", profile: profile }, resp2 => {
                  if (chrome.runtime.lastError) {
                    setStatus('Error: Make sure you are on a placement form page', true);
                  } else if (resp2 && resp2.success) {
                    // if content script returns candidates in resp2.candidates, render inside popup
                    if (resp2.candidates && Array.isArray(resp2.candidates)) renderPopupPreview(resp2.candidates, profile, tabId);
                    setStatus('Preview loaded from page');
                  } else {
                    setStatus('Failed to load preview', true);
                  }
                });
              });
            } catch (e) { setStatus('Injection failed', true); }
          } else if (response && response.success) {
            if (response.candidates && Array.isArray(response.candidates)) {
              renderPopupPreview(response.candidates, profile, tabId);
              setStatus('Preview loaded');
            } else {
              setStatus('No matches found', true);
            }
          } else {
            setStatus('Failed to load preview', true);
          }
        });
      });
    });
  });

  // Render preview inside popup
  // What it does:
  // Renders the preview inside the popup
  // When it's called:
  // When the user clicks the autofill button
  // Expected input and output:
  // Input: The candidates and profile
  // Output: The preview is rendered inside the popup
  // Why is this needed:
  // To render the preview inside the popup
  function renderPopupPreview(candidates, profile, tabId) {
    const pv = $('popupPreview');
    if (!pv) return;
    pv.innerHTML = '';
    pv.style.display = 'block';
    const title = document.createElement('div'); title.className = 'preview-title'; title.textContent = 'Autofill preview'; pv.appendChild(title);
    candidates.forEach(c => {
      const row = document.createElement('div'); row.className = 'preview-row';
      const lbl = document.createElement('div'); lbl.style.fontWeight = '600'; lbl.style.width = '45%'; lbl.textContent = c.label || c.key || '(field)';
      const val = document.createElement('div'); val.style.flex = '1'; val.style.color = 'var(--text-secondary)'; val.textContent = String(c.value || c.chosenLabel || '');
      row.appendChild(lbl); row.appendChild(val); pv.appendChild(row);
    });
    const actions = document.createElement('div'); actions.style.display = 'flex'; actions.style.justifyContent = 'flex-end'; actions.style.marginTop = '8px';
    const apply = document.createElement('button'); apply.className = 'action-button primary'; apply.textContent = 'Apply to page';
    const close = document.createElement('button'); close.className = 'action-button'; close.textContent = 'Close'; close.style.marginRight = '8px';
    actions.appendChild(close); actions.appendChild(apply); pv.appendChild(actions);
    close.addEventListener('click', () => { pv.style.display = 'none'; pv.innerHTML = ''; });
    apply.addEventListener('click', () => {
      setStatus('Applying to page...');
      apply.disabled = true;
      console.log('Popup: applying candidates to tab', tabId, candidates);
      // shallow clone candidates and replace DOM element refs with simple selectors
      const serialized = candidates.map(c => {
        const s = Object.assign({}, c);
        try {
          if (s.el && s.el instanceof Element) { s.elSelector = domToSelector(s.el); }
          if (s.root && s.root instanceof Element) { s.rootSelector = domToSelector(s.root); }
        } catch (e) { }
        // remove direct DOM refs
        delete s.el; delete s.root;
        return s;
      });
      chrome.tabs.sendMessage(tabId, { action: 'apply', candidates: serialized }, resp => {
        console.log('Popup: apply response', resp, chrome.runtime.lastError);
        apply.disabled = false;
        if (chrome.runtime.lastError) { setStatus('Apply failed: ensure page is supported', true); }
        else if (resp && resp.success) { setStatus('Applied successfully'); pv.style.display = 'none'; pv.innerHTML = ''; }
        else setStatus('Apply failed', true);
      });
    });

    // DOM to selector
    // What it does:
    // Converts a DOM element to a selector
    // When it's called:
    // When the user clicks the autofill button
    // Expected input and output:
    // Input: The DOM element
    // Output: The selector
    // Why is this needed:
    // To convert a DOM element to a selector
    function domToSelector(el) {
      if (!el) return null;
      // try to use id when available
      if (el.id) return `#${CSS.escape(el.id)}`;
      const parts = [];
      let node = el;
      while (node && node.nodeType === 1 && node !== document.body) {
        let part = node.tagName.toLowerCase();
        if (node.className) { const cls = String(node.className).split(/\s+/).filter(Boolean)[0]; if (cls) part += `.${cls}`; }
        const parent = node.parentElement;
        if (parent) { const idx = Array.from(parent.children).filter(ch => ch.tagName === node.tagName).indexOf(node); if (idx > 0) part += `:nth-of-type(${idx + 1})`; }
        parts.unshift(part);
        node = node.parentElement;
      }
      return parts.length ? parts.join(' > ') : null;
    }
  }

  // Load injection toggle state
  // What it does:
  // Loads the injection toggle state
  // When it's called:
  // When the popup is opened
  // Expected input and output:
  // Input: None
  // Output: The injection toggle state is loaded
  // Why is this needed:
  // To load the injection toggle state
  chrome.storage.local.get(['injectionEnabled'], (res) => {
    const enabled = res.injectionEnabled ?? true;
    $('injectionToggle').checked = enabled;
  });

  // Injection toggle
  // What it does:
  // Handles injection toggle change
  // When it's called:
  // When the user changes the injection toggle
  // Expected input and output:
  // Input: None
  // Output: The injection toggle state is changed
  // Why is this needed:
  // To handle injection toggle change
  $('injectionToggle').addEventListener('change', (e) => {
    const enabled = e.target.checked;
    chrome.storage.local.set({ injectionEnabled: enabled }, () => {
      setStatus(`Autofill ${enabled ? 'enabled' : 'disabled'}`);
    });
  });
});