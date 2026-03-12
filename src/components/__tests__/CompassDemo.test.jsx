import { describe, it, expect } from 'vitest';

// Pure function test — extracted from the handler pattern
// Tests the data transformation logic independently of React state

function handleEndQuarterLogic(user, gradeMap, nextCourseIds, knownCourses) {
  const updated = structuredClone(user);
  if (!updated.transcript) updated.transcript = { completed: [], in_progress: [] };

  for (const [courseId, grade] of Object.entries(gradeMap)) {
    updated.transcript.in_progress = updated.transcript.in_progress.filter(
      c => c.course !== courseId
    );
    if (!updated.transcript.completed.some(c => c.course === courseId)) {
      const known = knownCourses.find(k => k.id === courseId);
      updated.transcript.completed.push({ course: courseId, grade, units: known?.units || 4 });
    }
  }

  for (const courseId of nextCourseIds) {
    if (!updated.transcript.in_progress.some(c => c.course === courseId)) {
      const known = knownCourses.find(k => k.id === courseId);
      updated.transcript.in_progress.push({ course: courseId, units: known?.units || 4 });
    }
  }

  return updated;
}

describe('handleEndQuarter bulk logic (UI-02)', () => {
  const baseUser = {
    transcript: {
      completed: [],
      in_progress: [
        { course: 'CMPSC 16', units: 4 },
        { course: 'MATH 3A', units: 4 },
      ],
    },
  };
  const knownCourses = [
    { id: 'CMPSC 16', units: 4 },
    { id: 'MATH 3A', units: 4 },
    { id: 'CMPSC 24', units: 4 },
  ];

  it('moves in-progress courses to completed with correct grades', () => {
    const result = handleEndQuarterLogic(
      baseUser,
      { 'CMPSC 16': 'A', 'MATH 3A': 'B+' },
      [],
      knownCourses
    );
    expect(result.transcript.completed).toHaveLength(2);
    expect(result.transcript.completed.find(c => c.course === 'CMPSC 16').grade).toBe('A');
    expect(result.transcript.completed.find(c => c.course === 'MATH 3A').grade).toBe('B+');
    expect(result.transcript.in_progress).toHaveLength(0);
  });

  it('enrolls next quarter courses in in_progress', () => {
    const result = handleEndQuarterLogic(
      baseUser,
      { 'CMPSC 16': 'A', 'MATH 3A': 'B+' },
      ['CMPSC 24'],
      knownCourses
    );
    expect(result.transcript.in_progress).toHaveLength(1);
    expect(result.transcript.in_progress[0].course).toBe('CMPSC 24');
  });

  it('does not duplicate a course already in completed', () => {
    const userWithCompleted = {
      transcript: {
        completed: [{ course: 'CMPSC 16', grade: 'A', units: 4 }],
        in_progress: [{ course: 'CMPSC 16', units: 4 }],
      },
    };
    const result = handleEndQuarterLogic(userWithCompleted, { 'CMPSC 16': 'A+' }, [], knownCourses);
    expect(result.transcript.completed.filter(c => c.course === 'CMPSC 16')).toHaveLength(1);
  });

  it('does not duplicate next-quarter courses already in in_progress', () => {
    const result = handleEndQuarterLogic(
      { transcript: { completed: [], in_progress: [{ course: 'CMPSC 24', units: 4 }] } },
      {},
      ['CMPSC 24'],
      knownCourses
    );
    expect(result.transcript.in_progress.filter(c => c.course === 'CMPSC 24')).toHaveLength(1);
  });
});
