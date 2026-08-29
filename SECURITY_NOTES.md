# Security Notes — 2026-08-29

Hardening changes applied to the admin panel backend (7esen). Goal: fix known
security issues while keeping full backward compatibility with the published
Flutter app and existing integrations.

## What Changed

### 1. Login (`src/app/api/auth/login/route.ts`)
- Removed the hardcoded `'admin'` / `'admin123'` fallback. If `ADMIN_USERNAME`
  / `ADMIN_PASSWORD` / `ADMIN_JWT_SECRET` are missing, login **always returns 401**.
- Brute-force protection: in-memory Map keyed by IP (`x-forwarded-for`, else
  `unknown`). Max **5 failed attempts per 15 minutes** → `429` with a JSON error.
  Successful login clears the counter.
  - ⚠️ On Vercel serverless this Map is **per lambda instance** and resets on
    cold start / new instance — it is a soft rate limit, not a global one.
- Cookie `admin_logged_in` is no longer the literal `'true'`; it is now a
  **signed token**: `v1.<hex hmac-sha256(username, ADMIN_JWT_SECRET)>`.
  Still `httpOnly`, `sameSite=lax`, `path=/`, `maxAge=30 days`; `secure` is now
  `true` (Vercel serves HTTPS).

### 2. Middleware (`src/middleware.ts`)
- Page protection accepts **either** the legacy `'true'` cookie (temporary
  backward compatibility) **or** the new `v1.<hmac>` format. HMAC validation
  uses Web Crypto (`crypto.subtle`) since Node crypto is unavailable in the
  Edge runtime. If `ADMIN_JWT_SECRET`/`ADMIN_USERNAME` are missing, only
  `'true'` is accepted (legacy behavior).
- `/api/admin/*` is now protected by the middleware: a valid admin cookie
  **or** an `x-admin-secret` header equal to `ADMIN_API_SECRET` is required
  (401 JSON otherwise). The routes' own body-secret check still runs as before
  (dual auth: middleware gate + route gate).

### 3. User status (`src/app/api/mobile/user-status/route.ts`)
- Now **requires** `Authorization: Bearer <firebaseIdToken>` (verified via
  `auth.verifyIdToken`) and only returns data when the verified uid equals the
  requested `?uid=` (401 / 403 otherwise). Previously it leaked user emails by
  uid with no auth. Response shape unchanged for authorized calls.

### 4. Register (`src/app/api/mobile/register/route.ts`)
- Requires a valid Firebase ID token; body `uid` must equal the verified uid.
  Response shape unchanged (`{ success: true }`). The Flutter app already has
  the user's token at register time (`auth_service.dart`), so it is compatible.

### 5. Admin API routes (matches / news / goals / highlights / delete)
- Secret is now `process.env.ADMIN_API_SECRET || '7esen'` — rotatable via env;
  `'7esen'` kept as fallback so existing integrations keep working.

### 6. Mobile debug backdoor (channels / matches)
- `?secret=` is now compared against `process.env.MOBILE_DEBUG_SECRET || '7esen'`
  instead of the hardcoded literal. Same behavior; now rotatable.

## New Environment Variables

| Variable             | Purpose                                                     | Current value (.env.local / Vercel) |
|----------------------|-------------------------------------------------------------|-------------------------------------|
| `ADMIN_JWT_SECRET`   | Key for the signed admin cookie (existed before, now used)  | already set in `.env.local`         |
| `ADMIN_API_SECRET`   | Admin API body secret + `x-admin-secret` middleware header  | `7esen` (unchanged behavior)        |
| `MOBILE_DEBUG_SECRET`| `?secret=` premium bypass on channels/matches               | `7esen` (unchanged behavior)        |

**Add `ADMIN_API_SECRET` and `MOBILE_DEBUG_SECRET` to the Vercel project
environment variables too** (they are only in `.env.local` locally).

## How to Rotate Secrets

1. Generate a new random value, e.g. `openssl rand -hex 32`.
2. Set it in Vercel (Project → Settings → Environment Variables) and locally in
   `.env.local`, then redeploy.
3. Rotate independently:
   - `ADMIN_API_SECRET` → all external integrations using the admin API must
     send the new secret in the JSON body **and** as an `x-admin-secret` header
     (the middleware requires the header; the route requires the body secret).
   - `MOBILE_DEBUG_SECRET` → update any debug tooling that passes `?secret=`.
     The Flutter app's premium users are NOT affected (they use Firebase tokens).
   - `ADMIN_JWT_SECRET` → invalidates all signed admin cookies; admins must log
     in again. Legacy `'true'` cookies keep working until you remove that
     backward-compatibility branch in `src/middleware.ts`.
4. Once all sessions/clients are migrated, remove the legacy `'true'` acceptance
   in middleware and set `secure`, then consider removing the `'7esen'` fallbacks.

## Remaining Known Gaps (not fixed here)

- **Paymob callback**: the payment webhook/callback route still needs HMAC
  verification and replay protection (TODO).
