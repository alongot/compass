import MAJORS_DATA from './majors.json';

// Default quarter plans copied verbatim from CompassDemo.jsx (the hardcoded MAJOR_CONFIGS).
// These are preserved during the majors.json transform because majors.json does not supply them.
const QUARTER_PLANS = {
  econ_ba: [
    {
      quarter: "Fall 2025", status: "current",
      courses: [
        { id: "ECON 10A", name: "Intermediate Microeconomics",          difficulty: 4.2, color: "orange" },
        { id: "WRIT 2",   name: "Academic Writing",                     difficulty: 1.0, color: "green" },
        { id: "SOC 1",    name: "Introduction to Sociology",            difficulty: 2.1, color: "green" },
      ], totalUnits: 12
    },
    {
      quarter: "Winter 2026", status: "upcoming",
      courses: [
        { id: "ECON 5",  name: "Statistics for Economics and Business", difficulty: 3.2, color: "yellow" },
        { id: "MATH 2A", name: "Calculus, First Course",                difficulty: 4.5, color: "yellow" },
        { id: "HIST 2C", name: "World History",                         difficulty: 2.0, color: "green" },
      ], totalUnits: 12
    },
    {
      quarter: "Spring 2026", status: "upcoming",
      courses: [
        { id: "MATH 2B",   name: "Calculus, Second Course",             difficulty: 4.5, color: "yellow" },
        { id: "ECON 100B", name: "Econometrics",                        difficulty: 3.1, color: "yellow" },
        { id: "ART 1",     name: "Art Appreciation",                    difficulty: 1.5, color: "green" },
      ], totalUnits: 12
    },
  ],
  cs_bs: [
    {
      quarter: "Fall 2025", status: "current",
      courses: [
        { id: "CMPSC 16", name: "Problem Solving with Computers I",        difficulty: 3.5, color: "orange" },
        { id: "MATH 3A",  name: "Calculus with Applications, First Course", difficulty: 4.0, color: "yellow" },
        { id: "WRIT 2",   name: "Academic Writing",                         difficulty: 1.0, color: "green" },
      ], totalUnits: 12
    },
    {
      quarter: "Winter 2026", status: "upcoming",
      courses: [
        { id: "CMPSC 24", name: "Problem Solving with Computers II",        difficulty: 3.8, color: "orange" },
        { id: "MATH 3B",  name: "Calculus with Applications, Second Course", difficulty: 4.2, color: "yellow" },
        { id: "ECE 15",   name: "Engineering Computation",                   difficulty: 3.6, color: "yellow" },
      ], totalUnits: 12
    },
    {
      quarter: "Spring 2026", status: "upcoming",
      courses: [
        { id: "CMPSC 32", name: "Object-Oriented Design",                   difficulty: 3.7, color: "orange" },
        { id: "CMPSC 40", name: "Foundations of Computer Science",          difficulty: 4.0, color: "orange" },
        { id: "MATH 3C",  name: "Calculus for Social and Life Sciences",    difficulty: 3.8, color: "yellow" },
      ], totalUnits: 12
    },
  ],
  bio_bs: [
    {
      quarter: "Fall 2025", status: "current",
      courses: [
        { id: "EEMB 2",  name: "Introduction to Biology",                     difficulty: 3.0, color: "orange" },
        { id: "CHEM 1A", name: "General Chemistry",                           difficulty: 4.2, color: "yellow" },
        { id: "MATH 3A", name: "Calculus with Applications, First Course",    difficulty: 4.0, color: "yellow" },
      ], totalUnits: 12
    },
    {
      quarter: "Winter 2026", status: "upcoming",
      courses: [
        { id: "CHEM 1B",  name: "General Chemistry",                          difficulty: 4.0, color: "yellow" },
        { id: "MCDB 1A",  name: "Molecules, Cells, and Organisms",            difficulty: 3.8, color: "yellow" },
        { id: "MATH 3B",  name: "Calculus with Applications, Second Course",  difficulty: 4.2, color: "yellow" },
      ], totalUnits: 12
    },
    {
      quarter: "Spring 2026", status: "upcoming",
      courses: [
        { id: "CHEM 1C",  name: "General Chemistry",   difficulty: 4.1, color: "yellow" },
        { id: "CHEM 6A",  name: "Organic Chemistry",   difficulty: 4.4, color: "yellow" },
        { id: "EEMB 101", name: "Ecology",             difficulty: 3.5, color: "orange" },
      ], totalUnits: 12
    },
  ],
  comm_ba: [
    {
      quarter: "Fall 2025", status: "current",
      courses: [
        { id: "COMM 1",  name: "Introduction to Communication", difficulty: 2.0, color: "orange" },
        { id: "COMM 88", name: "Proseminar in Communication",   difficulty: 2.5, color: "orange" },
        { id: "WRIT 2",  name: "Academic Writing",              difficulty: 1.0, color: "green" },
      ], totalUnits: 12
    },
    {
      quarter: "Winter 2026", status: "upcoming",
      courses: [
        { id: "COMM 87", name: "Research Methods",              difficulty: 2.8, color: "orange" },
        { id: "COMM 2",  name: "Communication Theory",          difficulty: 2.6, color: "orange" },
        { id: "HIST 2C", name: "World History",                 difficulty: 2.0, color: "green" },
      ], totalUnits: 12
    },
    {
      quarter: "Spring 2026", status: "upcoming",
      courses: [
        { id: "COMM 100", name: "Advanced Research Methods",    difficulty: 3.0, color: "orange" },
        { id: "COMM 105", name: "Media and Society",            difficulty: 2.5, color: "orange" },
        { id: "ART 1",    name: "Art Appreciation",             difficulty: 1.5, color: "green" },
      ], totalUnits: 12
    },
  ],
  soc_ba: [
    {
      quarter: "Fall 2025", status: "current",
      courses: [
        { id: "SOC 1",   name: "Introduction to Sociology",    difficulty: 2.1, color: "orange" },
        { id: "SOC 3",   name: "Contemporary Social Problems", difficulty: 2.3, color: "orange" },
        { id: "WRIT 2",  name: "Academic Writing",             difficulty: 1.0, color: "green" },
      ], totalUnits: 12
    },
    {
      quarter: "Winter 2026", status: "upcoming",
      courses: [
        { id: "SOC 10",  name: "Social Statistics",            difficulty: 3.2, color: "orange" },
        { id: "SOC 13",  name: "Social Research Methods",      difficulty: 2.8, color: "orange" },
        { id: "HIST 2C", name: "World History",                difficulty: 2.0, color: "green" },
      ], totalUnits: 12
    },
    {
      quarter: "Spring 2026", status: "upcoming",
      courses: [
        { id: "SOC 100A", name: "Sociological Theory I",       difficulty: 3.0, color: "orange" },
        { id: "SOC 100B", name: "Sociological Theory II",      difficulty: 3.1, color: "orange" },
        { id: "ART 1",    name: "Art Appreciation",            difficulty: 1.5, color: "green" },
      ], totalUnits: 12
    },
  ],
  psych_bs: [
    {
      quarter: "Fall 2025", status: "current",
      courses: [
        { id: "PSY 1",  name: "Introduction to Psychology", difficulty: 2.2, color: "orange" },
        { id: "PSY 2",  name: "Developmental Psychology",   difficulty: 2.4, color: "orange" },
        { id: "WRIT 2", name: "Academic Writing",           difficulty: 1.0, color: "green" },
      ], totalUnits: 12
    },
    {
      quarter: "Winter 2026", status: "upcoming",
      courses: [
        { id: "PSY 5",   name: "Statistics",       difficulty: 3.3, color: "orange" },
        { id: "PSY 99",  name: "Research Methods", difficulty: 3.0, color: "orange" },
        { id: "HIST 2C", name: "World History",    difficulty: 2.0, color: "green" },
      ], totalUnits: 12
    },
    {
      quarter: "Spring 2026", status: "upcoming",
      courses: [
        { id: "PSY 101A", name: "Learning and Behavior", difficulty: 3.5, color: "orange" },
        { id: "PSY 115",  name: "Cognitive Psychology",  difficulty: 3.4, color: "orange" },
        { id: "ART 1",    name: "Art Appreciation",      difficulty: 1.5, color: "green" },
      ], totalUnits: 12
    },
  ],
  chem_bs: [
    {
      quarter: "Fall 2025", status: "current",
      courses: [
        { id: "CHEM 1A", name: "General Chemistry",                          difficulty: 4.2, color: "orange" },
        { id: "MATH 3A", name: "Calculus with Applications, First Course",   difficulty: 4.0, color: "yellow" },
        { id: "WRIT 2",  name: "Academic Writing",                           difficulty: 1.0, color: "green" },
      ], totalUnits: 12
    },
    {
      quarter: "Winter 2026", status: "upcoming",
      courses: [
        { id: "CHEM 1B", name: "General Chemistry",                          difficulty: 4.0, color: "orange" },
        { id: "CHEM 6A", name: "Organic Chemistry",                          difficulty: 4.4, color: "orange" },
        { id: "MATH 3B", name: "Calculus with Applications, Second Course",  difficulty: 4.2, color: "yellow" },
      ], totalUnits: 12
    },
    {
      quarter: "Spring 2026", status: "upcoming",
      courses: [
        { id: "CHEM 1C",  name: "General Chemistry",            difficulty: 4.1, color: "orange" },
        { id: "CHEM 6B",  name: "Organic Chemistry",            difficulty: 4.3, color: "orange" },
        { id: "CHEM 109A", name: "Advanced Inorganic Chemistry", difficulty: 4.3, color: "orange" },
      ], totalUnits: 12
    },
  ],
  me_bs: [
    {
      quarter: "Fall 2025", status: "current",
      courses: [
        { id: "ME 10",   name: "Introduction to Engineering",                difficulty: 2.5, color: "orange" },
        { id: "MATH 3A", name: "Calculus with Applications, First Course",   difficulty: 4.0, color: "yellow" },
        { id: "WRIT 2",  name: "Academic Writing",                           difficulty: 1.0, color: "green" },
      ], totalUnits: 12
    },
    {
      quarter: "Winter 2026", status: "upcoming",
      courses: [
        { id: "MATH 3B", name: "Calculus with Applications, Second Course",  difficulty: 4.2, color: "yellow" },
        { id: "ECE 15",  name: "Engineering Computation",                    difficulty: 3.6, color: "yellow" },
        { id: "ME 6",    name: "Introduction to Materials Science",          difficulty: 3.2, color: "orange" },
      ], totalUnits: 12
    },
    {
      quarter: "Spring 2026", status: "upcoming",
      courses: [
        { id: "MATH 3C", name: "Calculus for Social and Life Sciences",      difficulty: 3.8, color: "yellow" },
        { id: "MATH 4A", name: "Linear Algebra",                             difficulty: 4.3, color: "yellow" },
        { id: "ME 100",  name: "Mechanics of Solids",                        difficulty: 4.2, color: "orange" },
      ], totalUnits: 12
    },
  ],
  ee_bs: [
    {
      quarter: "Fall 2025", status: "current",
      courses: [
        { id: "ECE 1",   name: "Introduction to Electrical Engineering",   difficulty: 2.8, color: "orange" },
        { id: "MATH 3A", name: "Calculus with Applications, First Course", difficulty: 4.0, color: "yellow" },
        { id: "WRIT 2",  name: "Academic Writing",                         difficulty: 1.0, color: "green" },
      ], totalUnits: 12
    },
    {
      quarter: "Winter 2026", status: "upcoming",
      courses: [
        { id: "ECE 15",  name: "Engineering Computation",                   difficulty: 3.6, color: "orange" },
        { id: "ECE 65",  name: "Components and Circuits",                   difficulty: 4.0, color: "orange" },
        { id: "MATH 3B", name: "Calculus with Applications, Second Course", difficulty: 4.2, color: "yellow" },
      ], totalUnits: 12
    },
    {
      quarter: "Spring 2026", status: "upcoming",
      courses: [
        { id: "ECE 2",   name: "Introduction to Circuits",               difficulty: 3.8, color: "orange" },
        { id: "MATH 3C", name: "Calculus for Social and Life Sciences",  difficulty: 3.8, color: "yellow" },
        { id: "MATH 4A", name: "Linear Algebra",                         difficulty: 4.3, color: "yellow" },
      ], totalUnits: 12
    },
  ],
  stats_bs: [
    {
      quarter: "Fall 2025", status: "current",
      courses: [
        { id: "PSTAT 10", name: "Principles of Data Science",              difficulty: 2.8, color: "orange" },
        { id: "MATH 3A",  name: "Calculus with Applications, First Course", difficulty: 4.0, color: "yellow" },
        { id: "WRIT 2",   name: "Academic Writing",                         difficulty: 1.0, color: "green" },
      ], totalUnits: 12
    },
    {
      quarter: "Winter 2026", status: "upcoming",
      courses: [
        { id: "PSTAT 120A", name: "Probability and Statistics I",           difficulty: 4.0, color: "orange" },
        { id: "MATH 3B",    name: "Calculus with Applications, Second Course", difficulty: 4.2, color: "yellow" },
        { id: "HIST 2C",    name: "World History",                           difficulty: 2.0, color: "green" },
      ], totalUnits: 12
    },
    {
      quarter: "Spring 2026", status: "upcoming",
      courses: [
        { id: "PSTAT 120B", name: "Probability and Statistics II",          difficulty: 4.2, color: "orange" },
        { id: "MATH 3C",    name: "Calculus for Social and Life Sciences",  difficulty: 3.8, color: "yellow" },
        { id: "PSTAT 126",  name: "Regression Analysis",                    difficulty: 3.8, color: "orange" },
      ], totalUnits: 12
    },
  ],
  film_ba: [
    {
      quarter: "Fall 2025", status: "current",
      courses: [
        { id: "FLMST 1",  name: "Introduction to Film Studies",  difficulty: 1.8, color: "orange" },
        { id: "FLMST 20", name: "Introduction to Media Studies", difficulty: 1.9, color: "orange" },
        { id: "WRIT 2",   name: "Academic Writing",              difficulty: 1.0, color: "green" },
      ], totalUnits: 12
    },
    {
      quarter: "Winter 2026", status: "upcoming",
      courses: [
        { id: "FLMST 50", name: "Introduction to Film History",  difficulty: 2.0, color: "orange" },
        { id: "FLMST 95", name: "Screenwriting Fundamentals",    difficulty: 2.2, color: "orange" },
        { id: "HIST 2C",  name: "World History",                 difficulty: 2.0, color: "green" },
      ], totalUnits: 12
    },
    {
      quarter: "Spring 2026", status: "upcoming",
      courses: [
        { id: "FLMST 99",  name: "Film Analysis",            difficulty: 2.1, color: "orange" },
        { id: "FLMST 100", name: "Film Theory and Criticism", difficulty: 2.8, color: "orange" },
        { id: "ART 1",     name: "Art Appreciation",          difficulty: 1.5, color: "green" },
      ], totalUnits: 12
    },
  ],
  envst_bs: [
    {
      quarter: "Fall 2025", status: "current",
      courses: [
        { id: "ENV S 3",   name: "Introduction to Environmental Studies", difficulty: 2.2, color: "orange" },
        { id: "ENV S 15A", name: "Environmental Science I",               difficulty: 3.0, color: "orange" },
        { id: "WRIT 2",    name: "Academic Writing",                       difficulty: 1.0, color: "green" },
      ], totalUnits: 12
    },
    {
      quarter: "Winter 2026", status: "upcoming",
      courses: [
        { id: "ENV S 40", name: "Global Environmental Problems",          difficulty: 2.5, color: "orange" },
        { id: "ENV S 70", name: "Environmental Politics",                 difficulty: 2.6, color: "orange" },
        { id: "HIST 2C",  name: "World History",                          difficulty: 2.0, color: "green" },
      ], totalUnits: 12
    },
    {
      quarter: "Spring 2026", status: "upcoming",
      courses: [
        { id: "ENV S 95",  name: "Research Methods in Env Studies",       difficulty: 3.0, color: "orange" },
        { id: "ENV S 100", name: "Environmental Policy",                  difficulty: 2.8, color: "orange" },
        { id: "ART 1",     name: "Art Appreciation",                      difficulty: 1.5, color: "green" },
      ], totalUnits: 12
    },
  ],
};

