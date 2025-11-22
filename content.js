// content.js - injected into Google Forms pages
// What it does:
// Injects the matcher into the page
// When it's called:
// When the page is loaded
// Expected input and output:
// Input: None
// Output: The matcher is injected into the page
// Why is this needed:
// To inject the matcher into the page

// UI Components and Utilities
// =========================

/**
 * Common styles used across UI components
*/

// Common styles used across UI components

const CommonStyles = {
  overlayBase: {
    position: 'fixed',
    zIndex: 2147483647,
    background: 'white',
    border: '1px solid #ddd',
    padding: '12px',
    boxShadow: '0 6px 20px rgba(0,0,0,0.2)'
  },
  button: {
    padding: '6px 8px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    background: '#fff',
    marginRight: '8px'
  },
  primaryButton: {
    background: '#1a73e8',
    color: 'white',
    border: 'none',
    padding: '10px 14px',
    borderRadius: '6px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
  },
  select: {
    padding: '6px',
    borderRadius: '6px',
    minWidth: '160px'
  },
  text: {
    fontSize: '13px'
  }
};

/**
 * Apply common styles to an element
 * @param {HTMLElement} el - The element to style
 * @param {Object} styles - The styles to apply
 */
function applyStyles(el, styles) {
  Object.entries(styles).forEach(([prop, value]) => {
    el.style[prop] = value;
  });
}

importMatcherIfNeeded().catch(()=>{});

// Toggle to enable extra debugging output in the preview overlay (false by default)
const AF_DEBUG = false;

// Helper: Check if a question is asking about future job-specific commitments (not profile facts)
function isConditionalJobQuestion(questionLabel) {
  if (!questionLabel || typeof questionLabel !== 'string') return false;
  const label = questionLabel.toLowerCase();
  
  // Comprehensive patterns for conditional/commitment questions
  const patterns = [
    /are you (ready|willing|able|prepared)/i,
    /will you be (ready|willing|able|available)/i,
    /can you (attend|work|join|relocate)/i,
    /if you (clear|get|pass|succeed|are selected)/i,
    /(this|the) (job|position|role|company) requires/i,
    /ready to (attend|work|join|relocate)/i,
    /willing to (attend|work|join|relocate)/i,
    /able to (attend|work|join|relocate)/i,
    /prepared to (attend|work|join|relocate)/i,
    /do you agree to/i,
    /will you (attend|work|join)/i
  ];
  
  const isConditional = patterns.some(pattern => pattern.test(label));
  
  // Optional debug logging (uncomment to troubleshoot)
  if (isConditional) {
    console.log('[AutoFill] Skipping conditional question:', questionLabel);
  }
  
  return isConditional;
}

// helper to produce a stable-ish selector for an element (id preferred)
function elementToSelector(el){
  try{
    if(!el || el.nodeType !== 1) return null;
    if(el.id) return `#${CSS.escape(el.id)}`;
    const parts = [];
    let node = el;
    while(node && node.nodeType === 1 && node !== document.body){
      let part = node.tagName.toLowerCase();
      if(node.className){ const cls = String(node.className).split(/\s+/).filter(Boolean)[0]; if(cls) part += `.${cls}`; }
      const parent = node.parentElement;
      if(parent){ const siblings = Array.from(parent.children).filter(ch=>ch.tagName === node.tagName); if(siblings.length>1){ const idx = siblings.indexOf(node); part += `:nth-of-type(${idx+1})`; } }
      parts.unshift(part);
      node = node.parentElement;
    }
    return parts.length ? parts.join(' > ') : null;
  }catch(e){ return null; }
}

// Handle messages from popup (autofill command)
try{
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    try{
      if(msg && msg.action === 'autofill' && msg.profile){
        // use provided profile directly to compute candidates and respond with serializable candidates
        const profile = msg.profile;
        try{
          let candidates = computeCandidatesForProfile(profile);
          if(!candidates || candidates.length === 0){ candidates = computeRelaxedCandidatesForProfile(profile); }
          if(candidates && candidates.length > 0){
            // map candidates to a serializable form (include selectors instead of Element refs)
            const serial = candidates.map(c=>{
              // derive a better label when original label is missing or unhelpful
              let derivedLabel = (c.label || '').toString().trim();
              try{
                if(!derivedLabel || derivedLabel === '(no label)'){
                  // prefer root label text when possible
                  if(c.root){ const rl = getLabelTextFromRoot(c.root); if(rl) derivedLabel = rl; }
                  // fallback to element-level question text
                  if((!derivedLabel || derivedLabel === '(no label)') && c.el){ const elText = findQuestionTextForElement(c.el); if(elText) derivedLabel = elText; }
                }
              }catch(e){}
              if(!derivedLabel) derivedLabel = '(no label)';

              const out = { type: c.type, label: derivedLabel, key: c.key, score: c.score };
              if(c.value) out.value = c.value;
              if(c.chosen) out.chosen = (typeof c.chosen === 'object') ? { label: c.chosen.label, value: c.chosen.value } : c.chosen;
              if(c.chosenLabel) out.chosenLabel = c.chosenLabel;
              if(c.chosenLabels) out.chosenLabels = c.chosenLabels;
              // include selectors if elements present
              try{ if(c.el) out.elSelector = elementToSelector(c.el); }catch(e){}
              try{ if(c.root) out.rootSelector = elementToSelector(c.root); }catch(e){}
              return out;
            });
            // Deduplicate candidates by normalized preview label so identical questions are presented once.
            // Prefer the candidate with the higher score when duplicates exist.
            const dedupMap = new Map();
            serial.forEach(s => {
              const nl = normalizePreviewLabel(s.label || s.key || '');
              if(!nl){
                // keep unlabeled items as separate entries (use a unique key)
                const uid = `${s.label}::${Math.random().toString(36).slice(2,8)}`;
                dedupMap.set(uid, s);
                return;
              }
              if(!dedupMap.has(nl)) { dedupMap.set(nl, s); }
              else {
                const ex = dedupMap.get(nl);
                // prefer the candidate with higher score
                if((s.score||0) > (ex.score||0)) dedupMap.set(nl, s);
              }
            });
            const deduped = Array.from(dedupMap.values());
            sendResponse({ success: true, candidates: serial });
            // NOTE: we still send the original serial for backward compatibility with any UI relying on ordering.
            // If you prefer deduped output, change the line above to send 'deduped' instead of 'serial'.
            return true;
          }
          sendResponse({ success: false, message: 'No fields matched' });
          return true;
        }catch(e){ sendResponse({ success: false, message: 'compute error' }); return true; }
      }

      // apply candidates sent from popup
      if(msg && msg.action === 'apply' && Array.isArray(msg.candidates)){
        try{
          console.log('Content: apply request received', msg.candidates.length);
          msg.candidates.forEach(c=>{
            try{
              if(c.type === 'text' && c.elSelector){
                let el = document.querySelector(c.elSelector);
                if(!el){
                  // try name/id fallbacks
                  el = document.querySelector(`input[name="${c.key}"], textarea[name="${c.key}"], input[id="${c.key}"]`);
                }
                if(el){ fillTextInput(el, c.value); }
                else console.warn('Content: text selector not found', c.elSelector, c.key);
              } else if(c.type === 'select' && c.elSelector){
                let sel = document.querySelector(c.elSelector);
                if(!sel){ sel = document.querySelector(`select[name="${c.key}"], select[id="${c.key}"]`); }
                if(sel){ sel.value = c.chosen ? c.chosen.value || c.chosen.label : sel.value; sel.dispatchEvent(new Event('change',{bubbles:true})); }
                else console.warn('Content: select selector not found', c.elSelector, c.key);
              } else if(c.type === 'radio' && c.rootSelector){
                let root = document.querySelector(c.rootSelector);
                if(!root){ root = document.querySelector(`div[role="radiogroup"], div[role="group"]`); }
                if(root){ const opt = Array.from(root.querySelectorAll('input[type="radio"], [role="radio"]')).find(o=>getOptionLabel(o) === c.chosenLabel); if(opt) selectOptionElement(opt); }
                else console.warn('Content: radio root not found', c.rootSelector);
              } else if(c.type === 'checkbox' && c.rootSelector){
                let root = document.querySelector(c.rootSelector);
                if(!root){ root = document; }
                if(root && c.chosenLabels){ c.chosenLabels.forEach(lbl=>{ const opt = Array.from(root.querySelectorAll('input[type="checkbox"]')).find(o=>getOptionLabel(o)===lbl); if(opt) { if(!opt.checked) opt.click(); } }); }
              }
            }catch(e){ console.error('Content: apply inner error', e); }
          });
          sendResponse({ success: true });
          return true;
        }catch(e){ console.error('Content: apply error', e); sendResponse({ success: false }); return true; }
      }
    }catch(e){ /* ignore message handling errors */ }
  });
}catch(e){ /* ignore if runtime unavailable in some contexts */ }

// populate the inline profile select (used by content script listeners)
function populateInlineProfileSelect(map, last){
  try{
    const sel = document.getElementById('af-profile-select');
    if(!sel) return;
    sel.innerHTML = '';
    const empty = document.createElement('option'); empty.value=''; empty.textContent='-- profile --'; sel.appendChild(empty);
    const keys = map && typeof map === 'object' ? Object.keys(map) : [];
    keys.forEach(name=>{ const o = document.createElement('option'); o.value = name; o.textContent = name; sel.appendChild(o); });
    if(last && map && map[last]) sel.value = last;
  }catch(e){ /* ignore */ }
}

