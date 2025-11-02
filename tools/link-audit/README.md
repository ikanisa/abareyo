# Link Audit

Headless link checker that compares the static sitemap with live responses.

```bash
node tools/link-audit/index.mjs --base-url=http://localhost:3000
```

Environment variables:

- `LINK_AUDIT_BASE_URL` – target origin (defaults to `http://localhost:3000`).
- `LINK_AUDIT_CONCURRENCY` – number of concurrent fetches (defaults to 6, max 16).
