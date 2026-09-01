# Formula Graph

Type a formula, get a graph. Built for educators and content creators.

## Quick start

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Build

```bash
npm run build
npm run start
```

## Deploy

Configured for Netlify via `@netlify/plugin-nextjs` (see `netlify.toml`).

## Supported syntax

- Operators: `+ - * / ^`
- Functions: `sin cos tan asin acos atan exp ln log log2 log10 abs sqrt floor ceil round`
- Constants: `pi`, `e`
- Multiple curves: separate with `,` (e.g. `y = sin(x), y = cos(x)`)

## Share a graph

The URL encodes the equation and range. Copy the address bar to share.
