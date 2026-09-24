/**
 * Job Search Automation Script for Divesh S
 * ==========================================
 * This script scrapes job listings from multiple platforms and
 * cross-references with the company tracker CSV.
 * 
 * Usage: node job_search_scraper.mjs
 * 
 * Prerequisites:
 *   npm install axios cheerio csv-parser csv-writer
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import { createObjectCsvWriter } from 'csv-writer';
import csvParser from 'csv-parser';
import path from 'path';

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  // Your target keywords
  keywords: [
    'NestJS backend engineer',
    'Node.js software engineer',
    'Go Golang backend developer',
    'TypeScript backend engineer',
    'software engineer NestJS',
    'backend developer Node.js India',
    'SDE 1 backend',
    'software engineer microservices',
  ],

  // Salary filter (monthly INR)
  minSalaryMonthly: 35000,
  minSalaryLPA: 4.2,

  // Experience filter
  experienceYears: { min: 0, max: 3 },

  // Location preferences
  locations: ['Bangalore', 'Bengaluru', 'Chennai', 'Hyderabad', 'Pune', 'Mumbai', 'Delhi', 'Gurgaon', 'Remote', 'Coimbatore'],

  // Output path
  outputDir: process.cwd(),

  // Rate limiting (ms between requests)
  requestDelay: 2000,

  // User agent for requests
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

// ============================================
// TARGET COMPANIES (from your tracker)
// ============================================

const TARGET_COMPANIES = [
  // ★★★★★ TOP PRIORITY — Exact Stack Match
  { name: 'GoKwik', careersUrl: 'https://gokwik.co/careers', linkedIn: 'https://www.linkedin.com/company/gokwik/', type: 'Product', stackMatch: 5 },
  { name: 'Yellow.ai', careersUrl: 'https://yellow.ai/careers/', linkedIn: 'https://www.linkedin.com/company/yellowdotai/', type: 'Product', stackMatch: 5 },
  { name: 'CleverTap', careersUrl: 'https://clevertap.com/careers/', linkedIn: 'https://www.linkedin.com/company/clevertap/', type: 'Product', stackMatch: 5 },
  { name: 'Chargebee', careersUrl: 'https://www.chargebee.com/careers/', linkedIn: 'https://www.linkedin.com/company/chargebee/', type: 'Product', stackMatch: 4 },
  { name: 'Freshworks', careersUrl: 'https://www.freshworks.com/careers/', linkedIn: 'https://www.linkedin.com/company/freshworks/', type: 'Product', stackMatch: 4 },
  { name: 'Hasura', careersUrl: 'https://hasura.io/careers/', linkedIn: 'https://www.linkedin.com/company/hasura/', type: 'Product', stackMatch: 5 },

  // ★★★★☆ HIGH PRIORITY
  { name: 'Postman', careersUrl: 'https://www.postman.com/company/careers', linkedIn: 'https://www.linkedin.com/company/postman-platform/', type: 'Product', stackMatch: 4 },
  { name: 'Razorpay', careersUrl: 'https://razorpay.com/jobs/', linkedIn: 'https://www.linkedin.com/company/razorpay/', type: 'Product', stackMatch: 4 },
  { name: 'Juspay', careersUrl: 'https://juspay.io/careers', linkedIn: 'https://www.linkedin.com/company/juspay/', type: 'Product', stackMatch: 4 },
  { name: 'Simpl', careersUrl: 'https://getsimpl.com/careers', linkedIn: 'https://www.linkedin.com/company/getsimpl/', type: 'Product', stackMatch: 5 },
  { name: 'Hevo Data', careersUrl: 'https://hevodata.com/careers/', linkedIn: 'https://www.linkedin.com/company/hevo-data/', type: 'Product', stackMatch: 4 },
  { name: 'Groww', careersUrl: 'https://groww.in/careers', linkedIn: 'https://www.linkedin.com/company/groww/', type: 'Product', stackMatch: 4 },
  { name: 'Locus.sh', careersUrl: 'https://locus.sh/careers', linkedIn: 'https://www.linkedin.com/company/locus-sh/', type: 'Product', stackMatch: 4 },
  { name: 'Wingify', careersUrl: 'https://wingify.com/careers/', linkedIn: 'https://www.linkedin.com/company/wingify/', type: 'Product', stackMatch: 4 },
  { name: 'LeadSquared', careersUrl: 'https://www.leadsquared.com/careers/', linkedIn: 'https://www.linkedin.com/company/leadsquared/', type: 'Product', stackMatch: 5 },
  { name: 'Fynd', careersUrl: 'https://fynd.keka.com/careers/', linkedIn: 'https://www.linkedin.com/company/fynd/', type: 'Product', stackMatch: 5 },
  { name: 'Shiprocket', careersUrl: 'https://www.shiprocket.in/careers/', linkedIn: 'https://www.linkedin.com/company/shiprocket/', type: 'Product', stackMatch: 4 },
  { name: 'Sarvam AI', careersUrl: 'https://sarvam.ai/careers', linkedIn: 'https://www.linkedin.com/company/sarvam-ai/', type: 'Product', stackMatch: 4 },
  { name: 'Zetwerk', careersUrl: 'https://www.zetwerk.com/careers/', linkedIn: 'https://www.linkedin.com/company/zetwerk/', type: 'Product', stackMatch: 4 },
  { name: 'Capillary Technologies', careersUrl: 'https://www.capillarytech.com/careers/', linkedIn: 'https://www.linkedin.com/company/capillary-technologies/', type: 'Product', stackMatch: 4 },

  // ★★★☆☆ MEDIUM PRIORITY
  { name: 'MoEngage', careersUrl: 'https://www.moengage.com/careers/', linkedIn: 'https://www.linkedin.com/company/moengage/', type: 'Product', stackMatch: 3 },
  { name: 'Rocketlane', careersUrl: 'https://rocketlane.freshteam.com/jobs', linkedIn: 'https://www.linkedin.com/company/rocketlane/', type: 'Product', stackMatch: 3 },
  { name: 'Mindtickle', careersUrl: 'https://www.mindtickle.com/careers/', linkedIn: 'https://www.linkedin.com/company/mindtickle/', type: 'Product', stackMatch: 4 },
  { name: 'NoBroker', careersUrl: 'https://www.nobroker.in/careers', linkedIn: 'https://www.linkedin.com/company/nobroker/', type: 'Product', stackMatch: 3 },
  { name: 'BrowserStack', careersUrl: 'https://www.browserstack.com/careers', linkedIn: 'https://www.linkedin.com/company/browserstack/', type: 'Product', stackMatch: 3 },
  { name: 'Zoho', careersUrl: 'https://careers.zohocorp.com/', linkedIn: 'https://www.linkedin.com/company/zoho/', type: 'Product', stackMatch: 4 },
  { name: 'Dukaan', careersUrl: 'https://mydukaan.io/careers', linkedIn: 'https://www.linkedin.com/company/mydukaan/', type: 'Product', stackMatch: 4 },
  { name: 'Skit.ai', careersUrl: 'https://skit.ai/careers', linkedIn: 'https://www.linkedin.com/company/skit-ai/', type: 'Product', stackMatch: 3 },
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const timestamp = () => new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    warn: '\x1b[33m',    // Yellow
    error: '\x1b[31m',   // Red
    reset: '\x1b[0m',
  };
  const prefix = {
    info: 'ℹ️ ',
    success: '✅',
    warn: '⚠️ ',
    error: '❌',
  };
  console.log(`${colors[type]}${prefix[type]} [${new Date().toLocaleTimeString()}] ${message}${colors.reset}`);
}

// ============================================
// SCRAPING FUNCTIONS
// ============================================

/**
 * Scrape a company's careers page for relevant job listings
 */
