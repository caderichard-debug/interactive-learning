@AGENTS.md

**App shell:** `app/layout.tsx` wraps all routes in `AppShell` → fixed **Sidebar** (220px) + one scrolling main column per **STYLE-GUIDE.md** (`app/components/AppShell.tsx`, `Sidebar.tsx`).

**Chapter list parity:** `app/components/HomeChapters.ts` is the single list of **implemented** chapter routes (home + sidebar). Add a chapter page under `app/chapters/<slug>/page.tsx`, then append an entry to `HomeChapters.ts` and keep numbering consistent.

**Email capture:** `app/components/EmailCapture.tsx` → optional `POST` to `NEXT_PUBLIC_FORMSPREE_FORM_ENDPOINT` (browser); demo mode if unset. Home: full block in `app/page.tsx`. Chapter routes: compact strip in `app/chapters/layout.tsx`. Env: `.env.example`.
