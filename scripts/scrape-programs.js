/**
 * Scrape all programs (majors/minors) from UCSB Catalog
 * Uses the Coursedog API that powers the catalog
 */
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');

  // Collect all API responses
  const allPrograms = [];
  const seenIds = new Set();

  page.on('response', async response => {
    const url = response.url();
    if (url.includes('app.coursedog.com') && url.includes('programs/search')) {
      try {
        const json = await response.json();
        if (json.data && Array.isArray(json.data)) {
          for (const program of json.data) {
            if (!seenIds.has(program.id)) {
              seenIds.add(program.id);
              allPrograms.push(program);
            }
          }
          console.log(`  -> Captured ${json.data.length} programs (${allPrograms.length} total unique)`);
        }
      } catch (e) {
        // Ignore non-JSON responses
      }
    }
  });

  // Fetch all pages (catalog shows ~329 programs, 20 per page = 17 pages)
  console.log('\n=== Fetching All Program Pages ===');
  const maxPages = 18;

  for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
    const url = pageNum === 1
      ? 'https://catalog.ucsb.edu/programs'
      : `https://catalog.ucsb.edu/programs?page=${pageNum}`;

    console.log(`Fetching page ${pageNum}/${maxPages}...`);

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Check for CAPTCHA
      const bodyText = await page.evaluate(() => document.body.innerText);
      if (bodyText.includes('confirm you are human') || bodyText.includes("Let's confirm")) {
        console.log('CAPTCHA detected! Waiting 60s...');
        await new Promise(r => setTimeout(r, 60000));
        pageNum--; // Retry same page
        continue;
      }

      // Wait for data to load
      await new Promise(r => setTimeout(r, 2000));

    } catch (error) {
      console.log(`  Error: ${error.message}`);
    }

    // Delay between pages
    await new Promise(r => setTimeout(r, 1000 + Math.random() * 500));
  }

  await browser.close();

  console.log(`\n=== Results ===`);
  console.log(`Total unique programs: ${allPrograms.length}`);

  // Save results
  const outputPath = path.join('src', 'data', 'datasets', 'programs.json');
  fs.writeFileSync(outputPath, JSON.stringify(allPrograms, null, 2));
  console.log(`Saved to: ${outputPath}`);

  // Summary by type
  const byType = {};
  allPrograms.forEach(p => {
    const type = p.type || 'Unknown';
    byType[type] = (byType[type] || 0) + 1;
  });

  console.log('\n=== By Degree Type ===');
  Object.entries(byType).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });

  // Summary by level
  const byLevel = {};
  allPrograms.forEach(p => {
    const level = p.level || 'Unknown';
    byLevel[level] = (byLevel[level] || 0) + 1;
  });

  console.log('\n=== By Level ===');
  Object.entries(byLevel).sort((a, b) => b[1] - a[1]).forEach(([level, count]) => {
    console.log(`  ${level}: ${count}`);
  });
}

main().catch(console.error);
