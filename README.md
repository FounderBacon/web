# FounderBacon Web

The official companion web app for **Fortnite: Save the World** — heroes, weapons, traps, perks, build calculator and persistent loadout. Built on top of the [FounderBacon API](https://api.founderbacon.com).

Live: [founderbacon.com](https://founderbacon.com)
Staging: [staging.founderbacon.com](https://staging.founderbacon.com)
API docs: [api.founderbacon.com/docs](https://api.founderbacon.com/docs)

## Stack

- **Next.js 16** (App Router) — RSC + ISR
- **TypeScript** strict, named exports
- **Tailwind CSS v4** with custom rarity palette
- **Radix UI** for primitives (Dialog, Tooltip, Tabs, etc.) via `radix-ui`
- **framer-motion** for animations (fan-out cards, reveal modals)
- **Zustand** for loadout persistence (localStorage)
- **modern-screenshot** for build screenshot export
- Hosted on **Vercel**

## Getting started

```bash
# Install
npm install

# Local dev
npm run dev          # http://localhost:3000

# Build / production preview
npm run build
npm run start

# Type check
npx tsc --noEmit
```

### Required env vars

Copy `.env.example` to `.env.local` and fill:

```ini
# Public API base URL (read at build time, inlined into the bundle)
NEXT_PUBLIC_API_URL=https://dev-api.founderbacon.com

# Optional : internal server-side fetch URL (used by RSC)
API_URL_INTERNAL=
```

For local development against a local backend, point `NEXT_PUBLIC_API_URL` to `http://localhost:3030` (or whichever port your local `founderbacon-api` runs on).

## Project structure

```
app/
  [locale]/            # i18n routing : /en, /fr
    (public)/          # Public-facing pages
      page.tsx         # Home
      heroes/[slug]/   # Hero detail
      weapons/[type]/[slug]/   # Weapon detail + build calc
      traps/[slug]/    # Trap detail + build calc
      hero-loadout/    # Full loadout builder page
      search/{weapons,traps,heroes,survivors}/  # Search hubs
      changelog/       # Public changelog (sourced from API)
      roadmap/         # Public roadmap
      feedback/        # Feedback form
      privacy/         # Privacy policy
    (auth)/            # Authenticated routes (Epic OAuth)
components/
  public/              # Search views, FanCard, CardRevealModal, etc.
  weapons/             # Weapon detail columns + screenshot dialog
  traps/               # Trap detail columns + screenshot dialog
  loadout/             # Loadout drawer + builder + screenshot dialog
  feedback/            # Feedback form + sidebar
  share/               # QR + screenshot share helpers
  ui/                  # Generic primitives (button, dialog, tabs, tooltip, ...)
lib/
  api/                 # Typed clients for each /v1/* endpoint
  types/               # Domain types (shared, weapon, trap, hero, grouped, ...)
  loadout/             # Zustand store + selectors + URL serializer
  i18n.ts              # Locale dictionary loader
  cdn.ts               # Asset URL builders
content/
  privacy.{en,fr}.md   # Privacy policy (rendered via react-markdown)
lang/
  {en,fr}.json         # i18n strings (fr.json uses ASCII — no diacritics)
```

## Branches & environments

| Branch | Deploys to | API target |
|---|---|---|
| `development` | [staging.founderbacon.com](https://staging.founderbacon.com) | `https://dev-api.founderbacon.com` |
| `main` | [founderbacon.com](https://founderbacon.com) (production) | `https://api.founderbacon.com` |

Merge `development` → `main` once a release is validated on staging.

## Sibling backend repo

This front lives next to [founderbacon-api](https://github.com/FounderBacon/founderbacon-api). When working on features that cross both sides (e.g. new endpoints, query params), keep both in sync and deploy the API **first** so the front has something to talk to.

## Conventions

- **Commits**: conventional commits in English (`feat`, `fix`, `chore`, `refactor`, `docs`, `style`, `test`).
- **i18n French**: `lang/fr.json` and `content/privacy.fr.md` use **ASCII only** (no diacritics) — project convention.
- **Comments**: French allowed inside code, English in commit messages and public-facing strings.
- **Named exports** by default. `export default` only where a framework requires it (Next.js pages, layouts).
- **No emojis** in code or commits unless explicitly requested.

## Key features

- **Hero & weapon catalog** with full-text search, faceted filters and **boost-search** for heroes (find every hero whose perks mention "minigun", "crit damage", etc.).
- **Rarity-grouped cards** with a fan-out hover on desktop and a card-reveal modal on mobile, avoiding visual duplication when an item exists across multiple rarities.
- **Build calculator** for weapons and traps: live stats via `/v1/calculate`, perk slot selector with tier slider, hero loadout bonus applied.
- **Persistent loadout** stored in localStorage (commander, 5 supports, team perks, F.O.R.T. offensive), shared via URL params + restored on detail pages.
- **Build sharing** : copy URL, QR code (raw + branded template), 1920×1080 JPG screenshot export for weapons, traps and full loadouts.
- **Public feedback** form (multipart with image uploads) with anti-bot honeypot and IP-hashed rate limiting on the API side.
- **i18n** EN / FR with proper hreflang + canonical, sitemap and per-page metadata.

## Feedback

Got something to report or suggest? [Open the in-app feedback form](https://founderbacon.com/en/feedback) or ping us on Discord. Bug reports and feature ideas go to the same queue.

## License

Internal project. All rights reserved.