async function scrapeCareerPage(company) {
  const results = [];
  
  try {
    log(`Scraping ${company.name} careers page...`);
    
    const response = await axios.get(company.careersUrl, {
      headers: { 'User-Agent': CONFIG.userAgent },
      timeout: 15000,
      maxRedirects: 5,
    });

    const $ = cheerio.load(response.data);
    const pageText = $('body').text().toLowerCase();

    // Check for relevant keywords in the page
    const relevantKeywords = [
      'backend', 'software engineer', 'sde', 'node.js', 'nodejs', 'nestjs',
      'golang', 'go ', 'typescript', 'full stack', 'fullstack', 'full-stack',
      'microservices', 'distributed', 'api', 'platform engineer',
    ];

    const matchedKeywords = relevantKeywords.filter(kw => pageText.includes(kw));
    const hasRelevantRoles = matchedKeywords.length > 0;

    // Try to extract job listings from common patterns
    const jobElements = [];
    
    // Common selectors used by career pages
    const selectors = [
      'a[href*="job"], a[href*="position"], a[href*="career"], a[href*="opening"]',
      '.job-listing, .job-card, .position, .opening, .career-card',
      '[class*="job"], [class*="position"], [class*="career"], [class*="opening"]',
      'li a, .listing a, .role a',
    ];

    for (const selector of selectors) {
      $(selector).each((_, el) => {
        const text = $(el).text().trim();
        const href = $(el).attr('href') || '';
        
        if (text.length > 5 && text.length < 200) {
          const textLower = text.toLowerCase();
          const isRelevant = relevantKeywords.some(kw => textLower.includes(kw));
          
          if (isRelevant) {
            jobElements.push({
              title: text.replace(/\s+/g, ' ').trim(),
              url: href.startsWith('http') ? href : new URL(href, company.careersUrl).toString(),
            });
          }
        }
      });
    }

    // Deduplicate
    const uniqueJobs = [...new Map(jobElements.map(j => [j.title, j])).values()];

    results.push({
      company: company.name,
      type: company.type,
      careersUrl: company.careersUrl,
      linkedIn: company.linkedIn,
      stackMatch: company.stackMatch,
      hasRelevantRoles,
      matchedKeywords: matchedKeywords.join(', '),
      jobsFound: uniqueJobs.length,
      jobs: uniqueJobs.slice(0, 10), // Limit to 10 per company
      scrapedAt: new Date().toISOString(),
      status: 'success',
    });

    log(`${company.name}: Found ${uniqueJobs.length} relevant listings (keywords: ${matchedKeywords.slice(0, 5).join(', ')})`, 
        uniqueJobs.length > 0 ? 'success' : 'warn');

  } catch (error) {
    log(`Failed to scrape ${company.name}: ${error.message}`, 'error');
    results.push({
      company: company.name,
      type: company.type,
      careersUrl: company.careersUrl,
      linkedIn: company.linkedIn,
      stackMatch: company.stackMatch,
      hasRelevantRoles: false,
      matchedKeywords: '',
      jobsFound: 0,
      jobs: [],
      scrapedAt: new Date().toISOString(),
      status: `error: ${error.message}`,
    });
  }

  return results;
}

