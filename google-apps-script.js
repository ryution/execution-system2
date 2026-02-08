/**
 * GOOGLE APPS SCRIPT — Execution System Form Handler
 * 
 * SETUP:
 * 1. Go to https://script.google.com and create a new project
 * 2. Paste this entire file into Code.gs
 * 3. Click Deploy → New deployment → Web app
 * 4. Set "Execute as" to "Me" and "Who has access" to "Anyone"
 * 5. Copy the deployment URL and paste it into src/config.js as sheetsWebhookUrl
 * 
 * This creates two sheets in the bound spreadsheet:
 * - "Playbook Leads" — email captures from the Playbook modal
 * - "Diagnostic Results" — full diagnostic submissions
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (!ss) {
      // If not bound to a spreadsheet, create one
      ss = SpreadsheetApp.create("Execution System Leads");
    }
    
    if (data.type === 'playbook') {
      handlePlaybook(ss, data);
    } else if (data.type === 'diagnostic') {
      handleDiagnostic(ss, data);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handlePlaybook(ss, data) {
  var sheet = ss.getSheetByName("Playbook Leads");
  
  if (!sheet) {
    sheet = ss.insertSheet("Playbook Leads");
    sheet.appendRow(["Timestamp", "Email"]);
    // Format header row
    sheet.getRange(1, 1, 1, 2).setFontWeight("bold").setBackground("#f3f4f6");
    sheet.setColumnWidth(1, 200);
    sheet.setColumnWidth(2, 300);
  }
  
  sheet.appendRow([
    data.timestamp || new Date().toISOString(),
    data.email
  ]);
}

function handleDiagnostic(ss, data) {
  var sheet = ss.getSheetByName("Diagnostic Results");
  
  if (!sheet) {
    sheet = ss.insertSheet("Diagnostic Results");
    sheet.appendRow([
      "Timestamp", "Name", "Email", "Recommendation",
      "Weakest Capacities", "Missing Levers", "All Ratings (JSON)"
    ]);
    // Format header row
    sheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#f3f4f6");
    sheet.setColumnWidth(1, 200);
    sheet.setColumnWidth(2, 150);
    sheet.setColumnWidth(3, 250);
    sheet.setColumnWidth(4, 150);
    sheet.setColumnWidth(5, 300);
    sheet.setColumnWidth(6, 250);
    sheet.setColumnWidth(7, 400);
  }
  
  sheet.appendRow([
    data.timestamp || new Date().toISOString(),
    data.name || "",
    data.email || "",
    data.recommendation || "",
    data.weakestCapacities || "",
    data.missingLevers || "",
    data.capacityRatings || ""
  ]);
}

// Test function — run this in the Apps Script editor to verify it works
function testPost() {
  var testPlaybook = {
    postData: {
      contents: JSON.stringify({
        type: "playbook",
        timestamp: new Date().toISOString(),
        email: "test@example.com"
      })
    }
  };
  
  var testDiagnostic = {
    postData: {
      contents: JSON.stringify({
        type: "diagnostic",
        timestamp: new Date().toISOString(),
        name: "Test User",
        email: "test@example.com",
        recommendation: "full_system",
        weakestCapacities: "Task Initiation, Planning & Prioritization, Time Awareness",
        missingLevers: "accountability, accountability, environment",
        capacityRatings: '{"response_inhibition":7,"emotional_regulation":6,"sustained_attention":5,"task_initiation":2,"goal_persistence":4,"planning":3,"organization":5,"time_awareness":3,"working_memory":6,"cognitive_flexibility":7,"metacognition":5}'
      })
    }
  };
  
  Logger.log("Testing playbook submission...");
  doPost(testPlaybook);
  Logger.log("Testing diagnostic submission...");
  doPost(testDiagnostic);
  Logger.log("Done! Check your spreadsheet.");
}
