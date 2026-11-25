# Calcula Monetam · Purpose and User Guide

## 1. Purpose

When you buy or sell currency, two questions come up: **"What is this worth?"** and **"What will I actually get?"** Most converters answer only the first, using a single source's mid-market rate. But banks and exchange offices apply a spread, commission, fixed fees and tax, so the real amount is always different.

Calcula Monetam answers both questions together:

- **It calculates mixed amounts on one line.** You can add, subtract, multiply and divide several currencies, as in `10 usd - 5 eur in try`.
- **It doesn't rely on one source.** It takes rates from several free sources and uses their median. It also shows how far the sources disagree.
- **It shows the net amount.** Starting from the mid rate, it subtracts or adds the spread, commission, fees and tax step by step, ending at what **you receive** or what **you pay**.
- **It accepts your own rate.** Enter your bank's rate and the calculation uses it, showing how far it is from the market median.

### Who is it for?

- Travellers who keep their budget in several currencies
- Freelancers paid in foreign currency
- People who save in dollars, euros, gold or crypto
- Anyone who wants to see whether the bank or the exchange office gives the better deal

### Principles

- **Honest numbers:** Every rate shows its source and how long ago it was updated. The gap between the mid rate and the net amount is never hidden.
- **Light and fast:** No install, server, account or ads. The whole app is under half a megabyte.
- **Portable:** Anyone who copies the folder can use it the same way.
- **Private:** What you type stays in your own browser.

> Calcula Monetam is for information only, not financial advice. Free sources update once a day; they are not live market data.

---

## 2. Getting started

1. Double-click `index.html` in the folder. The app opens in your browser.
2. Rates load within a few seconds. You'll see a note such as "Rates fetched 1 min ago" at the top right of the editor.
3. On first open the editor contains example lines. Delete them and write your own.

If the app is published on a website, you can install it on your phone or desktop with your browser's **Install app** option. Once installed it also works offline with the last saved rates.

### Parts of the screen

| Part | What it does |
|---|---|
| **Left panel** | Target currency, direction, fee profile, your rates, theme and language |
| **Centre: Calculations** | The editor where you write calculations line by line. Each line's result appears on the right, the total at the bottom. |
| **Right panel** | Details of the line under the caret: net amount, currency breakdown, fees, sources and the last 30 days |

On a phone, the left panel opens from the settings button at the top right.

---

## 3. Writing calculations

Each line is a separate calculation. Results update as you type.

### Basics

```
100 usd
10 usd - 5 eur
(250 + 120) eur
1,500 try in usd
```

- **Currencies** can be written three ways: code (`usd`, `eur`, `try`), symbol (`$`, `€`, `₺`, `£`) or name (`dollar`, `euro`, `pound`, `lira`).
- **Arithmetic and brackets** work: `+ - * / ( )`.
- **The target currency** is chosen in the left panel. To convert a single line to another currency, use the **currency button** next to that line's result; it adds `= eur` or similar to the end of the line. You can also type `in usd`, `to eur` or `→ gbp` yourself.

### Number format

Numbers are read using the rules of the language you selected. In English:

| You type | Read as |
|---|---|
| `2,400` | two thousand four hundred |
| `2.5` | two and a half |
| `1,234.56` | one thousand two hundred thirty-four point five six |
| `10k` | ten thousand |

### Percentages

```
250 eur + 18%
1,000 usd - 10%
```

`+ 18%` adds 18 percent to the amount; `- 10%` takes off 10 percent.

### Gold, silver and crypto

```
3 g gold
1 oz silver
0.05 btc + 0.5 eth
```

`gold` on its own is read as grams. Add `oz` for troy ounces.

**Turkish gold coins and karats:**

```
3 çeyrek + 1 yarım altın
2 republic gold
10 g 22 ayar
5,000 try in quarter gold
```

The Turkish gold coins `çeyrek`, `yarım altın`, `tam altın`, `ata altın` / `cumhuriyet` and `gremse` are recognised. They are coins, not fractions of an ounce: in results they appear as, for example, "Turkish gold coin (quarter)". "Tam" and "yarım" are everyday Turkish words, so write "altın" after them. They count as 22 karat and are valued by their pure gold content (a quarter is 1.75 g). Karats 8, 14, 18, 21, 22 and 24 work as in `10 g 22 ayar`. Jewellers add a workmanship margin; use **Your rates** to calculate with their price.

### Variables

Name a value and use it on later lines:

```
salary = 2,400 eur
rent = 900 eur
salary * 12 - rent * 12
```

### Labels and headings

```
# Trip budget
hotel: 4 * 120 eur
flight: 310 eur
food: 25 eur * 5
```

A line starting with `#` is a heading. A word ending in a colon, like `hotel:`, is a label and doesn't affect the calculation.

### Entering units without typing them

- **Quick buttons:** The USD, EUR, TRY, g gold, BTC and other buttons above the editor insert the unit at the caret. The ones you use most move to the front over time. Every other currency is in the **More…** list.
- **Autocomplete:** Suggestions appear after a couple of letters (`do` → dollar, `go` → gold). Use the arrow keys, then **Enter** or **Tab** to insert; **Esc** closes the list. Your variables are suggested too.

Insertions can be undone with **Ctrl+Z**.

On a phone, `+ − × ÷ ( ) %` keys appear below the unit buttons, so you don't have to switch keyboards.

---

## 4. Seeing the net amount

The large figure in the right panel is the amount after fees are subtracted or added.

### Direction

- **Selling:** You are exchanging foreign currency you hold. Fees are subtracted and the amount **you receive** is shown.
- **Buying:** You are buying foreign currency. Fees are added and the amount **you pay** is shown.

