# Poiema Presenter — Fundação do Projeto (Design)

> **Status:** Aprovado · **Data:** 2026-09-03
> **Escopo:** primeira tarefa de implementação — a fundação do app (Fase 0 do `tech-documentation.md`) mais pipeline de release e auto-updater, que os documentos de produto não detalham.
> **Fora de escopo:** qualquer coisa das Fases 1–5 do `tech-documentation.md` (projeção, persistência, mídia, timeline, acabamento). Este documento não repete o que já está decidido em `tech-documentation.md` e `doc-funcional` — trata apenas do que essas duas fontes não cobrem: bootstrap do repositório, CI/CD e auto-updater.

---

## 1. Objetivo

Entregar uma base de projeto sólida e escalável que:

1. Builda e roda em Windows e macOS, mesmo que a UI seja apenas um "hello world" reconhecível (duas janelas: Controle e Projetor).
2. Segue exatamente a arquitetura e a estrutura de pastas já especificadas em `tech-documentation.md` (Tauri 2.0 + Rust + React 18 + TS + Tailwind + SQLite + Zustand), para que as fases seguintes (1–5) encaixem sem retrabalho estrutural.
3. Tem uma GitHub Action capaz de fazer bump de versão e gerar release com instaladores para as duas plataformas.
4. Tem auto-updater funcional: checagem silenciosa, download e instalação em background, aviso não-intrusivo quando pronto, reinício só por ação do usuário.

## 2. Decisões já tomadas (não revisitar)

Estas vieram da conversa de brainstorming e não precisam de nova aprovação:

- **Assinatura de código de SO:** nenhuma por enquanto. Builds não assinados no CI; documentar no README que o usuário verá aviso do Gatekeeper (macOS) / SmartScreen (Windows) no primeiro uso. Pode ser adicionado depois sem redesenhar o pipeline.
- **Bundle identifier:** `com.poiema.presenter`.
- **Trigger de release:** manual via `workflow_dispatch` com input de tipo de bump (`patch` | `minor` | `major`). Sem conventional commits automatizados nesta fase.
- **Package manager:** pnpm (já definido em `tech-documentation.md`).
- **Repositório remoto:** já existe (`git@github.com:guilherme-toti/poiema-presenter.git`), branch `main`, ainda sem commits.

## 3. Estrutura do projeto

Repositório único (não monorepo — YAGNI, um único app Tauri não justifica workspace tooling). Estrutura conforme `tech-documentation.md` §6.1:

```
poiema-presenter/
├── src/
│   ├── shared/
│   │   ├── ipc.ts
│   │   ├── db/
│   │   └── render/
│   ├── control/         # entry: index.html
│   └── projector/        # entry: projector.html
├── src-tauri/
│   ├── src/
│   ├── capabilities/
│   │   ├── main.json
│   │   └── projector.json
│   ├── Cargo.toml
│   └── tauri.conf.json
├── index.html
├── projector.html
├── scripts/
│   └── bump-version.mjs
└── .github/workflows/
    ├── ci.yml
    └── release.yml
```

Nesta fase, `src/shared/db`, `src/shared/render` e os painéis de `control/` ficam com apenas o mínimo para a tela "hello world" — não há schema de banco ainda (isso é Fase 2 do doc técnico). `tauri-plugin-sql` é instalado e as capabilities já separadas (main vs. projector), porque isso é infraestrutura que não muda depois; o schema em si não.

## 4. Escopo funcional desta fase ("hello world" fundacional)

- Janela **Controle** (`index.html`): abre com o grid de 3 colunas já estruturado (placeholders `LeftPanel` / `CenterPanel` / `RightPanel`), texto "Poiema Presenter" e um botão "Abrir Projetor".
- Janela **Projetor** (`projector.html`): borderless, posicionada sobre o segundo monitor quando existir (reaproveita o código Rust de `open_projector` de `tech-documentation.md` §2.2), mostra "Poiema Presenter" centralizado. Sem segundo monitor, não abre janela nenhuma (modo ensaio, RF-38) — só loga no console do Controle.
- Nenhuma lógica de negócio, banco populado ou IPC de estado ao vivo ainda. O objetivo é validar: duas janelas, dois entry points do Vite, detecção de monitor, e o pipeline de build/release/update funcionando ponta a ponta.

**Critério de pronto (bate com Fase 0 do doc técnico):** `pnpm tauri dev` abre a janela principal; `open_projector` cria e posiciona a janela do Projetor sobre o monitor secundário quando presente.

## 5. CI/CD — GitHub Actions

### 5.1 `ci.yml` (push e pull_request para `main`)

Feedback rápido, sem gerar instalador:
- `pnpm install`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (Vitest).
- `cargo check` e `cargo clippy -- -D warnings` em `src-tauri`.
- `cargo test` em `src-tauri`.

