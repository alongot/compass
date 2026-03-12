# Demo Data

This folder contains corrected major requirement data for the 12 demo majors.
It is intentionally separate from the broader `/src/data/datasets/` pipeline data.

## Files

### `majors.json`
Corrected major configurations based on the 2024-2025 UCSB official major sheets.
See `docs/MAJOR_REQUIREMENTS_AUDIT.md` for the full audit that produced these corrections.

**Structure per major:**
```json
{
  "major_id": {
    "id": "major_id",
    "name": "Full Major Name",
    "degree": "B.A. or B.S.",
    "department": "Department name",
    "browseDeptCodes": ["DEPT"],
    "sections": {
      "sectionKey": {
        "name": "Section Display Name",
        "description": "Optional notes on requirements",
        "required": 7,        // optional: number of courses required (for elective sections)
        "courses": [
          {
            "id": "DEPT 1",
            "name": "Course Title",
            "units": 4,
            "prereqs": ["DEPT 0"],   // direct prerequisites (course IDs)
            "prereqText": "Raw catalog prerequisite text"
          }
        ]
      }
    }
  }
}
```

**Prerequisite notes:**
- `prereqs` lists only direct prerequisites (not transitive)
- `prereqText` is the raw text from the UCSB catalog for reference/verification
- For elective sections, `required` indicates how many courses must be completed
- For sections with no `required` field, all courses in the section are required

## Majors included

| ID | Name | Key Corrections from Previous Data |
|----|------|-------------------------------------|
| `econ_ba` | Economics B.A. | Roughly correct; minor tweaks |
| `cs_bs` | Computer Science B.S. | Fixed prep (MATH 4A/4B/6A/PSTAT 120A, removed MATH 3C/ECE 15); fixed upper required (130A/B) |
| `bio_bs` | Biological Sciences B.S. | Fixed upper div (no fixed required courses; 48-unit pools); fixed prep |
| `comm_ba` | Communication B.A. | Added COMM 89; removed COMM 2; no specific upper required |
| `soc_ba` | Sociology B.A. | Pre-major is SOC 1 + SOC 10 (not SOC 3); upper required is SOC 108 + SOC 185A |
| `psych_bs` | Psychological and Brain Sciences B.S. | Major overhaul: Area I/II/III structure; PSY 102/105/106/108 breadth |
| `chem_bs` | Chemistry B.S. | Fixed course numbers (CHEM 113A-C, 109A-B, added PHYS 7A-C, MATH 4A/4B/6A) |
| `me_bs` | Mechanical Engineering B.S. | Major overhaul: ME 14/15/16/17 lower div; ME 103/107/151A/151B/152A/153 upper div |
| `ee_bs` | Electrical Engineering B.S. | Major overhaul: ECE 3/5/6, ECE 130A/B/139, ECE 153A/B, ECE 188 |
| `stats_bs` | Statistics and Data Science B.S. | Fixed prep (MATH 4A/4B/6A, CMPSC 8/9); fixed upper required (PSTAT 120A/B/122/126) |
| `film_ba` | Film and Media Studies B.A. | Fixed prefix FLMST→FAMST; pre-major is FAMST 46/70/96 |
| `envst_bs` | Environmental Studies B.S. | Removed ENV S 15A (doesn't exist); added ENV S 1/2, sciences for B.S. |
