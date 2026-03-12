/**
 * Test script to compare page structures between departments
 */
import puppeteer from 'puppeteer';

const testCourses = [
  'CMPSC 16',   // Should have prereqs (CMPSC 8)
  'CMPSC 24',   // Should have prereqs
  'ECON 10A',   // Should have prereqs (math)
  'ECON 100A',  // Should have prereqs
];

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  for (const course of testCourses) {
    const url = `https://catalog.ucsb.edu/courses/${encodeURIComponent(course)}`;
    console.log(`\n=== ${course} ===`);
    console.log(`URL: ${url}`);

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Get the page HTML
      const html = await page.content();

      // Get body text
      const bodyText = await page.evaluate(() => document.body.innerText);

      // Check for prerequisite patterns
      console.log('\n--- Body Text (first 3000 chars) ---');
      console.log(bodyText.substring(0, 3000));

      // Search for prereq patterns
      console.log('\n--- Prerequisite Search ---');
      const prereqPatterns = [
        /Prerequisites?[:\s]+([^\n]+)/gi,
        /Enrollment Requirements[:\s]+([^\n]+)/gi,
        /Required[:\s]+([^\n]+)/gi,
        /Pre-req[:\s]+([^\n]+)/gi
      ];

      for (const pattern of prereqPatterns) {
        const matches = bodyText.match(pattern);
        if (matches) {
          console.log(`Pattern: ${pattern}`);
          console.log(`Matches: ${JSON.stringify(matches)}`);
        }
      }

    } catch (error) {
      console.log(`ERROR: ${error.message}`);
    }
  }

  await browser.close();
}

main().catch(console.error);