/**
 * Search for jobs on aggregator platforms
 */
async function searchJobAggregators() {
  const aggregatorResults = [];
  
  const platforms = [
    {
      name: 'Instahyre',
      searchUrl: 'https://www.instahyre.com/search-jobs/',
      note: 'Sign up and search for: "NestJS", "Node.js Backend", "Go Backend"',
    },
    {
      name: 'Cutshort',
      searchUrl: 'https://cutshort.io/jobs',
      note: 'Filter by: Node.js, NestJS, Go, TypeScript | Experience: 0-2 years',
    },
    {
      name: 'Wellfound (AngelList)',
      searchUrl: 'https://wellfound.com/jobs',
      note: 'Filter by: Backend Engineer, India, 0-2 years, $500-$1000/month',
    },
    {
      name: 'LinkedIn Jobs',
      searchUrl: 'https://www.linkedin.com/jobs/search/?keywords=NestJS%20OR%20Node.js%20backend%20engineer&location=India&f_E=2&f_TPR=r604800',
      note: 'Use "NestJS OR Node.js backend engineer" | Entry level | Past week',
    },
    {
      name: 'Naukri',
      searchUrl: 'https://www.naukri.com/backend-developer-nodejs-jobs?experience=1',
      note: 'Search: "Node.js backend developer" | 0-2 years experience',
    },
    {
      name: 'ProductBased.in',
      searchUrl: 'https://www.productbased.in/',
      note: 'Specifically filters for product-based companies only',
    },
    {
      name: 'hirist.tech',
      searchUrl: 'https://www.hirist.tech/',
      note: 'Premium tech job board — good for product companies',
    },
  ];

  for (const platform of platforms) {
    aggregatorResults.push(platform);
  }

  return aggregatorResults;
}

