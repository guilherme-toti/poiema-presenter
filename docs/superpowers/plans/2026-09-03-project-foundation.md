# Poiema Presenter — Fundação do Projeto Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Poiema Presenter desktop app skeleton — Tauri 2 + React 18/TS/Tailwind frontend, two-window architecture (Control + Projector), CI, a manual version-bump release pipeline that publishes signed-for-updater installers for macOS and Windows, and a background auto-updater with a two-stage, non-blocking notification.

**Architecture:** Single-package Tauri 2 app (no monorepo — one app doesn't justify workspace tooling). Rust core owns window/monitor management; the Control window (`index.html`) is the operator UI, the Projector window (`projector.html`) is a second Vite entry point created dynamically over the secondary monitor. No live-state IPC, SQLite schema, or timeline/song logic yet — those are Fase 1+ of `tech-documentation.md`, explicitly out of scope here.

**Tech Stack:** Tauri 2.9+, Rust, React 18, TypeScript, Vite, Tailwind CSS, Zustand (not needed until Fase 1, not installed here), Vitest, pnpm, GitHub Actions, `tauri-apps/tauri-action`, `tauri-plugin-updater` / `tauri-plugin-process` / `tauri-plugin-sql`.

**Spec:** `docs/superpowers/specs/2026-09-03-foundation-design.md`

## Global Constraints

- Package manager: **pnpm** only (all commands below assume it).
- No OS code signing this phase — builds are unsigned; document the Gatekeeper/SmartScreen warning in the README.
- Bundle identifier: `com.poiema.presenter`.
- Release trigger: manual `workflow_dispatch` only, input `bump: patch|minor|major`. No conventional-commit automation.
- Tauri version floor: `2.9` (Cargo dependency pinned as `"2.9"`) — matches the macOS fullscreen-trap note in `tech-documentation.md` §2.2, even though this phase doesn't call `set_simple_fullscreen` yet.
- macOS release target: `universal-apple-darwin` (one installer for Intel + Apple Silicon). Windows release target: `x86_64-pc-windows-msvc`.
- **Deviation from spec, documented:** the spec (§5.2) says the bump script writes `package.json`, `Cargo.toml`, and `tauri.conf.json`. This plan instead sets `tauri.conf.json`'s `"version"` field to the literal string `"../package.json"` — a native Tauri feature that reads the version from that file at build time. The bump script therefore only touches `package.json` and `Cargo.toml`. This still satisfies the spec's goal (all three always in sync) with one fewer moving part.
- Repository already exists at `git@github.com:guilherme-toti/poiema-presenter.git`, branch `main`, no commits yet. `doc-funcional`, `tech-documentation.md`, and `docs/superpowers/specs/2026-09-03-foundation-design.md` are currently untracked and should enter version control in Task 1's commit.
- Commit after every task (see each task's final step). Never use `git add -A`; stage the files the task actually touched.

---

### Task 1: Scaffold Vite + React + TypeScript + Tailwind, with Control as the first entry point

**Files:**
- Create (via `pnpm create vite`, then relocated): `package.json`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`, `public/`, `.gitignore`, `eslint.config.js`
- Create: `src/control/main.tsx`, `src/control/App.tsx`, `src/control/index.css`, `src/control/assets/`
- Create: `tailwind.config.js` (or `.cjs`), `postcss.config.js` (or `.cjs`), `.prettierrc`

**Interfaces:**
- Produces: a working `pnpm run {lint,typecheck,test,build}` toolchain that every later task extends. `src/control/main.tsx` is the mount point later tasks (3, 12) modify.

- [ ] **Step 1: Scaffold Vite's React+TS template into a throwaway directory**

```bash
pnpm create vite@latest .tmp-scaffold -- --template react-ts
rm -rf .tmp-scaffold/.git
```

- [ ] **Step 2: Relocate the scaffold to the repo root, with frontend source under `src/control/`**

```bash
mkdir -p src/control
mv .tmp-scaffold/src/main.tsx src/control/main.tsx
mv .tmp-scaffold/src/App.tsx src/control/App.tsx
mv .tmp-scaffold/src/assets src/control/assets
rm -f .tmp-scaffold/src/App.css .tmp-scaffold/src/index.css
rmdir .tmp-scaffold/src
mv .tmp-scaffold/* .
mv .tmp-scaffold/.gitignore . 2>/dev/null || true
rmdir .tmp-scaffold
```

If your Vite version names files slightly differently (e.g. no `tsconfig.app.json`, or an `eslint.config.js` vs `.eslintrc`), that's fine — the only rule that matters is: everything from `.tmp-scaffold` ends up at the repo root, except the original `src/` contents, which land in `src/control/`.

- [ ] **Step 3: Point `index.html` at the relocated entry point**

Edit `index.html`: change `<script type="module" src="/src/main.tsx"></script>` to `<script type="module" src="/src/control/main.tsx"></script>`, and set `<title>Poiema Presenter</title>`.

- [ ] **Step 4: Fix `package.json` identity**

Edit `package.json`: set `"name": "poiema-presenter"`, `"version": "0.1.0"`, `"private": true`.

- [ ] **Step 5: Replace `src/control/index.css` with Tailwind directives**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

(The import in `src/control/main.tsx`, `import './index.css'`, needs no change — the file is still a sibling.)

- [ ] **Step 6: Install and configure Tailwind**

```bash
pnpm add -D tailwindcss postcss autoprefixer
pnpm exec tailwindcss init -p
```

Check `package.json` for `"type": "module"`. If present, rename the two generated files to `tailwind.config.cjs` and `postcss.config.cjs` (keep their CommonJS `module.exports` syntax as generated). Then edit the Tailwind config content array:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './projector.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

(`projector.html` doesn't exist until Task 4 — listing it now is harmless and saves a later edit.)

- [ ] **Step 7: Add Prettier alongside the scaffolded ESLint config**

```bash
pnpm add -D prettier eslint-config-prettier
```

Create `.prettierrc`:

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100
}
```

Open `eslint.config.js` and add the import plus append `prettier` (which disables stylistic rules that conflict with Prettier) as the **last** entry in the exported config array:

```js
import prettier from 'eslint-config-prettier'
```

```js
export default tseslint.config(
  // ...existing entries...
  prettier,
)
```

(Adapt to whatever variable name the scaffolded file uses for its exported array — the point is `prettier` must be last so it overrides.)

- [ ] **Step 8: Add `lint`/`typecheck`/`format` scripts**

Edit `package.json` `"scripts"` to include (alongside the existing `dev`/`build`/`preview`):

```json
"lint": "eslint .",
"typecheck": "tsc -b --noEmit",
"format": "prettier --write ."
```

- [ ] **Step 9: Install and verify**

```bash
pnpm install
pnpm run lint
pnpm run typecheck
pnpm run build
```

Expected: all three succeed with no errors.

- [ ] **Step 10: Commit — this is the project's first commit**

```bash
git add doc-funcional tech-documentation.md docs/ package.json pnpm-lock.yaml \
  tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts index.html \
  public .gitignore eslint.config.js tailwind.config.cjs postcss.config.cjs \
  .prettierrc src/
git commit -m "$(cat <<'EOF'
chore: initial commit — project docs and Vite/React/TS/Tailwind scaffold

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01AnNYrqSpLRTCfmWindkFn5
EOF
)"
```

(Adjust the file list to match whatever config file names actually exist after Step 2/6.)

---

### Task 2: Add Tauri to the project

**Files:**
- Create: `src-tauri/` (generated by `tauri init`: `Cargo.toml`, `tauri.conf.json`, `build.rs`, `src/main.rs`, `src/lib.rs`, `icons/`, `capabilities/`)
- Modify: `vite.config.ts`, `package.json`

**Interfaces:**
- Consumes: the Vite project from Task 1.
- Produces: `src-tauri/tauri.conf.json` with `identifier: "com.poiema.presenter"`, a `main` window; `pnpm tauri` script. Task 4 adds a Rust module and command to `src-tauri/src/lib.rs`; Task 5 replaces `src-tauri/capabilities/*`.

- [ ] **Step 1: Install the Tauri CLI and JS API**

```bash
pnpm add -D @tauri-apps/cli@latest
pnpm add @tauri-apps/api@latest
```

- [ ] **Step 2: Configure Vite for Tauri's dev server conventions**

Replace the contents of `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://tauri.app/start/frontend/vite/
export default defineConfig(async () => ({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: false,
  },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target: process.env.TAURI_ENV_PLATFORM === 'windows' ? 'chrome105' : 'safari13',
    minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
}))
```

- [ ] **Step 3: Run `tauri init` non-interactively**

```bash
pnpm exec tauri init --ci \
  --app-name poiema-presenter \
  --window-title "Poiema Presenter" \
  --frontend-dist ../dist \
  --dev-url http://localhost:1420 \
  --before-dev-command "pnpm dev" \
  --before-build-command "pnpm build"
```

This creates `src-tauri/` at the repo root.

- [ ] **Step 4: Set app identity in `src-tauri/tauri.conf.json`**

Open the generated file and set these top-level fields (leave everything else — `build`, `app.windows`, `bundle` — as generated):

```json
"productName": "Poiema Presenter",
"version": "../package.json",
"identifier": "com.poiema.presenter",
```

Confirm `app.windows[0].label` is `"main"` (the `tauri init` default); if it's something else, rename it to `"main"`.

- [ ] **Step 5: Verify the Rust side compiles**

```bash
(cd src-tauri && cargo check)
```

Expected: compiles cleanly (first run downloads crates, can take a few minutes).

- [ ] **Step 6: Manual verification (human — GUI, can't be checked headlessly)**

Run `pnpm tauri dev` from the repo root. Confirm a window titled "Poiema Presenter" opens showing the default Vite+React counter demo.

- [ ] **Step 7: Commit**

```bash
git add src-tauri package.json pnpm-lock.yaml vite.config.ts
git commit -m "$(cat <<'EOF'
feat: add Tauri 2 shell (com.poiema.presenter)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01AnNYrqSpLRTCfmWindkFn5
EOF
)"
```

---

### Task 3: Hello-world Control UI — three-column layout

**Files:**
- Modify: `src/control/App.tsx`
- Create: `src/control/panels/LeftPanel.tsx`, `src/control/panels/CenterPanel.tsx`, `src/control/panels/RightPanel.tsx`
- Delete: `src/control/App.css`, `src/control/assets/react.svg`

**Interfaces:**
- Produces: `LeftPanel`, `CenterPanel`, `RightPanel` components (no props yet). Task 4 adds an "Abrir Projetor" button + handler to `RightPanel`. Task 12 wraps `App`'s returned tree with an `UpdateBanner`.

- [ ] **Step 1: Remove Vite's default demo assets**

```bash
rm -f src/control/App.css src/control/assets/react.svg
```

- [ ] **Step 2: Create the three panels**

`src/control/panels/LeftPanel.tsx`:

```tsx
export function LeftPanel() {
  return (
    <div className="flex flex-col border-r border-white/8 bg-white/5">
      <div className="border-b border-white/8 p-4">
        <h1 className="text-sm font-semibold tracking-wide text-neutral-100">
          Poiema Presenter
        </h1>
        <p className="mt-1 text-xs text-neutral-400">Roteiro</p>
      </div>
      <div className="flex flex-1 items-center justify-center p-4 text-center text-sm text-neutral-500">
        Nenhum evento aberto ainda.
      </div>
    </div>
  )
}
```

`src/control/panels/CenterPanel.tsx`:

```tsx
export function CenterPanel() {
  return (
    <div className="flex flex-col">
      <div className="border-b border-white/8 p-4">
        <p className="text-xs uppercase tracking-wide text-neutral-400">Slides</p>
      </div>
      <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
        Selecione um item do roteiro para ver os slides.
      </div>
    </div>
  )
}
```

`src/control/panels/RightPanel.tsx`:

```tsx
export function RightPanel() {
  return (
    <div className="flex flex-col border-l border-white/8 bg-white/5">
      <div className="border-b border-white/8 p-4">
        <p className="text-xs uppercase tracking-wide text-neutral-400">Ao Vivo</p>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-1 p-4 text-center text-sm text-neutral-500">
        <span>Projetor não iniciado.</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Wire the layout into `App.tsx`**

Replace the contents of `src/control/App.tsx`:

```tsx
import { LeftPanel } from './panels/LeftPanel'
import { CenterPanel } from './panels/CenterPanel'
import { RightPanel } from './panels/RightPanel'

function App() {
  return (
    <div className="grid h-screen grid-cols-[minmax(220px,280px)_1fr_minmax(300px,380px)] bg-neutral-900 text-neutral-100 antialiased">
      <LeftPanel />
      <CenterPanel />
      <RightPanel />
    </div>
  )
}

export default App
```

- [ ] **Step 4: Verify**

```bash
pnpm run typecheck
pnpm run build
```

Manual (human): `pnpm tauri dev` shows the dark three-column layout with the labels above.

- [ ] **Step 5: Commit**

```bash
git add src/control
git commit -m "$(cat <<'EOF'
feat: hello-world three-column Control layout

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01AnNYrqSpLRTCfmWindkFn5
EOF
)"
```

---

### Task 4: Projector window — `open_projector` command + second Vite entry point

**Files:**
- Create: `src-tauri/src/projector.rs`
- Modify: `src-tauri/src/lib.rs`
- Create: `projector.html`, `src/projector/main.tsx`, `src/projector/ProjectorRoot.tsx`
- Modify: `vite.config.ts` (two Rollup entry points)
- Modify: `src/control/panels/RightPanel.tsx`

**Interfaces:**
- Consumes: `RightPanel` from Task 3.
- Produces: Rust command `open_projector(monitor_name: Option<String>) -> Result<(), String>`, invoked from the frontend as `invoke('open_projector', { monitorName: null })`. No later task depends on more than this signature.

- [ ] **Step 1: Implement the `open_projector` command**

`src-tauri/src/projector.rs`:

```rust
use tauri::webview::WebviewWindowBuilder;
use tauri::{AppHandle, Manager, PhysicalPosition, PhysicalSize, WebviewUrl};

pub const PROJECTOR_LABEL: &str = "projector";

#[tauri::command]
pub async fn open_projector(app: AppHandle, monitor_name: Option<String>) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(PROJECTOR_LABEL) {
        window.show().map_err(|e| e.to_string())?;
        return Ok(());
    }

    let monitors = app.available_monitors().map_err(|e| e.to_string())?;
    let primary = app.primary_monitor().ok().flatten();

    // Preferência: monitor pedido -> primeiro não-primário. NUNCA cai para o
    // primário: uma janela borderless + always_on_top sobre a tela do
    // operador é pior que não projetar (modo ensaio).
    let target = monitor_name
        .and_then(|name| monitors.iter().find(|m| m.name() == Some(&name)).cloned())
        .or_else(|| {
            monitors
                .iter()
                .find(|m| primary.as_ref().map_or(false, |p| p.position() != m.position()))
                .cloned()
        });

    let Some(target) = target else {
        return Err("Nenhuma tela secundária disponível — modo ensaio".into());
    };

    let position = *target.position();
    let size = *target.size();

    let window = WebviewWindowBuilder::new(&app, PROJECTOR_LABEL, WebviewUrl::App("projector.html".into()))
        .title("Poiema — Projeção")
        .decorations(false)
        .resizable(false)
        .skip_taskbar(true)
        .always_on_top(true)
        .visible(false)
        .build()
        .map_err(|e| e.to_string())?;

    window
        .set_position(PhysicalPosition::new(position.x, position.y))
        .map_err(|e| e.to_string())?;
    window
        .set_size(PhysicalSize::new(size.width, size.height))
        .map_err(|e| e.to_string())?;
    window.show().map_err(|e| e.to_string())?;

    Ok(())
}
```

- [ ] **Step 2: Register the module and command in `lib.rs`**

Open the generated `src-tauri/src/lib.rs`. Add near the top:

```rust
mod projector;
```

Inside the existing `tauri::Builder::default()` chain, add `.invoke_handler(...)` before `.run(...)` (if `invoke_handler` isn't already there; if it is, add `projector::open_projector` to its `generate_handler!` list):

```rust
.invoke_handler(tauri::generate_handler![projector::open_projector])
```

- [ ] **Step 3: Add the Projector Vite entry point**

`projector.html` (repo root, next to `index.html`):

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Poiema — Projeção</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/projector/main.tsx"></script>
  </body>
</html>
```

`src/projector/ProjectorRoot.tsx`:

```tsx
export function ProjectorRoot() {
  return (
    <div className="flex h-screen w-screen select-none items-center justify-center bg-black text-white">
      <span className="text-4xl font-semibold">Poiema Presenter</span>
    </div>
  )
}
```

`src/projector/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ProjectorRoot } from './ProjectorRoot'
import '../control/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProjectorRoot />
  </StrictMode>,
)
```

- [ ] **Step 4: Register both entry points in `vite.config.ts`**

Add the import and `build.rollupOptions.input` to the config from Task 2:

```ts
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
```

```ts
  build: {
    target: process.env.TAURI_ENV_PLATFORM === 'windows' ? 'chrome105' : 'safari13',
    minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        projector: resolve(__dirname, 'projector.html'),
      },
    },
  },
```

- [ ] **Step 5: Wire the "Abrir Projetor" button**

Replace `src/control/panels/RightPanel.tsx`:

```tsx
import { invoke } from '@tauri-apps/api/core'
import { useState } from 'react'

export function RightPanel() {
  const [error, setError] = useState<string | null>(null)

  const handleOpenProjector = async () => {
    setError(null)
    try {
      await invoke('open_projector', { monitorName: null })
    } catch (err) {
      setError(String(err))
    }
  }

  return (
    <div className="flex flex-col border-l border-white/8 bg-white/5">
      <div className="border-b border-white/8 p-4">
        <p className="text-xs uppercase tracking-wide text-neutral-400">Ao Vivo</p>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4 text-center text-sm text-neutral-500">
        <span>Projetor não iniciado.</span>
        <button
          onClick={handleOpenProjector}
          className="rounded-md bg-white/10 px-3 py-1.5 text-xs font-medium text-neutral-100 hover:bg-white/20"
        >
          Abrir Projetor
        </button>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Verify**

```bash
(cd src-tauri && cargo check)
pnpm run typecheck
pnpm run build
```

Manual (human): `pnpm tauri dev`, click "Abrir Projetor". With a second monitor attached: a borderless black window with "Poiema Presenter" appears positioned exactly over it. Without one: the red "Nenhuma tela secundária disponível — modo ensaio" message appears inline and no window opens.

- [ ] **Step 7: Commit**

```bash
git add src-tauri/src/projector.rs src-tauri/src/lib.rs projector.html src/projector \
  vite.config.ts src/control/panels/RightPanel.tsx
git commit -m "$(cat <<'EOF'
feat: open_projector command and Projector window entry point

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01AnNYrqSpLRTCfmWindkFn5
EOF
)"
```

---

### Task 5: `tauri-plugin-sql` + split capabilities

**Files:**
- Modify: `src-tauri/Cargo.toml`, `src-tauri/src/lib.rs`
- Modify: `package.json`
- Create: `src-tauri/capabilities/main.json`, `src-tauri/capabilities/projector.json`
- Delete: `src-tauri/capabilities/default.json` (if `tauri init` generated one)

**Interfaces:**
- Produces: `main` capability grants `sql:*`; `projector` capability stays event-only. Task 10 appends `updater:default`/`process:default` to `main.json`.

- [ ] **Step 1: Install the plugin**

```bash
pnpm add @tauri-apps/plugin-sql
```

Edit `src-tauri/Cargo.toml`, in `[dependencies]` (alongside the `tauri = "2.9"` line `tauri init` generated — if it generated a bare `"2"`, tighten it to `"2.9"` per the Global Constraints floor):

```toml
tauri-plugin-sql = { version = "2", features = ["sqlite"] }
```

- [ ] **Step 2: Register the plugin**

In `src-tauri/src/lib.rs`, inside the `tauri::Builder::default()` chain, add before `.invoke_handler(...)`:

```rust
.plugin(tauri_plugin_sql::Builder::default().build())
```

- [ ] **Step 3: Replace the generated capability file with two explicit ones**

```bash
rm -f src-tauri/capabilities/default.json
```

`src-tauri/capabilities/main.json`:

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "main-capability",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:event:default",
    "sql:default",
    "sql:allow-select",
    "sql:allow-execute"
  ]
}
```

`src-tauri/capabilities/projector.json`:

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "projector-capability",
  "windows": ["projector"],
  "permissions": ["core:event:default"]
}
```

- [ ] **Step 4: Verify**

```bash
(cd src-tauri && cargo check)
pnpm run build
```

- [ ] **Step 5: Commit**

```bash
git add src-tauri/Cargo.toml src-tauri/Cargo.lock src-tauri/src/lib.rs \
  src-tauri/capabilities package.json pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
feat: install tauri-plugin-sql, split main/projector capabilities

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01AnNYrqSpLRTCfmWindkFn5
EOF
)"
```

---

### Task 6: `bumpSemver` — pure version-bump logic, test-first

**Files:**
- Create: `scripts/version.mjs`
- Create: `scripts/version.test.mjs`
- Modify: `package.json` (add `vitest`, `test` script)

**Interfaces:**
- Produces: `bumpSemver(current: string, bumpType: 'patch'|'minor'|'major'): string`, throws `Error` on invalid input. Consumed by Task 7's `scripts/bump-version.mjs`.

- [ ] **Step 1: Install Vitest and add the test script**

```bash
pnpm add -D vitest
```

Add to `package.json` `"scripts"`:

```json
"test": "vitest run"
```

- [ ] **Step 2: Write the failing test**

`scripts/version.test.mjs`:

```js
import { describe, it, expect } from 'vitest'
import { bumpSemver } from './version.mjs'

describe('bumpSemver', () => {
  it('bumps patch', () => {
    expect(bumpSemver('1.2.3', 'patch')).toBe('1.2.4')
  })

  it('bumps minor and resets patch', () => {
    expect(bumpSemver('1.2.3', 'minor')).toBe('1.3.0')
  })

  it('bumps major and resets minor and patch', () => {
    expect(bumpSemver('1.2.3', 'major')).toBe('2.0.0')
  })

  it('throws on an invalid current version', () => {
    expect(() => bumpSemver('not-a-version', 'patch')).toThrow()
  })

  it('throws on an invalid bump type', () => {
    expect(() => bumpSemver('1.2.3', 'huge')).toThrow()
  })
})
```

- [ ] **Step 3: Run it and confirm it fails**

```bash
pnpm exec vitest run scripts/version.test.mjs
```

Expected: FAIL — `scripts/version.mjs` doesn't exist yet.

- [ ] **Step 4: Implement `bumpSemver`**

`scripts/version.mjs`:

```js
const SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)$/

export function bumpSemver(current, bumpType) {
  const match = SEMVER_RE.exec(current)
  if (!match) {
    throw new Error(`Invalid version "${current}", expected "x.y.z"`)
  }
  const [, major, minor, patch] = match.slice(1).map(Number)

  switch (bumpType) {
    case 'major':
      return `${major + 1}.0.0`
    case 'minor':
      return `${major}.${minor + 1}.0`
    case 'patch':
      return `${major}.${minor}.${patch + 1}`
    default:
      throw new Error(`Invalid bump type "${bumpType}", expected "major", "minor", or "patch"`)
  }
}
```

- [ ] **Step 5: Run it again and confirm it passes**

```bash
pnpm exec vitest run scripts/version.test.mjs
```

Expected: PASS, 5 tests.

- [ ] **Step 6: Commit**

```bash
git add scripts/version.mjs scripts/version.test.mjs package.json pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
feat: add bumpSemver with test coverage

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01AnNYrqSpLRTCfmWindkFn5
EOF
)"
```

---

### Task 7: `bump-version.mjs` — CLI that syncs `package.json` and `Cargo.toml`

**Files:**
- Create: `scripts/bump-version.mjs`
- Create: `scripts/bump-version.test.mjs`

**Interfaces:**
- Consumes: `bumpSemver` from Task 6.
- Produces: `run({ bumpType, packageJsonPath, cargoTomlPath, log? }): string` and `bumpCargoToml(toml: string, newVersion: string): string`, both exported for testing. The CLI entry point prints the bare new version as its last stdout line — Task 9's release workflow captures it via command substitution.

- [ ] **Step 1: Write the failing tests**

`scripts/bump-version.test.mjs`:

```js
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { run, bumpCargoToml } from './bump-version.mjs'

describe('bumpCargoToml', () => {
  it('replaces only the [package] version line', () => {
    const toml = [
      '[package]',
      'name = "poiema-presenter"',
      'version = "0.1.0"',
      'edition = "2021"',
      '',
      '[dependencies]',
      'tauri = { version = "2.9" }',
      '',
    ].join('\n')

    const result = bumpCargoToml(toml, '0.2.0')

    expect(result).toContain('version = "0.2.0"')
    expect(result).toContain('tauri = { version = "2.9" }')
  })

  it('throws when there is no [package] section', () => {
    expect(() => bumpCargoToml('[dependencies]\n', '0.2.0')).toThrow()
  })
})

describe('run', () => {
  let dir

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'bump-version-'))
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({ name: 'x', version: '0.1.0' }, null, 2),
    )
    writeFileSync(
      join(dir, 'Cargo.toml'),
      '[package]\nname = "x"\nversion = "0.1.0"\nedition = "2021"\n',
    )
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('bumps both files together and returns the new version', () => {
    const newVersion = run({
      bumpType: 'minor',
      packageJsonPath: join(dir, 'package.json'),
      cargoTomlPath: join(dir, 'Cargo.toml'),
      log: () => {},
    })

    expect(newVersion).toBe('0.2.0')
    expect(JSON.parse(readFileSync(join(dir, 'package.json'), 'utf-8')).version).toBe('0.2.0')
    expect(readFileSync(join(dir, 'Cargo.toml'), 'utf-8')).toContain('version = "0.2.0"')
  })
})
```

- [ ] **Step 2: Run it and confirm it fails**

```bash
pnpm exec vitest run scripts/bump-version.test.mjs
```

Expected: FAIL — `scripts/bump-version.mjs` doesn't exist yet.

- [ ] **Step 3: Implement it**

`scripts/bump-version.mjs`:

```js
#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { bumpSemver } from './version.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '..')

export function bumpCargoToml(cargoToml, newVersion) {
  const lines = cargoToml.split('\n')
  const packageStart = lines.findIndex((line) => line.trim() === '[package]')
  if (packageStart === -1) {
    throw new Error('No [package] section found in Cargo.toml')
  }
  for (let i = packageStart + 1; i < lines.length; i++) {
    const line = lines[i]
    if (/^\[/.test(line.trim())) break
    if (/^version\s*=/.test(line.trim())) {
      lines[i] = `version = "${newVersion}"`
      return lines.join('\n')
    }
  }
  throw new Error('No version field found in [package] section of Cargo.toml')
}

export function run({ bumpType, packageJsonPath, cargoTomlPath, log = console.error }) {
  const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
  const newVersion = bumpSemver(pkg.version, bumpType)

  pkg.version = newVersion
  writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n')
  log(`package.json -> ${newVersion}`)

  const cargoRaw = readFileSync(cargoTomlPath, 'utf-8')
  writeFileSync(cargoTomlPath, bumpCargoToml(cargoRaw, newVersion))
  log(`Cargo.toml -> ${newVersion}`)

  return newVersion
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url)
if (isMain) {
  const bumpType = process.argv[2]
  if (!['patch', 'minor', 'major'].includes(bumpType)) {
    console.error('Usage: node scripts/bump-version.mjs <patch|minor|major>')
    process.exit(1)
  }
  const newVersion = run({
    bumpType,
    packageJsonPath: resolve(repoRoot, 'package.json'),
    cargoTomlPath: resolve(repoRoot, 'src-tauri/Cargo.toml'),
  })
  console.log(newVersion)
}
```

- [ ] **Step 4: Run it again and confirm it passes**

```bash
pnpm exec vitest run scripts/bump-version.test.mjs
```

Expected: PASS, 3 tests.

- [ ] **Step 5: Smoke-test the CLI directly against the real repo files (dry run via git diff, then revert)**

```bash
node scripts/bump-version.mjs patch
git diff package.json src-tauri/Cargo.toml
git checkout -- package.json src-tauri/Cargo.toml
```

Expected: the diff shows only the version fields changing, then the checkout reverts them (this task doesn't want to actually bump the app's version yet).

- [ ] **Step 6: Commit**

```bash
git add scripts/bump-version.mjs scripts/bump-version.test.mjs
git commit -m "$(cat <<'EOF'
feat: add bump-version CLI syncing package.json and Cargo.toml

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01AnNYrqSpLRTCfmWindkFn5
EOF
)"
```

---

### Task 8: CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Write the workflow**

`.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm run lint
      - run: pnpm run typecheck
      - run: pnpm run test

  rust:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install system dependencies
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev \
            librsvg2-dev patchelf build-essential curl wget file libssl-dev libgtk-3-dev
      - uses: dtolnay/rust-toolchain@stable
        with:
          components: clippy
      - uses: Swatinem/rust-cache@v2
        with:
          workspaces: src-tauri
      - run: cargo check --manifest-path src-tauri/Cargo.toml
      - run: cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
      - run: cargo test --manifest-path src-tauri/Cargo.toml
```

- [ ] **Step 2: Validate the YAML parses**

```bash
pnpm dlx js-yaml .github/workflows/ci.yml > /dev/null && echo "valid YAML"
```

Expected: `valid YAML`. (Full validation happens when this is pushed and a PR is opened — GitHub itself will reject a malformed workflow file; that's covered in Task 14's manual checklist.)

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "$(cat <<'EOF'
ci: add lint/typecheck/test/clippy workflow

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01AnNYrqSpLRTCfmWindkFn5
EOF
)"
```

---

### Task 9: Release workflow — manual version bump + cross-platform build

**Files:**
- Create: `.github/workflows/release.yml`

**Interfaces:**
- Consumes: `scripts/bump-version.mjs` (Task 7). References `secrets.TAURI_SIGNING_PRIVATE_KEY` / `secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD`, created in Task 10 — until those secrets exist, running this workflow will fail at the signing step. Don't trigger it for real before Task 10 is done.

- [ ] **Step 1: Write the workflow**

`.github/workflows/release.yml`:

```yaml
name: Release

on:
  workflow_dispatch:
    inputs:
      bump:
        description: 'Version bump type'
        required: true
        type: choice
        options:
          - patch
          - minor
          - major

permissions:
  contents: write

jobs:
  prepare:
    runs-on: ubuntu-latest
    outputs:
      version: ${{ steps.bump.outputs.version }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - name: Bump version
        id: bump
        run: |
          NEW_VERSION=$(node scripts/bump-version.mjs ${{ inputs.bump }})
          echo "version=$NEW_VERSION" >> "$GITHUB_OUTPUT"
      - name: Commit and tag
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add package.json src-tauri/Cargo.toml
          git commit -m "chore: bump version to v${{ steps.bump.outputs.version }}"
          git tag "v${{ steps.bump.outputs.version }}"
          git push origin HEAD:main
          git push origin "v${{ steps.bump.outputs.version }}"

  build:
    needs: prepare
    strategy:
      fail-fast: false
      matrix:
        include:
          - platform: macos-latest
            args: --target universal-apple-darwin
            rust-targets: aarch64-apple-darwin,x86_64-apple-darwin
          - platform: windows-latest
            args: ''
            rust-targets: ''
    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v4
        with:
          ref: v${{ needs.prepare.outputs.version }}
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - uses: dtolnay/rust-toolchain@stable
        with:
          targets: ${{ matrix.rust-targets }}
      - uses: Swatinem/rust-cache@v2
        with:
          workspaces: src-tauri
      - run: pnpm install --frozen-lockfile
      - uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
          TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
        with:
          tagName: v${{ needs.prepare.outputs.version }}
          releaseName: 'Poiema Presenter v${{ needs.prepare.outputs.version }}'
          releaseDraft: false
          prerelease: false
          includeUpdaterJson: true
          args: ${{ matrix.args }}
```

- [ ] **Step 2: Validate the YAML parses**

```bash
pnpm dlx js-yaml .github/workflows/release.yml > /dev/null && echo "valid YAML"
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/release.yml
git commit -m "$(cat <<'EOF'
ci: add manual release workflow (version bump, mac + windows build)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01AnNYrqSpLRTCfmWindkFn5
EOF
)"
```

---

### Task 10: Auto-updater plugins, signing key, and config

**Files:**
- Modify: `src-tauri/Cargo.toml`, `src-tauri/src/lib.rs`, `src-tauri/tauri.conf.json`, `src-tauri/capabilities/main.json`
- Modify: `package.json`

**Interfaces:**
- Produces: `check()`/`update.downloadAndInstall()` from `@tauri-apps/plugin-updater` and `relaunch()` from `@tauri-apps/plugin-process` become callable from the `main` window. Task 11's `useUpdater` hook is the sole consumer.

- [ ] **Step 1: Install the plugins**

```bash
pnpm add @tauri-apps/plugin-updater @tauri-apps/plugin-process
```

Edit `src-tauri/Cargo.toml`, add to `[dependencies]`:

```toml
tauri-plugin-updater = "2"
tauri-plugin-process = "2"
```

- [ ] **Step 2: Register the plugins**

In `src-tauri/src/lib.rs`, add to the `tauri::Builder::default()` chain (alongside the `tauri_plugin_sql` line from Task 5):

```rust
.plugin(tauri_plugin_updater::Builder::new().build())
.plugin(tauri_plugin_process::init())
```

- [ ] **Step 3 (manual — human only, not the agent): generate the updater signing keypair**

This step involves an interactive password prompt and produces private key material that must never be pasted into a chat, committed, or handled by the automated executor. Run it yourself, in your own terminal:

```bash
pnpm exec tauri signer generate -w ~/.tauri/poiema-presenter.key
```

This prints a public key to stdout and writes a password-protected private key to `~/.tauri/poiema-presenter.key`. Then:

1. Copy the printed **public** key — you'll paste it into `tauri.conf.json` in Step 4 below (safe to commit, it's public).
2. In the GitHub repo settings, add two Actions secrets:
   - `TAURI_SIGNING_PRIVATE_KEY` — paste the full contents of `~/.tauri/poiema-presenter.key`.
   - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` — the password you chose when generating the key.

- [ ] **Step 4: Configure the updater in `tauri.conf.json`**

Merge into the existing `bundle` object:

```json
"createUpdaterArtifacts": true
```

Add a top-level `plugins` object (or merge into it if `tauri init` already created one):

```json
"plugins": {
  "updater": {
    "endpoints": [
      "https://github.com/guilherme-toti/poiema-presenter/releases/latest/download/latest.json"
    ],
    "pubkey": "PASTE_THE_PUBLIC_KEY_FROM_STEP_3_HERE"
  }
}
```

- [ ] **Step 5: Grant updater/process permissions to the main window**

Edit `src-tauri/capabilities/main.json`, add to `"permissions"`:

```json
"updater:default",
"process:default"
```

- [ ] **Step 6: Verify**

```bash
(cd src-tauri && cargo check)
pnpm run build
```

- [ ] **Step 7: Commit**

Confirm first that no private key material is staged:

```bash
git status
```

Then:

```bash
git add src-tauri/Cargo.toml src-tauri/Cargo.lock src-tauri/src/lib.rs \
  src-tauri/tauri.conf.json src-tauri/capabilities/main.json package.json pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
feat: wire tauri-plugin-updater and tauri-plugin-process

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01AnNYrqSpLRTCfmWindkFn5
EOF
)"
```

---

### Task 11: `useUpdater` hook — state machine, test-first

**Files:**
- Create: `src/control/hooks/updaterReducer.ts`
- Create: `src/control/hooks/updaterReducer.test.ts`
- Create: `src/control/hooks/useUpdater.ts`

**Interfaces:**
- Consumes: `check`/`update.downloadAndInstall` (`@tauri-apps/plugin-updater`), `relaunch` (`@tauri-apps/plugin-process`) from Task 10.
- Produces: `useUpdater(): { status: 'idle'|'checking'|'downloading'|'ready'|'error', version: string | null, error: string | null, restart: () => Promise<void> }`. Task 12's `UpdateBanner` is the sole consumer.

- [ ] **Step 1: Write the failing reducer tests**

`src/control/hooks/updaterReducer.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { updaterReducer, INITIAL_UPDATER_STATE } from './updaterReducer'

describe('updaterReducer', () => {
  it('starts idle', () => {
    expect(INITIAL_UPDATER_STATE.status).toBe('idle')
  })

  it('moves to checking on CHECK_STARTED', () => {
    const state = updaterReducer(INITIAL_UPDATER_STATE, { type: 'CHECK_STARTED' })
    expect(state.status).toBe('checking')
  })

  it('moves to downloading with the version on UPDATE_AVAILABLE', () => {
    const checking = updaterReducer(INITIAL_UPDATER_STATE, { type: 'CHECK_STARTED' })
    const state = updaterReducer(checking, { type: 'UPDATE_AVAILABLE', version: '0.2.0' })
    expect(state).toEqual({ status: 'downloading', version: '0.2.0', error: null })
  })

  it('moves back to idle on NO_UPDATE', () => {
    const checking = updaterReducer(INITIAL_UPDATER_STATE, { type: 'CHECK_STARTED' })
    const state = updaterReducer(checking, { type: 'NO_UPDATE' })
    expect(state.status).toBe('idle')
  })

  it('moves to ready on DOWNLOAD_COMPLETE, keeping the version', () => {
    const downloading = updaterReducer(
      updaterReducer(INITIAL_UPDATER_STATE, { type: 'CHECK_STARTED' }),
      { type: 'UPDATE_AVAILABLE', version: '0.2.0' },
    )
    const state = updaterReducer(downloading, { type: 'DOWNLOAD_COMPLETE' })
    expect(state).toEqual({ status: 'ready', version: '0.2.0', error: null })
  })

  it('moves to error on CHECK_FAILED, keeping the message', () => {
    const state = updaterReducer(INITIAL_UPDATER_STATE, {
      type: 'CHECK_FAILED',
      error: 'network unreachable',
    })
    expect(state).toEqual({ status: 'error', version: null, error: 'network unreachable' })
  })
})
```

- [ ] **Step 2: Run it and confirm it fails**

```bash
pnpm exec vitest run src/control/hooks/updaterReducer.test.ts
```

Expected: FAIL — `updaterReducer.ts` doesn't exist yet.

- [ ] **Step 3: Implement the reducer**

`src/control/hooks/updaterReducer.ts`:

```ts
export type UpdaterStatus = 'idle' | 'checking' | 'downloading' | 'ready' | 'error'

export interface UpdaterState {
  status: UpdaterStatus
  version: string | null
  error: string | null
}

export type UpdaterAction =
  | { type: 'CHECK_STARTED' }
  | { type: 'UPDATE_AVAILABLE'; version: string }
  | { type: 'NO_UPDATE' }
  | { type: 'DOWNLOAD_COMPLETE' }
  | { type: 'CHECK_FAILED'; error: string }

export const INITIAL_UPDATER_STATE: UpdaterState = {
  status: 'idle',
  version: null,
  error: null,
}

export function updaterReducer(state: UpdaterState, action: UpdaterAction): UpdaterState {
  switch (action.type) {
    case 'CHECK_STARTED':
      return { ...state, status: 'checking', error: null }
    case 'UPDATE_AVAILABLE':
      return { status: 'downloading', version: action.version, error: null }
    case 'NO_UPDATE':
      return { status: 'idle', version: null, error: null }
    case 'DOWNLOAD_COMPLETE':
      return { ...state, status: 'ready' }
    case 'CHECK_FAILED':
      return { ...state, status: 'error', error: action.error }
    default:
      return state
  }
}
```

- [ ] **Step 4: Run it again and confirm it passes**

```bash
pnpm exec vitest run src/control/hooks/updaterReducer.test.ts
```

Expected: PASS, 6 tests.

- [ ] **Step 5: Implement the React hook wrapper**

`src/control/hooks/useUpdater.ts`:

```ts
import { useEffect, useReducer, useRef } from 'react'
import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import { updaterReducer, INITIAL_UPDATER_STATE } from './updaterReducer'

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000

export function useUpdater() {
  const [state, dispatch] = useReducer(updaterReducer, INITIAL_UPDATER_STATE)
  const checkingRef = useRef(false)

  useEffect(() => {
    const runCheck = async () => {
      if (checkingRef.current) return
      checkingRef.current = true
      dispatch({ type: 'CHECK_STARTED' })
      try {
        const update = await check()
        if (!update) {
          dispatch({ type: 'NO_UPDATE' })
          return
        }
        dispatch({ type: 'UPDATE_AVAILABLE', version: update.version })
        await update.downloadAndInstall()
        dispatch({ type: 'DOWNLOAD_COMPLETE' })
      } catch (err) {
        // Erros de rede/API não podem virar ruído para o operador (RN-07) — log only.
        console.error('[updater] check failed:', err)
        dispatch({ type: 'CHECK_FAILED', error: String(err) })
      } finally {
        checkingRef.current = false
      }
    }

    runCheck()
    const interval = setInterval(runCheck, CHECK_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  return { ...state, restart: relaunch }
}
```

- [ ] **Step 6: Verify**

```bash
pnpm run typecheck
pnpm exec vitest run
```

- [ ] **Step 7: Commit**

```bash
git add src/control/hooks
git commit -m "$(cat <<'EOF'
feat: add useUpdater hook with tested state machine

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01AnNYrqSpLRTCfmWindkFn5
EOF
)"
```

---

### Task 12: `UpdateBanner` — wire the notification into the Control UI

**Files:**
- Create: `src/control/components/UpdateBanner.tsx`
- Modify: `src/control/App.tsx`

**Interfaces:**
- Consumes: `useUpdater()` from Task 11.

- [ ] **Step 1: Implement the banner**

`src/control/components/UpdateBanner.tsx`:

```tsx
import type { UpdaterState } from '../hooks/updaterReducer'

interface UpdateBannerProps {
  updater: Pick<UpdaterState, 'status' | 'version'> & { restart: () => Promise<void> }
}

export function UpdateBanner({ updater }: UpdateBannerProps) {
  if (updater.status === 'downloading') {
    return (
      <div className="flex items-center justify-center gap-2 bg-blue-500/20 px-4 py-1.5 text-xs text-blue-200">
        <span>Nova versão {updater.version} disponível — baixando em segundo plano…</span>
      </div>
    )
  }

  if (updater.status === 'ready') {
    return (
      <div className="flex items-center justify-center gap-3 bg-emerald-500/20 px-4 py-1.5 text-xs text-emerald-200">
        <span>Atualização pronta — reinicie para aplicar.</span>
        <button
          onClick={() => updater.restart()}
          className="rounded bg-emerald-500/30 px-2 py-0.5 font-medium hover:bg-emerald-500/40"
        >
          Reiniciar agora
        </button>
      </div>
    )
  }

  return null
}
```

`'idle'`, `'checking'`, and `'error'` all render nothing — coherent with RN-07 (errors never interrupt the operator).

- [ ] **Step 2: Mount it in `App.tsx`**

Replace `src/control/App.tsx`:

```tsx
import { LeftPanel } from './panels/LeftPanel'
import { CenterPanel } from './panels/CenterPanel'
import { RightPanel } from './panels/RightPanel'
import { UpdateBanner } from './components/UpdateBanner'
import { useUpdater } from './hooks/useUpdater'

function App() {
  const updater = useUpdater()

  return (
    <div className="flex h-screen flex-col bg-neutral-900 text-neutral-100 antialiased">
      <UpdateBanner updater={updater} />
      <div className="grid flex-1 grid-cols-[minmax(220px,280px)_1fr_minmax(300px,380px)]">
        <LeftPanel />
        <CenterPanel />
        <RightPanel />
      </div>
    </div>
  )
}

export default App
```

- [ ] **Step 3: Verify**

```bash
pnpm run typecheck
pnpm run build
```

Manual (human): `pnpm tauri dev` — with no reachable update endpoint yet (no releases published), the banner renders nothing and the console shows a logged `[updater] check failed:` message; the rest of the UI is unaffected.

- [ ] **Step 4: Commit**

```bash
git add src/control/components src/control/App.tsx
git commit -m "$(cat <<'EOF'
feat: wire UpdateBanner into Control (non-modal, RN-07)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01AnNYrqSpLRTCfmWindkFn5
EOF
)"
```

---

### Task 13: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write it**

`README.md`:

```markdown
# Poiema Presenter

App de apresentação de culto (letras, mídia, avisos) para igrejas — ver
`doc-funcional` (produto) e `tech-documentation.md` (arquitetura) na raiz do
repositório, e `docs/superpowers/specs/2026-09-03-foundation-design.md` para
o desenho desta fundação.

## Pré-requisitos

- [pnpm](https://pnpm.io) (testado com 10.x)
- [Rust](https://www.rust-lang.org/tools/install) (toolchain estável, testado com 1.98)
- [Node.js](https://nodejs.org) 22+
- No Linux, as dependências de sistema do Tauri (ver `.github/workflows/ci.yml`
  para a lista exata usada em CI). No macOS/Windows não é necessário nada além
  do Xcode Command Line Tools / Visual Studio Build Tools que o Rust já pede.

## Rodando em desenvolvimento

```bash
pnpm install
pnpm tauri dev
```

Abre a janela de Controle. O botão "Abrir Projetor" cria a janela de projeção
sobre o monitor secundário, se houver um conectado — sem segundo monitor, o
app fica em modo ensaio (nenhuma janela de projeção).

## Build local

```bash
pnpm tauri build
```

Gera o instalador da plataforma atual em `src-tauri/target/release/bundle/`.

## Builds não assinados

Por enquanto o app **não é assinado** para macOS (Apple Developer ID) nem
Windows (certificado Authenticode) — decisão registrada em
`docs/superpowers/specs/2026-09-03-foundation-design.md` §2. Isso significa
que, no primeiro uso, o macOS mostra um aviso do Gatekeeper ("app de
desenvolvedor não identificado") e o Windows mostra um aviso do SmartScreen.
Em ambos os casos, o usuário pode prosseguir manualmente (macOS: botão direito
no app → Abrir; Windows: "Mais informações" → "Executar assim mesmo"). Isso
pode ser resolvido depois adquirindo os certificados, sem mudar o pipeline.

## Publicando um release

1. Vá em **Actions → Release → Run workflow** no GitHub.
2. Escolha o tipo de bump (`patch`, `minor` ou `major`).
3. O workflow bump a versão em `package.json` e `src-tauri/Cargo.toml`
   (`tauri.conf.json` lê a versão de `package.json` automaticamente), cria a
   tag `vX.Y.Z`, e builda + publica os instaladores de macOS (universal) e
   Windows num GitHub Release, junto com o manifesto `latest.json` do
   auto-updater.

## Auto-updater

O app checa por atualizações em background (no início e a cada 6h), baixa e
instala silenciosamente quando encontra uma versão nova, e só pede reinício
por ação explícita do usuário — nunca reinicia sozinho no meio de um culto.

A assinatura dos pacotes de atualização usa uma chave Ed25519 própria do
Tauri (sem custo, diferente de certificado de assinatura de código do SO). A
chave privada vive em `~/.tauri/poiema-presenter.key` de quem a gerou, e como
os secrets `TAURI_SIGNING_PRIVATE_KEY` / `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`
no GitHub Actions — nunca commitada. Para regenerá-la:

```bash
pnpm exec tauri signer generate -w ~/.tauri/poiema-presenter.key
```

e atualize `plugins.updater.pubkey` em `src-tauri/tauri.conf.json` com a nova
chave pública, além dos dois secrets acima.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "$(cat <<'EOF'
docs: add README (dev workflow, release process, updater)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01AnNYrqSpLRTCfmWindkFn5
EOF
)"
```

---

### Task 14: Full verification pass

**Files:** none (verification only; fix forward in whichever file is broken, if anything is).

- [ ] **Step 1: Run the whole local check suite**

```bash
pnpm run lint
pnpm run typecheck
pnpm run test
(cd src-tauri && cargo clippy -- -D warnings)
(cd src-tauri && cargo test)
pnpm run build
```

Expected: everything passes. If not, fix the specific failure in its owning file from the task that introduced it, re-run, and commit the fix with a message describing what was broken.

- [ ] **Step 2: Manual checklist (human)**

- [ ] `pnpm tauri dev` opens the Control window; the three-column dark layout renders.
- [ ] "Abrir Projetor" opens/positions the Projector window on the secondary monitor (or shows the modo-ensaio message with none attached).
- [ ] Push the branch, open a PR, confirm `ci.yml` passes on GitHub.
- [ ] Merge to `main`.
- [ ] Run `release.yml` once with `bump: patch` (only after Task 10's two secrets are set). Confirm: a version-bump commit and tag land on `main`, and a GitHub Release appears with a macOS `.dmg`, a Windows installer, and `latest.json` attached.
- [ ] Follow-up outside this plan's scope (needs a second release to exist, per spec §7): install the first release, publish a second one, and confirm the running app detects it, downloads and installs in the background, and the "Reiniciar agora" banner appears and works.
