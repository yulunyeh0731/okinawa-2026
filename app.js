/* 手冊：行程、重要資訊、主選單 */

let curDay = null;

function todayStr(){
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`;
}
function pickInitialDay(){
  const t = todayStr();
  const i = DAYS.findIndex(d => d.date === t);
  if (i >= 0) return i;
  return t < DAYS[0].date ? 0 : DAYS.length - 1;
}

const telHref = t => "tel:+81" + t.replace(/[^\d]/g, "").replace(/^0/, "");
const mapHref = q => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q);
const weekday = date => new Date(date + "T00:00:00").getDay();

function actsHtml(o){
  const a = [];
  if (o.mapcode) a.push(`<button class="act mc" data-copy="${esc(o.mapcode)}" data-what="Mapcode">Mapcode ${esc(o.mapcode)}</button>`);
  if (o.addr) a.push(`<button class="act" data-copy="${esc(o.addr)}" data-what="地址">複製地址</button>`);
  if (o.tel) a.push(`<a class="act" href="${telHref(o.tel)}">電話</a>`);
  if (o.map) a.push(`<a class="act" href="${mapHref(o.map)}" target="_blank" rel="noopener">地圖</a>`);
  if (o.link) a.push(`<a class="act" href="${esc(o.link)}" target="_blank" rel="noopener">網頁</a>`);
  return a.length ? `<div class="acts">${a.join("")}</div>` : "";
}
function closedBadge(o, date){
  return o.closed && o.closed.includes(weekday(date)) ? `<span class="closed">今天公休</span>` : "";
}
function foodHtml(list, date){
  if (!list || !list.length) return "";
  return `<div class="food">${list.map(f => {
    const tags = (f.veg ? `<span class="veg">${esc(f.veg)}</span>` : "") + closedBadge(f, date);
    const note = [f.closedText, f.note].filter(Boolean).join("。");
    return `<div class="row"><span class="n">${f.link ? `<a href="${esc(f.link)}" target="_blank" rel="noopener">${esc(f.n)}</a>` : esc(f.n)}</span><span class="d"></span><span class="h">${esc(f.h || "")}</span></div>
    ${tags || note ? `<div class="fnote">${tags}${esc(note)}</div>` : ""}`;
  }).join("")}</div>`;
}
function headerSvg(day){
  return `<svg class="bg" viewBox="0 0 390 168" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <rect width="390" height="168" fill="url(#tile)"/>
    <rect width="390" height="168" fill="url(#fadeL)"/>
    <path d="M0 122 C60 110 110 132 180 120 C250 108 310 130 390 116 L390 168 L0 168Z" fill="var(--w1)"/>
    <path d="M0 138 C70 128 130 148 200 136 C270 124 330 144 390 134 L390 168 L0 168Z" fill="var(--w2)"/>
    <path d="M0 154 C80 146 150 162 220 152 C290 142 340 158 390 150 L390 168 L0 168Z" fill="var(--w3)"/>
    <use href="#leaf" x="306" y="110" width="26" height="52" fill="#2C7F6A" transform="rotate(-70 319 136)"/>
    <use href="#hib" x="290" y="104" width="62" height="62" fill="var(--flower)" transform="rotate(-18 321 135)"/>
  </svg>`;
}

function applyTheme(day){
  const r = document.documentElement.style;
  Object.entries(day.theme).forEach(([k, v]) => {
    const map = { w1:"--w1", w2:"--w2", w3:"--w3", flower:"--flower", te:"--te", tf:"--tf", tp:"--tp", bg:"--bg", chip:"--chip", line:"--line" };
    if (map[k]) r.setProperty(map[k], v);
  });
  document.querySelector('meta[name="theme-color"]').setAttribute("content", day.theme.w3);
}

/* ---------- 天氣（Open-Meteo，免金鑰；存在手機裡，沒網路也看得到上次的） ---------- */
const WX_ICON = c => c === 0 ? ["☀️", "晴"] : c <= 1 ? ["🌤️", "晴"] : c === 2 ? ["⛅", "晴時多雲"] : c === 3 ? ["☁️", "陰"]
  : c <= 48 ? ["🌫️", "霧"] : c <= 57 ? ["🌦️", "毛毛雨"] : c <= 63 ? ["🌧️", "雨"] : c <= 67 ? ["🌧️", "大雨"]
  : c <= 81 ? ["🌦️", "陣雨"] : c <= 82 ? ["🌧️", "大陣雨"] : ["⛈️", "雷雨"];
let WX = {}; try { WX = JSON.parse(localStorage.getItem("oki_wx") || "{}"); } catch (e) {}
function wxChip(day){
  const w = WX.days && WX.days[day.date];
  if (!w || !day.wx) return `<span class="fact wx" data-wx hidden></span>`;
  const [ic, tx] = WX_ICON(w.c);
  return `<span class="fact wx" data-wx>${ic} ${esc(day.wx.at)} ${tx} ${Math.round(w.lo)}–${Math.round(w.hi)}°${w.p != null ? `　降雨 ${w.p}%` : ""}</span>`;
}
async function loadWeather(){
  if (WX.t && Date.now() - WX.t < 2 * 3600e3) return;
  const ds = DAYS.filter(d => d.wx);
  const q = new URLSearchParams({
    latitude: ds.map(d => d.wx.lat).join(","), longitude: ds.map(d => d.wx.lon).join(","),
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    timezone: "Asia/Tokyo", start_date: DAYS[0].date, end_date: DAYS[DAYS.length - 1].date
  });
  try {
    const r = await fetch("https://api.open-meteo.com/v1/forecast?" + q);
    if (!r.ok) return;
    let j = await r.json(); if (!Array.isArray(j)) j = [j];
    const days = {};
    ds.forEach((d, k) => {
      const D = j[k] && j[k].daily; if (!D) return;
      const i = D.time.indexOf(d.date);
      if (i < 0 || D.weather_code[i] == null) return;
      days[d.date] = { c: D.weather_code[i], hi: D.temperature_2m_max[i], lo: D.temperature_2m_min[i], p: D.precipitation_probability_max[i] };
    });
    WX = { t: Date.now(), days };
    try { localStorage.setItem("oki_wx", JSON.stringify(WX)); } catch (e) {}
    const slot = document.querySelector("#v-trip [data-wx]");
    if (slot) { const tmp = document.createElement("div"); tmp.innerHTML = wxChip(DAYS[curDay]); slot.replaceWith(tmp.firstChild); }
  } catch (e) {}
}

function renderTrip(){
  const day = DAYS[curDay];
  applyTheme(day);
  const t = todayStr();
  const tabs = `<div class="tabs" role="tablist">${DAYS.map((d, i) => `<button class="tab ${i===curDay?"on":""}" data-day="${i}" role="tab" aria-selected="${i===curDay}"><b>${d.d}</b>${d.date===t?'<span class="today">今天</span>':d.wk}</button>`).join("")}</div>`;
  let h = `${installBanner()}
  <div class="hd">${headerSvg(day)}<div class="txt"><h1>11 月 ${day.d} 日</h1><div class="route">${esc(day.route)}</div></div></div>
  <div class="facts">${wxChip(day)}${day.facts.map(f => `<span class="fact ${f.warn?"warn":""}">${esc(f.t)}</span>`).join("")}</div>
  <div class="line">`;
  day.items.forEach(it => {
    if (it.type === "drive") { h += `<div class="drive"><span>${esc(it.text)}</span></div>`; return; }
    if (it.type === "fork") {
      h += `<div class="fork"><div class="q">${esc(it.q)}</div>${it.opts.map(o => `
        <div class="opt"><h4><span>${esc(o.k)}</span>${esc(o.title)}</h4><p>${esc(o.text)}</p>${o.drive ? `<p style="color:var(--w3);font-size:13px">${esc(o.drive)}</p>` : ""}
        ${foodHtml(o.food, day.date)}
        <div class="acts">${(o.acts||[]).map(a => a.mapcode ? `<button class="act mc" data-copy="${esc(a.mapcode)}" data-what="Mapcode">Mapcode ${esc(a.mapcode)}</button>` : a.addr ? `<button class="act" data-copy="${esc(a.addr)}" data-what="地址">${esc(a.label || "複製地址")}</button>` : a.tel ? `<a class="act" href="${telHref(a.tel)}">電話</a>` : a.map ? `<a class="act" href="${mapHref(a.map)}" target="_blank" rel="noopener">${esc(a.label || "地圖")}</a>` : `<a class="act" href="${esc(a.link)}" target="_blank" rel="noopener">${esc(a.label || "網頁")}</a>`).join("")}</div>
        </div>`).join("")}</div>`;
      return;
    }
    h += `<div class="stop ${it.type==="fixed"?"fixed":""}">
      ${it.time ? `<div class="t num">${esc(it.time)}</div>` : ""}
      <h3>${esc(it.title)}${closedBadge(it, day.date)}</h3>
      ${it.sub ? `<div class="sub">${esc(it.sub)}</div>` : ""}
      ${it.closedText ? `<div class="sub">${esc(it.closedText)}</div>` : ""}
      ${it.warn ? `<div class="warn">${esc(it.warn)}</div>` : ""}
      ${it.note ? `<div class="note">${esc(it.note)}</div>` : ""}
      ${it.list ? `<ul>${it.list.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
      ${foodHtml(it.food, day.date)}
      ${actsHtml(it)}
    </div>`;
  });
  h += `</div>`;
  if (day.backups && day.backups.length) {
    h += `<details class="backup"><summary>備案 <span>${day.backups.length} 個，臨時改行程或下雨時用</span></summary><div class="blist">${day.backups.map(b => `
      <div class="bitem">
        <div class="bt"><b>${esc(b.n)}</b>${closedBadge(b, day.date)}${(b.tags || []).map(t => `<span class="btag ${t === "蔬食友善" ? "veg" : ""}">${esc(t)}</span>`).join("")}</div>
        ${b.h ? `<div class="bh">${esc(b.h)}</div>` : ""}
        <p>${esc(b.note || "")}</p>
        ${actsHtml(b)}
      </div>`).join("")}</div></details>`;
  }
  if (day.pending) h += `<div class="pending"><b>這天的行程還在排，</b>排好會更新這頁。</div>`;
  if (day.lodge) {
    const L2 = LODGES[day.lodge];
    h += `<div class="lodge"><small>今晚住</small><b>${esc(L2.name)}</b><p>${esc(L2.note)}</p>${actsHtml({ addr: L2.addr, map: L2.map })}</div>`;
  }
  const el = document.getElementById("v-trip");
  el.innerHTML = tabs + `<div class="tb">${h}</div>`;
  el.querySelectorAll("[data-day]").forEach(b => b.onclick = () => { curDay = +b.dataset.day; renderTrip(); window.scrollTo({ top: 0 }); });
  bindCopy(el);
  bindInstall(el);

}

