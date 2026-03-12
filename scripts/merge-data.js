/**
 * Merge API course data with CSV to add course codes
 * Focus on 12 demo majors from DEMO_ROADMAP.md
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const API_KEY = process.env.UCSB_API_KEY;
const QUARTER = '20251'; // Winter 2025

// Subject codes for the 12 demo majors
const SUBJECT_CODES = [
  // Biology-related (BIOL doesn't exist, use MCDB and EEMB)
  'MCDB', 'EEMB',
  // Computer Science
  'CMPSC',
  // Economics
  'ECON',
  // Communications
  'COMM',
  // Sociology
  'SOC',
  // Psychology
  'PSY',
  // Chemistry
  'CHEM',
  // Mechanical Engineering
  'ME',
  // Electrical/Computer Engineering
  'ECE',
  // Stats & Data Science
  'PSTAT',
  // Film/Cinema/Media Studies
  'FAMST',
  // Environmental Science
  'ENV S', 'ESM', 'EARTH', 'GEOG'
];

async function fetchCoursesForSubject(subjectCode) {
  const url = `https://api.ucsb.edu/academics/curriculums/v1/classes/search?quarter=${QUARTER}&subjectCode=${encodeURIComponent(subjectCode)}&pageSize=200&includeClassSections=false`;

  try {
    const response = await fetch(url, {
      headers: {
        'ucsb-api-key': API_KEY,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`  Error fetching ${subjectCode}: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.classes || [];
  } catch (error) {
    console.error(`  Error fetching ${subjectCode}:`, error.message);
    return [];
  }
}

async function fetchAllCourses() {
  console.log('Fetching courses from UCSB API...\n');

  const allCourses = [];

  for (const code of SUBJECT_CODES) {
    process.stdout.write(`Fetching ${code}... `);
    const courses = await fetchCoursesForSubject(code);
    console.log(`${courses.length} courses`);
    allCourses.push(...courses);

    // Small delay to be nice to the API
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\nTotal courses from API: ${allCourses.length}`);
  return allCourses;
}

function parseCSV(csvContent) {
  const lines = csvContent.split('\n');
  const headers = parseCSVLine(lines[0]);

  const records = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    const values = parseCSVLine(lines[i]);
    const record = {};
    headers.forEach((header, index) => {
      record[header] = values[index] || '';
    });
    records.push(record);
  }

  return records;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}

function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchCourses(apiCourses, csvRecords) {
  console.log('\nMatching courses by title...\n');

  // Create a map of normalized API titles to course info
  const apiMap = new Map();
  for (const course of apiCourses) {
    const normalizedTitle = normalizeTitle(course.title);
    const courseId = course.courseId.trim();
    apiMap.set(normalizedTitle, {
      courseId,
      subjectArea: course.subjectArea.trim(),
      fullTitle: course.title
    });
  }

  let matched = 0;
  let unmatched = 0;

  const enrichedRecords = csvRecords.map(record => {
    const csvTitle = normalizeTitle(record['Full Course Title'] || '');

    // Try exact match first
    if (apiMap.has(csvTitle)) {
      matched++;
      const apiData = apiMap.get(csvTitle);
      return {
        ...record,
        'Course Code': apiData.courseId,
        'Subject Area': apiData.subjectArea,
        'Match Type': 'exact'
      };
    }

    // Try partial match
    for (const [apiTitle, apiData] of apiMap) {
      if (csvTitle.includes(apiTitle) || apiTitle.includes(csvTitle)) {
        matched++;
        return {
          ...record,
          'Course Code': apiData.courseId,
          'Subject Area': apiData.subjectArea,
          'Match Type': 'partial'
        };
      }
    }

    unmatched++;
    return {
      ...record,
      'Course Code': '',
      'Subject Area': '',
      'Match Type': 'none'
    };
  });

  console.log(`Matched: ${matched}`);
  console.log(`Unmatched: ${unmatched}`);

  return enrichedRecords;
}

function writeCSV(records, outputPath) {
  if (records.length === 0) return;

  const headers = Object.keys(records[0]);
  const lines = [headers.map(h => `"${h}"`).join(',')];

  for (const record of records) {
    const values = headers.map(h => {
      const val = (record[h] || '').toString().replace(/"/g, '""');
      return `"${val}"`;
    });
    lines.push(values.join(','));
  }

  fs.writeFileSync(outputPath, lines.join('\n'));
  console.log(`\nWritten to: ${outputPath}`);
}

async function main() {
  // Fetch from API
  const apiCourses = await fetchAllCourses();

  // Save raw API data for reference
  const apiOutputPath = path.join('src', 'data', 'datasets', 'api-courses.json');
  fs.writeFileSync(apiOutputPath, JSON.stringify(apiCourses, null, 2));
  console.log(`\nSaved API data to: ${apiOutputPath}`);

  // Read CSV
  const csvPath = path.join('src', 'data', 'datasets', 'courses-report.csv');
  console.log(`\nReading CSV from: ${csvPath}`);
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const csvRecords = parseCSV(csvContent);
  console.log(`CSV records: ${csvRecords.length}`);

  // Match and merge
  const enrichedRecords = matchCourses(apiCourses, csvRecords);

  // Write enriched CSV
  const outputPath = path.join('src', 'data', 'datasets', 'courses-enriched.csv');
  writeCSV(enrichedRecords, outputPath);

  // Summary
  const matchedCount = enrichedRecords.filter(r => r['Match Type'] !== 'none').length;
  console.log(`\n=== Summary ===`);
  console.log(`Total CSV records: ${csvRecords.length}`);
  console.log(`Matched with API: ${matchedCount} (${(matchedCount/csvRecords.length*100).toFixed(1)}%)`);
}

main().catch(console.error);
