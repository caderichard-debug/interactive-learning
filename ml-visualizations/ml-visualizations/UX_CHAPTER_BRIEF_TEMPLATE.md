# ML Visualizations — Chapter UX Brief (Fill-In Template)

Use this document when you want a **content-only model** to produce copy and visual intent **without** writing React. Paste a completed brief back into the implementation chat; the engineer will map fields to `app/chapters/<slug>/page.tsx`, `Sidebar.tsx`, and `app/page.tsx` as needed.

---

## How to use this template

1. **Duplicate this file** (or copy the block below into a new doc) per chapter.
2. Replace every `[FILL: …]` placeholder. Do **not** invent framework APIs; describe behavior in plain language.
3. Prefer **measurable** specs (counts, ranges, default values) over vague adjectives.
4. For visuals, describe **layout**, **states**, and **what changes when the user acts** — not pixel-perfect art direction unless necessary.
5. Keep **three** concept cards unless you have a strong reason to change count (matches existing chapters).

---

# Chapter brief — `[FILL: short title]`

## A. Routing and placement

| Field | Value |
|--------|--------|
| Chapter number (sidebar order) | `[FILL: e.g. 08]` |
| URL slug (folder name under `app/chapters/`) | `[FILL: kebab-case-slug]` |
| Previous chapter (href + link label) | `[FILL: /chapters/... , “← …”]` |
| Next chapter (href + link label) or home | `[FILL: primary CTA vs secondary]` |
| Home page card: one-line hook | `[FILL: ≤ 120 chars]` |

---

## B. Page shell (matches existing chapters)

**Outer page padding / rhythm** (default if unsure: `32px 40px 24px`, vertical gap `24px`).

- **Page title (H1)**  
  `[FILL: display title]`

- **Subtitle / deck (1–2 sentences, max width ~640px tone)**  
  `[FILL: what the reader will do + why it matters]`

**Main grid** (default layout in current site: `grid-template-columns: 1fr 1fr`, gap `20px`, `align-items: stretch`, `min-height` ~`520px`; controls column uses flex with a growing middle and bottom-anchored primary actions):

- **Left: visualization panel** — `background: var(--visual-box)`, `border-radius: 12px`, `padding: 24px`
- **Right: controls panel** — same surface treatment, `padding: 20px`

If your chapter needs a different layout, specify **columns**, **min widths**, and **mobile behavior** in section D.

---

## C. Visualization panel (primary demo)

### C1. Panel header row

- **Left label** (mono, uppercase, describes mode or dataset):  
  `[FILL]`
- **Right status** (optional: step counter, epoch, FPS, “live / paused”):  
  `[FILL or N/A]`

### C2. Main graphic — regions

Describe each **region** left-to-right or top-to-bottom:

| Region ID | Purpose | Approx size / aspect | Interaction |
|-----------|---------|----------------------|---------------|
| R1 | `[FILL]` | `[FILL]` | `[hover / click / drag / none]` |
| R2 | `[FILL]` | `[FILL]` | `[…]` |

**Visual encoding legend** (colors map to meaning — align with design system):

- Coral `#e07060`: `[FILL: what it means]`
- Cyan `#5ba3b5`: `[FILL]`
- Violet `#8b7aa8`: `[FILL]`
- Neutral strokes `#333` / fills `#2a2928`: `[FILL]`

### C3. States and animation

- **Initial state** (what loads first): `[FILL]`
- **User-driven transitions** (what updates immediately): `[FILL]`
- **Playback / stepping** (if any): timing `[FILL: ms]`, loop or one-shot `[FILL]`
- **Empty / loading / invalid** states: `[FILL or N/A]`

### C4. Readout / formula strip (optional)

Many chapters include a **second row** inside the viz panel (equation, numeric breakdown, selected edge label).

- **Title of strip**: `[FILL]`
- **What numbers appear and how they’re labeled**: `[FILL]`
- **Pinned vs hover behavior** (if both): `[FILL]`