// ============================================
// LINKEDIN SEARCH URL GENERATOR
// ============================================

function generateLinkedInSearchUrls() {
  const searches = [];

  // People search — find recruiters at target companies
  for (const company of TARGET_COMPANIES.slice(0, 15)) { // Top 15
    searches.push({
      purpose: `Find recruiters at ${company.name}`,
      url: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`recruiter OR "talent acquisition" ${company.name}`)}&origin=GLOBAL_SEARCH_HEADER`,
      action: 'Connect with 2-3 recruiters, send MSG template',
    });
  }

  // Job search URLs
  const jobSearches = [
    {
      query: 'NestJS backend engineer India',
      purpose: 'Find NestJS-specific roles',
    },
    {
      query: 'Node.js software engineer backend India entry level',
      purpose: 'Find Node.js entry-level backend roles',
    },
    {
      query: 'Go Golang backend developer India',
      purpose: 'Find Go-specific roles',
    },
    {
      query: 'software engineer TypeScript microservices India',
      purpose: 'Find TypeScript microservices roles',
    },
  ];

  for (const search of jobSearches) {
    searches.push({
      purpose: search.purpose,
      url: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(search.query)}&f_E=2&f_TPR=r604800`,
      action: 'Apply + find poster/recruiter + send cold message',
    });
  }

  return searches;
}

// ============================================
// REPORT GENERATION
// ============================================

