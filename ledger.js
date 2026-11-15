/* 記帳：每一筆存「每個人最後負擔多少」（shares），三種模式只是算出 shares 的不同方法。
   後端：Google Apps Script 網頁應用程式＋試算表。GAS_URL 留空時只存在這支手機。 */

const GAS_URL = "https://script.google.com/macros/s/AKfycbw6tTrW9Vj3LYz6aZ6Jb2TMaxybLbcSydt9hHqvuNhSCJeCbwSDHePjYx9A6U5nVSwtaQ/exec";
const GAS_KEY = "oki2026-yeh";
const PEOPLE = ["倫","瑄","May","妙鳳","爸","媽","杰"];
const AFTER_SPLIT = ["倫","瑄","May","妙鳳","爸","媽"];
const FUND = "公費";
const SPLIT_DATE = "2026-11-21";
const TRIP_DATES = ["2026-11-18","2026-11-19","2026-11-20","2026-11-21","2026-11-22","2026-11-23"];

const L = {
  entries: {}, queue: [], me: null, rate: 0.2, view: "list", lastSync: null, syncing: false, online: navigator.onLine,
};

/* ---------- storage ---------- */
function lsGet(k, d){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } }
function lsSet(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
function loadLocal(){
  L.entries = lsGet("oki_entries", {});
  L.queue = lsGet("oki_queue", []);
  L.me = lsGet("oki_me", null);
  L.rate = lsGet("oki_rate", 0.2);
  L.lastSync = lsGet("oki_last", null);
}
function saveLocal(){ lsSet("oki_entries", L.entries); lsSet("oki_queue", L.queue); }

/* ---------- money helpers ---------- */
const yen = n => "¥ " + Math.round(n).toLocaleString("en-US");
const twd = n => "NT$" + Math.round(n * L.rate).toLocaleString("en-US");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/* 依權重分配整數金額，餘數依 order 順序補 1 円 */
function allocate(total, weights, order){
  const names = Object.keys(weights).filter(n => weights[n] > 0);
  const W = names.reduce((s, n) => s + weights[n], 0);
  const out = {};
  if (!W || !total) { names.forEach(n => out[n] = 0); return out; }
  let used = 0;
  names.forEach(n => { out[n] = Math.floor(total * weights[n] / W); used += out[n]; });
  let rem = total - used;
  const seq = [...order.filter(n => names.includes(n)), ...names.filter(n => !order.includes(n))];
  for (let i = 0; rem > 0; i = (i + 1) % seq.length) { out[seq[i]]++; rem--; }
  return out;
}

/* 算出每個人最後負擔 */
function computeShares(f){
  const amt = Math.round(Number(f.amount) || 0);
  if (f.mode === "custom") {
    const s = {};
    Object.entries(f.custom || {}).forEach(([n, v]) => { const x = Math.round(Number(v) || 0); if (x) s[n] = x; });
    return s;
  }
  const w = {};
  (f.parts || []).forEach(n => w[n] = (f.weights && f.weights[n]) || 1);
  const order = [f.payer, ...PEOPLE];
  const base = allocate(amt, w, order);
  if (f.mode !== "cover") return base;
  const s = { ...base };
  Object.entries(f.cover || {}).forEach(([p, by]) => {
    if (!(p in s) || !by || !by.length) return;
    const moved = s[p];
    delete s[p];
    const add = allocate(moved, Object.fromEntries(by.map(b => [b, 1])), order);
    Object.entries(add).forEach(([b, v]) => s[b] = (s[b] || 0) + v);
  });
  return s;
}
const sumShares = s => Object.values(s).reduce((a, b) => a + b, 0);

/* ---------- describe ---------- */
function describe(e){
  if (e.item === "繳公費") return `${e.payer} 繳進公費`;
  const n = (e.parts || []).length;
  if (e.mode === "custom") return `${e.payer === FUND ? "公費" : e.payer + "付"}・各自填`;
  let t = `${e.payer === FUND ? "公費" : e.payer + "付"}・${n} 人有份`;
  if (e.mode === "cover") {
    const g = coverGroups(e.cover, e.parts);
    if (g.length === 1 && g[0].by.length === 1) {
      const others = (e.parts || []).filter(p => !g[0].by.includes(p));
      if (g[0].who.length === others.length) return `${g[0].by[0]} 請客・${n} 人有份`;
    }
    if (g.length) t += "・" + g.map(x => `${x.who.join("、")}由${x.by.join("、")}出`).join("；");
  }
  return t;
}
function coverGroups(cover, parts){
  const m = {};
  Object.entries(cover || {}).forEach(([p, by]) => {
    if (parts && !parts.includes(p)) return;
    if (!by || !by.length) return;
    const k = by.join(",");
    (m[k] = m[k] || { by, who: [] }).who.push(p);
  });
  return Object.values(m).map(g => ({ by: g.by, who: PEOPLE.filter(p => g.who.includes(p)) }));
}

/* 從過去的帳自動整理出常用的「幫人出」組合 */
function coverPresets(){
  const count = {};
  Object.values(L.entries).forEach(e => {
    if (e.deleted || e.mode !== "cover") return;
    coverGroups(e.cover, e.parts).forEach(g => {
      const others = (e.parts || []).filter(p => !g.by.includes(p));
      if (g.by.length === 1 && g.who.length === others.length) return; // 全員請客不算組合，用下面的「全部由這個人出」
      const k = g.who.join(",") + ">" + g.by.join(",");
      count[k] = count[k] || { who: g.who, by: g.by, n: 0, t: 0 };
      count[k].n++; count[k].t = Math.max(count[k].t, e.updatedAt || 0);
    });
  });
  return Object.values(count).sort((a, b) => b.n - a.n || b.t - a.t).slice(0, 4);
}

/* ---------- settlement ---------- */
function settle(){
  const paid = {}, owe = {};
  Object.values(L.entries).forEach(e => {
    if (e.deleted) return;
    paid[e.payer] = (paid[e.payer] || 0) + e.amount;
    Object.entries(e.shares || {}).forEach(([n, v]) => owe[n] = (owe[n] || 0) + v);
  });
  const names = [...PEOPLE, FUND].filter(n => paid[n] || owe[n]);
  const rows = names.map(n => ({ n, owe: owe[n] || 0, paid: paid[n] || 0, net: (paid[n] || 0) - (owe[n] || 0) }));
  const cred = rows.filter(r => r.net > 0).map(r => ({ n: r.n, v: r.net })).sort((a, b) => b.v - a.v);
  const debt = rows.filter(r => r.net < 0).map(r => ({ n: r.n, v: -r.net })).sort((a, b) => b.v - a.v);
  const xfers = [];
  let i = 0, j = 0;
  while (i < debt.length && j < cred.length) {
    const v = Math.min(debt[i].v, cred[j].v);
    if (v > 0) xfers.push({ from: debt[i].n, to: cred[j].n, v });
    debt[i].v -= v; cred[j].v -= v;
    if (debt[i].v === 0) i++;
    if (cred[j].v === 0) j++;
  }
  return { rows, xfers };
}

/* ---------- sync ---------- */
function merge(list){
  (list || []).forEach(e => {
    if (!e || !e.id) return;
    const cur = L.entries[e.id];
    if (!cur || (e.updatedAt || 0) >= (cur.updatedAt || 0)) L.entries[e.id] = e;
  });
  saveLocal();
}
async function pull(){
  if (!GAS_URL) return;
  try {
    const r = await fetch(GAS_URL + "?k=" + encodeURIComponent(GAS_KEY), { cache: "no-store" });
    const j = await r.json();
    if (j.ok) { merge(j.entries); L.lastSync = Date.now(); lsSet("oki_last", L.lastSync); }
  } catch (e) { /* 沒網路就用手機裡的 */ }
}
async function flush(){
  if (!GAS_URL || !L.queue.length || L.syncing) return;
  L.syncing = true;
  const ids = [...L.queue];
  try {
    const r = await fetch(GAS_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ k: GAS_KEY, entries: ids.map(id => L.entries[id]).filter(Boolean) }) });
    const j = await r.json();
    if (j.ok) {
      L.queue = L.queue.filter(id => !ids.includes(id));
      merge(j.entries);
      L.lastSync = Date.now(); lsSet("oki_last", L.lastSync);
    }
  } catch (e) { /* 留在佇列，下次再傳 */ }
  L.syncing = false;
  saveLocal();
}
async function syncAll(){ await flush(); await pull(); renderLedger(); }

