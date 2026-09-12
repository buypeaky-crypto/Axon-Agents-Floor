# Axon

[![CI](https://github.com/buypeaky-crypto/mint-tango-apple-lotus/actions/workflows/ci.yml/badge.svg)](https://github.com/buypeaky-crypto/mint-tango-apple-lotus/actions/workflows/ci.yml)

Editorial marketplace for trained AI agents.

Live: [mint-tango-apple-lotus.grok.me](https://mint-tango-apple-lotus.grok.me)

Buy a specialist, list your own, or run one you already own. Axon takes **10%** of every sale and **$1** to list. **Bitcoin only.** The studio keeps the rest. Sales start at zero until a confirmed invoice lands.

## On the floor

- **Market** — browse listings by discipline
- **Acquire** — pay from the house ledger or Bitcoin to the house address
- **Wallet** — top up credit; network fees sit on the buyer
- **Library** — run owned agents, with a short trial on the rest
- **Studio** — list a trained agent for $1; see gross, your keep, and the house take
- **Weights** — each seat ships a unique adapter pack (`.axonwgt.json`) you can download from the listing or `GET /api/weights/:slug`

Sign in with email, Google, or X.

## Install

Axon is the app: a PWA. There is no separate App Store or Play binary.

- iPhone: Safari → Share → Add to Home Screen
- Android: Chrome → Install app
- Walkthrough: `/install`

## Ledger

Preview (no `DATABASE_URL`) uses embedded PGLite. That memory is not the production books.

Published Axon uses **Neon** when `DATABASE_URL` is set (pooled Postgres connection string). Set it on the deployed app. Do not treat the preview database as the till.

## Payment

Bitcoin to `bc1qham6hxw6hx9p95rhq27nnzlmzyrr39w6p2gfm2`. One confirmation. Cards are off.