async function generateReport(scrapeResults, aggregatorResults, linkedInSearches) {
  const reportPath = path.join(CONFIG.outputDir, `Job_Search_Report_${timestamp()}.md`);
  
  let report = `# 🎯 Job Search Scraping Report for Divesh S\n`;
  report += `**Generated:** ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}\n`;
  report += `**Target Salary:** ₹35,000+/month (₹4.2+ LPA)\n`;
  report += `**Stack:** NestJS, Node.js, Go, TypeScript, Kafka, PostgreSQL\n\n`;
  report += `---\n\n`;

  // Summary
  const successful = scrapeResults.filter(r => r.status === 'success');
  const withJobs = successful.filter(r => r.jobsFound > 0);
  const withKeywords = successful.filter(r => r.hasRelevantRoles);
  
  report += `## 📊 Summary\n`;
  report += `| Metric | Count |\n`;
  report += `|--------|-------|\n`;
  report += `| Companies Scraped | ${scrapeResults.length} |\n`;
  report += `| Successfully Scraped | ${successful.length} |\n`;
  report += `| With Relevant Keywords | ${withKeywords.length} |\n`;
  report += `| With Direct Job Listings Found | ${withJobs.length} |\n`;
  report += `| Total Job Listings Found | ${scrapeResults.reduce((sum, r) => sum + r.jobsFound, 0)} |\n\n`;

  // Detailed Results — sorted by stack match
  report += `## 🏢 Company Results (Sorted by Stack Match)\n\n`;
  
  const sorted = [...scrapeResults].sort((a, b) => b.stackMatch - a.stackMatch);
  
  for (const result of sorted) {
    const stars = '★'.repeat(result.stackMatch) + '☆'.repeat(5 - result.stackMatch);
    const statusEmoji = result.status === 'success' ? (result.hasRelevantRoles ? '🟢' : '🟡') : '🔴';
    
    report += `### ${statusEmoji} ${result.company} ${stars}\n`;
    report += `- **Type:** ${result.type}\n`;
    report += `- **Careers:** [${result.careersUrl}](${result.careersUrl})\n`;
    report += `- **LinkedIn:** [Company Page](${result.linkedIn})\n`;
    report += `- **Status:** ${result.status}\n`;
    
    if (result.matchedKeywords) {
      report += `- **Matched Keywords:** ${result.matchedKeywords}\n`;
    }
    
    if (result.jobs && result.jobs.length > 0) {
      report += `- **Jobs Found:**\n`;
      for (const job of result.jobs) {
        report += `  - [${job.title}](${job.url})\n`;
      }
    }
    
    report += `\n`;
  }

  // Job Aggregator Platforms
  report += `## 🔍 Job Aggregator Platforms to Search\n\n`;
  report += `| Platform | Search URL | Action |\n`;
  report += `|----------|-----------|--------|\n`;
  for (const agg of aggregatorResults) {
    report += `| ${agg.name} | [Search](${agg.searchUrl}) | ${agg.note} |\n`;
  }
  report += `\n`;

  // LinkedIn Search URLs
  report += `## 🔗 LinkedIn Search URLs (Pre-built)\n\n`;
  for (const search of linkedInSearches) {
    report += `### ${search.purpose}\n`;
    report += `- [Open Search](${search.url})\n`;
    report += `- **Action:** ${search.action}\n\n`;
  }

  // Action Items
  report += `## ✅ Immediate Action Items\n\n`;
  report += `### Week 1 (Days 1-3): Apply to TOP PRIORITY companies\n`;
  report += `1. Apply through careers pages of: GoKwik, Yellow.ai, CleverTap, Chargebee, Freshworks, Hasura\n`;
  report += `2. Send LinkedIn connection requests to 2-3 recruiters at each company\n`;
  report += `3. Create profiles on Instahyre, Cutshort, Wellfound\n\n`;
  
  report += `### Week 1 (Days 4-7): Apply to HIGH PRIORITY companies\n`;
  report += `4. Apply through careers pages of remaining HIGH priority companies\n`;
  report += `5. Follow up on connection requests with MSG templates\n`;
  report += `6. Set up job alerts on LinkedIn, Naukri, Instahyre\n\n`;
  
  report += `### Week 2: Expand & Follow Up\n`;
  report += `7. Apply to MEDIUM priority companies\n`;
  report += `8. Send first follow-up to non-responsive recruiters (5-7 day gap)\n`;
  report += `9. Post technical content on LinkedIn (NestJS tips, Go patterns) for visibility\n`;
  report += `10. Ask for referrals from Sri Shakthi alumni network\n\n`;

  fs.writeFileSync(reportPath, report, 'utf-8');
  log(`Report saved to: ${reportPath}`, 'success');
  return reportPath;
}

// ============================================
// CSV EXPORT FOR GOOGLE SHEETS
// ============================================

