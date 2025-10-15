let currentProfile = null;
let copiedProfileData = null;

function $(id) { return document.getElementById(id) }

function setStatus(msg, isError) {
  console.log(msg); // For debugging
  const s = $('status');
  if (s) {
    s.textContent = msg || '';
    s.style.color = isError ? '#c00' : '#666';
    if (msg) {
      setTimeout(() => s.textContent = '', 3000);
    }
  }
}

function validateProfile(p) {
  if (!p.fullName || p.fullName.trim().length < 3) return 'Full name is required';
  if (!p.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p.email)) return 'A valid email is required';
  return null;
}

function getProfiles(callback) {
  chrome.storage.local.get(['profilesV1'], (res) => {
    callback(res.profilesV1 || {});
  });
}

function saveProfilesMap(map, cb) {
  chrome.storage.local.set({ profilesV1: map }, cb || (() => {}));
}

function showMainView() {
  $('mainView').style.display = 'block';
  $('formView').style.display = 'none';
}

function showFormView() {
  $('mainView').style.display = 'none';
  $('formView').style.display = 'block';
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
    resumeLink: $('resumeLink').value || '',
    graduationYear: $('graduationYear').value || '',
    college: $('college').value || '',
    branch: $('branch').value || '',
    gender: $('gender').value || '',
    relocate: $('relocate').value || '',
    lastUpdated: Date.now()
  };
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
  $('graduationYear').value = profile.graduationYear || '';
  $('college').value = profile.college || '';
  $('branch').value = profile.branch || '';
  $('gender').value = profile.gender || '';
  $('relocate').value = profile.relocate || '';
}

