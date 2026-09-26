# Admin Web Environment Inventory

Source of truth: all `import.meta.env` reads in `src`, `.env.example`, and the
Docker build arguments, inspected on 2026-09-25. Every `VITE_*` value is baked
into the client bundle and therefore must be public-safe.

| Variable | Classification / default | Development | Staging | Production | Purpose | Current status / test |
| --- | --- | --- | --- | --- | --- | --- |
| `VITE_API_BASE_URL` | **PUBLIC SAFE, REQUIRED BUILD-TIME**; no source default | `http://localhost:8080/api` example | exact staging Node API URL ending `/api` | exact production Node API URL ending `/api` | Central admin Axios base URL; application throws immediately when absent. | example only in current tree; admin build previously passed and login screen rendered; staging/prod values missing. |

Do not place admin credentials, JWT secrets, database URLs, SMTP credentials,
Cloudinary secrets, Razorpay secrets, or any other runtime secret in `VITE_*`.
The admin bearer token is issued at runtime and stored only by the application;
it is not a build variable.

## Vercel environment separation

| Environment | Value source | API target |
| --- | --- | --- |
| Local | private `.env.local` | developer-selected API |
| Vercel Preview/staging | Vercel Preview environment | `https://node-api-starrynightsindia-in.vercel.app/api` |
| Vercel Production | Vercel Production environment | approved production API URL only |

The safe templates `.env.example`, `.env.staging.example`, and
`.env.production.example` are tracked. Actual `.env*` values remain ignored.
