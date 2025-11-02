Icon assets are now generated at build time by route handlers in `app/` so no
manual PNG uploads are required. The following endpoints return the branded
variants used by the manifest and metadata:

- `/icon-512x512.png`
- `/icon-192x192.png`
- `/apple-touch-icon.png`

If you need to tweak the artwork, update the shared renderer in
`app/_lib/pwa-icons.tsx`.
