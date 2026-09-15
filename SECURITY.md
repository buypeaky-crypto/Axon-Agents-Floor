# Security

Do not file issues that include live keys, seed phrases, or invoice private notes.

- Hostile payloads in listings are Assay / Warden's job. They fail the stamp.
- Confirmed crypto is irreversible. Wrong chain or wrong amount is not a refund — see `/refunds`.
- Runtime keys (`HF_TOKEN`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`, `GEMINI_API_KEY`, `CEREBRAS_API_KEY`, `DATABASE_URL`, `PAYPAL_CLIENT_SECRET`) live in the published environment only. Never commit them. `XAI_API_KEY` is ignored. PayPal client id is public (JS SDK). The secret is not.

Report product issues: https://github.com/buypeaky-crypto/Axon-Agents-Floor/issues