function sec(title, hint, body, open){
  return `<details class="isec"${open ? " open" : ""}><summary><b>${title}</b><span>${hint}</span></summary><div class="ibody">${body}</div></details>`;
}
function renderInfo(){
  const el = document.getElementById("v-info");
  const lodges = [["11/18", "almont"], ["11/19–11/20", "coral"], ["11/21–11/22", "livele"]].map(([d, k]) => {
    const x = LODGES[k];
    return `<div class="card"><h3>${d}　${esc(x.name)}</h3><p>${esc(x.note)}</p>${x.addr ? `<p>${esc(x.addr)}</p>` : ""}${actsHtml({ addr: x.addr, map: x.map })}</div>`;
  }).join("");
  el.innerHTML = `<div class="page">
    <h1>重要資訊</h1>
    <div style="margin-top:12px">${installButtonInfo()}</div>
    ${sec("訂位資料", "預約號碼、確認碼在原始表", `<div class="card"><p>租車預約號碼、機票確認碼這些不放在網頁上（網頁是公開的）。需要時打開原始表看，只有被分享的人打得開。</p>
      <a class="big-link" href="${SOURCE_SHEET}" target="_blank" rel="noopener">打開原始行程表</a></div>`)}
    ${sec("天氣", "那霸・名護・讀谷的預報", `<div class="card"><p>每天行程頁上方會顯示當天預報（出發前約兩週內才有，越近越準）。要看每小時的話點這裡：</p>
      <div class="acts"><a class="act" href="https://tenki.jp/forecast/10/50/9110/47201/" target="_blank" rel="noopener">那霸</a><a class="act" href="https://tenki.jp/forecast/10/50/9120/47209/" target="_blank" rel="noopener">名護・大浦</a><a class="act" href="https://tenki.jp/forecast/10/50/9110/47324/" target="_blank" rel="noopener">讀谷</a></div></div>`)}
    ${sec("航班", "去 IT232・回 IT233", `<div class="card"><dl class="kv">
      <dt>去程</dt><dd><b>IT232</b>　11/18（三）18:20 桃園 → 20:40 那霸</dd>
      <dt>回程</dt><dd><b>IT233</b>　11/23（一）21:30 那霸 → 22:05 桃園</dd>
    </dl><p style="margin-top:6px">去程在桃園第一航廈。時間都是當地時間。</p></div>`)}
    ${sec("租車（ORIX）", "11/19 取車・11/23 19:00 前還", `
      <div class="card"><h3>取車　11/19（四）11:00</h3><p>おもろまち駅前店，櫃檯在おもろまち站旁的 DFS（T Galleria 沖繩）裡</p>${actsHtml({ map: "オリックスレンタカー おもろまち駅前店" })}</div>
      <div class="card"><h3>還車　11/23（一）19:00 前</h3><p>那覇空港店（豊見城市豊崎 1-1174），外語櫃檯。店家 19:00 關門。還完坐接駁車到機場約 20 分。</p>${actsHtml({ tel: "098-851-0543", addr: "沖縄県豊見城市豊崎1-1174", map: "オリックスレンタカー 那覇空港店" })}</div>
      <div class="card"><ul>
        <li>倫：EA 級油電車，放大部分行李</li>
        <li>瑄：RD 級（X-TRAIL 級），坐 4 人</li>
        <li>兩台都有保險（含 RAP）和 ETC 卡</li>
        <li>車上導航輸入 Mapcode、電話或地址都找得到。手冊裡有 Mapcode 的點可以直接複製；沒有的話用電話，或按「複製地址」</li>
      </ul></div>`)}
    ${sec("住宿", "Almont・CORAL ISLAND・Livele", lodges)}
    ${sec("緊急電話", "報警 110・救護 119", `<div class="card"><dl class="kv">
      <dt>報警</dt><dd><a href="tel:110">110</a></dd>
      <dt>救護車・火災</dt><dd><a href="tel:119">119</a></dd>
      <dt>道路救援 JAF</dt><dd><a href="tel:%238139">#8139</a></dd>
    </dl><p style="margin-top:6px">車子出狀況或擦撞，先報警，再打 ORIX 店家。</p></div>`)}
    ${sec("參考", "沖繩蔬食餐廳整理", `<div class="card"><div class="acts"><a class="act" href="https://veganladyiris.com/okinawa_veganfood/" target="_blank" rel="noopener">沖繩蔬食餐廳整理</a></div></div>`)}
  </div>`;
  bindCopy(el);
  bindInstall(el);
}