### 5.2 `release.yml` (`workflow_dispatch`, input `bump: patch|minor|major`)

**Job `prepare`:**
1. Lê a versão atual de `package.json`.
2. Roda `scripts/bump-version.mjs <bump>` — calcula a nova versão semver e escreve, de forma síncrona, em `package.json`, `src-tauri/Cargo.toml` (`[package].version`) e `src-tauri/tauri.conf.json` (`version`).
3. Commit `chore: bump version to vX.Y.Z`, tag `vX.Y.Z`, push de ambos para `main`.

**Job `build`** (depende de `prepare`, matrix):
| Runner | Alvo |
|---|---|
| `macos-latest` | `universal-apple-darwin` (Intel + Apple Silicon num instalador só) |
| `windows-latest` | `x86_64-pc-windows-msvc` |

Usa `tauri-apps/tauri-action`:
- Compila os instaladores (`.dmg`/`.app` no macOS, `.msi`/`.exe` (NSIS) no Windows).
- Assina os artefatos de update com a chave própria do Tauri (ver §6) via `TAURI_SIGNING_PRIVATE_KEY` / `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` (secrets do repositório).
- Publica (ou atualiza) um GitHub Release na tag `vX.Y.Z`, anexando os instaladores e o `latest.json` gerado automaticamente pela action — esse arquivo é o manifesto que o auto-updater consulta.

Sem assinatura de código de SO nesta fase — a action publica os binários sem `APPLE_CERTIFICATE`/`WINDOWS_CERTIFICATE`, o que é suportado e apenas gera o aviso de segurança já aceito em §2.

## 6. Auto-updater

- Plugins: `tauri-plugin-updater` + `tauri-plugin-process` (para `relaunch()`).
- **Chave de assinatura Ed25519 do Tauri** (não é certificado de SO, sem custo): gerada uma vez localmente com `pnpm tauri signer generate -w ~/.tauri/poiema-presenter.key`. A chave pública vai em `tauri.conf.json` (`plugins.updater.pubkey`); a privada + senha viram secrets do GitHub Actions (`TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`) — nunca commitada.
- **Endpoint:** `https://github.com/guilherme-toti/poiema-presenter/releases/latest/download/latest.json`.
- **Fluxo em runtime** (frontend, `src/control/hooks/useUpdater.ts`):
  1. No boot do Controle e depois a cada N horas (timer, ex.: 6h), chama `check()` do plugin em background — silencioso se não houver update ou se falhar (rede instável não deve incomodar o operador).
  2. Se houver versão nova: toast não-modal no topo ("Nova versão vX.Y.Z disponível") e o download começa automaticamente (`update.downloadAndInstall()`), sem exigir clique — conforme pedido.
  3. Ao concluir download + instalação: segundo toast, "Atualização pronta — reinicie para aplicar", com botão "Reiniciar agora" chamando `relaunch()`. Se o usuário ignorar, a atualização já está aplicada e entra em vigor sozinha no próximo start natural do app.
  4. **Nunca** reinicia sozinho nem interrompe a operação — coerente com RN-07 do `doc-funcional` (erro/aviso nunca é modal, nunca trava o operador).
- Erros de rede/API do updater são engolidos silenciosamente (log apenas) — não há conectividade garantida em toda igreja, e isso não pode virar ruído para quem está operando um culto.

## 7. Testes e verificação desta fase

| Item | Como verificar |
|---|---|
| `pnpm tauri dev` | Abre janela Controle; botão "Abrir Projetor" cria a janela sobre o monitor secundário (testável com monitor externo ou simulando ausência dele → modo ensaio) |
| `pnpm tauri build` (local, macOS) | Gera `.dmg`/`.app` válido, abre e mostra as duas janelas |
| `ci.yml` | Roda em PR de teste, todos os steps passam |
| `release.yml` | Disparado manualmente uma vez neste ciclo para validar: bump de versão nos 3 arquivos, tag criada, Release publicado com instaladores mac + windows + `latest.json` |
| Auto-updater | Validado só depois de haver 2 releases publicados (não dá para testar update na primeira release) — registrar como follow-up manual pós-fundação, não bloqueia a conclusão desta tarefa |

## 8. Fora de escopo (registrado para não virar escopo silencioso)

- Qualquer schema SQLite além do plugin instalado vazio (Fase 2 do doc técnico).
- Qualquer painel funcional (Roteiro, Slides, Ao Vivo) além dos placeholders visuais do grid.
- Assinatura de código de SO (Apple Developer ID / certificado Windows) — decisão registrada em §2, revisitar quando houver orçamento/necessidade.
- Conventional commits / bump automático por push.
- Teste real de ponta a ponta do auto-updater (depende de 2 releases existirem).
