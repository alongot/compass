// TRANSFER-03: mapCcCoursesToUcsbRequirements(checkedCcCourses, articulations, majorRequirements) -> string[]
// CC-02/CC-03: calculateIgetcProgress(completedCcCourses, igetcMappings) -> Set<string>
import { describe, it, expect } from 'vitest';
import { mapCcCoursesToUcsbRequirements, calculateIgetcProgress } from '../../utils/transferUtils.js';

const mockArticulations = [
  {
    source_course_code: 'MATH 150',
    source_course_title: 'Calculus I',
    source_units: 4,
    articulation_type: 'equivalent',
    target_course: { course_id_clean: 'MATH 3A' },
  },
  {
    source_course_code: 'ECON 100',
    source_course_title: 'Intro Microeconomics',
    source_units: 3,
    articulation_type: 'equivalent',
    target_course: { course_id_clean: 'ECON 1' },
  },
];

const mockRequirements = {
  core_math: {
    label: 'Math Core',
    courses: [{ id: 'MATH 3A', name: 'Calculus I', units: 4 }],
  },
  core_econ: {
    label: 'Economics Core',
    courses: [{ id: 'ECON 1', name: 'Intro Microeconomics', units: 4 }],
  },
};

describe('mapCcCoursesToUcsbRequirements (TRANSFER-03)', () => {
  it('maps one CC course to a satisfied UCSB requirement', () => {
    const result = mapCcCoursesToUcsbRequirements(['MATH 150'], mockArticulations, mockRequirements);
    expect(result).toEqual(['MATH 3A']);
  });

  it('returns empty array when no CC courses are checked', () => {
    const result = mapCcCoursesToUcsbRequirements([], mockArticulations, mockRequirements);
    expect(result).toEqual([]);
  });

  it('ignores CC course with no articulation entry', () => {
    const result = mapCcCoursesToUcsbRequirements(['CS 999'], mockArticulations, mockRequirements);
    expect(result).toEqual([]);
  });

  it('returns multiple when multiple checked', () => {
    const result = mapCcCoursesToUcsbRequirements(
      ['MATH 150', 'ECON 100'],
      mockArticulations,
      mockRequirements
    );
    expect(result).toEqual(expect.arrayContaining(['MATH 3A', 'ECON 1']));
    expect(result).toHaveLength(2);
  });
});

const mockIgetcMappings = [
  { source_course_code: 'ENG 110', igetc_area: '1A' },
  { source_course_code: 'PHIL 105', igetc_area: '1B' },
  { source_course_code: 'MATH 150', igetc_area: '2' },
  { source_course_code: 'BIOL 100', igetc_area: '5B' },
];

describe('calculateIgetcProgress (CC-02/CC-03)', () => {
  it('returns empty Set when no completed courses', () => {
    const result = calculateIgetcProgress([], mockIgetcMappings);
    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(0);
  });

  it('returns empty Set when mappings are empty', () => {
    const result = calculateIgetcProgress(['ENG 110'], []);
    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(0);
  });

  it('returns Set containing matched area when one course matches', () => {
    const result = calculateIgetcProgress(['ENG 110'], mockIgetcMappings);
    expect(result).toBeInstanceOf(Set);
    expect(result.has('1A')).toBe(true);
    expect(result.size).toBe(1);
  });

  it('returns Set with both matched areas when two courses match', () => {
    const result = calculateIgetcProgress(['ENG 110', 'MATH 150'], mockIgetcMappings);
    expect(result.has('1A')).toBe(true);
    expect(result.has('2')).toBe(true);
    expect(result.size).toBe(2);
  });

  it('does NOT match when case differs (case-sensitive)', () => {
    const result = calculateIgetcProgress(['eng 110'], mockIgetcMappings);
    expect(result.has('1A')).toBe(false);
    expect(result.size).toBe(0);
  });

  it('silently ignores courses not in igetcMappings', () => {
    const result = calculateIgetcProgress(['CS 999'], mockIgetcMappings);
    expect(result.size).toBe(0);
  });

  it('handles multiple areas from multiple courses', () => {
    const result = calculateIgetcProgress(
      ['ENG 110', 'PHIL 105', 'MATH 150', 'BIOL 100'],
      mockIgetcMappings
    );
    expect(result.has('1A')).toBe(true);
    expect(result.has('1B')).toBe(true);
    expect(result.has('2')).toBe(true);
    expect(result.has('5B')).toBe(true);
    expect(result.size).toBe(4);
  });
});
