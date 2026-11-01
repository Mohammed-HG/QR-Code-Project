# Customization, bilingual UI and administration

## Visitor settings

Use the header's moon/sun button to switch between light and dark themes. The header menu contains Account, Settings and the usage guide. About is in the footer. Settings offers English/Arabic and a custom page-background color for each theme. Preferences are kept on the current browser; no session token is stored in localStorage.

Arabic switches document language and direction to RTL. The QR payload itself is not translated or changed. Account access combines Sign in and Register as two tabs. Signed-in users get a clickable Welcome + display name entry leading to their editable profile.

## QR styles

Supported module patterns: square, dots, rounded, diamond, soft and vertical. Functional finder/timing/alignment modules stay intact. Foreground and background can each use a two-color gradient, with four directions. Background can be fully transparent in the exported PNG.

A logo can be uploaded as PNG/JPEG/WebP (up to 256 KB and one million pixels), or selected from the built-in raster icons. SVG and remote image URLs are not accepted. Images are decoded, normalized and re-encoded; metadata and original bytes are not stored. The logo is bounded to the centre and enables high error correction.

Every combination still needs testing on the surface where it will be used. Transparent codes are designed for light surfaces. The backend checks contrast at all gradient endpoints and rejects excessive QR density. It never fetches a supplied link or image URL.

The form sends all styling together with the current service's payload. Editing any setting cancels pending work and clears the old preview.

## Profile

Users can edit username, display name, bio, email and password. Saving needs their current password. An email change additionally needs a fresh email-bound OTP proof. Changing a password revokes every existing session and requires signing in again. Role and account status are never editable through the profile endpoint.

## Initial administrator: MHG Admin

No administrator password or default privileged account is shipped. Use the local interactive setup command after configuring the database:

~~~sh
cd "Nodejs Server"
node scripts/admin.js --username "MHG Admin" --create
~~~

For the running local Docker deployment, from the repository root:

~~~sh
docker compose -p qr-code-project -f compose.lan.local.yml exec backend node scripts/admin.js --username "MHG Admin" --create
~~~

Type a NEW password twice at the hidden prompts. The command does not accept passwords in arguments, piped input, source or environment variables. The username is case-insensitive, so MHG Admin and mhg admin identify the same account. If this is an existing non-admin user, use --promote explicitly. Rerunning for an existing administrator resets its password and invalidates old sessions.

The initial local admin has a reserved localhost.invalid address; change it to your real email in Profile with OTP verification after SMTP is configured. Registration is not required to bootstrap this local administrator.

## Administrator dashboard

Open /admin after signing in as an administrator.

- Accounts: searchable/paged account metadata only; block, unblock and delete ordinary users. Passwords, password hashes and session tokens are never returned.
- Blocking revokes sessions immediately. Deleting requires the exact target username plus the administrator's current password. Administrator accounts cannot be blocked or deleted through the dashboard.
- Site editor: edit English and Arabic welcome text, headings, descriptions, steps, benefits, About and footer. Drag sections into order or use keyboard-accessible up/down controls, and show/hide optional sections.
- Design: live preview of default theme, background/accent colors, page width, spacing, corner radius, heading size and card padding.
- Feature controls: registration, logos, gradients, transparency and location codes. These are enforced in the API as well as hidden in the UI.
- Audit: account moderation and site-setting changes are recorded. Edits use revision checks to prevent overwriting another administrator's changes.

The editor accepts validated text and bounded style settings. It does not execute HTML, JavaScript, arbitrary CSS or SQL. The generator section cannot be removed. Settings live in MySQL and survive container rebuilds.

## Migration and testing

Startup adds profile/role/status columns to users, creates site_settings and admin_audit, and seeds bilingual defaults only when no settings exist. Existing account passwords and data are not reset. Back up the database before upgrading.

Run npm test in both application directories. Backend tests decode all six patterns with gradients and logos, check real transparency, reject malicious/oversized logos, and test administration, profile authentication, proof handling and session revocation. The MySQL integration suite exercises these transactions on the actual SQL implementation. Frontend tests cover preferences, RTL, styling payloads, profile edits and editor publish/reorder behavior.
