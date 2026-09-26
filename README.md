# Starry Nights administration site (Node target)

This is the migration target for `admin.starrynightsindia.in`. It is a Vite/React single-page application that calls the Node API below `/api`.

## Local development

1. Copy `.env.example` to `.env.local` and point `VITE_API_BASE_URL` to the Node API.
2. Run `npm install` followed by `npm run dev`.

The production image creates a static Vite build and serves it through Nginx with SPA history fallback.

## Vercel API configuration

All browser API calls, including admin login and authenticated requests, use
`VITE_API_BASE_URL` through `src/Utils/api.jsx`.

For a Vercel Preview/staging deployment, set:

```text
VITE_API_BASE_URL=https://node-api-starrynightsindia-in.vercel.app/api
```

Set a separate approved production API URL in Vercel's Production environment.
Do not put secrets in `VITE_` variables. See [VERCEL_STAGING.md](VERCEL_STAGING.md).
