# Prerequisites Manual Review

This document lists the 20 courses that need manual review for prerequisite parsing, along with documentation on the prerequisite format used in the database.

## How to Find Items in the Original File

The original prerequisite data is in:
```
src/data/datasets/courses-with-prereqs.json
```

To find a specific course, search for its `courseIdClean` value. For example, to find "CHEM 184":
```json
{
  "courseIdClean": "CHEM 184",
  "prerequisitesText": "3 prior courses in chemistry.",
  ...
}
```

## Items Needing Manual Review (20 total)

| Course | Prerequisites Text | Reason |
|--------|-------------------|--------|
| CHEM 184 | 3 prior courses in chemistry. | Quantity-based requirement |
| CHEM 218 | Open only by consent of the chemistry graduate advisor. | Non-standard consent format |
| CHEM 268B | Consent of the chemistry graduate advisor. | Non-standard consent format |
| EARTH 130 | Sophomore standing or higher. | Non-standard standing format |
| EARTH 192 | Proposal form must be submitted by the end of the 2nd week of the quarter. Applicant must have a minimum overall GPA of 2.70... | Administrative requirement |
| EARTH 503 | Concurrent research assistant appointment. | Employment requirement |
| ECE 5 | Open only to Electrical Engineering and Computer Engineering majors. | Major restriction (non-standard format) |
| ECE 598 | Consent of graduate adviser. | Non-standard spelling "adviser" |
| EEMB 285 | Upper-division courses in aquatic biology and/or geology. | Vague course requirement |
| ENV S 127A | Sophomore standing or higher. | Non-standard standing format |
| ESM 401C | ESM401A, ESM401B. MESM students only. | Course IDs without spaces |
| ESM 402C | ESM402A and ESM402B. MESM students only. | Course IDs without spaces |
| ESM 410 | Completion of a Summer internship. | Non-course requirement |
| GEOG 13 | UC Santa Barbara | Unclear/incomplete requirement |
| ME 598 | Consent of thesis adviser. | Non-standard consent format |
| ME 599 | Consent of dissertation adviser. | Non-standard consent format |
| PSTAT 130 | One upper division course in PSTAT, MATH, Computer Science or ECE. | Vague course requirement |
| PSTAT 171 | Mathematics 2B or 3B with a minimum grade of C | Parser issue - should be parseable |
| PSTAT 510 | Enrollment in M.A. or Ph.D. program. | Program enrollment requirement |
| PSY 1 | Students are required to be subjects in low-risk psychological experiments or completion of a short paper. | Non-course requirement |

---

## Database Prerequisites Format

The `prerequisites_parsed` column in the `courses` table uses JSONB with this structure:

### Top-Level Structure

```json
{
  "type": "AND" | "OR" | "NONE",
  "conditions": [...],
  "rawText": "Original prerequisite text",
  "parseConfidence": 0.0 - 1.0
}
```

### Condition Types

#### 1. Course Requirement
```json
{
  "type": "course",
  "courseId": "CMPSC 16",
  "minGrade": "C" | "C-" | "B" | null,
  "concurrent": true | false
}
```

#### 2. Nested OR/AND Group
```json
{
  "type": "OR",
  "conditions": [
    { "type": "course", "courseId": "MATH 3A", ... },
    { "type": "course", "courseId": "MATH 2A", ... }
  ]
}
```

#### 3. Consent Requirement
```json
{
  "type": "consent",
  "value": ["instructor"] | ["department"] | ["instructor", "department"] | ["graduate-advisor"] | ["committee-chair"]
}
```

#### 4. Standing Requirement
```json
{
  "type": "standing",
  "value": "upper-division" | "lower-division" | "graduate" | "freshman" | "sophomore+" | "junior" | "senior" | "phd" | "masters-candidate"
}
```

#### 5. Major Restriction
```json
{
  "type": "major_restriction",
  "value": ["Computer Science", "Electrical Engineering"]
}
```

#### 6. Employment Requirement
```json
{
  "type": "employment",
  "value": "ta-employment" | "ta"
}
```

#### 7. Unparsed (Manual Review Needed)
```json
{
  "type": "unparsed",
  "value": "Original text that couldn't be parsed"
}
```

### Parse Confidence Levels

| Confidence | Status | Meaning |
|------------|--------|---------|
| 0.8 - 1.0 | `parsed` | High confidence, auto-parsed |
| 0.5 - 0.79 | `parsed` | Moderate confidence, complex structure |
| 0.0 - 0.49 | `manual_review` | Low confidence, needs human review |

### Example: Complex Prerequisite

**Original:** "MCDB 1A and Chemistry 1A-B-C with a grade of C- or better; or MCDB 1A with a grade of C or better."

**Parsed:**
```json
{
  "type": "AND",
  "conditions": [
    {
      "type": "OR",
      "conditions": [
        { "type": "course", "courseId": "CHEM 1A", "minGrade": "C-", "concurrent": false },
        { "type": "course", "courseId": "CHEM 1B", "minGrade": "C-", "concurrent": false },
        { "type": "course", "courseId": "CHEM 1C", "minGrade": "C-", "concurrent": false },
        { "type": "course", "courseId": "MCDB 1A", "minGrade": "C-", "concurrent": false }
      ]
    },
    { "type": "course", "courseId": "MCDB 1A", "minGrade": "C", "concurrent": false }
  ],
  "rawText": "MCDB 1A and Chemistry 1A-B-C with a grade of C- or better; or MCDB 1A with a grade of C or better.",
  "parseConfidence": 0.7
}
```

---

## How to Manually Fix Items

1. Find the course in Supabase:
   ```sql
   SELECT * FROM courses WHERE course_id_clean = 'CHEM 184';
   ```

2. Update with corrected JSON:
   ```sql
   UPDATE courses
   SET
     prerequisites_parsed = '{"type":"AND","conditions":[{"type":"course_count","department":"CHEM","count":3,"level":"any"}],"rawText":"3 prior courses in chemistry.","parseConfidence":1.0}',
     prerequisites_parse_status = 'parsed'
   WHERE course_id_clean = 'CHEM 184';
   ```

3. Or update via the Supabase dashboard Table Editor.