function ensureButton(){
  // Disabled in-page floating UI injection to avoid modifying host pages.
  // The popup will be the single entrypoint for autofill actions.
  return;
  // container to hold button + profile selector
  const container = document.createElement('div');
  container.id = 'placement-autofill-container';
  // minimal inline styles; stronger rules are injected via CSS below
  container.style.position = 'fixed';
  container.style.bottom = '16px';
  container.style.right = '16px';
  container.style.zIndex = 2147483647;
  container.style.display = 'flex';
  container.style.alignItems = 'center';
  container.style.gap = '8px';
  container.style.pointerEvents = 'auto';
  container.style.opacity = '1';

  // inject a stylesheet to make sure our UI stays on top and visible
  try{
    if(!document.getElementById('af-global-styles')){
      const s = document.createElement('style'); s.id = 'af-global-styles';
      s.textContent = `#placement-autofill-container{position:fixed !important; bottom:16px !important; right:16px !important; z-index:2147483647 !important; display:flex !important; align-items:center !important; gap:8px !important;} #placement-autofill-container button, #placement-autofill-container select{font-family:inherit !important; font-size:13px !important;} #af-preview-overlay, #af-profile-chooser, #af-toast{z-index:2147483647 !important;}`;
      (document.head || document.documentElement).appendChild(s);
    }
  }catch(e){ /* ignore style injection errors */ }

  const btn = document.createElement('button');
  btn.id = 'placement-autofill-btn';
  btn.textContent = 'Autofill Placement Details';
  btn.style.background = '#1a73e8';
  btn.style.color = 'white';
  btn.style.border = 'none';
  btn.style.padding = '10px 14px';
  btn.style.borderRadius = '6px';
  btn.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
  btn.style.pointerEvents = 'auto';
  btn.style.opacity = '1';
  btn.addEventListener('click', onAutofillClicked);

  const sel = document.createElement('select');
  sel.id = 'af-profile-select';
  sel.style.padding = '6px';
  sel.style.borderRadius = '6px';
  sel.style.minWidth = '160px';
  sel.title = 'Select profile for autofill';
  // initial populate
  try{ chrome.storage.local.get(['profilesV1','lastUsedProfile'], (res)=>{ populateInlineProfileSelect(res && res.profilesV1 ? res.profilesV1 : {}, res && res.lastUsedProfile); }); }catch(e){}

  // disable autofill button if no profiles available
  try{
    chrome.storage.local.get(['profilesV1'], (res)=>{
      const map = res && res.profilesV1 ? res.profilesV1 : {};
      const has = map && typeof map === 'object' && Object.keys(map).length>0;
      if(!has){ btn.disabled = true; btn.textContent = 'Create a profile first'; btn.style.background = '#888'; }
    });
  }catch(e){}

  sel.addEventListener('change', (e)=>{
    const v = e.target.value;
    try{ if(v) chrome.storage.local.set({ lastUsedProfile: v }); }catch(err){}
    // enable button when a profile is chosen
    try{ if(v){ btn.disabled = false; btn.textContent = 'Autofill Placement Details'; btn.style.background = '#1a73e8'; } }catch(e){}
  });

  // small refresh button so users can refresh the inline list after saving in popup
  const refreshBtn = document.createElement('button');
  refreshBtn.id = 'af-profile-refresh';
  refreshBtn.textContent = '\u21bb';
  refreshBtn.title = 'Refresh profiles';
  refreshBtn.style.padding = '6px 8px';
  refreshBtn.style.borderRadius = '6px';
  refreshBtn.style.border = '1px solid #ddd';
  refreshBtn.addEventListener('click', ()=>{
    try{ chrome.storage.local.get(['profilesV1','lastUsedProfile'], (res)=>{ populateInlineProfileSelect(res && res.profilesV1 ? res.profilesV1 : {}, res && res.lastUsedProfile); }); }catch(e){}
  });

  // Dump JSON button - copies a JSON snapshot of questions+options to clipboard for diagnostics
  const dumpBtn = document.createElement('button');
  dumpBtn.id = 'af-dump-json';
  dumpBtn.textContent = 'Dump JSON';
  dumpBtn.title = 'Copy questions JSON to clipboard for diagnostics';
  dumpBtn.style.padding = '6px 8px';
  dumpBtn.style.borderRadius = '6px';
  dumpBtn.style.border = '1px solid #ddd';
  dumpBtn.style.background = '#fff';
  dumpBtn.addEventListener('click', ()=>{ try{ const js = dumpAllQuestionsJSON(); const txt = JSON.stringify(js, null, 2); try{ navigator.clipboard && navigator.clipboard.writeText(txt); }catch(e){ /* ignore clipboard */ } showToast('Questions JSON copied to clipboard'); }catch(e){ showToast('Failed to dump questions JSON'); } });

  // simple collapse toggle (reintroduced)
  const collapseBtn = document.createElement('button');
  collapseBtn.id = 'af-collapse-toggle';
  collapseBtn.textContent = '\u22EE'; // ⋮ vertical ellipsis
  collapseBtn.title = 'Minimize';
  collapseBtn.style.padding = '6px 8px';
  collapseBtn.style.borderRadius = '6px';
  collapseBtn.style.border = '1px solid #ddd';
  collapseBtn.style.background = '#fff';
  collapseBtn.style.marginLeft = '4px';
  collapseBtn.addEventListener('click', ()=>{
    try{
      const c = document.getElementById('placement-autofill-container');
      if(!c) return;
      const collapsed = !c.classList.toggle('af-collapsed');
      // persist inverted: store true if collapsed
      try{ chrome.storage.local.set({ afCollapsed: c.classList.contains('af-collapsed') }); }catch(e){}
      // update icon
      collapseBtn.textContent = c.classList.contains('af-collapsed') ? '\u2715' : '\u22EE';
      collapseBtn.title = c.classList.contains('af-collapsed') ? 'Expand' : 'Minimize';
    }catch(e){}
  });

    // (minimize/expand control removed per UI preference)

  container.appendChild(sel);
  container.appendChild(refreshBtn);
  container.appendChild(dumpBtn);
  container.appendChild(collapseBtn);
  container.appendChild(btn);
  // append to documentElement in case some pages override body stacking context
  try{ document.documentElement.appendChild(container); }catch(e){ document.body.appendChild(container); }
  // initialize collapsed state and toggle icon after container exists
  try{
    chrome.storage.local.get(['afCollapsed'], (res)=>{
      const c = document.getElementById('placement-autofill-container');
      const t = document.getElementById('af-collapse-toggle');
      if(res && res.afCollapsed && c){ c.classList.add('af-collapsed'); if(t) { t.textContent='\u2715'; t.title='Expand'; } }
      else if(t){ t.textContent='\u22EE'; t.title='Minimize'; }
    });
  }catch(e){}
  // ensure it's visible; if not, try left placement as fallback
  try{
    const rect = container.getBoundingClientRect();
    const cs = window.getComputedStyle(container);
    if(rect.width === 0 || cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0'){
      container.style.right = 'auto';
      container.style.left = '16px';
      // re-measure
      setTimeout(()=>{ try{ adjustAutofillContainer(); }catch(e){} }, 50);
    }
  }catch(e){}
  // ensure we don't overlap the form's submit control
  try{ adjustAutofillContainer(); }catch(e){}
}

// apply persisted collapsed state if present
try{
  chrome.storage.local.get(['afCollapsed'], (res)=>{
    if(res && res.afCollapsed){
      const c = document.getElementById('placement-autofill-container');
      if(c) c.classList.add('af-collapsed');
    }
  });
}catch(e){}

/**
 * Adjusts the position of the autofill container to avoid overlapping submit buttons
 * @returns {void}
 */
function adjustAutofillContainer(){
  const container = document.getElementById('placement-autofill-container');
  if(!container) return;
  // default offset from bottom
  let bottomOffset = 16;
  // try to find common submit controls (sample pages and real forms)
  const submitEl = document.querySelector('#submitBtn, button[type="submit"], input[type="submit"], .freebirdFormviewerViewFormFooter');
  if(submitEl){
    try{
      const rect = submitEl.getBoundingClientRect();
      // if submit element is within viewport and near bottom, lift the container above it
      if(rect && rect.top && rect.top > 0){
        const lift = Math.max(16, (window.innerHeight - rect.top) + 16);
        bottomOffset = lift;
      }
    }catch(e){ /* ignore measurement errors */ }
  }
  container.style.bottom = `${bottomOffset}px`;
}

function onAutofillClicked(){
  // on-page autofill button click is disabled. Use extension popup to trigger autofill.
  console.log('[AutoFill] onAutofillClicked ignored (in-page UI disabled).');
}

