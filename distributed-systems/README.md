# Distributed systems (static site)

Spare UI aligned with [`../../STYLE-GUIDE.md`](../../STYLE-GUIDE.md). Same shell pattern as `quant-trading`: sidebar via `layout.js` + `partials/sidebar.html`, **relative** asset paths so it works from a local server root or a path prefix.

## Run locally

```bash
cd distributed-systems
python3 -m http.server 3006
# or: ./serve.sh
```

Open [http://localhost:3006/](http://localhost:3006/). Use **http(s)** so the sidebar partial loads (`fetch` does not work from `file://`).

## Chapters

CAP → timeouts & retries → partitions → eventual consistency → consensus sketch → leader election → log replication.

**Explorer** (`visuals.html`): three canvases — partition vs quorum, leader-term rounds, log append (anchors `#explorer-partition`, `#explorer-term`, `#explorer-log`).

## Hub

Included in the standalone hub build (`npm run learning-hub` from the repo root) — see [`../../docs/HUB-DEV-GUIDE.md`](../../docs/HUB-DEV-GUIDE.md).
