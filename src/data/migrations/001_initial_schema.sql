-- UCSB Compass Database Schema
-- Migration: 001_initial_schema
-- Created: 2026-01-21
--
-- This schema links Major -> Requirements -> Courses -> Prerequisites
-- to power the Compass degree planning features.

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE 1: courses
-- Stores all 823+ courses from the UCSB API/catalog
-- ============================================================================
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id_clean VARCHAR(50) NOT NULL UNIQUE,  -- e.g., "CMPSC 16"

    -- Basic course info
    title VARCHAR(255) NOT NULL,
    description TEXT,
    dept_code VARCHAR(20) NOT NULL,
    subject_area VARCHAR(20),
    college VARCHAR(50),  -- e.g., "L&S", "COE"

    -- Units configuration
    units_fixed DECIMAL(4, 2),
    units_variable_low DECIMAL(4, 2),
    units_variable_high DECIMAL(4, 2),

    -- Course attributes
    obj_level_code VARCHAR(5),  -- U = Undergraduate, G = Graduate
    grading_option VARCHAR(10),  -- L = Letter, P = P/NP
    instruction_type VARCHAR(10),  -- LEC, LAB, SEM, etc.

    -- Prerequisites (raw and parsed)
    prerequisites_text TEXT,
    prerequisites_parsed JSONB DEFAULT '{}',
    prerequisites_parse_status VARCHAR(20) DEFAULT 'pending'
        CHECK (prerequisites_parse_status IN ('pending', 'parsed', 'manual_review')),

    -- Catalog metadata
    catalog_url TEXT,
    advisory_comments TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for courses
CREATE INDEX idx_courses_dept_code ON courses(dept_code);
CREATE INDEX idx_courses_college ON courses(college);
CREATE INDEX idx_courses_obj_level ON courses(obj_level_code);
CREATE INDEX idx_courses_prereq_status ON courses(prerequisites_parse_status);
CREATE INDEX idx_courses_prereq_parsed ON courses USING GIN(prerequisites_parsed);

-- ============================================================================
-- TABLE 2: course_prerequisites
-- Parsed prerequisite relationships (normalized from prerequisites_parsed)
-- ============================================================================
CREATE TABLE course_prerequisites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

    -- Prerequisite grouping (for OR logic between groups)
    prereq_group INTEGER NOT NULL DEFAULT 1,

    -- The required course (NULL if condition-based prerequisite)
    required_course_id UUID REFERENCES courses(id) ON DELETE SET NULL,

    -- Grade and concurrency requirements
    min_grade VARCHAR(5),  -- e.g., "C-", "B"
    can_be_concurrent BOOLEAN DEFAULT FALSE,

    -- Non-course conditions
    condition_type VARCHAR(50),  -- "consent", "standing", "score", etc.
    condition_value TEXT,  -- e.g., "junior", "department consent"

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for course_prerequisites
CREATE INDEX idx_prereqs_course_id ON course_prerequisites(course_id);
CREATE INDEX idx_prereqs_required_course ON course_prerequisites(required_course_id);
CREATE INDEX idx_prereqs_group ON course_prerequisites(course_id, prereq_group);

-- ============================================================================
-- TABLE 3: course_ge_areas
-- General Education requirement mappings
-- ============================================================================
CREATE TABLE course_ge_areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

    ge_code VARCHAR(20) NOT NULL,  -- e.g., "C", "WRT", "QNT", "ETH", "EUR"
    ge_college VARCHAR(50),  -- e.g., "L&S" (some GEs are college-specific)

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(course_id, ge_code, ge_college)
);

-- Indexes for course_ge_areas
CREATE INDEX idx_ge_course_id ON course_ge_areas(course_id);
CREATE INDEX idx_ge_code ON course_ge_areas(ge_code);
CREATE INDEX idx_ge_college ON course_ge_areas(ge_college);

-- ============================================================================
-- TABLE 4: programs
-- 329 majors/minors/graduate programs from catalog
-- ============================================================================
CREATE TABLE programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id VARCHAR(100) NOT NULL UNIQUE,  -- e.g., "BSACTSC-2025-09-21"
    program_group_id VARCHAR(50) NOT NULL,  -- e.g., "BSACTSC"

    -- Program details
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,  -- "Bachelor's Degree", "Minor", "Master's Degree"
    level VARCHAR(50) NOT NULL,  -- "Undergraduate", "Graduate"
    degree_designation VARCHAR(100),  -- "Bachelor of Science", "Minor", etc.

    -- Administrative info
    status VARCHAR(20) DEFAULT 'Active',
    effective_start_date DATE,
    effective_end_date DATE,
    cip_code VARCHAR(20),  -- Classification of Instructional Programs code

    -- Additional metadata
    catalog_description TEXT,
    catalog_image_url TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for programs
