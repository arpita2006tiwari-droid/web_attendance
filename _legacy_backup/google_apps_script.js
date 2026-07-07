/**
 * Google Apps Script Backend for Student Attendance Web App
 * 
 * Instructions:
 * 1. Open your Google Spreadsheet: https://docs.google.com/spreadsheets/d/1Abxx8pZRAeveqEU65aCA1_oGrKaPPlMtxEF2FFJ6jbo/edit
 * 2. Go to Extensions > Apps Script.
 * 3. Delete any default code in the editor and paste this code.
 * 4. Click the Save icon (floppy disk).
 * 5. Click the "Deploy" button at the top right, select "New deployment".
 * 6. Click the gear icon next to "Select type" and choose "Web app".
 * 7. Set:
 *    - Description: Attendance Web App API
 *    - Execute as: Me (your email)
 *    - Who has access: Anyone (This is critical so the web app can write to the sheet)
 * 8. Click "Deploy". Authorize permissions if prompted.
 * 9. Copy the generated "Web app URL" and paste it into the Web App Settings panel of the frontend.
 */

// Handle GET requests (read centers, student lists, and save attendance via encoded payload)
function doGet(e) {
  var action = e.parameter.action;

  if (action === 'get_centers') {
    return handleGetCenters();
  } else if (action === 'get_batches') {
    var center = e.parameter.center;
    if (!center) {
      return makeJsonResponse({ success: false, error: 'Missing center parameter' });
    }
    return handleGetBatches(center);
  } else if (action === 'get_students') {
    var center = e.parameter.center;
    var batch = e.parameter.batch;
    if (!center || !batch) {
      return makeJsonResponse({ success: false, error: 'Missing center or batch parameter' });
    }
    return handleGetStudents(center, batch);
  } else if (action === 'save_attendance') {
    // Attendance payload is sent as URL-encoded JSON to avoid POST redirect issues
    var payloadStr = e.parameter.payload;
    if (!payloadStr) {
      return makeJsonResponse({ success: false, error: 'Missing payload parameter' });
    }
    return handleSaveAttendance(payloadStr);
  } else {
    return makeJsonResponse({
      success: true,
      message: 'Attendance API is online.',
      usage: {
        get_centers: '?action=get_centers',
        get_batches: '?action=get_batches&center=CenterSheetName',
        get_students: '?action=get_students&center=CenterSheetName&batch=BatchName',
        save_attendance: '?action=save_attendance&payload=<JSON>'
      }
    });
  }
}

// Helper to write attendance from a URL-encoded JSON payload (GET-based save)
function handleSaveAttendance(payloadStr) {
  try {
    var payload = JSON.parse(decodeURIComponent(payloadStr));
    return writeAttendancePayload(payload);
  } catch (error) {
    return makeJsonResponse({ success: false, error: 'Invalid payload: ' + error.toString() });
  }
}

// Handle POST requests (legacy fallback — write attendance sessions)
// NOTE: Google Apps Script may redirect POST requests in some browser environments.
// The preferred method is the GET-based save_attendance action above.
function doPost(e) {
  try {
    var postData = e.postData.contents;
    if (!postData) {
      return makeJsonResponse({ success: false, error: 'No data received' });
    }
    var payload = JSON.parse(postData);
    return writeAttendancePayload(payload);
  } catch (error) {
    return makeJsonResponse({ success: false, error: error.toString() });
  }
}