function computeCandidatesForProfile(profile){
  const candidates = [];
  const scannedLabels = [];
  const matchedLabels = [];
  const matchedRoots = new Set();
  // Process text-like inputs and textareas; include aria-labeled inputs and contenteditable elements
  const textInputs = Array.from(document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="url"], textarea, input[aria-label], [contenteditable="true"]'));
  textInputs.forEach(inp=>{
    // derive label from element and containing question root (gives context like "Course" around a Name field)
    let label = findQuestionTextForElement(inp) || inp.getAttribute('aria-label') || (inp.getAttribute && inp.getAttribute('placeholder')) || '(no label)';
    const root = inp.closest && (inp.closest('.freebirdFormviewerComponentsQuestionBaseRoot') || inp.closest('.question') || inp.closest('.gform') || inp.closest('div[role="listitem"]'));
    const rootLabel = root ? getLabelTextFromRoot(root) : '';
    // combined label gives broader context (helps detect 'College Name' vs just 'Name')
    const combinedLabel = ((rootLabel && rootLabel.trim() !== '' ? rootLabel + ' - ' : '') + label).trim();
    if(rootLabel && !label.includes(rootLabel)) label = (rootLabel + ' - ' + label).trim();
    const contextLower = (rootLabel || '').toLowerCase();
    const contextHasCourse = /course|certif|certificate|cert|platform|institute|training|program/i.test(contextLower);
  const rootHasChoiceControls = !!(root && (root.querySelector && root.querySelector('input[type="radio"], input[type="checkbox"], select')));
  // try to resolve aria-labelledby id lists like "i1 i4"
    try{ const resolved = resolveAriaLabelIds(label); if(resolved) label = resolved; }catch(e){}
    scannedLabels.push(label);
    let matched = null;
    if(window.AutofillMatcher && typeof window.AutofillMatcher.matchQuestionToField === 'function'){
      const res = window.AutofillMatcher.matchQuestionToField(label, profile);
      if(res && res.key && res.value){ matched = {value: res.value, key: res.key, score: res.score}; }
    }
    if(!matched){
      // prefer checking against the combined label (root + element) for better context
      const val = simpleMatch(combinedLabel || label, profile);
      if(val) matched = {value: val, key: 'fallback', score: 50};
      // explicit college fallback: some forms mark the label in a way our matcher misses; check combined/root label directly
      try{
        const labelClean = ((combinedLabel || rootLabel || label || '') + '').replace(/\*/g,'').replace(/required question/ig,'').trim().toLowerCase();
        if(!matched && /college|institution|university|institute|school|campus/.test(labelClean) && profile.college){ matched = { value: profile.college, key: 'college', score: 70 }; }
      }catch(e){}
      // if label didn't reveal field, use input type as a fallback (email/tel)
      if(!matched){
        try{
          const itype = (inp.getAttribute('type') || '').toLowerCase();
          if(itype === 'email' && profile.email){ matched = { value: profile.email, key: 'email', score: 60 }; }
          else if(itype === 'tel' && profile.phone){ matched = { value: profile.phone, key: 'phone', score: 60 }; }
        }catch(e){/* ignore */}
      }
    }
    if(matched && matched.value){
      // prevent false-positive filling:
      // - don't fill fullName into course/cert name fields (context contains course/cert)
      if(matched.key === 'fullName' && contextHasCourse){}
      // - prefer college when the question mentions both name and college/institute keywords
      else if(matched.key === 'fullName' && /college|institution|university|institute|school|campus/.test((combinedLabel||'').toLowerCase())){
        if(profile.college){ matched = { value: profile.college, key: 'college', score: matched.score + 5 } }
      }
      // - don't fill gender into free-text inputs (gender should map to radio/select)
      else if(matched.key === 'gender' && !( (inp.tagName && inp.tagName.toLowerCase()==='input' && (inp.getAttribute && inp.getAttribute('type')==='radio')) || (inp.tagName && inp.tagName.toLowerCase()==='select') )){
      }
      // - if the question root already contains radio/select controls (e.g., "Other -> text" case), skip filling the text input; prefer choice controls
      // but allow college fields to be filled even if choice controls are present (some forms ask College Name with a follow-up choice)
      else if(rootHasChoiceControls && matched.key !== 'college'){
      }else{
        matchedLabels.push(label);
        if(root) matchedRoots.add(root);
        const dlab = deriveLabel(label, root, inp) || label;
        candidates.push({type:'text', el: inp, label: dlab, key: matched.key, value: matched.value, score: matched.score});
      }
    }
  });

  // Process select elements
  const selects = Array.from(document.querySelectorAll('select'));
  selects.forEach(sel=>{
    let label = findQuestionTextForElement(sel) || sel.getAttribute('aria-label') || '(no label)';
    const root = sel.closest && (sel.closest('.freebirdFormviewerComponentsQuestionBaseRoot') || sel.closest('.question') || sel.closest('.gform') || sel.closest('div[role="listitem"]'));
    const rootLabel = root ? getLabelTextFromRoot(root) : '';
    if(rootLabel && !label.includes(rootLabel)) label = (rootLabel + ' - ' + label).trim();
    try{ const resolved = resolveAriaLabelIds(label); if(resolved) label = resolved; }catch(e){}
    scannedLabels.push(label);
    let matchedField = null;
    if(window.AutofillMatcher && typeof window.AutofillMatcher.matchQuestionToField === 'function'){
      const res = window.AutofillMatcher.matchQuestionToField(label, profile);
      if(res && res.key) matchedField = res.key;
    }
    if(!matchedField){
      // fallback: try simpleMatch on label
      const val = simpleMatch(label, profile);
      if(val) matchedField = 'fallback';
    }
    const options = Array.from(sel.options).map(o=>({value:o.value, label:o.text}));
    // prepare canonical forms for labels/values
    const optionLabels = options.map(o=>o.label || '');
    const optionCanons = optionLabels.map(l=>canonicalize(l));
    const labelCanon = canonicalize(label);

    // backlog numeric handling: prefer numeric match when label suggests backlog
    const isBacklogQuestion = /backlog|arrear|active backlog|active backlogs|no of backlogs|number of backlogs/i.test(label);
    if(isBacklogQuestion && profile.backlogCount!=null){
      const desired = String(profile.backlogCount).trim();
      let idx = optionLabels.findIndex(l=>String(l).includes(desired));
      if(idx === -1){ idx = optionCanons.findIndex(c=>c.includes(canonicalize(desired)) || c === canonicalize(desired)); }
      if(idx !== -1){
        const chosen = options[idx];
        matchedLabels.push(label);
        const dl = deriveLabel(label, root, sel) || label;
        candidates.push({type:'select', el: sel, label: dl, key: matchedField || 'backlogCount', chosen, options, score: 100});
        return; // continue to next select
      }
    }

    // (graduationYear handling removed - field disabled)

    // pick best option by scoring canonical token overlap (also consider acronyms)
    let chosen = null; let bestScore = 0; let chosenIdx = -1; let chosenKey = null;
    if(matchedField && profile[matchedField]){
      const pvRaw = String(profile[matchedField]);
      // try to find best option using matchScore (canonical + acronym + normalized overlap)
      optionCanons.forEach((c, i)=>{
        const s = matchScore(pvRaw, c, optionLabels[i]);
        if(s > bestScore){ bestScore = s; chosenIdx = i; chosenKey = matchedField; }
      });
    }

    // Simple Graduation Year handling: if profile.graduationYear present and one of the options contains that year, prefer it.
    try{
      if(profile && profile.graduationYear){
        const ty = String(profile.graduationYear).trim();
        if(ty){
          const yearIdx = options.findIndex(o => ((String(o.label||'')).indexOf(ty) !== -1) || ((String(o.value||'')).indexOf(ty) !== -1));
          if(yearIdx !== -1){ chosenIdx = yearIdx; chosenKey = 'graduationYear'; }
        }
      }
    }catch(e){}

    // If still no chosen option, try matching against prioritized profile fields
    if(chosenIdx === -1){
      const pCandidates = getProfileMatchCandidates(profile);
      pCandidates.forEach(pc=>{ optionCanons.forEach((c,i)=>{ const s = matchScore(pc.val, c, optionLabels[i]); if(s > bestScore){ bestScore = s; chosenIdx = i; chosenKey = pc.key; } }); });
    }

    if(chosenIdx !== -1 && options[chosenIdx]){
      chosen = options[chosenIdx];
      // graduation year handling removed - no special-case numeric match
      matchedLabels.push(label);
      // prefer using matchedField (from question-level matcher) else the chosenKey derived from profile-value matching
      const finalKey = matchedField || chosenKey || 'fallback';
      const dlab = deriveLabel(label, root, sel) || label;
      candidates.push({type:'select', el: sel, label: dlab, key: finalKey, chosen, options, score: (chosen?50:0)});
    }
  });

  // Process radio groups and checkbox groups by question container
  const processed = new Set();
  // include elements that render as role="radio" (Google Forms uses div[role=radio])
  const radioInputs = Array.from(document.querySelectorAll('input[type="radio"], [role="radio"]'));
  radioInputs.forEach(r=>{
    // try Google Forms roots first, then fall back to our sample .question structure
    const root = r.closest('.freebirdFormviewerComponentsQuestionBaseRoot') || r.closest('.quantumWizTogglePapercheckboxEl') || r.closest('.question') || r.parentElement;
    if(!root) return;
    if(processed.has(root)) return;
    processed.add(root);
  const options = Array.from(root.querySelectorAll('input[type="radio"], [role="radio"]')).map(opt=>({el: opt, label: getOptionLabel(opt)}));
    if(options.length === 0) return;
    // look for Google Forms title selectors, else our sample .q-title, else fallback to root text
    const qTitle = root.querySelector('.freebirdFormviewerComponentsQuestionBaseTitle') || root.querySelector('.freebirdFormviewerComponentsQuestionBaseHeader') || root.querySelector('.q-title');
    let label = (qTitle && (qTitle.innerText || qTitle.textContent)) || root.innerText || '(no label)';
    try{ const resolved = resolveAriaLabelIds(label); if(resolved) label = resolved; }catch(e){}
    
    // EARLY EXIT: Skip conditional/job-specific questions that ask about future commitments
    if(isConditionalJobQuestion(label)) {
      return; // Skip these questions entirely
    }
    
    scannedLabels.push(label);
  let matchedField = null;
    if(window.AutofillMatcher && typeof window.AutofillMatcher.matchQuestionToField === 'function'){
      const res = window.AutofillMatcher.matchQuestionToField(label, profile);
      if(res && res.key) matchedField = res.key;
    }
    if(!matchedField){ const val = simpleMatch(label, profile); if(val) matchedField = 'fallback'; }
    // (graduationYear handling removed - field disabled)
    // Guard: avoid auto-selecting generic Yes/No radio groups unless the question text indicates a boolean
    try{
      const optionLabels = options.map(o=> (o.label||'').toLowerCase().trim());
      if(isGenericYesNoOptions(optionLabels)){
        const isBoolLabel = labelLooksBoolean(label);
        const allowedBooleanKeys = new Set(['relocate','hasBacklogs','attendInterview','canAttendInterview','availability','available','willing']);
        const matchedKeyIsBoolean = matchedField && allowedBooleanKeys.has(matchedField);
        if(!isBoolLabel && !matchedKeyIsBoolean){
          // skip this generic yes/no question to avoid false positives
          return;
        }
      }
    }catch(e){}
  // choose option best matching profile values (gender, relocate, backlogCount, or matchedField)
  let chosen = null;
  let bestScore = 0;
  const qLower = (label || '').toLowerCase();
  // prepare canonical option labels
  const optionCanons = options.map(o=>canonicalize(o.label || ''));
    try{
  // collect candidate profile values to consider (in order)
  const candidatesToCheck = [];
      if(matchedField && profile[matchedField]) candidatesToCheck.push({key: matchedField, val: String(profile[matchedField])});
      // include profile-priority candidates so option labels like CSE match even if the question label is 'Course'
      const pCandidates = getProfileMatchCandidates(profile);
      pCandidates.forEach(pc=>{ // only add if not duplicate key
        if(!candidatesToCheck.some(x=>x.key===pc.key)) candidatesToCheck.push({key: pc.key, val: pc.val});
      });
      // backlog numeric: if this looks like a backlog question, consider backlogCount as high priority
      const isBacklogQuestion = /backlog|arrear|active backlog|active backlogs|no of backlogs|number of backlogs/i.test(label);
      if(isBacklogQuestion && profile.backlogCount!=null){ candidatesToCheck.unshift({key:'backlogCount', val: String(profile.backlogCount)}); }
      // if option labels contain explicit gender tokens, allow gender to be considered even if question label is generic
      try{
        const genderTokenPresent = options.some(o=>{ const t = String((o.label||'')).toLowerCase(); return /\b(male|female|man|woman|m\b|f\b)\b/.test(t); });
        if(genderTokenPresent && profile.gender) candidatesToCheck.push({key:'gender', val:String(profile.gender)});
      }catch(e){}
      // only consider gender if question explicitly looks like a gender question or matchedField is gender
      try{
        const genderHint = /\b(gender|sex)\b/;
        if((matchedField === 'gender' || genderHint.test(qLower)) && profile.gender) {
          candidatesToCheck.push({key: 'gender', val: String(profile.gender)});
        }
      }catch(e){}
      // only consider relocate if question mentions relocation/onsite/work-from keywords or matchedField is relocate
      // This should rarely run since we filter conditional questions earlier
      try{
        const relocationHint = /(relocat|work from office|work from home|on-?site|onsite|wfh|wfo|hybrid)/i;
        // Only match if it's a general preference question
        if((matchedField === 'relocate' || relocationHint.test(qLower)) && profile.relocate) {
          candidatesToCheck.push({key: 'relocate', val: String(profile.relocate)});
        }
      }catch(e){}
      // include graduationYear as a simple candidate so year-labeled options can match directly
      try{ if(profile && profile.graduationYear) candidatesToCheck.push({key:'graduationYear', val: String(profile.graduationYear)}); }catch(e){}

  // helper: normalized option label
  function normOpt(o){ return String((o.label||'')).toLowerCase().trim(); }
      // helper to normalize option labels and deprioritize generic "Other" options
      function normalizeOptLabel(s){ if(!s) return ''; return String(s).replace(/\s+/g,' ').trim().toLowerCase(); }
      const isQuestionGraduation = /graduat|pass|yop|year|batch|passing out/.test(qLower);

  // evaluate each option against candidate values
  options.forEach((opt, optIndex)=>{
    const rawLabel = (opt.label||'');
    const norm = normalizeOptLabel(rawLabel);
    const optValue = String(opt.value||'').toLowerCase();
    const optCanon = optionCanons[optIndex];
    const optAcr = acronymize(rawLabel || optValue);
        // skip obvious 'other' option unless profile explicitly requests Other
        const isOther = /(^|\s)other(\s|$)|other response|other:\b/.test(norm);
        let localBest = 0;
        let localKey = null;

        for(const c of candidatesToCheck){
          const pvRaw = (c.val||'');
          if(!pvRaw) continue;
          // use matchScore to compute a robust comparison score
          const s = matchScore(pvRaw, optCanon, rawLabel);
          if(s > localBest){ localBest = s; localKey = c.key; }
        }

  // penalize matching for 'other' options to avoid accidental selection
        if(isOther) localBest = Math.max(0, localBest - 80);

        // small heuristic: if option label contains numeric year and question seems like graduation, boost it
        if(/\b20\d{2}\b/.test(norm) && isQuestionGraduation) localBest = Math.max(localBest, 180);

        if(localBest > bestScore){ bestScore = localBest; chosen = opt; }
      });

  // If no strong match found yet, as a fallback try matching option labels against prioritized profile fields (branch/college/...)
  if(!chosen || bestScore < 80){
    const pCandidates2 = getProfileMatchCandidates(profile);
    if(pCandidates2 && pCandidates2.length>0){
      let fallbackBest = 0; let fallbackChosen = null;
      options.forEach(opt=>{
        const ol = String(opt.label||'').toLowerCase(); const ov = String(opt.value||'').toLowerCase();
        pCandidates2.forEach(pc=>{
          const sc = Math.max(tokenOverlapScore(pc.val, ol), tokenOverlapScore(pc.val, ov));
          if(sc > fallbackBest){ fallbackBest = sc; fallbackChosen = opt; }
        });
      });
      if(fallbackBest > 0){ chosen = fallbackChosen; bestScore = Math.max(bestScore, fallbackBest*12); }
    }
  }

  // require a minimum confidence to avoid accidental yes/no matches
  // Higher threshold for Yes/No questions to prevent false positives
  const isYesNoQuestion = options.length === 2 && options.every(o => /^(yes|no|y|n)$/i.test(normOpt(o)));
  const RADIO_MIN_SCORE = isYesNoQuestion ? 150 : 80;
  // if we found a decent match, set matchedField if not present
        if(chosen && bestScore >= RADIO_MIN_SCORE){
        if(!matchedField){
          // infer field type from option match
          const chLabel = (chosen.label||'').toLowerCase();
          // Simple Graduation Year detection: if profile.graduationYear exists and the chosen option text contains that year, treat as graduationYear
          try{
            if(profile && profile.graduationYear){
              const ty = String(profile.graduationYear).trim();
              if(ty && (chLabel.includes(ty) || String(chosen.label||'').toLowerCase().includes(ty))){ matchedField = 'graduationYear'; }
            }
          }catch(e){}
          if(!matchedField){
            if(/male|female|man|woman|m\b|f\b|prefer not/.test(chLabel)) matchedField = 'gender';
            else matchedField = 'fallback';
          }
        }
        matchedLabels.push(label);
        // If chosenKey was set earlier from profile matching, prefer it as the candidate key so branch/highestQualification are retained
        const radioKey = matchedField || (typeof chosen === 'object' && chosen.key) || 'fallback';
        const radioLabel = deriveLabel(label, root, root) || label;
        candidates.push({type:'radio', root, label: radioLabel, key: radioKey, chosenLabel: chosen.label, options, score: bestScore});
      }
    }catch(e){ /* ignore radio matching error */ }
  });

  // Checkbox groups
  const checkboxInputs = Array.from(document.querySelectorAll('input[type="checkbox"], [role="checkbox"]'));
  processed.clear();
  checkboxInputs.forEach(cb=>{
    const root = cb.closest('.freebirdFormviewerComponentsQuestionBaseRoot') || cb.closest('.quantumWizTogglePapercheckboxEl') || cb.closest('.question') || cb.parentElement;
    if(!root) return; if(processed.has(root)) return; processed.add(root);
    const options = Array.from(root.querySelectorAll('input[type="checkbox"]')).map(opt=>({el: opt, label: getOptionLabel(opt)}));
    if(options.length === 0) return;
      const qTitle = root.querySelector('.freebirdFormviewerComponentsQuestionBaseTitle') || root.querySelector('.freebirdFormviewerComponentsQuestionBaseHeader') || root.querySelector('.q-title');
      let label = (qTitle && (qTitle.innerText || qTitle.textContent)) || root.innerText || '(no label)';
      try{ const resolved = resolveAriaLabelIds(label); if(resolved) label = resolved; }catch(e){}
    scannedLabels.push(label);
    let matchedField = null;
    if(window.AutofillMatcher && typeof window.AutofillMatcher.matchQuestionToField === 'function'){
      const res = window.AutofillMatcher.matchQuestionToField(label, profile);
      if(res && res.key) matchedField = res.key;
    }
    if(!matchedField){ const val = simpleMatch(label, profile); if(val) matchedField = 'fallback'; }
    // For checkbox groups, skip generic yes/no sets unless label indicates boolean intent
    try{
      const optLabels = options.map(o=> (o.label||'').toLowerCase().trim());
      if(isGenericYesNoOptions(optLabels)){
        const isBoolLabel = labelLooksBoolean(label);
        const allowedBooleanKeys = new Set(['relocate','hasBacklogs','attendInterview','canAttendInterview','availability','available','willing']);
        const matchedKeyIsBoolean = matchedField && allowedBooleanKeys.has(matchedField);
        if(!isBoolLabel && !matchedKeyIsBoolean){
          return; // skip
        }
      }
    }catch(e){}
    // For checkboxes, match any option tokens present in profile[matchedField]
    const chosen = [];
    if(matchedField && profile[matchedField]){
      const pv = String(profile[matchedField]).toLowerCase(); options.forEach(opt=>{ if(tokenOverlapScore(pv, (opt.label||'').toLowerCase())>0) chosen.push(opt); });
    }
    // fallback: try matching against prioritized profile fields (branch, college, qualification)
    if(chosen.length === 0){
      const pCandidates3 = getProfileMatchCandidates(profile);
      if(pCandidates3 && pCandidates3.length>0){
        pCandidates3.forEach(pc=>{
          const pcCanon = canonicalize(pc.val); const pcAcr = acronymize(pc.val);
          options.forEach(opt=>{
            const optLabel = (opt.label||'').toLowerCase(); const optCanon = canonicalize(optLabel); const optAcr = acronymize(optLabel);
            const s = matchScore(pc.val, optCanon, optLabel);
            if(s > 0) chosen.push(opt);
          });
        });
      }
    }
  if(chosen.length>0){ matchedLabels.push(label); const cbKey = matchedField || 'fallback'; const cbLabel = deriveLabel(label, root, root) || label; candidates.push({type:'checkbox', root, label: cbLabel, key: cbKey, chosenLabels: chosen.map(c=>c.label), options, score: 50}); }
  });

  // Final heuristic pass: if a question root's title clearly mentions 'college' but we didn't produce a candidate for it,
  // create a text candidate using the root's first text input. This ensures College Name fields are captured even if
  // other heuristics missed it earlier.
  try{
    const questionSelector = '.freebirdFormviewerComponentsQuestionBaseRoot, .freebirdFormviewerViewItemsItemItem, .freebirdFormviewerViewItemsItemItemRoot, .question, .gform .question, div[role="listitem"]';
    const questionRoots = Array.from(document.querySelectorAll(questionSelector));
    questionRoots.forEach(root=>{
      try{
        if(matchedRoots.has(root)) return;
        const title = getLabelTextFromRoot(root) || (root.innerText||root.textContent||'').trim();
        const t = (title||'').toLowerCase();
  // only treat as college when it mentions genuine college/university tokens
  // but avoid false-positives for 'institute' when the question is asking for a course/certification
  const courseKeywords = /course|certif|certificate|cert|platform|training|program|course name|certification/i;
  if(/college|institution|university|institute|college name/.test(t) && !courseKeywords.test(t) && profile && profile.college){
          // find a suitable input inside root
          const inp = root.querySelector('input[type="text"], textarea, input.whsOnd, [jsname="YPqjbf"]');
      if(inp){ matchedRoots.add(root); matchedLabels.push(title); const dl = deriveLabel(title, root, inp) || title; candidates.push({type:'text', el: inp, label: dl, key: 'college', value: profile.college, score: 65}); }
        }
      }catch(e){}
    });
  }catch(e){}

  return candidates;
}

