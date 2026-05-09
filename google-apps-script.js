// WoodHouse - Google Apps Script (обновлённая версия)
// Вставить в: Google Таблица → Расширения → Apps Script → заменить весь код

const SHEET_ID = '18vvHdaZwQqIgVbeRzGLbo6TGmk_lPskx85Rz81oZzhU';
const ADMIN_PASSWORD = 'woodhouse2025'; // пароль для админки

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheetName = data.type === 'quiz' ? 'Квиз' : 'Заявки';
    let sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      if (sheetName === 'Квиз') {
        sheet.appendRow(['Дата', 'Имя', 'Телефон', 'Тип дома', 'Площадь', 'Материал', 'Бюджет', 'Срок', 'Опции', 'Источник']);
        sheet.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#2D5016').setFontColor('#ffffff');
      } else {
        sheet.appendRow(['Дата', 'Имя', 'Телефон', 'Email', 'Источник']);
        sheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#2D5016').setFontColor('#ffffff');
      }
    }

    const now = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });

    if (sheetName === 'Квиз') {
      sheet.appendRow([now, data.name||'', data.phone||'', data.houseType||'', data.area||'', data.material||'', data.budget||'', data.deadline||'', data.options||'', data.source||'Сайт']);
    } else {
      sheet.appendRow([now, data.name||'', data.phone||'', data.email||'', data.source||'Сайт']);
    }

    sheet.autoResizeColumns(1, sheet.getLastColumn());

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  const params = e.parameter;

  // Проверка пароля для получения данных
  if (params.action === 'getData' && params.password === ADMIN_PASSWORD) {
    try {
      const ss = SpreadsheetApp.openById(SHEET_ID);
      const result = {};

      ['Квиз', 'Заявки'].forEach(sheetName => {
        const sheet = ss.getSheetByName(sheetName);
        if (!sheet) { result[sheetName] = []; return; }

        const data = sheet.getDataRange().getValues();
        if (data.length <= 1) { result[sheetName] = []; return; }

        const headers = data[0];
        result[sheetName] = data.slice(1).map(row => {
          const obj = {};
          headers.forEach((h, i) => obj[h] = row[i]);
          return obj;
        });
      });

      return ContentService
        .createTextOutput(JSON.stringify({ success: true, data: result }))
        .setMimeType(ContentService.MimeType.JSON);

    } catch (err) {
      return ContentService
        .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'WoodHouse API работает' }))
    .setMimeType(ContentService.MimeType.JSON);
}
