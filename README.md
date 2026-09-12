# scrapr

An Electron application with React and TypeScript

## UI Architecture

The main renderer uses Radix Themes (dark, slate, violet). Use its component variants,
responsive layout props, and design tokens instead of overriding component internals.
Application-only geometry belongs in colocated CSS modules.

Each component and page has its own `ComponentName/` folder containing its named `.tsx`
implementation and any component-specific styles, assets, helpers, or tests. Compound component
parts stay together in their family's folder. Import the implementation directly; shared document
styles remain in `assets/main.css`. This convention excludes `poc` and TanStack route files.

- `AppShell` is a compound layout: `Root`, `Header`, `Body`, `Sidebar`, and `Content`.
- `SourceList` composes `Root`, `Item`, and optional `Actions`. Pages own actions; rows do not
  assume deletion or settings behavior.
- `PageSection` provides an accessible heading/section relationship. `FavoriteCard` represents
  a domain item, not a replacement for the Radix `Card` primitive.
- Component props live alongside their implementation. Navigation uses typed TanStack Router links,
  and page-local input state resets when changing pages.
- Theme boundaries belong to the shell. All pages, including POC, use the shared content theme,
  spacing, and scrolling container.

### Routing

TanStack Router uses file-based routing in `src/renderer/src/routes/`:

- `__root.tsx` selects the persistent `App` shell and not-found page.
- `index.tsx` maps to `/`.
- `sources/route.tsx`, `extension/route.tsx`, and `settings/route.tsx` define their respective routes.
- `poc/route.tsx` defines `/poc`, which uses the same layout as every other page.

Route files are thin definitions that import page/layout components. The Vite router plugin runs
before React and automatically code-splits route components. `tsr.config.json` is shared by the
Electron renderer build, browser test server, and CLI generator.

`routeTree.gen.ts` is generated and should be committed, never edited manually. It is excluded from
linting and formatting. Development and builds regenerate it through the Vite plugin;
`npm run routes:generate` generates it independently, and `typecheck:web` runs generation first
so a missing or stale tree cannot block typechecking before Vite starts.

`router.ts` configures the router from the generated tree and registers its types. `main.tsx`
mounts the provider. `App` is the single shared layout: header, sidebar, and a content area with
an outlet, not page components. It resets the content subtree and scroll position when the pathname
changes. There is no pathless intermediate layout because all pages share the same presentation.
Extension and Settings currently display explicit unavailable-feature placeholders.

Hash history keeps navigation and reloads compatible with Electron's packaged `file://` entry.
Add destinations as route files using `createFileRoute` and use typed `Link` components rather
than local navigation state. Keep page implementations in their own folders, outside the shell.

### UI Checks

```bash
npm run build
```

The build regenerates the route tree and checks TypeScript before bundling. The current checkout
does not contain the browser test suite. Verify navigation, reloads, page-local input resets,
and the shared POC layout in Electron when testing manually.

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```
