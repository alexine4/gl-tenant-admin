## Tenant Console UI — conventions

**No provider needed.** Every component here is a plain function component — no ThemeProvider, no context, no wrapping required. Just import and use.

**Styling idiom: Tailwind utility classes**, not props or CSS-in-JS. Every visual variant is expressed as a `className` string baked into the component (e.g. `Button`'s `variant`/`size` props select internal Tailwind classes) — you don't pass raw classes for color/shape, you pass the semantic prop. Real vocabulary used throughout:
- Surfaces/text: `bg-zinc-900`/`text-zinc-50` (dark chrome), `text-zinc-500`/`text-zinc-400` (secondary text), `border-black/10` (hairline borders) — always paired with a `dark:` variant (`dark:bg-zinc-900`, `dark:text-zinc-400`, `dark:border-white/10`). Dark mode activates automatically from OS `prefers-color-scheme` — there's no class or attribute to set.
- Semantic tone colors: emerald = positive/success, red = danger/negative, amber = warning, zinc = neutral. Same palette across `Badge` tones, `Alert` variants, and `Button` variants.
- Shape: `rounded-full` for buttons/badges (pill), `rounded-md`/`rounded-lg` for inputs/cards.

**Component API — real prop names:**
- `Button`: `variant` = `primary | secondary | danger | success | link`, `size` = `md | sm`.
- `Badge`: `tone` = `positive | neutral | warning | negative`.
- `Alert`: `variant` = `error | success`, `size` = `md | sm`.
- `TextField` / `SelectField`: optional `label` (omit for a bare input next to an already-labeled heading).
- `DataTable<T>`: generic over the row type; `density` = `comfortable | compact`, `hoverable` (comfortable only).
- Chart components (`LineChart`, `HBarChart`, `SplitBar`, `HeatmapRow`, `StatTile`) are data-driven — pass typed data arrays/series, not children.

**Chart components use a separate token system**, not Tailwind: each chart wraps itself in `<div className="viz-root">` and reads CSS custom properties via inline `style` — `var(--viz-series-1..4)` (categorical), `var(--viz-seq-250..650)` (sequential ramp for rankings/funnels), `var(--viz-text-primary)`, `var(--viz-text-secondary)`, `var(--viz-muted)`, `var(--viz-grid)`, `var(--viz-surface)`. When composing a *new* chart-like element, wrap it in `viz-root` and pull colors from these vars (defined in `styles.css` in this bundle) rather than inventing hex values, so it stays theme-aware.

**Where the truth lives:** `styles.css` is the real, compiled Tailwind output for this app (not a hand-authored stylesheet) — every utility class used anywhere in the product exists there. Each component's `.prompt.md` is synthesized from its type signature (no hand-written docs exist upstream), so trust the `.d.ts` prop names over any prose.

**Idiomatic composition** (a real pattern from this product — a labeled form with inline validation feedback):
```tsx
<form className="flex flex-col gap-4">
  <TextField label="Email" type="email" required />
  <TextField label="Password" type="password" required />
  {error && <Alert variant="error">{error}</Alert>}
  <Button type="submit" variant="primary">Sign in</Button>
</form>
```
