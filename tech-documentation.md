# Poiema Presenter — Documentação Técnica do MVP

> **Status:** Especificação de implementação · **Versão:** 2.0 · **Stack:** Tauri 2.0 + Rust + React 18 + TypeScript + Tailwind + SQLite + Zustand

---

## 0. Princípios de Projeto

Quatro regras que resolvem qualquer decisão ambígua durante a implementação:

1. **O Rust é a fonte da verdade do estado ao vivo.** O React nunca é dono do que está na tela. Isso permite recarregar, fechar ou reabrir a janela do Projetor sem perder o slide ativo.
2. **O Projetor é burro e passivo.** Ele não consulta banco, não tem lógica de negócio, não tem acesso ao SQL. Recebe um payload já resolvido e renderiza.
3. **WYSIWYG por construção.** O Preview (painel direito) e o Projetor renderizam **o mesmo componente React**, com a mesma folha de estilo, diferindo apenas por escala. Nunca duas implementações de renderização.
4. **Nada bloqueia o operador.** Toda operação de I/O (import de mídia, thumbnails, parsing) é assíncrona e fora do caminho crítico do clique → slide na tela.

**Meta de latência:** do `onClick` no card ao primeiro frame pintado no Projetor: **< 50 ms** (fora a duração intencional do fade).

---

## 1. Visão Geral da Arquitetura

Arquitetura de **estado centralizado no core Rust**, com dois webviews como clientes assimétricos.

```
┌──────────────────────────────────────────────────────────────┐
│                      Rust Core (src-tauri)                   │
│                                                              │
│   AppState (Mutex)          SQLite (tauri-plugin-sql)        │
│   ├─ live: LiveState        ├─ events / timeline_items       │
│   ├─ projector_label        ├─ songs / song_slides           │
│   └─ display_config         └─ media / themes                │
│                                                              │
│   Commands (invoke)                Events (emit_to)          │
└───────┬──────────────────────────────────┬──────────────────┘
        │ invoke / listen                  │ emit_to("projector")
        │                                  │
┌───────▼────────────────────┐   ┌─────────▼───────────────────┐
│  Window "main" (Controle)  │   │  Window "projector"         │
│  ──────────────────────    │   │  ─────────────────────      │
│  Zustand (espelho do       │   │  Sem store, sem SQL.        │
│  estado + UI local)        │   │  useSyncExternalStore em    │
│  Painéis: Roteiro /        │   │  cima do listener IPC.      │
│  Workspace / Preview       │   │  <SlideRenderer scale=1 />  │
│  <SlideRenderer scale≈.2/> │   │  Borderless, sem chrome.    │
└────────────────────────────┘   └─────────────────────────────┘
```

### 1.1 Fluxo de um "go live"

```
Operador clica no card 3
  → useLiveStore.goLive(slideId)                       [otimista: UI já muda]
  → invoke("set_live_slide", { payload })              [~1-3ms]
      → Rust: trava AppState, grava live = payload
      → Rust: emit_to("projector", "live:state", payload)
      → Rust: emit_to("main", "live:ack", { revision })  [reconcilia]
  → Projetor: listener recebe → setState → crossfade CSS
```

O update otimista no Controle é o que dá sensação de instantaneidade; o `ack` com `revision` serve para reconciliar caso um comando falhe (raro, mas evita UI mentindo sobre o que está na tela).

---

## 2. Gerenciamento de Janelas e Monitores (Rust)

### 2.1 APIs de fato usadas

| Necessidade          | API Tauri 2.0                                                                                            |
| -------------------- | -------------------------------------------------------------------------------------------------------- |
| Listar monitores     | `AppHandle::available_monitors() -> Result<Vec<Monitor>>`                                                |
| Monitor principal    | `AppHandle::primary_monitor() -> Result<Option<Monitor>>`                                                |
| Criar o Projetor     | `tauri::webview::WebviewWindowBuilder::new(&app, "projector", WebviewUrl::App("projector.html".into()))` |
| Emitir p/ um webview | `AppHandle::emit_to("projector", evento, payload)` (requer `use tauri::Emitter`)                         |
| Escutar no Rust      | `use tauri::Listener`                                                                                    |

`Monitor` expõe `name()`, `size()` (`PhysicalSize`), `position()` (`PhysicalPosition`) e `scale_factor()`.

### 2.2 Criação do Projetor

```rust
use tauri::{AppHandle, Manager, Emitter, WebviewUrl, PhysicalPosition, PhysicalSize};
use tauri::webview::WebviewWindowBuilder;

pub const PROJECTOR_LABEL: &str = "projector";

#[tauri::command]
pub async fn open_projector(app: AppHandle, monitor_name: Option<String>) -> Result<(), String> {
    if let Some(w) = app.get_webview_window(PROJECTOR_LABEL) {
        w.show().map_err(|e| e.to_string())?;
        return Ok(());
    }

    let monitors = app.available_monitors().map_err(|e| e.to_string())?;
    let primary = app.primary_monitor().ok().flatten();

    // Preferência: monitor pedido → primeiro não-primário.
    // NUNCA cai para o primário: uma janela borderless + always_on_top sobre a
    // tela do operador é pior que não projetar. Sem segunda tela o app entra em
    // MODO ENSAIO (RF-38) — nenhuma janela de projeção, só a miniatura Ao Vivo.
    let target = monitor_name
        .and_then(|n| monitors.iter().find(|m| m.name() == Some(&n)).cloned())
        .or_else(|| monitors.iter()
            .find(|m| primary.as_ref().map_or(false, |p| p.position() != m.position()))
            .cloned())
        .ok_or("Nenhuma tela secundária disponível — modo ensaio")?;

    let pos = *target.position();
    let size = *target.size();

    let window = WebviewWindowBuilder::new(&app, PROJECTOR_LABEL, WebviewUrl::App("projector.html".into()))
        .title("Poiema — Projeção")
        .decorations(false)
        .resizable(false)
        .skip_taskbar(true)
        .always_on_top(true)
        .visible(false)          // evita flash branco
        .build()
        .map_err(|e| e.to_string())?;

    window.set_position(PhysicalPosition::new(pos.x, pos.y)).map_err(|e| e.to_string())?;
    window.set_size(PhysicalSize::new(size.width, size.height)).map_err(|e| e.to_string())?;
    window.show().map_err(|e| e.to_string())?;

    Ok(())
}
```

