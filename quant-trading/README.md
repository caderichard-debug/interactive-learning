# Quant trading (static educational site)

Spare, dark UI aligned with [`../STYLE-GUIDE.md`](../STYLE-GUIDE.md) and concise structure inspired by [`../CONTENT-AND-RESEARCH-GUIDE.md`](../CONTENT-AND-RESEARCH-GUIDE.md).

**Chapters:** Overview → Sampling explorer → Returns & series → Costs → Backtest hygiene → Signals & decay → Risk & sizing (see sidebar + `index.html` tour).

## Run locally

**http://localhost:3005** (serves this directory):

```bash
cd quant-trading
python3 -m http.server 3005
# or: ./serve.sh
```

Then open [http://localhost:3005/](http://localhost:3005/). The **sidebar** loads from `partials/sidebar.html` via `layout.js` (resolved from the script URL), so it also works when the site is served under a **path prefix** (for example from the repo-root hub at `npm run learning-hub`). You still need **http(s)**, not `file://`, because `fetch` cannot load local partials from disk in most browsers.

You can open `index.html` over `file://` for a quick read, but the **injected sidebar** will not load without a local server.

## Email capture

Replace `YOUR_FORMSPREE_ID` in `index.html` with a [Formspree](https://formspree.io) form id, or swap the form action for your own endpoint.

## Not investment advice

Educational content only.