CREATE INDEX idx_programs_group_id ON programs(program_group_id);
CREATE INDEX idx_programs_type ON programs(type);
CREATE INDEX idx_programs_level ON programs(level);
CREATE INDEX idx_programs_status ON programs(status);

-- ============================================================================
-- TABLE 5: requirement_categories
-- Major requirement categories: "Preparation for Major", "Upper Division", etc.
-- ============================================================================
CREATE TABLE requirement_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,  -- e.g., "Preparation for the Major"
    description TEXT,

    -- Unit requirements
    min_units DECIMAL(5, 2),
    max_units DECIMAL(5, 2),
    min_courses INTEGER,

    -- Ordering
    display_order INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for requirement_categories
CREATE INDEX idx_req_cat_program_id ON requirement_categories(program_id);
CREATE INDEX idx_req_cat_order ON requirement_categories(program_id, display_order);

-- ============================================================================
-- TABLE 6: requirement_rules
-- Specific course requirements within categories
-- ============================================================================
CREATE TABLE requirement_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES requirement_categories(id) ON DELETE CASCADE,

    -- Rule type determines how to interpret the rule
    rule_type VARCHAR(50) NOT NULL
        CHECK (rule_type IN ('specific_course', 'course_list', 'elective_area', 'unit_requirement', 'gpa_requirement')),

    -- For specific_course rules
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,

    -- For course_list rules (choose X from list)
    course_list JSONB,  -- Array of course_id_clean strings
    choose_count INTEGER,  -- "Choose 2 from the following"

    -- For elective_area rules
    elective_description TEXT,
    elective_dept_codes JSONB,  -- Array of allowed department codes
    elective_min_units DECIMAL(5, 2),

    -- Grade requirements
    min_grade VARCHAR(5),

    -- Display
    display_order INTEGER DEFAULT 0,
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for requirement_rules
CREATE INDEX idx_rules_category_id ON requirement_rules(category_id);
CREATE INDEX idx_rules_course_id ON requirement_rules(course_id);
CREATE INDEX idx_rules_type ON requirement_rules(rule_type);

-- ============================================================================
-- TABLE 7: students, student_courses, student_programs
-- Student progress tracking
-- ============================================================================

-- Students table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Auth info (will link to Supabase auth.users)
    auth_user_id UUID UNIQUE,
    email VARCHAR(255),

    -- Student info
    display_name VARCHAR(255),
    enrollment_status VARCHAR(50) DEFAULT 'enrolled'
        CHECK (enrollment_status IN ('enrolled', 'prospective', 'transfer', 'alumni')),
    enrollment_year INTEGER,
    expected_graduation_year INTEGER,

    -- Legacy primary program (prefer student_programs junction table)
    primary_program_id UUID REFERENCES programs(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student courses (completed, in-progress, planned)
CREATE TABLE student_courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

    -- Course status
    status VARCHAR(20) NOT NULL DEFAULT 'planned'
        CHECK (status IN ('completed', 'in_progress', 'planned', 'dropped', 'failed')),

    -- Completion details
    grade VARCHAR(5),
    units_earned DECIMAL(4, 2),
    quarter VARCHAR(20),  -- e.g., "Fall 2025", "Winter 2026"
    year INTEGER,

    -- Transfer credit
    is_transfer_credit BOOLEAN DEFAULT FALSE,
    transfer_institution_id UUID,  -- References institutions table

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(student_id, course_id, quarter, year)
);

-- Student programs (supports multiple majors, minors, and "what-if" scenarios)
CREATE TABLE student_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,

    program_type VARCHAR(20) NOT NULL DEFAULT 'primary'
        CHECK (program_type IN ('primary', 'secondary', 'minor', 'what_if')),

    -- Declaration status
    declared_date DATE,
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(student_id, program_id)
);

-- Indexes for student tables
CREATE INDEX idx_students_auth_user ON students(auth_user_id);
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_student_courses_student ON student_courses(student_id);
CREATE INDEX idx_student_courses_course ON student_courses(course_id);
CREATE INDEX idx_student_courses_status ON student_courses(status);
CREATE INDEX idx_student_programs_student ON student_programs(student_id);
CREATE INDEX idx_student_programs_program ON student_programs(program_id);

-- ============================================================================
-- TABLE 8: institutions, articulations
-- Future assist.org integration for transfer credit
-- ============================================================================

-- Transfer institutions (community colleges, etc.)
CREATE TABLE institutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50),
    institution_type VARCHAR(50),  -- "community_college", "csu", "uc", etc.

    -- Assist.org integration
    assist_org_id VARCHAR(50),

    -- Location
    city VARCHAR(100),
    state VARCHAR(50),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Articulation agreements (CC course -> UCSB course mappings)
