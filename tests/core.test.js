const test = require("node:test");
const assert = require("node:assert/strict");

global.window = globalThis;
require("../js/i18n.js");
const CM = require("../js/core.js");

const RAW = { TRY: 50.55, EUR: 0.9107, GBP: 0.762, JPY: 158.6, CNY: 6.68, RUB: 80, XAU: 0.000283, XAG: 0.0244, BTC: 0.0000177, ETH: 0.000635 };
const R = CM.normalize("USD", RAW);
const FIAT = Object.keys(R).filter((c) => !CM.CRYPTO.includes(c) && !["XAU", "XAG", "GAU", "GAG"].includes(c));
const codes = FIAT.concat(CM.CRYPTO, ["XAU", "XAG"]);
const lex = CM.buildLexicon(window.CM_I18N, codes);

const TR = { dec: ",", spaceGroup: false };
const EN = { dec: ".", spaceGroup: false };
const RU = { dec: ",", spaceGroup: true };

function line(text, fmt, target) {
  return CM.evalDocument(text, { lex, R, target: target || "USD", fmt: fmt || EN })[0];
}
function doc(text, fmt, target) {
  return CM.evalDocument(text, { lex, R, target: target || "USD", fmt: fmt || EN });
}
function scalar(text, fmt) {
  const p = line(text, fmt);
  assert.notEqual(p.kind, "error", text + " -> " + JSON.stringify(p.err));
  assert.equal(p.res.scalar, true, text + " should be scalar");
  return p.res.total;
}
function money(text, fmt, target) {
  const p = line(text, fmt, target);
  assert.notEqual(p.kind, "error", text + " -> " + JSON.stringify(p.err));
  assert.equal(p.res.scalar, false, text + " should be money");
  return { total: p.res.total, target: p.target, value: p.value.m, p };
}
function err(text, fmt, target) {
  const p = line(text, fmt, target);
  assert.equal(p.kind, "error", text + " should fail");
  return p.err;
}
function near(a, b, eps) {
  assert.ok(Math.abs(a - b) <= (eps || 1e-6) * Math.max(1, Math.abs(b)), a + " !~ " + b);
}

test("normalize with USD base keeps rates and derives gram metals", () => {
  assert.equal(R.USD, 1);
  assert.equal(R.TRY, 50.55);
  near(R.GAU, 0.000283 * CM.GRAM);
  near(R.GAG, 0.0244 * CM.GRAM);
});

test("parseNumber tr", () => {
  assert.equal(CM.parseNumber("1.234,56", ","), 1234.56);
  assert.equal(CM.parseNumber("2.400", ","), 2400);
  assert.equal(CM.parseNumber("2,5", ","), 2.5);
  assert.equal(CM.parseNumber("0.500", ","), 0.5);
  assert.equal(CM.parseNumber("1.234.567", ","), 1234567);
});

test("parseNumber en", () => {
  assert.equal(CM.parseNumber("1,234.56", "."), 1234.56);
  assert.equal(CM.parseNumber("2.400", "."), 2.4);
  assert.equal(CM.parseNumber("2,400", "."), 2400);
  assert.equal(CM.parseNumber("2,5", "."), 2.5);
  assert.equal(CM.parseNumber("1,234,567", "."), 1234567);
});

test("numbers in expressions for tr", () => {
  assert.equal(scalar("1.234,56", TR), 1234.56);
  assert.equal(scalar("2.400", TR), 2400);
  assert.equal(scalar("2,5", TR), 2.5);
  assert.equal(scalar(",5", TR), 0.5);
  assert.equal(scalar("2,5k", TR), 2500);
});

test("numbers in expressions for en", () => {
  assert.equal(scalar("1,234.56", EN), 1234.56);
  assert.equal(scalar("2.400", EN), 2.4);
  assert.equal(scalar("2,5", EN), 2.5);
  assert.equal(scalar(".5", EN), 0.5);
  assert.equal(scalar("10k", EN), 10000);
  assert.equal(money("10k usd").total, 10000);
});

test("space grouped numbers for ru", () => {
  assert.equal(scalar("12 345", RU), 12345);
  near(money("2 400 eur", RU, "EUR").total, 2400);
});

test("space grouped number with decimal part for ru", () => {
  assert.equal(scalar("1 234,56", RU), 1234.56);
});

test("operators and precedence", () => {
  assert.equal(scalar("2+3*4"), 14);
  assert.equal(scalar("(2+3)*4"), 20);
  assert.equal(scalar("10 - 4 - 3"), 3);
  assert.equal(scalar("12 / 3 / 2"), 2);
  assert.equal(scalar("6 × 7"), 42);
  assert.equal(scalar("8 ÷ 2"), 4);
  assert.equal(scalar("9 − 4"), 5);
  assert.equal(scalar("10 : 4"), 2.5);
});

