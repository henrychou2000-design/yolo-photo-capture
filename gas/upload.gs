// Google Apps Script — YOLO Photo Upload API

// POST：上傳照片，並更新 Script Properties 計數
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var data = JSON.parse(e.postData.contents);
    var dayFolder  = data.dayFolder;
    var itemFolder = data.itemFolder;
    var fileName   = data.fileName;
    var imageData  = data.imageData;
    var code       = data.code;

    var rootName = 'YOLO Training Photos';
    var rootFolders = DriveApp.getFoldersByName(rootName);
    var root = rootFolders.hasNext() ? rootFolders.next() : DriveApp.createFolder(rootName);

    var dayFolders = root.getFoldersByName(dayFolder);
    var dayF = dayFolders.hasNext() ? dayFolders.next() : root.createFolder(dayFolder);

    var itemFolders = dayF.getFoldersByName(itemFolder);
    var itemF = itemFolders.hasNext() ? itemFolders.next() : dayF.createFolder(itemFolder);

    var base64Data = imageData.split(',')[1];
    var imageBlob  = Utilities.newBlob(Utilities.base64Decode(base64Data), 'image/jpeg', fileName);
    var file = itemF.createFile(imageBlob);

    // 更新快取計數
    if (code) {
      var props = PropertiesService.getScriptProperties();
      var counts = JSON.parse(props.getProperty('counts') || '{}');
      counts[code] = (counts[code] || 0) + 1;
      props.setProperty('counts', JSON.stringify(counts));
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, fileId: file.getId(), fileName: fileName }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// GET：直接讀 Script Properties，不掃 Drive（< 1 秒）
function doGet(e) {
  try {
    var props = PropertiesService.getScriptProperties();
    var counts = JSON.parse(props.getProperty('counts') || '{}');
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, counts: counts }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString(), counts: {} }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 手動同步：從 Drive 重新建立計數快取（有人直接上傳 Drive 時使用）
function syncCountsFromDrive() {
  var counts = {};
  var rootName = 'YOLO Training Photos';
  var rootFolders = DriveApp.getFoldersByName(rootName);
  if (rootFolders.hasNext()) {
    var root = rootFolders.next();
    var dayFolders = root.getFolders();
    while (dayFolders.hasNext()) {
      var dayF = dayFolders.next();
      var itemFolders = dayF.getFolders();
      while (itemFolders.hasNext()) {
        var itemF = itemFolders.next();
        var code = itemF.getName().split(' - ')[0].trim();
        var files = itemF.getFiles();
        var count = 0;
        while (files.hasNext()) { files.next(); count++; }
        counts[code] = (counts[code] || 0) + count;
      }
    }
  }
  PropertiesService.getScriptProperties().setProperty('counts', JSON.stringify(counts));
  Logger.log('同步完成：' + JSON.stringify(counts));
}