// Relaxed matching: scan questions for keyword presence and map to profile fields
function computeRelaxedCandidatesForProfile(profile){
  const candidates = [];
  const questionSelector = '.freebirdFormviewerComponentsQuestionBaseRoot, .freebirdFormviewerViewItemsItemItem, .freebirdFormviewerViewItemsItemItemRoot, .question, .gform .question, div[role="listitem"], div[role="list"] > div';
  const questionRoots = Array.from(document.querySelectorAll(questionSelector));
  const seen = new Set();

  questionRoots.forEach(root => {
    if(seen.has(root)) return;
    seen.add(root);
    const labelText = getLabelTextFromRoot(root);
    const label = (labelText || '').toLowerCase();
    
    // Skip conditional/job-specific questions in relaxed matching too
    if(isConditionalJobQuestion(labelText || label)) {
      return; // Skip these questions
    }
    
    let key = null;
    if(label.includes('name')) key = 'fullName';
    else if(label.includes('email')) key = 'email';
    else if(label.includes('phone') || label.includes('mobile')) key = 'phone';
    else if(label.includes('roll') || label.includes('enrol')) key = 'rollNo';
    else if(label.includes('cgpa') || label.includes('gpa')) key = 'cgpa';
    else if(label.includes('10th') || label.includes('tenth')) key = 'tenthPercent';
    else if(label.includes('12th') || label.includes('twelfth')) key = 'twelfthPercent';
    else if(label.includes('resume') || label.includes('cv')) key = 'resumeLink';
    else if(label.includes('college') || label.includes('institution')) key = 'college';
    else if(label.includes('gender')) key = 'gender';
    else if(label.includes('relocate') || label.includes('willing to relocate')) key = 'relocate';
    else if(label.includes('branch') || label.includes('department')) key = 'branch';
    if(!key) return;

    // text inputs
    const input = root.querySelector('input[type="text"], input[type="email"], input[type="tel"], input[type="url"], textarea');
    if(input && profile[key]){
      const dl = deriveLabel(labelText || label, root, input) || (labelText || label);
      candidates.push({type:'text', el: input, label: dl, key, value: profile[key], score: 30});
      return;
    }

    // selects
    const sel = root.querySelector('select');
    if(sel && profile[key]){
      const options = Array.from(sel.options).map(o=>({value:o.value, label:o.text}));
      let chosen = options.find(o=> (String(o.value||'').toLowerCase() === String(profile[key]).toLowerCase()) || (String(o.label||'').toLowerCase() === String(profile[key]).toLowerCase()));
      if(!chosen && options.length>0) chosen = options[0];
      if(chosen){ const dl = deriveLabel(labelText || label, root, sel) || (labelText || label); candidates.push({type:'select', el: sel, label: dl, key, chosen, options, score: 30}); }
      return;
    }

    // radios
    const radios = Array.from(root.querySelectorAll('input[type="radio"]'));
    if(radios.length>0 && profile[key]){
      const opts = radios.map(r=>({el:r, label:getOptionLabel(r)}));
      const match = opts.find(o=> (o.label||'').toLowerCase() === String(profile[key]).toLowerCase());
      if(match){ const dl = deriveLabel(labelText || label, root, root) || (labelText || label); candidates.push({type:'radio', root, label: dl, key, chosenLabel: match.label, options: opts, score: 30}); }
      return;
    }

    // checkboxes
    const cbs = Array.from(root.querySelectorAll('input[type="checkbox"]'));
    if(cbs.length>0 && profile[key]){
      const opts = cbs.map(cb=>({el:cb, label:getOptionLabel(cb)}));
      const chosen = [];
      opts.forEach(o=>{ if(String(profile[key]).toLowerCase().includes((o.label||'').toLowerCase())) chosen.push(o); });
      if(chosen.length===0 && opts.length>0) chosen.push(opts[0]);
      if(chosen.length>0){ const dl = deriveLabel(labelText || label, root, root) || (labelText || label); candidates.push({type:'checkbox', root, label: dl, key, chosenLabels: chosen.map(c=>c.label), options: opts, score: 30}); }
      return;
    }
  });

  return candidates;
}

