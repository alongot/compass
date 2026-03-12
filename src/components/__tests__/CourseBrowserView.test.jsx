import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
// Will fail until Plan 04 implements pagination
import { CourseBrowserView } from '../CourseBrowserView.jsx';

// Minimal mock data: 25 courses in Supabase shape (as returned by useDeptCourses)
const makeCourse = (i) => ({
  course_id_clean: `ECON ${i}`,
  title: `Course ${i}`,
  description: '',
  units_fixed: 4,
  units_variable_low: null,
  dept_code: 'ECON',
});
const COURSES = Array.from({ length: 25 }, (_, i) => makeCourse(i + 1));

// Mock the useDeptCourses hook so CourseBrowserView gets deterministic data
vi.mock('../../hooks/useDeptCourses.js', () => ({
  useDeptCourses: () => ({ courses: COURSES, loading: false, error: null }),
}));

// Mock other dependencies to avoid Supabase/complex imports
vi.mock('../../data/demo/catalogDescriptions.js', () => ({
  getCatalogDescriptions: () => ({}),
}));

vi.mock('../../data/demo/majorConfigs.js', () => ({
  MAJOR_CONFIGS: {
    cs_bs: {
      name: 'Computer Science BS',
      browseDeptCodes: ['CMPSC'],
      requirements: { core: { name: 'Core', courses: [] } },
      defaultQuarterPlan: [],
    },
    econ_ba: {
      name: 'Economics BA',
      browseDeptCodes: ['ECON'],
      requirements: { core: { name: 'Core', courses: [] } },
      defaultQuarterPlan: [],
    },
  },
}));

vi.mock('../../utils/courseUtils.js', () => ({
  buildKnownCourses: () => [],
}));

vi.mock('../shared/DifficultyBadge.jsx', () => ({
  DifficultyBadge: () => null,
}));

vi.mock('../shared/StatusBadge.jsx', () => ({
  StatusBadge: () => null,
}));

describe('CourseBrowserView pagination (UI-03)', () => {
  it('renders at most 20 courses on the first page', () => {
    render(<CourseBrowserView majorId="cs_bs" />);
    const courseItems = screen.getAllByText(/Course \d+/);
    expect(courseItems.length).toBeLessThanOrEqual(20);
  });

  it('shows page navigation controls', () => {
    render(<CourseBrowserView majorId="cs_bs" />);
    expect(screen.getByText(/previous/i)).toBeInTheDocument();
    expect(screen.getByText(/next/i)).toBeInTheDocument();
    expect(screen.getByText(/page 1/i)).toBeInTheDocument();
  });

  it('navigates to next page and shows remaining courses', () => {
    render(<CourseBrowserView majorId="cs_bs" />);
    fireEvent.click(screen.getByText(/next/i));
    expect(screen.getByText(/page 2/i)).toBeInTheDocument();
  });
});