function upsert(e){
  e.updatedAt = Date.now();
  e.by = L.me || "";
  L.entries[e.id] = e;
  if (!L.queue.includes(e.id)) L.queue.push(e.id);
  saveLocal();
  renderLedger();
  flush().then(renderLedger);
}

/* ---------- render: ledger page ---------- */
function syncText(){
  if (!GAS_URL) return { t: "還沒接上雲端：目前只存在這支手機", off: true };
  if (L.queue.length) return { t: `${L.queue.length} 筆還沒上傳，有網路會自動補傳`, off: true };
  if (L.lastSync) { const d = new Date(L.lastSync); return { t: `已同步　${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`, off: false }; }
  return { t: "同步中…", off: false };
}
function liveEntries(){ return Object.values(L.entries).filter(e => !e.deleted); }

function renderLedger(){
  const el = document.getElementById("v-ledger");
  if (!el) return;
  if (!L.me) { el.innerHTML = whoAmI(); bindWho(el); return; }
  const list = liveEntries();
  const spend = list.filter(e => e.item !== "繳公費").reduce((s, e) => s + e.amount, 0);
  const st = syncText();
  let h = `<div class="lhead"><h1>記帳</h1><div class="seg"><button data-lv="list" class="${L.view==="list"?"on":""}">明細</button><button data-lv="settle" class="${L.view==="settle"?"on":""}">結算</button></div></div>
  <div class="sync ${st.off?"off":""}">${esc(st.t)}　<button class="linkbtn" data-act="sync">重新整理</button></div>`;
  if (L.view === "list") {
    h += `<div class="total"><span class="y">${yen(spend)}</span><span class="tw">約 ${twd(spend)}</span></div>`;
    if (!list.length) {
      h += `<div class="empty tilebg">還沒有任何一筆。<br>花了錢就按右下角「記一筆」，<br>只填金額和項目也可以。</div>`;
    } else {
      const byDate = {};
      list.forEach(e => (byDate[e.date] = byDate[e.date] || []).push(e));
      h += `<div class="elist">`;
      Object.keys(byDate).sort().reverse().forEach(d => {
        const arr = byDate[d].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        const dt = new Date(d + "T00:00:00");
        const sum = arr.filter(e => e.item !== "繳公費").reduce((s, e) => s + e.amount, 0);
        h += `<div class="dayh"><span>${dt.getMonth()+1}/${dt.getDate()} 週${"日一二三四五六"[dt.getDay()]}</span><span class="num">${yen(sum)}</span></div>`;
        arr.forEach(e => {
          h += `<button class="ent ${GAS_URL && L.queue.includes(e.id)?"unsynced":""}" data-edit="${e.id}"><span class="l">${esc(e.item || "（沒寫項目）")}<small>${esc(describe(e))}</small></span><span class="r">${yen(e.amount)}<small>${twd(e.amount)}</small></span></button>`;
        });
      });
      h += `</div>`;
    }
  } else {
    h += renderSettle();
  }
  h += `<button class="fab" data-act="add">＋ 記一筆</button>`;
  el.innerHTML = h;
  bindLedger(el);
}