// Core logic to write an attendance payload to the Attendance sheet
function writeAttendancePayload(payload) {
  try {
    var schoolCenter = payload.schoolCenter || '';
    var center = payload.center; // batch name
    var date = payload.date;
    var time = payload.time;
    var students = payload.students; // Array of { name, status }

    if (!center || !date || !time || !students || !Array.isArray(students)) {
      return makeJsonResponse({ success: false, error: 'Invalid or missing fields in payload' });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var attendanceSheet = getSheetByNameCaseInsensitive(ss, "Attendance");

    // Create the Attendance sheet if it does not exist
    if (!attendanceSheet) {
      var firstSheet = ss.getSheets()[0];
      if (firstSheet && firstSheet.getName() === "Sheet1" && firstSheet.getLastRow() === 0) {
        attendanceSheet = firstSheet;
        attendanceSheet.setName("Attendance");
      } else {
        attendanceSheet = ss.insertSheet("Attendance");
      }
    }

    var lastRow = attendanceSheet.getLastRow();
    var rowsToAppend = [];

    // If sheet is empty, add headers
    if (lastRow === 0) {
      rowsToAppend.push(["Date", "Time", "Center", "Batch", "Student Name", "Status"]);
    }

    // Prepare student attendance rows
    for (var i = 0; i < students.length; i++) {
      var student = students[i];
      rowsToAppend.push([date, time, schoolCenter, center, student.name, student.status]);
    }

    // Append rows starting below the last row
    var range = attendanceSheet.getRange(lastRow + 1, 1, rowsToAppend.length, 6);
    range.setValues(rowsToAppend);

    // Format headers if they were just added
    if (lastRow === 0) {
      var headerRange = attendanceSheet.getRange(1, 1, 1, 6);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#eff6ff");
      headerRange.setBorder(true, true, true, true, true, true);
    }

    return makeJsonResponse({ success: true, message: 'Attendance saved successfully' });
  } catch (error) {
    return makeJsonResponse({ success: false, error: error.toString() });
  }
}

// Helper to list all worksheet names excluding "Attendance"
function handleGetCenters() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheets = ss.getSheets();
    var centers = [];

    for (var i = 0; i < sheets.length; i++) {
      var name = sheets[i].getName();
      if (name !== 'Attendance') {
        centers.push(name);
      }
    }

    return makeJsonResponse({ success: true, centers: centers });
  } catch (error) {
    return makeJsonResponse({ success: false, error: error.toString() });
  }
}

// Helper to read a center sheet and return list of unique batch names
function handleGetBatches(centerName) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getSheetByNameCaseInsensitive(ss, centerName);
    if (!sheet) {
      return makeJsonResponse({ success: false, error: 'Center worksheet not found: ' + centerName });
    }

    var values = sheet.getDataRange().getValues();
    if (values.length <= 1) {
      return makeJsonResponse({ success: true, center: centerName, batches: [] });
    }

    // Find batch column index (auto-detect)
    var headers = values[0];
    var batchColIndex = 0;
    for (var j = 0; j < headers.length; j++) {
      var headerVal = String(headers[j]).toLowerCase().trim();
      if (headerVal.indexOf('batch') !== -1) {
        batchColIndex = j;
        break;
      }
    }

    var batchesMap = {};
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      if (row.length > batchColIndex) {
        var batchName = String(row[batchColIndex]).trim();
        if (batchName) {
          batchesMap[batchName] = true;
        }
      }
    }

    var batches = Object.keys(batchesMap);
    return makeJsonResponse({ success: true, center: centerName, batches: batches });
  } catch (error) {
    return makeJsonResponse({ success: false, error: error.toString() });
  }
}

