# Learning portal (topic index)

Single-page **hub** that links to each learning topic in this platform.

## Open locally

From **`interactive-educational-platform/`** (parent of this folder):

```bash
python3 -m http.server 8000
```

Then visit **http://localhost:8000/learning-portal/index.html**

Relative links (`../quant-trading/`, etc.) resolve correctly from that server root.

## Standalone hub (all topics, one server)

From the **repository root**:

```bash
npm run learning-hub
```

Open **http://127.0.0.1:3000/** — see [`../../docs/README.md`](../../docs/README.md).

## Adding a hub card or topic

See **[`docs/HUB-DEV-GUIDE.md`](../../docs/HUB-DEV-GUIDE.md)** — template hub in `docs/`, this `learning-portal/` mirror, placeholders, and `scripts/learning-hub.mjs`.
