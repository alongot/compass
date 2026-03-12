# Supabase Database Guide

## Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Add credentials to your `.env` file:
   ```
    VITE_SUPABASE_URL=https://kcresaamsawhwmdfuzqu.supabase.co
    VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjcmVzYWFtc2F3aHdtZGZ1enF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMTU5ODksImV4cCI6MjA4NDY5MTk4OX0.VYfcy7UUDtP7mf9R5XsSs5Uc86PmMs1JJvtZdP0Z6lU

   ```
3. Run the migration in Supabase SQL Editor:
   - Open `src/data/migrations/001_initial_schema.sql`
   - Paste and execute in your Supabase dashboard

## Database Schema

| Table | Description |
|-------|-------------|
| `courses` | 823+ UCSB courses with prerequisites |
| `course_prerequisites` | Prerequisite relationships between courses |
| `course_ge_areas` | GE requirement mappings (e.g., "C", "WRT", "QNT") |
| `programs` | 329 majors, minors, and graduate programs |
| `requirement_categories` | Requirement groups within programs |
| `requirement_rules` | Specific course requirements per category |
| `students` | Student profiles |
| `student_courses` | Student course history and plans |
| `student_programs` | Student program enrollments |
| `institutions` | Transfer institutions (for future assist.org integration) |
| `articulations` | Course articulation agreements |

## React Hooks

Import hooks from `src/hooks/useDatabase.js`:

```jsx
import { useCourses, useCourse, usePrograms, useProgram, useDepartments } from '../hooks/useDatabase';
```

### Fetch Courses

```jsx
// All courses (limit 50)
const { courses, loading, error } = useCourses();

// With filters
const { courses } = useCourses({
  deptCode: 'CMPSC',
  search: 'algorithms',
  limit: 100
});
```

### Fetch Single Course

```jsx
const { course, loading, error } = useCourse('CMPSC 16');
// Returns course with GE areas and prerequisites
```

### Fetch Programs

```jsx
// All active programs
const { programs, loading, error } = usePrograms();

// Filter by type
const { programs } = usePrograms({
  type: "Bachelor's Degree",
  level: 'Undergraduate',
  search: 'Computer'
});
```

### Fetch Single Program with Requirements

```jsx
const { program, categories, loading, error } = useProgram('BSCMPSC');
// Returns program details and requirement categories with rules
```

### Fetch Departments

```jsx
const { departments, loading, error } = useDepartments();
// Returns array of department codes: ['ANTH', 'ART', 'CMPSC', ...]
```

## Direct Supabase Queries

Import the client from `src/lib/supabase.js`:

```jsx
import { supabase } from '../lib/supabase';
```

### Query Examples

```jsx
// Get all Computer Science courses
const { data, error } = await supabase
  .from('courses')
  .select('*')
  .eq('dept_code', 'CMPSC')
  .order('course_id_clean');

// Get course with GE areas
const { data, error } = await supabase
  .from('courses')
  .select(`
    *,
    course_ge_areas (ge_code)
  `)
  .eq('course_id_clean', 'CMPSC 16')
  .single();

// Search programs by name
const { data, error } = await supabase
  .from('programs')
  .select('*')
  .ilike('name', '%Computer%')
  .eq('status', 'Active');

// Get undergraduate majors only
const { data, error } = await supabase
  .from('programs')
  .select('*')
  .eq('type', "Bachelor's Degree")
  .eq('level', 'Undergraduate');
```

## Populating the Database

After running the migration, import data using the scripts:

```bash
# Import programs (329 majors/minors)
node scripts/import-programs.js

# Import courses (823+ courses with prerequisites)
node scripts/import-courses.js
```
