# Security

Do not file issues that include live keys, seed phrases, or invoice private notes.

- Hostile payloads in listings are Assay / Warden's job. They fail the stamp.
- Confirmed crypto is irreversible. Wrong chain or wrong amount is not a refund — see `/refunds`.
- Runtime keys (`XAI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`, `GEMINI_API_KEY`, `DATABASE_URL`) live in the published environment only. Never commit them.

Report product issues: https://github.com/buypeaky-crypto/Axon-Agents-Floor/issues