> **⚠️ Armadilha macOS:** **não** usar `.fullscreen(true)`. No macOS isso cria um _Space_ nativo, o que provoca a animação de troca de desktop, tira o foco do Controle e quebra o `always_on_top`. A abordagem correta em ambos os SOs é **janela borderless posicionada e dimensionada exatamente sobre o monitor alvo**, como no código acima. Se ainda assim for necessário fullscreen real, existe `window.set_simple_fullscreen(true)` — método inerente de `WebviewWindow`, sem import extra, que no macOS não cria Space e nas outras plataformas faz fallback para `set_fullscreen`. **Requer tauri ≥ 2.9.0** (ausente em 2.0–2.8); fixar essa versão mínima no `Cargo.toml`.

> **⚠️ Armadilha Windows:** `always_on_top(true)` combinado com `skip_taskbar(true)` é o que impede que uma notificação do Windows ou o Alt+Tab apareça no telão. Vale também desabilitar o menu de contexto e a seleção de texto no webview do Projetor via CSS (`user-select: none`).

### 2.3 Hot-plug de monitores

O cabo do projetor cai no meio do culto — isso **vai** acontecer. Registrar um listener no evento de resize/move da janela e um polling leve (a cada 2 s, só quando o Projetor está aberto) comparando `available_monitors()` com o snapshot anterior:

- Monitor alvo sumiu → esconder o Projetor, emitir `display:lost` para o Controle mostrar um aviso não-modal no topo.
- Monitor voltou → reposicionar e reexibir automaticamente, e reenviar o `LiveState` atual.

### 2.4 Ressincronização

Ao montar, o Projetor **sempre** chama `invoke("get_live_state")` antes de assinar os eventos. Isso cobre três casos: janela aberta depois do slide já estar ativo, reload do webview em dev (HMR) e recuperação de crash do webview.

---

## 3. Modelo de Dados (SQLite)

### 3.1 Convenções

- **PKs:** `TEXT` contendo UUID v4/v7 gerado no Rust (`uuid` crate). UUID v7 é preferível por ser ordenável por tempo.
- **Timestamps:** `INTEGER` (epoch em milissegundos, UTC). Nada de `DATETIME` string.
- **Booleans:** `INTEGER` 0/1.
- **Ordenação:** `order_index REAL` com **indexação fracionária** nas listas reordenáveis pelo usuário — apenas `timeline_items` (detalhe em 3.4). `song_slides` usa `INTEGER` denso, porque é regenerado por completo a cada mudança de letra e nunca é reordenado à mão.
- **Pragmas de conexão:** `journal_mode = WAL`, `foreign_keys = ON`, `synchronous = NORMAL`.

### 3.2 DDL — Migration 001 (initial)

