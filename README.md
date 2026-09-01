# Formula Graph

> Type a formula, get a graph. Free, no signup, share by link.

A fast, no-account graph plotter for educators and content creators. Built for the web, optimized for embedding in slides, docs, and chat.

## Quick start

```bash
npm install
npm run dev      # http://localhost:3000
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Local dev server with HMR |
| `npm run build` | Production build (static prerender) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint via `next lint` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit tests |
| `npm run e2e` | Playwright smoke tests (builds + serves) |

## Supported syntax

- Operators: `+ - * / ^` (right-associative)
- Functions: `sin cos tan asin acos atan sinh cosh tanh exp ln log log2 log10 abs sqrt floor ceil round min max sign`
- Constants: `pi`, `e`
- Variables: `x` (default), also `y` and `t` are accepted as variable names
- Multi-curve: separate with `,` or newlines (e.g. `y = sin(x), y = cos(x)`)
- Unary minus works anywhere a unary operator is allowed: `-x^2` is `-(x^2)`

The parser is hand-rolled (no `eval`, no `mathjs`) and an allowlist of identifiers is enforced before compilation.

## Architecture

- **Next.js 14 App Router**, React 18, TypeScript strict
- **Tailwind CSS** with CSS variables for theming
- **Static prerender** — `/`, `/_not-found`, `/sitemap.xml`, and `/og` are all generated at build time
- **Web Worker** for formula sampling so the UI stays responsive on large ranges
- **In-browser PNG export** via SVG → `<canvas>` → `toDataURL` (no server)
- **URL-encoded share state** (`?e=...&x0=...&x1=...&ay=1`) — no DB needed for the core loop
- **CSP and security headers** set in `netlify.toml`

### Why this scales

- Hot path is **client-side parse → sample → render**. CPU is on the user's device, not ours.
- Hosting is essentially **flat cost** regardless of traffic.
- The URL *is* the API: no short-link service, no per-request DB lookup.

## Deploy

Configured for Netlify via `@netlify/plugin-nextjs`. Just connect the repo.

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

To deploy elsewhere (Vercel, Cloudflare Pages, your own Node host), drop the `netlify.toml` and use the standard Next.js deploy flow.

### Manual deploy via Netlify CLI

```bash
npm i -g netlify-cli
netlify deploy --prod
```

## Testing

CI runs `typecheck → lint → build → unit tests` on every push (see `.github/workflows/ci.yml`). To add Playwright to CI, set up the GitHub Action `microsoft/playwright-github-action` and run `npm run e2e` after build.

## File map

```
app/
  layout.tsx       Root layout, metadata, OG, theme bootstrap
  page.tsx         Renders <GraphApp/>
  globals.css      Tailwind + theme variables
  og.tsx           Dynamic OG image (next/og)
  sitemap.ts       sitemap.xml
  not-found.tsx    404
components/
  GraphApp.tsx     Main orchestrator
  Graph.tsx        SVG renderer
  FormulaInput.tsx Textarea with auto-grow
  Examples.tsx     Example chips
  RangeControls.tsx x/y range + auto-Y
  ErrorBanner.tsx  Inline error display
  ThemeToggle.tsx  Dark/light
lib/
  parser.ts        Hand-rolled tokenizer + shunting-yard + bytecode VM
  sampler.ts       Sampler (used in worker)
  sampler.worker.ts  Web Worker entry
  samplerClient.ts   Worker client (lazy-created singleton)
  range.ts         Auto-Y range + nice ticks
  share.ts         URL <-> state
  png.ts           SVG -> PNG (lazy-loaded)
  cn.ts            Tailwind class merge
tests/
  unit/parser.test.ts  11 vitest tests
  e2e/graph.spec.ts    4 Playwright smoke tests
public/
  favicon.svg
  robots.txt
```

## License

MIT.