---

## D. Controls panel

List **every** control in top-to-bottom order. Implementation usually maps each row to a labeled block with mono captions.

| # | Control type | Label | Range / options | Default | Side effect on viz |
|---|----------------|-------|------------------|---------|---------------------|
| 1 | `[slider / buttons / toggle / …]` | `[FILL]` | `[FILL]` | `[FILL]` | `[FILL]` |
| 2 | … | … | … | … | … |

**Reset behavior** (what “Reset” must restore): `[FILL]`

**Presets** (if any — name + what they set):  
1. `[FILL]`  
2. `[FILL]`

---

## E. Secondary content (between viz and footer)

Pick what applies:

- **None**
- **Comparison / two-column explainer** (like Encoder vs Decoder blocks):  
  - Column A title + bullets: `[FILL]`  
  - Column B title + bullets: `[FILL]`
- **Short “Key equations”** (render as plain text / LaTeX intent — not JSX): `[FILL or N/A]`

---

## F. Key concept cards (×3)

Each card: title + paragraph (`~2–4` sentences, teaching not marketing).

| # | Card title | Accent color role (coral / cyan / violet) | Body copy |
|---|------------|-------------------------------------------|-----------|
| 1 | `[FILL]` | `[FILL]` | `[FILL]` |
| 2 | `[FILL]` | `[FILL]` | `[FILL]` |
| 3 | `[FILL]` | `[FILL]` | `[FILL]` |

---

## G. Chapter navigation footer

- **Left link** (text + destination): `[FILL]`  
- **Right link** (text + style: primary coral button vs outline): `[FILL]`

---

## H. Content constraints (do not violate)

- **Dark-first** UI; text is high-contrast on `#21201e`-class backgrounds.
- **Primary CTA / emphasis**: coral `#e07060` — not default blue.
- **Typography roles**: `var(--font-display)` for card titles; `var(--font-body)` for prose; `var(--font-mono)` for labels, ticks, and numeric readouts.
- **Interactions**: hovers stay subtle; active selections use light coral tint `rgba(224,112,96,0.08–0.15)` and thin `rgba(224,112,96,0.35)` borders — match existing chapters.
- **Client components**: pages with state use `'use client';` at top of `page.tsx`.

---

## I. Accessibility and pedagogy

- **Keyboard**: should focusable controls include `[FILL]`? (If unknown, write “match existing chapters — buttons/sliders only”.)
- **Motion**: respect reduced motion? `[yes / no / N/A]` — if yes, describe simplified static fallback: `[FILL]`
- **Learning goal** (one sentence — what mental model the user leaves with): `[FILL]`

---

## J. Open questions for implementer

List uncertainties so the engineer can make a judgment call:

1. `[FILL or “none”]`
2. `[FILL or “none”]`

---

## Appendix — design tokens (reference only)

Do not paste long CSS into briefs; **name tokens** when needed.

| Token | Role |
|--------|------|
| `var(--bg)` | Page background |
| `var(--visual-box)` | Viz / control surfaces |
| `var(--grid-line)` | Hairline borders |
| `var(--text-primary)` / `var(--text-secondary)` / `var(--text-muted)` | Text hierarchy |
| `var(--accent-coral)` | Primary accent, CTAs |
| `var(--accent-cyan)` | Secondary viz accent |
| `var(--accent-violet)` | Tertiary accent |
| `var(--font-display)` / `var(--font-body)` / `var(--font-mono)` | Type roles |

---

## Minimal example (shape reference only)

**Title:** Logistic Regression Intuition  
**Deck:** Drag a decision boundary; watch how loss and gradients respond when points are misclassified.  
**Viz:** 2D scatter of two classes; draggable line; heat tint for model confidence.  
**Controls:** learning rate slider; class balance preset buttons.  
**Cards:** decision boundary vs posterior; why cross-entropy; linear separability limits.

---

_End of template_
