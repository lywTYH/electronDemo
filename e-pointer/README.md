# e-pointer

A lightweight Electron screen pointer and annotation tool. Draw directly on top of any application window — perfect for presentations, screen recordings, pair programming, and design reviews.

## Features

- **Screen overlay** — Transparent, always-on-top window that covers the entire screen
- **Freehand drawing** — Draw anywhere on screen with your mouse or trackpad
- **Click-through** — When not drawing, mouse events pass through to applications beneath
- **Color picker** — 8 preset colors plus a custom color picker
- **Adjustable line width** — 2px to 12px stroke sizes
- **Keyboard shortcuts** — Quick toggle without touching the toolbar

## Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+Shift+P` | Toggle pointer/drawing mode |
| `Esc` | Deactivate pointer mode |

## Tech Stack

- **Electron** — Desktop shell with transparent overlay window
- **React 18** — UI components and state management
- **TypeScript** — Type-safe development
- **Vite** — Fast build tooling with HMR
- **electron-builder** — Cross-platform packaging

## Development

```bash
# Install dependencies
npm install

# Start in development mode
npm run dev

# Build for production
npm run build
```

## How It Works

1. The main process creates a transparent, frameless, fullscreen window that's always on top
2. By default, the window is click-through (`setIgnoreMouseEvents(true, { forward: true })`)
3. When pointer mode is activated (via shortcut or toolbar), mouse events are captured for drawing on the HTML5 canvas
4. The preload script exposes a scoped API via `contextBridge` for secure IPC communication
5. Deactivating pointer mode restores click-through behavior

## Project Structure

```
e-pointer/
├── electron/
│   ├── main.ts        # Main process: window, IPC handlers, shortcuts
│   └── preload.ts     # Preload script: contextBridge API
├── src/
│   ├── App.tsx        # Pointer overlay UI with canvas drawing
│   ├── App.css        # Overlay and toolbar styles
│   ├── index.css      # Base reset styles
│   ├── main.tsx       # React entry point
│   └── types/
│       └── electron.d.ts  # TypeScript declarations
├── public/            # Static assets
├── index.html         # HTML shell
├── vite.config.ts     # Vite + Electron plugin config
├── electron-builder.json5  # Build/packaging config
└── package.json
```

## License

MIT
