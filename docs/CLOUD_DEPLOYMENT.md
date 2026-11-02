# Netlify + Render + Aiven deployment

## Current production endpoints

- Website: https://mhg-qr-code-generator.netlify.app
- API readiness: https://qr-code-project-api.onrender.com/readyz
- Production branch: `main` in `Mohammed-HG/QR-Code-Project`.

The website proxies API requests to Render. MySQL runs separately on Aiven Free.
Registration requires a configured verification-mail sender; it stays disabled until then.

Create separate projects/services. Do not import these settings into an existing portfolio or other application.
No production service or cloud database is created by committing these files.

## 1. Persistent MySQL

Create an Aiven MySQL service on the **Free** plan (not a paid trial).
Create a dedicated database and user for this application. Keep credentials out of Git and chat.
Download the service CA certificate. Put the full PEM contents in Render's `DB_SSL_CA` secret,
so mysql2 verifies the database server certificate. Never disable certificate verification.
The server applies its migrations on startup. The new database starts empty: local users,
administrator accounts, and site edits are not automatically copied to production.

## 2. Reserve a new Netlify project

Import this GitHub repository as a **new** project, using the root `netlify.toml`.
Use its final HTTPS origin as Render's `APP_ORIGIN` (no trailing slash).
Do not deploy the frontend until `QR_API_ORIGIN` is configured.
Disable deploy previews and branch deploys for production authentication: they have different origins.

## 3. Render backend

Create a new Blueprint from this repository and `render.yaml`. Verify the instance plan is Free.
The Blueprint explicitly follows `main` and automatically deploys every commit.
Set the prompted secrets in the Render dashboard:

| Variable | Value |
| --- | --- |
| APP_ORIGIN | Exact production Netlify HTTPS origin |
| AUTH_SECRET | New random 32-byte value encoded as 64 hex characters |
| DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME | Aiven application's connection settings |
| DB_SSL_CA | Full CA certificate PEM from Aiven |

Generate the secret locally with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.
Paste it directly into Render, never into the repository or chat. Render supplies `PORT`.
Wait for `/readyz` to return HTTP 200 over HTTPS.

## 4. Netlify frontend

Set build environment variable `QR_API_ORIGIN` to the backend's exact
`https://SERVICE.onrender.com` origin, then deploy. The build emits API proxy rules before
the SPA fallback. Frontend requests remain same-origin; do not replace them with cross-site fetches.
The build fails if the backend origin is missing or invalid. Only the backend URL is public;
database and mail credentials belong exclusively in Render runtime secrets.
Connect the new Netlify project to `Mohammed-HG/QR-Code-Project` using its GitHub
integration, set the production branch to `main`, and keep continuous deployment enabled.
A manual drag-and-drop deployment does not establish this Git connection.

## 5. Mail and administrator

Free Render services block SMTP ports 25, 465 and 587. Registration remains unavailable
until a verified sender and supported mail transport are configured. The existing server can
use a provider's TLS-enabled alternate SMTP port if the provider supports one; verify this
before selecting a provider. Configure SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER,
SMTP_PASSWORD and SMTP_FROM as Render secrets. Never bypass OTP verification.
Provision the production administrator separately with `scripts/admin.js` over a verified
TLS database connection; do not ship a default administrator or password.

## Acceptance checks

- HTTPS frontend and `/api/site` work; refresh `/about` and `/login` directly.
- Generate/download all four QR kinds, including Arabic captions and custom icons.
- Verify OTP mail, registration, login, HttpOnly Secure cookie, CSRF, profile, and logout.
- Verify administrator access and that ordinary accounts cannot access administrator APIs.
- Restart the backend and verify accounts/settings persist in Aiven.
- Confirm existing Netlify/Render projects are unaffected and all new services use Free plans.

Free Render instances sleep after inactivity; the first request after sleeping may be slow.
Netlify Free has usage limits shared by the team. Check the existing account's legacy/current
plan before deployment because the portfolio may share its allowance.
