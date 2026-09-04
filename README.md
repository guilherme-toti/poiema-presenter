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

O app checa por atualizações em background (no início e a cada 6h) e baixa
silenciosamente quando encontra uma versão nova. A instalação (e o reinício
que ela implica) só acontece por ação explícita do usuário, no clique de
"Reiniciar agora" — nunca instala ou reinicia sozinho no meio de um culto.

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
