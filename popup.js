// archived original popup.js -> popup_old.js (renamed in filesystem)
const DEFAULT_KEY = 'profilesV1';
let currentProfile = null;
let copiedProfileData = null;

function $(id) { return document.getElementById(id) }

function setStatus(msg, isError) {
  const s = $('status');
  if (s) {
    s.textContent = msg || '';
    s.style.color = isError ? '#c00' : '#666';
    if (msg) {
      setTimeout(() => {
        s.textContent = '';
      }, 3000);
    }
  }
}

function validateProfile(p) {
  if (!p.fullName || p.fullName.trim().length < 3) return 'Full name is required';
  if (!p.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p.email)) return 'A valid email is required';
  return null;
}

function getInitials(name) {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Helper: read profiles map from storage, migrate if necessary
function getProfiles(callback) {
  chrome.storage.local.get([DEFAULT_KEY], (res) => {
    let data = res[DEFAULT_KEY];
    if (!data) { callback({}); return; }
    // migration: if data looks like a single profile (has fullName), convert to map
    if (data && typeof data === 'object' && data.fullName) {
      const map = { Default: data };
      chrome.storage.local.set({ [DEFAULT_KEY]: map }, () => callback(map));
      return;
    }
    // otherwise expect map
    callback(data || {});
  });
}

function saveProfilesMap(map, cb) {
  chrome.storage.local.set({ [DEFAULT_KEY]: map }, cb || (() => { }));
}

function buildProfileFromForm() {
  return {
    version: 1,
    profileName: $('profileName').value || '',
    fullName: $('fullName').value || '',
    email: $('email').value || '',
    phone: $('phone').value || '',
    rollNo: $('rollNo').value || '',
    cgpa: $('cgpa').value || '',
    tenthPercent: $('tenthPercent').value || '',
    twelfthPercent: $('twelfthPercent').value || '',
    resumeLink: $('resumeLink').value || '',
    graduationYear: $('graduationYear') ? $('graduationYear').value || '' : '',
    college: $('college').value || '',
    branch: $('branch') ? $('branch').value || '' : '',
    gender: $('gender') ? $('gender').value || '' : '',
    relocate: $('relocate') ? $('relocate').value || '' : '',
    lastUpdated: Date.now()
  };
}

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
    <button class="menu-button">⋮</button>
    <div class="menu-dropdown">
      <div class="menu-item" data-action="open">📝 Open</div>
      <div class="menu-item" data-action="copy">📋 Copy</div>
      <div class="menu-item" data-action="delete">🗑️ Delete</div>
    </div>
  `;

  info.appendChild(profileName);
  info.appendChild(meta);
  card.appendChild(icon);
  card.appendChild(info);
  card.appendChild(menu);

  return card;
}

function renderProfileList(profiles) {
  const list = $('profileList');
  list.innerHTML = '';
  
  Object.entries(profiles)
    .sort((a, b) => (b[1].lastUpdated || 0) - (a[1].lastUpdated || 0))
    .forEach(([name, profile]) => {
      const card = createProfileCard(name, profile);
      list.appendChild(card);
    });
}

function showForm(show = true) {
  const formContainer = $('formContainer');
  if (show) {
    formContainer.classList.add('visible');
    $('backButton').focus();
  } else {
    formContainer.classList.remove('visible');
    clearForm();
  }
}

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

function toggleTheme() {
  const isDark = document.body.getAttribute('data-theme') !== 'light';
  document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
  chrome.storage.local.set({ theme: isDark ? 'light' : 'dark' });
}

function loadTheme() {
  chrome.storage.local.get(['theme'], (result) => {
    if (result.theme) {
      document.body.setAttribute('data-theme', result.theme);
    }
  });
}

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
  $('resumeLink').value = profile.resumeLink || '';
  if ($('graduationYear')) $('graduationYear').value = profile.graduationYear || profile.graduationYOP || '';
  $('college').value = profile.college || '';
  if ($('branch')) $('branch').value = profile.branch || '';
  if ($('gender')) $('gender').value = profile.gender || '';
  if ($('relocate')) $('relocate').value = profile.relocate || '';
}

function clearForm() {
  $('profileName').value = '';
  $('fullName').value = '';
  $('email').value = '';
  $('phone').value = '';
  $('rollNo').value = '';
  $('cgpa').value = '';
  $('tenthPercent').value = '';
  $('twelfthPercent').value = '';
  $('resumeLink').value = '';
  if ($('graduationYear')) $('graduationYear').value = '';
  $('college').value = '';
  if ($('branch')) $('branch').value = '';
  if ($('gender')) $('gender').value = '';
  if ($('relocate')) $('relocate').value = '';
}

function loadUI() {
  getProfiles((map) => {
    renderProfileList(map);
  });

  // load injection toggle
  chrome.storage.local.get(['injectionEnabled'], (res) => {
    const v = typeof res.injectionEnabled === 'undefined' ? true : !!res.injectionEnabled;
    if ($('injectionToggle')) $('injectionToggle').checked = v;
  });
}

function saveProfile(name) {
  if (!name) { setStatus('Profile name is required', true); return; }
  
  const profile = buildProfileFromForm();
  const err = validateProfile(profile);
  if (err) { setStatus(err, true); return; }
  
  getProfiles((map) => {
    if (map[name] && !confirm('Overwrite existing profile "' + name + '"?')) return;
    map[name] = profile;
    saveProfilesMap(map, () => {
      setStatus('Saved profile: ' + name);
      renderProfileList(map);
      selectProfile(name);
      showForm(false);
    });
  });
}

function deleteCurrentProfile(name) {
  if (!name) { setStatus('Select a profile to delete', true); return; }
  if (!confirm('Delete profile "' + name + '"? This cannot be undone.')) return;
  
  getProfiles((map) => {
    delete map[name];
    saveProfilesMap(map, () => {
      setStatus('Deleted profile: ' + name);
      renderProfileList(map);
      showForm(false);
    });
  });
}

function exportProfile(name) {
  getProfiles((map) => {
    let payload;
    let filename;
    if (name && map[name]) {
      payload = map[name];
      filename = `profile-${name}.json`;
    } else {
      payload = map;
      filename = 'profiles.json';
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  });
}

function importProfileFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const obj = JSON.parse(e.target.result);
      // if object contains multiple profiles (map), merge
      if (obj && typeof obj === 'object' && !obj.fullName) {
        getProfiles((map) => {
          const merged = Object.assign({}, map, obj);
          saveProfilesMap(merged, () => {
            renderProfileList(merged);
            setStatus('Imported profiles (merged)');
          });
        });
        return;
      }
      // otherwise treat as single profile -> ask for name
      const name = prompt('Enter a name for the imported profile:');
      if (!name) { setStatus('Import cancelled', true); return; }
      const err = validateProfile(obj);
      if (err) { setStatus('Import failed: ' + err, true); return; }
      obj.lastUpdated = Date.now();
      getProfiles((map) => {
        map[name] = obj;
        saveProfilesMap(map, () => {
          renderProfileList(map);
          selectProfile(name);
          loadProfileIntoForm(obj, name);
          setStatus('Imported profile as: ' + name);
        });
      });
    } catch (err) { setStatus('Invalid JSON file', true); }
  };
  reader.readAsText(file);
}

document.addEventListener('DOMContentLoaded', () => {
  let currentProfile = null;
  
  loadUI();

  // Create new profile button
  $('createProfileBtn').addEventListener('click', () => {
    clearForm();
    showForm(true);
    currentProfile = null;
    selectProfile(null);
  });

  // Autofill button
  $('autofillBtn').addEventListener('click', () => {
    if (!currentProfile) {
      setStatus('Please select a profile first', true);
      return;
    }

    // Send message to content script to autofill
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (!tabs[0] || !tabs[0].id) {
        setStatus('Error: Could not access current tab', true);
        return;
      }
      
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'autofill',
        profile: currentProfile
      }, (response) => {
        if (chrome.runtime.lastError) {
          setStatus('Error: ' + chrome.runtime.lastError.message, true);
          return;
        }
        
        if (response && response.success) {
          setStatus('Form filled successfully!', false);
          // Close popup after successful fill
          setTimeout(() => window.close(), 1000);
        } else {
          setStatus(response?.error || 'Failed to fill form', true);
        }
      });
    });
  });

  // Profile card clicks
  $('profileList').addEventListener('click', (e) => {
    const card = e.target.closest('.profile-card');
    if (!card) return;
    
    const name = card.dataset.name;
    
    // Toggle selection for single click
    if (currentProfile === name) {
      currentProfile = null;
      selectProfile(null);
    } else {
      currentProfile = name;
      selectProfile(name);
    }
  });

  // Close menu dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.card-menu')) {
      document.querySelectorAll('.menu-dropdown').forEach(dropdown => {
        dropdown.classList.remove('show');
      });
    }
  });

  // Paste button
  $('pasteBtn').addEventListener('click', () => {
    if (copiedProfileData) {
      loadProfileIntoForm(copiedProfileData);
      setStatus('Profile data pasted');
    } else {
      setStatus('No profile data copied', true);
    }
  });

  // Profile form submission
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
        showForm(false);
        setStatus('Profile saved');
        selectProfile(name);
        currentProfile = name;
      });
    });
  });

  // Cancel button
  $('cancelEdit').addEventListener('click', () => {
    showForm(false);
    selectProfile(null);
    currentProfile = null;
  });

  // Delete button
  $('deleteBtn').addEventListener('click', () => {
    if (currentProfile) {
      deleteCurrentProfile(currentProfile);
    }
  });

  // Export/Import
  $('exportBtn').addEventListener('click', () => exportProfile(currentProfile));
  $('importBtn').addEventListener('click', () => $('importFile').click());
  $('importFile').addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) importProfileFile(f);
    e.target.value = '';
  });

  // Injection toggle
  if ($('injectionToggle')) {
    $('injectionToggle').addEventListener('change', (e) => {
      try {
        chrome.storage.local.set({ injectionEnabled: !!e.target.checked });
        setStatus('Injection ' + (e.target.checked ? 'enabled' : 'disabled'));
      } catch (err) { }
    });
  }
});

