/**
 * Prerequisite Parser for UCSB Courses
 *
 * Converts natural language prerequisites into structured JSON.
 * Handles various patterns including:
 * - Course requirements with grades (MATH 3A with a grade of C or better)
 * - Course sequences (Chemistry 1A-B-C)
 * - OR/AND conditions
 * - Concurrent enrollment
 * - Standing requirements (upper-division, freshman)
 * - Consent requirements (instructor, department)
 * - Major restrictions
 *
 * Usage: node scripts/parse-prerequisites.js [--dry-run] [--limit N]
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase configuration
const supabaseUrl = 'https://kcresaamsawhwmdfuzqu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjcmVzYWFtc2F3aHdtZGZ1enF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMTU5ODksImV4cCI6MjA4NDY5MTk4OX0.VYfcy7UUDtP7mf9R5XsSs5Uc86PmMs1JJvtZdP0Z6lU';

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// PATTERNS & REGEX
// ============================================================================

// Course ID pattern: DEPT + NUMBER (with optional letter suffix)
// Examples: CMPSC 16, MATH 3A, CHEM 109AH, PSTAT 5LS, MCDB W 108A
// Exclude common words that look like dept codes: OR, AND, FOR, NOT, etc.
const COURSE_PATTERN = /\b(?!(?:OR|AND|FOR|NOT|THE|WITH|MAY|BE)\b)([A-Z]{2,6})\s*W?\s*(\d{1,3}[A-Z]{0,3})\b/gi;

// Course sequence pattern: 1A-B-C or 1A-1B-1C or 109A-B-C
const SEQUENCE_PATTERN = /(\d{1,3}[A-Z]?)(?:\s*-\s*([A-Z]|\d{1,3}[A-Z]?))+/gi;

// Grade patterns
const GRADE_PATTERNS = [
  /with\s+a\s+(?:minimum\s+)?grade\s+of\s+([A-DF][+-]?)\s+or\s+better/gi,
  /(?:minimum|min\.?)\s+grade\s+(?:of\s+)?([A-DF][+-]?)/gi,
  /grade\s+of\s+([A-DF][+-]?)\s+or\s+(?:better|higher)/gi,
  /([A-DF][+-]?)\s+or\s+better/gi,
];

// Concurrent enrollment patterns
const CONCURRENT_PATTERNS = [
  /\(?\s*may\s+be\s+taken\s+concurrently\s*\)?/gi,
  /concurrent(?:ly)?\s+(?:enrollment\s+)?(?:in|with)/gi,
  /taken\s+concurrently/gi,
];

// Consent patterns
const CONSENT_PATTERNS = [
  /consent\s+of\s+(?:the\s+)?(?:course\s+)?instructor(?:\s+and\s+department)?/gi,
  /consent\s+of\s+(?:the\s+)?department(?:\s+and\s+instructor)?/gi,
  /(?:instructor|departmental)\s+(?:and\s+(?:instructor|departmental)\s+)?approval\s+required/gi,
  /prior\s+approval\s+of\s+faculty/gi,
];

// Standing patterns
const STANDING_PATTERNS = [
  /upper[- ]?division(?:al)?\s+standing/gi,
  /lower[- ]?division(?:al)?\s+standing/gi,
  /(?:freshman|freshmen|1st\s+year)/gi,
  /(?:sophomore|2nd\s+year)/gi,
  /(?:junior|3rd\s+year)/gi,
  /(?:senior|4th\s+year)/gi,
  /not\s+open\s+to\s+(?:freshman|freshmen)/gi,
];

// Major restriction patterns
const MAJOR_PATTERNS = [
  /open\s+(?:only\s+)?to\s+([A-Za-z\s,]+?)\s+majors?\s+only/gi,
  /([A-Za-z\s]+?)\s+majors?\s+only/gi,
  /open\s+to\s+([A-Za-z\s,]+?)\s+majors/gi,
];

// ============================================================================
// PARSER FUNCTIONS
// ============================================================================

/**
 * Normalize department codes to standard format
 */
function normalizeDeptCode(dept) {
  const mappings = {
    'CHEM': 'CHEM',
    'CHEMISTRY': 'CHEM',
    'MATH': 'MATH',
    'MATHEMATICS': 'MATH',
    'ECON': 'ECON',
    'ECONOMICS': 'ECON',
    'PSYCH': 'PSY',
    'PSYCHOLOGY': 'PSY',
    'PSTAT': 'PSTAT',
    'STATS': 'PSTAT',
    'CS': 'CMPSC',
    'COMPSCI': 'CMPSC',
  };
  const upper = dept.toUpperCase().trim();
  return mappings[upper] || upper;
}