### Fee profile

| Profile | When |
|---|---|
| **Mid-market rate** | No fees, the pure calculation |
| **Bank** | Buying or selling currency in a banking app |
| **Exchange office** | A bureau de change |
| **Card abroad** | Paying by card in another country |
| **Crypto exchange** | Buying or selling crypto |
| **Custom** | Your own values |

The values in the profiles are examples. Changing any field switches the profile to **Custom** and saves your values.

| Field | Meaning |
|---|---|
| **Spread** | Total gap between buy and sell (%). Half applies in your direction. |
| **Commission** | Percentage per transaction |
| **Fixed fee** | Fixed amount per transaction, in the target currency |
| **Tax** | Percentage of the gross amount |

Fees apply only to the part **converted** into the target currency. On the line `100 try + 10 usd`, only the 10 dollars are charged.

### Working backwards: "How much do I need?"

Add the word `net` to a line and the app solves it in reverse:

```
10,000 try net in usd
```

- **Selling:** shows how many dollars **you need to sell** to receive 10,000 TRY net.
- **Buying:** shows how many dollars **you can buy** with 10,000 TRY, fees included.

Spread, commission, fixed fee and tax are all taken into account.

### Reading the right panel

- **Change due / Still owed:** when a line both adds and subtracts amounts (e.g. `100 usd - 45 eur`), a positive result is labelled **Change due** and a negative one **Still owed**, in red.

- **Breakdown** (the coloured bar): Each currency's share of the result. Hatched parts are negative.
- **Fee list:** Starts from the mid rate and lists each fee. **Lost to fees** shows the total loss, also as a percentage.
- **Sources:** Each source's rate, how long ago it updated and how far the sources disagree. The double line on the rail is the median.
- **Last 30 days:** The rate's trend. Move over the chart to see dated values.

The copy button at the top right copies the large figure.

---

## 5. Using your own rate

To calculate with the rate your bank or exchange office quotes:

1. Press **Set your rate** in the right panel. The pair you are looking at is added to the table with the current rate.
2. In **Your rates** in the left panel, correct the value, e.g. `1 USD = 49.80 TRY`.
3. Calculations update immediately. In Sources, the **Your rate** row shows how far your rate is from the market median.

Good to know:

- Your rate applies **only to that pair** and its inverse. If you entered USD/TRY, USD/EUR still uses the market rate.
- An institution's quoted rate already includes its spread, so **the spread is not subtracted again** for that part. Commission, fees and tax still apply.
- To switch a rate off without deleting it, untick its box. To delete it, press ×.

---

## 6. My wallet: tracking the cash in your pocket

The **My wallet** tab above the editor keeps track of the money you hold, currency by currency. It's made for travelling:

1. When you set off, enter your cash: type the amount, pick the currency (e.g. 300 · EUR) and press **Add**.
2. As you pay, type the amount and press **Spend**. Add a note such as "groceries" or "taxi" if you like.
3. **Total value** at the top shows everything you hold in the target currency. The coloured bar shows how much is in each currency.

- **Holdings:** what's left in each currency and its value. Spending more than you have is flagged in red.
- **Activity:** every addition and spend with its date and time. Remove a mistaken entry with ×.
- **Enter key:** repeats the last button you used; the first time it acts as **Add**. The highlighted button shows which one Enter will use.

Like everything else, your wallet is stored only in your browser. The total uses current rates, including your own.

## 7. Appearance, language and sharing

- **Theme:** Chosen at the bottom of the left panel: **Moneta** (coin cabinet), **Tabula** (exchange-office board), **Spectra** (dark, with the source rail in front), **Tessera** (airline ticket coupon) and **Pura** (plain, classic). You can also add `?theme=tabula` to the address.
- **Language:** Türkçe, English, Русский, 中文, Español, Deutsch, Français, العربية, 日本語, Português. The language also sets the number format. It doesn't matter which language you write currency names in; all are recognised.
- **Sharing:** When the app is published on a website, the link button above the editor copies a link containing your calculations. Whoever opens it sees the same lines; their own saved work is not deleted.

---

## 8. Frequently asked questions

**How often do rates update?**
While the app is open it checks every 30 minutes. The sources themselves update once a day; TCMB only on working days. For a live rate, enter your bank's rate under **Your rates**.

**Does it work offline?**
Yes. The last downloaded rates are kept in your browser, and the screen tells you when you're offline.

**Where does my data go?**
Nowhere. Your calculations, settings and own rates are stored only in your browser. The app connects only to the rate sources to download rates.

**Why do TCMB rates update later than the others?**
The Central Bank of Türkiye publishes rates on working-day afternoons. The app reads them not from the bank directly but from a file inside the project that is updated automatically every working day. On weekends and holidays you see the last working day's rate; TCMB data older than 5 days is never used.

**It says "Unrecognized term".**
That line contains a word the app doesn't understand; it's underlined with a wavy line in the editor. It may be a typo, or a variable that hasn't been defined yet.

**It says "No rate found".**
No source has a rate for that currency, or rates haven't loaded yet. Press the refresh button at the top right.

**Did I lose my calculations?**
If you cleared your browser's site data or used a private window, your saved work may be gone. In normal use, everything is saved automatically.

---

## 9. Shortcuts

| Key | What it does |
|---|---|
| **↑ / ↓** | Move through suggestions |
| **Enter / Tab** | Insert the selected suggestion |
| **Esc** | Close the suggestion list or the settings panel on mobile |
| **Ctrl+Z** | Undo the last change |

Clicking a value in the results column moves the caret to that line.
