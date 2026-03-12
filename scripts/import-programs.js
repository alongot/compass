/**
 * Import Programs to Supabase
 *
 * Imports the 329 programs from programs.json into the Supabase database.
 *
 * Usage: node scripts/import-programs.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

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

async function importPrograms() {
  console.log('Reading programs.json...');

  const programsPath = join(__dirname, '../src/data/datasets/programs.json');
  const rawData = readFileSync(programsPath, 'utf-8');
  const programs = JSON.parse(rawData);

  console.log(`Found ${programs.length} programs to import.`);

  // Transform data to match database schema
  const transformedPrograms = programs.map(p => ({
    program_id: p.id,
    program_group_id: p.programGroupId,
    name: p.name?.trim(),
    type: p.type,
    level: p.level,
    degree_designation: p.degreeDesignation,
    status: p.status || 'Active',
    effective_start_date: p.effectiveStartDate || null,
    effective_end_date: p.effectiveEndDate || null,
    cip_code: p.cipCode || null,
    catalog_description: p.catalogDescription || null,
    catalog_image_url: p.catalogImageUrl?.url || null,
  }));

  console.log('Importing programs to Supabase...');

  // Insert in batches of 50 to avoid timeouts
  const batchSize = 50;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < transformedPrograms.length; i += batchSize) {
    const batch = transformedPrograms.slice(i, i + batchSize);

    const { data, error } = await supabase
      .from('programs')
      .upsert(batch, {
        onConflict: 'program_id',
        ignoreDuplicates: false
      })
      .select();

    if (error) {
      console.error(`Error in batch ${i / batchSize + 1}:`, error.message);
      errors += batch.length;
    } else {
      inserted += data.length;
      console.log(`Imported batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(transformedPrograms.length / batchSize)} (${inserted} total)`);
    }
  }

  console.log('\n--- Import Complete ---');
  console.log(`Successfully imported: ${inserted} programs`);
  if (errors > 0) {
    console.log(`Errors: ${errors}`);
  }
}

importPrograms().catch(console.error);
