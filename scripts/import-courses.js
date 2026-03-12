/**
 * Import Courses to Supabase
 *
 * This script imports course data from courses-with-prereqs.json into Supabase.
 *
 * Usage:
 *   node scripts/import-courses.js
 *
 * Environment variables required:
 *   SUPABASE_URL - Your Supabase project URL
 *   SUPABASE_SERVICE_KEY - Your Supabase service role key (NOT anon key)
 */

import { createClient } from '@supabase/supabase-js';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase configuration — requires service role key to bypass RLS for inserts
const supabaseUrl = process.env.SUPABASE_URL || 'https://kcresaamsawhwmdfuzqu.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseKey) {
  console.error('Error: SUPABASE_SERVICE_KEY is not set in your .env file.');
  console.error('Get it from: Supabase dashboard → Settings → API → service_role key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Path to the courses data file
const COURSES_FILE = join(__dirname, '../src/data/datasets/courses-with-prereqs.json');

/**
 * Transform course data from JSON format to database format
 */
function transformCourse(course) {
  return {
    course_id_clean: course.courseIdClean?.trim() || null,
    title: course.title?.trim() || 'Untitled',
    description: course.description?.trim() || null,
    dept_code: course.deptCode?.trim() || null,
    subject_area: course.subjectArea?.trim() || null,
    college: course.college?.trim() || null,
    units_fixed: course.unitsFixed || null,
    units_variable_low: course.unitsVariableLow || null,
    units_variable_high: course.unitsVariableHigh || null,
    obj_level_code: course.objLevelCode?.trim() || null,
    grading_option: course.gradingOption?.trim() || null,
    instruction_type: course.instructionType?.trim() || null,
    prerequisites_text: course.prerequisitesText?.trim() || null,
    prerequisites_parsed: {},  // Will be populated by prerequisite parser
    prerequisites_parse_status: course.prerequisitesText ? 'pending' : 'parsed',
    catalog_url: course.catalogUrl || null,
    advisory_comments: course.advisoryComments?.trim() || null,
  };
}

/**
 * Import courses in batches
 */
async function importCourses() {
  console.log('Starting course import...\n');

  // Read the courses file
  console.log(`Reading courses from: ${COURSES_FILE}`);
  const fileContent = await readFile(COURSES_FILE, 'utf-8');
  const courses = JSON.parse(fileContent);

  console.log(`Found ${courses.length} courses to import.\n`);

  // Filter out courses without a valid course ID
  const validCourses = courses.filter(c => c.courseIdClean?.trim());
  console.log(`Valid courses (with course ID): ${validCourses.length}`);

  // Check for duplicates
  const courseIds = validCourses.map(c => c.courseIdClean.trim());
  const uniqueIds = new Set(courseIds);
  if (courseIds.length !== uniqueIds.size) {
    console.log(`Warning: Found ${courseIds.length - uniqueIds.size} duplicate course IDs.`);
    console.log('Duplicates will be skipped during upsert.\n');
  }

  // Transform courses
  const transformedCourses = validCourses.map(transformCourse);

  // Remove duplicates (keep first occurrence)
  const seen = new Set();
  const uniqueCourses = transformedCourses.filter(c => {
    if (seen.has(c.course_id_clean)) {
      return false;
    }
    seen.add(c.course_id_clean);
    return true;
  });

  console.log(`Unique courses to import: ${uniqueCourses.length}\n`);

  // Import in batches of 100
  const BATCH_SIZE = 100;
  let imported = 0;
  let errors = 0;

  for (let i = 0; i < uniqueCourses.length; i += BATCH_SIZE) {
    const batch = uniqueCourses.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(uniqueCourses.length / BATCH_SIZE);

    process.stdout.write(`Importing batch ${batchNum}/${totalBatches}... `);

    try {
      const { data, error } = await supabase
        .from('courses')
        .upsert(batch, {
          onConflict: 'course_id_clean',
          ignoreDuplicates: false,
        })
        .select('id');

      if (error) {
        console.log(`ERROR: ${error.message}`);
        errors += batch.length;
      } else {
        console.log(`OK (${data.length} courses)`);
        imported += data.length;
      }
    } catch (err) {
      console.log(`FAILED: ${err.message}`);
      errors += batch.length;
    }
  }

  console.log('\n--- Import Summary ---');
  console.log(`Total courses in file: ${courses.length}`);
  console.log(`Valid courses: ${validCourses.length}`);
  console.log(`Successfully imported: ${imported}`);
  console.log(`Errors: ${errors}`);
}

/**
 * Import GE area mappings
 */
async function importGEAreas() {
  console.log('\nImporting GE area mappings...');

  // Read the courses file
  const fileContent = await readFile(COURSES_FILE, 'utf-8');
  const courses = JSON.parse(fileContent);

  // Extract GE areas from courses
  const geRecords = [];

  for (const course of courses) {
    if (!course.courseIdClean?.trim() || !course.generalEducation?.length) {
      continue;
    }

    for (const ge of course.generalEducation) {
      if (ge.geCode) {
        geRecords.push({
          course_id_clean: course.courseIdClean.trim(),
          ge_code: ge.geCode.trim(),
          ge_college: ge.geCollege?.trim() || null,
        });
      }
    }
  }

  if (geRecords.length === 0) {
    console.log('No GE area data found in courses.');
    return;
  }

  console.log(`Found ${geRecords.length} GE area mappings.`);

  // First, get course IDs
  const courseIds = [...new Set(geRecords.map(r => r.course_id_clean))];
  const { data: coursesData, error: coursesError } = await supabase
    .from('courses')
    .select('id, course_id_clean')
    .in('course_id_clean', courseIds);

  if (coursesError) {
    console.log(`Error fetching courses: ${coursesError.message}`);
    return;
  }

  // Create course ID lookup
  const courseIdLookup = {};
  for (const c of coursesData) {
    courseIdLookup[c.course_id_clean] = c.id;
  }

  // Transform GE records
  const transformedGE = geRecords
    .map(r => ({
      course_id: courseIdLookup[r.course_id_clean],
      ge_code: r.ge_code,
      ge_college: r.ge_college,
    }))
    .filter(r => r.course_id);

  // Import in batches
  const BATCH_SIZE = 100;
  let imported = 0;

  for (let i = 0; i < transformedGE.length; i += BATCH_SIZE) {
    const batch = transformedGE.slice(i, i + BATCH_SIZE);

    try {
      const { data, error } = await supabase
        .from('course_ge_areas')
        .upsert(batch, {
          onConflict: 'course_id,ge_code,ge_college',
          ignoreDuplicates: true,
        })
        .select('id');

      if (!error) {
        imported += data?.length || 0;
      }
    } catch (err) {
      // Ignore errors for GE areas
    }
  }

  console.log(`Imported ${imported} GE area mappings.`);
}

/**
 * Main function
 */
async function main() {
  console.log('=================================');
  console.log('  UCSB Compass - Course Import  ');
  console.log('=================================\n');

  try {
    await importCourses();
    await importGEAreas();

    console.log('\nImport complete!');
    console.log('\nVerify in Supabase:');
    console.log("  SELECT COUNT(*) FROM courses;");
    console.log("  SELECT * FROM courses WHERE dept_code = 'CMPSC' LIMIT 5;");
  } catch (err) {
    console.error('\nFatal error:', err.message);
    process.exit(1);
  }
}

main();