test("unary minus", () => {
  assert.equal(scalar("-5+2"), -3);
  assert.equal(scalar("-(2+3)"), -5);
  assert.equal(scalar("5 * -2"), -10);
  assert.equal(scalar("--5"), 5);
  assert.equal(money("5 usd * -2").total, -10);
  assert.equal(money("-10 usd").total, -10);
});

test("percent", () => {
  near(scalar("100 + 15%"), 115);
  near(scalar("100 - 10%"), 90);
  near(scalar("50%"), 0.5);
  near(scalar("%15", TR), 0.15);
  near(scalar("100 + %15", TR), 115);
  near(scalar("%15 * 200", TR), 30);
  near(scalar("200 * 15%"), 30);
  near(money("100 usd - 10%").total, 90);
  near(money("100 eur + 20%", EN, "EUR").total, 120);
  near(money("50 eur * 10%", EN, "EUR").total, 5);
});

test("currency symbols prefix and suffix", () => {
  assert.equal(money("$10").total, 10);
  assert.equal(money("10 $").total, 10);
  near(money("10€", EN, "EUR").total, 10);
  near(money("€10", EN, "EUR").total, 10);
  near(money("₺100", TR, "TRY").total, 100);
  near(money("100₺", TR, "TRY").total, 100);
  near(money("£5", EN, "GBP").total, 5);
  near(money("10€").total, 10 / 0.9107);
  assert.deepEqual(money("₺100", TR).value, { TRY: 100 });
});

test("currency codes are case insensitive", () => {
  assert.deepEqual(money("10 USD").value, { USD: 10 });
  assert.deepEqual(money("10 Eur").value, { EUR: 10 });
  assert.deepEqual(money("eur 10").value, { EUR: 10 });
});

test("currency code glued to the number", () => {
  assert.deepEqual(money("10usd").value, { USD: 10 });
  assert.deepEqual(money("100tl", TR).value, { TRY: 100 });
});

test("currency names in several languages", () => {
  assert.deepEqual(money("10 dolar", TR).value, { USD: 10 });
  assert.deepEqual(money("10 euro").value, { EUR: 10 });
  assert.deepEqual(money("10 доллар").value, { USD: 10 });
  assert.deepEqual(money("10 美元").value, { USD: 10 });
  assert.deepEqual(money("10 ドル").value, { USD: 10 });
  assert.deepEqual(money("10 دولار").value, { USD: 10 });
  assert.deepEqual(money("10 euros").value, { EUR: 10 });
  assert.deepEqual(money("10 lira", TR).value, { TRY: 10 });
  assert.deepEqual(money("10 TL", TR).value, { TRY: 10 });
  assert.deepEqual(money("10 рублей").value, { RUB: 10 });
  assert.deepEqual(money("100美元").value, { USD: 100 });
});

test("names do not match inside longer words", () => {
  assert.equal(err("10 eurx").k, "unknown");
  assert.equal(err("totalx + 1").k, "unknown");
});

test("targets", () => {
  let r = money("10 usd in eur");
  assert.equal(r.target, "EUR");
  near(r.total, 9.107);
  r = money("10 usd kaç tl", TR);
  assert.equal(r.target, "TRY");
  near(r.total, 505.5);
  r = money("1000 tl kaç dolar", TR, "TRY");
  assert.equal(r.target, "USD");
  near(r.total, 1000 / 50.55);
  r = money("100 usd в рублях");
  assert.equal(r.target, "RUB");
  near(r.total, 8000);
  r = money("100 usd 换成人民币");
  assert.equal(r.target, "CNY");
  near(r.total, 668);
  r = money("100美元换成人民币");
  assert.equal(r.target, "CNY");
  near(r.total, 668);
  r = money("10 eur → usd", EN, "TRY");
  assert.equal(r.target, "USD");
  near(r.total, 10 / 0.9107);
  r = money("10 eur = usd", EN, "TRY");
  assert.equal(r.target, "USD");
  near(r.total, 10 / 0.9107);
  r = money("10 eur => usd", EN, "TRY");
  assert.equal(r.target, "USD");
  r = money("10 dollars to eur");
  assert.equal(r.target, "EUR");
  r = money("usd in eur");
  near(r.total, 0.9107);
});

test("default target is used without explicit target", () => {
  const r = money("10 usd", EN, "TRY");
  assert.equal(r.target, "TRY");
  near(r.total, 505.5);
});

test("target conversion of mixed sums", () => {
  const r = money("10 usd + 5 eur in try");
  assert.equal(r.target, "TRY");
  near(r.total, 505.5 + 5 * 50.55 / 0.9107);
  assert.equal(r.p.res.comps.length, 2);
});

test("bare number added to mixed money uses the line target", () => {
  const r = money("10 usd + 5 eur + 3 in try");
  near(r.total, 505.5 + 5 * 50.55 / 0.9107 + 3);
});

