// POLISH-06: Sidebar subtitle for transfer users
import { describe, it } from 'vitest';

describe('Sidebar transfer user subtitle (POLISH-06)', () => {
  it.todo('shows major name (Transfer to Computer Science B.S.) when currentUser is transfer and target_major_id is set');
  it.todo('shows Transfer Student when currentUser is transfer and target_major_id is null/undefined');
  it.todo('shows currentUser.major for non-transfer (UCSB) users');
  it.todo('does not render blank string for transfer users (regression)');
});
