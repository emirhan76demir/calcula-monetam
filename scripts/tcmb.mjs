import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const out = process.argv[2] || "data/tcmb.js";
const URL_TODAY = "https://www.tcmb.gov.tr/kurlar/today.xml";

class Stop extends Error {}
const fail = (msg) => {
  throw new Stop(msg);
};

async function main() {
  const res = await fetch(URL_TODAY, { headers: { "user-agent": "calcula-monetam" }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) fail("HTTP " + res.status);
  const xml = await res.text();
  if (xml.length > 200000) fail("unexpected size");

  const dm = /<Tarih_Date[^>]*\sDate="(\d{2})\/(\d{2})\/(\d{4})"/.exec(xml);
  if (!dm) fail("date not found");
  const date = dm[3] + "-" + dm[1] + "-" + dm[2];
  const time = Date.parse(date + "T12:30:00Z");
  if (!isFinite(time) || time > Date.now() + 864e5 || Date.now() - time > 10 * 864e5) fail("date out of range " + date);

  const num = (s) => {
    const v = parseFloat(String(s || "").trim());
    return isFinite(v) && v > 0 ? v : 0;
  };
  const tag = (block, name) => {
    const m = new RegExp("<" + name + ">([^<]*)</" + name + ">").exec(block);
    return m ? m[1] : "";
  };
  const p = (v) => +v.toPrecision(10);

  const rates = { TRY: 1 };
  const quotes = {};
  for (const m of xml.matchAll(/<Currency[^>]*CurrencyCode="([A-Z]{3})"[^>]*>([\s\S]*?)<\/Currency>/g)) {
    const code = m[1];
    const block = m[2];
    const unit = num(tag(block, "Unit")) || 1;
    const fb = num(tag(block, "ForexBuying"));
    const fs = num(tag(block, "ForexSelling"));
    if (!fb || !fs || fs < fb || fs / fb > 1.1) continue;
    rates[code] = p(unit / ((fb + fs) / 2));
    const q = { buy: p(fb / unit), sell: p(fs / unit) };
    const bb = num(tag(block, "BanknoteBuying"));
    const bs = num(tag(block, "BanknoteSelling"));
    if (bb && bs && bs >= bb) Object.assign(q, { cashBuy: p(bb / unit), cashSell: p(bs / unit) });
    quotes[code] = q;
  }

  if (!rates.USD || !rates.EUR || Object.keys(rates).length < 10) fail("incomplete data");
  const usdTry = 1 / rates.USD;
  if (usdTry < 1 || usdTry > 100000) fail("USD/TRY out of range " + usdTry);

  let prev = null;
  try {
    const t = await readFile(out, "utf8");
    prev = JSON.parse(t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1));
  } catch (e) {
    prev = null;
  }
  if (prev && prev.date === date) {
    console.log("TCMB: unchanged " + date);
    return;
  }
  if (prev && prev.rates && prev.rates.USD) {
    const jump = Math.abs(prev.rates.USD / rates.USD - 1);
    if (jump > 0.25) fail("USD/TRY changed " + (jump * 100).toFixed(1) + "% since " + prev.date);
  }

  const data = { source: "TCMB", date, time, base: "TRY", rates, quotes };
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, "window.CM_TCMB = " + JSON.stringify(data) + ";\n");
  console.log("TCMB: updated " + date + ", " + (Object.keys(rates).length - 1) + " currencies");
}

main().catch((e) => {
  console.error("TCMB: " + e.message);
  process.exitCode = 1;
});