test("bare number added to single currency money takes that currency", () => {
  assert.deepEqual(money("10 usd + 5").value, { USD: 15 });
  assert.deepEqual(money("5 + 10 eur").value, { EUR: 15 });
});

test("gram and ounce gold and silver", () => {
  assert.deepEqual(money("5 gr altın", TR).value, { GAU: 5 });
  assert.deepEqual(money("5 gram altın", TR).value, { GAU: 5 });
  assert.deepEqual(money("1 ons altın", TR).value, { XAU: 1 });
  assert.deepEqual(money("1 oz gold").value, { XAU: 1 });
  assert.deepEqual(money("10 g silver").value, { GAG: 10 });
  assert.deepEqual(money("5 г золота").value, { GAU: 5 });
  assert.deepEqual(money("1克黄金").value, { GAU: 1 });
  assert.deepEqual(money("3 グラム 金").value, { GAU: 3 });
  assert.deepEqual(money("1 xau").value, { XAU: 1 });
  assert.deepEqual(money("2 gold").value, { GAU: 2 });
  near(money("1 oz gold").total, 1 / 0.000283);
  near(money("5 gr altın", TR).total, 5 / (0.000283 * CM.GRAM));
  near(money("1 ons altın", TR).total, money("31.1034768 gr altın", EN).total);
});

test("metal targets", () => {
  let r = money("1 eur in gold");
  assert.equal(r.target, "GAU");
  r = money("1 eur in gram gold");
  assert.equal(r.target, "GAU");
  r = money("1 usd in oz gold");
  assert.equal(r.target, "XAU");
  near(r.total, 0.000283);
});

test("crypto", () => {
  near(money("1 btc").total, 1 / 0.0000177);
  near(money("0.05 btc + 1 eth", EN, "USD").total, 0.05 / 0.0000177 + 1 / 0.000635);
  near(money("1 bitcoin in eth").total, 0.000635 / 0.0000177);
});

test("variables and reassignment", () => {
  const out = doc("maaş = 2.400 eur\nmaaş * 12 kaç dolar\nmaaş = 3000 eur\nmaaş\nMaaş + 1", TR);
  assert.equal(out[0].kind, "assign");
  assert.equal(out[0].name, "maaş");
  assert.deepEqual(out[0].value.m, { EUR: 2400 });
  assert.equal(out[1].target, "USD");
  near(out[1].res.total, 28800 / 0.9107);
  assert.deepEqual(out[3].value.m, { EUR: 3000 });
  assert.deepEqual(out[4].value.m, { EUR: 3001 });
});

test("scalar variables", () => {
  const out = doc("rate = 1.5\nx = rate * 4\nx + 1 usd");
  assert.equal(out[1].res.total, 6);
  assert.deepEqual(out[2].value.m, { USD: 7 });
});

test("failed assignment removes the variable", () => {
  const out = doc("x = 5\nx = foo\nx");
  assert.equal(out[1].kind, "error");
  assert.equal(out[2].kind, "error");
  assert.equal(out[2].err.k, "unknown");
});

test("variable used before assignment is unknown", () => {
  const out = doc("y + 1\ny = 2\ny + 1");
  assert.equal(out[0].kind, "error");
  assert.equal(out[2].res.total, 3);
});

test("single letter variable names", () => {
  const out = doc("a = 5\na * 2\ng = 3\ng + 1");
  assert.equal(out[0].kind, "assign");
  assert.equal(out[1].res.total, 10);
  assert.equal(out[2].kind, "assign");
  assert.equal(out[3].res.total, 4);
});

test("variable names starting with a currency code", () => {
  const out = doc("eur_rate = 2\neur_rate * 3");
  assert.equal(out[0].kind, "assign");
  assert.equal(out[1].res.total, 6);
});

test("labels", () => {
  let p = line("otel: 120 eur", EN, "EUR");
  assert.equal(p.label, "otel");
  near(p.res.total, 120);
  assert.ok(p.labelEnd > 0);
  p = line("toplam: 10 + 5");
  assert.equal(p.label, "toplam");
  assert.equal(p.res.total, 15);
  p = line("# title");
  assert.equal(p.kind, "label");
  assert.equal(p.label, "title");
  p = line("// note");
  assert.equal(p.kind, "label");
  p = line("otel:");
  assert.equal(p.kind, "error");
  p = line("Hotel 2:  ");
  assert.notEqual(p.kind, "expr");
});

test("label followed by only whitespace is a label line", () => {
  const p = line("otel: ");
  assert.equal(p.kind, "label");
  assert.equal(p.label, "otel");
});

test("labels containing digits", () => {
  const p = line("Q1: 100 eur", EN, "EUR");
  assert.equal(p.label, "Q1");
  near(p.res.total, 100);
});