function renderSettle(){
  const { rows, xfers } = settle();
  if (!rows.length) return `<div class="empty tilebg">記了帳之後，這裡會算出每個人要出多少、誰要轉給誰。</div>`;
  let h = `<div class="hint">日圓結算，台幣只是參考（1 円 ≈ ${L.rate} 台幣）</div>
  <div class="rtable"><div class="prow h"><div></div><div>要出</div><div>已付</div><div>差額</div></div>`;
  rows.forEach(r => {
    h += `<div class="prow"><div>${esc(r.n)}</div><div>${yen(r.owe)}</div><div>${yen(r.paid)}</div><div class="${r.net>0?"pos":r.net<0?"neg":""}">${r.net>0?"+":r.net<0?"−":""}${Math.abs(r.net).toLocaleString("en-US")}</div></div>`;
  });
  h += `</div><div class="page" style="padding-top:8px"><h2>這樣轉就清了</h2></div><div class="xfer">`;
  if (!xfers.length) h += `<div class="hint" style="padding:0">大家剛好打平，不用轉。</div>`;
  xfers.forEach(x => {
    h += `<div class="x">${esc(x.from)}<span class="arr"></span>${esc(x.to)}<span class="v">${yen(x.v)}<small>${twd(x.v)}</small></span></div>`;
  });
  h += `</div><div class="hint" style="margin-top:10px">「要出」是每個人最後該負擔的錢（幫人出的已經算進去），「已付」是他實際掏出來的錢。</div>
  <div class="page" style="padding-top:6px"><h2>其他</h2>
    <div class="card"><div class="acts"><button class="act" data-act="fund">記一筆繳公費</button><button class="act" data-act="rate">改匯率（現在 ${L.rate}）</button><button class="act" data-act="me">我不是 ${esc(L.me)}</button></div></div>
  </div>`;
  return h;
}

