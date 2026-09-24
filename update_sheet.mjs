/**
 * Sheet Updater CLI for Divesh's Job Tracker
 * Directly interacts with the Google Apps Script Webhook.
 */

const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzENPhYl0ymfjzEF1E_ooB3WiMprPbYc4XIJD_icyQGK9immnxARTBop5NqLKCkXZmu/exec';

export async function sendToSheet(payload) {
  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  } catch (err) {
    console.error('Error posting to Google Sheets webhook:', err);
    throw err;
  }
}

// Quick CLI execution
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('update_sheet.mjs')) {
  const args = process.argv.slice(2);
  const action = args[0] || 'test';
  
  (async () => {
    if (action === 'update_status') {
      const company = args[1];
      const status = args[2] || 'Applied';
      if (!company) {
        console.log('Usage: node update_sheet.mjs update_status <Company> <Status>');
        process.exit(1);
      }
      console.log(`Updating ${company} to ${status}...`);
      const res = await sendToSheet({ action: 'update_status', company, status });
      console.log('Result:', res);
    } else if (action === 'format') {
      console.log('Sending format request to Google Sheets...');
      const res = await sendToSheet({ action: 'format' });
      console.log('Result:', res);
    } else if (action === 'add_job') {
      const jobData = JSON.parse(args[1] || '{}');
      console.log(`Adding job:`, jobData);
      const res = await sendToSheet({ action: 'add_job', ...jobData });
      console.log('Result:', res);
    } else {
      console.log('Testing connection to Google Sheets Webhook...');
      const res = await sendToSheet({ action: 'test' });
      console.log('Webhook Response:', res);
    }
  })();
}
