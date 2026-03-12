// TRANSFER-02: hook reads from Supabase, not a hardcoded local array
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

vi.mock('../../lib/supabase.js', () => ({
  supabase: { from: vi.fn() },
}));

import { supabase } from '../../lib/supabase.js';
import { useInstitutions, useArticulations } from '../../hooks/useArticulations.js';

const mockInstitutions = [
  { id: 'uuid-1', name: 'Santa Barbara City College', short_name: 'SBCC', assist_org_id: 'sbcc', city: 'Santa Barbara', state: 'CA' },
  { id: 'uuid-2', name: 'Ventura College', short_name: 'VC', assist_org_id: 'vc', city: 'Ventura', state: 'CA' },
];

const mockArticulationRows = [
  {
    source_course_code: 'MATH 150',
    source_course_title: 'Calculus I',
    source_units: 4,
    articulation_type: 'equivalent',
    notes: null,
    target_course: { course_id_clean: 'MATH 3A', title: 'Calculus I', units_fixed: 4 },
  },
  {
    source_course_code: 'ECON 100',
    source_course_title: 'Intro Microeconomics',
    source_units: 3,
    articulation_type: 'equivalent',
    notes: null,
    target_course: { course_id_clean: 'ECON 1', title: 'Intro Microeconomics', units_fixed: 4 },
  },
];

function buildChainMock(returnValue) {
  const chain = {
    select: vi.fn(),
    order: vi.fn(),
    eq: vi.fn(),
  };
  chain.select.mockReturnValue(chain);
  chain.order.mockReturnValue(Promise.resolve(returnValue));
  chain.eq.mockReturnValue(Promise.resolve(returnValue));
  supabase.from.mockReturnValue(chain);
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useInstitutions (TRANSFER-02)', () => {
  it('returns institutions array from Supabase', async () => {
    buildChainMock({ data: mockInstitutions, error: null });

    const { result } = renderHook(() => useInstitutions());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.institutions).toEqual(mockInstitutions);
    expect(result.current.error).toBeNull();
  });
});

describe('useArticulations (TRANSFER-02)', () => {
  it('returns articulations array for a given institution id', async () => {
    buildChainMock({ data: mockArticulationRows, error: null });

    const { result } = renderHook(() => useArticulations('uuid-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.articulations).toEqual(mockArticulationRows);
    expect(result.current.error).toBeNull();
  });

  it('returns empty array with loading=false when institutionId is null', () => {
    const { result } = renderHook(() => useArticulations(null));

    expect(result.current.articulations).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