```sql
-- ============ CATÁLOGO ============

CREATE TABLE songs (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  artist       TEXT,
  lyrics_raw   TEXT NOT NULL,            -- fonte da verdade, com marcadores de seção
  ccli         TEXT,
  theme_id     TEXT REFERENCES themes(id) ON DELETE SET NULL,
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL
);
CREATE INDEX idx_songs_title ON songs(title COLLATE NOCASE);

-- Slides materializados no import. Reconstruídos (DELETE + INSERT) sempre
-- que lyrics_raw muda. Materializar (em vez de derivar no fetch) garante que
-- a numeração dos slides não mude sozinha entre o ensaio e o culto.
CREATE TABLE song_slides (
  id           TEXT PRIMARY KEY,
  song_id      TEXT NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  order_index  INTEGER NOT NULL,         -- 0..N, denso, reconstruído por completo
  section      TEXT,                     -- 'Verso 1', 'Refrão', 'Ponte'… ou NULL
  section_seq  INTEGER NOT NULL DEFAULT 0, -- índice do chunk dentro da seção
  content      TEXT NOT NULL             -- 1 ou 2 linhas separadas por \n
);
CREATE UNIQUE INDEX idx_song_slides_order ON song_slides(song_id, order_index);

CREATE TABLE media (
  id           TEXT PRIMARY KEY,
  file_path    TEXT NOT NULL UNIQUE,     -- caminho absoluto no disco
  file_name    TEXT NOT NULL,
  kind         TEXT NOT NULL CHECK (kind IN ('image','video')),
  mime         TEXT,
  width        INTEGER,
  height       INTEGER,
  duration_ms  INTEGER,                  -- NULL para imagem
  thumb_path   TEXT,                     -- JPG em appDataDir/thumbs/{id}.jpg
  file_missing INTEGER NOT NULL DEFAULT 0,
  created_at   INTEGER NOT NULL
);
CREATE INDEX idx_media_kind ON media(kind);

CREATE TABLE themes (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  font_family    TEXT NOT NULL DEFAULT 'Inter',
  font_size_vh   REAL NOT NULL DEFAULT 8.0,   -- em vh, escala com a resolução
  font_weight    INTEGER NOT NULL DEFAULT 700,
  color          TEXT NOT NULL DEFAULT '#FFFFFF',
  align          TEXT NOT NULL DEFAULT 'center'
                 CHECK (align IN ('left','center','right')),
  v_align        TEXT NOT NULL DEFAULT 'center'
                 CHECK (v_align IN ('top','center','bottom')),
  shadow         INTEGER NOT NULL DEFAULT 1,
  outline_px     REAL NOT NULL DEFAULT 0,
  scrim_opacity  REAL NOT NULL DEFAULT 0.25,  -- véu escuro sobre o fundo
  safe_margin_pc REAL NOT NULL DEFAULT 8.0,
  is_default     INTEGER NOT NULL DEFAULT 0
);

-- ============ ROTEIRO ============

CREATE TABLE events (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  event_date  INTEGER NOT NULL,
  theme_id    TEXT REFERENCES themes(id) ON DELETE SET NULL,
  created_at  INTEGER NOT NULL
);
CREATE INDEX idx_events_date ON events(event_date DESC);

CREATE TABLE timeline_items (
  id           TEXT PRIMARY KEY,
  event_id     TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  order_index  REAL NOT NULL,
  item_type    TEXT NOT NULL CHECK (item_type IN ('song','media','text','header')),
  ref_id       TEXT,                     -- songs.id | media.id | NULL
  label        TEXT,                     -- override do título ("Louvor 2")
  payload      TEXT,                     -- JSON: para 'text'/'header' e opções por item
  theme_id     TEXT REFERENCES themes(id) ON DELETE SET NULL,
  created_at   INTEGER NOT NULL
);
CREATE INDEX idx_timeline_event_order ON timeline_items(event_id, order_index);

-- Como o item se comporta no telão. Materializa RF-25 / RF-27 / RN-03:
--   'direct'    → a mídia ocupa a tela sozinha (vinheta, aviso, contagem)
--   'background'→ vira o fundo corrente e PERSISTE para os itens seguintes
--                 que não trouxerem fundo próprio (o loop atrás do bloco de louvor)
--   'inherit'   → usa o fundo corrente (padrão de item de música)
--   'own'       → tem fundo próprio, não altera o corrente
ALTER TABLE timeline_items ADD COLUMN background_mode TEXT NOT NULL
  DEFAULT 'inherit'
  CHECK (background_mode IN ('direct','background','inherit','own'));
ALTER TABLE timeline_items ADD COLUMN background_media_id TEXT
  REFERENCES media(id) ON DELETE SET NULL;

-- Busca por trecho de letra (RF-21). Tabela externa, sincronizada por triggers.
CREATE VIRTUAL TABLE songs_fts USING fts5(
  title, lyrics_raw, content='songs', content_rowid='rowid', tokenize='unicode61 remove_diacritics 2'
);
CREATE TRIGGER trg_songs_ai AFTER INSERT ON songs BEGIN
  INSERT INTO songs_fts(rowid, title, lyrics_raw) VALUES (NEW.rowid, NEW.title, NEW.lyrics_raw);
END;
CREATE TRIGGER trg_songs_ad AFTER DELETE ON songs BEGIN
  INSERT INTO songs_fts(songs_fts, rowid, title, lyrics_raw)
    VALUES ('delete', OLD.rowid, OLD.title, OLD.lyrics_raw);
END;
CREATE TRIGGER trg_songs_au AFTER UPDATE ON songs BEGIN
  INSERT INTO songs_fts(songs_fts, rowid, title, lyrics_raw)
    VALUES ('delete', OLD.rowid, OLD.title, OLD.lyrics_raw);
  INSERT INTO songs_fts(rowid, title, lyrics_raw) VALUES (NEW.rowid, NEW.title, NEW.lyrics_raw);
END;

CREATE TABLE app_settings (
  key    TEXT PRIMARY KEY,
  value  TEXT NOT NULL
);
```

**Integridade referencial de `ref_id`:** SQLite não suporta FK polimórfica. Garantir no Rust (a camada de comandos valida `item_type` × existência de `ref_id`) e adicionar um trigger de limpeza:

```sql
CREATE TRIGGER trg_media_delete_cleanup
AFTER DELETE ON media
BEGIN
  DELETE FROM timeline_items
   WHERE item_type = 'media' AND ref_id = OLD.id;
END;
-- (trigger equivalente para songs)
```

### 3.3 Migrations

```rust
use tauri_plugin_sql::{Builder, Migration, MigrationKind};

fn migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "initial_schema",
            sql: include_str!("../migrations/001_initial.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "seed_default_theme",
            sql: include_str!("../migrations/002_seed.sql"),
            kind: MigrationKind::Up,
        },
    ]
}

tauri::Builder::default()
    .plugin(
        tauri_plugin_sql::Builder::default()
            .add_migrations("sqlite:poiema.db", migrations())
            .build(),
    )
```

`description` e `sql` são `&'static str` — daí o `include_str!`, que também mantém o SQL em arquivos versionados e legíveis em vez de strings inline.

Migrations são **imutáveis depois de publicadas**. Correção de schema = nova migration, nunca edição da anterior.

