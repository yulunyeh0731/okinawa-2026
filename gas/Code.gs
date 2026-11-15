/* 第一次使用：上方選單選「授權」，按「執行」，照畫面允許存取。之後不用再按。 */
function 授權() {
  sheet_();
  SpreadsheetApp.getActive().toast("授權完成，記帳分頁已建立");
}

/* 沖繩 2026 記帳後端（Google Apps Script，綁在試算表上）
   部署：部署 → 新增部署作業 → 類型「網頁應用程式」→ 執行身分「我」→ 存取權「所有人」 */

const SHEET_NAME = "記帳";
const KEY = "oki2026-yeh";
const COLS = ["id", "日期", "項目", "金額", "誰付", "分法", "每人負擔", "記錄者", "更新時間", "已刪除", "data"];

function sheet_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(COLS);
    sh.setFrozenRows(1);
    sh.getRange("B:B").setNumberFormat("@");
  }
  if (sh.getRange("D1").getValue() === "金額(円)") sh.getRange("D1").setValue("金額");
  return sh;
}

function readAll_() {
  const v = sheet_().getDataRange().getValues();
  const out = [];
  for (let i = 1; i < v.length; i++) {
    const raw = v[i][10];
    if (!raw) continue;
    try { out.push(JSON.parse(raw)); } catch (e) {}
  }
  return out;
}

function upsert_(e) {
  if (!e || !e.id) return;
  const sh = sheet_();
  const v = sh.getDataRange().getValues();
  let row = -1;
  for (let i = 1; i < v.length; i++) { if (String(v[i][0]) === String(e.id)) { row = i + 1; break; } }
  if (row > 0) {
    let cur = {};
    try { cur = JSON.parse(v[row - 1][10] || "{}"); } catch (err) {}
    if ((cur.updatedAt || 0) > (e.updatedAt || 0)) return;
  }
  const modeName = { even: "平分", cover: "幫人出", custom: "自己填" }[e.mode] || e.mode;
  const sharesText = Object.keys(e.shares || {}).map(n => n + " " + Number(e.shares[n]).toLocaleString("en-US")).join("、") + (e.cur === "TWD" ? "（台幣）" : "");
  const money = (e.cur === "TWD" ? "NT$ " : "¥ ") + Number(e.amount || 0).toLocaleString("en-US");
  const vals = [String(e.id), e.date, e.item, money, e.payer, modeName, sharesText, e.by || "",
                new Date(e.updatedAt || Date.now()), e.deleted ? "是" : "", JSON.stringify(e)];
  if (row > 0) sh.getRange(row, 1, 1, vals.length).setValues([vals]);
  else sh.appendRow(vals);
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  if ((e.parameter.k || "") !== KEY) return json_({ ok: false, error: "key" });
  return json_({ ok: true, entries: readAll_() });
}

function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: "json" }); }
  if (body.k !== KEY) return json_({ ok: false, error: "key" });
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { (body.entries || []).forEach(upsert_); } finally { lock.releaseLock(); }
  return json_({ ok: true, entries: readAll_() });
}
