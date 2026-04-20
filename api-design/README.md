# API design: contracts, compatibility, and limits

Static starter site: five chapter topics plus an animated explorer (token bucket + fixed window, cache vs wire shape, REST 1+N vs one hop, production default cards).

## Run locally

```bash
cd api-design
./serve.sh
# or: python3 -m http.server 3007
```

Open http://localhost:3007/ — the sidebar loads via `fetch`; use http(s), not `file://`. The animated explorer compares token bucket and fixed-window limits side by side (match arrival sliders for a fair comparison).