function whoAmI(){
  return `<div class="page"><h1>記帳</h1><p style="margin-top:8px;color:var(--ink2)">先選你是誰，之後「誰付的」會預設是你。</p>
  <div class="chips" style="margin-top:14px">${PEOPLE.map(p => `<button class="chip" data-me="${p}">${p}</button>`).join("")}</div></div>`;
}
function bindWho(el){
  el.querySelectorAll("[data-me]").forEach(b => b.onclick = () => { L.me = b.dataset.me; lsSet("oki_me", L.me); renderLedger(); });
}
function bindLedger(el){
  el.querySelectorAll("[data-lv]").forEach(b => b.onclick = () => { L.view = b.dataset.lv; renderLedger(); });
  el.querySelectorAll("[data-edit]").forEach(b => b.onclick = () => openEntry(L.entries[b.dataset.edit]));
  el.querySelectorAll("[data-act]").forEach(b => b.onclick = () => {
    const a = b.dataset.act;
    if (a === "add") openEntry(null);
    if (a === "sync") { toast("同步中…"); syncAll(); }
    if (a === "fund") openFund();
    if (a === "rate") { const v = prompt("1 日圓等於多少台幣？", L.rate); const n = parseFloat(v); if (n > 0 && n < 1) { L.rate = n; lsSet("oki_rate", n); renderLedger(); } }
    if (a === "me") { L.me = null; lsSet("oki_me", null); renderLedger(); }
  });
}

/* ---------- entry sheet ---------- */
let F = null;
function defaultDate(){
  const t = new Date(); const s = `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`;
  if (TRIP_DATES.includes(s)) return s;
  return s < TRIP_DATES[0] ? TRIP_DATES[1] : TRIP_DATES[TRIP_DATES.length - 1];
}
const defaultParts = d => d >= SPLIT_DATE ? [...AFTER_SPLIT] : [...PEOPLE];

function openEntry(e){
  if (e) {
    F = JSON.parse(JSON.stringify(e));
    F.weights = F.weights || {}; F.cover = F.cover || {}; F.custom = F.custom || (F.mode === "custom" ? { ...F.shares } : {});
    F.isNew = false;
  } else {
    const d = defaultDate();
    F = { id: uid(), createdAt: Date.now(), date: d, item: "", amount: "", payer: L.me || "倫", parts: defaultParts(d), mode: "even", weights: {}, cover: {}, custom: {}, isNew: true };
  }
  F.pick = null;
  drawSheet();
}