// Difficulty scores carried over from the hardcoded config (majors.json omits them).
// Keyed by major ID, then course ID -> difficulty value.
const DIFFICULTY_SCORES = {
  econ_ba: {
    "ECON 1": 2.6, "ECON 2": 3.9, "ECON 10A": 4.2,
    "ECON 5": 3.2, "MATH 2A": 4.5, "MATH 2B": 4.5,
    "ECON 100B": 3.1, "ECON 101": 2.1, "ECON 140A": 3.0,
  },
  cs_bs: {
    "CMPSC 16": 3.5, "CMPSC 24": 3.8, "CMPSC 32": 3.7, "CMPSC 40": 4.0,
    "CMPSC 64": 3.6, "MATH 3A": 4.0, "MATH 3B": 4.2, "MATH 4A": 4.3,
    "CMPSC 130A": 4.2, "CMPSC 138": 3.8, "CMPSC 148": 3.9, "CMPSC 154": 4.0,
  },
  bio_bs: {
    "EEMB 2": 3.0, "CHEM 1A": 4.2, "MATH 3A": 4.0,
    "CHEM 1B": 4.0, "MCDB 1A": 3.8, "MATH 3B": 4.2,
    "CHEM 1C": 4.1, "CHEM 6A": 4.4, "EEMB 101": 3.5,
    "EEMB 102": 3.6, "EEMB 110": 3.7, "EEMB 136": 3.5, "EEMB 145": 3.8,
  },
  comm_ba: {
    "COMM 1": 2.0, "COMM 88": 2.5, "COMM 87": 2.8, "COMM 2": 2.6,
    "COMM 100": 3.0, "COMM 105": 2.5, "COMM 115": 2.8,
  },
  soc_ba: {
    "SOC 1": 2.1, "SOC 3": 2.3, "SOC 10": 3.2, "SOC 13": 2.8,
    "SOC 100A": 3.0, "SOC 100B": 3.1, "SOC 117": 3.4,
  },
  psych_bs: {
    "PSY 1": 2.2, "PSY 2": 2.4, "PSY 5": 3.3, "PSY 99": 3.0,
    "PSY 101A": 3.5, "PSY 115": 3.4, "PSY 150": 3.8,
  },
  chem_bs: {
    "CHEM 1A": 4.2, "CHEM 1B": 4.0, "CHEM 6A": 4.4, "CHEM 6B": 4.3,
    "CHEM 1C": 4.1, "CHEM 6C": 4.2, "MATH 3A": 4.0, "MATH 3B": 4.2,
    "CHEM 109A": 4.3, "CHEM 110A": 4.5, "CHEM 110B": 4.4, "CHEM 130A": 4.0, "CHEM 130B": 3.9,
  },
  me_bs: {
    "ME 10": 2.5, "MATH 3A": 4.0, "MATH 3B": 4.2, "ECE 15": 3.6,
    "ME 6": 3.2, "MATH 3C": 3.8, "MATH 4A": 4.3, "ME 100": 4.2,
    "ME 101": 4.0, "ME 104": 3.9, "ME 115": 4.1, "ME 130": 4.0, "ME 155": 3.8, "ME 156": 3.9,
  },
  ee_bs: {
    "ECE 1": 2.8, "ECE 15": 3.6, "ECE 65": 4.0, "MATH 3A": 4.0, "MATH 3B": 4.2,
    "MATH 3C": 3.8, "MATH 4A": 4.3, "ECE 2": 3.8,
    "ECE 100": 4.3, "ECE 101A": 4.2, "ECE 152A": 4.0, "ECE 154": 4.4, "ECE 168": 4.5,
  },
  stats_bs: {
    "PSTAT 10": 2.8, "PSTAT 120A": 4.0, "PSTAT 120B": 4.2, "MATH 3A": 4.0, "MATH 3B": 4.2,
    "MATH 3C": 3.8, "PSTAT 126": 3.8, "PSTAT 127": 4.2, "PSTAT 128": 3.9,
    "PSTAT 130A": 4.4, "PSTAT 160A": 4.3,
  },
  film_ba: {
    "FLMST 1": 1.8, "FLMST 20": 1.9, "FLMST 50": 2.0, "FLMST 95": 2.2,
    "FLMST 99": 2.1, "FLMST 100": 2.8, "FLMST 150": 2.5, "FLMST 155": 2.3,
  },
  envst_bs: {
    "ENV S 3": 2.2, "ENV S 15A": 3.0, "ENV S 40": 2.5, "ENV S 70": 2.6,
    "ENV S 95": 3.0, "ENV S 100": 2.8, "ENV S 101": 3.2, "ENV S 110": 3.0, "ENV S 130": 2.9,
  },
};

