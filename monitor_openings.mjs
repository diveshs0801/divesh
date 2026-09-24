/**
 * Automated Job Opening & Posting Date Monitor for Divesh S
 * ==========================================================
 * Monitors careers pages and LinkedIn for the 122 Watchlist Product Companies.
 * Detects recently posted roles, extracts posting dates, computes freshness,
 * and generates ready-to-copy referral messages and Google Sheet sync data.
 * 
 * Usage:
 *   node monitor_openings.mjs              # Fast scan of Top/High Priority companies
 *   node monitor_openings.mjs --all        # Scan all 122 companies
 *   node monitor_openings.mjs --company "Swiggy" # Check a specific company
 *   node monitor_openings.mjs --sync       # Push newly found jobs to Google Sheets Webhook
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { sendToSheet } from './update_sheet.mjs';

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  targetKeywords: [
    'backend', 'software engineer', 'sde', 'sde 1', 'sde i', 'sde-1', 'sde-i',
    'node.js', 'nodejs', 'nestjs', 'golang', 'go developer', 'typescript',
    'full stack', 'fullstack', 'microservices', 'distributed systems', 'api platform'
  ],
  
  negativeKeywords: [
    'intern', 'internship', 'lead', 'principal', 'staff', 'director', 'vp',
    'frontend only', 'data science', 'qa', 'test engineer', 'devops only'
  ],
  
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  requestTimeout: 12000,
  delayBetweenRequestsMs: 1500,
};

// Sleep helper
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ============================================
// LOAD WATCHLIST COMPANIES
// ============================================

function loadWatchlist() {
  const jsonPath = path.join(process.cwd(), 'enriched_watchlist_companies.json');
  if (fs.existsSync(jsonPath)) {
    return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  }
  return [];
}

// Generate 1-Click LinkedIn Search Links
function getLinkedInSearchUrls(companyName) {
  const encComp = encodeURIComponent(companyName);
  const keywords24h = encodeURIComponent(`(Backend OR Node.js OR NestJS OR Go OR "Software Engineer") ${companyName}`);
  return {
    past24Hours: `https://www.linkedin.com/jobs/search/?keywords=${keywords24h}&location=India&f_TPR=r86400&sortBy=DD`,
    past7Days: `https://www.linkedin.com/jobs/search/?keywords=${keywords24h}&location=India&f_TPR=r604800&sortBy=DD`,
    companyJobs: `https://www.linkedin.com/jobs/search/?keywords=${encComp}&location=India&f_TPR=r604800&sortBy=DD`
  };
}

// Date parser & freshness calculator
function parsePostingDate(dateStr) {
  if (!dateStr) return { raw: 'Not specified', badge: '⚪ Check Link', freshnessScore: 3 };
  
  const lower = dateStr.toLowerCase().trim();
  
  // Check relative time strings
  if (lower.includes('hour') || lower.includes('minute') || lower.includes('today') || lower.includes('just now')) {
    return { raw: dateStr, badge: '🟢 TODAY (<24h)', freshnessScore: 1, isFresh: true };
  }
  
  const dayMatch = lower.match(/(\d+)\s*day/);
  if (dayMatch) {
    const days = parseInt(dayMatch[1], 10);
    if (days <= 1) return { raw: dateStr, badge: '🟢 YESTERDAY', freshnessScore: 1, isFresh: true };
    if (days <= 4) return { raw: dateStr, badge: `🟡 ${days} DAYS AGO`, freshnessScore: 2, isFresh: true };
    return { raw: dateStr, badge: `⚪ ${days} DAYS AGO`, freshnessScore: 3, isFresh: false };
  }
  
  if (lower.includes('week')) {
    return { raw: dateStr, badge: '⚪ PAST WEEK', freshnessScore: 3, isFresh: false };
  }
  
  // Check ISO / standard date formats (YYYY-MM-DD)
  const isoMatch = lower.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const jobDate = new Date(isoMatch[0]);
    const now = new Date();
    const diffHours = (now - jobDate) / (1000 * 60 * 60);
    if (diffHours <= 24) return { raw: isoMatch[0], badge: '🟢 TODAY (<24h)', freshnessScore: 1, isFresh: true };
    if (diffHours <= 96) return { raw: isoMatch[0], badge: `🟡 ${Math.round(diffHours / 24)}d AGO`, freshnessScore: 2, isFresh: true };
    return { raw: isoMatch[0], badge: `⚪ ${isoMatch[0]}`, freshnessScore: 3, isFresh: false };
  }
  
  return { raw: dateStr, badge: `ℹ️ ${dateStr}`, freshnessScore: 3, isFresh: false };
}

// ============================================
// CAREER PAGE SCRAPER & DATE EXTRACTOR
// ============================================

async function inspectCompanyCareers(company) {
  const result = {
    company: company.name,
    domain: company.domain || 'Tech Product',
    careersUrl: company.careers,
    linkedInUrl: company.linkedin,
    linkedInSearches: getLinkedInSearchUrls(company.name),
    status: 'unchecked',
    openings: [],
    checkedAt: new Date().toISOString()
  };

  if (!company.careers || !company.careers.startsWith('http')) {
    result.status = 'no_url';
    return result;
  }

  try {
    const response = await axios.get(company.careers, {
      headers: {
        'User-Agent': CONFIG.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: CONFIG.requestTimeout,
      maxRedirects: 4,
    });

    const html = response.data;
    if (typeof html !== 'string') {
      result.status = 'non_html';
      return result;
    }

    const $ = cheerio.load(html);
    result.status = 'scanned';

    // 1. Check for structured JSON-LD data
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const text = $(el).html();
        if (!text) return;
        const json = JSON.parse(text);
        const items = Array.isArray(json) ? json : [json];
        for (const item of items) {
          if (item['@type'] === 'JobPosting') {
            const title = (item.title || '').trim();
            const datePosted = item.datePosted || '';
            const jobUrl = item.url || company.careers;
            
            const isMatch = CONFIG.targetKeywords.some(kw => title.toLowerCase().includes(kw));
            if (isMatch) {
              result.openings.push({
                title,
                url: jobUrl,
                postedDate: parsePostingDate(datePosted),
                source: 'Career Page (JSON-LD)'
              });
            }
          }
        }
      } catch (e) {
        // Ignore JSON parsing failures in non-standard tags
      }
    });

    // 2. Scan standard link elements and cards
    const linkSelectors = [
      'a[href*="job"]', 'a[href*="position"]', 'a[href*="opening"]', 'a[href*="career"]',
      '.job-title a', '.position-title a', 'li.job-listing a', 'tr.job-row a'
    ];

    for (const sel of linkSelectors) {
      $(sel).each((_, el) => {
        const text = $(el).text().replace(/\s+/g, ' ').trim();
        const href = $(el).attr('href');
        if (!text || !href || text.length < 4 || text.length > 120) return;

        const textLower = text.toLowerCase();
        const matchesTarget = CONFIG.targetKeywords.some(kw => textLower.includes(kw));
        const hasNegative = CONFIG.negativeKeywords.some(neg => textLower.includes(neg));

        if (matchesTarget && !hasNegative) {
          // Look for nearby date element
          const parent = $(el).closest('div, li, tr, article');
          const timeElem = parent.find('time, .date, [class*="date"], [class*="posted"], [class*="time"]').first();
          const dateText = timeElem.attr('datetime') || timeElem.text().trim() || '';

          const fullUrl = href.startsWith('http') ? href : new URL(href, company.careers).toString();
          
          // Avoid duplicate titles
          if (!result.openings.some(o => o.title === text)) {
            result.openings.push({
              title: text,
              url: fullUrl,
              postedDate: parsePostingDate(dateText),
              source: 'Career Page'
            });
          }
        }
      });
    }

  } catch (err) {
    result.status = `error: ${err.message}`;
  }

  return result;
}

// ============================================
// MAIN RUNNER
// ============================================

async function main() {
  const args = process.argv.slice(2);
  const scanAll = args.includes('--all');
  const syncToSheet = args.includes('--sync');
  const companyArgIdx = args.indexOf('--company');
  const specificCompany = companyArgIdx !== -1 ? args[companyArgIdx + 1] : null;

  console.log('\n============================================================');
  console.log('🚀 Divesh S — Product Company Job Monitor & Date Tracker');
  console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
  console.log('============================================================\n');

  const allWatchlist = loadWatchlist();
  if (allWatchlist.length === 0) {
    console.error('❌ Could not load watchlist companies from enriched_watchlist_companies.json');
    process.exit(1);
  }

  let companiesToScan = [];
  if (specificCompany) {
    companiesToScan = allWatchlist.filter(c => c.name.toLowerCase().includes(specificCompany.toLowerCase()));
    console.log(`🎯 Targeting single company match: "${specificCompany}" (${companiesToScan.length} matches)`);
  } else if (scanAll) {
    companiesToScan = allWatchlist;
    console.log(`📋 Scanning ALL 122 companies in watchlist...`);
  } else {
    // Default: Top priority and high-yield product companies
    const priorityNames = [
      'Swiggy', 'Razorpay', 'Cashfree Payments', 'PhonePe', 'Freshworks', 'Zoho',
      'Groww', 'CRED', 'Juspay', 'Porter', 'Postman', 'Chargebee', 'Hasura',
      'Kovai.co', 'Payoda', 'Kissflow', 'SurveySparrow', 'SigNoz', 'GoKwik', 'CleverTap'
    ];
    companiesToScan = allWatchlist.filter(c => priorityNames.includes(c.name));
    console.log(`⚡ Running Fast-Scan on ${companiesToScan.length} Top-Priority Product Companies...`);
    console.log('   (Tip: Run `node monitor_openings.mjs --all` to scan all 122 companies)\n');
  }

  const scanResults = [];
  const newlyFoundJobs = [];

  for (let i = 0; i < companiesToScan.length; i++) {
    const comp = companiesToScan[i];
    process.stdout.write(`[${i + 1}/${companiesToScan.length}] Checking ${comp.name.padEnd(20)} ... `);
    
    const res = await inspectCompanyCareers(comp);
    scanResults.push(res);

    if (res.openings.length > 0) {
      console.log(`✅ Found ${res.openings.length} matching role(s)!`);
      for (const op of res.openings) {
        console.log(`     ↳ ${op.title} | ${op.postedDate.badge}`);
        newlyFoundJobs.push({
          company: comp.name,
          title: op.title,
          url: op.url,
          date: op.postedDate.badge,
          domain: comp.domain,
          linkedIn24h: comp.linkedInSearches ? comp.linkedInSearches.past24Hours : ''
        });
      }
    } else {
      console.log(`⚪ 0 direct matches (${res.status})`);
    }

    if (i < companiesToScan.length - 1) {
      await sleep(CONFIG.delayBetweenRequestsMs);
    }
  }

  // ============================================
  // GENERATE DASHBOARD REPORT
  // ============================================

  const reportDate = new Date().toISOString().slice(0, 10);
  const reportPath = path.join(process.cwd(), 'Job_Openings_Alert_Latest.md');
  const jsonFeedPath = path.join(process.cwd(), 'live_jobs_feed.json');

  // Save JSON
  fs.writeFileSync(jsonFeedPath, JSON.stringify(scanResults, null, 2));

  // Generate Markdown
  let md = `# 🎯 Live Job Openings & Date Tracker Digest\n`;
  md += `**Generated:** ${new Date().toLocaleString()} | **Target Role:** Backend / SDE (NestJS, Go, TypeScript)\n\n`;
  md += `> [!TIP]\n`;
  md += `> **The First-24-Hours Rule:** Applying within 24 hours of posting increases interview callback likelihood by **4x to 5x**. Always use the pre-filtered **LinkedIn 24h Search** and **Careers Link** below.\n\n`;

  md += `## 🚀 Monitored Target Companies & Quick 1-Click Search Links\n\n`;
  md += `| Company | Domain | Careers Page | LinkedIn (Past 24h Filter) | LinkedIn (Past 7d Filter) |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- |\n`;

  for (const comp of companiesToScan) {
    const urls = getLinkedInSearchUrls(comp.name);
    md += `| **${comp.name}** | ${comp.domain || 'Tech'} | [Careers](${comp.careers}) | [🔥 Past 24h Jobs](${urls.past24Hours}) | [⚡ Past 7d Jobs](${urls.past7Days}) |\n`;
  }

  if (newlyFoundJobs.length > 0) {
    md += `\n---\n\n## 🔥 Detected Open Roles on Career Portals\n\n`;
    for (const job of newlyFoundJobs) {
      md += `### ${job.title} — **${job.company}**\n`;
      md += `- **Date Status:** ${job.date}\n`;
      md += `- **Direct Job Link:** [Apply Here](${job.url})\n`;
      md += `- **LinkedIn 24h Verification:** [Check LinkedIn Postings](${job.linkedIn24h})\n`;
      md += `- **Referral Action:** Open \`Referral_Message_Templates.md\` and use template for **${job.domain}**.\n\n`;
    }
  }

  fs.writeFileSync(reportPath, md);

  console.log('\n============================================================');
  console.log(`✅ Scan Complete!`);
  console.log(`📄 Markdown Report Generated: Job_Openings_Alert_Latest.md`);
  console.log(`💾 JSON Feed Saved: live_jobs_feed.json`);

  // Sync to Google Sheet if requested
  if (syncToSheet && newlyFoundJobs.length > 0) {
    console.log(`\n📤 Syncing ${newlyFoundJobs.length} live jobs to Google Sheet...`);
    for (const job of newlyFoundJobs) {
      try {
        await sendToSheet({
          action: 'add_job',
          company: job.company,
          role: job.title,
          job_url: job.url,
          notes: `Auto-detected opening. Date status: ${job.date}`
        });
        console.log(`   + Added ${job.company} - ${job.title}`);
      } catch (err) {
        console.error(`   ! Failed to sync ${job.company}: ${err.message}`);
      }
    }
    console.log('✅ Google Sheet sync finished.');
  }

  console.log('============================================================\n');
}

main().catch(console.error);
