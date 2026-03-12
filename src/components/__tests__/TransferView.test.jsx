// TRANSFER-03: TransferView -- CC selector + course checklist + requirements result panel
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TransferView } from '../TransferView.jsx';

vi.mock('../../hooks/useArticulations.js', () => ({
  useInstitutions: () => ({ institutions: [{ id: 'inst-1', name: 'Santa Barbara City College', short_name: 'SBCC' }], loading: false }),
  useArticulations: () => ({ articulations: [], loading: false }),
}));

vi.mock('../../utils/transferUtils.js', () => ({
  mapCcCoursesToUcsbRequirements: () => [],
}));

describe('TransferView (TRANSFER-03)', () => {
  it('renders CC selector dropdown', () => {
    render(<TransferView majorRequirements={{}} />);
    expect(screen.getByRole('combobox')).toBeTruthy();
  });

  it('renders placeholder message when no CC selected', () => {
    render(<TransferView majorRequirements={{}} />);
    expect(screen.getByText('Select a community college above.')).toBeTruthy();
  });
});