test("empty lines", () => {
  const out = doc("\n   \n1");
  assert.equal(out[0].kind, "empty");
  assert.equal(out[1].kind, "empty");
  assert.equal(out[2].res.total, 1);
});

test("errors", () => {
  assert.equal(err("foo + 1").k, "unknown");
  assert.equal(err("foo + 1").x, "foo");
  assert.equal(err("10 usd * 2 eur").k, "mul");
  assert.equal(err("10/0").k, "div0");
  assert.equal(err("10 usd / 0").k, "div0");
  assert.equal(err("10 eur / (5 usd - 5 usd)").k, "div0");
  assert.equal(err("10 +").k, "syntax");
  assert.equal(err("(10 usd").k, "syntax");
  assert.equal(err("10 usd)").k, "syntax");
  assert.equal(err("10 usd 5 eur").k, "syntax");
  assert.equal(err("in eur").k, "syntax");
  assert.equal(err("2 ^ 3").k, "unknown");
  assert.equal(err("5 / 2 usd").k, "syntax");
});

test("missing rate", () => {
  let e = err("10 frank");
  assert.equal(e.k, "rate");
  assert.equal(e.x, "CHF");
  e = err("10 usd", EN, "ZZZ");
  assert.equal(e.k, "rate");
  assert.equal(e.x, "ZZZ");
  e = err("10 usd / 2 usdt");
  assert.equal(e.k, "rate");
});

test("money divided by money is a ratio", () => {
  near(scalar("10 usd / 5 eur"), 10 / (5 / 0.9107));
  near(scalar("1 btc / 1 eth"), 0.000635 / 0.0000177);
  assert.equal(scalar("10 eur / 5 eur"), 2);
});

test("money divided by a number", () => {
  assert.deepEqual(money("10 eur / 4").value, { EUR: 2.5 });
  assert.deepEqual(money("(10 + 5) eur").value, { EUR: 15 });
  assert.deepEqual(money("5 * (2 usd)").value, { USD: 10 });
});

test("applyFees sell", () => {
  const res = Object.assign({ target: "TRY" }, money("100 usd", EN, "TRY").p.res);
  const f = CM.applyFees(res, { spread: 2, commission: 1, fixed: 10, tax: 0.5 }, "sell");
  near(f.mid, 5055);
  near(f.foreign, 5055);
  near(f.spread, 50.55);
  near(f.commission, (5055 - 50.55) * 0.01);
  near(f.tax, 25.275);
  assert.equal(f.fixed, 10);
  near(f.cost, 50.55 + 50.0445 + 25.275 + 10);
  near(f.net, 5055 - f.cost);
  near(f.pct, f.cost / 5055);
});

test("applyFees buy", () => {
  const res = Object.assign({ target: "TRY" }, money("100 usd", EN, "TRY").p.res);
  const f = CM.applyFees(res, { spread: 2, commission: 1, fixed: 10, tax: 0.5 }, "buy");
  near(f.spread, 50.55);
  near(f.commission, (5055 + 50.55) * 0.01);
  near(f.cost, 50.55 + 51.0555 + 25.275 + 10);
  near(f.net, 5055 + f.cost);
});

test("applyFees profiles", () => {
  const res = Object.assign({ target: "TRY" }, money("100 usd", EN, "TRY").p.res);
  near(CM.applyFees(res, CM.PROFILES.bank, "sell").cost, 5055 * 0.0075);
  near(CM.applyFees(res, CM.PROFILES.card, "sell").cost, 5055 * 0.025);
  assert.equal(CM.applyFees(res, CM.PROFILES.mid, "sell").cost, 0);
});

test("applyFees ignores negative and invalid fee inputs", () => {
  const res = Object.assign({ target: "TRY" }, money("100 usd", EN, "TRY").p.res);
  const f = CM.applyFees(res, { spread: -5, commission: "x", fixed: -3, tax: null }, "sell");
  assert.equal(f.cost, 0);
  near(f.net, 5055);
});

test("applyFees only charges the foreign part", () => {
  const res = Object.assign({ target: "TRY" }, money("100 usd + 1000 tl", TR, "TRY").p.res);
  const f = CM.applyFees(res, { spread: 0, commission: 1, fixed: 0, tax: 0 }, "sell");
  near(f.foreign, 5055);
  near(f.commission, 50.55);
  near(f.net, 6055 - 50.55);
});

test("target-only lines produce zero cost", () => {
  for (const text of ["100 tl", "100 usd in usd", "5 eur kaç euro"]) {
    const p = line(text, TR, "TRY");
    const res = Object.assign({ target: p.target }, p.res);
    const f = CM.applyFees(res, { spread: 3, commission: 2, fixed: 25, tax: 1 }, "sell");
    assert.equal(f.cost, 0, text);
    assert.equal(f.fixed, 0, text);
    assert.equal(f.net, f.mid, text);
    assert.equal(CM.applyFees(res, { spread: 3, commission: 2, fixed: 25, tax: 1 }, "buy").cost, 0, text);
  }
});