async function exportScrapedJobsToCSV(scrapeResults) {
  const csvPath = path.join(CONFIG.outputDir, `Scraped_Jobs_${timestamp()}.csv`);
  
  const allJobs = [];
  for (const result of scrapeResults) {
    if (result.jobs && result.jobs.length > 0) {
      for (const job of result.jobs) {
        allJobs.push({
          company: result.company,
          companyType: result.type,
          stackMatch: '★'.repeat(result.stackMatch),
          jobTitle: job.title,
          jobUrl: job.url,
          careersPage: result.careersUrl,
          linkedIn: result.linkedIn,
          appliedStatus: 'Not Applied',
          scrapedDate: new Date().toLocaleDateString('en-IN'),
        });
      }
    } else {
      // Still list the company even if no specific jobs were scraped
      allJobs.push({
        company: result.company,
        companyType: result.type,
        stackMatch: '★'.repeat(result.stackMatch),
        jobTitle: result.hasRelevantRoles ? 'Relevant roles detected — check careers page' : 'Check careers page manually',
        jobUrl: result.careersUrl,
        careersPage: result.careersUrl,
        linkedIn: result.linkedIn,
        appliedStatus: 'Not Applied',
        scrapedDate: new Date().toLocaleDateString('en-IN'),
      });
    }
  }

  const csvWriter = createObjectCsvWriter({
    path: csvPath,
    header: [
      { id: 'company', title: 'Company' },
      { id: 'companyType', title: 'Company Type' },
      { id: 'stackMatch', title: 'Stack Match' },
      { id: 'jobTitle', title: 'Job Title' },
      { id: 'jobUrl', title: 'Job URL' },
      { id: 'careersPage', title: 'Careers Page' },
      { id: 'linkedIn', title: 'LinkedIn' },
      { id: 'appliedStatus', title: 'Applied Status' },
      { id: 'scrapedDate', title: 'Scraped Date' },
    ],
  });

  await csvWriter.writeRecords(allJobs);
  log(`Scraped jobs CSV saved to: ${csvPath}`, 'success');
  return csvPath;
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  console.log('\n');
  log('═══════════════════════════════════════════════════════════════', 'info');
  log('  🚀 Job Search Automation Script for Divesh S', 'info');
  log('  📋 Target: Mid-tier Product Companies | ₹35K+/month', 'info');
  log('═══════════════════════════════════════════════════════════════', 'info');
  console.log('\n');

  // Phase 1: Scrape company career pages
  log('Phase 1: Scraping company career pages...', 'info');
  const scrapeResults = [];
  
  for (const company of TARGET_COMPANIES) {
    const results = await scrapeCareerPage(company);
    scrapeResults.push(...results);
    await sleep(CONFIG.requestDelay); // Rate limiting
  }

  // Phase 2: Get aggregator platform info
  log('\nPhase 2: Generating job aggregator search URLs...', 'info');
  const aggregatorResults = await searchJobAggregators();

  // Phase 3: Generate LinkedIn search URLs
  log('\nPhase 3: Generating LinkedIn search URLs...', 'info');
  const linkedInSearches = generateLinkedInSearchUrls();

  // Phase 4: Generate outputs
  log('\nPhase 4: Generating reports...', 'info');
  const reportPath = await generateReport(scrapeResults, aggregatorResults, linkedInSearches);
  const csvPath = await exportScrapedJobsToCSV(scrapeResults);

  // Final Summary
  console.log('\n');
  log('═══════════════════════════════════════════════════════════════', 'success');
  log('  ✅ SCRAPING COMPLETE', 'success');
  log(`  📄 Report: ${reportPath}`, 'success');
  log(`  📊 CSV (for Google Sheets): ${csvPath}`, 'success');
  log(`  📋 Main Tracker: Job_Application_Tracker.csv`, 'success');
  log('═══════════════════════════════════════════════════════════════', 'success');
  console.log('\n');

  log('Next steps:', 'info');
  log('1. Upload Job_Application_Tracker.csv to Google Sheets', 'info');
  log('2. Upload Scraped_Jobs_*.csv to a second sheet for cross-reference', 'info');
  log('3. Start applying to TOP PRIORITY companies first', 'info');
  log('4. Use Cold_Outreach_Templates.md for LinkedIn messages', 'info');
}

main().catch(console.error);
