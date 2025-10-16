// matcher.js - lightweight matcher exposed as window.AutofillMatcher
// What it does:
// Exposes a lightweight matcher as window.AutofillMatcher
// When it's called:
// When the popup is opened
// Expected input and output:
// Input: None
// Output: The matcher is exposed as window.AutofillMatcher
// Why is this needed:
// To expose the matcher as window.AutofillMatcher


(function(){
  // aliases for common profile fields
  // This code defines field matching aliases to recognize different variations of form field names:
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

  // normalize string
  // What it does:
  // Normalizes a string
  // When it's called:
  // When the matcher is called
  // Expected input and output:
  // Input: The string to normalize
  // Output: The normalized string
  // Why is this needed:
  // To normalize the string
  // How it works:
  // It normalizes the string by removing diacritics, collapsing punctuation and whitespace
  function normalize(s){
    // normalize, remove diacritics, collapse punctuation and whitespace
    try{
      s = String(s||'').normalize('NFD').replace(/\p{M}/gu,''); // remove diacritics
    }catch(e){ s = String(s||''); } // fallback
    return s.toLowerCase().replace(/[\-–—]/g,' ').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim(); // collapse whitespace
  }

  // This function calculates a match score between a form field label and a keyword alias (higher score = better match):
  // What it does:
  // Scores a match
  // When it's called:
  // When the matcher is called
  // Expected input and output:
  // Input: The string to score
  // Output: The score
  // Why is this needed:
  // To score the match
  // How it works:
  // It scores the match by matching the string to the keywords
  // Explain Code
  function scoreMatch(q, kw){
    q = normalize(q); // normalize query ex: "Full Name" -> "full name"
    kw = normalize(kw); // normalize keyword ex: "full name" -> "full name"
    if(!q || !kw) return 0; // if either is empty, return 0 ex: "" -> 0
    // exact phrase bonus
    if(q.indexOf(kw) !== -1) return 70; // if query contains keyword, return 70 ex: "full name" -> 70
    const qt = q.split(/\s+/).filter(Boolean); // split query into tokens ex: "full name" -> ["full", "name"]
    const kts = kw.split(/\s+/).filter(Boolean); // split keyword into tokens ex: "full name" -> ["full", "name"]
    let overlap = 0; // count of overlapping tokens ex: ["full", "name"] -> 2
    kts.forEach(t=>{ if(t && qt.includes(t)) overlap++; });
    // partial token matches (prefix) score lower
    let partial = 0; // count of partial matches ex: ["full", "name"] -> 2
    kts.forEach(t=>{ if(t){ for(const qtok of qt){ if(qtok.startsWith(t) || t.startsWith(qtok)){ partial += 0.5; break; } } } }); // partial match ex: ["full", "name"] -> 2
    const base = (overlap * 16) + Math.floor(partial * 6); // base score ex: 2 * 16 + 2 * 6 = 44
    return base; // return base score
  }

  // This function detects patterns in a string:
  // What it does:
  // Detects patterns in a string
  // When it's called:
  // When the matcher is called
  // Expected input and output:
  // Input: The string to detect patterns in
  // Output: The patterns detected
  // Why is this needed:
  // To detect patterns in a string
  // How it works:
  // It detects patterns in the string by matching the string to the keywords
  // Explain Code
  function detectPatterns(q){
    const patterns = {};
    if(/\b\d{1,2}(\.\d)?\b/.test(q) && /gpa|cgpa|grade|aggregate|cpi/.test(q)) patterns.gpa = true; // detect gpa pattern ex: "3.5" -> true
    if(/\b\d{1,3}%\b/.test(q) || /percentage|%/.test(q)) patterns.percent = true; // detect percentage pattern ex: "35%" -> true
    if(/\b\d{6,13}\b/.test(q) || /phone|mobile|contact|whatsapp/.test(q)) patterns.phone = true; // detect phone pattern ex: "1234567890" -> true
    if(/\b\S+@\S+\.\S+\b/.test(q) || /email|e-mail/.test(q)) patterns.email = true; // detect email pattern ex: "abc@def.com" -> true
    if(/resume|cv|drive|linkedin|github|portfolio|upload/.test(q)) patterns.resume = true; // detect resume pattern ex: "resume" -> true
    if(/relocate|relocation|willing to relocate|willing to shift/.test(q)) patterns.relocate = true; // detect relocate pattern ex: "relocate" -> true
    return patterns;
  }

  // This function matches a question to a field:
  // What it does:
  // Matches a question to a field
  // When it's called:
  // When the matcher is called
  // Expected input and output:
  // Input: The question text and the profile
  // Output: The best match
  // Why is this needed:
  // To match a question to a field
  // How it works:
  // It matches the question to the field by matching the question to the keywords
  // Example Walkthrough
  // Input: questionText = "What is your full name?", profile = {fullName: "John Doe"}
  // Output: {key: "fullName", value: "John Doe", score: 70}
  // 1. Normalize question text: "What is your full name?" -> "what is your full name"
  // 2. Detect patterns: {email: false, phone: false, gpa: false, percent: false, resume: false, relocate: false}
  // 3. Loop through aliases: {fullName: ["name", "full name", "candidate name", "your name", "applicant name", "student name", "student name (as on id)", "student name as on id"]}
  // 4. Loop through keywords: ["name", "full name", "candidate name", "your name", "applicant name", "student name", "student name (as on id)", "student name as on id"]
  // 5. Score match: 70
  // 6. Return best match: {key: "fullName", value: "John Doe", score: 70}  
  function matchQuestionToField(questionText, profile){ // match question to field
    const q = (questionText||'').toLowerCase(); // normalize question text
    let best = {key:null,value:null,score:0}; // best match
    const patterns = detectPatterns(q); // detect patterns
    for(const [key, kws] of Object.entries(aliases)){ // loop through aliases
      for(const kw of kws){ // loop through keywords
        const s = scoreMatch(q, kw); // score match
        let score = s; // score
        // pattern boosts
        if(key === 'email' && patterns.email) score += 40; // boost email
        if(key === 'phone' && patterns.phone) score += 30; // boost phone
        if((key === 'cgpa' || key === 'tenthPercent' || key === 'twelfthPercent') && (patterns.gpa || patterns.percent)) score += 25; // boost gpa
        if(key === 'resumeLink' && patterns.resume) score += 35; // boost resume
        if(key === 'relocate' && patterns.relocate) score += 30; // boost relocate
        if(score > best.score){ best = {key, value: profile[key] || null, score}; } // update best match
      }
    }
    // require minimum confidence (lower threshold for resume/relocate because patterns can be sparse)
    if(best.score < 38) return {key:null, value:null, score:best.score}; // return best match if score is less than 38  
    return best;
  }
  
  // Expose matcher as window.AutofillMatcher
  if(typeof window !== 'undefined'){
    try{ window.AutofillMatcher = { matchQuestionToField }; }catch(e){ /* ignore */ }
  }
  // Export for Node/Jest environment
  if(typeof module !== 'undefined' && module.exports){
    module.exports = { matchQuestionToField };
  }
})();