CREATE TABLE articulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Source institution and course
    source_institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    source_course_code VARCHAR(50) NOT NULL,
    source_course_title VARCHAR(255),
    source_units DECIMAL(4, 2),

    -- Target UCSB course
    target_course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

    -- Articulation details
    articulation_type VARCHAR(50) DEFAULT 'equivalent'
        CHECK (articulation_type IN ('equivalent', 'partial', 'combined')),
    notes TEXT,

    -- Validity period
    effective_start_date DATE,
    effective_end_date DATE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(source_institution_id, source_course_code, target_course_id)
);

-- Indexes for articulation tables
CREATE INDEX idx_institutions_assist_id ON institutions(assist_org_id);
CREATE INDEX idx_articulations_source ON articulations(source_institution_id);
CREATE INDEX idx_articulations_target ON articulations(target_course_id);
CREATE INDEX idx_articulations_source_code ON articulations(source_course_code);

-- ============================================================================
-- TRIGGERS: Auto-update updated_at timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_programs_updated_at
    BEFORE UPDATE ON programs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requirement_categories_updated_at
    BEFORE UPDATE ON requirement_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_courses_updated_at
    BEFORE UPDATE ON student_courses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) Policies
-- Enable RLS for multi-tenant student data
-- ============================================================================

-- Enable RLS on student tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_programs ENABLE ROW LEVEL SECURITY;

-- Students can only see their own data
CREATE POLICY students_own_data ON students
    FOR ALL USING (auth.uid() = auth_user_id);

CREATE POLICY student_courses_own_data ON student_courses
    FOR ALL USING (
        student_id IN (
            SELECT id FROM students WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY student_programs_own_data ON student_programs
    FOR ALL USING (
        student_id IN (
            SELECT id FROM students WHERE auth_user_id = auth.uid()
        )
    );

-- Public read access for reference tables
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirement_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirement_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE articulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY courses_public_read ON courses FOR SELECT USING (true);
CREATE POLICY programs_public_read ON programs FOR SELECT USING (true);
CREATE POLICY req_categories_public_read ON requirement_categories FOR SELECT USING (true);
CREATE POLICY req_rules_public_read ON requirement_rules FOR SELECT USING (true);
CREATE POLICY institutions_public_read ON institutions FOR SELECT USING (true);
CREATE POLICY articulations_public_read ON articulations FOR SELECT USING (true);

-- ============================================================================
-- VIEWS: Common queries
-- ============================================================================

-- View: Courses with their GE areas as array
CREATE VIEW courses_with_ge AS
SELECT
    c.*,
    COALESCE(
        array_agg(DISTINCT cge.ge_code) FILTER (WHERE cge.ge_code IS NOT NULL),
        '{}'::VARCHAR[]
    ) AS ge_codes
FROM courses c
LEFT JOIN course_ge_areas cge ON c.id = cge.course_id
GROUP BY c.id;

-- View: Programs with requirement counts
CREATE VIEW programs_with_stats AS
SELECT
    p.*,
    COUNT(DISTINCT rc.id) AS category_count,
    COUNT(DISTINCT rr.id) AS rule_count
FROM programs p
LEFT JOIN requirement_categories rc ON p.id = rc.program_id
LEFT JOIN requirement_rules rr ON rc.id = rr.category_id
GROUP BY p.id;

-- ============================================================================
-- SAMPLE DATA: Insert a few test records (optional)
-- ============================================================================

-- Uncomment to insert test data:
/*
INSERT INTO institutions (name, short_name, institution_type, city, state) VALUES
('Santa Barbara City College', 'SBCC', 'community_college', 'Santa Barbara', 'CA'),
('Santa Monica College', 'SMC', 'community_college', 'Santa Monica', 'CA');
*/

-- ============================================================================
-- COMMENTS: Table documentation
-- ============================================================================

COMMENT ON TABLE courses IS 'All UCSB courses from the academic catalog';
COMMENT ON TABLE course_prerequisites IS 'Prerequisite relationships between courses';
COMMENT ON TABLE course_ge_areas IS 'General Education area assignments for courses';
COMMENT ON TABLE programs IS 'Academic programs (majors, minors, graduate degrees)';
COMMENT ON TABLE requirement_categories IS 'Categories of requirements within a program';
COMMENT ON TABLE requirement_rules IS 'Specific course/unit requirements within categories';
COMMENT ON TABLE students IS 'Student profiles and preferences';
COMMENT ON TABLE student_courses IS 'Student course history and plans';
COMMENT ON TABLE student_programs IS 'Student program enrollments';
COMMENT ON TABLE institutions IS 'Transfer institutions (community colleges, etc.)';
COMMENT ON TABLE articulations IS 'Course articulation agreements between institutions';

COMMENT ON COLUMN courses.prerequisites_parsed IS 'JSONB structure: {type: "AND"|"OR", conditions: [...], rawText: string, parseConfidence: number}';
COMMENT ON COLUMN courses.prerequisites_parse_status IS 'Status of prerequisite parsing: pending, parsed, or manual_review';
