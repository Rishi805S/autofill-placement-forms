// matcher.js - lightweight matcher exposed as window.AutofillMatcher
(function(){
  const aliases = {
    fullName: ['name','full name','candidate name','your name','applicant name','student name','student name (as on id)','student name as on id'],
    email: ['email','e-mail','mail id','email address','gmail','email id','preferred email','your email'],
    phone: ['phone','mobile','contact','phone number','mobile number','whatsapp','whatsapp number'],
    rollNo: ['roll','roll no','registration','enrol','enrollment','student id','roll number','admission no','admission number'],
    cgpa: ['cgpa','gpa','grade','aggregate','cpi','score'],
    tenthPercent: ['10th','tenth','ssc','class 10','percentage 10','10th percentage'],
    twelfthPercent: ['12th','twelfth','hsc','class 12','percentage 12','12th percentage','diploma percentage'],
    resumeLink: ['resume','cv','curriculum vitae','resume link','upload resume','link to resume','drive link','linkedin','github','portfolio'],
    college: ['college','institution','university','institute','college name'],
    gender: ['gender','sex','male','female','other'],
    relocate: ['relocate','willing to relocate','willing to shift','relocation','willing to travel','willing to relocate?','are you willing to relocate'],
    branch: ['branch','preferred branch','department','stream','discipline']
  };

  function normalize(s){
    // normalize, remove diacritics, collapse punctuation and whitespace
    try{
      s = String(s||'').normalize('NFD').replace(/\p{M}/gu,'');
    }catch(e){ s = String(s||''); }
    return s.toLowerCase().replace(/[\-–—]/g,' ').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
  }

  function scoreMatch(q, kw){
    q = normalize(q);
    kw = normalize(kw);
    if(!q || !kw) return 0;
    // exact phrase bonus
    if(q.indexOf(kw) !== -1) return 70;
    const qt = q.split(/\s+/).filter(Boolean);
    const kts = kw.split(/\s+/).filter(Boolean);
    let overlap = 0;
    kts.forEach(t=>{ if(t && qt.includes(t)) overlap++; });
    // partial token matches (prefix) score lower
    let partial = 0;
    kts.forEach(t=>{ if(t){ for(const qtok of qt){ if(qtok.startsWith(t) || t.startsWith(qtok)){ partial += 0.5; break; } } } });
    const base = (overlap * 16) + Math.floor(partial * 6);
    return base;
  }

  function detectPatterns(q){
    const patterns = {};
    if(/\b\d{1,2}(\.\d)?\b/.test(q) && /gpa|cgpa|grade|aggregate|cpi/.test(q)) patterns.gpa = true;
    if(/\b\d{1,3}%\b/.test(q) || /percentage|%/.test(q)) patterns.percent = true;
    if(/\b\d{6,13}\b/.test(q) || /phone|mobile|contact|whatsapp/.test(q)) patterns.phone = true;
    if(/\b\S+@\S+\.\S+\b/.test(q) || /email|e-mail/.test(q)) patterns.email = true;
    if(/resume|cv|drive|linkedin|github|portfolio|upload/.test(q)) patterns.resume = true;
    if(/relocate|relocation|willing to relocate|willing to shift/.test(q)) patterns.relocate = true;
    return patterns;
  }

  function matchQuestionToField(questionText, profile){
    const q = (questionText||'').toLowerCase();
    let best = {key:null,value:null,score:0};
    const patterns = detectPatterns(q);
    for(const [key, kws] of Object.entries(aliases)){
      for(const kw of kws){
        const s = scoreMatch(q, kw);
        let score = s;
        // pattern boosts
        if(key === 'email' && patterns.email) score += 40;
        if(key === 'phone' && patterns.phone) score += 30;
        if((key === 'cgpa' || key === 'tenthPercent' || key === 'twelfthPercent') && (patterns.gpa || patterns.percent)) score += 25;
        if(key === 'resumeLink' && patterns.resume) score += 35;
        if(key === 'relocate' && patterns.relocate) score += 30;
        if(score > best.score){ best = {key, value: profile[key] || null, score}; }
      }
    }
    // require minimum confidence (lower threshold for resume/relocate because patterns can be sparse)
    if(best.score < 38) return {key:null, value:null, score:best.score};
    return best;
  }

  if(typeof window !== 'undefined'){
    try{ window.AutofillMatcher = { matchQuestionToField }; }catch(e){ /* ignore */ }
  }
  // Export for Node/Jest environment
  if(typeof module !== 'undefined' && module.exports){
    module.exports = { matchQuestionToField };
  }
})();

