# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML/CSS/vanilla JS, no build step, no dependencies. The folder must work when copied anywhere and opened via index.html (file://), and become an installable PWA when served over http(s). Nothing may reference the author's machine. A Cloudflare Worker proxy is planned later; the app exposes an empty proxy setting and runs fully without it.

## Users

Public, general audience. People who hold or spend several currencies (travellers, freelancers paid in foreign currency, people saving in USD/EUR/gold) and need to know what a mixed amount is worth, and what they will actually receive or pay after real-world costs.

## Product Purpose

Evaluate mixed-currency expressions such as "10 usd - 5 eur" into any target currency, using the median of several free rate sources, then show the net amount after spread, commission, fixed fee and tax. Success: the user trusts the number and understands what it costs them.

## Positioning

Not a single-pair converter. It reads arithmetic across currencies, line by line, shows where every rate came from and how far sources disagree, and separates the mid-market figure from the amount a bank or exchange office would really give.

## Operating Context

Quick lookups on phone or desktop; repeated use while travelling or before an exchange. Data from free public APIs, updated daily or hourly, never real-time; the interface states source and time.

## Capabilities and Constraints

- Fiat currencies, gold and silver (gram), crypto (BTC, ETH)
- Multi-line expressions, per-line results, total
- Fee profiles: spread, commission %, fixed fee, tax %, buy/sell direction
- Interface in 10 languages: Turkish, English, Russian, Chinese, Spanish, German, French, Arabic (RTL), Japanese, Portuguese
- Offline: last rates cached in the browser
- Informational only, not financial advice

## Product Principles

1. Honest numbers: always show source, time and the gap between mid rate and net amount.
2. Instant: no build, no framework, minimal bytes, works offline.
3. Portable: copy the folder, open it, it works.
4. Typing first: the expression is the interface.