test("convert skips zero components of mixed values", () => {
  const c = CM.convert({ k: "m", m: { USD: 0, EUR: 10 } }, "EUR", R);
  assert.equal(c.comps.length, 1);
  near(c.total, 10);
  const z = CM.convert({ k: "m", m: { USD: 0 } }, "EUR", R);
  assert.equal(z.total, 0);
});

test("median", () => {
  assert.equal(CM.median([5]), 5);
  assert.equal(CM.median([4, 2]), 3);
  assert.equal(CM.median([9, 1, 3]), 3);
  assert.equal(CM.median([4, 1, 3, 2]), 2.5);
});

test("merge with one source", () => {
  const m = CM.merge([{ id: "a", ok: true, R: { USD: 1, EUR: 0.9 } }]);
  assert.equal(m.R.EUR, 0.9);
  assert.equal(m.R.USD, 1);
  assert.equal(m.spread.EUR, 0);
});

test("merge with two sources averages", () => {
  const m = CM.merge([
    { id: "a", ok: true, R: { USD: 1, EUR: 0.9, TRY: 50 } },
    { id: "b", ok: true, R: { USD: 1, EUR: 0.92 } }
  ]);
  near(m.R.EUR, 0.91);
  assert.equal(m.R.TRY, 50);
  near(m.spread.EUR, 0.02 / 0.91);
  assert.equal(m.spread.TRY, 0);
});

test("merge with three sources takes median and skips failed sources", () => {
  const m = CM.merge([
    { id: "a", ok: true, R: { USD: 1, EUR: 0.9 } },
    { id: "b", ok: true, R: { USD: 1, EUR: 0.95 } },
    { id: "c", ok: true, R: { USD: 1, EUR: 0.91 } },
    { id: "d", ok: false, err: "x" },
    { id: "e", ok: true, R: { USD: 1, EUR: -1, GBP: Infinity } }
  ]);
  assert.equal(m.R.EUR, 0.91);
  assert.equal(m.R.GBP, undefined);
  const m3 = CM.merge([
    { id: "a", ok: true, R: { USD: 1, EUR: 0.9 } },
    { id: "b", ok: true, R: { USD: 1, EUR: 0.95 } },
    { id: "c", ok: true, R: { USD: 1, EUR: 0.91 } }
  ]);
  assert.equal(m3.R.EUR, 0.91);
});

test("merge with no sources still has USD", () => {
  const m = CM.merge([]);
  assert.deepEqual(m.R, { USD: 1 });
});

test("normalize with non-USD base", () => {
  const n = CM.normalize("try", { USD: 1 / 50.55, eur: 0.9107 / 50.55, XAU: 0.000283 / 50.55, bad: "x", neg: -2 });
  near(n.USD, 1);
  near(n.TRY, 50.55);
  near(n.EUR, 0.9107);
  near(n.XAU, 0.000283);
  near(n.GAU, 0.000283 * CM.GRAM);
  assert.equal(n.BAD, undefined);
  assert.equal(n.NEG, undefined);
});

test("normalize without USD returns empty", () => {
  assert.deepEqual(CM.normalize("TRY", { EUR: 0.018 }), {});
});

test("normalize defaults to USD base", () => {
  const n = CM.normalize(undefined, { EUR: 0.9 });
  assert.equal(n.USD, 1);
  assert.equal(n.EUR, 0.9);
});

test("pairQuotes", () => {
  const q = CM.pairQuotes([
    { id: "a", name: "A", ok: true, R: { USD: 1, EUR: 0.9, TRY: 45 }, time: 1 },
    { id: "b", name: "B", ok: true, R: { USD: 1, EUR: 0.9 }, time: 2 },
    { id: "c", ok: false }
  ], "EUR", "TRY");
  assert.equal(q.length, 1);
  near(q[0].v, 50);
});

test("fetchAll merges successful sources and reports failures", async () => {
  const fake = async (url) => {
    if (url.includes("frankfurter")) return { ok: true, json: async () => ({ date: "2026-11-20", rates: { EUR: 0.9, TRY: 50, GBP: 0.76 } }) };
    if (url.includes("er-api")) return { ok: true, json: async () => ({ result: "success", time_last_update_unix: 1, rates: { USD: 1, EUR: 0.92, TRY: 51 } }) };
    return { ok: false, status: 500 };
  };
  const out = await CM.fetchAll({ proxy: "", proxySources: [{ id: "p", name: "P", path: "/p" }], timeoutMs: 1000 }, fake);
  assert.equal(out.length, 6);
  assert.equal(out[0].ok, true);
  assert.equal(out[1].ok, true);
  assert.equal(out[2].ok, false);
  assert.equal(out[3].id, "goldapi");
  assert.equal(out[3].ok, false);
  assert.equal(out[4].id, "tcmb");
  assert.equal(out[4].ok, false);
  assert.equal(out[5].ok, false);
  assert.equal(out[5].proxy, true);
  const m = CM.merge(out);
  near(m.R.EUR, 0.91);
});

