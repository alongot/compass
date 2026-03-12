/**
 * Test script to find the correct UCSB API configuration
 */

import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.UCSB_API_KEY;

console.log('Testing UCSB API configurations...\n');
console.log(`API Key (first 8 chars): ${API_KEY?.substring(0, 8)}...`);
console.log('');

const configs = [
  {
    name: 'v1 - classes/search',
    url: 'https://api.ucsb.edu/academics/curriculums/v1/classes/search?quarter=20251&subjectCode=ECON&pageSize=5',
    headers: { 'ucsb-api-key': API_KEY, 'ucsb-api-version': '1.0' }
  },
  {
    name: 'v3 - classes/search',
    url: 'https://api.ucsb.edu/academics/curriculums/v3/classes/search?quarter=20251&subjectCode=ECON&pageSize=5',
    headers: { 'ucsb-api-key': API_KEY, 'ucsb-api-version': '3.0' }
  },
  {
    name: 'v1 - no version header',
    url: 'https://api.ucsb.edu/academics/curriculums/v1/classes/search?quarter=20251&subjectCode=ECON&pageSize=5',
    headers: { 'ucsb-api-key': API_KEY }
  },
  {
    name: 'academics/courses',
    url: 'https://api.ucsb.edu/academics/courses?quarter=20251&subjectCode=ECON',
    headers: { 'ucsb-api-key': API_KEY }
  },
  {
    name: 'students/classes',
    url: 'https://api.ucsb.edu/students/classes?quarter=20251&subjectCode=ECON',
    headers: { 'ucsb-api-key': API_KEY }
  }
];

for (const config of configs) {
  try {
    console.log(`Testing: ${config.name}`);
    console.log(`URL: ${config.url}`);

    const response = await fetch(config.url, {
      headers: {
        ...config.headers,
        'Accept': 'application/json'
      }
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log(`SUCCESS! Got ${JSON.stringify(data).length} bytes`);
      console.log('Sample:', JSON.stringify(data).substring(0, 200));
    } else {
      const text = await response.text();
      console.log(`Error body: ${text.substring(0, 100)}`);
    }
  } catch (err) {
    console.log(`Error: ${err.message}`);
  }
  console.log('---\n');
}
