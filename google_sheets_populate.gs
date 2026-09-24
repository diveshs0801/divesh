  /**
 * Google Apps Script for Divesh S — Job Tracker UI Styler & Auto-Updater
 * 
 * -------------------------------------------------------------
 * HOW TO FIX THE UI IN 10 SECONDS:
 * 1. In your Google Sheet, click "Extensions" → "Apps Script".
 * 2. Delete any existing code and PASTE THIS ENTIRE FILE.
 * 3. Select function "formatCurrentSheet" in the dropdown at the top.
 * 4. Click the "Run" button (▶️).
 * 5. Grant permissions (click "Advanced" → "Go to Untitled project").
 * -> Your sheet UI will instantly transform into a professional executive dashboard!
 * 
 * -------------------------------------------------------------
 * HOW TO ALLOW ANTIGRAVITY TO AUTO-UPDATE IN THE BACKGROUND:
 * 1. Click "Deploy" (top right) → "New deployment".
 * 2. Click the gear icon (⚙️) next to "Select type" → choose "Web app".
 * 3. Description: "Job Tracker Updater"
 * 4. Execute as: "Me"
 * 5. Who has access: "Anyone" (allows Antigravity to post updates)
 * 6. Click "Deploy" and COPY the Web App URL.
 * 7. Send the Web App URL in chat!
 * -------------------------------------------------------------
 */

/**
 * Formats the currently active sheet (the one you imported) into a clean, modern UI.
 */
function formatCurrentSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  
  if (lastRow === 0 || lastCol === 0) {
    SpreadsheetApp.getUi().alert("Sheet is empty! Please import the CSV first.");
    return;
  }
  
  // 1. Freeze Header Row
  sheet.setFrozenRows(1);
  
  // 2. Format Header Row
  const headerRange = sheet.getRange(1, 1, 1, lastCol);
  headerRange.setFontWeight("bold");
  headerRange.setFontSize(10);
  headerRange.setFontColor("#FFFFFF");
  headerRange.setBackground("#0F172A"); // Modern Dark Slate / Navy
  headerRange.setVerticalAlignment("middle");
  headerRange.setHorizontalAlignment("center");
  headerRange.setWrap(true);
  sheet.setRowHeight(1, 40);
  
  // 3. Format Data Rows
  if (lastRow > 1) {
    const dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol);
    dataRange.setFontSize(9);
    dataRange.setFontFamily("Arial");
    dataRange.setVerticalAlignment("middle");
    
    // Light gridlines
    dataRange.setBorder(true, true, true, true, true, true, "#E2E8F0", SpreadsheetApp.BorderStyle.SOLID);
    
    // Alternating row colors for readability
    for (let r = 2; r <= lastRow; r++) {
      sheet.setRowHeight(r, 28);
      if (r % 2 === 0) {
        sheet.getRange(r, 1, 1, lastCol).setBackground("#F8FAFC"); // Subtle slate tint
      } else {
        sheet.getRange(r, 1, 1, lastCol).setBackground("#FFFFFF");
      }
    }
    
    // 4. Color-code Priority and Application Status & Add Dropdowns
    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const statusCol = headers.indexOf("Application Status") + 1;
    const priorityCol = headers.indexOf("Priority") + 1;
    const notesCol = headers.indexOf("Notes") + 1;
    const stageCol = headers.indexOf("Interview Stage") + 1;
    
    // Status Dropdown
    if (statusCol > 0) {
      const statusValidation = SpreadsheetApp.newDataValidation()
        .requireValueInList(["Not Applied", "Applied", "In Review", "Phone Screen", "Technical Round", "HR Round", "Offer Received", "Rejected", "Withdrawn"], true)
        .build();
      sheet.getRange(2, statusCol, lastRow - 1, 1).setDataValidation(statusValidation);
      
      // Color-code Status
      for (let r = 2; r <= lastRow; r++) {
        const cell = sheet.getRange(r, statusCol);
        const val = cell.getValue().toString().trim();
        if (val === "Not Applied") {
          cell.setBackground("#FEE2E2"); // Light red
          cell.setFontColor("#991B1B");
          cell.setFontWeight("bold");
        } else if (val === "Applied") {
          cell.setBackground("#FEF3C7"); // Light yellow
          cell.setFontColor("#92400E");
          cell.setFontWeight("bold");
        } else if (val === "Offer Received") {
          cell.setBackground("#DCFCE7"); // Light green
          cell.setFontColor("#166534");
          cell.setFontWeight("bold");
        }
      }
    }
    
    // Priority formatting
    if (priorityCol > 0) {
      for (let r = 2; r <= lastRow; r++) {
        const cell = sheet.getRange(r, priorityCol);
        const val = cell.getValue().toString();
        if (val.includes("TOP")) {
          cell.setBackground("#DCFCE7"); // Soft green
          cell.setFontColor("#166534");
          cell.setFontWeight("bold");
          sheet.getRange(r, 1).setFontWeight("bold"); // Bold company name
        } else if (val.includes("HIGH")) {
          cell.setBackground("#FEF9C3"); // Soft yellow
          cell.setFontColor("#854D0E");
        } else if (val.includes("MEDIUM")) {
          cell.setBackground("#FFEDD5"); // Soft orange
          cell.setFontColor("#9A3412");
        }
      }
    }
    
    // Stage dropdown
    if (stageCol > 0) {
      const stageValidation = SpreadsheetApp.newDataValidation()
        .requireValueInList(["—", "Online Assessment", "Phone Screen", "Technical Round 1", "Technical Round 2", "System Design", "HR Round", "Offer Stage", "Completed"], true)
        .build();
      sheet.getRange(2, stageCol, lastRow - 1, 1).setDataValidation(stageValidation);
    }
    
    // Wrap Notes text
    if (notesCol > 0) {
      sheet.getRange(2, notesCol, lastRow - 1, 1).setWrap(true);
    }
  }
  
  // 5. Set Proportional Column Widths
  const colWidths = {
    1: 150,  // Company
    2: 240,  // Role / Position
    3: 180,  // Company Type
    4: 140,  // Funding / Stage
    5: 220,  // Tech Stack Match
    6: 180,  // Job URL / Careers Page
    7: 120,  // Application Status
    8: 100,  // Date Applied
    9: 180,  // Source / Platform
    10: 180, // LinkedIn Company Page
    11: 190, // HR / Recruiter Title
    12: 150, // Outreach Channel
    13: 110, // Follow-Up Date
    14: 110, // Last Follow-Up
    15: 110, // Response Received
    16: 140, // Interview Stage
    17: 110, // Interview Date
    18: 320, // Notes
    19: 130, // Salary Monthly
    20: 100, // Salary LPA
    21: 140, // Location
    22: 100, // Work Mode
    23: 130, // Priority
    24: 100  // Template ID
  };
  
  for (let c = 1; c <= Math.min(lastCol, 24); c++) {
    if (colWidths[c]) {
      sheet.setColumnWidth(c, colWidths[c]);
    }
  }
  
  // 6. Enable Filter if not already present
  if (!sheet.getFilter()) {
    sheet.getRange(1, 1, lastRow, lastCol).createFilter();
  }
  
  SpreadsheetApp.getUi().alert("✨ Job Tracker UI Formatted Successfully!\n\n• Navy headers & frozen top pane\n• Priority & Status colored badges\n• Interactive dropdowns enabled\n• Clean column widths & borders");
}

