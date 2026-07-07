# Ledgerline

**A live demo:** [https://pratikshadandriyal.github.io/ledgerline-app/](https://pratikshadandriyal.github.io/ledgerline-app/)

Ledgerline is an expense tracker built to answer a specific question: *what does an expense tracker look like when a data analyst builds it, instead of a generic CRUD app?* Every screen is backed by an actual statistical method — nothing is hardcoded or decorative — and the **Methodology** page inside the app documents exactly how each number is calculated, so nothing is a black box.

It was built end-to-end (design, logic, and deployment) using AI-assisted development, as a demonstration of applying data analysis knowledge to a real, functioning web product rather than just a notebook or dashboard.

---

## Why this exists

Most expense trackers stop at "here's a pie chart of your spending." Ledgerline goes further and asks the questions an analyst would actually ask of the data:

- Is this month's spending trending up or down, and by how much?
- Based on the trend so far, where will I likely end up by month-end?
- Which transactions don't fit the normal pattern for their category, and are worth double-checking?
- Which charges are quietly recurring every month, and what do they add up to per year?
- If I split expenses with someone, who actually owes whom?

It's useful in two ways at once: as an actual day-to-day tracker, and as a portfolio piece that shows applied statistics (not just chart-making) inside a real, deployed product.

---

## Features

### Core tracking
- Manual transaction entry (expense or income) with a **Paid by** field for shared expenses
- CSV import with a preview step before committing — auto-categorizes rows missing a category column
- Full edit/delete on every transaction, with a two-step confirm on delete so nothing is removed by accident
- CSV export of your full transaction history
- Optional receipt photo attachment per transaction

### Insights
- Monthly spending trend line
- Category breakdown (pie) for the current month
- Spending-by-weekday pattern (bar chart)
- Month-over-month % change
- Savings rate: `(income − expenses) ÷ income` for the current month
- Selectable date range: last 30 days, last 90 days, or all time

### Forecasting
- A **least-squares linear regression** fit to this month's cumulative daily spend, extrapolated to the last day of the month to project a month-end total
- Budget burn-rate tracking (spent-so-far vs. days elapsed vs. budget)
- Per-category budgets with live pacing bars, editable inline

### Smart suggestions
- **Auto-categorization**: a keyword rule-engine matches transaction notes (e.g. "Swiggy," "Zomato" → Food) — testable live on the Suggestions page
- **Outlier detection**: flags any transaction more than 2 standard deviations above its category's mean (a z-score approach)
- **Recurring-charge detection**: groups transactions by merchant and flags anything appearing in 2+ months with under 15% variation in amount as a subscription/recurring cost, with an estimated annual total
- Category-growth alerts (e.g. "Dining is up 40% vs. last month")

### Extras
- **Recurring templates** — set up Netflix, rent, salary, etc. once; the app tracks whether this month's occurrence has been logged and lets you add it in one click
- **Goals** — savings targets with a progress bar and a suggested monthly contribution to stay on pace
- **Shared ledger** — tag who paid for what, and see an equal-split balance across everyone involved
- **In-app notifications** — a live bell/badge summarizing budget overruns, outliers, due recurring charges, and goals falling behind schedule
- **Printable monthly report** — a clean one-page summary (income, expenses, savings rate, top category, key observations) exportable as a PDF via the browser's print dialog
- **Multi-currency display** — view figures in INR, USD, EUR, or GBP (data is stored in INR; conversion is display-only, using fixed approximate rates)
- **Dark mode**
- A "Start with a blank ledger" option on the landing page, separate from the pre-loaded demo dataset

---

## Tech stack

- **React** (function components + hooks, no external state library — all state is local `useState`/`useMemo`)
- **Vite** for the build tooling and dev server
- **Recharts** for all charts (line, bar, pie, area)
- **PapaParse** for CSV import/export
- **Lucide React** for icons
- Fonts: **Fraunces** (serif headings), **Inter** (body text), **IBM Plex Mono** (all monetary figures and tabular data, for a ledger-like feel)
- No backend — see "Current limitations" below

---

## Running it locally

```bash
git clone https://github.com/pratikshadandriyal/ledgerline-app.git
cd ledgerline-app
npm install
npm run dev
```

Then open the local URL Vite prints (typically `http://localhost:5173`).

## Deployment

Deployed via **GitHub Pages**, built with:

```bash
npm run deploy
```

which builds the app with Vite and publishes the `dist/` folder to the `gh-pages` branch, served directly from GitHub — no third-party hosting service involved.

---

## Current limitations (by design, for this version)

- **Data is in-memory only.** Refreshing the page resets it to the demo dataset (or clears it, if you've cleared/started blank). This keeps the project a pure front-end demo with zero setup cost for anyone viewing it.
- **Notifications are in-app only.** Real push/email alerts would require a backend service to trigger them outside an open browser tab.
- **The shared ledger works within a single session.** True multi-user sync (separate logins seeing the same live shared data) needs real accounts and a database.
- **Currency conversion uses fixed approximate rates**, not a live exchange-rate feed.

### Natural next step
Wiring the app to a real backend (e.g. Supabase) would resolve all four points above at once: persistent per-user accounts, row-level data security, real shared-ledger sync, and a foundation for actual push notifications. The in-memory `useState` calls in `App.jsx` are structured so that swapping them for database reads/writes is a contained change, not a rewrite.

---

## Author

Built by Pratiksha Dandriyal — a data analyst project demonstrating applied statistics (regression, z-score anomaly detection, pattern detection) inside a fully designed and deployed web product.