// Build MAJOR_CONFIGS by transforming majors.json (the audited source of truth).
// The transform mirrors the post-processing block in CompassDemo.jsx:
//   - requirements come from majors.json sections (richer, audited data)
//   - prereqEdges are derived from the sections' prereqs arrays
//   - defaultQuarterPlan is supplied from QUARTER_PLANS above (not in majors.json)
//   - difficulty scores are carried over from DIFFICULTY_SCORES above (not in majors.json)
export const MAJOR_CONFIGS = {};

const { _meta, ...majors } = MAJORS_DATA;
for (const [id, majorData] of Object.entries(majors)) {
  const difficultyMap = DIFFICULTY_SCORES[id] ?? {};
  const requirements = {};
  const prereqEdges = [];

  for (const [sectionKey, section] of Object.entries(majorData.sections)) {
    const courses = section.courses.map(({ prereqs, prereqText, ...rest }) => ({
      ...rest,
      status: 'not_started',
      ...(difficultyMap[rest.id] != null ? { difficulty: difficultyMap[rest.id] } : {}),
    }));

    const totalUnits = section.required != null
      ? section.required * (section.courses[0]?.units ?? 4)
      : section.courses.reduce((sum, c) => sum + (c.units ?? 4), 0);

    requirements[sectionKey] = {
      name: section.name,
      units: totalUnits,
      courses,
      ...(section.required != null ? { required: section.required } : {}),
    };

    for (const course of section.courses) {
      for (const prereqId of course.prereqs ?? []) {
        prereqEdges.push({ from: prereqId, to: course.id });
      }
    }
  }

  MAJOR_CONFIGS[id] = {
    name: majorData.name,
    browseDeptCodes: majorData.browseDeptCodes ?? [],
    requirements,
    prereqEdges,
    defaultQuarterPlan: QUARTER_PLANS[id] ?? [],
  };
}
