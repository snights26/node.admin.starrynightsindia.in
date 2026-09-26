# Admin frontend Vercel staging setup

This project is a Vite single-page application. Vercel builds it with
`npm run build` and serves the generated `dist` directory. The committed
`vercel.json` rewrites application routes to `index.html`, so browser refreshes
on protected client-side routes continue to work.

## Preview / staging

Set this Vercel Preview environment variable:

```text
VITE_API_BASE_URL=https://node-api-starrynightsindia-in.vercel.app/api
```

It is embedded into the browser bundle at build time. It must therefore be the
staging API for every staging deployment; no automatic fallback to a production
API exists.

## Production

Set `VITE_API_BASE_URL` separately in Vercel's Production environment to the
approved production API URL ending in `/api`. Do not copy Preview environment
variables into Production.

## Client configuration safety

Values prefixed `VITE_` are public to browser users. Do not place credentials,
JWT secrets, SMTP credentials, database URLs, payment secrets, or storage
tokens in Vercel frontend environment variables.

The admin login, refresh, logout, and authenticated API requests use the shared
Axios client in `src/Utils/api.jsx`, which reads only `VITE_API_BASE_URL`.
