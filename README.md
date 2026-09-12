# scrapr

An Electron application with React and TypeScript

## UI Architecture

The main renderer uses Radix Themes (dark, slate, violet). Use its component variants,
responsive layout props, and design tokens instead of overriding component internals.
Application-only geometry belongs in colocated CSS modules.

Each component and page has its own `ComponentName/` folder containing its named `.tsx`
implementation and any component-specific styles, assets, helpers, or tests. Compound component
parts stay together in their family's folder. Import the implementation directly; shared document
styles remain in `assets/main.css`. This convention excludes `poc`.

- `AppShell` is a compound layout: `Root`, `Header`, `Body`, `Sidebar`, and `Content`.
- `SourceList` composes `Root`, `Item`, and optional `Actions`. Pages own actions; rows do not
  assume deletion or settings behavior.
- `PageSection` provides an accessible heading/section relationship. `FavoriteCard` represents
  a domain item, not a replacement for the Radix `Card` primitive.
- Component props live alongside their implementation. Navigation IDs derive from the navigation
  definition, and page-local input state resets when changing pages.
- Theme boundaries belong to the shell. The excluded `src/renderer/src/poc` stays outside them;
  legacy document defaults are retained only for that existing area.

### UI Checks

```bash
npx playwright install chromium
npm run test:ui
npm run build
```

The Playwright suite runs the renderer in Chromium without Electron. It covers keyboard navigation,
Radix select menus and focus restoration, page mounting, unavailable actions, and scrolling at six
viewport widths. It does not navigate to or test the POC or IPC functionality.

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
