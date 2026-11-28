(function (root) {
  "use strict";

  const GRAM = 31.1034768;
  const METAL_GRAM = { XAU: "GAU", XAG: "GAG" };
  const FINE = 22 / 24;
  const COINS = { CEY: 1.75, YAR: 3.5, TAM: 7, ATA: 7.216, GRE: 17.5 };
  const COIN_WORDS = {
    CEY: ["çeyrek", "çeyrek altın", "ceyrek", "quarter gold"],
    YAR: ["yarım altın", "yarim altin", "half gold"],
    TAM: ["tam altın", "tam altin", "teklik", "full gold"],
    ATA: ["ata altın", "ata altin", "ata lira", "cumhuriyet", "cumhuriyet altını", "cumhuriyet altın", "republic gold"],
    GRE: ["gremse", "gremse altın"]
  };
  const EXTRA_CUR = { riyal: "SAR", "suudi riyali": "SAR", "saudi riyal": "SAR", dirhem: "AED", dirham: "AED", manat: "AZN", lari: "GEL", tenge: "KZT", hryvnia: "UAH", grivna: "UAH", zloty: "PLN", forint: "HUF", rupi: "INR", rupee: "INR", won: "KRW", baht: "THB" };
  const MUL_WORDS = ["mal", "of", "times", "fois", "por", "vezes", "раз"];
  const NET_WORDS = ["net", "netto", "neto", "нетто", "净", "صافي", "手取り"];
  const KARAT_RE = /^(8|9|10|14|18|21|22|24)\s*(ayar|karat|carat|kt)(?![\p{L}])/iu;
  const CRYPTO = ["BTC", "ETH", "SOL", "XRP", "ADA", "DOGE", "BNB", "USDT", "USDC", "LTC", "DOT", "TRX", "AVAX", "LINK", "XLM", "TON"];
  const SYMBOLS = {
    "us$": "USD", "$": "USD", "€": "EUR", "£": "GBP", "₺": "TRY", "₽": "RUB", "¥": "JPY", "￥": "JPY",
    "₹": "INR", "₩": "KRW", "₿": "BTC", "₴": "UAH", "₪": "ILS", "฿": "THB", "₫": "VND", "₦": "NGN",
    "₱": "PHP", "r$": "BRL", "c$": "CAD", "a$": "AUD", "hk$": "HKD", "zł": "PLN", "₸": "KZT", "₼": "AZN", "₾": "GEL"
  };
  const MUL = ["*", "×", "·", "∙"];
  const DIV = ["/", "÷", ":"];
  const MINUS = ["-", "−", "–"];

  const reLetter = /\p{L}/u;
  const reCJK = /[぀-ヿ㐀-鿿豈-﫿ｦ-ﾟ]/;
  const isWordy = (ch) => !!ch && /[\p{L}\p{N}_]/u.test(ch) && !reCJK.test(ch);
  const lower = (s) => s.replace(/İ/g, "i").toLowerCase();

  function buildLexicon(i18n, codes, pref) {
    const map = new Map();
    const add = (text, entry) => {
      const k = lower(String(text).normalize("NFC")).trim();
      if (!k) return;
      if (!map.has(k)) map.set(k, entry);
      const k2 = k.replace(/ı/g, "i");
      if (!map.has(k2)) map.set(k2, entry);
    };
    const subs = (l) => {
      const sub = (l && l.words && l.words.sub) || {};
      Object.keys(sub).forEach((c) => sub[c].forEach((x) => add(x, { t: "cur", c, f: 0.01 })));
    };
    if (pref && i18n && i18n[pref]) subs(i18n[pref]);
    codes.forEach((c) => { if (!COINS[c]) add(c, { t: "cur", c }); });
    add("¢", { t: "cur", c: "USD", f: 0.01 });
    Object.keys(SYMBOLS).forEach((s) => add(s, { t: "cur", c: SYMBOLS[s] }));
    Object.values(i18n || {}).forEach((lang) => {
      const w = lang.words || {};
      (w.cur && Object.keys(w.cur) || []).forEach((c) => {
        w.cur[c].forEach((x) => add(x, METAL_GRAM[c] ? { t: "metal", c } : { t: "cur", c }));
      });
      subs(lang);
      (w.to || []).forEach((x) => add(x, { t: "to" }));
      (w.skip || []).forEach((x) => add(x, { t: "skip" }));
      (w.gram || []).forEach((x) => add(x, { t: "gram" }));
      (w.ounce || []).forEach((x) => add(x, { t: "oz" }));
      if (lang.dir === "rtl") {
        (w.cur && Object.keys(w.cur) || []).forEach((c) => {
          const entry = METAL_GRAM[c] ? { t: "metal", c } : { t: "cur", c };
          w.cur[c].forEach((x) => {
            const base = x.replace(/^ال/, "");
            add("ال" + base, entry);
            add("بال" + base, { t: "tocur", inner: entry });
          });
        });
      }
    });
    Object.keys(COIN_WORDS).forEach((c) => COIN_WORDS[c].forEach((x) => add(x, { t: "cur", c })));
    NET_WORDS.forEach((x) => add(x, { t: "net" }));
    Object.keys(EXTRA_CUR).forEach((x) => add(x, { t: "cur", c: EXTRA_CUR[x] }));
    MUL_WORDS.forEach((x) => add(x, { t: "op", v: "*" }));
    add("=", { t: "eq" });
    const stems = new Set();
    const tr = (i18n && i18n.tr && i18n.tr.words && i18n.tr.words.cur) || {};
    const trSub = (i18n && i18n.tr && i18n.tr.words && i18n.tr.words.sub) || {};
    [].concat(...Object.values(tr), ...Object.values(trSub), ...Object.values(COIN_WORDS), Object.keys(EXTRA_CUR)).forEach((x) => {
      const k = lower(String(x)).trim();
      stems.add(k);
      stems.add(k.replace(/ı/g, "i"));
    });
    let max = 0;
    map.forEach((_, k) => { if (k.length > max) max = k.length; });
    return { map, max, stems };
  }

  const SUFFIXES = ["lardan", "lerden", "ların", "lerin", "larda", "lerde", "ları", "leri", "lara", "lere", "ımız", "imiz", "umuz", "ümüz", "ınız", "iniz", "unuz", "ünüz", "lar", "ler", "dan", "den", "tan", "ten", "nın", "nin", "nun", "nün", "yla", "yle", "yı", "yi", "yu", "yü", "ya", "ye", "da", "de", "ta", "te", "ın", "in", "un", "ün", "ım", "im", "um", "üm", "sı", "si", "su", "sü", "es", "ı", "i", "u", "ü", "a", "e", "m", "n", "s"];

  function stemHit(lex, word) {
    if (!lex || !word || word.length < 4) return null;
    const ok = (h, w) => h && (h.t === "cur" || h.t === "metal") && (!lex.stems || lex.stems.has(w));
    const go = (w, depth) => {
      const h = lex.map.get(w);
      if (depth && ok(h, w)) return h;
      if (depth >= 2) return null;
      for (const sfx of SUFFIXES) {
        if (w.length - sfx.length >= 3 && w.endsWith(sfx)) {
          const r = go(w.slice(0, -sfx.length), depth + 1);
          if (r) return r;
        }
      }
      return null;
    };
    return go(word.replace(/['’]/g, ""), 0);
  }

  function editDistance(a, b) {
    const m = a.length, n = b.length;
    if (Math.abs(m - n) > 2) return 9;
    const d = Array.from({ length: m + 1 }, (_, i) => [i].concat(new Array(n).fill(0)));
    for (let j = 1; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const c = a[i - 1] === b[j - 1] ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
    return d[m][n];
  }

  function knownWord(lex, word, names) {
    const ap = String(word || "").search(/['’]/);
    if (ap > 0) return knownWord(lex, String(word).slice(0, ap), names);
    const w = lower(String(word || ""));
    if (!w) return true;
    if (names && names.has(w)) return true;
    const h = lex && lex.map.get(w);
    if (h && h.t !== "eq") return true;
    if (/^(x|k|ayar|karat|carat|kt)$/.test(w)) return true;
    if (lex && !lex.heads) {
      lex.heads = new Set();
      lex.map.forEach((_, k) => { const sp = k.indexOf(" "); if (sp > 0) lex.heads.add(k.slice(0, sp)); });
    }
    if (lex && lex.heads.has(w)) return true;
    return !!stemHit(lex, w);
  }

  function lexAt(lex, low, raw, i) {
    const prev = raw[i - 1];
    if (prev && /[\p{L}_]/u.test(prev) && !reCJK.test(prev) && reLetter.test(raw[i]) && !reCJK.test(raw[i])) return null;
    for (let len = Math.min(lex.max, low.length - i); len > 0; len--) {
      const k = low.substr(i, len);
      const hit = lex.map.get(k);
      if (!hit || hit.t === "eq") continue;
      const last = k[len - 1];
      if (isWordy(last) && reLetter.test(last) && isWordy(raw[i + len])) continue;
      return { hit, len };
    }
    return null;
  }

  function parseNumber(raw, dec) {
    let s = raw.replace(/[\s  '’]/g, "");
    const dot = s.indexOf(".") >= 0;
    const com = s.indexOf(",") >= 0;
    if (dot && com) {
      const d = s.lastIndexOf(".") > s.lastIndexOf(",") ? "." : ",";
      const g = d === "." ? "," : ".";
      s = s.split(g).join("").replace(d, ".");
    } else if (dot || com) {
      const ch = dot ? "." : ",";
      const p = s.split(ch);
      if (p.length > 2) s = p.join("");
      else if (ch === dec) s = p[0] + "." + p[1];
      else if (p[1].length === 3 && p[0] !== "" && p[0] !== "0") s = p.join("");
      else s = (p[0] || "0") + "." + p[1];
    }
    return parseFloat(s);
  }

  function digits(text) {
    return text
      .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1584))
      .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1728))
      .replace(/[０-９]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 65248))
      .replace(/٫/g, ".")
      .replace(/٬/g, ",");
  }

  function tokenize(src, lex, fmt, names) {
    const text = digits(src);
    const dec = (fmt && fmt.dec) || ".";
    const spaceGroup = !!(fmt && fmt.spaceGroup);
    const low = lower(text);
    const out = [];
    let i = 0;
    const n = text.length;
    const numRe = spaceGroup
      ? /^(?:\d{1,3}(?:[   ]\d{3})+(?:[.,]\d+)?(?!\d)|\d[\d.,'’  ]*)/
      : /^(?:\d{1,3}(?:[  ]\d{3})+(?:[.,]\d+)?(?!\d)|\d[\d.,'’]*)/;
    while (i < n) {
      const ch = text[i];
      if (/\s/.test(ch)) { i++; continue; }
      const rest = text.slice(i);
      const km = out.length && out[out.length - 1].t === "gram" ? KARAT_RE.exec(rest) : null;
      if (km) {
        out.push({ t: "karat", v: +km[1], s: i, e: i + km[0].length });
        i += km[0].length;
        continue;
      }
      let m = numRe.exec(rest) || /^[.,]\d+/.exec(rest);
      if (m) {
        let raw = m[0].replace(/[.,'’\s  ]+$/, "");
        let v = parseNumber(raw.charAt(0) === "." || raw.charAt(0) === "," ? "0" + dec + raw.slice(1) : raw, dec);
        let e = i + raw.length;
        if ((text[e] === "k" || text[e] === "K") && !isWordy(text[e + 1])) { v *= 1000; e++; }
        out.push({ t: "num", v, s: i, e });
        i = e;
        continue;
      }
      const pt = out.length ? out[out.length - 1].t : "";
      if ((ch === "x" || ch === "X") && (pt === "num" || pt === "rp" || pt === "cur" || pt === "metal" || pt === "id") && !reLetter.test(text[i + 1] || " ")) {
        out.push({ t: "op", v: "*", s: i, e: i + 1 });
        i++;
        continue;
      }
      if (ch === "(" || ch === ")") { out.push({ t: ch === "(" ? "lp" : "rp", s: i, e: i + 1 }); i++; continue; }
      if (ch === "%" || ch === "٪") { out.push({ t: "pct", s: i, e: i + 1 }); i++; continue; }
      if (ch === "+" || MINUS.includes(ch) || MUL.includes(ch) || DIV.includes(ch)) {
        const v = MINUS.includes(ch) ? "-" : MUL.includes(ch) ? "*" : DIV.includes(ch) ? "/" : "+";
        if (ch === ":" && out.length === 0) { i++; continue; }
        out.push({ t: "op", v, s: i, e: i + 1 });
        i++;
        continue;
      }
      if (ch === "→" || ch === "=" && text[i + 1] === ">") {
        const len = ch === "→" ? 1 : 2;
        out.push({ t: "to", s: i, e: i + len }); i += len; continue;
      }
      if (ch === "=") { out.push({ t: "eq", s: i, e: i + 1 }); i++; continue; }
      const hit = lexAt(lex, low, text, i);
      if (hit) {
        let h = hit.hit;
        const pv = out.length ? out[out.length - 1].t : "";
        if (h.t === "op" && !["num", "cur", "metal", "rp", "id", "pct"].includes(pv)) h = null;
        if (!h) {
          out.push({ t: "id", v: low.substr(i, hit.len), raw: text.slice(i, i + hit.len), s: i, e: i + hit.len });
          i += hit.len;
          continue;
        }
        if (h.t === "skip") { i += hit.len; continue; }
        const word = low.substr(i, hit.len);
        const named = (names && names.has(word)) || /^\s*=(?!>)/.test(text.slice(i + hit.len));
        if (named && (h.t === "to" || h.t === "gram" || h.t === "oz" || h.t === "net" || (h.t === "cur" && h.f))) {
          out.push({ t: "id", v: word, raw: text.slice(i, i + hit.len), s: i, e: i + hit.len });
        } else if (h.t === "tocur") {
          out.push({ t: "to", s: i, e: i + 1 });
          out.push(Object.assign({ s: i + 1, e: i + hit.len }, h.inner));
        } else {
          const tok = Object.assign({ s: i, e: i + hit.len }, h);
          if ((h.t === "cur" || h.t === "metal") && /^(euroya|avroya)$/.test(low.substr(i, hit.len))) tok.dat = true;
          if (tok.c === "JPY" && fmt && fmt.yen && /[¥￥]/.test(text[i])) tok.c = fmt.yen;
          out.push(tok);
        }
        i += hit.len;
        if ((text[i] === "'" || text[i] === "’") && reLetter.test(text[i + 1] || "")) {
          const a0 = i;
          while (i < n && (text[i] === "'" || text[i] === "’" || reLetter.test(text[i]))) i++;
          const last = out[out.length - 1];
          last.e = i;
          if (/^['’](y?[ae]|n[ae])$/.test(low.slice(a0, i))) last.dat = true;
        }
        continue;
      }
      if (reLetter.test(ch) || ch === "_") {
        let j = i + 1;
        while (j < n && (reLetter.test(text[j]) || /\d|_/.test(text[j]))) {
          if ((reCJK.test(text[j]) || reCJK.test(text[j - 1])) && lexAt(lex, low, text, j)) break;
          j++;
        }
        const word = low.slice(i, j);
        const stem = (names && names.has(word)) || /^\s*=(?!>)/.test(text.slice(j)) ? null : stemHit(lex, word);
        out.push(stem ? Object.assign({ s: i, e: j, dat: /(?<![dtl])y?[ae]$/.test(word) }, stem) : { t: "id", v: word, raw: text.slice(i, j), s: i, e: j });
        i = j;
        continue;
      }
      out.push({ t: "bad", v: ch, s: i, e: i + 1 });
      i++;
    }
    return out;
  }

  function Err(k, x) { this.k = k; this.x = x; }

  const S = (n) => ({ k: "n", n });
  const P = (n) => ({ k: "p", n });
  const M = (c, a) => ({ k: "m", m: { [c]: a } });

  function scaleMoney(v, f) {
    const m = {};
    for (const c in v.m) m[c] = v.m[c] * f;
    return { k: "m", m };
  }

  function evaluate(tokens, ctx) {
    let i = 0;
    const peek = () => tokens[i];
    const next = () => tokens[i++];
    const is = (t, v) => tokens[i] && tokens[i].t === t && (v === undefined || tokens[i].v === v);
    const usd = (v) => {
      let s = 0;
      for (const c in v.m) {
        const r = ctx.R[c];
        if (!r) throw new Err("rate", c);
        s += v.m[c] / r;
      }
      return s;
    };
    function money(code, amount) { return M(code, amount); }

    function unitAfter(n) {
      if (is("gram")) {
        next();
        if (is("karat")) {
          const k = next().v;
          if (is("metal")) next();
          return money("GAU", (n * k) / 24);
        }
        if (is("metal")) return money(METAL_GRAM[next().c], n);
        return S(n);
      }
      if (is("oz")) {
        next();
        if (is("metal")) return money(next().c, n);
        if (is("cur") && METAL_GRAM[peek().c]) return money(next().c, n);
        return S(n);
      }
      if (is("metal")) return money(METAL_GRAM[next().c], n);
      if (is("cur")) { const u = next(); return money(u.c, n * (u.f || 1)); }
      return S(n);
    }

    function primary() {
      const t = peek();
      if (!t) throw new Err("syntax");
      if (t.t === "num") { next(); return unitAfter(t.v); }
      if (t.t === "cur") {
        next();
        if (is("num")) return money(t.c, next().v * (t.f || 1));
        return money(t.c, t.f || 1);
      }
      if (t.t === "metal") {
        next();
        if (is("num")) return money(METAL_GRAM[t.c], next().v);
        return money(METAL_GRAM[t.c], 1);
      }
      if (t.t === "gram" || t.t === "oz") {
        next();
        if (is("metal")) {
          const c = next().c;
          return money(t.t === "gram" ? METAL_GRAM[c] : c, 1);
        }
        throw new Err("syntax");
      }
      if (t.t === "lp") {
        next();
        const v = expr();
        if (!is("rp")) throw new Err("syntax");
        next();
        if (v.k !== "m" && (is("cur") || is("metal") || is("gram") || is("oz"))) return unitAfter(v.n);
        return v;
      }
      if (t.t === "pct") {
        next();
        if (!is("num")) throw new Err("syntax");
        return P(next().v / 100);
      }
      if (t.t === "id") {
        next();
        if (Object.prototype.hasOwnProperty.call(ctx.vars, t.v)) return ctx.vars[t.v];
        throw new Err("unknown", t.raw);
      }
      if (t.t === "bad") throw new Err("unknown", t.v);
      throw new Err("syntax");
    }

    function postfix() {
      let v = primary();
      while (is("pct")) {
        next();
        if (v.k !== "n") throw new Err("syntax");
        v = P(v.n / 100);
      }
      return v;
    }

    function unary() {
      if (is("op", "-")) { next(); const v = unary(); return v.k === "m" ? scaleMoney(v, -1) : { k: v.k, n: -v.n }; }
      if (is("op", "+")) { next(); return unary(); }
      return postfix();
    }

    function mul(a, b) {
      if (a.k === "m" && b.k === "m") throw new Err("mul");
      if (a.k === "m") return scaleMoney(a, b.n);
      if (b.k === "m") return scaleMoney(b, a.n);
      return a.k === "p" || b.k === "p" ? P(a.n * b.n) : S(a.n * b.n);
    }

    function div(a, b) {
      if (b.k === "m") {
        const d = usd(b);
        if (!d) throw new Err("div0");
        if (a.k === "m") return S(usd(a) / d);
        throw new Err("syntax");
      }
      if (!b.n) throw new Err("div0");
      return a.k === "m" ? scaleMoney(a, 1 / b.n) : a.k === "p" ? P(a.n / b.n) : S(a.n / b.n);
    }

    function add(a, b, sign) {
      if (b.k === "p") return a.k === "m" ? scaleMoney(a, 1 + sign * b.n) : S(a.n * (1 + sign * b.n));
      if (a.k !== "m" && b.k !== "m") return S(a.n + sign * b.n);
      if (a.k === "m" && b.k === "m") {
        const m = Object.assign({}, a.m);
        for (const c in b.m) m[c] = (m[c] || 0) + sign * b.m[c];
        return { k: "m", m };
      }
      const mon = a.k === "m" ? a : b;
      const codes = Object.keys(mon.m);
      const code = codes.length === 1 ? codes[0] : ctx.target;
      return add(a.k === "m" ? a : M(code, a.n), b.k === "m" ? b : M(code, b.n), sign);
    }

    function term() {
      let v = unary();
      while (is("op", "*") || is("op", "/")) {
        const op = next().v;
        const r = unary();
        v = op === "*" ? mul(v, r) : div(v, r);
      }
      return v;
    }

    function expr() {
      let v = term();
      while (is("op", "+") || is("op", "-")) {
        const sign = next().v === "-" ? -1 : 1;
        v = add(v, term(), sign);
      }
      return v;
    }

    const v = expr();
    if (i < tokens.length) {
      const t = tokens[i];
      throw new Err(t.t === "id" || t.t === "bad" ? "unknown" : "syntax", t.raw || t.v);
    }
    return v;
  }

  function splitTarget(tokens) {
    const n = tokens.length;
    if (n < 2) return { tokens, target: null };
    const last = tokens[n - 1];
    let code = null;
    let cut = n - 1;
    if (last.t === "cur") code = last.c;
    else if (last.t === "metal") {
      code = METAL_GRAM[last.c];
      if (tokens[n - 2] && tokens[n - 2].t === "oz") { code = last.c; cut = n - 2; }
      else if (tokens[n - 2] && tokens[n - 2].t === "gram") cut = n - 2;
    }
    if (!code) return { tokens, target: null };
    const before = tokens[cut - 1];
    if (before && (before.t === "to" || before.t === "eq")) return { tokens: tokens.slice(0, cut - 1), target: code };
    if (last.dat && tokens.slice(0, cut).some((x) => x.t === "cur" || x.t === "metal" || x.t === "id")) return { tokens: tokens.slice(0, cut), target: code };
    return { tokens, target: null };
  }

  const LABEL_RE = /^\s*(\p{L}[^:=#：+\-*/()%]{0,39}?)\s*[:：]\s+(.*)$/u;
  const NAMEABLE = ["id", "to", "gram", "oz", "net"];

  function parseLine(text, lex, fmt, names) {
    const raw = text;
    const trimmed = raw.trim();
    if (!trimmed) return { kind: "empty", tokens: [] };
    if (/^(#|\/\/)/.test(trimmed)) return { kind: "label", label: trimmed.replace(/^(#|\/\/)\s*/, ""), tokens: [] };
    let offset = 0;
    let label = null;
    let body = raw;
    const lm = LABEL_RE.exec(raw);
    if (lm) {
      label = lm[1];
      offset = raw.length - lm[2].length;
      body = lm[2];
      if (!body.trim()) return { kind: "label", label, tokens: [] };
    }
    const all = tokenize(body, lex, fmt, names).map((t) => Object.assign(t, { s: t.s + offset, e: t.e + offset }));
    let tokens = all;
    let name = null;
    if (all.length >= 2 && NAMEABLE.includes(all[0].t) && all[1].t === "eq") {
      name = lower(raw.slice(all[0].s, all[0].e));
      all[0] = Object.assign({}, all[0], { t: "id", v: name });
      tokens = all.slice(2);
    }
    const net = tokens.some((t) => t.t === "net");
    if (net) tokens = tokens.filter((t) => t.t !== "net");
    const st = splitTarget(tokens);
    return { kind: name ? "assign" : "expr", label, name, net, body: st.tokens, target: st.target, tokens: all, labelEnd: label ? offset : 0 };
  }

  function directRate(pairs, from, to) {
    const d = pairs[from + ">" + to];
    if (d > 0) return d;
    const i = pairs[to + ">" + from];
    return i > 0 ? 1 / i : 0;
  }

  function pairRate(pairs, from, to) {
    if (!pairs || from === to) return 0;
    const d = directRate(pairs, from, to);
    if (d) return d;
    const legs = new Set();
    Object.keys(pairs).forEach((k) => k.split(">").forEach((c) => legs.add(c)));
    for (const z of legs) {
      if (z === from || z === to) continue;
      const a = directRate(pairs, from, z);
      const b = directRate(pairs, to, z);
      if (a && b) return a / b;
    }
    return 0;
  }

  function convert(value, target, R, pairs) {
    if (value.k !== "m") return { scalar: true, total: value.n, comps: [] };
    const rt = R[target];
    const comps = [];
    let total = 0;
    for (const c in value.m) {
      const a = value.m[c];
      if (!a && Object.keys(value.m).length > 1) continue;
      const own = pairRate(pairs, c, target);
      let v;
      if (own) v = a * own;
      else {
        if (!rt) throw new Err("rate", target);
        const r = R[c];
        if (!r) throw new Err("rate", c);
        v = (a * rt) / r;
      }
      comps.push(own ? { c, a, v, own: true } : { c, a, v });
      total += v;
    }
    return { scalar: false, total, comps };
  }

  function evalDocument(text, opts) {
    const lex = opts.lex;
    const R = opts.R || {};
    const vars = {};
    const lines = text.split("\n");
    return lines.map((line) => {
      const p = parseLine(line, lex, opts.fmt, new Set(Object.keys(vars)));
      if (p.kind === "empty" || p.kind === "label") return p;
      const target = p.target || opts.target;
      try {
        if (!p.body.length) throw new Err("syntax");
        const value = evaluate(p.body, { vars, R, target });
        if (p.name) vars[p.name] = value;
        const res = convert(value, target, R, opts.pairs);
        return Object.assign(p, { value, target, res });
      } catch (e) {
        if (!(e instanceof Err)) throw e;
        if (p.name) delete vars[p.name];
        return Object.assign(p, { kind: "error", err: { k: e.k, x: e.x }, target });
      }
    });
  }

  const PROFILES = {
    mid: { spread: 0, commission: 0, fixed: 0, tax: 0 },
    bank: { spread: 1.5, commission: 0, fixed: 0, tax: 0 },
    office: { spread: 0.5, commission: 0, fixed: 0, tax: 0 },
    card: { spread: 0, commission: 2.5, fixed: 0, tax: 0 },
    crypto: { spread: 0.2, commission: 0.1, fixed: 0, tax: 0 }
  };

  function applyFees(res, fees, dir) {
    const foreign = res.comps.filter((x) => x.c !== res.target).reduce((s, x) => s + x.v, 0);
    const F = Math.abs(foreign);
    const out = { mid: res.total, foreign, spread: 0, commission: 0, fixed: 0, tax: 0, cost: 0, net: res.total, pct: 0 };
    if (!F) return out;
    const s = Math.max(0, +fees.spread || 0) / 100;
    const c = Math.max(0, +fees.commission || 0) / 100;
    const t = Math.max(0, +fees.tax || 0) / 100;
    const S = Math.abs(res.comps.filter((x) => x.c !== res.target && !x.own).reduce((a, x) => a + x.v, 0));
    out.spread = (S * s) / 2;
    out.commission = dir === "buy" ? (F + out.spread) * c : (F - out.spread) * c;
    out.tax = F * t;
    out.fixed = Math.max(0, +fees.fixed || 0);
    out.cost = out.spread + out.commission + out.tax + out.fixed;
    out.net = dir === "buy" ? res.total + out.cost : res.total - out.cost;
    out.pct = out.cost / F;
    return out;
  }

  function median(a) {
    const s = a.slice().sort((x, y) => x - y);
    const m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }

  function withMetals(R) {
    if (R.XAU) R.GAU = R.XAU * GRAM;
    if (R.XAG) R.GAG = R.XAG * GRAM;
    if (R.GAU) Object.keys(COINS).forEach((c) => { R[c] = R.GAU / (COINS[c] * FINE); });
    return R;
  }

  function normalize(base, rates) {
    const R = {};
    const b = String(base || "USD").toUpperCase();
    const src = {};
    for (const k in rates) {
      const v = +rates[k];
      if (isFinite(v) && v > 0) src[k.toUpperCase()] = v;
    }
    src[b] = 1;
    const u = src.USD;
    if (!u) return R;
    for (const k in src) R[k] = src[k] / u;
    return withMetals(R);
  }

  async function getJSON(url, ms, fetchImpl) {
    const f = fetchImpl || root.fetch.bind(root);
    const ctl = typeof AbortController === "function" ? new AbortController() : null;
    const timer = ctl ? setTimeout(() => ctl.abort(), ms || 9000) : 0;
    try {
      const r = await f(url, ctl ? { signal: ctl.signal } : {});
      if (!r.ok) throw new Error("HTTP " + r.status);
      return await r.json();
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  async function getText(url, ms, fetchImpl) {
    const f = fetchImpl || root.fetch.bind(root);
    const ctl = typeof AbortController === "function" ? new AbortController() : null;
    const timer = ctl ? setTimeout(() => ctl.abort(), ms || 9000) : 0;
    try {
      const r = await f(url, Object.assign({ cache: "no-cache" }, ctl ? { signal: ctl.signal } : {}));
      if (!r.ok) throw new Error("HTTP " + r.status);
      return await r.text();
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  function readBundle(text) {
    const j = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
    if (!j || typeof j !== "object" || !j.rates) throw new Error("tcmb");
    return j;
  }

  const MAX_AGE = 5 * 864e5;
  const MAX_DEV = 0.05;

  const SOURCES = [
    {
      id: "frankfurter", name: "Frankfurter", site: "https://frankfurter.dev",
      async load(ms, f) {
        const j = await getJSON("https://api.frankfurter.dev/v1/latest?base=USD", ms, f);
        return { time: Date.parse(j.date + "T16:00:00Z"), R: normalize("USD", j.rates) };
      }
    },
    {
      id: "erapi", name: "ExchangeRate-API", site: "https://www.exchangerate-api.com",
      async load(ms, f) {
        const j = await getJSON("https://open.er-api.com/v6/latest/USD", ms, f);
        if (j.result !== "success") throw new Error(j.result);
        return { time: j.time_last_update_unix * 1000, R: normalize("USD", j.rates) };
      }
    },
    {
      id: "fawaz", name: "Currency API", site: "https://github.com/fawazahmed0/exchange-api",
      async load(ms, f) {
        let j;
        try { j = await getJSON("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json", ms, f); }
        catch (e) { j = await getJSON("https://latest.currency-api.pages.dev/v1/currencies/usd.min.json", ms, f); }
        return { time: Date.parse(j.date + "T00:00:00Z"), R: normalize("USD", j.usd) };
      }
    },
    {
      id: "goldapi", name: "Gold API", site: "https://gold-api.com", metals: true,
      async load(ms, f) {
        const got = await Promise.allSettled(["XAU", "XAG"].map((m) => getJSON("https://api.gold-api.com/price/" + m, ms, f)));
        const rates = {};
        let time = 0;
        got.forEach((g, k) => {
          if (g.status !== "fulfilled") return;
          const p = +g.value.price;
          if (isFinite(p) && p > 0 && (g.value.currency || "USD") === "USD") {
            rates[k ? "XAG" : "XAU"] = 1 / p;
            time = Math.max(time, Date.parse(g.value.updatedAt) || 0);
          }
        });
        if (!rates.XAU && !rates.XAG) throw new Error("empty");
        return { time: time || Date.now(), R: normalize("USD", rates) };
      }
    },
    {
      id: "tcmb", name: "TCMB", site: "https://www.tcmb.gov.tr", official: true,
      async load(ms, f, config) {
        const urls = [];
        if (config && config.tcmbUrl) urls.push(config.tcmbUrl);
        if (root.location && /^https?:$/.test(root.location.protocol)) urls.push("data/tcmb.js");
        let j = null;
        for (const u of urls) {
          try { j = readBundle(await getText(u, ms, f)); break; } catch (e) { j = null; }
        }
        if (!j && root.CM_TCMB && root.CM_TCMB.rates) j = root.CM_TCMB;
        if (!j) throw new Error("missing");
        const time = +j.time || Date.parse(j.date);
        if (!isFinite(time) || Date.now() - time > MAX_AGE) throw new Error("stale");
        return { time, R: normalize(j.base, j.rates) };
      }
    }
  ];

  function sourceList(config) {
    const list = SOURCES.slice();
    const proxy = config && config.proxy ? String(config.proxy).replace(/\/+$/, "") : "";
    ((config && config.proxySources) || []).forEach((p) => {
      list.push({
        id: p.id, name: p.name, proxy: true, site: proxy,
        async load(ms, f) {
          if (!proxy) throw new Error("proxy");
          const j = await getJSON(proxy + p.path, ms, f);
          return { time: j.time ? +j.time : Date.parse(j.date), R: normalize(j.base, j.rates) };
        }
      });
    });
    return list;
  }

  async function fetchAll(config, fetchImpl) {
    const ms = (config && config.timeoutMs) || 9000;
    const list = sourceList(config);
    const res = await Promise.allSettled(list.map((s) => s.load(ms, fetchImpl, config)));
    return list.map((s, k) => {
      const r = res[k];
      if (r.status === "fulfilled" && r.value.R && Object.keys(r.value.R).length > 2) {
        return { id: s.id, name: s.name, site: s.site, official: !!s.official, ok: true, time: r.value.time, R: r.value.R };
      }
      const msg = r.status === "rejected" ? String(r.reason && r.reason.message || r.reason) : "empty";
      return { id: s.id, name: s.name, site: s.site, official: !!s.official, ok: false, proxy: !!s.proxy, err: msg };
    });
  }

  function merge(sources) {
    const ok = sources.filter((s) => s.ok && s.R);
    const codes = new Set();
    ok.forEach((s) => Object.keys(s.R).forEach((c) => codes.add(c)));
    const R = {};
    const spread = {};
    codes.forEach((c) => {
      let vals = ok.map((s) => s.R[c]).filter((v) => v > 0 && isFinite(v));
      if (!vals.length) return;
      if (vals.length >= 3) {
        const m0 = median(vals);
        const kept = vals.filter((v) => Math.abs(v / m0 - 1) <= MAX_DEV);
        if (kept.length) vals = kept;
      }
      R[c] = median(vals);
      spread[c] = vals.length > 1 ? (Math.max.apply(null, vals) - Math.min.apply(null, vals)) / R[c] : 0;
    });
    R.USD = 1;
    return { R, spread, codes: Object.keys(R) };
  }

  function pairQuotes(sources, from, to) {
    return sources.filter((s) => s.ok && s.R && s.R[from] && s.R[to]).map((s) => ({ id: s.id, name: s.name, v: s.R[to] / s.R[from], time: s.time }));
  }

  function isoDate(d) { return d.toISOString().slice(0, 10); }

  async function history(from, to, opts) {
    const days = (opts && opts.days) || 30;
    const f = opts && opts.fetch;
    const ms = (opts && opts.timeoutMs) || 9000;
    const ff = (opts && opts.frankfurter) || [];
    const end = new Date();
    const start = new Date(end.getTime() - days * 864e5);
    if (from === to) return null;
    if (ff.includes(from) && ff.includes(to)) {
      const j = await getJSON("https://api.frankfurter.dev/v1/" + isoDate(start) + "..?base=" + from + "&symbols=" + to, ms, f);
      const pts = Object.keys(j.rates).sort().map((d) => ({ d, v: j.rates[d][to] })).filter((p) => p.v > 0);
      return pts.length > 1 ? pts : null;
    }
    const step = 5;
    const dates = [];
    for (let k = days; k >= 0; k -= step) dates.push(isoDate(new Date(end.getTime() - k * 864e5)));
    const got = await Promise.allSettled(dates.map(async (d) => {
      let j;
      try { j = await getJSON("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@" + d + "/v1/currencies/usd.min.json", ms, f); }
      catch (e) { j = await getJSON("https://" + d + ".currency-api.pages.dev/v1/currencies/usd.min.json", ms, f); }
      const R = normalize("USD", j.usd);
      return R[from] && R[to] ? { d: j.date || d, v: R[to] / R[from] } : null;
    }));
    const pts = got.filter((g) => g.status === "fulfilled" && g.value).map((g) => g.value);
    return pts.length > 1 ? pts : null;
  }

  const CM = {
    GRAM, CRYPTO, SYMBOLS, METAL_GRAM, COINS, COIN_WORDS, FINE, PROFILES,
    buildLexicon, stemHit, knownWord, editDistance, tokenize, parseNumber, parseLine, evaluate, evalDocument, convert, applyFees,
    normalize, merge, fetchAll, sourceList, pairQuotes, pairRate, history, median, Err
  };
  root.CM = CM;
  if (typeof module === "object" && module.exports) module.exports = CM;
})(typeof window !== "undefined" ? window : globalThis);