/**
 * Expand course sequences like "1A-B-C" into individual courses
 */
function expandSequence(dept, sequenceStr) {
  const parts = sequenceStr.split(/\s*-\s*/);
  if (parts.length < 2) return [sequenceStr];

  const baseNum = parts[0].match(/\d+/)?.[0] || '';
  const courses = [];

  for (const part of parts) {
    if (/^\d+[A-Z]*$/.test(part)) {
      // Full number like "1A" or "109A"
      courses.push(part);
    } else if (/^[A-Z]$/.test(part)) {
      // Just a letter like "B" or "C" - append to base
      courses.push(baseNum + part);
    }
  }

  return courses;
}

/**
 * Extract grade requirement from text
 */
function extractGrade(text) {
  // More specific patterns to extract grades
  const patterns = [
    /grade\s+of\s+([ABCDF][+-]?)\s+or\s+better/i,
    /minimum\s+grade\s+of\s+([ABCDF][+-]?)/i,
    /min\.?\s+grade\s+(?:of\s+)?([ABCDF][+-]?)/i,
    /with\s+a\s+grade\s+of\s+([ABCDF][+-]?)/i,
    /([ABCDF][+-]?)\s+or\s+better(?!\s+in)/i,
    /minimum\s+grade\s+([ABCDF][+-]?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].toUpperCase();
    }
  }
  return null;
}

/**
 * Check if text indicates concurrent enrollment is allowed
 */
function isConcurrent(text) {
  const lowerText = text.toLowerCase();
  return (
    /may\s+be\s+taken\s+concurrently/i.test(text) ||
    /concurrent(?:ly)?\s+enrollment/i.test(text) ||
    /concurrent(?:ly)?\s+(?:in|with)/i.test(text) ||
    /taken\s+concurrently/i.test(text) ||
    /\(concurrently\)/i.test(text)
  );
}

/**
 * Extract consent requirements
 */
function extractConsent(text) {
  const consents = [];

  if (/consent\s+of\s+(?:the\s+)?(?:course\s+)?instructor/i.test(text)) {
    consents.push('instructor');
  }
  if (/consent\s+of\s+(?:the\s+)?department/i.test(text) || /departmental\s+approval/i.test(text) || /approval\s+by\s+the\s+department/i.test(text)) {
    consents.push('department');
  }
  if (/prior\s+approval\s+of\s+faculty/i.test(text)) {
    consents.push('faculty');
  }
  if (/consent\s+of\s+(?:the\s+)?graduate\s+advisor/i.test(text)) {
    consents.push('graduate-advisor');
  }
  if (/consent\s+of\s+(?:the\s+)?(?:chair|committee)/i.test(text)) {
    consents.push('committee-chair');
  }

  return consents.length > 0 ? consents : null;
}

/**
 * Extract standing requirements
 */
function extractStanding(text) {
  if (/graduate\s+(?:student\s+)?standing/i.test(text) || /masters?\s+level\s+standing/i.test(text)) {
    return 'graduate';
  }
  if (/upper[- ]?division(?:al)?\s+standing/i.test(text) || /upper[- ]?division\s+only/i.test(text)) {
    return 'upper-division';
  }
  if (/lower[- ]?division/i.test(text)) {
    return 'lower-division';
  }
  if (/not\s+open\s+to\s+(?:freshman|freshmen)/i.test(text)) {
    return 'sophomore+';
  }
  if (/(?:freshman|freshmen|1st\s+year)/i.test(text)) {
    return 'freshman';
  }
  if (/(?:junior|3rd\s+year)/i.test(text)) {
    return 'junior';
  }
  if (/(?:senior|4th\s+year)/i.test(text)) {
    return 'senior';
  }
  if (/ph\.?d\.?\s+(?:student\s+)?(?:standing|candidate)/i.test(text)) {
    return 'phd';
  }
  if (/m\.?a\.?\s+\(?thesis\)?\s+candidate/i.test(text) || /master'?s?\s+candidate/i.test(text)) {
    return 'masters-candidate';
  }

  return null;
}

/**
 * Extract employment/enrollment requirements (for TA positions, etc.)
 */