function drawSheet(){
  const s = document.getElementById("sheet");
  const dayChips = TRIP_DATES.map(d => { const n = +d.slice(8); return `<button class="chip small ${F.date===d?"on":""}" data-date="${d}">${n} 日</button>`; }).join("");
  s.innerHTML = `
  <h2>${F.isNew ? "記一筆" : "改這筆"}<button data-close>關閉</button></h2>
  <div class="amt"><span>¥</span><input id="f-amt" inputmode="numeric" pattern="[0-9]*" placeholder="0" value="${esc(F.amount)}" aria-label="金額（日圓）"><span class="tw" id="f-tw"></span></div>
  <div class="field"><input class="txtin" id="f-item" placeholder="項目，例如：古宇利 午餐" value="${esc(F.item)}" aria-label="項目"></div>
  <div class="field"><span class="flabel">哪一天</span><div class="chips">${dayChips}</div></div>
  <div class="field"><span class="flabel">誰付的</span><div class="chips">${[...PEOPLE, FUND].map(p => `<button class="chip ${p===FUND?"fund":""} ${F.payer===p?"on":""}" data-payer="${p}">${p}</button>`).join("")}</div></div>
  <div class="modes" role="tablist">
    <button class="${F.mode==="even"?"on":""}" data-mode="even">平分</button>
    <button class="${F.mode==="cover"?"on":""}" data-mode="cover">幫人出</button>
    <button class="${F.mode==="custom"?"on":""}" data-mode="custom">自己填</button>
  </div>
  <div class="mbody" id="f-mbody"></div>
  <div id="f-check"></div>
  <button class="save" id="f-save">${F.isNew ? "記下這筆" : "存檔"}</button>
  ${F.isNew ? "" : `<button class="del" id="f-del">刪除這筆</button>`}`;
  drawModeBody();
  const amt = s.querySelector("#f-amt"), item = s.querySelector("#f-item");
  amt.oninput = () => { F.amount = amt.value.replace(/[^\d]/g, ""); if (amt.value !== F.amount) amt.value = F.amount; drawModeBody(); };
  item.oninput = () => { F.item = item.value; };
  s.querySelectorAll("[data-date]").forEach(b => b.onclick = () => {
    const was = F.date; F.date = b.dataset.date;
    const before = defaultParts(was).join(), nowDef = defaultParts(F.date);
    if (F.parts.join() === before) F.parts = nowDef;
    drawSheet();
  });
  s.querySelectorAll("[data-payer]").forEach(b => b.onclick = () => { F.payer = b.dataset.payer; drawSheet(); });
  s.querySelectorAll("[data-mode]").forEach(b => b.onclick = () => {
    F.mode = b.dataset.mode;
    if (F.mode === "custom" && !Object.keys(F.custom).length) {
      const sh = computeShares({ ...F, mode: "even" }); F.custom = { ...sh };
    }
    drawSheet();
  });
  s.querySelector("#f-save").onclick = saveEntry;
  const del = s.querySelector("#f-del");
  if (del) del.onclick = () => { if (confirm("確定刪除這筆？")) { const e = L.entries[F.id]; e.deleted = true; upsert(e); closeSheet(); toast("已刪除"); } };
  s.querySelectorAll("[data-close]").forEach(b => b.onclick = closeSheet);
  openSheet();
  if (F.isNew) setTimeout(() => amt.focus(), 60);
}

