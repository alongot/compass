/**
 * Import Articulations to Supabase
 *
 * This script seeds institution records and CC-to-UCSB articulation agreements
 * into Supabase from the JSON files in src/data/articulations/.
 *
 * Usage:
 *   node scripts/import-articulations.js
 *
 * Environment variables required:
 *   VITE_SUPABASE_URL   - Your Supabase project URL
 *   SUPABASE_SERVICE_KEY - Your Supabase service role key (NOT anon key — bypasses RLS)
 *
 * The script is idempotent: running it multiple times will not create duplicates
 * because all inserts use upsert with appropriate conflict keys.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Validate required environment variables before doing any work
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://kcresaamsaamsawhwmdfuzqu.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseKey) {
  console.error('Error: SUPABASE_SERVICE_KEY is not set in your .env file.');
  console.error('Get it from: Supabase dashboard -> Settings -> API -> service_role key');
  console.error('The service role key is required to bypass Row Level Security for seeding.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Filename prefix -> assist_org_id mapping for resolving source institution FK
// Keys match the base names of files in src/data/articulations/agreements/
const FILENAME_TO_ASSIST_ORG_ID = {
  'sbcc-ucsb': '92',
  'smc-ucsb': '137',
  'de-anza-ucsb': '113',
  'occ-ucsb': '110',
  'dvc-ucsb': '57',
  'foothill-ucsb': '65',
  'pcc-ucsb': '120',
  'ivc-ucsb': '83',
  'csm-ucsb': '104',
  'laney-ucsb': '88',
};

const INSTITUTIONS_FILE = join(__dirname, '../src/data/articulations/institutions.json');
const AGREEMENTS_DIR = join(__dirname, '../src/data/articulations/agreements');

/**
 * Step 1: Insert institutions into the institutions table (idempotent).
 * The institutions table has no unique constraint on assist_org_id in the DB schema,
 * so we select existing rows first and only insert genuinely new ones.
 */
async function importInstitutions() {
  console.log('Step 1: Loading institutions...');

  const raw = readFileSync(INSTITUTIONS_FILE, 'utf-8');
  const institutions = JSON.parse(raw);

  console.log(`  Found ${institutions.length} institutions in institutions.json`);

  // Fetch existing institutions to avoid duplicates (assist_org_id has no DB UNIQUE constraint)
  const { data: existing, error: fetchError } = await supabase
    .from('institutions')
    .select('assist_org_id');

  if (fetchError) {
    console.error(`  ERROR fetching existing institutions: ${fetchError.message}`);
    throw fetchError;
  }

  const existingIds = new Set((existing || []).map(i => i.assist_org_id));
  const newInstitutions = institutions.filter(i => !existingIds.has(i.assist_org_id));

  if (newInstitutions.length === 0) {
    console.log(`  All ${institutions.length} institutions already exist — skipping insert\n`);
    return;
  }

  const { data, error } = await supabase
    .from('institutions')
    .insert(newInstitutions)
    .select('id, assist_org_id, name, short_name');

  if (error) {
    console.error(`  ERROR inserting institutions: ${error.message}`);
    throw error;
  }

  console.log(`  Inserted ${data.length} new institutions (${existingIds.size} already existed)\n`);
  return data;
}

/**
 * Step 2: Re-fetch all institutions to build a lookup map.
 * Returns Map<assist_org_id -> UUID>.
 */
async function buildInstitutionMap() {
  const { data, error } = await supabase
    .from('institutions')
    .select('id, assist_org_id');

  if (error) {
    console.error(`  ERROR fetching institutions: ${error.message}`);
    throw error;
  }

  const map = new Map();
  for (const inst of data) {
    map.set(inst.assist_org_id, inst.id);
  }
  return map;
}

/**
 * Resolve an array of course_id_clean strings to their Supabase UUIDs.
 * Returns Map<course_id_clean -> UUID>. Unresolved codes are omitted.
 */
async function resolveCourseIds(courseIdCleans) {
  const unique = [...new Set(courseIdCleans)];
  if (unique.length === 0) return new Map();

  const { data, error } = await supabase
    .from('courses')
    .select('id, course_id_clean')
    .in('course_id_clean', unique);

  if (error) {
    console.error(`  ERROR resolving course IDs: ${error.message}`);
    return new Map();
  }

  const map = new Map();
  for (const course of data) {
    map.set(course.course_id_clean, course.id);
  }
  return map;
}

/**
 * Step 3: Load all agreement JSON files and upsert articulations.
 * Returns totals: { articulations, unresolved }.
 */
