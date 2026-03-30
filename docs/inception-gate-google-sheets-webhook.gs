const SHEET_ID = '1Kfvr0Pr3-jlWWK-VpE7xBzbR4_EnsOHESPjJiJ6YqFY';

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];

    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'timestamp',
        'first_name',
        'last_name',
        'company',
        'email',
        'source',
        'page_url',
        'user_agent',
      ]);
    }

    sheet.appendRow([
      payload.capturedAt || new Date().toISOString(),
      payload.firstName || '',
      payload.lastName || '',
      payload.company || '',
      payload.email || '',
      payload.source || '',
      payload.pageUrl || '',
      payload.userAgent || '',
    ]);

    return ContentService.createTextOutput('ok');
  } catch (error) {
    return ContentService.createTextOutput(String(error));
  }
}
