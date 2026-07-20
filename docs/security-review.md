# FlowSync Security Review

## Scope
- Backend API (server/src/routes/*.js)
- Auth middleware (server/src/middleware/auth.js)
- AI Engine (server/src/services/aiEngine.js)
- External API service (server/src/services/amapService.js)
- Database schema (server/db/schema.sql)
- Frontend (flowsync/web/app.html)

---

## Critical Issues

### 1. No rate limiting on login (brute force risk)

- **Endpoint**: POST /api/auth/login
- **Module**: auth
- **Issue**: Unlimited login attempts allow brute force / credential stuffing
- **Impact**: Account compromise
- **Fix**: Track failed attempts per IP + account; lock after 5 fails in 5 min for 15 min

### 2. No rate limiting on AI project generation

- **Endpoint**: POST /api/projects/generate
- **Module**: projects
- **Issue**: Unlimited generation calls can exhaust resources and run up API costs
- **Impact**: Resource exhaustion, API bill explosion
- **Fix**: Rate limit per user (max 10 calls per minute)

### 3. AI generation input has no length limit

- **Endpoint**: POST /api/projects/generate (text field)
- **Module**: AI engine
- **Issue**: text field has no length cap. Very long input (1MB+) causes oversized DB writes, LLM token bloat, memory issues
- **Impact**: Service stability, API costs
- **Fix**: Limit text to 2000 chars

---

## Medium Issues

### 4. Email and username format not validated

- **Endpoint**: POST /api/auth/register
- **Module**: auth
- **Issue**: Only non-empty check. No email regex, no username character restrictions
- **Impact**: Dirty data; potential XSS if rendered unsafely
- **Fix**: Email regex; username = alphanumeric/Chinese/underscore, 3-20 chars

### 5. CORS too permissive for production

- **File**: app.js
- **Module**: global
- **Issue**: Allows localhost origins + credentials: true. In production this is a CSRF risk
- **Impact**: Cross-site request forgery
- **Fix**: Production env restricts to specific domains

### 6. JWT has no revocation mechanism

- **Module**: auth middleware
- **Issue**: Once issued, tokens are valid until expiry. Logout only removes from client; changing password doesn't invalidate old tokens
- **Impact**: Stolen tokens remain usable
- **Fix**: Token blacklist (DB table) or short-lived tokens + refresh tokens

### 7. Project/module/task names lack length limits and XSS checks

- **Endpoints**: POST /api/projects, /api/modules, /api/tasks
- **Module**: CRUD
- **Issue**: No length limits, no sanitization. Frontend may use innerHTML rendering
- **Impact**: Stored XSS
- **Fix**: Enforce max lengths (project name <= 200, task <= 300); use textContent on frontend

### 8. API keys stored in .env file

- **File**: .env
- **Module**: config
- **Issue**: Amap and LLM API keys in .env. If committed to git or misconfigured, keys leak
- **Impact**: Third-party API abuse, financial cost
- **Fix**: .env in .gitignore; use env vars in production; set IP whitelist and quota on API consoles

---

## Low Issues

### 9. Error messages may leak internals

- **File**: app.js error handler
- **Module**: global
- **Issue**: Raw err.message returned to client. DB errors could leak table structure
- **Impact**: Information disclosure
- **Fix**: Production returns generic "Internal server error"; details logged only

### 10. Password strength too low

- **Module**: auth
- **Issue**: Min 6 chars, no complexity requirement
- **Impact**: Weak passwords easily cracked
- **Fix**: Min 8 chars with mix of letters and numbers (ok for demo, fix for production)

### 11. SQLite concurrency limits

- **Module**: db.js
- **Issue**: node:sqlite is synchronous. WAL helps but high concurrency performance is limited
- **Impact**: Slow response under many concurrent users
- **Fix**: Switch to PostgreSQL for production (schema already compatible)

### 12. Token stored in localStorage

- **Module**: frontend
- **Issue**: localStorage tokens can be stolen via XSS
- **Impact**: Account takeover if XSS exists
- **Fix**: Use httpOnly cookies for production (acceptable for demo)

---

## Priority Summary

| Priority | Count | Must Fix Now |
|----------|-------|--------------|
| Critical | 3 | Rate limits, input length, login throttle |
| Medium | 5 | Email validation, CORS, JWT revoke, XSS, key leak |
| Low | 4 | Error messages, password strength, SQLite, token storage |

## Top 3 to fix immediately

1. AI generation input length limit + rate limit (prevents cost explosion)
2. Login attempt throttling (prevents brute force)
3. .env in .gitignore (prevents key leak in git)
