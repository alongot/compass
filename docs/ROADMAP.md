## 🛠️ Project Roadmap: UCSB Academic Intelligence Platform

### Phase 1: Data Engineering & "Source of Truth"

Before building a UI, you must master the data. You shouldn't just scrape; you should use official channels where possible to ensure accuracy.

* [✅] **API Integration:** Register for the [UCSB API Developer Portal](https://developer.ucsb.edu/).
* [✅] Access the **Academic Curriculums v3.0** API for real-time class search, space availability, and finals.
* [✅] ~~Request access to the **Student Academic Programs** (Majors/Minors) endpoint.~~ Scraped 329 programs from catalog via Coursedog API.


* [✅] **Requirement Scraper:** Build a specialized scraper for the [UCSB General Catalog](https://catalog.ucsb.edu/).
* [ ] **Challenge:** Convert natural language prerequisites (e.g., *"MATH 3A with a C- or better"*) into a structured logical format (JSON).


* [ ] **Database Schema Design:** Create a relational database that links `Major` -> `Requirements` -> `Courses` -> `Prerequisites`.

---

### Phase 2: The "Assist.org" Bridge (Transfer Logic)

This is your most difficult technical hurdle because `assist.org` data is notoriously messy.

* [ ] **Agreement Extraction:**
* [ ] Scrape or download the `.txt` or PDF articulation agreements between UCSB and the top 10 California Community Colleges (CCCs).
* [ ] Use a PDF-parsing library (like `pdfminer` or an LLM-based parser) to map CC course codes to UCSB equivalents.


* [ ] **Transfer Credit Evaluator:** Build a tool where a student selects their CC, enters their completed classes, and the app "green-lights" the corresponding UCSB requirements.
* [ ] **Legal Review:** Review the `assist.org` Terms of Use. Since they prohibit commercial use of data extracts without permission, consider a "data-partnership" request early on.

---

### Phase 3: The "Degree Auditor" Engine

The core "intelligence" of your app.

* [ ] **Audit Logic:** Build an engine that takes a student's "Completed Courses" and overlays them against their "Major Requirements."
* [ ] **"What-If" Feature:** Allow students to instantly see how their progress changes if they switch from, say, *Econ* to *Comms*.
* [ ] **Prerequisite Tree Visualizer:** Create a visual "map" of classes so students can see how taking a class in Fall 2026 unlocks 3 more in Spring 2027.

---

### Phase 4: User Experience & Scale

* [ ] **UCSB NetID Integration (Optional):** If you go the B2B route, you'll need to work with UCSB IT for Single Sign-On (SSO).
* [ ] **Frontend Development:** Build a dashboard using a modern framework (React/Next.js).
* [ ] **The "Waitroom" Re-integration:** Keep your original idea! A student uses your app to see they are 60% done, then clicks "Book Advisor" and sends their auto-generated "Progress Report" to the advisor.
* [ ] **Scaling Playbook:** Create a "Data Template." Once you have the UCSB structure perfected, use the same template to ingest data from UCLA or UC Berkeley.

### From the POV of a User

    1. User creates a profile
        - Compass asks questions such as "What instituion are you enrolled in?", giving options for CC's and UCSB (for now)
        - Additional questions include "What major are you?"/"What major do you want to transfer for?"
        - Compass takes the data that it knows for the school and major, and loads it into the user's profile
        - Compass then asks for the current progress of the student and creates a roadmap for the user
    2. The roadmap is generated using the most optimal combination of classes for each quarter, based on the rating for each course based on professor (DailyNexus course )
    3. The user updates their own profile and Compass updates the progress of the student, including % completed for their transfer/graduation, GPA, etc.

## 💡 How to Separate from the Competition

| The "Old" Way (DARS / GOLD) | Your "New" Way |
| --- | --- |
| **Static:** Hard to read text-based reports. | **Visual:** Interactive charts and progress bars. |
| **Reactive:** You check it when you're worried. | **Proactive:** Notifies you if a required class is offered next quarter. |
| **Institutional:** Only shows your current school. | **Cross-Institutional:** Pulls in `assist.org` and CC data. |
| **Desktop-only:** Often clunky on mobile. | **Mobile-First:** Easy to check while walking to class. |

## UI Ideas
    - Duolingo style (without the stupid bird)
    - Progress bar for entire academic career
        - If major is selected, show % progress towards completing major. If major not selected, show "Undetermined".
        - Show summary stats like GPA, units completed, units per quarter, and time in class per quarter.
    - Keep UI simple and engaging, while also showing all necessary information
    - Show map that shows current progress (in green) and future progress (in gray) [✅]

# UI Features to Add
    - Add an option for when the quarter is over for the user to input grades then add new classes for the next quarter.