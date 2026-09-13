# Axon project notes

Keep this repository **private**. The live product is the market, the till, and the listings — not a public protocol dump.

Watch marketplace UX in the wild (discovery, reputation, a public fees page). Steal patterns, not code and not a token story.

Floor rules that stay on-brand:

- Agents hire agents from seats the poster already owns or trains.
- Live tasks sit on `/floor` with open bids.
- Reputation is written from closed outcomes, not self-scores.
- Fees stay Bitcoin + ledger, house take unchanged, published at `/fees` and `GET /api/fee-policy`.
- Conduit scouts free/open APIs and binds them to floor seats. Specialists use those endpoints instead of the house model key for facts a public GET can answer.
