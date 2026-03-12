/**
 * Seed Gateway Courses to Supabase
 *
 * Inserts the most common lower-division UCSB gateway courses that are missing
 * from the scraped dataset but are required as articulation targets.
 *
 * Usage:
 *   node scripts/seed-gateway-courses.js
 *
 * Requires: SUPABASE_SERVICE_KEY in .env
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://kcresaamsawhwmdfuzqu.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseKey) {
  console.error('Error: SUPABASE_SERVICE_KEY is not set in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Well-known UCSB lower-division gateway courses missing from the scraped dataset.
// These are the most common targets in CC articulation agreements.
const GATEWAY_COURSES = [
  {
    course_id_clean: 'WRIT 2',
    title: 'Academic Writing',
    description: 'Writing workshop for students interested in developing academic writing skills. Focus on analysis, argument, and revision.',
    dept_code: 'WRIT',
    subject_area: 'WRIT',
    college: 'L&S',
    units_fixed: 4,
    obj_level_code: 'U',
    grading_option: 'L',
    instruction_type: 'LEC',
    prerequisites_text: null,
    prerequisites_parsed: {},
    prerequisites_parse_status: 'parsed',
  },
  {
    course_id_clean: 'MATH 3A',
    title: 'Calculus with Applications, First Course',
    description: 'Differential calculus including analytic geometry, limits, continuity, differentiation of algebraic, trigonometric, and exponential functions; curve sketching, optimization, related rates.',
    dept_code: 'MATH',
    subject_area: 'MATH',
    college: 'L&S',
    units_fixed: 4,
    obj_level_code: 'U',
    grading_option: 'L',
    instruction_type: 'LEC',
    prerequisites_text: 'Mathematics 34A with a grade of C or better, or appropriate score on mathematics placement exam.',
    prerequisites_parsed: {},
    prerequisites_parse_status: 'pending',
  },
  {
    course_id_clean: 'MATH 3B',
    title: 'Calculus with Applications, Second Course',
    description: 'Integral calculus including the definite integral, techniques of integration, applications, infinite series, and an introduction to differential equations.',
    dept_code: 'MATH',
    subject_area: 'MATH',
    college: 'L&S',
    units_fixed: 4,
    obj_level_code: 'U',
    grading_option: 'L',
    instruction_type: 'LEC',
    prerequisites_text: 'Mathematics 3A with a grade of C or better.',
    prerequisites_parsed: {},
    prerequisites_parse_status: 'pending',
  },
  {
    course_id_clean: 'MATH 3C',
    title: 'Calculus with Applications, Third Course',
    description: 'Multivariable calculus including partial derivatives, multiple integrals, line integrals, and vector calculus.',
    dept_code: 'MATH',
    subject_area: 'MATH',
    college: 'L&S',
    units_fixed: 4,
    obj_level_code: 'U',
    grading_option: 'L',
    instruction_type: 'LEC',
    prerequisites_text: 'Mathematics 3B with a grade of C or better.',
    prerequisites_parsed: {},
    prerequisites_parse_status: 'pending',
  },
  {
    course_id_clean: 'MATH 4A',
    title: 'Linear Algebra with Applications',
    description: 'Linear algebra including vectors, matrices, systems of linear equations, vector spaces, linear transformations, eigenvalues, and eigenvectors.',
    dept_code: 'MATH',
    subject_area: 'MATH',
    college: 'L&S',
    units_fixed: 4,
    obj_level_code: 'U',
    grading_option: 'L',
    instruction_type: 'LEC',
    prerequisites_text: 'Mathematics 3A or 3A-H or 34A-B with a grade of C or better.',
    prerequisites_parsed: {},
    prerequisites_parse_status: 'pending',
  },
  {
    course_id_clean: 'MATH 8',
    title: 'Transition to Higher Mathematics',
    description: 'Sets, functions, logic and proof techniques, mathematical induction, combinatorics, and introduction to discrete structures.',
    dept_code: 'MATH',
    subject_area: 'MATH',
    college: 'L&S',
    units_fixed: 4,
    obj_level_code: 'U',
    grading_option: 'L',
    instruction_type: 'LEC',
    prerequisites_text: 'Mathematics 3A with a grade of C or better.',
    prerequisites_parsed: {},
    prerequisites_parse_status: 'pending',
  },
  {
    course_id_clean: 'MATH 34A',
    title: 'Calculus for Social and Life Sciences, First Course',
    description: 'Differential calculus for social and life sciences including functions, limits, derivatives, and applications to economics and biology.',
    dept_code: 'MATH',
    subject_area: 'MATH',
    college: 'L&S',
    units_fixed: 4,
    obj_level_code: 'U',
    grading_option: 'L',
    instruction_type: 'LEC',
    prerequisites_text: 'Appropriate score on mathematics placement exam.',
    prerequisites_parsed: {},
    prerequisites_parse_status: 'pending',
  },
  {
    course_id_clean: 'MATH 34B',
    title: 'Calculus for Social and Life Sciences, Second Course',
    description: 'Integral calculus for social and life sciences including antiderivatives, definite integrals, and multivariable functions.',
    dept_code: 'MATH',
    subject_area: 'MATH',
    college: 'L&S',
    units_fixed: 4,
    obj_level_code: 'U',
    grading_option: 'L',
    instruction_type: 'LEC',
    prerequisites_text: 'Mathematics 34A with a grade of C or better.',
    prerequisites_parsed: {},
    prerequisites_parse_status: 'pending',
  },
  {
    course_id_clean: 'BIOL 20A',
    title: 'Cell and Molecular Biology',
    description: 'Introduction to molecular biology, genetics, and cell biology. Topics include macromolecular structure, cell organization, metabolism, DNA replication, transcription, and translation.',
    dept_code: 'BIOL',
    subject_area: 'BIOL',
    college: 'L&S',
    units_fixed: 4,
    obj_level_code: 'U',
    grading_option: 'L',
    instruction_type: 'LEC',
    prerequisites_text: 'High school biology and chemistry recommended.',
    prerequisites_parsed: {},
    prerequisites_parse_status: 'parsed',
  },
  {
    course_id_clean: 'BIOL 20B',
    title: 'Biological Diversity',
    description: 'Survey of the diversity of life, including evolution, systematics, and the major groups of organisms from prokaryotes through plants and animals.',
    dept_code: 'BIOL',
    subject_area: 'BIOL',
    college: 'L&S',
    units_fixed: 4,
    obj_level_code: 'U',
    grading_option: 'L',
    instruction_type: 'LEC',
    prerequisites_text: 'Biological Sciences 20A with a grade of C or better.',
    prerequisites_parsed: {},
    prerequisites_parse_status: 'pending',
  },
  {
    course_id_clean: 'BIOL 20C',
    title: 'Physiology and Ecology',
    description: 'Introduction to animal and plant physiology and ecology, including organ system function, energetics, and ecological interactions.',
    dept_code: 'BIOL',
    subject_area: 'BIOL',
    college: 'L&S',
    units_fixed: 4,
    obj_level_code: 'U',
    grading_option: 'L',
    instruction_type: 'LEC',
    prerequisites_text: 'Biological Sciences 20B with a grade of C or better.',
    prerequisites_parsed: {},
    prerequisites_parse_status: 'pending',
  },
  {
    course_id_clean: 'PHYS 1',
    title: 'Basic Physics',
    description: 'Survey of classical and modern physics for non-majors. Topics include mechanics, heat, electricity, magnetism, waves, and modern physics.',
    dept_code: 'PHYS',
    subject_area: 'PHYS',
    college: 'L&S',
    units_fixed: 4,
    obj_level_code: 'U',
    grading_option: 'L',
    instruction_type: 'LEC',
    prerequisites_text: 'Mathematics 3A or concurrent enrollment.',
    prerequisites_parsed: {},
    prerequisites_parse_status: 'pending',
  },
  {
    course_id_clean: 'PHYS 6A',
    title: 'Physics for Life Sciences Majors: Mechanics',
    description: 'Mechanics including kinematics, Newton\'s laws, work, energy, momentum, rotation, and gravitation for life sciences students.',
    dept_code: 'PHYS',
    subject_area: 'PHYS',
    college: 'L&S',
    units_fixed: 4,
    obj_level_code: 'U',
    grading_option: 'L',
    instruction_type: 'LEC',
    prerequisites_text: 'Mathematics 34A or 3A with a grade of C or better.',
    prerequisites_parsed: {},
    prerequisites_parse_status: 'pending',
  },
  {
    course_id_clean: 'PHYS 6B',
    title: 'Physics for Life Sciences Majors: Electricity and Magnetism',
    description: 'Electricity and magnetism, waves, optics, and thermal physics for life sciences students.',
    dept_code: 'PHYS',
    subject_area: 'PHYS',
    college: 'L&S',
    units_fixed: 4,
    obj_level_code: 'U',
    grading_option: 'L',
    instruction_type: 'LEC',
    prerequisites_text: 'Physics 6A with a grade of C or better.',
    prerequisites_parsed: {},
    prerequisites_parse_status: 'pending',
  },
  {
    course_id_clean: 'PHYS 6C',
    title: 'Physics for Life Sciences Majors: Optics and Modern Physics',
    description: 'Optics, modern physics, quantum mechanics, and nuclear physics for life sciences students.',
    dept_code: 'PHYS',
    subject_area: 'PHYS',
    college: 'L&S',
    units_fixed: 4,
    obj_level_code: 'U',
    grading_option: 'L',
    instruction_type: 'LEC',
    prerequisites_text: 'Physics 6B with a grade of C or better.',
    prerequisites_parsed: {},
    prerequisites_parse_status: 'pending',
  },
  {
    course_id_clean: 'PSYCH 1',
    title: 'Introduction to Psychology',
    description: 'Survey of major topics in psychology including biological bases of behavior, sensation, perception, learning, memory, cognition, development, personality, social behavior, and psychopathology.',
    dept_code: 'PSYCH',
    subject_area: 'PSYCH',
    college: 'L&S',
    units_fixed: 4,
    obj_level_code: 'U',
    grading_option: 'L',
    instruction_type: 'LEC',
    prerequisites_text: null,
    prerequisites_parsed: {},
    prerequisites_parse_status: 'parsed',
  },
  {
    course_id_clean: 'MCDB 1A',
    title: 'Introductory Biology I: Cell Biology',
    description: 'Introduction to cell structure, function, and biochemistry for biology majors. Topics include macromolecules, cell biology, metabolism, and genetics.',
    dept_code: 'MCDB',
    subject_area: 'MCDB',
    college: 'L&S',
    units_fixed: 4,
    obj_level_code: 'U',
    grading_option: 'L',
    instruction_type: 'LEC',
    prerequisites_text: 'Chemistry 1A-B-C with a grade of C- or better.',
    prerequisites_parsed: {},
    prerequisites_parse_status: 'pending',
  },
  {
    course_id_clean: 'ENVS 1',
    title: 'Environmental Studies: An Introduction',
    description: 'Introduction to environmental studies; the physical, ecological, and social dimensions of human-environment interactions.',
    dept_code: 'ENVST',
    subject_area: 'ENVST',
    college: 'L&S',
    units_fixed: 4,
    obj_level_code: 'U',
    grading_option: 'L',
    instruction_type: 'LEC',
    prerequisites_text: null,
    prerequisites_parsed: {},
    prerequisites_parse_status: 'parsed',
  },
];

async function seedGatewayCourses() {
  console.log(`Seeding ${GATEWAY_COURSES.length} gateway courses into Supabase...\n`);

  const { data, error } = await supabase
    .from('courses')
    .upsert(GATEWAY_COURSES, { onConflict: 'course_id_clean', ignoreDuplicates: false });

  if (error) {
    console.error('Error inserting courses:', error.message);
    process.exit(1);
  }

  console.log(`Successfully inserted/updated ${GATEWAY_COURSES.length} gateway courses.`);
  console.log('\nCourses seeded:');
  GATEWAY_COURSES.forEach(c => console.log(`  ${c.course_id_clean} — ${c.title}`));
  console.log('\nNext step: re-run import-articulations.js to resolve previously unresolved entries.');
}

seedGatewayCourses();
