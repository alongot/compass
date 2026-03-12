/**
 * Explore the UCSB Catalog programs page structure
 */
import puppeteer from 'puppeteer';

async function main() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1280, height: 800 });

  // Visit the programs page
  console.log('\n=== Visiting Programs Page ===');
  await page.goto('https://catalog.ucsb.edu/programs', { waitUntil: 'networkidle2', timeout: 30000 });

  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('Page text (first 3000 chars):');
  console.log(bodyText.substring(0, 3000));

  // Look for program links
  console.log('\n=== Looking for Program Links ===');
  const links = await page.evaluate(() => {
    const anchors = document.querySelectorAll('a');
    const programLinks = [];
    anchors.forEach(a => {
      const href = a.href;
      const text = a.innerText.trim();
      if (href.includes('/program/') || href.includes('/programs/')) {
        programLinks.push({ text, href });
      }
    });
    return programLinks.slice(0, 30); // First 30
  });

  console.log(`Found ${links.length} program links (showing first 30):`);
  links.forEach(l => console.log(`  - ${l.text}: ${l.href}`));

  // Get ALL program links by paginating
  console.log('\n=== Getting All Program Links ===');
  let allPrograms = [];

  // First, let's see if we can get all programs at once by checking the page structure
  const pageCount = await page.evaluate(() => {
    const paginationLinks = document.querySelectorAll('a');
    let maxPage = 1;
    paginationLinks.forEach(a => {
      const text = a.innerText.trim();
      const num = parseInt(text);
      if (!isNaN(num) && num > maxPage) maxPage = num;
    });
    return maxPage;
  });
  console.log(`Found ${pageCount} pages of programs`);

  // Visit Computer Science specifically
  console.log('\n=== Visiting Computer Science BS Page ===');
  await page.goto('https://catalog.ucsb.edu/programs/BSCMPSC', { waitUntil: 'networkidle2', timeout: 30000 });

  const csText = await page.evaluate(() => document.body.innerText);
  console.log('CS Program page text:');
  console.log(csText);

  // Check for any requirement links or sections
  console.log('\n=== Looking for Requirement Links ===');
  const reqLinks = await page.evaluate(() => {
    const anchors = document.querySelectorAll('a');
    const links = [];
    anchors.forEach(a => {
      const href = a.href || '';
      const text = a.innerText.trim();
      if (href.includes('.pdf') || text.toLowerCase().includes('requirement')) {
        links.push({ text, href });
      }
    });
    return links;
  });
  console.log('Requirement/PDF links:');
  reqLinks.forEach(l => console.log(`  - ${l.text}: ${l.href}`));

  await browser.close();
}

main().catch(console.error);
