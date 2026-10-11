# Enable Gemini incident analysis locally

1. Copy `api/.env.local.example` to `api/.env.local` if the local file does not
   already exist. If it does, preserve its database settings.
2. Set `GEMINI_API_KEY` in `api/.env.local` using the key from Google AI Studio.
3. Reload the incident report page and try Analyze again.

The endpoint uses Gemini's `gemini-3.8-flash` model through `generateContent`,
with `gemini-3.5-flash-lite`, `gemini-3.5-flash`, `gemini-3.7-flash`,
`gemini-3.6-flash`, and `gemini-flash-lite-latest` as fallbacks if a model is
temporarily unavailable.
The PHP endpoint reads this ignored local file, or `GEMINI_API_KEY` from the
server environment. The key must stay on the PHP server; do not put it in a
`VITE_*` variable or frontend code. `.env.local` is excluded from Git.
