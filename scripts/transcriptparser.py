"""
UCSB Unofficial Transcript PDF Parser
"""

import re
import sys
import json
import pdfplumber


def extract_lines(pdf_path):
    all_lines = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                all_lines.extend(text.split("\n"))
    return all_lines


def parse_transcript(pdf_path):
    lines = extract_lines(pdf_path)

    student_name = ""
    perm_number = ""
    major = ""

    for i, line in enumerate(lines):
        if line.strip() == "Unofficial Transcript":
            if i + 1 < len(lines):
                student_name = lines[i + 1].strip()
        if "Perm Number:" in line:
            perm_number = line.split("Perm Number:")[-1].strip()
        m = re.match(r"L&S/\s*(BS|BA|AB)/\s*(.+)", line.strip())
        if m:
            major = m.group(2).strip()

    PASSING_LETTER = {"A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-"}
    PASS_NP = {"P"}
    FAILING_GRADES = {"F", "NP"}
    WITHDRAWN_GRADES = {"W"}

    completed_courses = []
    failed_courses = []
    in_progress_courses = []
    withdrawn_courses = []
    current_quarter = ""

    data_with_grade = re.compile(
        r'^(A\+|A-?|B\+|B-?|C\+|C-?|D\+|D-?|F|NP|P|W)\s+'
        r'(?:(\d{4,6})\s+)?'
        r'(\d+\.?\d*)\s+'
        r'(\d+\.?\d*)\s+'
        r'(\d+\.?\d*)\s+'
        r'(\d+\.?\d*)'
        r'(.*)$'
    )

    single_line_course = re.compile(
        r'^([A-Z].*?)\s+'
        r'(A\+|A-?|B\+|B-?|C\+|C-?|D\+|D-?|F|NP|P|W)\s+'
        r'(\d{4,6})\s+'
        r'(\d+\.?\d*)\s+'
        r'(\d+\.?\d*)\s+'
        r'(\d+\.?\d*)\s+'
        r'(\d+\.?\d*)'
        r'(.*)$'
    )

    data_no_grade = re.compile(
        r'^(\d{4,6})\s+'
        r'(\d+\.?\d*)\s+'
        r'(\d+\.?\d*)\s+'
        r'(\d+\.?\d*)\s+'
        r'(\d+\.?\d*)\s*$'
    )

    quarter_pattern = re.compile(r'^(Fall|Winter|Spring|Summer)\s+(\d{4})')

    skip_keywords = [
        "Quarter Total", "Cumulative Total", "Dean's Honors",
        "Course Grade", "Att Comp GPA", "Unit Unit Unit",
        "Unofficial Transcript", "Print this", "Close this",
        "University of California", "Perm Number",
        "College/ Objective", "L&S/", "Transfer Work",
        "UC & Transfer", "Other institutions", "Institution Name",
        "Term Range", "Advanced Placement", "https://",
        "Points Additional", "(Undergrad)", "Printable Version",
    ]

    def should_skip(line):
        return any(kw in line for kw in skip_keywords)

    def looks_like_course_start(line):
        m = re.match(r'^([A-Z]{1,7}(?:\s[A-Z]{1,7})*)\s+(\d)', line)
        if not m:
            return False
        dept = m.group(1)
        for word in dept.split():
            if len(word) > 7:
                return False
        return True

    def is_name_tail(line):
        s = line.strip()
        if not s:
            return False
        if should_skip(s):
            return False
        if quarter_pattern.match(s):
            return False
        if data_with_grade.match(s) or data_no_grade.match(s):
            return False
        if looks_like_course_start(s):
            return False
        return bool(re.match(r'^[A-Za-z\s:&/\d]+$', s)) and len(s) < 40

    def is_gpa_line(line):
        return bool(re.match(r'^GPA\s+\d', line.strip()))

    def classify(record, grade):
        if grade in FAILING_GRADES:
            failed_courses.append(record)
        elif grade in WITHDRAWN_GRADES:
            withdrawn_courses.append(record)
        else:
            completed_courses.append(record)

    def clean_name(name):
        name = re.sub(r'\s+', ' ', name).strip()
        if '-' in name:
            name = name.split('-')[0].strip()
        return name

    i = 0
    while i < len(lines):
        line = lines[i].strip()

        if not line or re.match(r'^\d+/\d+', line) or should_skip(line) or is_gpa_line(line):
            i += 1
            continue

        qm = quarter_pattern.match(line)
        if qm:
            current_quarter = f"{qm.group(1)} {qm.group(2)}"
            i += 1
            continue

        if line == student_name:
            i += 1
            continue

        sm = single_line_course.match(line)
        if sm:
            course_name = sm.group(1).strip()
            grade = sm.group(2)
            att_units = float(sm.group(4))
            additional = sm.group(8).strip() if sm.group(8) else ""
            record = {
                "course": clean_name(course_name),
                "grade": grade,
                "units": att_units,
                "quarter": current_quarter,
            }
            if additional:
                record["note"] = additional
            classify(record, grade)
            i += 1
            continue

        if looks_like_course_start(line):
            name_part1 = line
            if i + 1 < len(lines):
                next_line = lines[i + 1].strip()

                dm = data_with_grade.match(next_line)
                if dm:
                    grade = dm.group(1)
                    att_units = float(dm.group(3))
                    additional = dm.group(7).strip() if dm.group(7) else ""
                    name_part2 = ""
                    if i + 2 < len(lines) and is_name_tail(lines[i + 2].strip()):
                        name_part2 = lines[i + 2].strip()
                        i += 3
                    else:
                        i += 2
                    full_name = f"{name_part1} {name_part2}".strip()
                    record = {
                        "course": clean_name(full_name),
                        "grade": grade,
                        "units": att_units,
                        "quarter": current_quarter,
                    }
                    if additional:
                        record["note"] = additional
                    classify(record, grade)
                    continue

                ip = data_no_grade.match(next_line)
                if ip:
                    att_units = float(ip.group(2))
                    name_part2 = ""
                    if i + 2 < len(lines) and is_name_tail(lines[i + 2].strip()):
                        name_part2 = lines[i + 2].strip()
                        i += 3
                    else:
                        i += 2
                    full_name = f"{name_part1} {name_part2}".strip()
                    in_progress_courses.append({
                        "course": clean_name(full_name),
                        "units": att_units,
                        "quarter": current_quarter,
                    })
                    continue

        i += 1

    return {
        "student_name": student_name,
        "perm_number": perm_number,
        "major": major,
        "completed": completed_courses,
        "failed": failed_courses,
        "withdrawn": withdrawn_courses,
        "in_progress": in_progress_courses,
        "summary": {
            "completed_count": len(completed_courses),
            "failed_count": len(failed_courses),
            "withdrawn_count": len(withdrawn_courses),
            "in_progress_count": len(in_progress_courses),
        }
    }


