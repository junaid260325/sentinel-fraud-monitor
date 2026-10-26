# Sentinel Fraud Monitor

A responsive, browser-based credit card fraud monitoring demo. The public website opens directly to its Overview page; no login is required.

## Run it

For the best experience, run `py -m http.server 8000` from this folder and visit `http://localhost:8000`. You can also open `index.html` directly in a modern browser.

## What works

- Search transactions and filter by risk level or review status.
- Inspect a transaction's details and rules-based risk signals; approve, block, or reopen it for review.
- Import CSV transactions and download either all transactions or the currently filtered list.
- Simulate incoming transactions and see the dashboard update.
- Save transaction decisions and imported/demo activity in browser local storage.
- Explore dedicated Overview (`dashboard.html`), Transactions (`transactions.html`), and Risk Model (`risk-model.html`) pages using the workspace navigation.
- View transaction activity and risk distribution based on the current local dataset.

The pages are `dashboard.html` (Overview), `transactions.html` (Transactions), and `risk-model.html` (Risk model).

CSV imports require `merchant` and `amount` columns. Optional columns: `id`, `category`, `cardholder` (or `holder`), `card`, `currency`, `location`, `time`, and `status`.

## Important limitations

This is a client-side demonstration, not a payment processor or production fraud detection system. Risk scores use simple, visible heuristics and are not produced by a trained model. The sample records are fictional. Data stays in the browser's local storage; there is no server, bank connection, authentication, or real-time payment feed. Do not enter real cardholder data.