// Helper to fetch and parse students for a given center worksheet and batch
function handleGetStudents(centerName, batchName) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getSheetByNameCaseInsensitive(ss, centerName);
    if (!sheet) {
      return makeJsonResponse({ success: false, error: 'Center worksheet not found: ' + centerName });
    }

    var values = sheet.getDataRange().getValues();
    if (values.length <= 1) {
      return makeJsonResponse({ success: true, center: centerName, batch: batchName, students: [], debug: 'Sheet has no data rows' });
    }

    // Find column indexes (auto-detect from headers)
    var headers = values[0];
    var batchColIndex = -1;
    var srColIndex = -1;
    var nameColIndex = -1;

    for (var j = 0; j < headers.length; j++) {
      var headerVal = String(headers[j]).toLowerCase().trim();
      // Batch column: class, grade, div, division, section, batch, group
      if (batchColIndex === -1 && (
        headerVal.indexOf('batch') !== -1 ||
        headerVal.indexOf('class') !== -1 ||
        headerVal.indexOf('grade') !== -1 ||
        headerVal.indexOf('div') !== -1 ||
        headerVal.indexOf('section') !== -1 ||
        headerVal.indexOf('group') !== -1
      )) {
        batchColIndex = j;
      }
      // Sr No column: sr, roll, no, id, adm, serial, num
      else if (srColIndex === -1 && (
        headerVal.indexOf('sr') !== -1 ||
        headerVal.indexOf('roll') !== -1 ||
        headerVal === 'no' ||
        headerVal.indexOf('s.no') !== -1 ||
        headerVal.indexOf('serial') !== -1 ||
        headerVal.indexOf('adm') !== -1 ||
        headerVal.indexOf('id') !== -1
      )) {
        srColIndex = j;
      }
      // Name column: name, student, first, last, full
      else if (nameColIndex === -1 && (
        headerVal.indexOf('name') !== -1 ||
        headerVal.indexOf('student') !== -1 ||
        headerVal.indexOf('first') !== -1 ||
        headerVal.indexOf('full') !== -1
      )) {
        nameColIndex = j;
      }
    }

    // Return debug info if we can't find key columns
    if (batchColIndex === -1 || nameColIndex === -1) {
      return makeJsonResponse({
        success: false,
        error: 'Could not auto-detect columns. Please check your sheet headers.',
        detectedHeaders: headers.map(function(h) { return String(h); }),
        batchColIndex: batchColIndex,
        nameColIndex: nameColIndex,
        srColIndex: srColIndex
      });
    }

    var students = [];
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      var rowBatchCell = row[batchColIndex];
      if (rowBatchCell === undefined || rowBatchCell === null || rowBatchCell === '') continue;

      var rowBatch = String(rowBatchCell).trim();
      if (rowBatch.toLowerCase() === batchName.toLowerCase()) {
        var srNoCell = srColIndex !== -1 ? row[srColIndex] : null;
        var srNo = isSerialNumberCell(srNoCell) ? Math.round(Number(srNoCell)) : students.length + 1;

        var nameCell = row[nameColIndex];
        if (nameCell === undefined || nameCell === null) continue;
        var name = String(nameCell).trim().replace(/\s+/g, ' ');
        if (name && name.length > 1) {
          students.push({
            srNo: srNo,
            name: name
          });
        }
      }
    }

    // Sort students by Serial Number to preserve the original sheet structure
    students.sort(function (a, b) { return a.srNo - b.srNo; });

    return makeJsonResponse({ success: true, center: centerName, batch: batchName, students: students });
  } catch (error) {
    return makeJsonResponse({ success: false, error: error.toString() });
  }
}

// Check if a cell value is a valid numeric serial number
function isSerialNumberCell(val) {
  if (val === null || val === undefined || val === "") return false;
  if (typeof val === 'number') return !isNaN(val) && val > 0;

  var valStr = String(val).trim();
  // Match integer or float representing integer (e.g. "1", "1.0", "1.00")
  return /^\d+(\.0+)?$/.test(valStr) && Number(valStr) > 0;
}

// Format API output as CORS-safe JSON response
function makeJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// Helper to get sheet by name case-insensitively with fuzzy substring support
function getSheetByNameCaseInsensitive(ss, name) {
  var sheets = ss.getSheets();
  var nameLower = name.toLowerCase().trim();

  // 1. Try exact case-insensitive match first
  for (var i = 0; i < sheets.length; i++) {
    var sheetName = sheets[i].getName().toLowerCase().trim();
    if (sheetName === nameLower) {
      return sheets[i];
    }
  }

  // 2. Try substring match (e.g., "jbcn lower" matches "JBCN Lower Parel")
  for (var i = 0; i < sheets.length; i++) {
    var sheetName = sheets[i].getName().toLowerCase().trim();
    if (nameLower.indexOf(sheetName) !== -1 || sheetName.indexOf(nameLower) !== -1) {
      return sheets[i];
    }
  }

  // 3. Try alphanumeric-only comparison to ignore formatting differences (e.g., spaces/hyphens)
  var cleanName = nameLower.replace(/[^a-z0-9]/g, '');
  for (var i = 0; i < sheets.length; i++) {
    var sheetName = sheets[i].getName().toLowerCase().trim();
    var cleanSheetName = sheetName.replace(/[^a-z0-9]/g, '');
    if (cleanName.indexOf(cleanSheetName) !== -1 || cleanSheetName.indexOf(cleanName) !== -1) {
      return sheets[i];
    }
  }

  return null;
}