function extractEmploymentReq(text) {
  if (/concurrent\s+teaching\s+assistant\s+employment/i.test(text)) {
    return 'ta-employment';
  }
  if (/teaching\s+assistant/i.test(text)) {
    return 'ta';
  }
  return null;
}

/**
 * Extract major restrictions
 */
function extractMajorRestriction(text) {
  const patterns = [
    /open\s+(?:only\s+)?to\s+(.+?)\s+majors?\s+only/i,
    /(.+?)\s+majors?\s+only/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const majorsStr = match[1];
      // Clean up and split by common delimiters
      const majors = majorsStr
        .split(/,|\s+and\s+|\s+or\s+/)
        .map(m => m.trim())
        .filter(m => m.length > 0 && m.length < 50);

      if (majors.length > 0) {
        return majors;
      }
    }
  }

  return null;
}

/**
 * Extract all course references from text
 */
function extractCourses(text) {
  const courses = [];
  const seen = new Set();
  let lastDept = null;

  // Excluded words that look like dept codes
  const excludedWords = new Set(['OR', 'AND', 'FOR', 'NOT', 'THE', 'WITH', 'MAY', 'BE', 'OF', 'IN', 'TO', 'BY']);

  // First, handle sequences like "Chemistry 1A-B-C"
  const seqPattern = /([A-Z]{2,10})\s+(\d{1,3}[A-Z]?)(?:\s*-\s*([A-Z]|\d{1,3}[A-Z]?))+/gi;
  let seqMatch;
  while ((seqMatch = seqPattern.exec(text)) !== null) {
    if (excludedWords.has(seqMatch[1].toUpperCase())) continue;
    const dept = normalizeDeptCode(seqMatch[1]);
    lastDept = dept;
    const fullSeq = seqMatch[0].replace(/^[A-Z]+\s+/i, '');
    const expanded = expandSequence(dept, fullSeq);
    for (const num of expanded) {
      const courseId = `${dept} ${num}`;
      if (!seen.has(courseId)) {
        seen.add(courseId);
        courses.push({ dept, number: num, courseId });
      }
    }
  }

  // Handle individual course references and "or 2B" patterns
  // Pattern: DEPT NUMBER or just NUMBER (inherits previous dept)
  const tokens = text.split(/\s+/);
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i].replace(/[.,;()]/g, '');
    const nextToken = tokens[i + 1]?.replace(/[.,;()]/g, '') || '';

    // Check for DEPT NUMBER pattern
    if (/^[A-Z]{2,10}$/i.test(token) && !excludedWords.has(token.toUpperCase())) {
      // Could be a department - check if next token is a number
      if (/^\d{1,3}[A-Z]{0,3}$/i.test(nextToken)) {
        const dept = normalizeDeptCode(token);
        lastDept = dept;
        const number = nextToken.toUpperCase();
        const courseId = `${dept} ${number}`;
        if (!seen.has(courseId)) {
          seen.add(courseId);
          courses.push({ dept, number, courseId });
        }
        i++; // Skip the number token
      }
    }
    // Check for standalone number (inherits last department)
    else if (/^\d{1,3}[A-Z]{0,3}$/i.test(token) && lastDept) {
      // Check context - should be after "or" or ","
      const prevToken = tokens[i - 1]?.toLowerCase().replace(/[.,;()]/g, '') || '';
      if (prevToken === 'or' || prevToken === ',' || prevToken === 'and') {
        const number = token.toUpperCase();
        const courseId = `${lastDept} ${number}`;
        if (!seen.has(courseId)) {
          seen.add(courseId);
          courses.push({ dept: lastDept, number, courseId });
        }
      }
    }
  }

  return courses;
}

/**
 * Split text into OR groups (separated by "or" or ";...or")
 * and AND groups within each OR group
 */
function splitLogicalGroups(text) {
  // Split by major OR separators ("; or", standalone "or" between course groups)
  const orGroups = text.split(/\s*;\s*or\s+|\s+or\s+(?=[A-Z]{2,})/i);

  return orGroups.map(group => {
    // Within each OR group, split by AND separators (";", ",", "and")
    // But be careful not to split course sequences
    const andParts = group.split(/\s*[;,]\s*|\s+and\s+/i);
    return andParts.map(p => p.trim()).filter(p => p.length > 0);
  });
}

/**
 * Main parser function - converts prerequisite text to structured JSON
 */