async function importAgreements(institutionMap) {
  console.log('Step 3: Loading articulation agreement files...');

  let agreementFiles;
  try {
    agreementFiles = readdirSync(AGREEMENTS_DIR).filter(f => f.endsWith('.json'));
  } catch (err) {
    console.error(`  ERROR reading agreements directory: ${err.message}`);
    return { articulations: 0, unresolved: 0 };
  }

  if (agreementFiles.length === 0) {
    console.log('  No agreement files found — skipping.');
    return { articulations: 0, unresolved: 0 };
  }

  console.log(`  Found ${agreementFiles.length} agreement file(s): ${agreementFiles.join(', ')}\n`);

  let totalArticulations = 0;
  let totalUnresolved = 0;

  for (const filename of agreementFiles) {
    const baseName = filename.replace('.json', '');
    const assistOrgId = FILENAME_TO_ASSIST_ORG_ID[baseName];

    if (!assistOrgId) {
      console.warn(`  WARNING: No assist_org_id mapping for file "${filename}" — skipping.`);
      continue;
    }

    const sourceInstitutionId = institutionMap.get(assistOrgId);
    if (!sourceInstitutionId) {
      console.warn(`  WARNING: Institution with assist_org_id "${assistOrgId}" not found in DB — skipping ${filename}.`);
      continue;
    }

    let rows;
    try {
      const raw = readFileSync(join(AGREEMENTS_DIR, filename), 'utf-8');
      rows = JSON.parse(raw);
    } catch (err) {
      console.error(`  ERROR reading ${filename}: ${err.message}`);
      continue;
    }

    // Resolve all target_course_id_clean values to UUIDs in one batch query
    const targetCleans = rows.map(r => r.target_course_id_clean).filter(Boolean);
    const courseMap = await resolveCourseIds(targetCleans);

    let resolved = 0;
    let unresolved = 0;
    const articulations = [];

    for (const row of rows) {
      const targetCourseId = courseMap.get(row.target_course_id_clean);
      if (!targetCourseId) {
        console.warn(`    UNRESOLVED: ${baseName.toUpperCase().split('-')[0]} ${row.source_course_code} -> "${row.target_course_id_clean}" (not in courses table)`);
        unresolved++;
        continue;
      }

      articulations.push({
        source_institution_id: sourceInstitutionId,
        source_course_code: row.source_course_code,
        source_course_title: row.source_course_title || null,
        source_units: row.source_units || null,
        target_course_id: targetCourseId,
        articulation_type: row.articulation_type || 'equivalent',
        notes: row.notes || null,
        effective_start_date: row.effective_start_date || null,
        effective_end_date: row.effective_end_date || null,
      });
      resolved++;
    }

    if (articulations.length > 0) {
      try {
        const { data, error } = await supabase
          .from('articulations')
          .upsert(articulations, {
            onConflict: 'source_institution_id,source_course_code,target_course_id',
          })
          .select('id');

        if (error) {
          console.error(`  ERROR upserting ${filename}: ${error.message}`);
        } else {
          console.log(`  ${baseName.toUpperCase()}: inserted/updated ${data.length} articulations (${unresolved} unresolved)`);
          totalArticulations += data.length;
        }
      } catch (err) {
        console.error(`  FAILED upserting ${filename}: ${err.message}`);
      }
    } else {
      console.log(`  ${baseName.toUpperCase()}: 0 articulations resolved (${unresolved} unresolved)`);
    }

    totalUnresolved += unresolved;
  }

  return { articulations: totalArticulations, unresolved: totalUnresolved };
}

/**
 * Main entry point
 */
async function main() {
  console.log('==============================================');
  console.log('  UCSB Compass - Articulation Import        ');
  console.log('==============================================\n');

  try {
    // Step 1: Upsert institutions
    await importInstitutions();

    // Step 2: Build institution ID map
    console.log('Step 2: Building institution lookup map...');
    const institutionMap = await buildInstitutionMap();
    console.log(`  Loaded ${institutionMap.size} institution(s) into memory\n`);

    // Step 3: Import each agreement file
    const { articulations, unresolved } = await importAgreements(institutionMap);

    // Final summary
    console.log('\n--- Import Summary ---');
    console.log(`Total institutions: ${institutionMap.size}`);
    console.log(`Total articulations inserted/updated: ${articulations}`);
    console.log(`Total unresolved course codes (skipped): ${unresolved}`);
    console.log('\nImport complete!');
    console.log('\nVerify in Supabase:');
    console.log("  SELECT COUNT(*) FROM institutions;");
    console.log("  SELECT COUNT(*) FROM articulations;");
    console.log("  SELECT i.name, a.source_course_code, a.source_course_title");
    console.log("    FROM articulations a JOIN institutions i ON i.id = a.source_institution_id LIMIT 10;");
  } catch (err) {
    console.error('\nFatal error:', err.message);
    process.exit(1);
  }
}

main();