### 3.4 Indexação fracionária para drag-and-drop

Reordenar por `UPDATE` em N linhas é lento e gera flicker. Em vez disso, `order_index` é `REAL` e a inserção entre A e B usa `(a.order_index + b.order_index) / 2`:

```ts
export function indexBetween(prev?: number, next?: number): number {
  if (prev == null && next == null) return 1000;
  if (prev == null) return next! - 1000;
  if (next == null) return prev + 1000;
  return (prev + next) / 2;
}
```

Após ~24 bisseções no mesmo ponto (partindo de um passo de 1000) o `double` chega ao limiar. Mitigação: se `Math.abs(next - prev) < 0.0001`, disparar `normalize_timeline(event_id)` no Rust, que reescreve todos os índices como 1000, 2000, 3000… numa única transação. Na prática isso quase nunca roda.

---

## 4. Algoritmo de Quebra de Letras

Regra de produto: **exatamente 2 linhas por card** — mas nunca atravessando a fronteira de uma seção, porque isso deixa a última linha do Verso 1 colada na primeira do Refrão no telão.

### 4.1 Formato de entrada aceito

```
[Verso 1]
Grande é o Senhor e mui digno de louvor
Na cidade do nosso Deus, no seu Santo Monte

[Refrão]
Grande é o Senhor
Em Ti nós temos a vitória
```

Seções são reconhecidas por `[Nome]` ou por linha em branco (fallback quando não há marcadores).

### 4.2 Implementação

```ts
export interface ParsedSlide {
  section: string | null;
  sectionSeq: number;
  content: string; // 1 ou 2 linhas, separadas por \n
}

const SECTION_RE = /^\s*[\[(]\s*(.+?)\s*[\])]\s*$/;

export function parseLyrics(raw: string, linesPerSlide = 2): ParsedSlide[] {
  const slides: ParsedSlide[] = [];
  let section: string | null = null;
  let buffer: string[] = [];
  let seq = 0;

  const flush = () => {
    for (let i = 0; i < buffer.length; i += linesPerSlide) {
      slides.push({
        section,
        sectionSeq: seq++,
        content: buffer.slice(i, i + linesPerSlide).join("\n"),
      });
    }
    buffer = [];
  };

  for (const line of raw.replace(/\r\n/g, "\n").split("\n")) {
    const trimmed = line.trim();
    const header = trimmed.match(SECTION_RE);

    if (header) {
      flush();
      section = header[1];
      seq = 0;
      continue;
    }
    if (trimmed === "") {
      flush();
      seq = 0;
      continue;
    } // linha em branco = fronteira
    buffer.push(trimmed);
  }
  flush();
  return slides;
}
```

**Casos de borda cobertos:** seção com número ímpar de linhas → último card com 1 linha (aceito e centralizado); linhas em branco consecutivas → colapsadas; letra sem nenhum marcador → seções por parágrafo; CRLF normalizado.

**Onde roda:** no import (comando Rust `import_song`), materializando em `song_slides`. O parser vive em TS _e_ é espelhado em Rust? **Não** — para evitar duas implementações divergentes, o parsing acontece **no Rust** (`src-tauri/src/lyrics.rs`) e o TS acima serve apenas como referência de algoritmo e para o preview ao vivo no diálogo de import. A verdade materializada é sempre a do Rust.

---

## 5. Contratos IPC

Tipos compartilhados em `src/shared/ipc.ts`, importados pelas duas janelas. Toda mudança aqui é breaking change entre os dois webviews.

### 5.1 Payload de estado ao vivo

```ts
export type FitMode = "cover" | "contain";

export interface LiveBackground {
  kind: "image" | "video" | "color";
  /** URL já convertida via convertFileSrc — o Projetor nunca vê caminho de disco */
  src: string | null;
  color?: string;
  fit: FitMode;
  loop: boolean;
  muted: boolean;
}

export interface LiveTheme {
  fontFamily: string;
  fontSizeVh: number;
  fontWeight: number;
  color: string;
  align: "left" | "center" | "right";
  vAlign: "top" | "center" | "bottom";
  shadow: boolean;
  outlinePx: number;
  scrimOpacity: number;
  safeMarginPc: number;
}

export interface LiveState {
  /** Incrementa a cada mutação. O Controle descarta acks fora de ordem. */
  revision: number;
  /** null = sem texto na tela (fundo continua) */
  text: string | null;
  background: LiveBackground | null;
  theme: LiveTheme;
  blackout: boolean;
  /** ms; 0 = corte seco */
  transitionMs: number;
  /** rastreabilidade: qual item/slide originou este estado.
   *  sourceItemId é o que o painel esquerdo usa para marcar o item no ar (RF-12). */
  sourceItemId: string | null;
  sourceSlideId: string | null;
}
```

### 5.2 Comandos (`invoke`)

