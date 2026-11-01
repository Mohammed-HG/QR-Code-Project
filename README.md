# QR Code Project

A responsive QR generator for links, text, Wi-Fi networks and locations, with PNG downloads and email-verified accounts. Colors and size apply to the selected content. No uploaded images or saved-code library are advertised or implemented.

## Security upgrade — deployment action required

The previous repository published database credentials and used a public JWT signing key. **Treat all previously published credentials as compromised.** Removing files in this commit does not remove old Git history or revoke a live database password.

Before production use:

1. Back up the existing database. Rotate its old root/application passwords and any reused credentials through your database administrator. Create the limited application user below. Do not reuse the old values.
2. Generate a fresh AUTH_SECRET and replace old runtime environment files. Old JWTs are no longer accepted; users must sign in again.
3. Review the database migration on a copy of existing data. Duplicate usernames/emails or incompatible legacy column definitions stop migration. Resolve these deliberately; the migration never deletes accounts.
4. Configure authenticated SMTP with TLS. Registration fails with an explicit 503 until configured; OTP codes are never returned in API responses or logged.
5. Use HTTPS, NODE_ENV=production and an exact HTTPS APP_ORIGIN. Put the public site behind a trusted TLS reverse proxy. The bundled Compose port binds only to 127.0.0.1. Set HSTS at the HTTPS edge after validating the deployment.
6. Coordinate any Git-history cleanup with collaborators after credential rotation. This commit removes secrets and uploaded/build/dependency files from the current tree; it intentionally does not force-rewrite history.

## Requirements

Node.js 24.15 or newer (supported Node 24 release), npm, MySQL 8.4, and an SMTP account for email verification. Docker Compose is optional.

## Local Docker setup

Run from the repository root:

~~~sh
node scripts/setup-env.mjs
# Edit .env to configure SMTP. This file is ignored by Git.
docker compose up --build -d
~~~

Open http://localhost:3000. Generated secrets stay in .env; the setup script refuses to overwrite an existing file. The Compose defaults are **local development only**. For production, set NODE_ENV=production and APP_ORIGIN=https://your-domain.example and configure the HTTPS edge. Production cookies use __Host-, Secure, HttpOnly and SameSite=Lax.

MySQL and the backend have no published ports. Database data is in the mysql_data named volume. Do not use docker compose down -v unless you intend to delete that local database.

The application waits for MySQL, applies idempotent schema setup, checks readiness and cleans expired sessions/challenges. Missing SMTP does not prevent public QR generation or existing-account login.

## Local development without Docker

Create a database and a dedicated user with CREATE, ALTER, INDEX, SELECT, INSERT, UPDATE and DELETE on that database only. Example administrative SQL, using your own new password:

~~~sql
CREATE DATABASE qrcode_project CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'qr_app'@'localhost' IDENTIFIED BY '<new-random-password>';
GRANT CREATE, ALTER, INDEX, SELECT, INSERT, UPDATE, DELETE ON qrcode_project.* TO 'qr_app'@'localhost';
~~~

Copy Nodejs Server/.env.example to Nodejs Server/.env and set database, SMTP and AUTH_SECRET values. Generate the latter with:

~~~sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
~~~

In Nodejs Server:

~~~sh
npm ci --ignore-scripts
npm run migrate
npm start
~~~

In Reactjs Ui:

~~~sh
npm ci --ignore-scripts
npm start
~~~

Open http://localhost:5173 and set backend APP_ORIGIN=http://localhost:5173 for this development mode. Vite proxies relative /api and /qr requests to 127.0.0.1:3200. No private IP address, browser localhost backend URL, or secret is embedded in the built frontend.

## Authentication and request limits

- Opaque random session tokens are stored only in HttpOnly cookies; the database holds SHA-256 hashes. JWT bearer tokens and browser localStorage authentication are removed.
- Email codes are HMAC-protected, expire after five minutes, allow five attempts and can be resent no faster than once per minute. Verification issues a one-use five-minute registration proof bound to the same email. Registration consumes it inside a transaction.
- Passwords are bcrypt-hashed with cost 12. New passwords require 12 characters and at most 72 UTF-8 bytes. Usernames contain 3–32 letters, digits or underscores.
- Sessions expire after eight hours. Logout requires the session's CSRF token and revokes the server-side session. Unsafe cross-origin requests are rejected.
- Login has IP and username limits; OTP, registration and QR endpoints also have limits. These HTTP counters use a bounded-time in-process store. Run one backend replica; multiple replicas require a shared rate-limit store before scaling. OTP attempts and cooldowns remain persistent in MySQL.
- QR input, colors, coordinates, Wi-Fi type, contrast and dimensions are validated. Images have a quiet zone and a density check. No input URLs are fetched by the backend.
- Reverse proxies must be explicitly trusted. TRUST_PROXY_HOPS=0 for direct development and 1 for the isolated bundled Nginx proxy. Do not expose the backend directly with that proxy setting. The proxy overwrites forwarded client-IP headers.

SMTP uses SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD and SMTP_FROM. Use SMTP_SECURE=true on port 465 for implicit TLS; otherwise STARTTLS is required. Certificate validation is enabled. Do not put SMTP passwords in source files or frontend variables.

## API

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/send-otp | contact=email, type=email; returns challengeId and cooldown |
| POST | /api/verify-otp | challengeId, contact, otp; returns verificationToken |
| POST | /api/register | username, email, password, verificationToken |
| POST | /api/login | username, password; sets session cookie and returns user + csrfToken |
| GET | /api/users/me | user + csrfToken for the current session |
| POST | /api/logout | requires session cookie and X-CSRF-Token |
| POST | /qr/generate-qr | kind=url/text/wifi/location plus service fields and colors/size |
| GET | /healthz, /readyz | liveness and database readiness |

QR: text/URL uses text; Wi-Fi uses ssid/password/encryption; location uses numeric latitude/longitude. Shared options are dotColor, bgColor and integer size (256–1024). Unsupported dot shapes are rejected. Legacy QR endpoint aliases accept these same validated fields. All successful QR responses are image/png; errors are JSON with error.

## Validation

In each application directory:

~~~sh
npm ci --ignore-scripts
npm test
npm audit --audit-level=low
~~~

In Reactjs Ui also run npm run build.

Backend tests verify authentication, OTP attempts/expiry/proof replay, password hashing, server-side session revocation, CSRF, origins, malformed input, rate/concurrency limits and actual PNG decoding for every QR service. Frontend tests cover normal URL editing, service payloads, stale-request cancellation, Blob URL cleanup, registration proof flow, login/logout and unknown routes.

CI also runs integration/mysql.test.js against a disposable MySQL 8.4 database. For manual integration tests set DB_NAME=qr_test (or qr_test_suffix) and dedicated DB_* credentials, then run node --test integration/mysql.test.js from Nodejs Server. The test refuses arbitrary database names.

Nginx serves history fallback for frontend routes, returns 404 for missing assets, proxies only API/QR endpoints, and sets CSP and other browser security headers. Verify the full Compose/HTTPS/SMTP deployment before releasing to users.

## Backup and restore

Use your secret manager or a MySQL option file for backup credentials, not command-line passwords. Take consistent mysqldump --single-transaction backups, encrypt them, keep retention outside the application volume and regularly restore into a separate database. Before upgrades, test the migration on a restored backup. Recreating containers preserves the named volume; deleting the volume does not.

## Dependency policy

Both lockfiles are committed. Install with npm ci without force or legacy-peer-deps. Unused animation, upload, styling and duplicate QR libraries and the old Create React App toolchain were removed. Audit both production and development dependency trees after changes and rebuild containers to obtain patched runtime images.
