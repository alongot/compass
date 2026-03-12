import courseCatalog from '../datasets/courses-with-prereqs.json';

const _catalog = {};
for (const c of courseCatalog) {
  if (c.courseIdClean && c.description) {
    _catalog[c.courseIdClean] = c.description.replace(/\s{2,}/g, ' ').trim();
  }
}

export function getCatalogDescriptions() { return _catalog; }