| Comando              | Args                                                             | Retorno                          | Observação                                                                                                             |
| -------------------- | ---------------------------------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `get_live_state`     | —                                                                | `LiveState`                      | Chamado pelo Projetor ao montar                                                                                        |
| `set_live_slide`     | `{ text, backgroundId?, themeId?, sourceSlideId, transitionMs }` | `{ revision }`                   | Resolve mídia → URL no Rust                                                                                            |
| `set_blackout`       | `{ on: boolean }`                                                | `{ revision }`                   |                                                                                                                        |
| `clear_text`         | —                                                                | `{ revision }`                   | Mantém o fundo                                                                                                         |
| `open_projector`     | `{ monitorName?: string }`                                       | `void`                           |                                                                                                                        |
| `close_projector`    | —                                                                | `void`                           |                                                                                                                        |
| `list_monitors`      | —                                                                | `MonitorInfo[]`                  | `{ name, width, height, x, y, scaleFactor, isPrimary }`                                                                |
| `import_song`        | `{ title, artist?, lyricsRaw }`                                  | `Song & { slides: SongSlide[] }` | Faz o chunking                                                                                                         |
| `update_song`        | `{ songId, title?, artist?, lyricsRaw? }`                        | `Song & { slides: SongSlide[] }` | Se `lyricsRaw` mudou, reconstrói `song_slides` numa transação (RF-20)                                                  |
| `preview_chunking`   | `{ lyricsRaw }`                                                  | `ParsedSlide[]`                  | Prévia do diálogo de import (RF-19) sem gravar nada — **usa o mesmo parser Rust**, o que elimina a divergência TS×Rust |
| `import_media`       | `{ paths: string[] }`                                            | `MediaItem[]`                    | **Registra o caminho** (não copia — ver §7), extrai metadados e gera thumbnail                                         |
| `duplicate_event`    | `{ eventId, name, date }`                                        | `Event`                          | Copia o evento e todos os `timeline_items` com os mesmos `order_index` (RF-04)                                         |
| `count_references`   | `{ kind: 'song'\|'media', id }`                                  | `{ events: number }`             | Alimenta o texto da confirmação de exclusão (RN-04)                                                                    |
| `normalize_timeline` | `{ eventId }`                                                    | `void`                           | Manutenção de `order_index`                                                                                            |

Consultas de leitura simples (listar timeline, listar mídia) vão direto pelo `@tauri-apps/plugin-sql` na janela de Controle. Só o que precisa de efeito colateral, resolução de path ou mutação de estado ao vivo passa por comando Rust.

### 5.3 Eventos (`emit_to` → `listen`)

| Evento              | Direção            | Payload                                                                   |
| ------------------- | ------------------ | ------------------------------------------------------------------------- |
| `live:state`        | Rust → `projector` | `LiveState` (estado completo, não delta)                                  |
| `live:preload`      | Rust → `projector` | `{ srcs: string[] }` — fundos dos próximos itens, para instanciar ocultos |
| `live:ack`          | Rust → `main`      | `{ revision: number }`                                                    |
| `display:changed`   | Rust → `main`      | `{ monitors: MonitorInfo[] }`                                             |
| `display:lost`      | Rust → `main`      | `{ monitorName: string }`                                                 |
| `media:thumb-ready` | Rust → `main`      | `{ mediaId, thumbUrl }`                                                   |

> **Decisão:** enviar o **estado completo** a cada mudança, não diffs. O payload é pequeno (< 1 KB), elimina toda classe de bug de dessincronização, e torna o Projetor trivialmente idempotente.

> **Nota sobre Channels:** o sistema de eventos do Tauri é adequado aqui porque a frequência é baixa (alguns eventos por minuto). Channels só seriam necessários para streaming contínuo — não é o caso do MVP.

### 5.4 Segurança (capabilities)

Duas capabilities separadas. O Projetor **não** recebe permissão de SQL nem de filesystem — só de evento:

`src-tauri/capabilities/main.json`

```json
{
  "identifier": "main-capability",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:event:default",
    "sql:default",
    "sql:allow-select",
    "sql:allow-execute",
    "dialog:allow-open",
    "fs:allow-read-file"
  ]
}
```

`src-tauri/capabilities/projector.json`

```json
{
  "identifier": "projector-capability",
  "windows": ["projector"],
  "permissions": [
    "core:event:default",
    "core:webview:allow-internal-toggle-devtools"
  ]
}
```

> **Nota importante:** comandos próprios do app (registrados no `invoke_handler`) **não** passam pela ACL — são liberados para todas as janelas por padrão. Por isso o Projetor consegue chamar `get_live_state` mesmo com uma capability mínima. O que a capability restringe são os comandos de _core_ e de _plugins_ — que é exatamente o que se quer negar ao Projetor: SQL, filesystem e diálogos. Para restringir também os comandos próprios, seria preciso `AppManifest::commands` no `tauri-build`; não é necessário no MVP.

E no `tauri.conf.json`, o protocolo de asset com escopo restrito às pastas de mídia:

```json
{
  "app": {
    "security": {
      "assetProtocol": {
        "enable": true,
        "scope": ["$APPDATA/thumbs/**", "$HOME/**"]
      },
      "csp": "default-src 'self'; img-src 'self' asset: http://asset.localhost data:; media-src 'self' asset: http://asset.localhost"
    }
  }
}
```

`convertFileSrc(path)` produz `asset://localhost/...` no macOS/Linux e `http://asset.localhost/...` no Windows — daí ambos precisarem estar na CSP.

> **Sobre o escopo `$HOME/**`:** é deliberadamente amplo, porque o acervo referencia arquivos onde o usuário os guarda (§7) e não há como prever a pasta. O que limita o risco é a *outra* metade da regra: o Projetor não tem `fs`nem`dialog`na capability dele, e só recebe URLs já resolvidas pelo Rust — ele nunca escolhe um caminho. Se depois houver um modo "empacotar evento", trocar por`$APPDATA/media/\*\*` e restringir de verdade.

---

## 6. Frontend — Arquitetura React

### 6.1 Estrutura de pastas