function parsePrerequisites(text) {
  if (!text || typeof text !== 'string') {
    return {
      type: 'NONE',
      conditions: [],
      rawText: text || '',
      parseConfidence: 1.0,
    };
  }

  let trimmedText = text.trim();

  // Remove "Prerequisites for X:" prefix if present
  trimmedText = trimmedText.replace(/^prerequisites?\s+for\s+[^:]+:\s*/i, '');

  // Handle "None" or empty prerequisites
  if (/^none\.?$/i.test(trimmedText) || trimmedText.length === 0) {
    return {
      type: 'NONE',
      conditions: [],
      rawText: trimmedText,
      parseConfidence: 1.0,
    };
  }

  const result = {
    type: 'AND', // Default to AND
    conditions: [],
    rawText: trimmedText,
    parseConfidence: 0.8, // Start with moderate confidence
  };

  // Extract non-course conditions first
  const consent = extractConsent(trimmedText);
  const standing = extractStanding(trimmedText);
  const majorRestriction = extractMajorRestriction(trimmedText);
  const employmentReq = extractEmploymentReq(trimmedText);
  const globalGrade = extractGrade(trimmedText);
  const concurrent = isConcurrent(trimmedText);

  // Check for consent-only prerequisites
  if (consent && !/[A-Z]{2,}\s*\d+/.test(trimmedText)) {
    result.conditions.push({
      type: 'consent',
      value: consent,
    });
    result.parseConfidence = 0.95;
    return result;
  }

  // Extract courses
  const courses = extractCourses(trimmedText);

  if (courses.length === 0) {
    // No courses found - check for other conditions
    if (consent) {
      result.conditions.push({ type: 'consent', value: consent });
    }
    if (standing) {
      result.conditions.push({ type: 'standing', value: standing });
    }
    if (majorRestriction) {
      result.conditions.push({ type: 'major_restriction', value: majorRestriction });
    }
    if (employmentReq) {
      result.conditions.push({ type: 'employment', value: employmentReq });
    }

    if (result.conditions.length === 0) {
      // Couldn't parse anything meaningful
      result.conditions.push({ type: 'unparsed', value: trimmedText });
      result.parseConfidence = 0.3;
    } else {
      result.parseConfidence = 0.9; // High confidence for non-course conditions
    }

    return result;
  }

  // Determine logical structure (OR vs AND)
  const hasOr = /\bor\b/i.test(trimmedText);
  const hasAnd = /\band\b|[;,]/i.test(trimmedText);

  if (hasOr && !hasAnd) {
    // Pure OR condition
    result.type = 'OR';
    for (const course of courses) {
      result.conditions.push({
        type: 'course',
        courseId: course.courseId,
        minGrade: globalGrade,
        concurrent: concurrent,
      });
    }
  } else if (hasOr && hasAnd) {
    // Mixed - try to parse logical groups
    result.type = 'AND';

    // Split by semicolon first (usually separates major groups)
    const semiGroups = trimmedText.split(/\s*;\s*/);

    for (const group of semiGroups) {
      const groupCourses = extractCourses(group);
      const groupGrade = extractGrade(group) || globalGrade;
      const groupConcurrent = isConcurrent(group);

      if (groupCourses.length === 0) continue;

      if (/\bor\b/i.test(group) && groupCourses.length > 1) {
        // This group has OR conditions
        result.conditions.push({
          type: 'OR',
          conditions: groupCourses.map(c => ({
            type: 'course',
            courseId: c.courseId,
            minGrade: groupGrade,
            concurrent: groupConcurrent,
          })),
        });
      } else {
        // AND conditions
        for (const course of groupCourses) {
          result.conditions.push({
            type: 'course',
            courseId: course.courseId,
            minGrade: groupGrade,
            concurrent: groupConcurrent,
          });
        }
      }
    }

    result.parseConfidence = 0.7; // Lower confidence for complex parsing
  } else {
    // Pure AND condition
    result.type = 'AND';
    for (const course of courses) {
      result.conditions.push({
        type: 'course',
        courseId: course.courseId,
        minGrade: globalGrade,
        concurrent: concurrent,
      });
    }
  }

  // Add non-course conditions
  if (consent) {
    result.conditions.push({ type: 'consent', value: consent });
  }
  if (standing) {
    result.conditions.push({ type: 'standing', value: standing });
  }
  if (majorRestriction) {
    result.conditions.push({ type: 'major_restriction', value: majorRestriction });
  }
  if (employmentReq) {
    result.conditions.push({ type: 'employment', value: employmentReq });
  }

  // Adjust confidence based on complexity
  if (result.conditions.length > 5) {
    result.parseConfidence *= 0.9;
  }
  if (trimmedText.length > 200) {
    result.parseConfidence *= 0.85;
  }

  return result;
}

