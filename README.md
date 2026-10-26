# Sentinel Fraud Monitor

A responsive, browser-based credit card fraud monitoring demo with a sign-in page. No installation or build step is required.

## Run it

For the best experience, run `py -m http.server 8000` from this folder and visit `http://localhost:8000`. You can also open `index.html` directly in a modern browser.

Demo sign-in: `jordan.davis@sentinel.demo` / `SentinelDemo26!`

## What works

- Search transactions and filter by risk level or review status.
- Inspect a transaction's details and rules-based risk signals; approve, block, or reopen it for review.
- Import CSV transactions and download either all transactions or the currently filtered list.
- Simulate incoming transactions and see the dashboard update.
- Save transaction decisions and imported/demo activity in browser local storage.
- View transaction activity and risk distribution based on the current local dataset.
- Sign in and out of the local demo workspace.

CSV imports require `merchant` and `amount` columns. Optional columns: `id`, `category`, `cardholder` (or `holder`), `card`, `currency`, `location`, `time`, and `status`.

## Important limitations

This is a client-side demonstration, not a payment processor or production fraud detection system. Sign-in is a demo-only client-side gate, not secure authentication. Risk scores use simple, visible heuristics and are not produced by a trained model. The sample records are fictional. Data stays in the browser's local storage; there is no server, bank connection, real authentication, or real-time payment feed. Do not enter real credentials or cardholder data.