```
src/
├── shared/
│   ├── ipc.ts                  # tipos LiveState, comandos, eventos
│   ├── db/                     # queries tipadas (plugin-sql)
│   │   ├── client.ts
│   │   ├── timeline.ts
│   │   ├── songs.ts
│   │   └── media.ts
│   └── render/
│       ├── SlideRenderer.tsx   # ÚNICO renderizador — usado por Projetor e Preview
│       ├── BackgroundLayer.tsx # duplo buffer p/ crossfade
│       └── TextLayer.tsx       # autofit + máscara de fade
├── control/                    # entrada: index.html
│   ├── App.tsx
│   ├── panels/
│   │   ├── LeftPanel/          # SegmentedControl, TimelineList, TimelineItemRow
│   │   ├── CenterPanel/        # SlideGrid, SlideCard, EmptyState
│   │   └── RightPanel/         # LivePreview, TransportControls, MonitorPicker
│   ├── stores/
│   │   ├── useLiveStore.ts     # espelho do LiveState + ações IPC
│   │   ├── useEventStore.ts    # evento atual, timeline, item selecionado
│   │   └── useUiStore.ts       # aba ativa, larguras dos painéis, modais
│   └── hooks/
│       ├── useKeyboardTransport.ts
│       └── useTimelineDnd.ts
└── projector/                  # entrada: projector.html
    ├── main.tsx
    └── ProjectorRoot.tsx
```

**Dois entry points no Vite:**

```ts
// vite.config.ts
build: {
  rollupOptions: {
    input: {
      main: resolve(__dirname, 'index.html'),
      projector: resolve(__dirname, 'projector.html'),
    },
  },
},
```

`projector.html` fica na **raiz do projeto**, ao lado do `index.html` — se ficar num subdiretório, o Rollup preserva o caminho na saída e o `WebviewUrl::App("projector.html")` (que resolve para `tauri://localhost/projector.html`) quebra em produção mesmo funcionando em dev.

### 6.2 Layout do Controle (Window 1)

Grid de três colunas com larguras fixas no MVP (redimensionamento por arraste fica para depois — o `useUiStore` já reserva o campo, mas o grid abaixo é estático):

```tsx
<div
  className="grid h-screen grid-cols-[minmax(220px,280px)_1fr_minmax(300px,380px)]
                bg-neutral-900/80 text-neutral-100 antialiased"
>
  <LeftPanel />
  <CenterPanel />
  <RightPanel />
</div>
```

**Estética macOS:** `titleBarStyle: "Overlay"` no `tauri.conf.json` + `hiddenTitle: true` para o efeito de janela sem barra; `backdrop-blur-xl` com `bg-white/5` nos painéis para vibrancy; separadores de 1 px em `border-white/8`; raios de 8–10 px; nenhuma sombra pesada. Transições de UI em 150 ms `ease-out`.

**Painel Esquerdo:** segmented control (`Roteiro` | `Mídia`) no topo, com `bg-white/10` no trilho e `bg-white/20` no thumb animado por `transform: translateX`. Abaixo, a timeline vertical: cada linha com ícone de tipo, label, duração/contagem de slides, e um handle de drag que só aparece no hover.

**Painel Central (Workspace):** cards em **coluna única, largos e baixos** — ocupam a largura do painel (~780 px numa janela de 1440) com altura fixa de ~72 px, algo em torno de 11:1. A forma é intencional: espelha o formato de uma linha de letra, e permite ler as duas linhas do slide sem reduzir a fonte. Cada card mostra as 2 linhas da letra em tamanho legível, com a tag de seção como badge discreto no canto. Estados visuais distintos e inconfundíveis:

| Estado                        | Tratamento                                        |
| ----------------------------- | ------------------------------------------------- |
| Normal                        | `bg-white/5`, borda `white/8`                     |
| Hover                         | `bg-white/8`                                      |
| Selecionado (foco de teclado) | anel `ring-1 ring-white/30`                       |
| **Ao vivo**                   | borda esquerda 3 px em vermelho + `bg-red-500/10` |
| Próximo (preparado)           | borda esquerda 3 px em âmbar                      |

**Painel Direito:** container `aspect-video` com o `SlideRenderer` escalado, e abaixo os botões compactos: `Tela Preta` (toggle, vermelho quando ativo), `Limpar Texto`, `Logo`, e o seletor de monitor.

### 6.3 O renderizador único

```tsx
// shared/render/SlideRenderer.tsx
export function SlideRenderer({
  state,
  scale = 1,
}: {
  state: LiveState;
  scale?: number;
}) {
  return (
    <div
      className="relative h-full w-full overflow-hidden bg-black"
      style={{ ["--slide-scale" as string]: scale }}
    >
      <BackgroundLayer
        background={state.background}
        transitionMs={state.transitionMs}
      />
      {state.background && state.theme.scrimOpacity > 0 && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: state.theme.scrimOpacity }}
        />
      )}
      <TextLayer
        text={state.blackout ? null : state.text}
        theme={state.theme}
        transitionMs={state.transitionMs}
      />
      {/* Blackout assimétrico (RN-02): corte seco na ida, fade na volta. */}
      <div
        className="pointer-events-none absolute inset-0 bg-black"
        style={{
          opacity: state.blackout ? 1 : 0,
          transition: state.blackout ? "none" : "opacity 200ms ease-out",
        }}
      />
    </div>
  );
}
```