// Extracts a human-readable label from a question container root using several fallbacks
function getLabelTextFromRoot(root){
  if(!root) return '';
  // common Google Forms title selectors
  const selectors = ['.freebirdFormviewerComponentsQuestionBaseTitle', '.freebirdFormviewerComponentsQuestionBaseHeader', '.q-title', 'h1','h2','h3','h4','h5','h6'];
  for(const sel of selectors){
    const el = root.querySelector(sel);
    if(el && (el.innerText || el.textContent)) return (el.innerText || el.textContent).trim();
  }
  // role=heading
  const heading = root.querySelector('[role="heading"]');
  if(heading && (heading.innerText || heading.textContent)) return (heading.innerText || heading.textContent).trim();
  // look for any descendant that uses aria-labelledby and resolve it (Google Forms often sets aria-labelledby on radiogroup)
  try{
    const withAria = root.querySelectorAll('[aria-labelledby]');
    for(const el of Array.from(withAria || [])){
      const idStr = el.getAttribute('aria-labelledby');
      if(idStr){
        const resolved = resolveAriaLabelIds(idStr, root);
        if(resolved) return resolved;
      }
    }
  }catch(e){}
  // aria-labelledby on inputs inside root
  const input = root.querySelector('input[aria-labelledby], textarea[aria-labelledby], select[aria-labelledby]');
  if(input){
    const idStr = input.getAttribute('aria-labelledby');
    if(idStr){
      // aria-labelledby may contain multiple ids separated by spaces; resolve each
      try{
        const resolved = resolveAriaLabelIds(idStr, root);
        if(resolved){ return resolved; }
      }catch(e){}
    }
  }
  // fallback: first text node inside root with length > 3
  const text = (root.innerText || root.textContent || '').trim();
  if(text && text.length>3) return text.split('\n').map(s=>s.trim()).filter(Boolean)[0] || text;
  return '';
}

// Normalize a label for preview merging (lowercase, remove punctuation, collapse spaces, remove trailing asterisks)
function normalizePreviewLabel(s){
  if(!s) return '';
  try{ return String(s).toLowerCase().replace(/\*/g,'').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim(); }catch(e){ return String(s).toLowerCase().trim(); }
}

// Helper to derive a sensible label for a candidate using provided label, root or element
function deriveLabel(label, root, el){
  try{
    let l = (label || '').toString().trim();
    if(l && l !== '(no label)') return l;
    if(root){ const rl = getLabelTextFromRoot(root); if(rl) return rl; }
    if(el){ const eltxt = findQuestionTextForElement(el); if(eltxt) return eltxt; }
    return '';
  }catch(e){ return (label||'') }
}

// Helper to select/click a radio/checkbox option element across native inputs and role-based elements
function selectOptionElement(el){
  try{
    if(!el) return false;
    const tag = (el.tagName || '').toLowerCase();
    const role = el.getAttribute && el.getAttribute('role');

    // native input (fast path)
    if(tag === 'input' && (el.type === 'radio' || el.type === 'checkbox')){
      el.checked = true;
      el.dispatchEvent(new Event('change', {bubbles:true}));
      el.dispatchEvent(new Event('input', {bubbles:true}));
      return true;
    }

    function tryClick(target){
      if(!target) return false;
      try{
        const evOpts = { bubbles: true, cancelable: true, composed: true };
        try{ target.dispatchEvent(new PointerEvent('pointerdown', evOpts)); }catch(e){}
        try{ target.dispatchEvent(new MouseEvent('mousedown', evOpts)); }catch(e){}
        try{ target.dispatchEvent(new MouseEvent('mouseup', evOpts)); }catch(e){}
        try{ target.dispatchEvent(new MouseEvent('click', evOpts)); }catch(e){}
        try{ target.click(); }catch(e){}
      }catch(e){}
      // verify selection state
      try{
        const aria = target.getAttribute && target.getAttribute('aria-checked');
        const inpChecked = (target.checked === true) || (target.getAttribute && target.getAttribute('checked') === 'true');
        if(aria === 'true' || inpChecked) return true;
        const rg = target.closest && (target.closest('[role="radiogroup"]') || target.closest('[role="group"]') || target.parentElement);
        if(rg){ const chosen = rg.querySelector && (rg.querySelector('[role="radio"][aria-checked="true"], input[type="radio"]:checked')); if(chosen) return true; }
      }catch(e){}
      return false;
    }

    // role-based radios/checkboxes (Google Forms): try clicking element and a few fallbacks
    if(role === 'radio' || role === 'checkbox'){
      if(tryClick(el)) return true;
      const lab = el.closest && el.closest('label'); if(lab && tryClick(lab)) return true;
      const childBtn = el.querySelector && (el.querySelector('[jscontroller], button, div[role="radio"], div[role="checkbox"]'));
      if(childBtn && tryClick(childBtn)) return true;
      // fallback: try clicking parent label again
      if(lab){ try{ lab.click(); }catch(e){} }
      // final verification: check if any sibling input appears checked
      try{ const rg = el.closest && (el.closest('[role="radiogroup"]') || el.closest('[role="group"]') || el.parentElement); if(rg){ const chosen = rg.querySelector && (rg.querySelector('[role="radio"][aria-checked="true"], input[type="radio"]:checked')); if(chosen) return true; } }catch(e){}
      return false;
    }

    // if it's a label element, click it
    if(tag === 'label'){ try{ el.click(); return true; }catch(e){} }

    // fallback: find a native input inside and set it
    const innerInput = el.querySelector && (el.querySelector('input[type="radio"]') || el.querySelector('input[type="checkbox"]'));
    if(innerInput){ innerInput.checked = true; innerInput.dispatchEvent(new Event('change', {bubbles:true})); return true; }
  }catch(e){ /* ignore selectOptionElement error */ }
  return false;
}

// Robustly fill a text-like input (handles Google Forms controlled inputs).
// Robustly fill a text-like input (handles Google Forms controlled inputs).
function fillTextInput(el, value){
  try{
    if(!el) return false;
    const tag = (el.tagName||'').toLowerCase();

    // focus first
    try{ el.focus && el.focus(); }catch(e){}

    // If it's a native input/textarea, try direct set + events
    if(tag === 'input' || tag === 'textarea'){
      try{ el.value = value; }catch(e){}
      try{ el.setAttribute && el.setAttribute('value', value); }catch(e){}
      try{ el.dispatchEvent && el.dispatchEvent(new InputEvent('input', {bubbles:true})); }catch(e){}
      try{ el.dispatchEvent && el.dispatchEvent(new Event('change',{bubbles:true})); }catch(e){}
      return true;
    }

    // contenteditable or other element: try setting innerText
    try{
      if(el.isContentEditable){ el.innerText = value; el.dispatchEvent && el.dispatchEvent(new InputEvent('input', {bubbles:true})); return true; }
    }catch(e){}

    // Many Google Forms inputs are wrapped; try to find inner native input
    try{
      const inner = el.querySelector && (el.querySelector('input[type="text"], textarea') || el.querySelector('[jsname="YPqjbf"]'));
      if(inner){ return fillTextInput(inner, value); }
    }catch(e){}

    // Fallback: try setting value/textContent and dispatch input/change
    try{
      try{ el.value = value; }catch(e){}
      try{ el.textContent = value; }catch(e){}
      try{ el.setAttribute && el.setAttribute('value', value); }catch(e){}
      try{ el.dispatchEvent && el.dispatchEvent(new InputEvent('input', {bubbles:true})); }catch(e){}
      try{ el.dispatchEvent && el.dispatchEvent(new Event('change', {bubbles:true})); }catch(e){}
      return true;
    }catch(e){}
  }catch(e){ /* ignore fillTextInput error */ }
  return false;
}


function getOptionLabel(opt){
  if(!opt) return '';
  // common straightforward cases
  // data-value or aria-label (Google Forms uses data-value on role=radio divs)
  try{ const dv = opt.getAttribute && (opt.getAttribute('data-value')); if(dv) return String(dv).trim(); }catch(e){}
  try{ const aLabel = opt.getAttribute && (opt.getAttribute('aria-label') || opt.getAttribute('title')); if(aLabel) return String(aLabel).trim(); }catch(e){}
  // next sibling / parent text
  if(opt.nextElementSibling && opt.nextElementSibling.innerText) return opt.nextElementSibling.innerText.trim();
  if(opt.parentElement && opt.parentElement.innerText) return opt.parentElement.innerText.trim();
  if(opt.labels && opt.labels.length) return Array.from(opt.labels).map(l=>l.innerText).join(' ').trim();
  // aria-label or title
  // Sometimes option text is rendered in nearby spans/divs - search a few levels up
  try{
    let el = opt;
    for(let depth=0; depth<4 && el; depth++){
      const nearby = el.querySelectorAll && el.querySelectorAll('div, span, label');
      if(nearby && nearby.length){
        for(const c of Array.from(nearby)){
          const txt = (c.innerText || c.textContent || '').trim();
          if(txt && txt.length>0) return txt;
        }
      }
      el = el.parentElement;
    }
  }catch(e){}
  return opt.getAttribute('value') || '';
}

function tokenOverlapScore(a, b){
  if(!a || !b) return 0;
  const at = a.split(/\W+/).filter(Boolean);
  const bt = b.split(/\W+/).filter(Boolean);
  if(at.length===0 || bt.length===0) return 0;
  const overlap = at.filter(t=>bt.includes(t)).length;
  return overlap;
}

// Produces a matching score between a profile value and an option canonical form
// Higher is better. Exact canonical match -> very high. Acronym match -> high.
// Partial token overlap is normalized by option token count to prefer tighter matches
function matchScore(pvRaw, optCanon, optLabel){
  if(!pvRaw || !optCanon) return 0;
  const pvCanon = canonicalize(pvRaw);
  const pvAcr = acronymize(pvRaw);
  const optAcr = acronymize(optLabel || optCanon);
  // exact canonical match
  if(pvCanon === optCanon) return 10000;
  // acronym match
  if(pvAcr && optAcr && pvAcr === optAcr) return 9000;
  // token overlap
  const overlap = tokenOverlapScore(pvCanon, optCanon);
  if(overlap <= 0) return 0;
  const optTokens = (optCanon.split(/\s+/).filter(Boolean).length) || 1;
  const pvTokens = (pvCanon.split(/\s+/).filter(Boolean).length) || 1;
  // normalized proportion of option tokens that match
  const prop = overlap / optTokens;
  // base score influenced by overlap and proportion, penalize extra tokens in option
  let score = overlap * 100 + Math.round(prop * 500) - Math.max(0, (optTokens - overlap)) * 40;
  // small boost if profile contains all option tokens (reverse proportion)
  const reverseProp = overlap / pvTokens;
  score += Math.round(reverseProp * 50);
  return Math.max(0, Math.round(score));
}