function drawModeBody(){
  const box = document.getElementById("f-mbody"); if (!box) return;
  const amt = Math.round(Number(F.amount) || 0);
  document.getElementById("f-tw").textContent = amt ? "約 " + twd(amt) : "";
  let h = "";
  if (F.mode !== "custom") {
    h += `<span class="flabel">誰有份（${F.date >= SPLIT_DATE ? "分開後預設六人" : "分開前預設全員"}）</span>
    <div class="chips">${PEOPLE.map(p => `<button class="chip ${F.parts.includes(p)?"on":""}" data-part="${p}">${p}</button>`).join("")}</div>`;
  }
  if (F.mode === "cover") {
    const pre = coverPresets();
    h += `<div class="field"><span class="flabel">快速套用</span><div class="presets">
      ${pre.map((p, i) => `<button class="preset" data-preset="${i}">${p.who.join("、")}由${p.by.join("、")}出</button>`).join("")}
      <span class="flabel" style="width:100%;margin:4px 0 2px">全部由這個人出（請客）</span>
      ${PEOPLE.map(p => `<button class="chip small" data-all="${p}">${p}</button>`).join("")}
    </div></div>`;
  }
  const shares = computeShares({ ...F, amount: amt });
  if (F.mode === "custom") {
    h += `<span class="flabel">每個人負擔多少（日圓）</span>`;
    PEOPLE.forEach(p => {
      h += `<div class="prow2"><span class="who">${p}</span><span class="what"></span><input inputmode="numeric" data-cust="${p}" value="${F.custom[p] ? esc(F.custom[p]) : ""}" placeholder="0"></div>`;
    });
  } else {
    h += `<div class="field"><span class="flabel">${F.mode === "cover" ? "點一個人，選他的份由誰出" : "每個人負擔"}</span>`;
    F.parts.forEach(p => {
      const by = (F.cover[p] || []);
      const covered = F.mode === "cover" && by.length;
      const w = F.weights[p] || 1;
      h += `<div class="prow2"><span class="who">${p}</span><span class="what">${covered ? "由 " + by.join("、") + " 出" : ""}</span>
        ${F.mode === "even" ? `<span class="step"><button data-w="${p}" data-d="-1" aria-label="${p} 少一份">−</button><span>${w}</span><button data-w="${p}" data-d="1" aria-label="${p} 多一份">＋</button></span><span style="font-size:12px;color:var(--ink2)">份</span>` : ""}
        ${F.mode === "cover" ? `<button class="chip small ${F.pick===p?"on":""}" data-pick="${p}">${covered ? "改" : "誰出"}</button>` : ""}
        <span class="amtv">${covered ? "→" : yen(shares[p] || 0)}</span></div>`;
      if (F.mode === "cover" && F.pick === p) {
        h += `<div class="cover-pick"><div class="chips">${PEOPLE.filter(x => x !== p).map(x => `<button class="chip small ${by.includes(x)?"on":""}" data-cby="${x}">${x}</button>`).join("")}
          <button class="chip small" data-cclear="1">自己出</button></div></div>`;
      }
    });
    if (F.mode === "cover") {
      const extra = Object.keys(shares).filter(n => !F.parts.includes(n));
      extra.forEach(n => { h += `<div class="prow2"><span class="who">${n}</span><span class="what">沒有份，幫人出</span><span class="amtv">${yen(shares[n])}</span></div>`; });
      const bearers = Object.entries(shares).filter(([, v]) => v > 0);
      if (bearers.length) h += `<div class="check">結果：${bearers.map(([n, v]) => `${n} ${yen(v)}`).join("、")}</div>`;
    }
    h += `</div>`;
  }
  box.innerHTML = h;
  const tot = sumShares(shares);
  const chk = document.getElementById("f-check");
  const bad = amt && tot !== amt;
  chk.innerHTML = F.mode === "custom" && amt ? `<div class="check ${bad ? "bad" : ""}">${bad ? `加起來 ${yen(tot)}，跟總額差 ${yen(amt - tot)}` : "加起來剛好"}</div>` : (!F.parts.length && F.mode !== "custom" ? `<div class="check bad">至少要有一個人有份</div>` : "");
  document.getElementById("f-save").disabled = !amt || (F.mode === "custom" ? bad : !F.parts.length);

  box.querySelectorAll("[data-part]").forEach(b => b.onclick = () => {
    const p = b.dataset.part;
    F.parts = F.parts.includes(p) ? F.parts.filter(x => x !== p) : PEOPLE.filter(x => x === p || F.parts.includes(x));
    drawModeBody();
  });
  box.querySelectorAll("[data-w]").forEach(b => b.onclick = () => {
    const p = b.dataset.w; F.weights[p] = Math.max(1, Math.min(9, (F.weights[p] || 1) + Number(b.dataset.d))); drawModeBody();
  });
  box.querySelectorAll("[data-pick]").forEach(b => b.onclick = () => { F.pick = F.pick === b.dataset.pick ? null : b.dataset.pick; drawModeBody(); });
  box.querySelectorAll("[data-cby]").forEach(b => b.onclick = () => {
    const p = F.pick, x = b.dataset.cby; const cur = F.cover[p] || [];
    F.cover[p] = cur.includes(x) ? cur.filter(y => y !== x) : PEOPLE.filter(y => y === x || cur.includes(y));
    if (!F.cover[p].length) delete F.cover[p];
    drawModeBody();
  });
  box.querySelectorAll("[data-cclear]").forEach(b => b.onclick = () => { delete F.cover[F.pick]; F.pick = null; drawModeBody(); });
  box.querySelectorAll("[data-preset]").forEach(b => b.onclick = () => {
    const p = coverPresets()[+b.dataset.preset];
    p.who.forEach(w => { if (F.parts.includes(w)) F.cover[w] = [...p.by]; });
    drawModeBody();
  });
  box.querySelectorAll("[data-all]").forEach(b => b.onclick = () => {
    const x = b.dataset.all; F.cover = {};
    F.parts.forEach(p => { if (p !== x) F.cover[p] = [x]; });
    drawModeBody();
  });
  box.querySelectorAll("[data-cust]").forEach(inp => inp.oninput = () => {
    const v = inp.value.replace(/[^\d]/g, ""); if (inp.value !== v) inp.value = v;
    F.custom[inp.dataset.cust] = v;
    const amt2 = Math.round(Number(F.amount) || 0), tot2 = sumShares(computeShares(F)), bad2 = amt2 && tot2 !== amt2;
    document.getElementById("f-check").innerHTML = amt2 ? `<div class="check ${bad2 ? "bad" : ""}">${bad2 ? `加起來 ${yen(tot2)}，跟總額差 ${yen(amt2 - tot2)}` : "加起來剛好"}</div>` : "";
    document.getElementById("f-save").disabled = !amt2 || bad2;
  });
}