**Preview ≠ decodificar duas vezes (RN-11).** O mesmo componente serve os dois destinos, mas o `BackgroundLayer` recebe `mode: 'live' | 'preview'`. Em `preview`, fundo de vídeo renderiza o **thumbnail estático** em vez de um `<video>`. Sem isso, uma máquina de 8 GB sem GPU dedicada decodifica 1080p duas vezes em paralelo — que é exatamente o cenário do CA-04.

A escala é feita por unidades relativas (`vh`/`cqh`), **não** por `transform: scale()` no texto — assim o preview é fiel sem sofrer de arredondamento de subpixel. Usar container queries (`@container`) com `cqh` no `font-size` faz o mesmo componente funcionar num container de 320 px e num de 1920 px sem nenhum ramo condicional.

### 6.4 Crossfade sem flicker (o detalhe que faz parecer profissional)

Dois elementos empilhados, alternando qual está visível. Nunca trocar o `src` de um elemento visível — isso pisca.

```tsx
function BackgroundLayer({ background, transitionMs }) {
  const [layers, setLayers] = useState<[Slot, Slot]>(EMPTY);
  const [front, setFront] = useState(0);

  useEffect(() => {
    const back = 1 - front;
    setLayers((prev) => {
      const next = [...prev];
      next[back] = toSlot(background);
      return next;
    });
    // espera o recurso decodificar antes de trocar a opacidade
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => setFront(back)),
    );
    return () => cancelAnimationFrame(id);
  }, [background?.src]);

  return layers.map((slot, i) => (
    <Media
      key={i}
      slot={slot}
      style={{
        opacity: i === front ? 1 : 0,
        transition: `opacity ${transitionMs}ms ease-in-out`,
        willChange: "opacity",
      }}
    />
  ));
}
```

**Regras de 60 fps:** animar apenas `opacity` e `transform`; nunca `width`, `top`, `filter` ou `box-shadow`; `will-change: opacity` apenas durante a transição (removido depois, senão consome VRAM); `<video>` com `preload="auto" muted playsInline` e `disablePictureInPicture`.

**Pré-carregamento:** ao selecionar um item da timeline, o Controle emite os `src` dos fundos dos próximos 2 itens para o Projetor via `live:preload`, que os instancia em `<link rel="preload">` / `<video preload>` ocultos. Isso elimina o frame preto no primeiro play de vídeo.

**Loop sem costura (RF-26).** `<video loop>` puro tem um engasgo perceptível no wrap: o elemento pausa, faz seek para 0 e volta a decodificar. Para um fundo que roda 25 minutos atrás do bloco de louvor, isso aparece. Solução: dois elementos `<video>` com o mesmo arquivo, alternando — quando o corrente passa de `duration - 0.4s`, o outro (já com `currentTime = 0` e buffer cheio) dá `play()` e assume via crossfade de 200 ms. Custo: uma segunda decodificação por 400 ms a cada volta, aceitável. Vale só para o Projetor — o Preview mostra quadro estático.

**Cursor:** `cursor: none` no `body` do Projetor, mais `contextmenu` e `dragstart` cancelados (RF-32).

### 6.5 Autofit de texto

Letras de música variam de 20 a 90 caracteres por card. Fonte fixa gera overflow. Algoritmo: `font-size` base do tema em `cqh`, e um `useLayoutEffect` que mede `scrollHeight` vs `clientHeight` e faz busca binária (máx. 6 iterações) num fator entre 0.55 e 1.0. Roda uma vez por mudança de texto, custo desprezível.

### 6.6 Zustand — fatiamento e IPC

```ts
export const useLiveStore = create<LiveSlice>((set, get) => ({
  state: INITIAL_LIVE_STATE,
  pendingRevision: 0,

  goLive: async (slide: SlideRef) => {
    const optimistic = buildLiveState(get().state, slide);
    set({ state: optimistic }); // pinta o preview já
    const { revision } = await invoke<{ revision: number }>("set_live_slide", {
      text: slide.content,
      backgroundId: slide.backgroundId ?? null,
      themeId: slide.themeId ?? null,
      sourceSlideId: slide.id,
      transitionMs: get().state.transitionMs,
    });
    set({ pendingRevision: revision });
  },

  toggleBlackout: () => invoke("set_blackout", { on: !get().state.blackout }),
  clearText: () => invoke("clear_text"),
}));
```

O Projetor **não usa Zustand**. Um único `useState` alimentado pelo listener; store global ali seria peso morto num bundle que precisa iniciar em milissegundos.

### 6.7 Teclado (transporte)

Operar culto com mouse é lento. Atalhos globais na janela de Controle:

| Tecla               | Ação                                |
| ------------------- | ----------------------------------- |
| `↓` / `↑` / `Space` | Próximo / anterior slide            |
| `→` / `←`           | Próximo / anterior item da timeline |
| `B`                 | Toggle tela preta                   |
| `C`                 | Limpar texto                        |
| `Esc`               | Desfazer seleção / fechar modal     |
| `1`–`9`             | Ir para o slide N do item atual     |

Implementar com `keydown` no `window`, ignorando quando o alvo é `input`/`textarea`/`[contenteditable]`.

**Anti-duplo-disparo (RF-42):** descartar `keydown` com `event.repeat === true` (tecla segurada não deve varrer a música inteira) e aplicar um guard de 120 ms por ação no `useLiveStore` — se já existe um `set_live_slide` em voo para o mesmo `sourceSlideId`, a chamada é ignorada em vez de enfileirada. O mesmo guard cobre o duplo-clique no cartão.