test("fetchAll proxy source with TRY base", async () => {
  const fake = async (url) => {
    if (url === "https://px.example/p") return { ok: true, json: async () => ({ base: "TRY", time: 5, rates: { USD: 1 / 50, EUR: 0.9 / 50, GBP: 0.76 / 50 } }) };
    return { ok: false, status: 500 };
  };
  const out = await CM.fetchAll({ proxy: "https://px.example/", proxySources: [{ id: "p", name: "P", path: "/p" }] }, fake);
  const p = out.find((x) => x.id === "p");
  assert.equal(p.ok, true);
  near(p.R.TRY, 50);
  near(p.R.EUR, 0.9);
  assert.equal(p.time, 5);
});

test("tokenize offsets map back to the source text", () => {
  const text = "otel: 120 eur in usd";
  const p = CM.parseLine(text, lex, EN);
  const slices = p.tokens.map((t) => text.slice(t.s, t.e));
  assert.deepEqual(slices, ["120", "eur", "in", "usd"]);
  const a = CM.parseLine("x = 5 usd", lex, EN);
  assert.deepEqual(a.tokens.map((t) => "x = 5 usd".slice(t.s, t.e)), ["x", "=", "5", "usd"]);
});

test("Arabic-Indic digits", () => {
  assert.deepEqual(money("١٠ دولار").value, { USD: 10 });
});

test("pairRate uses direct pair, then inverse, else zero", () => {
  const p = { "USD>TRY": 40, "TRY>EUR": 0.02 };
  assert.equal(CM.pairRate(p, "USD", "TRY"), 40);
  assert.equal(CM.pairRate(p, "TRY", "USD"), 1 / 40);
  assert.equal(CM.pairRate(p, "EUR", "TRY"), 50);
  assert.equal(CM.pairRate(p, "USD", "USD"), 0);
  assert.equal(CM.pairRate(p, "USD", "EUR"), 0.8);
  assert.equal(CM.pairRate(null, "USD", "TRY"), 0);
  assert.equal(CM.pairRate({ "USD>TRY": 40, "TRY>USD": 0.03 }, "TRY", "USD"), 0.03);
});

test("own pair overrides only that pair and works without market rates", () => {
  const pairs = { "USD>TRY": 40 };
  const out = CM.evalDocument("10 usd\n10 eur\n10 usd in eur\nx = 10 usd\nx", { lex, R, target: "TRY", fmt: EN, pairs });
  assert.equal(out[0].res.total, 400);
  assert.ok(Math.abs(out[1].res.total - 10 * R.TRY / R.EUR) < 1e-9);
  assert.ok(Math.abs(out[2].res.total - 10 * R.EUR) < 1e-9);
  assert.equal(out[4].res.total, 400);
  const bare = CM.evalDocument("10 usd\n10 eur", { lex, R: {}, target: "TRY", fmt: EN, pairs });
  assert.equal(bare[0].res.total, 400);
  assert.equal(bare[1].kind, "error");
  assert.equal(bare[1].err.k, "rate");
});

test("applyFees skips spread on components priced with an own rate", () => {
  const res = CM.convert({ k: "m", m: { USD: 100 } }, "TRY", R, { "USD>TRY": 40 });
  const f = CM.applyFees(Object.assign({ target: "TRY" }, res), { spread: 2, commission: 1, fixed: 0, tax: 0 }, "sell");
  assert.equal(f.spread, 0);
  assert.ok(Math.abs(f.commission - 40) < 1e-9);
});

test("tcmb source reads a fresh bundle and rejects a stale one", async () => {
  const fresh = { source: "TCMB", date: "x", time: Date.now() - 3600e3, base: "TRY", rates: { TRY: 1, USD: 1 / 50, EUR: 1 / 58, GBP: 1 / 66 } };
  const none = async () => ({ ok: false, status: 500 });
  globalThis.CM_TCMB = fresh;
  let out = await CM.fetchAll({ timeoutMs: 500 }, none);
  let t = out.find((x) => x.id === "tcmb");
  assert.equal(t.ok, true);
  assert.equal(t.official, true);
  near(t.R.TRY, 50);
  near(t.R.EUR, 50 / 58);
  globalThis.CM_TCMB = Object.assign({}, fresh, { time: Date.now() - 10 * 864e5 });
  out = await CM.fetchAll({ timeoutMs: 500 }, none);
  t = out.find((x) => x.id === "tcmb");
  assert.equal(t.ok, false);
  assert.equal(t.err, "stale");
  delete globalThis.CM_TCMB;
});