// Normalize strings for robust matching (remove punctuation, unify common variants)
function canonicalize(str){
  if(!str) return '';
  let s = String(str).toLowerCase().trim();
  // replace ampersand with and
  s = s.replace(/&/g,' and ');
  // remove dots and commas and slashes
  s = s.replace(/[\.,\/]/g,' ');
  // normalize multiple spaces
  s = s.replace(/\s+/g,' ').trim();
  // common degree variants
  s = s.replace(/b\s*tech|btech|b\.tech/gi,'btech');
  s = s.replace(/m\s*tech|mtech|m\.tech/gi,'mtech');
  // branch aliases and common shorthand
  s = s.replace(/cse\s*\(ai and ml\)|cse\s*\(ai&ml\)|cse\s*\(ai ml\)/gi,'cse ai ml');
  s = s.replace(/cse-?ai-?ml/gi,'cse ai ml');
  s = s.replace(/computer science and engineering|computer science engineering/gi,'cse');
  s = s.replace(/computer science/gi,'cse');
  s = s.replace(/civil engineering|civil engg/gi,'civil');
  s = s.replace(/electrical and electronics engineering|eee/gi,'eee');
  s = s.replace(/electrical engineering/gi,'ee');
  s = s.replace(/mechanical engineering|mech/gi,'me');
  s = s.replace(/information technology|it\b/gi,'it');
  s = s.replace(/csm\b/gi,'csm');
  // remove punctuation left
  s = s.replace(/[^a-z0-9\s]/g,'');
  s = s.replace(/\s+/g,' ').trim();
  return s;
}

// Produce an acronym from a phrase, e.g., 'Jawaharlal Nehru Technological University' => 'jntu'
function acronymize(str){
  if(!str) return '';
  try{
    const words = String(str).replace(/[^a-zA-Z0-9\s]/g,' ').split(/\s+/).filter(Boolean);
    if(words.length === 0) return '';
    // if the string already looks like an acronym (all caps, short), return lowercased
    if(/^[A-Z0-9]{2,6}$/.test(str.trim())) return str.trim().toLowerCase();
    // take first letters of words longer than 1 char, but include single-letter words too
    const letters = words.map(w => w[0]).join('');
    return letters.toLowerCase();
  }catch(e){ return ''; }
}

// --- New helpers to avoid auto-filling generic Yes/No groups ---
function isGenericYesNoOptions(optionLabels){
  if(!optionLabels || !optionLabels.length) return false;
  const yesNo = new Set(['yes','no','y','n','true','false','agree','disagree']);
  // all options should be one-word tokens matching yes/no-like words
  return optionLabels.every(l => {
    if(!l) return false;
    const tok = String(l).trim().toLowerCase();
    // some labels include punctuation — strip non-word
    const clean = tok.replace(/[^a-z0-9]/g,'');
    return yesNo.has(clean);
  });
}

const BOOLEAN_LABEL_KEYWORDS = [
  'relocat','relocation','work from office','work from home','work from','office','attend','attendance',
  'interview','face to face','face-to-face','available','availability','ready','willing','able','onsite','remote',
  'agree','consent','accept'
];

function labelLooksBoolean(labelText){
  if(!labelText) return false;
  const s = labelText.toLowerCase();
  return BOOLEAN_LABEL_KEYWORDS.some(k => s.includes(k));
}

// ---------------------------------------------------------------

// Build a prioritized list of profile fields to try matching against option labels
function getProfileMatchCandidates(profile){
  if(!profile || typeof profile !== 'object') return [];
  const keys = [];
  // Priority order: branch, college/institute, highest qualification (if present), gender, relocate
  if(profile.branch) keys.push({key:'branch', val: String(profile.branch)});
  if(profile.college) keys.push({key:'college', val: String(profile.college)});
  // support alternate field names if present
  if(profile.highestQualification) keys.push({key:'highestQualification', val: String(profile.highestQualification)});
  if(profile.qualification) keys.push({key:'qualification', val: String(profile.qualification)});
  if(profile.gender) keys.push({key:'gender', val: String(profile.gender)});
  if(profile.relocate) keys.push({key:'relocate', val: String(profile.relocate)});
  // include fullname/email/phone as low-priority (avoid accidental matches)
  if(profile.fullName) keys.push({key:'fullName', val: String(profile.fullName)});
  if(profile.email) keys.push({key:'email', val: String(profile.email)});
  // normalize values (also keep canonical forms)
  return keys.map(k=>({ key: k.key, val: (k.val||'').toLowerCase().trim(), canon: canonicalize(k.val||''), acr: acronymize(k.val||'') })).filter(k=>k.val && k.val.length>0);
}

// simple helper to safely escape strings for RegExp construction
function escapeRegExp(s){
  try{ return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }catch(e){ return String(s); }
}

// Resolve aria-labelledby strings that contain multiple ids (e.g., "i1 i4")
// Resolve aria-labelledby strings that contain multiple ids (e.g., "i1 i4").
// If a root element is provided, prefer resolving ids within that root to avoid mixing labels from other questions.
function resolveAriaLabelIds(idStr, root){
  if(!idStr || typeof idStr !== 'string') return null;
  const ids = String(idStr).trim().split(/\s+/).filter(Boolean);
  if(ids.length === 0) return null;
  try{
    const parts = ids.map(id => {
      try{
        // prefer a local resolution inside the provided root
        let el = null;
        if(root && root.querySelector){
          try{ el = root.querySelector('#' + CSS.escape(id)); }catch(e){}
        }
        if(!el) el = document.getElementById(id);
        return el ? ((el.innerText||el.textContent||'').trim()) : '';
      }catch(e){ return ''; }
    }).filter(Boolean);
    if(parts.length>0){
      return parts.join(' ');
    }
  }catch(e){ /* ignore */ }
  return null;
}