- **RLS policies open**: Supabase Row Level Security is not restrictive; the DB
  is currently reached with a service/pooler connection that bypasses RLS.
  Tighten RLS policies in the Supabase dashboard.
- **`channels.logo` column missing**: the mobile channels endpoint selects
  `c.*` and maps `channel.logo`, but the column is absent from the current
  schema — verify/add it or the field will be undefined in responses.
- Brute-force protection is per-instance in memory (see above); move to a
  shared store (e.g. Upstash Redis / Supabase) for a global limit.

## Stream Token System (2026-08-29)

Locks 7esenlink stream URLs (`/api/stream/<category>/<id>`) behind a per-user,
per-device, 24-hour token with single-session enforcement and multi-account
device bans. 7esen (this backend) ISSUES tokens; 7esenlink VALIDATES them —
neither project needs access to the other's database.

### Token format & algorithm

```
token  = b64url(uid) + '.' + b64url(deviceId) + '.' + issuedDay + '.' + hmacHex
hmacHex= HMAC-SHA256(secret = STREAM_TOKEN_SECRET, msg = uid + '.' + deviceId + '.' + issuedDay)
issuedDay = floor(now_ms / 86400000)          # UTC day
```

- **24h rotation**: validation rejects any token whose `issuedDay != today`,
  so every token dies at UTC midnight and the app mints a new one.
- **Integrity**: changing any field invalidates the HMAC (timing-safe compare).
- `uid`/`deviceId` are base64url-encoded (no padding).

### Single-session enforcement (one token = one viewer)

- `stream_tokens` row holds `active_session_id` for the token.
- `POST /api/mobile/stream-ticket` kills all live `stream_sessions` rows for
  the token (`killed=true, killed_reason='NEW_LOGIN'`) before registering the
  new session → last login wins, the previous viewer gets 403.
- `GET /api/internal/session-check?tk=&sid=` (7esenlink → 7esen, header
  `x-internal-secret`) is called on EVERY stream URL request and doubles as
  the heartbeat: `last_heartbeat` is refreshed on each call; if the last
  heartbeat is older than **120s** the session is killed
  (`HEARTBEAT_TIMEOUT`) and validation returns `SESSION_TIMEOUT`.
- ⚠️ App contract: while playing, the app must re-request the stream URL
  (or re-resolve it) at least every ~60s, otherwise the session times out
  after 2 minutes of playback.

### Device binding + multi-account ban

- `users` gains `active_device_id`, `device_changed_at`, `banned`, `ban_reason`.
  The first stream ticket binds the account to its device; afterwards a
  different device is rejected with `DEVICE_MISMATCH` unless the last change
  is older than **7 days** (one device change per week), which re-binds.
- `devices` registry: `device_id → {account_count, uids[]}`. A second account
  on the same device sets `banned=true, ban_reason='MULTI_ACCOUNTS_SAME_DEVICE'`
  on **all** accounts of that device (current one included) and returns
  `MULTI_ACCOUNTS_BANNED`. Unban is manual (DB/admin) only.
- Banned / unsubscribed accounts get `ACCOUNT_BANNED` / `SUBSCRIPTION_REQUIRED`
  before any token is minted.

### Environment variables

| Variable (7esen)          | Purpose                                                    |
|---------------------------|------------------------------------------------------------|
| `STREAM_TOKEN_SECRET`     | HMAC key for minting tokens (missing → endpoint returns `TOKEN_SYSTEM_DISABLED`, tokens never minted) |
| `INTERNAL_SESSION_SECRET` | Shared secret for the internal session-check endpoint (missing → endpoint 404s, stays closed) |

Companion variables on the 7esenlink side: `STREAM_TOKEN_SECRET` (same value),
`INTERNAL_SESSION_SECRET` (same value), `INTERNAL_CHECK_BASE` (base URL of
this backend, e.g. `https://<7esen-vercel-domain>`).

**Rollout**: 7esenlink ignores the token gate until its `STREAM_TOKEN_SECRET`
is set — links stay open with zero regression. Setting it (plus the two
companions) locks the links instantly; old app versions without ticket
support will get `403 TOKEN-MISSING` until they update. Rotate by changing
`STREAM_TOKEN_SECRET` in both projects (invalidates all tokens immediately).

### Error contract (app maps these to Arabic messages)

- From `/api/mobile/stream-ticket`: `ACCOUNT_BANNED` (+`reason`),
  `DEVICE_MISMATCH`, `MULTI_ACCOUNTS_BANNED`, `SUBSCRIPTION_REQUIRED`,
  `TOKEN_SYSTEM_DISABLED`, 401 invalid Firebase token.
- From 7esenlink stream URLs: HTTP 403 with body `TOKEN-<REASON>` where
  REASON ∈ `MISSING`, `MALFORMED`, `BAD-SIGNATURE`, `EXPIRED`,
  `SESSION-KILLED`, `SESSION-TIMEOUT`, `SESSION-MISMATCH`, `SESSION-INVALID`.
