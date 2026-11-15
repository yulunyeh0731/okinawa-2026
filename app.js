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
  if (o.mapcode) a.push(`<button class="act mc" data-copy="${esc(o.mapcode)}">Mapcode ${esc(o.mapcode)}</button>`);
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

function renderTrip(){
  const day = DAYS[curDay];
  applyTheme(day);
  const t = todayStr();
  let h = `<div class="tabs" role="tablist">${DAYS.map((d, i) => `<button class="tab ${i===curDay?"on":""}" data-day="${i}" role="tab" aria-selected="${i===curDay}"><b>${d.d}</b>${d.wk}${d.date===t?'<span class="today">今天</span>':""}</button>`).join("")}</div>
  <div class="hd">${headerSvg(day)}<div class="txt"><h1>11 月 ${day.d} 日</h1><div class="route">${esc(day.route)}</div></div></div>
  <div class="facts">${day.facts.map(f => `<span class="fact ${f.warn?"warn":""}">${esc(f.t)}</span>`).join("")}</div>
  <div class="line">`;
  day.items.forEach(it => {
    if (it.type === "drive") { h += `<div class="drive"><span>${esc(it.text)}</span></div>`; return; }
    if (it.type === "fork") {
      h += `<div class="fork"><div class="q">${esc(it.q)}</div>${it.opts.map(o => `
        <div class="opt"><h4><span>${esc(o.k)}</span>${esc(o.title)}</h4><p>${esc(o.text)}</p>${o.drive ? `<p style="color:var(--w3);font-size:13px">${esc(o.drive)}</p>` : ""}
        ${foodHtml(o.food, day.date)}
        <div class="acts">${(o.acts||[]).map(a => a.mapcode ? `<button class="act mc" data-copy="${esc(a.mapcode)}">Mapcode ${esc(a.mapcode)}</button>` : a.tel ? `<a class="act" href="${telHref(a.tel)}">電話</a>` : a.map ? `<a class="act" href="${mapHref(a.map)}" target="_blank" rel="noopener">${esc(a.label || "地圖")}</a>` : `<a class="act" href="${esc(a.link)}" target="_blank" rel="noopener">${esc(a.label || "網頁")}</a>`).join("")}</div>
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
  if (day.pending) h += `<div class="pending"><b>這天的行程還在排，</b>排好會更新這頁。</div>`;
  if (day.lodge) {
    const L2 = LODGES[day.lodge];
    h += `<div class="lodge"><small>今晚住</small><b>${esc(L2.name)}</b><p>${esc(L2.note)}</p>${actsHtml({ map: L2.map })}</div>`;
  }
  const el = document.getElementById("v-trip");
  el.innerHTML = h;
  el.querySelectorAll("[data-day]").forEach(b => b.onclick = () => { curDay = +b.dataset.day; renderTrip(); window.scrollTo({ top: 0 }); });
  bindCopy(el);
  const on = el.querySelector(".tab.on"); if (on) on.scrollIntoView({ inline: "center", block: "nearest" });
}

function renderInfo(){
  const el = document.getElementById("v-info");
  el.innerHTML = `<div class="page">
    <h1>重要資訊</h1>

    <h2>訂位資料</h2>
    <div class="card"><p>租車預約號碼、機票確認碼這些不放在網頁上（網頁是公開的）。需要時打開原始表看，只有被分享的人打得開。</p>
      <a class="big-link" href="${SOURCE_SHEET}" target="_blank" rel="noopener">打開原始行程表</a></div>

    <h2>航班（台灣虎航）</h2>
    <div class="card"><dl class="kv">
      <dt>去程</dt><dd><b>IT232</b>　11/18（三）18:20 桃園 → 20:40 那霸</dd>
      <dt>回程</dt><dd><b>IT233</b>　11/23（一）21:30 那霸 → 22:05 桃園</dd>
    </dl><p style="margin-top:6px">去程在桃園第一航廈。時間都是當地時間。</p></div>

    <h2>租車（ORIX）</h2>
    <div class="card"><h3>取車　11/19（四）11:00</h3><p>おもろまち駅前店</p>${actsHtml({ map: "オリックスレンタカー おもろまち駅前店" })}</div>
    <div class="card"><h3>還車　11/23（一）19:00 前</h3><p>那覇空港店（豊見城市豊崎 1-1174），外語櫃檯。還完坐接駁車到機場約 20 分。</p>${actsHtml({ tel: "098-851-0543", map: "オリックスレンタカー 那覇空港店" })}</div>
    <div class="card"><ul>
      <li>倫：EA 級油電車，放大部分行李</li>
      <li>瑄：RD 級（X-TRAIL 級），坐 4 人</li>
      <li>兩台都有保險（含 RAP）和 ETC 卡</li>
      <li>導航輸入 Mapcode 或電話號碼最準，手冊每個點都可以直接複製 Mapcode</li>
    </ul></div>

    <h2>住宿</h2>
    ${[["11/18", "almont"], ["11/19–11/20", "coral"], ["11/21–11/22", "livele"]].map(([d, k]) => {
      const x = LODGES[k];
      return `<div class="card"><h3>${d}　${esc(x.name)}</h3><p>${esc(x.note)}</p>${actsHtml({ map: x.map })}</div>`;
    }).join("")}

    <h2>緊急</h2>
    <div class="card"><dl class="kv">
      <dt>報警</dt><dd><a href="tel:110">110</a></dd>
      <dt>救護車・火災</dt><dd><a href="tel:119">119</a></dd>
      <dt>道路救援 JAF</dt><dd><a href="tel:%238139">#8139</a></dd>
    </dl><p style="margin-top:6px">車子出狀況或擦撞，先報警，再打 ORIX 店家。</p></div>

    <h2>參考</h2>
    <div class="card"><div class="acts">
      <a class="act" href="https://veganladyiris.com/okinawa_veganfood/" target="_blank" rel="noopener">沖繩蔬食餐廳整理</a>
    </div></div>
  </div>`;
}

function bindCopy(root){
  root.querySelectorAll("[data-copy]").forEach(b => b.onclick = async () => {
    const v = b.dataset.copy;
    try { await navigator.clipboard.writeText(v); }
    catch (e) { const ta = document.createElement("textarea"); ta.value = v; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove(); }
    toast("已複製 Mapcode " + v);
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

document.querySelectorAll(".nav button").forEach(b => b.onclick = () => show(b.dataset.v));
curDay = pickInitialDay();
renderTrip();
renderInfo();
initLedger();
const h0 = (location.hash || "").slice(1);
if (["trip", "ledger", "info"].includes(h0)) show(h0);
