import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.UCSB_API_KEY;

// Check if API returns prerequisite data
const response = await fetch(
  'https://api.ucsb.edu/academics/curriculums/v1/classes/search?quarter=20251&subjectCode=ECON&pageSize=3&includeClassSections=false',
  {
    headers: {
      'ucsb-api-key': API_KEY,
      'Accept': 'application/json'
    }
  }
);

const data = await response.json();
console.log('First course full data:');
console.log(JSON.stringify(data.classes[0], null, 2));
console.log('\n--- All keys available ---');
console.log(Object.keys(data.classes[0]));
