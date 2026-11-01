# Security and correctness remediation

Reviewed baseline: 2794736f5b03519e8037d466160185586d447b90. Implementation date: 2026-11-01.

## Changes mapped to the audit

| Findings | Resolution |
|---|---|
| S01–S02 | Removed tracked .env files and all hard-coded authentication/database secrets. Added new-secret generation and deployment rotation instructions. Replaced bearer JWTs with opaque server-side sessions. |
| S03–S05 | Registration requires a verified, email-bound, expiring, single-use proof consumed transactionally. OTPs are HMAC-protected in MySQL with expiry, cooldown and attempt limits. Authenticated TLS SMTP delivery replaces console logging. Missing SMTP fails closed. |
| S06 | Central typed validation, bounded passwords/strings/numbers, unique database constraints, prepared execute calls, safe async error handling and JSON errors. |
| S07 | IP and login-identity rate limits, request-body limits, bounded QR dimensions/density, contrast checks and a concurrency cap. |
| S08–S09 | HttpOnly session cookies; Secure and __Host- in production; logout revocation; CSRF protection; exact-origin checks; Helmet and Nginx browser security headers. |
| S10 | Removed unused dependencies and the CRA toolchain, updated direct/transitive packages, locked clean dependency trees and added CI audits. |
| F01–F04 | Relative same-origin API calls; centralized authentication; user lookup through scalar user IDs; valid navigation and a not-found page. |
| F05–F08 | Correct WPA/WEP/nopass payloads, escaping, validated coordinates, one service-aware customization request; unsupported shape controls removed. |
| F09–F13 | Explicit generation, cancellation and request sequencing; reactive loading/completeness; clearing stale previews; centralized downloads; Blob cleanup; free URL editing with validation on generation. |
| D01–D09 | Responsive grids with min-width:0, independent header/service navigation, visible active states, shared auth layout, inline accessible feedback, labels/keyboard buttons, strong contrast and no unbounded animations or invalid global CSS. |
| O01–O05 | Docker service DNS, dedicated DB user, readiness/retries/pooling, idempotent migrations/constraints, named DB volume, isolated DB network, private host binding, clean build contexts, non-root backend and reproducible npm ci. |
| O06–O09 | Removed dependencies/builds/uploads from the tracked tree, repaired tests and CI, documented deployment/backup/security steps, removed unsupported feature claims and configured Nginx history fallback. |

## Validation

- Backend security tests include real PNG decoding for all four services, OTP expiry/attempt limits/proof replay, cookie/session/CSRF behavior, origin and rate limits, malformed input, bounded rendering and SQL transaction attempt accounting.
- Frontend tests cover URL typing, service-aware payloads, stale response cancellation, Blob cleanup, login/logout, registration proofs, fallback routes and stale account lookup protection.
- Local production frontend build and Compose configuration validation pass.
- npm audit reports zero known vulnerabilities in both complete dependency trees at the time of remediation. This is a point-in-time dependency check, not a claim that future vulnerabilities cannot exist.
- Browser checks at widths 360, 390, 768 and 1280 show no fields/panels outside the viewport. Link, Wi-Fi and location QR generation were exercised in the local browser.
- CI additionally exercises real MySQL migrations/auth transactions and builds/starts the full Compose stack with proxy/security-header/QR smoke checks. See the workflow results for the pushed commit.

## Required deployment follow-up

The old database credentials must be rotated in the actual database and any reused accounts. The repository change cannot invalidate credentials outside GitHub. Existing Git history still contains the old publication; coordinate history cleanup only after rotation. No force push is performed.

Provide real SMTP configuration to enable registration. No real messages are sent by automated tests. Public QR generation and existing-account login remain available without SMTP.

Use an HTTPS edge and production environment settings before serving real users. Keep the bundled backend to one replica until its rate-limit counters are moved to a shared store. Review legacy data/schema compatibility and test backup restoration before migration. New feature development (saved codes, uploads, localization) is outside this remediation.