/**
 * Webhook endpoint: Allows Antigravity to push new jobs or status updates remotely.
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Auto-detect the job tracker sheet across all tabs
    let sheet = ss.getSheetByName("Job_Application_Tracker") || ss.getSheetByName("Job Tracker");
    if (!sheet) {
      const allSheets = ss.getSheets();
      for (let s of allSheets) {
        if (s.getLastRow() > 1 && s.getRange(1, 1).getValue().toString().toLowerCase().includes("company")) {
          sheet = s;
          break;
        }
      }
      if (!sheet) sheet = ss.getActiveSheet();
    }

    if (data.action === "format") {
      formatCurrentSheet();
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Sheet UI formatted successfully!" })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (data.action === "update_status") {
      // Find company row and update status
      const companyName = (data.company || "").trim().toLowerCase();
      const newStatus = data.status;
      const dateApplied = data.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
      
      const lastRow = sheet.getLastRow();
      for (let r = 2; r <= lastRow; r++) {
        const rowCompany = sheet.getRange(r, 1).getValue().toString().trim().toLowerCase();
        if (rowCompany === companyName || rowCompany.includes(companyName)) {
          sheet.getRange(r, 7).setValue(newStatus);
          if (newStatus === "Applied") {
            sheet.getRange(r, 8).setValue(dateApplied);
          }
          return ContentService.createTextOutput(JSON.stringify({ status: "success", updated: sheet.getRange(r, 1).getValue(), status: newStatus })).setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Company not found in sheet: " + data.company })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (data.action === "add_job") {
      // Append a new job row
      sheet.appendRow([
        data.company || "",
        data.role || "",
        data.type || "Product-Based",
        data.funding || "—",
        data.tech_stack || "",
        data.job_url || "",
        "Not Applied",
        "",
        data.source || "Scraper",
        data.linkedin || "",
        data.hr_title || "Technical Recruiter",
        "LinkedIn + Careers Page",
        "", "", "", "", "",
        data.notes || "",
        data.salary_monthly || "₹35K-₹60K",
        data.salary_lpa || "5-8 LPA",
        data.location || "Bangalore / Remote",
        data.work_mode || "Hybrid",
        data.priority || "★★★★☆ HIGH",
        "MSG-1"
      ]);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", added: data.company })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Unknown action" })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}
