# design-sync notes for gl-tenant-admin

## Repo shape

This is a Next.js **app**, not a publishable component-library package — there is no `dist/`, no `main`/`module`/`exports` in `package.json`. The converter runs in **synth-entry mode**: `cfg.entry` is set to the deliberately-nonexistent `./dist/index.js` so the walk-up-to-package.json logic in `package-build.mjs` lands on the repo root (its `package.json` has a `name`), which makes `cfg.srcDir: "components"` correctly scope discovery to `components/ui/*.tsx` + `components/charts/*.tsx` instead of the default `lib/` (this repo's `lib/` holds business logic — Prisma, auth, TanStack Query hooks — not components).

## Excluded components

- `components/ToastHost.tsx` — excluded via `componentSrcMap: {"ToastHost": null}`. It's app plumbing (reads `@/store/hooks`, a Redux store mounted once in `app/console/layout.tsx`), not a reusable design primitive a design agent would compose into new screens.

## CSS source (re-sync risk — see below)

`cfg.cssEntry` points at `.next/static/chunks/40fxekphjy7ho.css` — Turbopack's **content-hashed** production build output (`npm run build`), not a stable path. This repo has no separate component-library build, so the only way to get a real compiled Tailwind v4 stylesheet (with every utility class actually used in the app, plus the Geist `@font-face` rules with local `.woff2` files) is `next build`'s own output.

## Overrides applied

- `overrides.DataTable: {"cardMode": "column"}` — the "Comfortable" story rendered wider than the product grid cell (`[GRID_OVERFLOW]`); fixed via a targeted `preview-rebuild.mjs --components DataTable` per the skill's guidance.

## Known render notes (not warns, just documented intent)

- `TableToggle`'s "Collapsed" story captures the component's true default state (just the "View as table" link) — the expanded table is behind internal `useState`, not a prop, so it isn't statically composable from a preview. This is correct/expected, not a gap.
- `LineChart`'s hover tooltip (driven by `onPointerMove`) isn't captured either, for the same reason — the static previews show the chart's resting state.

## Re-sync risks

- **`cssEntry`'s hash will change on every `next build`.** Before any re-sync, run `npm run build`, find the new hash under `.next/static/chunks/*.css` (the one containing `@font-face{font-family:Geist...}` and Tailwind utility rules — grep for `bg-zinc-900` to confirm), and update `cfg.cssEntry` in `.design-sync/config.json` accordingly. There is no stable path to point at instead — this is a real limitation of syncing an app's internal Tailwind build rather than a shipped package stylesheet.
- If new files are added under `components/ui/` or `components/charts/` with exported PascalCase function/class/const components, they'll be picked up automatically on the next sync (synth-entry scan). Anything added elsewhere in the repo (e.g. a future `components/forms/` dir) needs no config change — `srcDir: "components"` already covers the whole tree.
- All 17 synced components' previews are hand-authored in `.design-sync/previews/` and graded `good` — a re-sync only re-verifies components whose source or preview actually changed (via the uploaded `_ds_sync.json` anchor).