function clearForm() {
  $('profileForm').reset();
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
    <button class="menu-button" type="button">⋮</button>
  `;

  info.appendChild(profileName);
  info.appendChild(meta);
  card.appendChild(icon);
  card.appendChild(info);
  card.appendChild(menu);

  // attach a data-holder for floating menu actions
  menu.dataset.name = name;

  return card;
}

function toggleTheme() {
  const currentTheme = document.body.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  // set on both html and body to ensure cascading of CSS variables
  try{ document.documentElement.setAttribute('data-theme', newTheme); }catch(e){}
  try{ document.body.setAttribute('data-theme', newTheme); }catch(e){}
  
  const icon = $('themeToggle').querySelector('.theme-icon');
  // sun for light, moon for dark
  icon.textContent = newTheme === 'light' ? '☀' : '🌙';
  
  chrome.storage.local.set({ theme: newTheme });
}

function loadTheme() {
  chrome.storage.local.get(['theme'], (result) => {
    const theme = result.theme || 'dark';
    try{ document.documentElement.setAttribute('data-theme', theme); }catch(e){}
    try{ document.body.setAttribute('data-theme', theme); }catch(e){}
    $('themeToggle').querySelector('.theme-icon').textContent = theme === 'light' ? '☀' : '🌙';
  });
}

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

function handleMenuAction(action, profileName) {
  switch (action) {
    case 'open':
      getProfiles((map) => {
        if (map[profileName]) {
          loadProfileIntoForm(map[profileName], profileName);
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
      // Immediately delete the profile (no confirmation modal)
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

// (Deleted modal helper — delete is immediate now)

document.addEventListener('DOMContentLoaded', () => {
  loadTheme();
  renderProfileList();
  showMainView();

  // Theme toggle
  $('themeToggle').addEventListener('click', toggleTheme);

  // Create new profile button
  $('createProfileBtn').addEventListener('click', () => {
    clearForm();
    showFormView();
  });

  // Back button
  $('backButton').addEventListener('click', () => {
    showMainView();
  });

  // Profile card clicks
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
      const items = [ ['open','📝 Open'], ['copy','📋 Copy'], ['delete','🗑️ Delete'] ];
      items.forEach(([action, label]) => { const it = document.createElement('div'); it.className='menu-item'; it.dataset.action=action; it.dataset.name=name; it.textContent = label; fm.appendChild(it); });
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

    // Profile selection
    const name = card.dataset.name;
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
    // close any floating menu when clicking outside
    const fm = document.querySelector('.floating-menu');
    if(fm && !e.target.closest('.floating-menu') && !e.target.closest('.menu-button')){
      fm.remove();
    }
    // handle clicks on floating menu items (they are appended to body)
    const item = e.target.closest('.floating-menu .menu-item');
    if(item){
      const action = item.dataset.action;
      const name = item.dataset.name;
      handleMenuAction(action, name);
      item.closest('.floating-menu') && item.closest('.floating-menu').remove();
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
        showMainView();
        setStatus('Profile saved');
        selectProfile(name);
        currentProfile = name;
      });
    });
  });

  // Autofill button
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

      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (!tabs[0]) {
          setStatus('No active tab found', true);
          return;
        }
        const tabId = tabs[0].id;
        chrome.tabs.sendMessage(tabId, { action: "autofill", profile: profile }, response => {
          if (chrome.runtime.lastError) {
            // try to inject content scripts and retry once
            setStatus('Content script not present. Injecting and retrying...');
            try{
              chrome.scripting.executeScript({ target: { tabId }, files: ['matcher.js', 'content.js'] }, () => {
                // retry
                chrome.tabs.sendMessage(tabId, { action: "autofill", profile: profile }, resp2 => {
                  if (chrome.runtime.lastError) {
                    setStatus('Error: Make sure you are on a placement form page', true);
                  } else if (resp2 && resp2.success) {
                    // if content script returns candidates in resp2.candidates, render inside popup
                    if(resp2.candidates && Array.isArray(resp2.candidates)) renderPopupPreview(resp2.candidates, profile, tabId);
                    setStatus('Preview loaded from page');
                  } else {
                    setStatus('Failed to load preview', true);
                  }
                });
              });
            }catch(e){ setStatus('Injection failed', true); }
          } else if (response && response.success) {
            if(response.candidates && Array.isArray(response.candidates)){
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
  function renderPopupPreview(candidates, profile, tabId){
    const pv = $('popupPreview');
    if(!pv) return;
    pv.innerHTML = '';
    pv.style.display = 'block';
    const title = document.createElement('div'); title.className='preview-title'; title.textContent = 'Autofill preview'; pv.appendChild(title);
    candidates.forEach(c=>{
      const row = document.createElement('div'); row.className='preview-row';
      const lbl = document.createElement('div'); lbl.style.fontWeight='600'; lbl.style.width='45%'; lbl.textContent = c.label || c.key || '(field)';
      const val = document.createElement('div'); val.style.flex='1'; val.style.color='var(--text-secondary)'; val.textContent = String(c.value || c.chosenLabel || '');
      row.appendChild(lbl); row.appendChild(val); pv.appendChild(row);
    });
    const actions = document.createElement('div'); actions.style.display='flex'; actions.style.justifyContent='flex-end'; actions.style.marginTop='8px';
    const apply = document.createElement('button'); apply.className='action-button primary'; apply.textContent='Apply to page';
    const close = document.createElement('button'); close.className='action-button'; close.textContent='Close'; close.style.marginRight='8px';
    actions.appendChild(close); actions.appendChild(apply); pv.appendChild(actions);
    close.addEventListener('click', ()=>{ pv.style.display='none'; pv.innerHTML=''; });
    apply.addEventListener('click', ()=>{
      setStatus('Applying to page...');
      apply.disabled = true;
      console.log('Popup: applying candidates to tab', tabId, candidates);
      // shallow clone candidates and replace DOM element refs with simple selectors
      const serialized = candidates.map(c => {
        const s = Object.assign({}, c);
        try{
          if(s.el && s.el instanceof Element){ s.elSelector = domToSelector(s.el); }
          if(s.root && s.root instanceof Element){ s.rootSelector = domToSelector(s.root); }
        }catch(e){}
        // remove direct DOM refs
        delete s.el; delete s.root;
        return s;
      });
      chrome.tabs.sendMessage(tabId, { action: 'apply', candidates: serialized }, resp=>{
        console.log('Popup: apply response', resp, chrome.runtime.lastError);
        apply.disabled = false;
        if(chrome.runtime.lastError){ setStatus('Apply failed: ensure page is supported', true); }
        else if(resp && resp.success){ setStatus('Applied successfully'); pv.style.display='none'; pv.innerHTML=''; }
        else setStatus('Apply failed', true);
      });
    });
    
    function domToSelector(el){
      if(!el) return null;
      // try to use id when available
      if(el.id) return `#${CSS.escape(el.id)}`;
      const parts = [];
      let node = el;
      while(node && node.nodeType === 1 && node !== document.body){
        let part = node.tagName.toLowerCase();
        if(node.className){ const cls = String(node.className).split(/\s+/).filter(Boolean)[0]; if(cls) part += `.${cls}`; }
        const parent = node.parentElement;
        if(parent){ const idx = Array.from(parent.children).filter(ch=>ch.tagName === node.tagName).indexOf(node); if(idx>0) part += `:nth-of-type(${idx+1})`; }
        parts.unshift(part);
        node = node.parentElement;
      }
      return parts.length ? parts.join(' > ') : null;
    }
  }

  // Load injection toggle state
  chrome.storage.local.get(['injectionEnabled'], (res) => {
    const enabled = res.injectionEnabled ?? true;
    $('injectionToggle').checked = enabled;
  });

  // Injection toggle
  $('injectionToggle').addEventListener('change', (e) => {
    const enabled = e.target.checked;
    chrome.storage.local.set({ injectionEnabled: enabled }, () => {
      setStatus(`Autofill ${enabled ? 'enabled' : 'disabled'}`);
    });
  });
});