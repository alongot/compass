/**
 * Debug script to understand why CMPSC prereqs aren't being found
 */
import puppeteer from 'puppeteer';

const testCourses = ['MCDB 1B', 'CMPSC 16'];

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  for (const course of testCourses) {
    const url = `https://catalog.ucsb.edu/courses/${encodeURIComponent(course)}`;
    console.log(`\n=== ${course} ===`);
    console.log(`URL: ${url}`);

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    const result = await page.evaluate(() => {
      const bodyText = document.body.innerText;

      // Show relevant portion of text
      const prereqIdx = bodyText.indexOf('Prerequisite');
      if (prereqIdx >= 0) {
        console.log('Found "Prerequisite" at index', prereqIdx);
        const context = bodyText.substring(prereqIdx, prereqIdx + 500);
        return {
          found: true,
          context,
          // Test both regex patterns
          oldPattern: bodyText.match(/Prerequisites?[:\s]+([^\n]+(?:\n(?![A-Z][a-z]+:)[^\n]+)*)/i),
          newPattern: bodyText.match(/Prerequisites?\s*\n([^\n]+(?:\n(?![A-Z][a-z]+[\s\n]|UC Santa)[^\n]+)*)/i)
        };
      }
      return {
        found: false,
        firstChars: bodyText.substring(0, 2000)
      };
    });

    console.log('Prerequisite found:', result.found);
    if (result.found) {
      console.log('\nContext around "Prerequisite":');
      console.log(JSON.stringify(result.context));
      console.log('\nOld pattern match:', result.oldPattern ? result.oldPattern[1]?.substring(0, 100) : 'NO MATCH');
      console.log('New pattern match:', result.newPattern ? result.newPattern[1]?.substring(0, 100) : 'NO MATCH');
    } else {
      console.log('First 2000 chars:', result.firstChars);
    }
  }

  await browser.close();
}

main().catch(console.error);