**Setas ←/→ apenas navegam** (RN-01): trocam o item selecionado e populam o painel central, sem tocar no `LiveState`. Só ↓/↑/Espaço/1–9/clique projetam.

---

## 7. Import de Mídia

1. `dialog.open({ multiple: true, filters: [...] })` no Controle → array de paths.
2. `invoke('import_media', { paths })`.
3. No Rust, por arquivo: validar extensão e existência → extrair metadados (dimensões via `image` crate; duração/dimensões de vídeo via `ffprobe` se disponível, senão `NULL` — degradação graciosa) → gerar thumbnail 480 px em `appDataDir/thumbs/{id}.jpg` → `INSERT` em `media`.
4. Emite `media:thumb-ready` por item conforme fica pronto, para a grade preencher progressivamente em vez de esperar o lote inteiro.

**Decisão sobre cópia de arquivos:** no MVP, **referenciar** o caminho original (não copiar). Copiar duplicaria dezenas de GB de vídeo. Consequência: arquivo movido/renomeado quebra o item — daí a coluna `file_missing`, verificada no carregamento do evento, com o card mostrando um estado de alerta e um botão "Localizar arquivo…". Um modo "empacotar evento" (copiar tudo para uma pasta) fica para pós-MVP.

---

## 8. Plano de Implementação

Cada fase entrega algo verificável rodando. Não avançar com a anterior quebrada.

### Fase 0 — Fundação (≈ 1 dia)

Scaffold `create-tauri-app` (React + TS), Tailwind, ESLint/Prettier, `tauri-plugin-sql`, dois entry points no Vite, capabilities separadas. **Critério:** `pnpm tauri dev` abre a janela principal e `projector.html` carrega numa janela criada manualmente.

### Fase 1 — Eixo de projeção (≈ 2 dias)

`AppState`, comandos `open_projector` / `set_live_slide` / `get_live_state` / `set_blackout` / `clear_text`, `SlideRenderer` com texto sobre cor sólida. **Critério:** um botão hardcoded no Controle põe texto no segundo monitor e o blackout funciona. _Este é o coração do produto — se essa fase não estiver sólida e instantânea, nada mais importa._

### Fase 2 — Persistência (≈ 2 dias)

Migrations, camada de queries tipadas, `import_song` com o parser, CRUD de eventos e timeline. **Critério:** criar um evento, importar duas músicas e ver os cards de 2 linhas no painel central.

### Fase 3 — Mídia (≈ 2 dias)

`import_media`, thumbnails, protocolo de asset, `BackgroundLayer` com crossfade, vídeo em loop. **Critério:** vídeo de fundo em loop com letra por cima, transição suave entre slides, sem flicker.

### Fase 4 — Timeline e operação (≈ 2 dias)

Drag-and-drop com indexação fracionária, atalhos de teclado, preview ao vivo, seletor de monitor, hot-plug. **Critério:** montar um roteiro completo (abertura → 3 músicas → aviso → pregação) e operá-lo inteiro sem tocar no mouse depois do início.

### Fase 5 — Acabamento (≈ 2 dias)

Temas, autofit, pré-carregamento, estados de erro (arquivo faltando, monitor perdido), telas vazias, ícone e build assinado. **Critério:** um voluntário que nunca viu o app opera um culto de ensaio sem perguntar nada.

---

## 9. Verificação e Riscos

### 9.1 O que testar (e como)

| Área                  | Abordagem                                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `parseLyrics`         | Testes unitários (Vitest) com fixtures: seção ímpar, sem marcadores, CRLF, linhas em branco duplas, letra vazia          |
| Indexação fracionária | Teste de propriedade: 1000 reordenações aleatórias mantêm a ordem consistente e disparam normalize quando devido         |
| Camada de dados       | Testes Rust contra SQLite em memória, incluindo cascades e triggers                                                      |
| Latência de IPC       | Instrumentar `performance.now()` no clique e `requestAnimationFrame` no Projetor; registrar p95 em dev                   |
| Renderização          | Screenshot do Projetor vs. do Preview, comparação de diff — garante o WYSIWYG                                            |
| Estabilidade          | Sessão de 2 h com troca de slide a cada 20 s, monitorando RSS e handles de vídeo (vazamento de `<video>` é o risco real) |

### 9.2 Riscos conhecidos

| Risco                                                            | Mitigação                                                                                                   |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Webview do Projetor decodifica vídeo 4K com stutter              | Recomendar 1080p H.264 na doc do usuário; pós-MVP avaliar renderização nativa (wgpu) para o output          |
| `always_on_top` perdido após notificação do SO no Windows        | Reafirmar `set_always_on_top(true)` no evento de foco perdido                                               |
| Divergência entre parser TS (preview de import) e Rust (verdade) | Parser canônico só no Rust; o TS é usado apenas para o preview do diálogo e é coberto pelos mesmos fixtures |
| DB corrompido em queda de energia                                | WAL + `synchronous = NORMAL`; backup automático do `.db` na abertura do app (últimas 5 cópias)              |
| Fonte não instalada na máquina da igreja                         | Empacotar as fontes como assets e declarar via `@font-face` local                                           |

---

## 10. Fora do MVP (registrado para não virar escopo silencioso)

Bíblia com múltiplas versões e busca por referência · Editor visual de temas · Múltiplos outputs (stage display com cronômetro e próxima letra) · Saída NDI/streaming · Import de ProPresenter (`.pro`) · Sincronização de setlists entre máquinas · Cronômetro de culto · Slides de anúncio com template · Undo/redo global.
