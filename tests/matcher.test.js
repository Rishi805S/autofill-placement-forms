const { matchQuestionToField } = require('../matcher.js');

const profile = {
  fullName: 'Rishi Kumar',
  email: 'rishi@example.com',
  phone: '+919123456789',
  cgpa: '8.6',
  rollNo: '18XX001',
  resumeLink: 'https://drive.google.com/resume',
  college: 'My College',
  gender: 'Male',
  relocate: 'Yes'
};

const cases = [
  {q: 'Please enter your full name', expect: 'fullName'},
  {q: 'Candidate name (first & last)', expect: 'fullName'},
  {q: 'What is your email address?', expect: 'email'},
  {q: 'Enter your e-mail', expect: 'email'},
  {q: 'Phone / Mobile number', expect: 'phone'},
  {q: 'WhatsApp number', expect: 'phone'},
  {q: 'Enter your GPA or CGPA', expect: 'cgpa'},
  {q: 'Aggregate / Percentage', expect: 'cgpa'},
  {q: '10th Percentage (SSC)', expect: 'tenthPercent'},
  {q: '12th / HSC percentage', expect: 'twelfthPercent'},
  {q: 'College roll number', expect: 'rollNo'},
  {q: 'Upload your resume (link)', expect: 'resumeLink'},
  {q: 'Share your Google Drive link of CV', expect: 'resumeLink'},
  {q: 'Provide link to your LinkedIn or GitHub', expect: 'resumeLink'},
  {q: 'Which college are you from?', expect: 'college'},
  {q: 'Gender', expect: 'gender'},
  {q: 'Are you willing to relocate?', expect: 'relocate'},
  {q: 'Unrelated question about hobbies', expect: null}
];

describe('Autofill matcher', ()=>{
  cases.forEach(tc=>{
    test(`matches: ${tc.q}` , ()=>{
      const res = matchQuestionToField(tc.q, profile);
      const got = res && res.key ? res.key : null;
      const score = res && res.score ? res.score : 0;
      if(tc.expect === null){
        expect(got).toBeNull();
      }else{
        expect(got).toBe(tc.expect);
        expect(score).toBeGreaterThanOrEqual(38);
      }
    });
  });
});
