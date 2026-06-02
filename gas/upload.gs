// Google Apps Script — YOLO Photo Upload API

// POST：上傳照片
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var data = JSON.parse(e.postData.contents);
    var dayFolder  = data.dayFolder;
    var itemFolder = data.itemFolder;
    var fileName   = data.fileName;
    var imageData  = data.imageData;

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

// GET：回傳每個品項的上傳張數（共用狀態）
function doGet(e) {
  try {
    var counts = {};
    var rootName = 'YOLO Training Photos';
    var rootFolders = DriveApp.getFoldersByName(rootName);
    if (!rootFolders.hasNext()) {
      return ContentService
        .createTextOutput(JSON.stringify({ success: true, counts: {} }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    var root = rootFolders.next();
    var dayFolders = root.getFolders();
    while (dayFolders.hasNext()) {
      var dayF = dayFolders.next();
      var itemFolders = dayF.getFolders();
      while (itemFolders.hasNext()) {
        var itemF = itemFolders.next();
        var folderName = itemF.getName();
        // 取品項編號（格式：CODE - 品名）
        var code = folderName.split(' - ')[0].trim();
        var files = itemF.getFiles();
        var count = 0;
        while (files.hasNext()) { files.next(); count++; }
        counts[code] = (counts[code] || 0) + count;
      }
    }
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, counts: counts }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString(), counts: {} }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