test("tcmb source prefers a configured url", async () => {
  const body = "window.CM_TCMB = " + JSON.stringify({ time: Date.now(), base: "TRY", rates: { TRY: 1, USD: 1 / 40, EUR: 1 / 45 } }) + ";";
  const fake = async (url) => (url === "https://example.test/tcmb.js" ? { ok: true, text: async () => body } : { ok: false, status: 404 });
  const out = await CM.fetchAll({ tcmbUrl: "https://example.test/tcmb.js", timeoutMs: 500 }, fake);
  near(out.find((x) => x.id === "tcmb").R.TRY, 40);
});

test("merge drops a source that deviates more than 5 percent", () => {
  const src = (id, tr) => ({ id, ok: true, R: { USD: 1, TRY: tr } });
  const m = CM.merge([src("a", 50), src("b", 50.2), src("c", 50.4), src("d", 80)]);
  near(m.R.TRY, 50.2);
  const two = CM.merge([src("a", 50), src("d", 80)]);
  near(two.R.TRY, 65);
});

test("turkish gold coins and karat grams", () => {
  const R = CM.normalize("USD", { TRY: 50, XAU: 1 / 3110.34768 });
  const lex = CM.buildLexicon(window.CM_I18N, Object.keys(R));
  const run = (s) => CM.evalDocument(s, { lex, R, target: "TRY", fmt: { dec: "," } })[0];
  const gram = 50 * 100;
  near(run("1 gr altın").res.total, gram);
  near(run("1 çeyrek").res.total, gram * 1.75 * 22 / 24);
  near(run("2 yarım altın").res.total, gram * 7 * 22 / 24);
  near(run("1 cumhuriyet altını").res.total, gram * 7.216 * 22 / 24);
  near(run("10 gr 22 ayar").res.total, gram * 10 * 22 / 24);
  near(run("10 gr 14 ayar altın").res.total, gram * 10 * 14 / 24);
  near(run("3 çeyrek + 1 tam altın").res.total, gram * (3 * 1.75 + 7) * 22 / 24);
  const q = run("9625 tl kaç çeyrek");
  assert.equal(q.target, "CEY");
  near(q.res.total, 9625 / (gram * 1.75 * 22 / 24));
});

test("net keyword is flagged and removed from the expression", () => {
  const R = CM.normalize("USD", { TRY: 50 });
  const lex = CM.buildLexicon(window.CM_I18N, Object.keys(R));
  const p = CM.evalDocument("10.000 tl net kaç dolar", { lex, R, target: "TRY", fmt: { dec: "," } })[0];
  assert.equal(p.net, true);
  assert.equal(p.target, "USD");
  near(p.res.total, 200);
  const q = CM.evalDocument("10.000 tl kaç dolar", { lex, R, target: "TRY", fmt: { dec: "," } })[0];
  assert.equal(q.net, false);
});

test("gold api source reads gold and silver in USD", async () => {
  const fake = async (url) => {
    if (url.endsWith("/XAU")) return { ok: true, json: async () => ({ currency: "USD", price: 3500, updatedAt: "2026-11-22T09:00:00Z" }) };
    if (url.endsWith("/XAG")) return { ok: true, json: async () => ({ currency: "USD", price: 40, updatedAt: "2026-11-22T09:00:00Z" }) };
    return { ok: false, status: 500 };
  };
  const out = await CM.fetchAll({ timeoutMs: 500 }, fake);
  const g = out.find((x) => x.id === "goldapi");
  assert.equal(g.ok, true);
  near(1 / g.R.XAU, 3500);
  near(1 / g.R.GAU, 3500 / CM.GRAM);
  near(1 / g.R.XAG, 40);
});

test("own rates are used for cross pairs through a common currency", () => {
  const pairs = { "USD>TRY": 49.5, "EUR>TRY": 57 };
  near(CM.pairRate(pairs, "USD", "EUR"), 49.5 / 57);
  near(CM.pairRate(pairs, "EUR", "USD"), 57 / 49.5);
  assert.equal(CM.pairRate(pairs, "GBP", "EUR"), 0);
  const R = CM.normalize("USD", { TRY: 50.57, EUR: 0.9115 });
  const lex = CM.buildLexicon(window.CM_I18N, Object.keys(R));
  const p = CM.evalDocument("100 usd - 45 eur = eur", { lex, R, target: "TRY", fmt: { dec: "," }, pairs })[0];
  near(p.res.total, 4950 / 57 - 45);
});

