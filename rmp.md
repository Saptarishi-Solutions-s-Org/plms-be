# withAuth — RBAC Usage Guide

`withAuth` is a JWT-based Role + Permission middleware for CAP/CDS service handlers.  
It supports **15 calling styles** — from simple JWT verification to full multi-role, multi-module, multi-permission guards.

---

## Calling Styles

| # | Scenario | Example |
|---|---|---|
| 1 | Single role | `withAuth(handler, { roles: ["manager"] })` |
| 2 | Multiple roles | `withAuth(handler, { roles: ["manager", "admin"] })` |
| 3 | Single module · single permission | `withAuth(handler, { modules: { lead: ["view"] } })` |
| 4 | Single module · multiple permissions | `withAuth(handler, { modules: { lead: ["view", "create"] } })` |
| 5 | Multiple modules · single permission each | `withAuth(handler, { modules: { lead: ["view"], reports: ["export"] } })` |
| 6 | Multiple modules · multiple permissions each | `withAuth(handler, { modules: { lead: ["view", "create"], reports: ["view", "export"] } })` |
| 7 | Single role + single module + single permission | `withAuth(handler, { roles: ["manager"], modules: { lead: ["view"] } })` |
| 8 | Single role + single module + multiple permissions | `withAuth(handler, { roles: ["manager"], modules: { lead: ["view", "create"] } })` |
| 9 | Single role + multiple modules + single permission each | `withAuth(handler, { roles: ["manager"], modules: { lead: ["view"], reports: ["export"] } })` |
| 10 | Single role + multiple modules + multiple permissions each | `withAuth(handler, { roles: ["manager"], modules: { lead: ["view", "create"], reports: ["view", "export"] } })` |
| 11 | Multiple roles + single module + single permission | `withAuth(handler, { roles: ["manager", "admin"], modules: { lead: ["view"] } })` |
| 12 | Multiple roles + single module + multiple permissions | `withAuth(handler, { roles: ["manager", "admin"], modules: { lead: ["view", "create"] } })` |
| 13 | Multiple roles + multiple modules + single permission each | `withAuth(handler, { roles: ["manager", "admin"], modules: { lead: ["view"], reports: ["export"] } })` |
| 14 | Multiple roles + multiple modules + multiple permissions each | `withAuth(handler, { roles: ["manager", "admin"], modules: { lead: ["view", "create"], reports: ["view", "export"] } })` |
| 15 | Auth-only — JWT verification, no RBAC | `withAuth(handler)` · `withAuth(handler, {})` |

---

## Logic Rules

| Check | Logic | Meaning |
|---|---|---|
| **Role** | `OR` | User must have **at least one** of the required roles |
| **Permissions** | `AND` | User must have **all** required actions for each module |
| **Role + Permissions** | Role first, then permissions | If role check fails, permission check is skipped |
| **Wildcard (`*`)** | Bypass | `"*"` in a module's permissions skips all action checks for that module |
| **Case sensitivity** | Normalized | Roles, modules, and permissions are all lowercased before comparison |
| **Auth-only** | JWT only | No `roles` or `modules` passed — only validates the JWT signature |

---

## Response Codes

| Condition | Code | Message |
|---|---|---|
| Missing Authorization header | `401` | `Unauthorized: missing Authorization header` |
| Malformed Authorization header | `401` | `Unauthorized: malformed Authorization header` |
| Invalid or expired JWT | `401` | `Unauthorized: invalid or expired token` |
| Role check failed | `403` | `Forbidden: insufficient role` |
| Permission check failed | `403` | `Forbidden: insufficient permissions` |
| All checks passed | `200` | Handler executes normally |

---

## Example

```ts
// Case 14 — Multiple roles + multiple modules + multiple permissions
service.on(
  "leadexport",
  withAuth(handler, {
    roles:   ["manager", "admin"],
    modules: {
      lead:    ["view", "export"],
      reports: ["view", "export"],
    },
  })
);
```