function showProfileChooser(profiles){
  const existing = document.getElementById('af-profile-chooser');
  if(existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.id = 'af-profile-chooser';
  overlay.style.position = 'fixed';
  overlay.style.top = '16px';
  overlay.style.right = '16px';
  overlay.style.zIndex = 2147483647;
  overlay.style.background = 'white';
  overlay.style.border = '1px solid #ddd';
  overlay.style.padding = '12px';
  overlay.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
  const title = document.createElement('div'); title.style.fontWeight = '600'; title.textContent = 'Choose profile to use';
  overlay.appendChild(title);
  const sel = document.createElement('select'); sel.style.marginTop = '8px'; sel.style.width = '100%';
  Object.keys(profiles).forEach(name=>{ const o = document.createElement('option'); o.value = name; o.textContent = name; sel.appendChild(o); });
  overlay.appendChild(sel);
  const actions = document.createElement('div'); actions.style.marginTop = '10px';
  const useBtn = document.createElement('button'); useBtn.textContent = 'Use profile'; useBtn.style.marginRight='8px';
  const cancelBtn = document.createElement('button'); cancelBtn.textContent = 'Cancel';
  actions.appendChild(useBtn); actions.appendChild(cancelBtn);
  overlay.appendChild(actions);
  document.body.appendChild(overlay);
  cancelBtn.addEventListener('click', ()=>overlay.remove());
  useBtn.addEventListener('click', ()=>{
    const name = sel.value;
    const profile = profiles[name];
    const candidates = computeCandidatesForProfile(profile);
    overlay.remove();
    if(candidates.length === 0){ alert('No fields could be confidently matched for profile: '+name); return; }
    // remember last used profile
    try{ chrome.storage.local.set({ lastUsedProfile: name }); }catch(e){}
    showPreviewOverlay(candidates, profile, name);
  });
}


function showPreviewOverlay(candidates, profile){
  // remove existing overlay if any
  const existing = document.getElementById('af-preview-overlay');
  if(existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.id = 'af-preview-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '16px';
  overlay.style.right = '16px';
  overlay.style.zIndex = 2147483647;
  overlay.style.maxWidth = '420px';
  overlay.style.background = 'white';
  overlay.style.border = '1px solid #ddd';
  overlay.style.padding = '12px';
  overlay.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
  overlay.style.fontSize = '13px';
  // Check if there are any low confidence matches
  const hasAmbiguousMatches = candidates.some(c => (c.score || 0) < 50);
  
  overlay.innerHTML = `<div style="font-weight:600;margin-bottom:8px">
    Autofill preview
    ${hasAmbiguousMatches ? 
      `<div style="font-size:12px;color:#e67e22;margin-top:4px">
        ⚠️ Some fields have low confidence matches. Please review carefully.
       </div>` : ''}
  </div>`;
  const list = document.createElement('div');
  list.style.maxHeight = '320px';
  list.style.overflow = 'auto';
  // add select-all control
  const selectAllRow = document.createElement('div');
  selectAllRow.style.marginBottom = '8px';
  selectAllRow.innerHTML = `<label style="font-size:13px"><input type="checkbox" id="af-select-all" checked style="margin-right:8px"> Select all</label>`;
  list.appendChild(selectAllRow);
  // Group candidates by question root selector (if available) or by label text so multiple
  // candidates that belong to the same question render as a single preview row with combined options.
  const groups = new Map();
  candidates.forEach((c, i)=>{
    // derive a stable key: prefer root element selector, else el selector, else the label string
    const rootSel = (c.root && elementToSelector(c.root)) || (c.el && elementToSelector(c.el)) || (c.label || '').trim() || `idx-${i}`;
    if(!groups.has(rootSel)) groups.set(rootSel, { indices: [], merged: null });
    groups.get(rootSel).indices.push(i);
    // set merged candidate meta if not present
    if(!groups.get(rootSel).merged){
      // shallow copy of candidate as base
      groups.get(rootSel).merged = Object.assign({}, c);
      groups.get(rootSel).merged._origIndices = [i];
    } else {
      // merge options if present
      const m = groups.get(rootSel).merged;
      m._origIndices.push(i);
      if(c.options && c.options.length>0){
        m.options = m.options || [];
        // append new options that are not already present (by label)
        c.options.forEach(o=>{ if(!m.options.find(x=>x.label===o.label)) m.options.push(o); });
      }
      // prefer the candidate with higher score for chosen/label/key
      if((c.score||0) > (m.score||0)){
        m.chosen = c.chosen || m.chosen;
        m.chosenLabel = c.chosenLabel || m.chosenLabel;
        m.key = c.key || m.key;
        m.label = m.label || c.label;
        m.score = c.score;
      }
    }
  });

  const grouped = Array.from(groups.values()).map(g=>g.merged || null).filter(Boolean);
  // Secondary merge: if multiple groups share the same normalized label, merge them
  const labelMap = new Map();
  grouped.forEach(g => {
    const lab = (g.label || '').toString().trim().toLowerCase();
    const norm = lab.replace(/\s+/g,' ').trim();
    if(!norm) return;
    if(!labelMap.has(norm)) labelMap.set(norm, Object.assign({}, g));
    else {
      const existing = labelMap.get(norm);
      // merge orig indices
      existing._origIndices = Array.from(new Set([...(existing._origIndices||[]), ...(g._origIndices||[])]));
      // merge options by label
      existing.options = existing.options || [];
      (g.options||[]).forEach(o=>{ if(!existing.options.find(x=>x.label===o.label)) existing.options.push(o); });
      // prefer higher score
      if((g.score||0) > (existing.score||0)){
        existing.chosen = g.chosen || existing.chosen;
        existing.chosenLabel = g.chosenLabel || existing.chosenLabel;
        existing.key = g.key || existing.key;
        existing.label = existing.label || g.label;
        existing.score = g.score;
      }
    }
  });
  const finalGroups = Array.from(labelMap.values()).filter(Boolean);
  // Render grouped candidates (use finalGroups which merged identical labels)
  const renderGroups = finalGroups.length > 0 ? finalGroups : grouped;
  renderGroups.forEach((c, groupIdx)=>{
    const origIndices = c._origIndices || [];
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.alignItems = 'flex-start';
    row.style.marginBottom = '8px';
    const isLowConfidence = (c.score || 0) < 50;
  // Use the first original index as a primary index but record all original indices
  const primaryIdx = origIndices[0];
  // data-orig contains comma-separated original candidate indices so Apply can expand grouped rows
  row.innerHTML = `<input type="checkbox" data-idx="${primaryIdx}" data-orig="${origIndices.join(',')}" checked style="margin-right:8px;margin-top:6px"/>`;
    if(isLowConfidence){ row.style.backgroundColor = 'rgba(230, 126, 34, 0.1)'; row.style.padding = '8px'; row.style.margin = '0 -8px 8px -8px'; }
    const info = document.createElement('div');
    const title = document.createElement('div'); title.style.fontWeight = '600';
    let displayLabel = (c.label || '').toString().trim();
    if(!displayLabel || displayLabel === '(no label)'){
      try{ if(c.root) displayLabel = getLabelTextFromRoot(c.root) || displayLabel; if((!displayLabel || displayLabel === '(no label)') && c.el){ const root = c.el.closest && (c.el.closest('.freebirdFormviewerComponentsQuestionBaseRoot') || c.el.closest('.question') || c.el.closest('div[role="listitem"]')); if(root) displayLabel = getLabelTextFromRoot(root) || displayLabel; } }catch(e){}
    }
    if(!displayLabel || displayLabel === '(no label)'){
      if(c.options && c.options.length>0){ const optSample = c.options.slice(0,4).map(o=>o.label).filter(Boolean).join(', '); displayLabel = `Question — options: ${optSample}`; }
      else displayLabel = '(question label not found)';
    }
    title.textContent = displayLabel;
    const subtitle = document.createElement('div'); subtitle.style.color = '#444';
    const meta = document.createElement('div'); meta.style.fontSize='11px'; meta.style.color = (c.score || 0) < 50 ? '#e67e22' : '#888';
    meta.textContent = (c.score || 0) < 50 ? `⚠️ Low confidence match (score: ${c.score||0}). Please verify.` : `match: ${c.key} score: ${c.score||0}`;
    // Render controls based on merged type (prefer select/radio/checkbox rendering when options exist)
    if(c.type === 'text' && !c.options){ subtitle.textContent = String(c.value); }
    else if(c.options && c.options.length>0){
      // render dropdown for select/radio-like grouped options
  const sel = document.createElement('select'); sel.style.width='100%';
      c.options.forEach(opt=>{ const o = document.createElement('option'); o.value = opt.value || opt.label; o.textContent = opt.label; if((c.chosen && opt.label===c.chosen.label) || (c.chosenLabel && opt.label===c.chosenLabel)) o.selected=true; sel.appendChild(o); });
  subtitle.appendChild(sel); sel.setAttribute('data-idx', primaryIdx); sel.setAttribute('data-orig', origIndices.join(','));
    } else if(c.type === 'checkbox'){
      const container = document.createElement('div');
  (c.options||[]).forEach(opt=>{ const cb = document.createElement('label'); cb.style.display='block'; cb.style.fontSize='13px'; const input = document.createElement('input'); input.type='checkbox'; input.style.marginRight='6px'; if(c.chosenLabels && c.chosenLabels.includes(opt.label)) input.checked = true; input.setAttribute('data-idx', primaryIdx); input.setAttribute('data-orig', origIndices.join(',')); input.setAttribute('data-opt', opt.label); cb.appendChild(input); cb.appendChild(document.createTextNode(opt.label)); container.appendChild(cb); });
      subtitle.appendChild(container);
    }
    info.appendChild(title); info.appendChild(subtitle); info.appendChild(meta);
    row.appendChild(info); list.appendChild(row);
  });
  overlay.appendChild(list);
  // If debugging enabled, show a compact metadata panel with candidate info
  if(AF_DEBUG){
    const dbg = document.createElement('div'); dbg.style.marginTop='8px'; dbg.style.maxHeight='120px'; dbg.style.overflow='auto'; dbg.style.fontSize='12px'; dbg.style.background='#f7f7f7'; dbg.style.padding='8px'; dbg.style.borderRadius='6px';
    const dbgTitle = document.createElement('div'); dbgTitle.style.fontWeight='600'; dbgTitle.textContent = 'DEBUG: candidate metadata'; dbg.appendChild(dbgTitle);
    candidates.forEach((c, idx)=>{
      try{
        const row = document.createElement('div'); row.style.marginTop='6px'; row.style.borderTop='1px solid #eee'; row.style.paddingTop='6px';
        const meta = document.createElement('div'); meta.textContent = `#${idx} key=${c.key||''} score=${c.score||0} label=${(c.label||'').slice(0,80)}`;
        const selInfo = document.createElement('div'); selInfo.style.color='#666'; selInfo.style.fontSize='11px'; selInfo.textContent = `root=${c.rootSelector||c.root?elementToSelector(c.root):''} el=${c.elSelector||c.el?elementToSelector(c.el):''}`;
        row.appendChild(meta); row.appendChild(selInfo); dbg.appendChild(row);
        console.log('[AutoFill][DEBUG] candidate', idx, c);
      }catch(e){}
    });
    overlay.appendChild(dbg);
  }
  const actions = document.createElement('div');
  actions.style.marginTop = '10px';
  const applyBtn = document.createElement('button');
  applyBtn.textContent = 'Apply selected';
  applyBtn.style.marginRight = '8px';
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  actions.appendChild(applyBtn);
  actions.appendChild(cancelBtn);
  overlay.appendChild(actions);
  document.body.appendChild(overlay);

  cancelBtn.addEventListener('click', ()=>overlay.remove());
  // select-all behavior
  const selectAllControl = overlay.querySelector('#af-select-all');
  if(selectAllControl){
    selectAllControl.addEventListener('change', (e)=>{
      const checked = e.target.checked;
      Array.from(overlay.querySelectorAll('input[type="checkbox"][data-idx]')).forEach(cb=>cb.checked = checked);
    });
  }
  applyBtn.addEventListener('click', ()=>{
    // find all checked primary checkboxes and also any selected controls (selects/checkboxes inside grouped rows)
    // We'll collect a set of original candidate indices that should be applied.
    const origIndicesSet = new Set();
    // primary row checkboxes
    Array.from(overlay.querySelectorAll('input[type="checkbox"][data-idx]')).forEach(cb=>{
      if(cb.checked){
        const orig = cb.getAttribute('data-orig');
        if(orig){ orig.split(',').map(s=>s.trim()).filter(Boolean).forEach(si=>origIndicesSet.add(Number(si))); }
        else { const idx = Number(cb.getAttribute('data-idx')); if(!isNaN(idx)) origIndicesSet.add(idx); }
      }
    });
    // also include selects (in case user changed a dropdown selection but left the primary checkbox unchecked)
    Array.from(overlay.querySelectorAll('select[data-idx]')).forEach(selControl=>{
      const orig = selControl.getAttribute('data-orig');
      if(orig){ orig.split(',').map(s=>s.trim()).filter(Boolean).forEach(si=>origIndicesSet.add(Number(si))); }
      else { const idx = Number(selControl.getAttribute('data-idx')); if(!isNaN(idx)) origIndicesSet.add(idx); }
    });

    // for each original candidate index, apply using existing logic
    Array.from(origIndicesSet).forEach(idx=>{
      const c = candidates[idx]; if(!c) return;
      if(c.type === 'text'){
        const inp = c.el;
        try{
          const ok = fillTextInput(inp, c.value);
          inp.setAttribute && inp.setAttribute('data-autofill-key', c.key);
          inp.setAttribute && inp.setAttribute('data-autofill-score', String(c.score || 0));
        }catch(e){ /* ignore apply text error */ }
      }else if(c.type === 'select'){
        // for selects, find corresponding control in overlay using data-orig or data-idx mapping
        // we prefer overlay select mapped to the group's primary index
        const selControl = overlay.querySelector(`select[data-orig][data-orig*="${idx}"]`) || overlay.querySelector(`select[data-idx="${idx}"]`);
        if(selControl){ const sel = c.el; try{ sel.value = selControl.value; sel.dispatchEvent(new Event('change',{bubbles:true})); }catch(e){} }
      }else if(c.type === 'radio'){
        const selControl = overlay.querySelector(`select[data-orig][data-orig*="${idx}"]`) || overlay.querySelector(`select[data-idx="${idx}"]`);
        const chosenLabel = selControl ? selControl.value : c.chosenLabel;
        const opt = c.options.find(o=>o.label === chosenLabel);
        if(opt && opt.el){
          selectOptionElement(opt.el);
        }
      }else if(c.type === 'checkbox'){
        // For checkbox groups, there may be multiple options per original candidate.
        // Find overlay inputs that include this original idx in data-orig and check those.
        const inputs = Array.from(overlay.querySelectorAll(`input[type="checkbox"][data-orig]`)).filter(i=>{
          const orig = i.getAttribute('data-orig') || '';
          return orig.split(',').map(s=>s.trim()).includes(String(idx));
        });
        inputs.forEach(iEl=>{
          const optLabel = iEl.getAttribute('data-opt');
          const opt = c.options.find(o=>o.label === optLabel);
          if(opt && opt.el){ if(iEl.checked) selectOptionElement(opt.el); }
        });
      }
    });
    overlay.remove();
    showToast('Selected fields applied. Please review the form before submitting.');
  });
}

/**
 * Shows a toast notification message
 * @param {string} msg - The message to show
 * @param {number} timeout - How long to show the toast (in ms)
 */
function showToast(msg, timeout=2500){
  try{
    let t = document.getElementById('af-toast');
    if(t) t.remove();
    t = document.createElement('div');
    t.id = 'af-toast';
    applyStyles(t, {
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(0,0,0,0.85)',
      color: 'white',
      padding: '8px 12px',
      borderRadius: '6px',
      zIndex: '2147483647',
      fontSize: '13px'
    });
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(()=>{ try{ t.remove(); }catch(e){} }, timeout);
  }catch(e){ try{ alert(msg); }catch(e2){} }
}

function escapeHtml(str){
  return String(str).replace(/[&<>\"]/g, (c)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
}

function findQuestionTextForElement(el){
  // Google Forms uses complex structure; check aria attributes first
  try{
    if(el.getAttribute){
      const ariaLabel = el.getAttribute('aria-label');
      if(ariaLabel && typeof ariaLabel === 'string' && ariaLabel.trim().length>0) return ariaLabel.trim();
      const ariaLabelledBy = el.getAttribute('aria-labelledby');
      // determine a sensible question root to prefer local id resolution
      const qRoot = el.closest && (el.closest('.freebirdFormviewerComponentsQuestionBaseRoot') || el.closest('.question') || el.closest('.gform') || el.closest('div[role="listitem"]'));
      if(ariaLabelledBy && typeof ariaLabelledBy === 'string' && ariaLabelledBy.trim().length>0){
        const resolved = resolveAriaLabelIds(ariaLabelledBy, qRoot);
        if(resolved) return resolved;
      }
    }
  }catch(e){}
  // fallback: find a better question root by searching up for known Google Forms containers
  try{
    const findQuestionRoot = (node) => {
      if(!node) return null;
      const candidates = ['.freebirdFormviewerComponentsQuestionBaseRoot', '.freebirdFormviewerViewItemsItemItem', '.freebirdFormviewerViewItemsItemItemRoot', '.question', '.gform', 'div[role="listitem"]'];
      let cur = node;
      for(let i=0;i<6 && cur;i++){
        for(const sel of candidates){ try{ if(cur.matches && cur.matches(sel)) return cur; }catch(e){}
        }
        cur = cur.parentElement;
      }
      // as last resort, return the closest ancestor that contains a role=heading
      cur = node;
      while(cur){ try{ if(cur.querySelector && cur.querySelector('[role="heading"], .M7eMe, .freebirdFormviewerComponentsQuestionBaseTitle')) return cur; }catch(e){} cur = cur.parentElement; }
      return null;
    };
    const altRoot = findQuestionRoot(el);
    if(altRoot){
      // try aria-labelledby resolution scoped to the altRoot (if present)
      try{ const ab = el.getAttribute && el.getAttribute('aria-labelledby'); if(ab){ const r = resolveAriaLabelIds(ab, altRoot); if(r) return r; } }catch(e){}
      // check for common title spans inside altRoot (Google Forms often uses .M7eMe)
      try{ const t = altRoot.querySelector('.freebirdFormviewerComponentsQuestionBaseTitle, .M7eMe, [role="heading"]'); if(t && (t.innerText||t.textContent)) return (t.innerText||t.textContent).trim(); }catch(e){}
    }
  }catch(e){}
  // if aria-labelledby is present, it may reference multiple ids; resolve them
  try{
    if(el.getAttribute){
      const ab = el.getAttribute('aria-labelledby');
      if(ab && typeof ab === 'string'){
        const ids = ab.trim().split(/\s+/).filter(Boolean);
        const parts = ids.map(i=>{ const e = document.getElementById(i); return e ? ((e.innerText||e.textContent||'').trim()) : ''; }).filter(Boolean);
        if(parts.length>0){ return parts.join(' '); }
      }
    }
  }catch(e){}
  // try preceding text (sample pages: .question -> .q-title)
  const sampleRoot = el.closest && (el.closest('.question') || el.closest('.gform'));
  if(sampleRoot){
    const q = el.closest('.question') ? el.closest('.question').querySelector('.q-title') : sampleRoot.querySelector('.q-title');
    if(q) return q.innerText || q.textContent;
  }
  const p = el.closest && (el.closest('.quantumWizTextinputPaperinputEl') || el.closest('.freebirdFormviewerComponentsQuestionBaseRoot'));
  if(p){
    const q = p.querySelector('.freebirdFormviewerComponentsQuestionBaseTitle') || p.querySelector('.freebirdFormviewerComponentsQuestionBaseHeader');
    if(q) return q.innerText || q.textContent;
  }
  // try label[for=id]
  try{
    const id = el.id || (el.getAttribute && el.getAttribute('id'));
    if(id){ const lab = document.querySelector('label[for="'+CSS.escape(id)+'"]'); if(lab && (lab.innerText||lab.textContent)) return lab.innerText||lab.textContent; }
  }catch(e){}
  // fallback: use placeholder or title
  try{ if(el.placeholder) return el.placeholder; if(el.title) return el.title; }catch(e){}
  return null;
}

function simpleMatch(label, profile){
  if(!label || !profile) return null;
  const s = canonicalize(String(label));
  // avoid false positives: if the label mentions course/cert/platform, prefer not to return fullName
  if(s.includes('name')){
    const courseKeywords = ['course','certif','certificate','cert','platform','institute','company','organization','organisation'];
    const containsCourse = courseKeywords.some(k=> s.includes(k));
    if(!containsCourse) return profile.fullName || null;
  }
  if(s.includes('email')) return profile.email || null;
  if(s.includes('phone') || s.includes('mobile') || s.includes('contact')) return profile.phone || null;
  if(s.includes('roll') || s.includes('enrol') || s.includes('registration')) return profile.rollNo || null;
  if(s.includes('cgpa') || s.includes('gpa') || s.includes('grade')) return profile.cgpa || null;
  if(s.includes('10th') || s.includes('tenth') || s.includes('ssc')) return profile.tenthPercent || null;
  if(s.includes('12th') || s.includes('twelfth') || s.includes('hsc')) return profile.twelfthPercent || null;
  if(s.includes('resume') || s.includes('cv')) return profile.resumeLink || null;
  if((s.includes('college') || s.includes('institution') || s.includes('university') || s.includes('institute') || s.includes('college name') || s.includes('name of college') || s.includes('name of institution')) && profile.college) return profile.college;
  if(s.includes('branch') || s.includes('stream') || s.includes('department')) return profile.branch || null;
  // graduation / passing year / passing out / yop - removed from profile mapping
  if(s.includes('graduat') || s.includes('passing') || s.includes('pass out') || s.includes('yop') || s.includes('year') || /\b20\d{2}\b/.test(s)){
    return null;
  }
  // backlog numeric detection
  if(/backlog|arrear|active backlog|no of backlogs|number of backlogs/.test(s) && typeof profile.backlogCount !== 'undefined') return profile.backlogCount;
  // DOB / nationality
  if(s.includes('dob') || s.includes('date of birth')) return profile.dob || null;
  if(s.includes('nationality')) return profile.nationality || null;
  return null;
}

let afObserver = null;
function isSupportedForm(){
  // Basic heuristics for Google Forms and local test pages.
  // Keep production checks for docs.google.com/forms but allow local testing on localhost
  // and pages that use the lightweight sample classes (.gform / .question).
  const host = window.location.hostname || '';
  if(host.includes('docs.google.com') && window.location.pathname.includes('/forms')) return true;
  if(host.includes('forms.gle')) return true;
  // Allow local testing servers (localhost / 127.0.0.1)
  if(host === 'localhost' || host === '127.0.0.1') return true;
  // Other quick heuristics (covers some Google Forms DOM variants)
  if(document.querySelector('.freebirdFormviewerComponentsQuestionBaseRoot')) return true;
  // Also allow our sample pages which use .gform / .question classes
  if(document.querySelector('.gform') || document.querySelector('.question')) return true;
  return false;
}

function monitor(){
  if(!isSupportedForm()) return;
  ensureButton();
  if(afObserver) return; // already observing
  afObserver = new MutationObserver((mutations)=>{
    // only ensure button if body exists
    if(document.body) ensureButton();
    try{ adjustAutofillContainer(); }catch(e){}
    // remove stale overlays if URL changed (basic navigation guard)
    const preview = document.getElementById('af-preview-overlay');
    if(preview && !isSupportedForm()) preview.remove();
  });
  try{ afObserver.observe(document.body, {childList:true, subtree:true}); }catch(e){ /* ignore */ }
  // keep adjusted for resizes
  try{ window.addEventListener('resize', ()=>{ try{ adjustAutofillContainer(); }catch(e){} }); }catch(e){}
}

// listen for storage changes so the inline selector stays in sync with popup saves
try{
  if(chrome && chrome.storage && chrome.storage.onChanged && typeof chrome.storage.onChanged.addListener === 'function'){
    chrome.storage.onChanged.addListener((changes, area) => {
      if(area !== 'local') return;
      const sel = document.getElementById('af-profile-select');
      if(!sel) return;
      // if profilesV1 changed, repopulate
      if(changes.profilesV1){
        const newMap = changes.profilesV1.newValue || {};
        const last = (changes.lastUsedProfile && changes.lastUsedProfile.newValue) || null;
        try{ populateInlineProfileSelect(newMap, last); }catch(e){}
      }else if(changes.lastUsedProfile){
        // only lastUsedProfile changed
        try{ chrome.storage.local.get(['profilesV1','lastUsedProfile'], (res)=>{ if(res) populateInlineProfileSelect(res.profilesV1 || {}, res.lastUsedProfile); }); }catch(e){}
      }
    });
  }
}catch(e){ /* ignore on older browsers */ }

function importMatcherIfNeeded(){
  // placeholder to allow future dynamic imports; currently a no-op
  return Promise.resolve();
}

// Diagnostic helper: produce a JSON snapshot of questions, labels, controls and option texts
function dumpAllQuestionsJSON(){
  const out = [];
  const questionSelector = '.freebirdFormviewerComponentsQuestionBaseRoot, .freebirdFormviewerViewItemsItemItem, .freebirdFormviewerViewItemsItemItemRoot, .question, .gform .question, div[role="listitem"]';
  const roots = Array.from(document.querySelectorAll(questionSelector));
  // also try to include any inputs that aren't wrapped in the above selectors
  const extras = Array.from(document.querySelectorAll('input[aria-labelledby], input.whsOnd, textarea')).filter(el=>!roots.some(r=>r.contains(el)));
  roots.forEach(root=>{
    try{
      const title = getLabelTextFromRoot(root) || (root.innerText||root.textContent||'').trim().split('\n').map(s=>s.trim()).filter(Boolean)[0] || '(no title)';
      const inputs = Array.from(root.querySelectorAll('input, textarea, select, [role="radio"],[role="checkbox"]'));
      const controls = inputs.map(el=>{
        const tag = el.tagName ? el.tagName.toLowerCase() : (el.getAttribute && el.getAttribute('role')) || 'el';
        const aria = el.getAttribute && el.getAttribute('aria-labelledby');
        const label = getOptionLabel(el) || (el.getAttribute && el.getAttribute('aria-label')) || '';
        // options (for selects/radios)
        const opts = [];
        try{
          if(tag === 'select') for(const o of Array.from(el.options||[])) opts.push({value:o.value, label:o.text});
          const radios = el.closest && (el.closest('div') || el.parentElement) ? Array.from((el.closest && el.closest('div')) ? (el.closest('div').querySelectorAll('input[type="radio"], [role="radio"]') || []) : []) : [];
        }catch(e){}
        return {tag, label, ariaLabelledBy: aria || null, value: (el.value||''), opts};
      });
      out.push({title, node: root.tagName || 'div', controls});
    }catch(e){}
  });
  extras.forEach(el=>{
    try{
      const label = findQuestionTextForElement(el) || getOptionLabel(el) || (el.getAttribute && el.getAttribute('aria-label')) || '';
      out.push({title: label || '(detached input)', node: el.tagName || 'el', controls:[{tag: el.tagName.toLowerCase(), label, value: el.value||''}]});
    }catch(e){}
  });
  return out;
}

monitor();
