/* ============================================================
   Pet Parade 2026 — registration logger

   Paste this into a Google Apps Script bound to a Google Sheet
   (Extensions → Apps Script), then Deploy → New deployment →
   Web app → Execute as: Me → Who has access: Anyone.

   Copy the /exec URL it gives you into SHEET_URL in register.html.
   Full steps are in the README.
   ============================================================ */

var SHEET_NAME = 'Registrations';

var HEADERS = [
  'Time', 'Status', 'Name', 'Mobile', 'Email', 'City',
  'Pet', 'Breed', 'T-shirt', 'Found out via', 'Been before', 'Reg ID'
];

var ID_COL = 12;   /* 'Reg ID' — used to update a row instead of duplicating it */

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);

  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.setColumnWidth(1, 150);
  }
  return sh;
}

function doPost(e) {
  /* two people can register in the same second — serialise the writes */
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (err) {
    return json_({ ok: false, error: 'busy' });
  }

  try {
    var d = JSON.parse(e.postData.contents);
    var sh = getSheet_();

    var row = [
      new Date(),
      d.status || '',
      d.name || '',
      d.mobile ? "'" + d.mobile : '',   /* leading quote keeps it text, not a number */
      d.email || '',
      d.city || '',
      d.petName || '',
      d.breed || '',
      d.size || '',
      d.source || '',
      d.before || '',
      d.regId || ''
    ];

    /* same person moving from "filled the form" to "opened WhatsApp"
       should update their row, not add a second one */
    var rowIndex = -1;
    var lastRow = sh.getLastRow();

    if (d.regId && lastRow > 1) {
      var ids = sh.getRange(2, ID_COL, lastRow - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) {
        if (ids[i][0] === d.regId) { rowIndex = i + 2; break; }
      }
    }

    if (rowIndex > 0) {
      sh.getRange(rowIndex, 1, 1, row.length).setValues([row]);
    } else {
      sh.appendRow(row);
    }

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/* opening the /exec URL in a browser should say something friendly,
   so you can check the deployment is alive */
function doGet() {
  var sh = getSheet_();
  var count = Math.max(sh.getLastRow() - 1, 0);
  return json_({ ok: true, registrations: count });
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