test("percentages stay percentages through division and variables", () => {
  const R = CM.normalize("USD", { TRY: 50 });
  const lex = CM.buildLexicon(window.CM_I18N, Object.keys(R));
  const out = CM.evalDocument("2.800 tl + %10 / 4\nbahsis = %10\n2.800 tl + bahsis", { lex, R, target: "TRY", fmt: { dec: "," } });
  near(out[0].res.total, 2870);
  near(out[2].res.total, 3080);
});

test("x multiplies between amounts and ambiguous words are not coins", () => {
  const R = CM.normalize("USD", { TRY: 50, EUR: 0.9, XAU: 0.0003 });
  const lex = CM.buildLexicon(window.CM_I18N, Object.keys(R));
  const out = CM.evalDocument("3x12,50 eur\n3 x 12,50 eur\nnetto = 100 eur\nnetto * 2\n1 tam altın", { lex, R, target: "EUR", fmt: { dec: "," } });
  near(out[0].res.total, 37.5);
  near(out[1].res.total, 37.5);
  near(out[3].res.total, 200);
  assert.equal(out[4].res.comps[0].c, "TAM");
  assert.equal(lex.map.has("tam"), false);
  assert.equal(lex.map.has("yarım"), false);
});

test("extra currency names and multiply words in context", () => {
  const R = CM.normalize("USD", { TRY: 50, SAR: 3.75, EUR: 0.9 });
  const lex = CM.buildLexicon(window.CM_I18N, Object.keys(R));
  const tr = CM.evalDocument("100 riyal\n2 mal 50 eur\nmal: 45 eur", { lex, R, target: "TRY", fmt: { dec: "," } });
  near(tr[0].res.total, 100 / 3.75 * 50);
  near(tr[1].res.total, 100 / 0.9 * 50);
  assert.equal(tr[2].label, "mal");
  const en = CM.evalDocument("10% of 2,800 try", { lex, R, target: "TRY", fmt: { dec: "." } });
  near(en[0].res.total, 280);
});

test("suffixed currency words resolve to their unit", () => {
  assert.equal(CM.stemHit(lex, "dolarım").c, "USD");
  assert.equal(CM.stemHit(lex, "euroyu").c, "EUR");
  assert.equal(CM.stemHit(lex, "liram").c, "TRY");
  assert.equal(CM.stemHit(lex, "dolr"), null);
  near(money("dolar 10 - 20liram", TR, "TRY").total, 10 * 50.55 - 20);
});

test("known words gate typos but allow units, keywords and names", () => {
  for (const w of ["dolar", "liram", "kaç", "in", "net", "g", "oz", "ayar", "k", "x", "yarım", "tam", "çeyrek"]) assert.equal(CM.knownWord(lex, w, null), true, w);
  for (const w of ["dolr", "ero", "sterln", "xyz"]) assert.equal(CM.knownWord(lex, w, null), false, w);
  assert.equal(CM.knownWord(lex, "maaş", new Set(["maaş"])), true);
  assert.equal(CM.editDistance("dolr", "dolar"), 1);
  assert.equal(CM.editDistance("uro", "ruo"), 1);
  assert.ok(CM.editDistance("a", "abcdef") > 2);
});

test("Turkish dative suffix on the last unit sets the target", () => {
  const a = money("50 euroyu dolara", TR, "TRY");
  assert.equal(a.target, "USD");
  near(a.total, 50 / 0.9107);
  assert.equal(money("100 sterlini liraya", TR, "USD").target, "TRY");
  assert.equal(money("10 dolarda", TR, "TRY").target, "TRY");
});

test("Turkish filler words after a conversion are ignored", () => {
  assert.equal(money("100 dolar kaç tl eder", TR, "USD").target, "TRY");
  assert.equal(money("100 dolar ne eder", TR, "TRY").target, "TRY");
  assert.equal(money("100 euro kaç eder", TR, "TRY").target, "TRY");
  assert.equal(CM.knownWord(lex, "eder", null), true);
});

test("audit cases: names, apostrophes and dative edge cases", () => {
  const d = doc("yeni = 5 usd\nyeni * 2\nsole = 3\nsole * 2", TR, "USD");
  near(d[1].res.total, 10);
  near(d[3].res.total, 6);
  assert.equal(money("100 tl'yi euroya", TR, "USD").target, "EUR");
  assert.equal(money("100 usd'yi euroya", TR, "TRY").target, "EUR");
  assert.equal(money("100 usd'ye", TR, "TRY").target, "TRY");
  assert.equal(CM.knownWord(lex, "tl'yi", null), true);
  assert.equal(CM.knownWord(lex, "sole", null), false);
  const g = money("100 sterline", TR, "TRY");
  assert.equal(g.target, "TRY");
  const k = doc("kira = 5000 tl\nkira euroya", TR, "USD");
  assert.equal(k[1].target, "EUR");
  assert.equal(money("100 евро сколько рублей", RU, "USD").target, "RUB");
});
