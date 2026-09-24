/**
 * Live Tech Job Aggregator for Divesh S
 * Fetches real, currently-active Backend / SDE jobs (NestJS, Node.js, Go, TypeScript)
 * from verified public ATS boards (Greenhouse & Lever) and tech job APIs.
 * 
 * Usage:
 *   node fetch_live_jobs.mjs          # Fetch and save to live_openings.json & live_openings.md
 *   node fetch_live_jobs.mjs --sync   # Also append new jobs directly to your Google Sheet!
 */

import fs from 'fs';
import path from 'path';
import { sendToSheet } from './update_sheet.mjs';

// List of companies with known public Greenhouse or Lever board slugs
const KNOWN_BOARDS = [
  // Greenhouse boards
  { company: 'Slice', type: 'greenhouse', slug: 'slice' },
  { company: 'HyperVerge', type: 'greenhouse', slug: 'hyperverge' },
  { company: 'BrowserStack', type: 'greenhouse', slug: 'browserstack' },
  { company: 'Postman', type: 'greenhouse', slug: 'postman' },
  { company: 'Yellow.ai', type: 'greenhouse', slug: 'yellowai' },
  { company: 'CleverTap', type: 'greenhouse', slug: 'clevertap' },
  { company: 'Branch', type: 'greenhouse', slug: 'branch' },
  { company: 'InMobi', type: 'greenhouse', slug: 'inmobi' },
  { company: 'Urban Company', type: 'greenhouse', slug: 'urbancompany' },
  
  // Lever boards
  { company: 'CRED', type: 'lever', slug: 'cred' },
  { company: 'Smallcase', type: 'lever', slug: 'smallcase' },
  { company: 'Setu', type: 'lever', slug: 'setu' },
  { company: 'Jar', type: 'lever', slug: 'jar' },
  { company: 'CoinSwitch', type: 'lever', slug: 'coinswitch' },
  { company: 'Unacademy', type: 'lever', slug: 'unacademy' },
  { company: 'Classplus', type: 'lever', slug: 'classplus' },
  { company: 'Spinny', type: 'lever', slug: 'spinny' },
  { company: 'Khatabook', type: 'lever', slug: 'khatabook' }
];

const TARGET_KEYWORDS = [
  'backend', 'software engineer', 'sde', 'sde-1', 'sde-i', 'sde 1', 'sde i',
  'node', 'nodejs', 'node.js', 'nestjs', 'golang', 'go developer',
  'typescript', 'full stack', 'fullstack', 'api platform', 'distributed'
];

const EXCLUDE_KEYWORDS = [
  'lead', 'principal', 'staff', 'director', 'vp', 'head of', 'manager',
  'frontend only', 'ui/ux', 'data scientist', 'devops only'
];

function isMatch(title) {
  const lower = title.toLowerCase();
  const hasTarget = TARGET_KEYWORDS.some(k => lower.includes(k));
  const hasExclude = EXCLUDE_KEYWORDS.some(k => lower.includes(k));
  return hasTarget && !hasExclude;
}

// 1. Fetch from Greenhouse
async function fetchGreenhouse(company, slug) {
  const jobs = [];
  try {
    const url = `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(5000) });
    if (!res.ok) return jobs;
    const data = await res.json();
    if (data && data.jobs) {
      for (const j of data.jobs) {
        if (isMatch(j.title)) {
          jobs.push({
            company,
            title: j.title,
            location: j.location ? j.location.name : 'India / Remote',
            url: j.absolute_url,
            source: 'Greenhouse ATS',
            date: j.updated_at ? j.updated_at.slice(0, 10) : 'Recent',
            type: 'Product / Tech Startup'
          });
        }
      }
    }
  } catch (e) {
    // Ignore timeout / board not found
  }
  return jobs;
}

// 2. Fetch from Lever
async function fetchLever(company, slug) {
  const jobs = [];
  try {
    const url = `https://api.lever.co/v0/postings/${slug}`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(5000) });
    if (!res.ok) return jobs;
    const data = await res.json();
    if (Array.isArray(data)) {
      for (const j of data) {
        if (isMatch(j.text)) {
          jobs.push({
            company,
            title: j.text,
            location: j.categories?.location || 'India / Remote',
            url: j.hostedUrl,
            source: 'Lever ATS',
            date: j.createdAt ? new Date(j.createdAt).toISOString().slice(0, 10) : 'Recent',
            type: 'Product / Tech Startup'
          });
        }
      }
    }
  } catch (e) {
    // Ignore timeout / board not found
  }
  return jobs;
}