def print_report(data):
    print("=" * 75)
    print("  TRANSCRIPT SUMMARY")
    print("=" * 75)
    print(f"  Student:  {data['student_name']}")
    print(f"  Perm #:   {data['perm_number']}")
    print(f"  Major:    {data['major']}")
    print("-" * 75)

    print(f"\nCOMPLETED COURSES ({data['summary']['completed_count']})")
    print("-" * 75)
    print(f"  {'Grade':>5}  {'Units':>5}  {'Quarter':<16}  Course")
    print(f"  {'-----':>5}  {'-----':>5}  {'-------':<16}  {'------'}")
    for c in data["completed"]:
        note = f"  [{c['note']}]" if "note" in c else ""
        print(f"  {c['grade']:>5}  {c['units']:>5.1f}  {c['quarter']:<16}  {c['course']}{note}")

    if data["failed"]:
        print(f"\nFAILED / NOT PASSED ({data['summary']['failed_count']})")
        print("-" * 75)
        print(f"  {'Grade':>5}  {'Units':>5}  {'Quarter':<16}  Course")
        print(f"  {'-----':>5}  {'-----':>5}  {'-------':<16}  {'------'}")
        for c in data["failed"]:
            note = f"  [{c['note']}]" if "note" in c else ""
            print(f"  {c['grade']:>5}  {c['units']:>5.1f}  {c['quarter']:<16}  {c['course']}{note}")

    if data["withdrawn"]:
        print(f"\nWITHDRAWN ({data['summary']['withdrawn_count']})")
        print("-" * 75)
        print(f"  {'Grade':>5}  {'Units':>5}  {'Quarter':<16}  Course")
        print(f"  {'-----':>5}  {'-----':>5}  {'-------':<16}  {'------'}")
        for c in data["withdrawn"]:
            print(f"  {'W':>5}  {c['units']:>5.1f}  {c['quarter']:<16}  {c['course']}")

    if data["in_progress"]:
        print(f"\nIN PROGRESS ({data['summary']['in_progress_count']})")
        print("-" * 75)
        print(f"  {'':>5}  {'Units':>5}  {'Quarter':<16}  Course")
        print(f"  {'':>5}  {'-----':>5}  {'-------':<16}  {'------'}")
        for c in data["in_progress"]:
            print(f"  {'--':>5}  {c['units']:>5.1f}  {c['quarter']:<16}  {c['course']}")

    print("\n" + "=" * 75)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python transcriptparser.py <path_to_transcript.pdf>")
        print("       python transcriptparser.py <path_to_transcript.pdf> --json")
        sys.exit(1)

    pdf_path = sys.argv[1]
    output_json = "--json" in sys.argv

    data = parse_transcript(pdf_path)

    if output_json:
        print(json.dumps(data, indent=2))
    else:
        print_report(data)

