import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
// Will fail until Plan 03 creates this file
import { EndQuarterModal } from '../EndQuarterModal.jsx';

const inProgressCourses = [
  { id: 'CMPSC 16', name: 'Problem Solving', units: 4 },
  { id: 'MATH 3A', name: 'Calculus', units: 4 },
];
const knownCourses = [
  { id: 'CMPSC 24', name: 'Data Structures', units: 4 },
  { id: 'MATH 3B', name: 'Calculus II', units: 4 },
];

describe('EndQuarterModal (UI-02)', () => {
  it('renders a grade selector for each in-progress course', () => {
    render(
      <EndQuarterModal
        inProgressCourses={inProgressCourses}
        knownCourses={knownCourses}
        onEndQuarter={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('CMPSC 16')).toBeInTheDocument();
    expect(screen.getByText('MATH 3A')).toBeInTheDocument();
    // Two grade selectors on step 1
    const selects = screen.getAllByRole('combobox');
    expect(selects).toHaveLength(2);
  });

  it('advances to step 2 (enrollment) after confirming grades', () => {
    render(
      <EndQuarterModal
        inProgressCourses={inProgressCourses}
        knownCourses={knownCourses}
        onEndQuarter={vi.fn()}
        onClose={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText(/confirm grades/i));
    // Step 2 should show enrollment options
    expect(screen.getByText(/next quarter/i)).toBeInTheDocument();
  });

  it('calls onEndQuarter with gradeMap and nextCourseIds on enroll', () => {
    const onEndQuarter = vi.fn();
    render(
      <EndQuarterModal
        inProgressCourses={inProgressCourses}
        knownCourses={knownCourses}
        onEndQuarter={onEndQuarter}
        onClose={vi.fn()}
      />
    );
    // Advance to step 2
    fireEvent.click(screen.getByText(/confirm grades/i));
    // Submit enrollment
    fireEvent.click(screen.getByText(/enroll/i));
    expect(onEndQuarter).toHaveBeenCalledOnce();
    const [gradeMap, nextCourseIds] = onEndQuarter.mock.calls[0];
    expect(gradeMap).toHaveProperty('CMPSC 16');
    expect(gradeMap).toHaveProperty('MATH 3A');
    expect(Array.isArray(nextCourseIds)).toBe(true);
  });

  it('closes modal on Escape key', () => {
    const onClose = vi.fn();
    render(
      <EndQuarterModal
        inProgressCourses={inProgressCourses}
        knownCourses={knownCourses}
        onEndQuarter={vi.fn()}
        onClose={onClose}
      />
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });
});
