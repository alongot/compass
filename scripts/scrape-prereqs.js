/**
 * Scrape prerequisites from UCSB Catalog using Puppeteer
 * Uses course codes from API data
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const CATALOG_BASE = 'https://catalog.ucsb.edu/courses';

// Read API courses
const apiCoursesPath = path.join('src', 'data', 'datasets', 'api-courses.json');
const apiCourses = JSON.parse(fs.readFileSync(apiCoursesPath, 'utf-8'));

console.log(`Loaded ${apiCourses.length} courses from API data\n`);

// Parse course ID to URL format (e.g., "ECON      1  " -> "ECON 1")
function formatCourseId(courseId) {
  return courseId.trim().replace(/\s+/g, ' ');
}

// Build catalog URL
function getCatalogUrl(courseId) {
  const formatted = formatCourseId(courseId);
  return `${CATALOG_BASE}/${encodeURIComponent(formatted)}`;
}

async function scrapePrerequisites(page, courseId, retryCount = 0) {
  const url = getCatalogUrl(courseId);

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for content to load
    await page.waitForSelector('body', { timeout: 5000 });

    // Extract prerequisite text - look for common patterns
    const prereqData = await page.evaluate(() => {
      const bodyText = document.body.innerText;

      // Check for CAPTCHA/bot detection
      if (bodyText.includes('confirm you are human') || bodyText.includes('security check')) {
        return { captchaDetected: true };
      }

      // Check if page is 404
      if (bodyText.includes('404') && bodyText.includes('Page Not Found')) {
        return {
          prerequisites: '',
          advisoryComments: '',
          description: '',
          units: '',
          pageNotFound: true
        };
      }

      // Find prerequisites section - handle both newline and colon formats
      let prerequisites = '';
      const prereqMatch = bodyText.match(/Prerequisites?[:\s]+([^\n]+(?:\n(?![A-Z][a-z]+[\s:]|UC Santa)[^\n]+)*)/i);
      if (prereqMatch) {
        prerequisites = prereqMatch[1].trim();
      }

      // Look for advisory enrollment comments
      let advisoryComments = '';
      const advisoryMatch = bodyText.match(/Advisory Enrollment Comments?[:\s]+([^\n]+(?:\n(?![A-Z][a-z]+[\s:]|UC Santa)[^\n]+)*)/i);
      if (advisoryMatch) {
        advisoryComments = advisoryMatch[1].trim();
      }

      // Look for course description
      let description = '';
      const descMatch = bodyText.match(/Course Description[:\s]+([^\n]+(?:\n(?![A-Z][a-z]+[\s:]|Units)[^\n]+)*)/i);
      if (descMatch) {
        description = descMatch[1].trim();
      }

      // Find units
      const unitsMatch = bodyText.match(/Unit Value[:\s]+(\d+(?:\.\d+)?)/i);
      const units = unitsMatch ? unitsMatch[1] : '';

      return { prerequisites, advisoryComments, description, units, pageNotFound: false, captchaDetected: false };
    });

    // Handle CAPTCHA detection with retry
    if (prereqData.captchaDetected) {
      if (retryCount < 3) {
        console.log(`CAPTCHA detected, waiting 30s before retry ${retryCount + 1}/3...`);
        await new Promise(r => setTimeout(r, 30000));
        return scrapePrerequisites(page, courseId, retryCount + 1);
      }
      return {
        courseId: formatCourseId(courseId),
        url,
        prerequisites: '',
        advisoryComments: '',
        description: '',
        units: '',
        pageNotFound: false,
        error: 'CAPTCHA detected after 3 retries'
      };
    }

    return {
      courseId: formatCourseId(courseId),
      url,
      ...prereqData,
      error: null
    };

  } catch (error) {
    return {
      courseId: formatCourseId(courseId),
      url,
      prerequisites: '',
      advisoryComments: '',
      description: '',
      units: '',
      pageNotFound: false,
      error: error.message
    };
  }
}

async function main() {
  // Launch browser with more realistic settings
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const page = await browser.newPage();

  // Set user agent to look like a real browser
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');

  // Set a reasonable viewport
  await page.setViewport({ width: 1280, height: 800 });

  // Set extra headers
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
  });

  // Warm up - visit the main catalog page first to establish session
  console.log('Warming up by visiting catalog homepage...');
  await page.goto('https://catalog.ucsb.edu/courses', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000)); // Wait 3 seconds

  // Limit to first N courses for testing (null = all courses)
  const TEST_LIMIT = null; // Set to a number to limit, null for all
  const coursesToScrape = TEST_LIMIT ? apiCourses.slice(0, TEST_LIMIT) : apiCourses;

  // Check for existing partial results to resume from
  const partialPath = path.join('src', 'data', 'datasets', 'courses-with-prereqs-partial.json');
  let results = [];
  let startIndex = 0;

  if (fs.existsSync(partialPath)) {
    try {
      const partialData = JSON.parse(fs.readFileSync(partialPath, 'utf-8'));
      if (partialData.length > 0) {
        results = partialData;
        startIndex = partialData.length;
        console.log(`Resuming from ${startIndex} previously scraped courses...\n`);
      }
    } catch (e) {
      console.log('Could not load partial results, starting fresh.\n');
    }
  }

  console.log(`Scraping ${coursesToScrape.length - startIndex} remaining courses...\n`);

  for (let i = startIndex; i < coursesToScrape.length; i++) {
    const course = coursesToScrape[i];
    const courseId = course.courseId;

    process.stdout.write(`[${i + 1}/${coursesToScrape.length}] ${formatCourseId(courseId)}... `);

    const result = await scrapePrerequisites(page, courseId);

    if (result.error) {
      console.log(`ERROR: ${result.error}`);
    } else if (result.pageNotFound) {
      console.log('404 - Page not found');
    } else if (result.prerequisites) {
      console.log(`Prereqs: "${result.prerequisites.substring(0, 50)}..."`);
    } else if (result.advisoryComments) {
      console.log(`No prereqs (has advisory: "${result.advisoryComments.substring(0, 30)}...")`);
    } else {
      console.log('No prereqs or advisory');
    }

    // Merge with API data
    results.push({
      ...course,
      courseIdClean: formatCourseId(courseId),
      catalogUrl: result.url,
      prerequisitesText: result.prerequisites,
      advisoryComments: result.advisoryComments,
      pageNotFound: result.pageNotFound,
      scrapeError: result.error
    });

    // Longer delay between requests to avoid CAPTCHA (1.5-3 seconds random)
    const delay = 1500 + Math.random() * 1500;
    await new Promise(r => setTimeout(r, delay));

    // Save intermediate results every 50 courses
    if (results.length % 50 === 0) {
      const tempPath = path.join('src', 'data', 'datasets', 'courses-with-prereqs-partial.json');
      fs.writeFileSync(tempPath, JSON.stringify(results, null, 2));
      console.log(`\n[Saved ${results.length} courses to partial file]\n`);
    }
  }

  await browser.close();

  // Save results
  const outputPath = path.join('src', 'data', 'datasets', 'courses-with-prereqs.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nSaved to: ${outputPath}`);

  // Summary
  const withPrereqs = results.filter(r => r.prerequisitesText).length;
  const withAdvisory = results.filter(r => r.advisoryComments && !r.prerequisitesText).length;
  const notFound = results.filter(r => r.pageNotFound).length;
  const withErrors = results.filter(r => r.scrapeError).length;
  const noInfo = results.filter(r => !r.prerequisitesText && !r.advisoryComments && !r.pageNotFound && !r.scrapeError).length;

  console.log(`\n=== Summary ===`);
  console.log(`Total scraped: ${results.length}`);
  console.log(`With prerequisites: ${withPrereqs}`);
  console.log(`With advisory only (no prereqs): ${withAdvisory}`);
  console.log(`No prereqs or advisory: ${noInfo}`);
  console.log(`Page not found (404): ${notFound}`);
  console.log(`Errors: ${withErrors}`);

  // Summary by department
  console.log(`\n=== By Department ===`);
  const depts = [...new Set(results.map(r => r.deptCode.trim()))];
  for (const dept of depts) {
    const deptCourses = results.filter(r => r.deptCode.trim() === dept);
    const deptPrereqs = deptCourses.filter(r => r.prerequisitesText).length;
    console.log(`${dept}: ${deptPrereqs}/${deptCourses.length} with prereqs`);
  }
}

main().catch(console.error);