function saveEntry(){
  const amt = Math.round(Number(F.amount) || 0);
  if (!amt) return;
  const e = {
    id: F.id, createdAt: F.createdAt || Date.now(), date: F.date, item: (F.item || "").trim(), amount: amt, payer: F.payer,
    mode: F.mode, parts: F.mode === "custom" ? [] : F.parts, weights: F.mode === "even" ? F.weights : {},
    cover: F.mode === "cover" ? F.cover : {}, deleted: false
  };
  if (e.mode === "even") Object.keys(e.weights).forEach(k => { if (!e.parts.includes(k) || e.weights[k] === 1) delete e.weights[k]; });
  e.shares = computeShares({ ...F, amount: amt });
  const wasNew = F.isNew;
  upsert(e);
  closeSheet();
  toast(wasNew ? "記好了" : "已存檔");
}

function openFund(){
  const s = document.getElementById("sheet");
  s.innerHTML = `<h2>繳公費<button data-close>關閉</button></h2>
  <p style="font-size:14px;color:var(--ink2)">有人把錢交進公費錢包時記一筆。之後公費付的帳會從裡面扣，結算時算出多退少補。</p>
  <div class="amt" style="margin-top:12px"><span>¥</span><input id="g-amt" inputmode="numeric" placeholder="0" aria-label="金額"></div>
  <div class="field"><span class="flabel">誰繳的</span><div class="chips">${PEOPLE.map(p => `<button class="chip ${p===L.me?"on":""}" data-gp="${p}">${p}</button>`).join("")}</div></div>
  <button class="save" id="g-save">記下</button>`;
  let who = L.me;
  s.querySelectorAll("[data-gp]").forEach(b => b.onclick = () => { who = b.dataset.gp; s.querySelectorAll("[data-gp]").forEach(x => x.classList.toggle("on", x === b)); });
  s.querySelector("#g-save").onclick = () => {
    const amt = Math.round(Number(s.querySelector("#g-amt").value.replace(/[^\d]/g, "")) || 0);
    if (!amt || !who) return;
    upsert({ id: uid(), createdAt: Date.now(), date: defaultDate(), item: "繳公費", amount: amt, payer: who, mode: "custom", parts: [], weights: {}, cover: {}, shares: { [FUND]: amt }, deleted: false });
    closeSheet(); toast("記好了");
  };
  s.querySelectorAll("[data-close]").forEach(b => b.onclick = closeSheet);
  openSheet();
}

function openSheet(){ document.getElementById("sheet-wrap").hidden = false; document.body.style.overflow = "hidden"; }
function closeSheet(){ document.getElementById("sheet-wrap").hidden = true; document.body.style.overflow = ""; F = null; }

function initLedger(){
  loadLocal();
  renderLedger();
  document.querySelector("#sheet-wrap .sheet-bg").onclick = closeSheet;
  window.addEventListener("online", () => { L.online = true; syncAll(); });
  window.addEventListener("offline", () => { L.online = false; renderLedger(); });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) syncAll(); });
  syncAll();
}