/**
 * Determine parse status based on confidence
 */
function getParseStatus(confidence) {
  if (confidence >= 0.8) return 'parsed';
  if (confidence >= 0.5) return 'parsed';
  return 'manual_review';
}

// ============================================================================
// MAIN SCRIPT
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : null;

  console.log('===========================================');
  console.log('  UCSB Compass - Prerequisite Parser');
  console.log('===========================================\n');

  if (dryRun) {
    console.log('DRY RUN MODE - No database updates will be made.\n');
  }

  // Fetch courses with prerequisites
  console.log('Fetching courses from database...');

  let query = supabase
    .from('courses')
    .select('id, course_id_clean, prerequisites_text')
    .not('prerequisites_text', 'is', null);

  if (limit) {
    query = query.limit(limit);
  }

  const { data: courses, error } = await query;

  if (error) {
    console.error('Error fetching courses:', error.message);
    process.exit(1);
  }

  console.log(`Found ${courses.length} courses with prerequisites.\n`);

  // Parse each course's prerequisites
  let parsed = 0;
  let needsReview = 0;
  let errors = 0;

  const updates = [];

  for (const course of courses) {
    if (!course.prerequisites_text?.trim()) continue;

    const result = parsePrerequisites(course.prerequisites_text);
    const status = getParseStatus(result.parseConfidence);

    if (status === 'manual_review') {
      needsReview++;
    } else {
      parsed++;
    }

    updates.push({
      id: course.id,
      course_id_clean: course.course_id_clean,
      prerequisites_parsed: result,
      prerequisites_parse_status: status,
    });

    // Show progress every 100 courses
    if (updates.length % 100 === 0) {
      process.stdout.write(`Parsed ${updates.length}/${courses.length}...\r`);
    }
  }

  console.log(`\nParsing complete!`);
  console.log(`  - Successfully parsed: ${parsed}`);
  console.log(`  - Needs manual review: ${needsReview}`);

  // Show some examples
  console.log('\n--- Sample Parsed Results ---\n');

  const samples = updates.slice(0, 5);
  for (const s of samples) {
    const course = courses.find(c => c.id === s.id);
    console.log(`[${s.course_id_clean}]`);
    console.log(`  Original: ${course.prerequisites_text}`);
    console.log(`  Parsed:   ${JSON.stringify(s.prerequisites_parsed, null, 2).split('\n').join('\n            ')}`);
    console.log(`  Status:   ${s.prerequisites_parse_status}`);
    console.log();
  }

  // Update database if not dry run
  if (!dryRun) {
    console.log('\nUpdating database...');

    const BATCH_SIZE = 50;
    let updated = 0;

    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const batch = updates.slice(i, i + BATCH_SIZE);

      // Update each record
      for (const record of batch) {
        const { error: updateError } = await supabase
          .from('courses')
          .update({
            prerequisites_parsed: record.prerequisites_parsed,
            prerequisites_parse_status: record.prerequisites_parse_status,
          })
          .eq('id', record.id);

        if (updateError) {
          errors++;
          console.error(`Error updating ${record.course_id_clean}:`, updateError.message);
        } else {
          updated++;
        }
      }

      process.stdout.write(`Updated ${updated}/${updates.length}...\r`);
    }

    console.log(`\n\nDatabase update complete!`);
    console.log(`  - Updated: ${updated}`);
    console.log(`  - Errors:  ${errors}`);
  }

  // Show manual review items
  const reviewItems = updates.filter(u => u.prerequisites_parse_status === 'manual_review');
  if (reviewItems.length > 0) {
    console.log('\n--- Items Needing Manual Review ---\n');
    const showReview = reviewItems.slice(0, 10);
    for (const item of showReview) {
      const course = courses.find(c => c.id === item.id);
      console.log(`[${item.course_id_clean}] ${course.prerequisites_text}`);
    }
    if (reviewItems.length > 10) {
      console.log(`... and ${reviewItems.length - 10} more.`);
    }
  }
}

// Export for testing
export { parsePrerequisites, extractCourses, extractGrade, expandSequence };

main().catch(console.error);
