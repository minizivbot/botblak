# Trading Journal

A full-stack trading journal built with **Next.js (App Router) + TypeScript + Tailwind CSS**,
**SQLite + Prisma**, and **Recharts**. Dark-mode UI, mobile responsive, runs entirely on your machine.

## Features

- **Trade log** — add / edit / delete trades (symbol, long/short, entry/exit price, size, fees,
  entry/exit date-time, strategy tag, notes, screenshot upload). Open trades (no exit yet) are supported.
- **Broker sync**
  - **CSV import** with presets for **MetaTrader 4**, **MetaTrader 5**, and a **generic CSV** with
    manual column mapping and a preview before importing. Duplicate rows (same ticket id) are skipped.
  - **Broker API adapters** — a clean `BrokerAdapter` interface with a working **Alpaca**
    (paper-trading) adapter that pulls filled orders and pairs them FIFO into round-trip trades.
- **Dashboard** — total P&L, win rate, profit factor, average win/loss, expectancy, max drawdown,
  best/worst trade; equity curve; P&L by day/week/month; P&L by symbol and by strategy;
  calendar heatmap of daily P&L.
- **Journal** — daily notes with mood and discipline ratings (1–5) and lessons learned,
  linked to that day's trades.
- **Filters everywhere** — date range, symbol, strategy, and direction on the dashboard and trade log
  (filter state lives in the URL, so views are shareable/bookmarkable).
- **Settings** — starting balance and display currency. Broker keys stay in `.env` on the server and
  are never sent to the browser.

## Setup

Requires **Node.js 18.18+** (tested on Node 22).

```bash
# 1. Install dependencies
npm install

# 2. Create your env file
cp .env.example .env

# 3. Create the SQLite database and seed 30 sample trades
npm run setup        # = prisma generate + prisma db push + prisma db seed

# 4. Run it
npm run dev
```

Open <http://localhost:3000> — the dashboard is already populated with the seeded sample data.

To wipe and re-seed at any time: delete `prisma/dev.db` and run `npm run setup` again
(re-running `npm run db:seed` alone also refreshes the sample trades).

## Adding your broker keys (Alpaca)

1. Sign up at [alpaca.markets](https://alpaca.markets) and open the **Paper Trading** dashboard.
2. Generate an API key pair (key ID + secret).
3. Put them in `.env`:

   ```ini
   ALPACA_API_KEY_ID="PK..."
   ALPACA_API_SECRET_KEY="..."
   ALPACA_BASE_URL="https://paper-api.alpaca.markets"
   ```

4. Restart the dev server, go to **Import & Sync**, and press **Sync now** under *Alpaca (paper)*.

Keys are read server-side from `process.env` only. The client only ever sees a boolean
"configured / not configured" status. `.env` is git-ignored — never commit it.

## Adding another broker

Adapters live in `src/lib/brokers/`:

1. Create `src/lib/brokers/mybroker.ts` implementing the `BrokerAdapter` interface
   (`id`, `label`, `isConfigured()`, `fetchTrades()` returning normalized round-trip trades).
2. Register it in `src/lib/brokers/index.ts`.

It automatically appears on the **Import & Sync** and **Settings** pages, and syncs via
`POST /api/sync/<id>`. Use a stable `externalId` per trade so repeated syncs deduplicate.

## CSV import formats

- **MetaTrader 4** — export *Account History* as CSV/HTML-saved-as-CSV
  (Ticket, Open Time, Type, Size, Item, Price, Close Time, Price, Commission, …).
- **MetaTrader 5** — deals/positions history export (Time, Symbol, Type, Volume, Price, …).
- **Generic** — any CSV: pick the file, then map your columns to trade fields by hand.
  Required: symbol, direction (buy/sell/long/short), entry price, size, entry date.

Rows that aren't trades (balance/credit lines in MT statements) are skipped automatically and
counted in the import summary.

## Project layout

```
prisma/schema.prisma        # Trade, JournalEntry, Settings models (SQLite)
prisma/seed.ts              # 30 realistic sample trades + journal entries
src/lib/stats.ts            # P&L, win rate, profit factor, expectancy, drawdown, buckets
src/lib/brokers/            # BrokerAdapter interface + Alpaca implementation
src/lib/csv.ts              # MT4/MT5/generic column-mapping presets + row parser
src/app/api/                # REST routes (trades CRUD, import, sync, journal, settings, upload)
src/app/                    # dashboard, trades, journal, import, settings pages
src/components/             # charts (Recharts), filter bar, forms, tables
public/uploads/             # trade screenshots (git-ignored)
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run setup` | Generate Prisma client, create DB schema, seed sample data |
| `npm run db:seed` | Re-seed sample trades only |
