import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const COMPONENTS_DIR = join(process.cwd(), 'src/components');
const HEX_PATTERN = /#[0-9a-fA-F]{3,6}(?![0-9a-fA-F])/g;
// Allow hardcoded hex only in StatusBadge and DifficultyBadge (per Phase 1 decision)
const ALLOWED_FILES = ['StatusBadge.jsx', 'DifficultyBadge.jsx'];

function getJsxFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return getJsxFiles(full);
    if (entry.name.endsWith('.jsx') || entry.name.endsWith('.js')) return [full];
    return [];
  });
}

describe('theme usage (UI-01)', () => {
  it('view components do not contain raw hex color values outside allowed exceptions', () => {
    const files = getJsxFiles(COMPONENTS_DIR).filter(f =>
      !ALLOWED_FILES.some(allowed => f.endsWith(allowed)) &&
      !f.includes('__tests__')
    );
    const violations = [];
    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      const matches = content.match(HEX_PATTERN) || [];
      if (matches.length > 0) {
        violations.push({ file: file.replace(process.cwd(), ''), matches });
      }
    }
    expect(violations, `Files with hardcoded hex: ${JSON.stringify(violations, null, 2)}`).toHaveLength(0);
  });
});
