// CC-04: TransferDashboardView three-card progress layout
// POLISH-02/03: CC course code visibility in major card
// POLISH-04: Target major change flow
// POLISH-05: UCSB transition flow
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TransferDashboardView } from '../TransferDashboardView.jsx';

// Mock hooks so the component renders without Supabase
vi.mock('../../hooks/useArticulations.js', () => ({
  useInstitutions: () => ({
    institutions: [{ id: 'inst-1', name: 'Santa Barbara City College', short_name: 'SBCC' }],
    loading: false,
  }),
  useArticulations: () => ({
    articulations: [
      {
        articulation_type: 'equivalent',
        source_course_code: 'MATH 3A',
        target_course: { course_id_clean: 'MATH 3A' },
      },
    ],
    loading: false,
  }),
}));

vi.mock('../../hooks/useIgetcMappings.js', () => ({
  useIgetcMappings: () => ({ mappings: [], loading: false }),
}));

vi.mock('../../utils/transferUtils.js', () => ({
  calculateIgetcProgress: () => new Set(),
  mapCcCoursesToUcsbRequirements: (completedCcCourses) =>
    completedCcCourses.includes('MATH 3A') ? ['MATH 3A'] : [],
}));

vi.mock('../../data/demo/majorConfigs.js', () => ({
  MAJOR_CONFIGS: {
    econ_ba: {
      name: 'Economics BA',
      requirements: {
        core: { courses: [{ id: 'MATH 3A', name: 'Calculus', units: 4 }] },
      },
    },
  },
}));

const mockUser = {
  id: 'user-1',
  name: 'Test Student',
  source_institution_id: 'inst-1',
  target_major_id: 'econ_ba',
  transcript: {
    completed: [{ course: 'MATH 3A', grade: 'A', units: 4 }],
    in_progress: [],
    failed: [],
    withdrawn: [],
  },
  quarter_plan: [],
};

describe('TransferDashboardView', () => {
  it.todo('renders three progress cards: unit progress, IGETC progress, major lower-div progress');
  it.todo('unit card shows completed + in-progress units toward 60');
  it.todo('IGETC card shows per-area rows with satisfied/pending status');
  it.todo('major card shows % of target major lower-div requirements satisfied');
});

describe('TransferDashboardView major card CC course pairing (POLISH-02/03)', () => {
  it('major card shows satisfying CC course code (source_course_code) next to each satisfied UCSB requirement', () => {
    render(<TransferDashboardView user={mockUser} knownCourses={[]} />);
    // Should show "via MATH 3A" text next to the satisfied MATH 3A requirement
    expect(screen.getByText('via MATH 3A')).toBeTruthy();
  });

  it('major card shows "Not satisfied" (no course code) for requirements with no articulation match', () => {
    const userNoMatch = {
      ...mockUser,
      transcript: {
        ...mockUser.transcript,
        completed: [],
      },
    };
    render(<TransferDashboardView user={userNoMatch} knownCourses={[]} />);
    expect(screen.getByText('Not satisfied')).toBeTruthy();
  });

  it('course pairing lookup finds correct articulation where articulation_type is equivalent and source_course_code is in completedCcCourses', () => {
    render(<TransferDashboardView user={mockUser} knownCourses={[]} />);
    // The requirement MATH 3A should be shown as Satisfied
    expect(screen.getByText('Satisfied')).toBeTruthy();
    // And the satisfying course code should appear
    expect(screen.getByText('via MATH 3A')).toBeTruthy();
  });
});

describe('TransferDashboardView target major change (POLISH-04)', () => {
  it('welcome header shows a "Change major" button', () => {
    render(<TransferDashboardView user={mockUser} knownCourses={[]} onUserUpdate={() => {}} />);
    expect(screen.getByRole('button', { name: /change major/i })).toBeTruthy();
  });

  it('clicking Change major reveals a select dropdown with major options', () => {
    render(<TransferDashboardView user={mockUser} knownCourses={[]} onUserUpdate={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /change major/i }));
    // After clicking, a major selector appears (there may be other selects for grades)
    const selects = screen.getAllByRole('combobox');
    const majorSelect = selects.find(s => s.querySelector('option[value="econ_ba"]'));
    expect(majorSelect).toBeTruthy();
  });

  it.todo('selecting a new major and confirming calls PUT /api/users/:id with target_major_id');
  it.todo('after successful PUT, onUserUpdate is called with the updated user object');
  it.todo('cancelling the edit hides the dropdown without API call');
});

describe('TransferDashboardView UCSB transition (POLISH-05)', () => {
  it('renders a "Ready to Transfer?" section with the transition button', () => {
    render(<TransferDashboardView user={mockUser} knownCourses={[]} onUserUpdate={() => {}} />);
    expect(screen.getByText(/ready to transfer/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /i've been admitted/i })).toBeTruthy();
  });

  it('clicking the transition button shows a confirmation modal', () => {
    render(<TransferDashboardView user={mockUser} knownCourses={[]} onUserUpdate={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /i've been admitted/i }));
    expect(screen.getByText(/switch to ucsb student mode/i)).toBeTruthy();
    expect(screen.getByText(/cannot be undone/i)).toBeTruthy();
  });

  it('modal shows the target major name', () => {
    render(<TransferDashboardView user={mockUser} knownCourses={[]} onUserUpdate={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /i've been admitted/i }));
    // Modal contains target major name (may appear multiple times across the page)
    expect(screen.getAllByText(/economics ba/i).length).toBeGreaterThan(0);
  });

  it.todo('confirming transition calls PUT /api/users/:id with student_type ucsb');
  it.todo('after successful PUT, onUserUpdate is called with the updated user');
});