/* ---------- 加到主畫面 ---------- */
let deferredPrompt = null;
const isStandalone = () => window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isMobile = () => isIOS() || /android/i.test(navigator.userAgent);
function canOfferInstall(){ return !isStandalone() && (deferredPrompt || isIOS() || isMobile()); }
function installBanner(){
  let dismissed = false; try { dismissed = localStorage.getItem("oki_inst_x") === "1"; } catch (e) {}
  if (!canOfferInstall() || dismissed) return "";
  return `<div class="ibanner"><span>加到手機主畫面，沒網路也能看</span><button class="ibtn" data-install>加入</button><button class="ix" data-install-x aria-label="不要再顯示">✕</button></div>`;
}
function installButtonInfo(){
  if (isStandalone()) return `<div class="card"><p>已經加到主畫面了。沒網路也看得到行程；記帳沒網路也能記，有網路時自動上傳。</p></div>`;
  return `<button class="big-link" style="width:100%;border:0" data-install>加到手機主畫面</button>
    <p class="hint" style="padding:6px 2px 0">加了之後點桌面上的扶桑花圖示就能開，沒網路也看得到行程。</p>`;
}
function bindInstall(root){
  root.querySelectorAll("[data-install]").forEach(b => b.onclick = doInstall);
  root.querySelectorAll("[data-install-x]").forEach(b => b.onclick = () => { try { localStorage.setItem("oki_inst_x", "1"); } catch (e) {} b.closest(".ibanner").remove(); });
}
async function doInstall(){
  if (deferredPrompt) {
    deferredPrompt.prompt();
    try { await deferredPrompt.userChoice; } catch (e) {}
    deferredPrompt = null;
    renderTrip(); renderInfo();
    return;
  }
  try { history.replaceState(null, "", location.pathname); } catch (e) {}
  const s = document.getElementById("sheet");
  const ios = isIOS();
  s.innerHTML = `<h2>加到主畫面<button data-close>關閉</button></h2>
    ${ios ? `<ol class="isteps">
      <li>用 <b>Safari</b> 打開這個網頁（LINE 裡點開的話，先按右下角選「用 Safari 開啟」）</li>
      <li>按畫面下方的 <b>分享</b> 按鈕 <span class="ishare" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 3v12M7 8l5-5 5 5M5 12v8h14v-8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span></li>
      <li>往下滑，選 <b>加入主畫面</b>，再按 <b>新增</b></li>
    </ol>` : `<ol class="isteps">
      <li>用 <b>Chrome</b> 打開這個網頁</li>
      <li>按右上角 <b>⋮</b></li>
      <li>選 <b>加到主畫面</b> 或 <b>安裝應用程式</b></li>
    </ol>`}
    <p class="hint" style="padding:8px 0 0">加好之後，桌面會出現扶桑花圖示。</p>`;
  s.querySelectorAll("[data-close]").forEach(b => b.onclick = closeSheet);
  openSheet();
}
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferredPrompt = e; renderTrip(); renderInfo(); });
window.addEventListener("appinstalled", () => { deferredPrompt = null; renderTrip(); renderInfo(); });

