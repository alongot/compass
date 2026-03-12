/**
 * Find correct subject codes
 */

import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.UCSB_API_KEY;

// More codes to try
const TEST_CODES = [
  'FAMST',    // Film - found!
  'ENV ST',   // Environmental Studies
  'ESM',      // Environmental Science & Management
  'EARTH',    // Earth Science
  'GEOG',     // Geography (sometimes has env courses)
  'ES',
  'ENVSCI',
  'ENVST'
];

async function testCode(code) {
  const url = `https://api.ucsb.edu/academics/curriculums/v1/classes/search?quarter=20251&subjectCode=${encodeURIComponent(code)}&pageSize=5`;

  try {
    const response = await fetch(url, {
      headers: { 'ucsb-api-key': API_KEY, 'Accept': 'application/json' }
    });

    if (!response.ok) return { code, count: 0, error: response.status };

    const data = await response.json();
    const count = data.total || 0;
    const sample = data.classes?.[0]?.title || '';

    return { code, count, sample };
  } catch (e) {
    return { code, count: 0, error: e.message };
  }
}

async function main() {
  console.log('Testing subject codes...\n');

  for (const code of TEST_CODES) {
    const result = await testCode(code);
    console.log(`${code.padEnd(10)} → ${result.count} courses ${result.sample ? `(e.g. "${result.sample}")` : result.error || ''}`);
    await new Promise(r => setTimeout(r, 200));
  }
}

main();
