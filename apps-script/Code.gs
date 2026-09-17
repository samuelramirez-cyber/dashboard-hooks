/**
 * Radar de Hooks — puente entre el Google Sheet "Posts" y la pagina web
 * publicada en GitHub Pages.
 *
 * Instalacion (si tu cuenta SI tiene el menu Extensiones en Sheets):
 *  1. Abre tu Google Sheet (importado de Radar_de_Hooks_Datos.xlsx).
 *  2. Extensiones -> Apps Script.
 *  3. Borra el contenido de ejemplo y pega TODO este archivo.
 *  4. Deja SPREADSHEET_ID vacio ("") - un script vinculado desde Extensiones
 *     ya sabe cual es su hoja.
 *  5. Continua en el paso 6 de abajo.
 *
 * Instalacion (si tu cuenta NO tiene el menu Extensiones - ej. Workspace
 * con Apps Script restringido, pero script.google.com si funciona):
 *  1. Ve a script.google.com -> Proyecto nuevo.
 *  2. Borra el contenido de ejemplo y pega TODO este archivo.
 *  3. Copia el ID de tu Sheet: en la URL, la parte entre "/d/" y "/edit"
 *     (https://docs.google.com/spreadsheets/d/ESTE_ES_EL_ID/edit).
 *  4. Pegalo abajo en SPREADSHEET_ID, entre comillas.
 *  5. Guarda (Ctrl+S). Dale un nombre al proyecto, ej. "Radar de Hooks API".
 *  6. Implementar -> Nueva implementacion -> tipo "Aplicacion web".
 *       - Ejecutar como: Yo
 *       - Quien tiene acceso: Cualquier usuario
 *  7. Autoriza el acceso (te va a avisar que es una app no verificada -
 *     es tu propio script, dale "Avanzado" -> "Ir a [proyecto] (no seguro)" -> Permitir).
 *  8. Copia la URL que termina en /exec y pegala en el boton de configuracion (⚙)
 *     de la pagina web.
 */

// Pega aqui el ID de tu Google Sheet (entre "/d/" y "/edit" en la URL).
// Dejalo vacio SOLO si este script quedo vinculado vía Extensiones -> Apps Script.
var SPREADSHEET_ID = "";

var SHEET_NAME = "Posts";

// Opcional: proteccion basica contra quien solo tenga esta URL suelta
// (no contra alguien que abra la pagina del dashboard e inspeccione su
// codigo - eso no se puede ocultar en una pagina estatica).
// Pon aqui una palabra secreta SOLO en tu copia desplegada (nunca la subas
// a un repo publico) y pega la misma palabra en el panel ⚙ de la pagina.
// Vacio = sin proteccion.
var SHARED_TOKEN = "";

function doGet(e) {
  try {
    if (SHARED_TOKEN && (!e.parameter || e.parameter.token !== SHARED_TOKEN)) {
      return _json({ ok: false, error: "unauthorized" });
    }
    var sheet = _sheet();
    var values = sheet.getDataRange().getValues();
    var headers = values.shift();
    var data = values
      .filter(function (row) { return row.some(function (v) { return v !== "" && v !== null; }); })
      .map(function (row) {
        var obj = {};
        headers.forEach(function (h, i) { obj[h] = row[i]; });
        return obj;
      });
    return _json({ ok: true, data: data });
  } catch (err) {
    return _json({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (err) {
    return _json({ ok: false, error: "server_busy" });
  }
  try {
    var body = JSON.parse(e.postData.contents);
    if (!_checkToken(body)) return _json({ ok: false, error: "unauthorized" });

    var sheet = _sheet();
    if (body._action === "delete") {
      return _handleDelete(sheet, body.createdAt);
    }
    return _handleCreate(sheet, body);
  } catch (err) {
    return _json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function _sheet() {
  var ss = SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(SHEET_NAME);
}

function _checkToken(body) {
  if (!SHARED_TOKEN) return true;
  return body && body._token === SHARED_TOKEN;
}

function _handleCreate(sheet, body) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var createdAt = Date.now();
  var row = headers.map(function (h) {
    if (h === "createdAt") return createdAt;
    var v = body[h];
    return (v === undefined || v === null) ? "" : v;
  });
  sheet.appendRow(row);
  return _json({ ok: true, createdAt: createdAt });
}

function _handleDelete(sheet, createdAt) {
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var colIdx = headers.indexOf("createdAt");
  if (colIdx === -1) return _json({ ok: false, error: "no_createdAt_column" });
  for (var r = 1; r < values.length; r++) {
    if (String(values[r][colIdx]) === String(createdAt)) {
      sheet.deleteRow(r + 1);
      return _json({ ok: true });
    }
  }
  return _json({ ok: false, error: "not_found" });
}

function _json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