function bindCopy(root){
  root.querySelectorAll("[data-copy]").forEach(b => b.onclick = async () => {
    const v = b.dataset.copy;
    try { await navigator.clipboard.writeText(v); }
    catch (e) { const ta = document.createElement("textarea"); ta.value = v; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove(); }
    toast(b.dataset.what === "地址" ? "已複製地址，可以貼到導航" : "已複製 Mapcode " + v);
  });
}

let toastTimer = null;
function toast(msg){
  const t = document.getElementById("toast");
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
}

function show(v){
  document.querySelectorAll(".view").forEach(x => x.classList.toggle("on", x.id === "v-" + v));
document.querySelectorAll(".nav button").forEach(b => b.classList.toggle("on", b.dataset.v === v));
  if (v === "ledger") renderLedger();
  window.scrollTo({ top: 0 });
  try { history.replaceState(null, "", "#" + v); } catch (e) {}
}

/* 行程頁左右滑換天：內容跟著手指走 */
(() => {
  const el = document.getElementById("v-trip");
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let x0 = 0, y0 = 0, t0 = 0, dx = 0, lock = null, on = false;
  const tb = () => el.querySelector(".tb");
  const setX = (x, anim) => { const t = tb(); if (!t) return; t.style.transition = anim ? "transform .2s ease-out" : "none"; t.style.transform = x ? `translateX(${x}px)` : ""; };
  el.addEventListener("touchstart", e => {
    on = e.touches.length === 1 && !e.target.closest(".tabs");
    if (!on) return;
    x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; t0 = Date.now(); dx = 0; lock = null;
  }, { passive: true });
  el.addEventListener("touchmove", e => {
    if (!on) return;
    const mx = e.touches[0].clientX - x0, my = e.touches[0].clientY - y0;
    if (!lock && (Math.abs(mx) > 10 || Math.abs(my) > 10)) lock = Math.abs(mx) > Math.abs(my) * 1.3 ? "h" : "v";
    if (lock !== "h") return;
    const edge = (curDay === 0 && mx > 0) || (curDay === DAYS.length - 1 && mx < 0);
    dx = edge ? mx * 0.25 : mx;
    setX(dx, false);
  }, { passive: true });
  const end = () => {
    if (!on) return; on = false;
    if (lock !== "h") return;
    const w = el.clientWidth, dir = dx < 0 ? 1 : -1, n = curDay + dir;
    const fast = Math.abs(dx) > 40 && Math.abs(dx) / (Date.now() - t0) > 0.45;
    if ((Math.abs(dx) > w * 0.22 || fast) && n >= 0 && n < DAYS.length) {
      const go = () => {
        curDay = n; renderTrip(); window.scrollTo({ top: 0 });
        if (calm) return;
        setX(dir * w * 0.35, false); tb().getBoundingClientRect(); setX(0, true);
      };
      if (calm) go(); else { setX(-dir * w, true); setTimeout(go, 160); }
    } else setX(0, true);
  };
  el.addEventListener("touchend", end, { passive: true });
  el.addEventListener("touchcancel", end, { passive: true });
})();

document.querySelectorAll(".nav button").forEach(b => b.onclick = () => show(b.dataset.v));
curDay = pickInitialDay();
renderTrip();
loadWeather();
document.addEventListener("visibilitychange", () => { if (!document.hidden) loadWeather(); });
renderInfo();
initLedger();
const h0 = (location.hash || "").slice(1);
// 從主畫面圖示開啟時一律從行程開始（iPhone 會把加入當下的 #info 一起存進圖示）；同一次使用中重新整理則留在原頁
let firstLaunch = false;
try { firstLaunch = isStandalone() && !sessionStorage.getItem("oki_open"); sessionStorage.setItem("oki_open", "1"); } catch (e) {}
if (firstLaunch) show("trip");
else if (["trip", "ledger", "info"].includes(h0)) show(h0);
