// CC-01: ProfileWizard transfer student type and field saving
import { describe, it } from 'vitest';

describe('ProfileWizard (CC Transfer)', () => {
  it.todo('renders student type choice (UCSB Student / CC Transfer Student) at step 1');
  it.todo('selecting CC Transfer Student and completing wizard saves student_type: "transfer" on user');
  it.todo('transfer path step 2 shows CC dropdown and target major dropdown');
  it.todo('transfer path step 3 shows CC course autocomplete sourced from articulation data');
  it.todo('transfer path calls onComplete with source_institution_id UUID and target_major_id');
});

describe('ProfileWizard handleTransferComplete (POLISH-01)', () => {
  it.todo('does not call onComplete when fetch response is not ok (res.ok === false)');
  it.todo('calls onComplete with user object when fetch succeeds (res.ok === true)');
  it.todo('logs error and returns early when server returns non-2xx status');
});