// 3. Fetch from Jobicy (Remote Tech Jobs)
async function fetchJobicy() {
  const jobs = [];
  try {
    const url = 'https://jobicy.com/api/v2/remote-jobs?count=30&industry=engineering';
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return jobs;
    const data = await res.json();
    if (data && data.jobs) {
      for (const j of data.jobs) {
        if (isMatch(j.jobTitle)) {
          jobs.push({
            company: j.companyName || 'Tech Co',
            title: j.jobTitle,
            location: j.jobGeo || 'Remote',
            url: j.url,
            source: 'Jobicy Global Remote',
            date: j.pubDate ? j.pubDate.slice(0, 10) : 'Recent',
            type: 'Remote Product'
          });
        }
      }
    }
  } catch (e) {}
  return jobs;
}

// 4. Fetch from Arbeitnow (Tech Job API)
async function fetchArbeitnow() {
  const jobs = [];
  try {
    const url = 'https://arbeitnow.com/api/job-board-api';
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return jobs;
    const data = await res.json();
    if (data && data.data) {
      for (const j of data.data) {
        if (isMatch(j.title)) {
          jobs.push({
            company: j.company_name || 'Tech Co',
            title: j.title,
            location: j.location || 'Remote',
            url: j.url,
            source: 'Arbeitnow Tech Feed',
            date: j.created_at ? new Date(j.created_at * 1000).toISOString().slice(0, 10) : 'Recent',
            type: 'Product Tech'
          });
        }
      }
    }
  } catch (e) {}
  return jobs;
}

async function main() {
  const syncToSheet = process.argv.includes('--sync');

  console.log('\n============================================================');
  console.log('⚡ Divesh S — Live Real-Time Job Puller');
  console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
  console.log('============================================================\n');

  let allJobs = [];

  // 1. Scan ATS boards
  console.log('📡 Checking High-Growth Startup ATS Boards (Greenhouse & Lever)...');
  for (const board of KNOWN_BOARDS) {
    let results = [];
    if (board.type === 'greenhouse') {
      results = await fetchGreenhouse(board.company, board.slug);
    } else if (board.type === 'lever') {
      results = await fetchLever(board.company, board.slug);
    }
    if (results.length > 0) {
      console.log(`  ✅ ${board.company}: Found ${results.length} active matching role(s)`);
      allJobs.push(...results);
    }
  }

  // 2. Scan Job APIs
  console.log('\n📡 Checking Live Tech Job APIs (Jobicy & Arbeitnow)...');
  const jobicyJobs = await fetchJobicy();
  console.log(`  ✅ Jobicy: Found ${jobicyJobs.length} active engineering roles`);
  allJobs.push(...jobicyJobs);

  const arbeitnowJobs = await fetchArbeitnow();
  console.log(`  ✅ Arbeitnow: Found ${arbeitnowJobs.length} active backend roles`);
  allJobs.push(...arbeitnowJobs);

  // Deduplicate by URL
  const uniqueJobs = [...new Map(allJobs.map(j => [j.url, j])).values()];

  console.log(`\n🎉 Total Active Verified Jobs Found: ${uniqueJobs.length}`);

  // Save to JSON
  const jsonPath = path.join(process.cwd(), 'live_openings.json');
  fs.writeFileSync(jsonPath, JSON.stringify(uniqueJobs, null, 2));

  // Save Markdown Report
  let md = `# 🔥 Real-Time Active Job Openings Feed\n`;
  md += `**Last Updated:** ${new Date().toLocaleString()} | **Total Fresh Roles:** ${uniqueJobs.length}\n\n`;
  md += `> [!IMPORTANT]\n`;
  md += `> These are **real, live jobs** fetched directly from company ATS endpoints and tech feeds. Apply directly through the links below!\n\n`;
  md += `| Company | Role | Location | Date Posted | Source | Direct Application Link |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  for (const job of uniqueJobs) {
    md += `| **${job.company}** | ${job.title} | ${job.location} | ${job.date} | \`${job.source}\` | [Apply Now](${job.url}) |\n`;
  }

  const mdPath = path.join(process.cwd(), 'Live_Real_Time_Jobs.md');
  fs.writeFileSync(mdPath, md);
  console.log(`📄 Markdown Report Generated: Live_Real_Time_Jobs.md`);

  // Sync to Google Sheet if requested
  if (syncToSheet && uniqueJobs.length > 0) {
    console.log(`\n📤 Syncing top ${Math.min(uniqueJobs.length, 25)} jobs to Google Sheet...`);
    let count = 0;
    for (const job of uniqueJobs.slice(0, 25)) {
      try {
        await sendToSheet({
          action: 'add_job',
          company: job.company,
          role: job.title,
          type: job.type,
          location: job.location,
          job_url: job.url,
          source: job.source,
          notes: `Live open role posted on ${job.date}`
        });
        count++;
        console.log(`   + Added [${count}] ${job.company} - ${job.title}`);
      } catch (err) {
        console.error(`   ! Failed to sync ${job.company}: ${err.message}`);
      }
    }
    console.log(`✅ Synced ${count} real jobs to your Google Sheet!`);
  }

  console.log('\n============================================================\n');
}

main().catch(console.error);
