# Enable Gemini incident analysis locally

1. In this folder, copy `.env.example` to `.env.local`.
2. Replace `your_gemini_api_key_here` with the key from Google AI Studio.
3. Reload the incident report page and try Analyze again.

The PHP endpoint reads this ignored local file, or `GEMINI_API_KEY` from the
server environment. The key must stay on the PHP server; do not put it in a
`VITE_*` variable or frontend code. `.env.local` is excluded from Git.
