# Axon

[![CI](https://github.com/buypeaky-crypto/Axon-Agents-Floor/actions/workflows/ci.yml/badge.svg)](https://github.com/buypeaky-crypto/Axon-Agents-Floor/actions/workflows/ci.yml)

A marketplace for **trained AI agent seats**. Browse a listing, read the dossier, pay in crypto, run the specialist.

Live preview: [mint-tango-apple-lotus.grok.me](https://mint-tango-apple-lotus.grok.me)

## What you buy

A **seat** is:

1. Three trial turns of that specialist.
2. Paid runtime in your library after Bitcoin, Ethereum, or Solana confirms.
3. The adapter pack (`.axonwgt.json`) — eval card, sample turn, weights id. Not a fine-tuned model dump, not the upstream GitHub repo, not a hosted bot on another platform.

Axon takes **10%** of every sale and **$1** to list. Nothing lists under **$19**. Network fees sit on the buyer. Sales stay at zero until a confirmed invoice lands.

## Public store

- **Market** `/` — search and filter by discipline. Cards link to one page per agent.
- **Listing** `/agents/:slug` — what it does, sample output, what you receive, who trained it, limits, then pay.
- **List** `/studio/new` — write a complete dossier. Assay refuses truncated copy, hostile payloads, and prices under $19.
- **Pay** — exact-amount BTC / ETH / SOL invoice to the house addresses. Cards are off.
- **Legal** — [Terms](https://mint-tango-apple-lotus.grok.me/terms), [Privacy](https://mint-tango-apple-lotus.grok.me/privacy), [Refunds](https://mint-tango-apple-lotus.grok.me/refunds), [Seller rules](https://mint-tango-apple-lotus.grok.me/rules), [Contact](https://mint-tango-apple-lotus.grok.me/contact).
- **Fees** — `/fees` and `GET /api/fee-policy`.

Sign in with email, Google, or X.

## Install

Axon is a PWA. There is no App Store or Play binary.

- iPhone: Safari → Share → Add to Home Screen
- Android: Chrome → Install app
- Walkthrough: `/install`

## Run locally

```bash
npm ci
npm run dev
```

`npm run typecheck` and `npm run test:ci` are the CI gate.

Published Axon uses **Neon** when `DATABASE_URL` is set. Preview without it uses embedded PGLite — that memory is not the production till.

Floor runs try Groq, OpenRouter, Gemini, or `OPENAI_COMPAT_BASE_URL` before xAI. Bind one of those keys if the house xAI quota is spent. Keyless data APIs (weather, FX, definitions) still answer through Conduit.

## House wallets

Exact invoice amounts. Do not send a different quantity.

- BTC `bc1qham6hxw6hx9p95rhq27nnzlmzyrr39w6p2gfm2`
- ETH `0x438E7Be244e46D414f097B211cC4fa7549fB3C3b`
- SOL `G2dYPPTMorSSoUb68fKYbX55pARzrT1FcoRfjgYQFy9V`

## License

MIT. House listings are editorial distillations; upstream projects keep their own licenses and names.
