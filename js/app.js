(function () {
  "use strict";

  const CM = window.CM;
  const L = window.CM_I18N;
  const CFG = window.CM_CONFIG || {};
  const $ = (id) => document.getElementById(id);
  const root = document.documentElement;

  const THEMES = { moneta: "Moneta", tabula: "Tabula", spectra: "Spectra", tessera: "Tessera", pura: "Pura" };
  const THEME_COLOR = { moneta: "#10302A", tabula: "#0E0E0F", spectra: "#1C1F22", tessera: "#1B2A52", pura: "#FFFFFF" };
  const FAV = ["TRY", "USD", "EUR", "GBP", "CHF", "JPY", "CNY", "RUB", "GAU", "GAG", "BTC", "ETH"];
  const REGION = { TR: "TRY", US: "USD", GB: "GBP", CA: "CAD", AU: "AUD", IN: "INR", MX: "MXN", AR: "ARS", CO: "COP", CL: "CLP", BR: "BRL", AE: "AED", EG: "EGP", SA: "SAR", MA: "MAD", CH: "CHF", TW: "TWD", HK: "HKD", JP: "JPY", CN: "CNY", RU: "RUB", UA: "UAH", KZ: "KZT", PL: "PLN", SE: "SEK", NO: "NOK", DK: "DKK" };
  const LANG_TARGET = { tr: "TRY", en: "USD", ru: "RUB", zh: "CNY", es: "EUR", de: "EUR", fr: "EUR", ar: "SAR", ja: "JPY", pt: "BRL" };
  const CRYPTO_NAMES = { BTC: "Bitcoin", ETH: "Ethereum", SOL: "Solana", XRP: "XRP", ADA: "Cardano", DOGE: "Dogecoin", BNB: "BNB", USDT: "Tether", USDC: "USD Coin", LTC: "Litecoin", DOT: "Polkadot", TRX: "TRON", AVAX: "Avalanche", LINK: "Chainlink", XLM: "Stellar", TON: "Toncoin" };
  const PROFILE_KEYS =["mid", "bank", "office", "card", "crypto", "custom"];
  const FEE_KEYS = ["spread", "commission", "fixed", "tax"];

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  function detectLang() {
    const list = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || "en"]);
    for (const l of list) { const c = String(l).slice(0, 2).toLowerCase(); if (L[c]) return c; }
    return "en";
  }
  function detectTarget(lang) {
    const tag = navigator.language || "";
    const region = (tag.split("-")[1] || "").toUpperCase();
    return REGION[region] || LANG_TARGET[lang] || "USD";
  }

  const own = (o, k) => typeof k === "string" && Object.prototype.hasOwnProperty.call(o, k);
  const raw0 = store.get("cm.v1", {});
  const saved = raw0 && typeof raw0 === "object" && !Array.isArray(raw0) ? raw0 : {};
  const lang0 = own(L, saved.lang) ? saved.lang : detectLang();
  const s = Object.assign({
    lang: lang0,
    theme: own(THEMES, root.dataset.theme) ? root.dataset.theme : "moneta",
    target: detectTarget(lang0),
    dir: "sell",
    profile: "bank",
    custom: Object.assign({}, CM.PROFILES.bank),
    text: null
  }, saved);
  const qTheme = new URLSearchParams(location.search).get("theme");
  if (own(THEMES, qTheme)) s.theme = qTheme;
  if (!own(THEMES, s.theme)) s.theme = "moneta";
  if (!own(L, s.lang)) s.lang = lang0;
  if (!own(CM.PROFILES, s.profile) && s.profile !== "custom") s.profile = "bank";
  if (s.dir !== "buy") s.dir = "sell";
  if (!s.custom || typeof s.custom !== "object") s.custom = Object.assign({}, CM.PROFILES.bank);
  if (typeof s.target !== "string" || !/^[A-Z]{3,5}$/.test(s.target)) s.target = detectTarget(s.lang);
  if (typeof s.text !== "string") s.text = L[s.lang].examples.join("\n");
  if (!Array.isArray(s.rates)) s.rates = [];
  s.rates = s.rates.filter((r) => r && typeof r.from === "string" && typeof r.to === "string").map((r) => ({ from: r.from, to: r.to, v: +r.v || 0, on: r.on !== false }));
  if (!s.usage || typeof s.usage !== "object" || Array.isArray(s.usage)) s.usage = {};
  if (!Array.isArray(s.wallet)) s.wallet = [];
  s.wallet = s.wallet.filter((x) => x && typeof x.c === "string" && isFinite(+x.a) && +x.a !== 0).map((x) => ({ id: String(x.id || Math.random()), t: +x.t || Date.now(), c: x.c, a: +x.a, n: typeof x.n === "string" ? x.n.slice(0, 60) : "" }));
  if (s.tab !== "wallet") s.tab = "calc";

  let data = store.get("cm.rates", null);
  let merged = { R: {}, spread: {}, codes: [] };
  let lex = null;
  let lines = [];
  let active = 0;
  let fetching = false;
  let loc = L[s.lang].locale;
  let fmt = { dec: ".", spaceGroup: false };
  let nfCache = {};
  let dn = null;
  const histCache = new Map();
  let histKey = "";
  let lastPair = null;
  let skipAc = false;
  let composing = false;
  let shared = false;
  let savedText = s.text;
  const ac = { open: false, items: [], idx: 0, start: 0, end: 0 };
  const canvas = document.createElement("canvas").getContext("2d");
  const CHIP_BASE = ["USD", "EUR", "GBP", "TRY", "CHF", "JPY", "RUB", "CNY"];
  const CHIP_TAIL = ["GAU", "GAG", "BTC"];

  const save = () => store.set("cm.v1", shared ? Object.assign({}, s, { text: savedText }) : s);
  const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function t(k, x) {
    const d = L[s.lang].ui;
    const v = d[k] != null ? d[k] : (L.en.ui[k] != null ? L.en.ui[k] : k);
    return x == null ? v : v.replace("{x}", x);
  }

  function nf(o) {
    const k = JSON.stringify(o);
    return nfCache[k] || (nfCache[k] = new Intl.NumberFormat(loc, o));
  }

  const isCoin = (c) => Object.prototype.hasOwnProperty.call(CM.COINS, c);
  const isCrypto = (c) => CM.CRYPTO.includes(c);
  const metalKind = (c) => (c === "GAU" || c === "XAU" || isCoin(c) ? "gold" : c === "GAG" || c === "XAG" ? "silver" : isCrypto(c) ? "crypto" : "fiat");

  function money(v, code) {
    if (!isFinite(v)) return "—";
    const a = Math.abs(v);
    if (code === "GAU" || code === "GAG") return nf({ maximumFractionDigits: a < 10 ? 3 : 2 }).format(v) + " " + t(code === "GAU" ? "gramGold" : "gramSilver");
    if (isCoin(code)) return nf({ maximumFractionDigits: a < 10 ? 2 : 1 }).format(v) + " " + t("coin_" + code);
    if (isCrypto(code)) return nf({ maximumFractionDigits: a >= 1000 ? 2 : a >= 1 ? 4 : 8 }).format(v) + " " + code;
    try {
      const o = { style: "currency", currency: code };
      if (useNarrow(code)) o.currencyDisplay = "narrowSymbol";
      if (a > 0 && a < 1) o.maximumSignificantDigits = 4;
      return nf(o).format(v);
    } catch (e) {
      return nf({ maximumFractionDigits: 2 }).format(v) + " " + code;
    }
  }
  let symCache = {};
  function useNarrow(code) {
    if (code in symCache) return symCache[code];
    let r = false;
    try {
      const part = (o) => (new Intl.NumberFormat(loc, Object.assign({ style: "currency", currency: code }, o)).formatToParts(1).find((p) => p.type === "currency") || {}).value || "";
      const sym = part({});
      const nar = part({ currencyDisplay: "narrowSymbol" });
      r = sym.toUpperCase() === code && nar && nar !== sym && !/^[$£¥]$|^kr$|^R$|^Fr/.test(nar);
    } catch (e) { r = false; }
    symCache[code] = r;
    return r;
  }
  const plain = (v) => nf({ maximumFractionDigits: Math.abs(v) < 1 ? 6 : 4 }).format(v);
  const rate = (v) => nf({ maximumSignificantDigits: 6 }).format(v);
  const pct = (v, d) => nf({ style: "percent", maximumFractionDigits: d == null ? 2 : d }).format(v);

  function codeLabel(c) { return c === "GAU" ? "Au" : c === "GAG" ? "Ag" : isCoin(c) ? t("coin_" + c) : c; }
  function curName(c) {
    if (isCoin(c)) return t("coin_" + c);
    if (c === "GAU") return t("gramGold");
    if (c === "GAG") return t("gramSilver");
    if (CRYPTO_NAMES[c]) return CRYPTO_NAMES[c];
    try { const n = dn && dn.of(c); return n && n !== c ? n : c; } catch (e) { return c; }
  }

  function ago(ms) {
    const m = Math.max(1, Math.round((Date.now() - ms) / 60000));
    if (m < 60) return t("minutes", m);
    const h = Math.round(m / 60);
    if (h < 48) return t("hours", h);
    return t("days", Math.round(h / 24));
  }

  function setLocale() {
    loc = L[s.lang].locale;
    const nav = String(navigator.language || "");
    if (s.lang !== "ar" && nav.toLowerCase().split("-")[0] === s.lang && /-[A-Za-z]{2}$/.test(nav)) {
      try { new Intl.NumberFormat(nav); loc = nav; } catch (e) {}
    }
    symCache = {};
    nfCache = {};
    try { dn = new Intl.DisplayNames([loc], { type: "currency" }); } catch (e) { dn = null; }
    try {
      const parts = new Intl.NumberFormat(loc).formatToParts(12345.6);
      const dec = parts.find((p) => p.type === "decimal");
      const grp = parts.find((p) => p.type === "group");
      fmt = { dec: dec ? dec.value : ".", spaceGroup: !!grp && /\s/.test(grp.value) };
    } catch (e) { fmt = { dec: ".", spaceGroup: false }; }
    fmt.yen = s.lang === "zh" ? "CNY" : "JPY";
  }

  function rebuildRates() {
    merged = data && data.sources ? CM.merge(data.sources) : { R: {}, spread: {}, codes: [] };
    const fiat = new Set();
    ((data && data.sources) || []).forEach((src) => {
      if (src.ok && src.R && (src.id === "frankfurter" || src.id === "erapi" || src.id === "tcmb" || src.proxy)) Object.keys(src.R).forEach((c) => fiat.add(c));
    });
    const codes = [...fiat].concat(CM.CRYPTO, ["XAU", "XAG"]).filter((c) => merged.R[c] || !data);
    lex = CM.buildLexicon(L, codes.length ? codes : FAV.concat(["XAU", "XAG"]));
    merged.fiat = fiat;
  }

  function ownPairs() {
    const p = {};
    s.rates.forEach((r) => {
      const k = r.from + ">" + r.to;
      if (r.on && r.v > 0 && r.from !== r.to && !(k in p) && !((r.to + ">" + r.from) in p)) p[k] = r.v;
    });
    return p;
  }

  function convertTo(amount, from, to) {
    if (from === to) return amount;
    const own = CM.pairRate(ownPairs(), from, to);
    if (own) return amount * own;
    return merged.R[from] && merged.R[to] ? amount * merged.R[to] / merged.R[from] : NaN;
  }

  function availCodes() {
    if (Object.keys(merged.R).length < 2) return new Set(FAV);
    return new Set([...(merged.fiat || [])].concat(CM.CRYPTO, ["GAU", "GAG", "XAU", "XAG"], Object.keys(CM.COINS)).filter((c) => merged.R[c]));
  }

  function codeText(c) {
    const n = curName(c);
    return c === "GAU" || c === "GAG" || isCoin(c) ? n : n === c ? c : c + " · " + n;
  }

  function codeOptions(selected, short) {
    const avail = availCodes();
    if (selected) avail.add(selected);
    const fav = FAV.filter((c) => avail.has(c));
    const rest = [...avail].filter((c) => !fav.includes(c)).sort();
    const opt = (c) => '<option value="' + esc(c) + '">' + esc(short ? codeLabel(c) : codeText(c)) + "</option>";
    return fav.map(opt).join("") + (rest.length ? "<option disabled>──────</option>" + rest.map(opt).join("") : "");
  }

  function wordsFor(code) {
    const w = L[s.lang].words || {};
    const metal = code === "GAU" ? "XAU" : code === "GAG" ? "XAG" : null;
    if (metal) return ((w.gram || ["g"])[0] + " " + ((w.cur && w.cur[metal]) || [metal.toLowerCase()])[0]);
    if (CM.COIN_WORDS[code]) { const cw = CM.COIN_WORDS[code]; return s.lang === "tr" ? cw[0] : cw[cw.length - 1]; }
    return code.toLowerCase();
  }

  function bump(code) {
    s.usage[code] = (s.usage[code] || 0) + 1;
    save();
  }

  function insertAt(text, a, b, glue) {
    const ta = $("input");
    const v = ta.value;
    const before = v.slice(0, a);
    const after = v.slice(b);
    const pre = !glue && before && !/[\s(]$/.test(before) ? " " : "";
    const post = /^ /.test(after) ? "" : " ";
    const str = pre + text + post;
    ta.focus();
    ta.setSelectionRange(a, b);
    skipAc = true;
    let ok = false;
    try { ok = document.execCommand("insertText", false, str); } catch (e) { ok = false; }
    if (!ok || ta.value.slice(a, a + str.length) !== str) {
      ta.value = v;
      ta.setRangeText(str, a, b, "end");
      ta.dispatchEvent(new Event("input"));
    }
    skipAc = false;
    closeAc();
  }

  function renderChips() {
    const avail = availCodes();
    const u = s.usage;
    const ranked = Object.keys(u).filter((c) => u[c] > 1).sort((a, b) => u[b] - u[a]);
    const ok = (c) => avail.has(c) || FAV.includes(c) || CHIP_BASE.includes(c);
    const fiat = [...new Set(ranked.concat(CHIP_BASE))].filter((c) => ok(c) && !CHIP_TAIL.includes(c) && metalKind(c) === "fiat").slice(0, 8);
    const list = fiat.concat(CHIP_TAIL.filter(ok));
    const label = (c) => (c === "GAU" ? t("gramGold") : c === "GAG" ? t("gramSilver") : c);
    $("chips").setAttribute("aria-label", t("insert"));
    $("chips").innerHTML = list.map((c) => '<button type="button" class="chip m-' + metalKind(c) + '" data-c="' + esc(c) + '" title="' + esc(curName(c)) + '">' + esc(label(c)) + "</button>").join("") +
      '<span class="chip more"><select aria-label="' + esc(t("more")) + '"><option value="">' + esc(t("more")) + "</option>" + codeOptions() + "</select></span>";
    chipOrder = ["GAG", "BTC"].concat(fiat.slice(4).reverse(), ["GAU"], fiat.slice(0, 4).reverse());
    fitChips();
  }

  let chipOrder = [];
  function fitChips() {
    const box = $("chips");
    if (!box.offsetParent) return;
    const chips = [...box.querySelectorAll("button.chip")];
    chips.forEach((c) => { c.hidden = false; });
    const gap = parseFloat(getComputedStyle(box).columnGap) || 0;
    const need = () => {
      const vis = [...box.children].filter((c) => !c.hidden);
      return vis.reduce((a, c) => a + c.offsetWidth, 0) + gap * Math.max(0, vis.length - 1);
    };
    const room = box.clientWidth;
    for (const code of chipOrder) {
      if (need() <= room) break;
      const el = chips.find((c) => c.dataset.c === code && !c.hidden);
      if (el) el.hidden = true;
    }
    for (let i = chips.length - 1; i >= 0 && need() > room; i--) chips[i].hidden = true;
  }

  function renderOwn() {
    const list = $("own-list");
    const opts = codeOptions(null, true);
    list.innerHTML = s.rates.map((r, i) =>
      '<li data-n="' + i + '"><label class="chk" title="' + esc(t("active")) + '"><input type="checkbox" data-k="on"' + (r.on ? " checked" : "") + '><span class="sr">' + esc(t("active")) + "</span></label>" +
      '<span class="sel"><select data-k="from">' + opts + '</select></span><span class="arw" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="#i-arrow"/></svg></span><span class="sel"><select data-k="to">' + opts + "</select></span>" +
      '<button type="button" class="icon-btn" data-k="del"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-close"/></svg><span class="sr">' + esc(t("remove")) + "</span></button>" +
      '<span class="in"><i>1 ' + esc(codeLabel(r.from)) + ' =</i><input data-k="v" inputmode="decimal" autocomplete="off" value="' + esc(r.v ? nf({ maximumSignificantDigits: 8, useGrouping: false }).format(r.v) : "") + '"><i>' + esc(codeLabel(r.to)) + "</i></span></li>").join("");
    list.querySelectorAll("li").forEach((li) => {
      const r = s.rates[+li.dataset.n];
      li.querySelector('[data-k="from"]').value = r.from;
      li.querySelector('[data-k="to"]').value = r.to;
    });
    list.querySelectorAll("select").forEach((el) => el.setAttribute("aria-label", t(el.dataset.k === "from" ? "ownRates" : "target") + " · " + el.value));
    list.querySelectorAll('input[data-k="v"]').forEach((el) => el.setAttribute("aria-label", t("ownRate")));
    ownCount();
  }

  function ownCount() {
    const n = Object.keys(ownPairs()).length;
    $("own-count").textContent = n ? String(n) : "";
  }

  function recalc() {
    evalAll();
    renderEditor();
    renderResult();
  }

  function caretBox(start) {
    const ta = $("input");
    const cs = getComputedStyle(ta);
    canvas.font = cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily;
    const v = ta.value;
    const ls = v.lastIndexOf("\n", start - 1) + 1;
    const line = v.slice(0, start).split("\n").length - 1;
    const x = canvas.measureText(v.slice(ls, start)).width - ta.scrollLeft;
    return { x: ta.offsetLeft + Math.max(0, x), y: ta.offsetTop + (parseFloat(cs.paddingTop) || 0) + (line + 1) * LH };
  }

  function wordAtCaret() {
    const ta = $("input");
    const pos = ta.selectionStart;
    if (pos !== ta.selectionEnd) return null;
    const v = ta.value;
    let i = pos;
    while (i > 0 && /[\p{L}_]/u.test(v[i - 1])) i--;
    const w = v.slice(i, pos);
    if (!w || /[\p{L}\d_]/u.test(v[pos] || "")) return null;
    const cjk = /[぀-ヿ㐀-鿿]/.test(w);
    if (cjk) {
      for (let k = Math.min(4, w.length); k > 0; k--) {
        const tail = w.slice(-k);
        if (suggest(tail).length) return { w: tail, start: pos - k, end: pos };
      }
      return null;
    }
    if (w.length < 2) return null;
    return { w, start: i, end: pos };
  }

  function suggest(w) {
    const p = w.replace(/İ/g, "i").toLowerCase();
    if (!lex || lex.map.has(p) || lines.some((l) => l.name === p)) return [];
    const mine = new Set([].concat.apply([], Object.values((L[s.lang].words || {}).cur || {})));
    const has = Object.keys(merged.R).length > 1;
    const best = new Map();
    lex.map.forEach((e, k) => {
      if ((e.t !== "cur" && e.t !== "metal") || !k.startsWith(p) || !/^\p{L}/u.test(k)) return;
      const code = e.t === "metal" ? CM.METAL_GRAM[e.c] : e.c;
      if (has && !merged.R[code]) return;
      const fi = FAV.indexOf(code);
      const score = (mine.has(k) ? 60 : 0) + (k === code.toLowerCase() ? 40 : 0) + (s.usage[code] || 0) * 6 + (fi >= 0 ? 24 - fi : 0) - k.length;
      const prev = best.get(code);
      if (!prev || prev.score < score) best.set(code, { k, code, score });
    });
    const out = [...best.values()].sort((a, b) => b.score - a.score);
    const names = new Set();
    lines.forEach((l) => { if (l.name && l.name.startsWith(p) && l.name !== p) names.add(l.name); });
    names.forEach((n) => out.unshift({ k: n, v: true, score: 999 }));
    return out.slice(0, 6);
  }

  function closeAc() {
    if (!ac.open) return;
    ac.open = false;
    $("ac").hidden = true;
    $("input").removeAttribute("aria-activedescendant");
    renderResult();
  }

  function drawAc() {
    const el = $("ac");
    el.innerHTML = ac.items.map((it, i) =>
      '<li role="option" id="ac-' + i + '" aria-selected="' + (i === ac.idx) + '" data-n="' + i + '"><b>' + esc(it.k) + "</b><span>" +
      esc(it.v ? t("variable") : codeText(it.code)) + "</span></li>").join("");
    $("input").setAttribute("aria-activedescendant", "ac-" + ac.idx);
  }

  function updateAc() {
    if (composing) return;
    if (skipAc) return closeAc();
    const hit = wordAtCaret();
    const items = hit && lex ? suggest(hit.w) : [];
    if (!items.length) return closeAc();
    const keep = ac.open && ac.start === hit.start ? Math.min(ac.idx, items.length - 1) : 0;
    Object.assign(ac, { open: true, items, idx: keep, start: hit.start, end: hit.end });
    const box = caretBox(hit.start);
    const el = $("ac");
    el.hidden = false;
    drawAc();
    const max = $("ed").clientWidth - el.offsetWidth;
    el.style.left = Math.max(0, Math.min(box.x, max)) + "px";
    el.style.top = box.y + "px";
  }

  function acceptAc(i) {
    const it = ac.items[i];
    if (!it) return;
    closeAc();
    if (it.code) bump(it.code);
    insertAt(it.k, ac.start, ac.end, true);
  }

  function b64e(str) {
    let bin = "";
    new TextEncoder().encode(str).forEach((b) => { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function b64d(str) {
    const bin = atob(str.replace(/-/g, "+").replace(/_/g, "/"));
    return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
  }

  function flash(btn, label) {
    const use = btn.querySelector("use");
    const sr = btn.querySelector(".sr");
    if (!btn.dataset.icon) { btn.dataset.icon = use.getAttribute("href"); btn.dataset.label = sr.dataset.i || ""; }
    clearTimeout(btn._t);
    use.setAttribute("href", "#i-check");
    sr.textContent = label;
    $("status").textContent = label;
    btn._t = setTimeout(() => {
      use.setAttribute("href", btn.dataset.icon);
      sr.textContent = btn.dataset.label ? t(btn.dataset.label) : "";
      renderStatus();
    }, 1600);
  }

  function loadShare() {
    if (!/^#(to=|t=)/.test(location.hash)) return false;
    const h = new URLSearchParams(location.hash.slice(1));
    let ok = false;
    const to = h.get("to") || "";
    if (/^[A-Z]{3,5}$/.test(to)) { s.target = to; ok = true; }
    try {
      const txt = h.get("t") ? b64d(h.get("t")) : "";
      if (txt) { if (!shared) savedText = s.text; s.text = txt.slice(0, 20000); shared = true; ok = true; }
    } catch (e) {}
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
    return ok;
  }

  async function copyText(txt) {
    try { await navigator.clipboard.writeText(txt); return; } catch (e) {}
    const r = document.createElement("textarea");
    r.value = txt;
    document.body.appendChild(r);
    r.select();
    try { document.execCommand("copy"); } catch (x) {}
    r.remove();
  }

  function openOwn(focusIndex) {
    $("own").open = true;
    if (matchMedia("(max-width: 760px)").matches) openRail(true);
    const li = $("own-list").querySelector('li[data-n="' + focusIndex + '"] input[data-k="v"]');
    if (li) { li.scrollIntoView({ block: "nearest" }); li.focus(); li.select(); }
  }

  function feesIn(code) {
    const f = Object.assign({}, fees());
    const fx = convertTo(Math.max(0, +f.fixed || 0), s.target, code);
    f.fixed = isFinite(fx) ? fx : 0;
    return f;
  }

  function fees() {
    return s.profile === "custom" ? s.custom : CM.PROFILES[s.profile] || CM.PROFILES.mid;
  }

  function evalAll() {
    const R = merged.R;
    lines = CM.evalDocument(s.text, { lex, R, target: s.target, fmt, pairs: ownPairs() });
  }

  function tokCls(tk, vars) {
    switch (tk.t) {
      case "num": return "t-num";
      case "cur": return "t-cur m-" + metalKind(tk.c);
      case "metal": return "t-cur m-" + metalKind(tk.c);
      case "gram": case "oz": return "t-unit";
      case "to": return "t-to";
      case "id": return vars.has(tk.v) ? "t-var" : "t-bad";
      case "bad": return "t-bad";
      default: return "t-op";
    }
  }

  function renderEditor() {
    const raw = s.text.split("\n");
    const vars = new Set();
    let hl = "";
    let out = "";
    const hasRates = Object.keys(merged.R).length > 1;
    raw.forEach((line, i) => {
      const p = lines[i] || { kind: "empty", tokens: [] };
      let h = "";
      if (p.kind === "label") h = '<span class="t-lbl">' + esc(line) + "</span>";
      else if (p.kind === "empty") h = esc(line);
      else {
        let pos = 0;
        if (p.labelEnd) { h += '<span class="t-lbl">' + esc(line.slice(0, p.labelEnd)) + "</span>"; pos = p.labelEnd; }
        p.tokens.forEach((tk, k) => {
          if (tk.s < pos) return;
          const c = p.name && k === 0 && tk.t === "id" ? "t-var" : tokCls(tk, vars);
          h += esc(line.slice(pos, tk.s)) + '<span class="' + c + '">' + esc(line.slice(tk.s, tk.e)) + "</span>";
          pos = tk.e;
        });
        h += esc(line.slice(pos));
      }
      if (p.name && p.kind !== "error") vars.add(p.name);
      hl += h + "\n";
      let r = "";
      let cls = "";
      const nc = netCalc(p);
      if (p.res) r = p.res.scalar ? (p.value && p.value.k === "p" ? pct(p.value.n, 4) : plain(p.res.total)) : money(nc ? nc.gross : p.res.total, p.target);
      else if (p.kind === "error") {
        if (!hasRates && p.err.k === "rate") { r = "…"; cls = "wait"; }
        else { r = "·"; cls = "err"; }
      }
      const pick = i === active && p.res && !p.res.scalar
        ? '<span class="to-pick" title="' + esc(t("target")) + '">' + esc(codeLabel(p.target)) + '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-chev"/></svg><select data-n="' + i + '" aria-label="' + esc(t("target")) + '">' + pickOptions() + "</select></span>"
        : "";
      out += '<li class="' + cls + (i === active ? " on" : "") + '" data-n="' + i + '"' + (cls === "err" ? ' title="' + esc(errText(p.err)) + '"' : "") + '><span class="v">' + pick + esc(r) + "</span></li>";
    });
    let sum = 0;
    let n = 0;
    lines.forEach((p) => {
      if (p.kind === "expr" && p.res && !p.res.scalar) {
        const nc = netCalc(p);
        const v = convertTo(nc ? nc.gross : p.res.total, p.target, s.target);
        if (!isFinite(v)) return;
        sum += v;
        n++;
      }
    });
    if (n > 1) out += '<li class="sum"><span>' + esc(t("total")) + "</span> " + esc(money(sum, s.target)) + "</li>";
    $("hl").innerHTML = hl + " ";
    $("out").innerHTML = out;
    const ps = $("out").querySelector(".to-pick select");
    if (ps) ps.value = lines[+ps.dataset.n].target;
    sizeEditor(raw.length);
    placeBand();
  }

  function errText(e) {
    if (!e) return "";
    if (e.k === "rate") return t("err_rate", codeLabel(e.x));
    if (e.k === "unknown") return t("err_unknown", e.x);
    return t("err_" + e.k);
  }

  let LH = 32;
  function sizeEditor(n) {
    const ta = $("input");
    LH = parseFloat(getComputedStyle(ta).lineHeight) || 32;
    const pad = parseFloat(getComputedStyle(ta).paddingTop) || 0;
    ta.style.minHeight = Math.max(n + 2, 4) * LH + pad * 2 + "px";
  }
  function placeBand() {
    const pad = parseFloat(getComputedStyle($("input")).paddingTop) || 0;
    $("band").style.transform = "translateY(" + (pad + active * LH) + "px)";
    $("band").style.height = LH + "px";
  }

  function caretLine() {
    const ta = $("input");
    return ta.value.slice(0, ta.selectionStart).split("\n").length - 1;
  }

  function pickLine() {
    const ok = (p) => p && (p.res || p.kind === "error");
    if (ok(lines[active])) return lines[active];
    for (let i = active - 1; i >= 0; i--) if (lines[i] && lines[i].res) return lines[i];
    for (let i = active + 1; i < lines.length; i++) if (lines[i] && lines[i].res) return lines[i];
    return null;
  }

  let lastVal = "";
  function renderResult() {
    const p = pickLine();
    if (ac.open && p && p.kind === "error" && p === lines[active]) return;
    const has = !!p;
    $("empty").hidden = has;
    $("res").hidden = !has;
    if (!has) return;
    const rawLine = s.text.split("\n")[lines.indexOf(p)] || "";
    $("res-expr").textContent = rawLine.trim();
    const blocks = ["comp-block", "src-block", "hist-block"];
    if (p.kind === "error") {
      const waiting = p.err.k === "rate" && Object.keys(merged.R).length < 2;
      $("res-label").textContent = "";
      setVal(waiting ? t("loading") : errText(p.err), true);
      $("res-sub").textContent = "";
      $("brk").innerHTML = "";
      blocks.forEach((b) => ($(b).hidden = true));
      return;
    }
    const res = Object.assign({ target: p.target }, p.res);
    if (res.scalar) {
      $("res-label").textContent = "";
      setVal(p.value && p.value.k === "p" ? pct(p.value.n, 4) : plain(res.total));
      $("res-sub").textContent = "";
      $("brk").innerHTML = "";
      blocks.forEach((b) => ($(b).hidden = true));
      return;
    }
    const nc = netCalc(p);
    if (nc) {
      const lbl = t(s.dir === "buy" ? "netBuy" : "netSell");
      $("res-label").textContent = lbl;
      setVal(money(nc.gross, res.target));
      $("res-sub").textContent = t("mid") + " " + money(nc.mid, res.target);
      const rows = [[t("mid"), money(nc.mid, res.target), "mid"]];
      if (nc.cost) rows.push([t("cost"), money(nc.cost, res.target) + " · " + pct(nc.pct), "cost"]);
      rows.push([lbl, money(nc.gross, res.target), "net"]);
      $("brk").innerHTML = rows.map((r) => '<div class="' + r[2] + '"><dt>' + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd></div>").join("");
      $("comp-block").hidden = true;
    }
    const f = CM.applyFees(res, feesIn(res.target), s.dir);
    const feeOn = f.cost > 0;
    if (nc) {
      const from0 = res.comps.filter((x) => x.c !== res.target).sort((a, b) => Math.abs(b.v) - Math.abs(a.v))[0];
      const fr = from0 ? from0.c : (res.target === "USD" ? "EUR" : "USD");
      $("src-block").hidden = false;
      renderSources(pairList(res, fr), res.target);
      $("hist-block").hidden = false;
      renderHistory(fr, res.target);
      return;
    }
    const baseLabel = feeOn ? t(s.dir === "buy" ? "net_buy" : "net_sell") : res.comps.some((x) => x.own) ? t("ownRate") : t("mid");
    const flow = changeKind(res);
    $("res-label").textContent = flow ? t(flow) + " · " + baseLabel : baseLabel;
    $("res-label").classList.toggle("owed", flow === "stillOwed");
    setVal(money(feeOn ? f.net : f.mid, res.target));
    $("res-sub").textContent = feeOn ? t("mid") + " " + money(f.mid, res.target) : "";
    renderBreakdown(f, res.target);
    renderComposition(res);
    const main = res.comps.filter((x) => x.c !== res.target).sort((a, b) => Math.abs(b.v) - Math.abs(a.v))[0];
    const from = main ? main.c : (res.target === "USD" ? "EUR" : "USD");
    $("src-block").hidden = false;
    renderSources(pairList(res, from), res.target);
    $("hist-block").hidden = false;
    renderHistory(from, res.target);
  }

  function changeKind(res) {
    if (!res || res.scalar || !res.comps) return "";
    const pos = res.comps.some((x) => x.v > 0);
    const neg = res.comps.some((x) => x.v < 0);
    if (!pos || !neg) return "";
    return res.total < 0 ? "stillOwed" : "changeDue";
  }

  function netCalc(p) {
    if (!p || !p.net || !p.res || p.res.scalar || !isFinite(p.res.total) || !p.res.comps.some((x) => x.c !== p.target)) return null;
    const fe = fees();
    const own = p.res.comps.some((x) => x.own);
    const sp = own ? 0 : Math.max(0, +fe.spread || 0) / 100;
    const cm = Math.max(0, +fe.commission || 0) / 100;
    const tx = Math.max(0, +fe.tax || 0) / 100;
    const fx = convertTo(Math.max(0, +fe.fixed || 0), s.target, p.target);
    const fixed = isFinite(fx) ? fx : 0;
    const mid = p.res.total;
    let gross;
    if (s.dir === "buy") {
      const k = (1 + sp / 2) * (1 + cm) + tx;
      gross = Math.max(0, (mid - fixed) / k);
    } else {
      const k = (1 - sp / 2) * (1 - cm) - tx;
      gross = k > 0 ? (mid + fixed) / k : NaN;
    }
    const cost = Math.abs(gross - mid);
    return { gross, mid, cost, pct: mid ? cost / Math.abs(mid) : 0 };
  }

  function setVal(text, isMsg) {
    const el = $("res-val");
    el.classList.toggle("msg", !!isMsg);
    if (text === lastVal) return;
    lastVal = text;
    el.textContent = text;
    el.classList.remove("tick");
    void el.offsetWidth;
    el.classList.add("tick");
  }

  function renderBreakdown(f, code) {
    const sign = s.dir === "buy" ? "+" : "−";
    const fe = fees();
    const rows = [[t("mid"), money(f.mid, code), "mid"]];
    if (f.spread) rows.push([t("spread") + " " + pct(fe.spread / 100), sign + " " + money(f.spread, code)]);
    if (f.commission) rows.push([t("commission") + " " + pct(fe.commission / 100), sign + " " + money(f.commission, code)]);
    if (f.fixed) rows.push([t("fixed"), sign + " " + money(f.fixed, code)]);
    if (f.tax) rows.push([t("tax") + " " + pct(fe.tax / 100), sign + " " + money(f.tax, code)]);
    if (f.cost) {
      rows.push([t("cost"), money(f.cost, code) + " · " + pct(f.pct), "cost"]);
      rows.push([t(s.dir === "buy" ? "net_buy" : "net_sell"), money(f.net, code), "net"]);
    }
    $("brk").innerHTML = rows.map((r) => '<div class="' + (r[2] || "") + '"><dt>' + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd></div>").join("");
  }

  function renderComposition(res) {
    const parts = res.comps.filter((x) => x.v);
    const tot = parts.reduce((a, x) => a + Math.abs(x.v), 0);
    $("comp-block").hidden = parts.length < 2 || !tot;
    if ($("comp-block").hidden) return;
    let k = 0;
    const segs = parts.map((x) => {
      const share = Math.abs(x.v) / tot;
      const kind = metalKind(x.c);
      const col = kind === "fiat" || kind === "crypto" ? "s" + (k++ % 5 + 1) : kind;
      return { x, share, col };
    });
    $("strip").innerHTML = segs.map((g) => '<span class="c-' + g.col + (g.x.v < 0 ? " neg" : "") + '" style="flex:' + g.share.toFixed(4) + '"></span>').join("");
    $("legend").innerHTML = segs.map((g) =>
      '<li><i class="c-' + g.col + (g.x.v < 0 ? " neg" : "") + '"></i><b>' + esc(money(g.x.a, g.x.c)) + "</b><span>" + esc((g.x.v < 0 ? "−" : "") + pct(g.share, 1)) + "</span></li>").join("");
  }

  function quotesFor(srcs, from, to) {
    const out = [];
    const metal = metalKind(from) === "gold" || metalKind(from) === "silver";
    srcs.forEach((src) => {
      if (!src.ok || !src.R || !src.R[from]) return;
      if (src.id === "goldapi" && !metal) return;
      if (!src.R[to] && !metal) return;
      const rt = src.R[to] || merged.R[to];
      if (!rt) return;
      out.push({ id: src.id, name: src.name, v: rt / src.R[from], cross: !src.R[to] });
    });
    return out;
  }

  function pairList(res, first) {
    const rest = res.comps.filter((x) => x.c !== res.target).sort((a, b) => Math.abs(b.v) - Math.abs(a.v)).map((x) => x.c);
    return [first].concat(rest);
  }

  function renderSources(froms, to) {
    const srcs = (data && data.sources) || [];
    const list = froms.filter((c, i) => c !== to && froms.indexOf(c) === i && merged.R[c]);
    if (!list.length) list.push(to === "USD" ? "EUR" : "USD");
    $("src-list").innerHTML = list.map((from, i) => sourceBlock(srcs, from, to, i === 0)).join("");
    const used = new Set();
    list.forEach((from) => quotesFor(srcs, from, to).forEach((x) => used.add(x.id)));
    const idle = srcs.filter((src) => !src.ok);
    if (idle.length) {
      $("src-list").insertAdjacentHTML("beforeend", '<ul class="srcs idle">' + idle.map((src) =>
        '<li class="off"><span class="nm">' + esc(src.name) + '</span><span class="tm"></span><span class="vl">' + esc(t("failed")) + "</span></li>").join("") + "</ul>");
    }
  }

  function sourceBlock(srcs, from, to, primary) {
    const q = quotesFor(srcs, from, to);
    const mid = merged.R[to] / merged.R[from];
    const ownV = CM.pairRate(ownPairs(), from, to);
    const mine = ownV > 0;
    const eff = mine ? ownV : mid;
    if (primary) lastPair = { from, to, v: eff };
    let rail = "";
    if (q.length) {
      const all = q.map((x) => x.v).concat(mid, mine ? eff : mid);
      let lo = Math.min.apply(null, all);
      let hi = Math.max.apply(null, all);
      const padv = Math.max((hi - lo) * 0.35, mid * 0.0008);
      lo -= padv; hi += padv;
      const X = (v) => ((v - lo) / (hi - lo)) * 100;
      let g = '<line class="base" x1="0" y1="20" x2="100" y2="20"/>';
      for (let i = 0; i <= 10; i++) g += '<line class="tick" x1="' + i * 10 + '" y1="' + (i % 5 ? 17 : 15) + '" x2="' + i * 10 + '" y2="20"/>';
      q.forEach((x) => { const xx = X(x.v).toFixed(2); g += '<line class="src" x1="' + xx + '" y1="4" x2="' + xx + '" y2="20"/>'; });
      const mx = X(mid);
      g += '<line class="med" x1="' + (mx - 0.35).toFixed(2) + '" y1="0" x2="' + (mx - 0.35).toFixed(2) + '" y2="20"/><line class="med" x1="' + (mx + 0.35).toFixed(2) + '" y1="0" x2="' + (mx + 0.35).toFixed(2) + '" y2="20"/>';
      if (mine) { const ox = X(eff).toFixed(2); g += '<line class="own" x1="' + ox + '" y1="0" x2="' + ox + '" y2="20"/>'; }
      const at = (x) => "left:" + x.toFixed(2) + "%;transform:translateX(" + (x < 12 ? "0" : x > 88 ? "-100%" : "-50%") + ")";
      const ends = [];
      const tags = q.slice().sort((a, b) => a.v - b.v).map((x) => {
        const name = x.name.split(/[\s-]/)[0];
        const cx = X(x.v);
        const w = name.length * 1.7 + 3;
        const left = cx < 12 ? cx : cx > 88 ? cx - w : cx - w / 2;
        let row = ends.findIndex((e) => left > e);
        if (row < 0) { row = ends.length; ends.push(0); }
        ends[row] = left + w;
        return '<span class="tag" style="top:' + (2 + row * 15) + "px;" + at(cx) + '">' + esc(name) + "</span>";
      }).join("");
      const tagH = Math.max(1, ends.length) * 15 + 6;
      rail = '<div class="srail" aria-hidden="true"><div class="tags" style="height:' + tagH + 'px">' + tags + '</div><svg viewBox="0 0 100 22" preserveAspectRatio="none">' + g +
        '</svg><div class="scale"><span>' + esc(rate(lo)) + '</span><b style="' + at(mx) + '">' + esc(rate(mid)) + "</b><span>" + esc(rate(hi)) + "</span></div></div>";
    }
    const dev = q.length > 1 ? (Math.max.apply(null, q.map((x) => x.v)) - Math.min.apply(null, q.map((x) => x.v))) / mid : 0;
    let html = mine ? '<li class="own"><span class="nm">' + esc(t("ownRate")) + '</span><span class="tm">' + esc(isFinite(mid) && mid > 0 ? pct(eff / mid - 1) : "") + '</span><span class="vl">' + esc(rate(eff)) + "</span></li>" : "";
    html += q.map((x) => {
      const src = srcs.find((y) => y.id === x.id);
      const time = src && src.time ? ago(src.time) : "";
      return '<li' + (x.cross ? ' title="USD"' : "") + '><span class="nm">' + esc(x.name) + '</span><span class="tm">' + esc(time) + '</span><span class="vl">' + esc(rate(x.v)) + "</span></li>";
    }).join("");
    if (q.length > 1) html += '<li class="dev"><span class="nm">' + esc(t("spreadAmong")) + '</span><span class="tm"></span><span class="vl">± ' + esc(pct(dev / 2, 3)) + "</span></li>";
    return '<div class="src-pair"><div class="block-head"><h4>' + esc(t("rateOf", codeLabel(from))) + " " + esc(money(eff, to)) + "</h4></div>" + rail + '<ul class="srcs">' + html + "</ul></div>";
  }

  async function renderHistory(from, to) {
    const key = from + ">" + to;
    const chart = $("chart");
    if (histKey === key) return;
    histKey = key;
    let pts = histCache.get(key);
    if (pts === undefined) {
      chart.innerHTML = '<p class="muted">' + esc(t("loading")) + "</p>";
      $("hist-chg").textContent = "";
      try {
        pts = await CM.history(from, to, { frankfurter: [...(merged.fiat || [])].filter((c) => frankSet().has(c)), timeoutMs: CFG.timeoutMs });
      } catch (e) { pts = null; }
      histCache.set(key, pts);
      if (histKey !== key) return;
    }
    if (!pts) { chart.innerHTML = '<p class="muted">' + esc(t("noHistory")) + "</p>"; $("hist-chg").textContent = ""; return; }
    drawChart(pts, to);
  }

  function frankSet() {
    const f = ((data && data.sources) || []).find((x) => x.id === "frankfurter" && x.ok);
    return new Set(f ? Object.keys(f.R) : []);
  }

  function drawChart(pts, to) {
    const W = 320, H = 96, P = 4;
    const vs = pts.map((p) => p.v);
    let lo = Math.min.apply(null, vs), hi = Math.max.apply(null, vs);
    if (hi === lo) { hi += hi * 0.001; lo -= lo * 0.001; }
    const X = (i) => P + (i / (pts.length - 1)) * (W - P * 2);
    const Y = (v) => P + (1 - (v - lo) / (hi - lo)) * (H - P * 2);
    const d = pts.map((p, i) => (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(p.v).toFixed(1)).join("");
    const area = d + "L" + X(pts.length - 1).toFixed(1) + " " + H + "L" + X(0).toFixed(1) + " " + H + "Z";
    const chg = vs[vs.length - 1] / vs[0] - 1;
    const el = $("hist-chg");
    el.textContent = (chg > 0 ? "+" : "") + pct(chg);
    el.className = chg > 0 ? "up" : chg < 0 ? "down" : "";
    const fmtD = (iso) => { try { return new Date(iso + "T12:00:00Z").toLocaleDateString(loc, { day: "numeric", month: "short" }); } catch (e) { return iso; } };
    const chart = $("chart");
    chart.innerHTML =
      '<svg viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none" aria-hidden="true"><path class="area" d="' + area + '"/><path class="line" d="' + d + '"/><line class="guide" x1="0" y1="0" x2="0" y2="' + H + '"/></svg>' +
      '<div class="axis"><span>' + esc(fmtD(pts[0].d)) + '</span><span class="hv" data-range="' + esc(rate(Math.min.apply(null, vs)) + " – " + rate(Math.max.apply(null, vs))) + '"></span><span>' + esc(fmtD(pts[pts.length - 1].d)) + "</span></div>";
    const svg = chart.querySelector("svg");
    const guide = svg.querySelector(".guide");
    const hv = chart.querySelector(".hv");
    const move = (ev) => {
      const r = svg.getBoundingClientRect();
      const fx = (ev.clientX - r.left) / r.width;
      const i = Math.max(0, Math.min(pts.length - 1, Math.round(fx * (pts.length - 1))));
      const x = X(i);
      guide.setAttribute("x1", x); guide.setAttribute("x2", x);
      hv.textContent = fmtD(pts[i].d) + " · " + rate(pts[i].v);
      chart.classList.add("hover");
    };
    svg.addEventListener("pointermove", move);
    svg.addEventListener("pointerdown", move);
    svg.addEventListener("pointerleave", () => { chart.classList.remove("hover"); hv.textContent = ""; });
  }

  function renderStatus() {
    const el = $("status");
    let txt = "";
    if (fetching && !(data && data.t)) txt = t("loading");
    else if (!navigator.onLine && data && data.t) txt = t("offline");
    else if (data && data.t) txt = t("stale", ago(data.t));
    else txt = t("failed");
    el.textContent = txt;
    $("refresh").classList.toggle("spin", fetching);
  }

  function fillTargets() {
    const sel = $("target");
    sel.innerHTML = codeOptions(s.target);
    sel.value = s.target;
  }

  function fillStatic() {
    $("profile").innerHTML = PROFILE_KEYS.map((k) => '<option value="' + k + '">' + esc(t("p_" + k)) + "</option>").join("");
    $("profile").value = s.profile;
    $("theme").innerHTML = Object.keys(THEMES).map((k) => '<option value="' + k + '">' + THEMES[k] + "</option>").join("");
    $("theme").value = s.theme;
    $("lang").innerHTML = Object.keys(L).map((k) => '<option value="' + k + '">' + esc(L[k].name) + "</option>").join("");
    $("lang").value = s.lang;
  }

  function fillFees() {
    const f = fees();
    FEE_KEYS.forEach((k) => {
      const el = $("f-" + k);
      if (document.activeElement !== el) el.value = nf({ maximumFractionDigits: 4, useGrouping: false }).format(+f[k] || 0);
    });
    $("fixed-unit").textContent = codeLabel(s.target);
    document.querySelectorAll(".seg [data-dir]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.dir === s.dir)));
  }

  function applyLang() {
    const l = L[s.lang];
    root.lang = s.lang;
    root.dir = l.dir;
    setLocale();
    document.querySelectorAll("[data-i]").forEach((el) => { el.textContent = t(el.dataset.i); });
    $("input").placeholder = t("placeholder");
    $("rail").setAttribute("aria-label", t("settings"));
    $("input").setAttribute("aria-label", t("editor"));
    $("ac").setAttribute("aria-label", t("suggestions"));
    $("ops").setAttribute("aria-label", t("ops"));
  }

  function applyTheme() {
    root.dataset.theme = s.theme;
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.content = THEME_COLOR[s.theme];
    requestAnimationFrame(fitChips);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitChips);
  }

  let raf = 0;
  function schedule(full) {
    if (full) schedule.full = true;
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      if (schedule.full) { evalAll(); schedule.full = false; }
      renderEditor();
      renderResult();
    });
  }

  function walletSums() {
    const m = {};
    s.wallet.forEach((x) => { m[x.c] = (m[x.c] || 0) + x.a; });
    return m;
  }

  let wKey = "";
  function renderWallet() {
    if ($("wallet-panel").hidden) return;
    const sums = walletSums();
    const codes = Object.keys(sums).filter((c) => Math.abs(sums[c]) > 1e-9);
    let total = 0;
    const rows = codes.map((c) => {
      const v = convertTo(sums[c], c, s.target);
      if (isFinite(v)) total += v;
      return { c, a: sums[c], v: isFinite(v) ? v : 0 };
    }).sort((x, y) => Math.abs(y.v) - Math.abs(x.v));
    $("w-total").textContent = money(total, s.target);
    const pos = rows.filter((r) => r.v > 0);
    const tot = pos.reduce((a, r) => a + r.v, 0);
    let k = 0;
    rows.forEach((r) => {
      const kind = metalKind(r.c);
      r.col = kind === "fiat" || kind === "crypto" ? "s" + (k++ % 5 + 1) : kind;
    });
    $("w-strip").innerHTML = tot ? pos.map((r) => '<span class="c-' + r.col + '" style="flex:' + (r.v / tot).toFixed(4) + '"></span>').join("") : "";
    $("w-hold").innerHTML = rows.map((r) =>
      '<li class="' + (r.a < 0 ? "over" : "") + '"><i class="c-' + r.col + '"></i><b>' + esc(money(r.a, r.c)) + "</b><span>" +
      esc(r.c === s.target ? (tot ? pct(r.v / tot, 0) : "") : money(r.v, s.target)) + "</span>" +
      (r.a < 0 ? "<em>" + esc(t("walletOver")) + "</em>" : "") + "</li>").join("");
    const when = (ts) => { try { return new Date(ts).toLocaleString(loc, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; } };
    $("w-hist").innerHTML = s.wallet.slice().reverse().slice(0, 200).map((x) =>
      '<li><span class="w-amt ' + (x.a < 0 ? "out" : "in") + '">' + esc((x.a > 0 ? "+ " : "− ") + money(Math.abs(x.a), x.c)) + '</span><span class="w-note">' + esc(x.n) +
      "</span><time>" + esc(when(x.t)) + '</time><button type="button" class="icon-btn" data-del="' + esc(x.id) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-close"/></svg><span class="sr">' + esc(t("remove")) + "</span></button></li>").join("");
    const empty = !s.wallet.length;
    $("w-empty").hidden = !empty;
    $("w-hold-block").hidden = empty;
    $("w-hist-block").hidden = empty;
    const last = s.walletLast === -1 ? -1 : 1;
    $("w-spend").classList.toggle("primary", last === -1);
    $("w-add").classList.toggle("primary", last === 1);
    const sel = $("w-cur");
    const keep = sel.value;
    const key = s.lang + "|" + Object.keys(merged.R).length;
    if (wKey !== key) { wKey = key; sel.innerHTML = codeOptions(); }
    sel.value = keep || s.walletCur || codes[0] || s.target;
    if (!sel.value) sel.value = s.target;
    $("w-amt").placeholder = t("walletAmount");
    $("w-note").placeholder = t("walletNote");
  }

  function walletAdd(sign) {
    const amt = CM.parseNumber(($("w-amt").value || "").trim() || "x", fmt.dec);
    if (!isFinite(amt) || amt <= 0) { $("w-amt").focus(); return; }
    const c = $("w-cur").value || s.target;
    s.wallet.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), t: Date.now(), c, a: sign * amt, n: ($("w-note").value || "").trim().slice(0, 60) });
    s.walletCur = c;
    s.walletLast = sign;
    bump(c);
    save();
    $("w-amt").value = "";
    $("w-note").value = "";
    $("w-amt").focus();
    renderWallet();
  }

  function setTab(name, focus) {
    s.tab = name === "wallet" ? "wallet" : "calc";
    const w = s.tab === "wallet";
    $("calc-panel").hidden = w;
    $("wallet-panel").hidden = !w;
    $("tab-calc").setAttribute("aria-selected", String(!w));
    $("tab-wallet").setAttribute("aria-selected", String(w));
    $("tab-calc").tabIndex = w ? -1 : 0;
    $("tab-wallet").tabIndex = w ? 0 : -1;
    document.querySelector(".app").classList.toggle("wallet-mode", w);
    save();
    if (w) renderWallet();
    else { renderEditor(); fitChips(); }
    if (focus) $(w ? "tab-wallet" : "tab-calc").focus();
  }

  function renderAll() {
    rebuildRates();
    evalAll();
    fillTargets();
    fillFees();
    renderChips();
    if (!$("own-list").contains(document.activeElement)) renderOwn();
    renderEditor();
    renderResult();
    renderWallet();
    renderStatus();
  }

  async function refresh() {
    if (fetching) return;
    fetching = true;
    renderStatus();
    try {
      const sources = await CM.fetchAll(CFG);
      if (sources.some((x) => x.ok)) {
        data = { t: Date.now(), sources };
        store.set("cm.rates", data);
        histCache.clear();
        histKey = "";
      }
    } catch (e) {}
    fetching = false;
    renderAll();
  }

  function setActive() {
    const n = caretLine();
    if (n === active) return;
    active = n;
    renderEditor();
    renderResult();
  }

  let pickCache = "";
  let pickKey = "";
  function pickOptions() {
    const k = s.lang + "|" + Object.keys(merged.R).length;
    if (k !== pickKey) { pickKey = k; pickCache = codeOptions(); }
    return pickCache;
  }

  function setLineTarget(n, code) {
    const ta = $("input");
    const arr = ta.value.split("\n");
    const line = arr[n];
    const p = lines[n];
    if (line == null || !p) return;
    const unit = ["cur", "metal", "gram", "oz"];
    let cut = line.length;
    const tk = p.tokens || [];
    for (let k = tk.length - 1; k >= 0; k--) {
      if (tk[k].t === "to" || tk[k].t === "eq") {
        if (!(p.name && k <= 1) && k < tk.length - 1) cut = tk[k].s;
        break;
      }
      if (!unit.includes(tk[k].t)) break;
    }
    const head = line.slice(0, cut).replace(/\s+$/, "");
    const toWord = ((L[s.lang].words || {}).to || ["in"])[0];
    const next = head + (code === s.target ? "" : " " + toWord + " " + wordsFor(code));
    let start = 0;
    for (let i = 0; i < n; i++) start += arr[i].length + 1;
    bump(code);
    ta.focus();
    ta.setSelectionRange(start, start + line.length);
    skipAc = true;
    let ok = false;
    try { ok = document.execCommand("insertText", false, next); } catch (e) { ok = false; }
    if (!ok || ta.value.split("\n")[n] !== next) {
      arr[n] = next;
      ta.value = arr.join("\n");
      ta.setSelectionRange(start + next.length, start + next.length);
      ta.dispatchEvent(new Event("input"));
    }
    skipAc = false;
    closeAc();
  }

  function openRail(open) {
    $("rail").classList.toggle("open", open);
    $("scrim").hidden = !open;
    $("open-settings").setAttribute("aria-expanded", String(open));
    if (open) $("target").focus();
  }

  function bind() {
    const ta = $("input");
    let saveT = 0;
    ta.addEventListener("input", (e) => {
      s.text = ta.value;
      shared = false;
      active = caretLine();
      schedule(true);
      if (!e.isComposing) updateAc();
      clearTimeout(saveT);
      saveT = setTimeout(save, 300);
    });
    ta.addEventListener("compositionstart", () => { composing = true; closeAc(); });
    ta.addEventListener("compositionend", () => { composing = false; updateAc(); });
    ta.addEventListener("keydown", (e) => {
      if (!ac.open || e.isComposing || e.keyCode === 229) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        ac.idx = (ac.idx + (e.key === "ArrowDown" ? 1 : -1) + ac.items.length) % ac.items.length;
        drawAc();
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        acceptAc(ac.idx);
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        closeAc();
      } else if (["ArrowLeft", "ArrowRight", "Home", "End", "PageUp", "PageDown"].includes(e.key)) {
        closeAc();
      }
    });
    ta.addEventListener("blur", closeAc);
    ta.addEventListener("pointerdown", closeAc);
    $("ac").addEventListener("pointerdown", (e) => e.preventDefault());
    $("ac").addEventListener("click", (e) => {
      const li = e.target.closest("li");
      if (li) acceptAc(+li.dataset.n);
    });
    ta.addEventListener("scroll", () => {
      $("hl").scrollLeft = ta.scrollLeft;
      if (ac.open) { const b = caretBox(ac.start); $("ac").style.left = Math.max(0, Math.min(b.x, $("ed").clientWidth - $("ac").offsetWidth)) + "px"; }
    });

    $("ops").addEventListener("pointerdown", (e) => { if (e.target.closest("button")) e.preventDefault(); });
    $("ops").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-op]");
      if (!b) return;
      const op = b.dataset.op;
      insertAt(op, ta.selectionStart, ta.selectionEnd, op === ")" || op === "%");
    });
    $("chips").addEventListener("pointerdown", (e) => { if (e.target.closest("button")) e.preventDefault(); });
    $("chips").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-c]");
      if (!b) return;
      bump(b.dataset.c);
      insertAt(wordsFor(b.dataset.c), ta.selectionStart, ta.selectionEnd);
    });
    $("chips").addEventListener("change", (e) => {
      const c = e.target.value;
      if (!c) return;
      e.target.value = "";
      bump(c);
      insertAt(wordsFor(c), ta.selectionStart, ta.selectionEnd);
    });

    $("own-add").addEventListener("click", () => {
      const has = (f, to) => s.rates.some((r) => (r.from === f && r.to === to) || (r.from === to && r.to === f));
      let from = lastPair ? lastPair.from : "USD";
      const to = lastPair ? lastPair.to : s.target;
      let v = lastPair && !has(from, to) ? +lastPair.v.toPrecision(6) : 0;
      if (has(from, to)) {
        from = FAV.find((c) => c !== to && !has(c, to)) || from;
        const m = convertTo(1, from, to);
        v = isFinite(m) ? +m.toPrecision(6) : 0;
      }
      s.rates.push({ from, to, v, on: true });
      save();
      renderOwn();
      recalc();
      openOwn(s.rates.length - 1);
    });
    $("own-edit").addEventListener("click", () => {
      if (!lastPair) return;
      let i = s.rates.findIndex((r) => r.on && ((r.from === lastPair.from && r.to === lastPair.to) || (r.from === lastPair.to && r.to === lastPair.from)));
      if (i < 0) i = s.rates.findIndex((r) => r.from === lastPair.from && r.to === lastPair.to);
      if (i < 0) {
        s.rates.push({ from: lastPair.from, to: lastPair.to, v: +lastPair.v.toPrecision(6), on: true });
        i = s.rates.length - 1;
        save();
        renderOwn();
        recalc();
      }
      openOwn(i);
    });
    $("own-list").addEventListener("input", (e) => {
      if (e.target.dataset.k !== "v") return;
      const r = s.rates[+e.target.closest("li").dataset.n];
      const v = CM.parseNumber(e.target.value || "0", fmt.dec);
      r.v = isFinite(v) && v > 0 ? v : 0;
      save();
      ownCount();
      recalc();
    });
    $("own-list").addEventListener("change", (e) => {
      const k = e.target.dataset.k;
      if (!k || k === "v") return;
      const li = e.target.closest("li");
      const r = s.rates[+li.dataset.n];
      if (k === "on") r.on = e.target.checked;
      else {
        r[k] = e.target.value;
        const is = li.querySelectorAll(".in i");
        is[0].textContent = "1 " + codeLabel(r.from) + " =";
        is[1].textContent = codeLabel(r.to);
        e.target.setAttribute("aria-label", t(k === "from" ? "ownRates" : "target") + " · " + r[k]);
      }
      save();
      ownCount();
      recalc();
    });
    $("own-list").addEventListener("click", (e) => {
      const b = e.target.closest('[data-k="del"]');
      if (!b) return;
      s.rates.splice(+b.closest("li").dataset.n, 1);
      save();
      renderOwn();
      recalc();
    });

    $("tab-calc").addEventListener("click", () => setTab("calc"));
    $("tab-wallet").addEventListener("click", () => setTab("wallet"));
    document.querySelector(".tabs").addEventListener("keydown", (e) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
      e.preventDefault();
      setTab(s.tab === "wallet" ? "calc" : "wallet", true);
    });
    $("w-form").addEventListener("submit", (e) => e.preventDefault());
    $("w-form").addEventListener("keydown", (e) => {
      if (e.key !== "Enter" || e.isComposing || e.target.tagName === "BUTTON") return;
      e.preventDefault();
      walletAdd(s.walletLast === -1 ? -1 : 1);
    });
    $("w-spend").addEventListener("click", () => walletAdd(-1));
    $("w-add").addEventListener("click", () => walletAdd(1));
    $("w-cur").addEventListener("change", (e) => { s.walletCur = e.target.value; save(); });
    $("w-amt").addEventListener("input", (e) => {
      const el = e.target;
      const clean = el.value.replace(/[^\d.,٠-٩۰-۹٫٬]/g, "");
      if (clean === el.value) return;
      const pos = Math.max(0, (el.selectionStart || 0) - (el.value.length - clean.length));
      el.value = clean;
      el.setSelectionRange(pos, pos);
    });
    $("w-hist").addEventListener("click", (e) => {
      const b = e.target.closest("[data-del]");
      if (!b) return;
      s.wallet = s.wallet.filter((x) => x.id !== b.dataset.del);
      save();
      renderWallet();
    });

    $("share").addEventListener("click", async () => {
      const url = location.origin + location.pathname + location.search + "#to=" + encodeURIComponent(s.target) + "&t=" + b64e(s.text);
      await copyText(url);
      flash($("share"), t("shared"));
    });
    ["keyup", "click", "focus"].forEach((e) => ta.addEventListener(e, setActive));
    document.addEventListener("selectionchange", () => { if (document.activeElement === ta) setActive(); });

    $("out").addEventListener("change", (e) => {
      if (e.target.tagName === "SELECT") setLineTarget(+e.target.dataset.n, e.target.value);
    });
    $("out").addEventListener("click", (e) => {
      const li = e.target.closest("li");
      if (!li || li.dataset.n == null || e.target.closest(".to-pick")) return;
      const n = +li.dataset.n;
      const arr = ta.value.split("\n");
      let pos = 0;
      for (let i = 0; i < n; i++) pos += arr[i].length + 1;
      pos += arr[n].length;
      ta.focus();
      ta.setSelectionRange(pos, pos);
      setActive();
    });

    $("target").addEventListener("change", (e) => { s.target = e.target.value; save(); histKey = ""; renderAll(); });
    $("profile").addEventListener("change", (e) => { s.profile = e.target.value; save(); fillFees(); renderResult(); });
    $("theme").addEventListener("change", (e) => { s.theme = e.target.value; save(); applyTheme(); renderEditor(); });
    $("lang").addEventListener("change", (e) => {
      s.lang = e.target.value; save(); applyLang(); fillStatic(); histKey = ""; lastVal = ""; renderAll();
    });
    document.querySelectorAll(".seg [data-dir]").forEach((b) => b.addEventListener("click", () => { s.dir = b.dataset.dir; save(); fillFees(); renderResult(); }));
    document.querySelector(".seg").addEventListener("keydown", (e) => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
      e.preventDefault();
      s.dir = s.dir === "sell" ? "buy" : "sell";
      save(); fillFees(); renderResult();
      document.querySelector('.seg [data-dir="' + s.dir + '"]').focus();
    });
    FEE_KEYS.forEach((k) => {
      $("f-" + k).addEventListener("input", (e) => {
        const cur = Object.assign({}, fees());
        const v = CM.parseNumber(e.target.value || "0", fmt.dec);
        cur[k] = isFinite(v) ? Math.max(0, v) : 0;
        s.custom = cur;
        s.profile = "custom";
        $("profile").value = "custom";
        save();
        renderResult();
      });
      $("f-" + k).addEventListener("blur", fillFees);
    });
    $("refresh").addEventListener("click", refresh);
    $("copy").addEventListener("click", async () => {
      await copyText($("res-val").textContent);
      flash($("copy"), t("copied"));
    });
    $("open-settings").addEventListener("click", () => openRail(true));
    $("close-settings").addEventListener("click", () => openRail(false));
    $("scrim").addEventListener("click", () => openRail(false));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && $("rail").classList.contains("open")) { openRail(false); $("open-settings").focus(); } });
    window.addEventListener("online", refresh);
    window.addEventListener("offline", renderStatus);
    let fitRaf = 0;
    window.addEventListener("resize", () => {
      sizeEditor(s.text.split("\n").length);
      placeBand();
      cancelAnimationFrame(fitRaf);
      fitRaf = requestAnimationFrame(fitChips);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitChips);
    document.addEventListener("visibilitychange", () => { if (!document.hidden && stale()) refresh(); });
    setInterval(() => { if (!document.hidden) { if (stale()) refresh(); else renderStatus(); } }, 60000);
  }

  const stale = () => !data || !data.t || Date.now() - data.t > (CFG.refreshMinutes || 30) * 60000;

  function init() {
    loadShare();
    $("share").hidden = !/^https?:$/.test(location.protocol);
    $("input").setAttribute("aria-autocomplete", "list");
    $("input").setAttribute("aria-controls", "ac");
    window.addEventListener("hashchange", () => {
      if (!loadShare()) return;
      $("input").value = s.text;
      histKey = "";
      renderAll();
    });
    applyTheme();
    applyLang();
    fillStatic();
    $("input").value = s.text;
    bind();
    renderAll();
    setTab(s.tab);
    if (s.tab === "calc" && matchMedia("(min-width: 761px)").matches) {
      const end = s.text.split("\n")[0].length;
      $("input").setSelectionRange(end, end);
      $("input").focus();
      active = -1;
      setActive();
    }
    if (stale()) refresh();
    if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    }
  }

  init();
})();
