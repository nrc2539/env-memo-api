# EnvMemo API Document

Base URL: `http://localhost:8080/api`

---

## Auth

### Register

```http
POST /auth/register
```

| Field | Type | Required |
|-------|------|----------|
| email | string | yes |
| name | string | yes |
| password | string | yes (min 6 chars) |

Response `201`
```json
{ "message": "User registered successfully" }
```

### Login

```http
POST /auth/login
```

| Field | Type | Required |
|-------|------|----------|
| email | string | yes |
| password | string | yes |

Response `200`
```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<jwt>"
}
```

### Refresh Token

```http
POST /auth/refresh
```

| Field | Type | Required |
|-------|------|----------|
| refreshToken | string | yes |

Response `200` — same as login.

### Forgot Password

Sends a password-reset email (or logs to console if SMTP unconfigured).

```http
POST /auth/forgot-password
```

| Field | Type | Required |
|-------|------|----------|
| email | string | yes |

Response `201`
```json
{ "message": "If that email exists, a reset link has been sent" }
```

### Reset Password

```http
POST /auth/reset-password
```

| Field | Type | Required |
|-------|------|----------|
| token | string | yes |
| password | string | yes (min 6 chars) |

Response `201`
```json
{ "message": "Password has been reset successfully" }
```

### Setup Password

Used by invited users. Auto-accepts their pending invitation.

```http
POST /auth/setup-password
```

| Field | Type | Required |
|-------|------|----------|
| token | string | yes |
| name | string | yes |
| password | string | yes (min 6 chars) |

Response `201`
```json
{ "message": "Password set successfully" }
```

### Verify Token

```http
POST /auth/verify-token
```

| Field | Type | Required |
|-------|------|----------|
| token | string | yes |
| type | "reset" \| "setup" | no (tries both if omitted) |

Response `200`
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "John",
  "tokenType": "reset"
}
```

### Change Password

Requires JWT.

```http
POST /auth/change-password
Authorization: Bearer <access-token>
```

| Field | Type | Required |
|-------|------|----------|
| currentPassword | string | yes (min 6 chars) |
| newPassword | string | yes (min 6 chars) |

Response `201`
```json
{ "message": "Password changed successfully" }
```

### Get Profile

```http
GET /auth/profile
Authorization: Bearer <access-token>
```

Response `200` — JWT payload with `id`, `email`, `name`, `iat`, `exp`.

### Update Profile

```http
PATCH /auth/profile
Authorization: Bearer <access-token>
```

| Field | Type | Required |
|-------|------|----------|
| name | string | yes (non-empty) |

Response `200`
```json
{ "message": "Profile updated successfully" }
```

---

## Projects

All project endpoints require a JWT in the `Authorization` header.

### Create Project

```http
POST /projects
```

| Field | Type | Required |
|-------|------|----------|
| name | string | yes |
| description | string | no |

Response `201` — the created project.

### List Projects

```http
GET /projects
```

Query params:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | int | 1 | Page number |
| limitPerPage | int | 10 | Items per page |
| all | bool | false | Return all without pagination |
| search | string | — | Filter by project name (case-insensitive) |

Response `200`
```json
{
  "data": [
    {
      "id": 1,
      "name": "...",
      "description": "...",
      "createdAt": "...",
      "updatedAt": "...",
      "deletedAt": null,
      "role": "OWNER"
    }
  ],
  "meta": {
    "page": 1,
    "limitPerPage": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### Get Project

```http
GET /projects/:id
```

Roles: VIEWER, EDITOR, OWNER

Response `200` — project with `members` array and requester's `role`.

### Update Project

```http
PATCH /projects/:id
```

Roles: OWNER

| Field | Type | Required |
|-------|------|----------|
| name | string | no |
| description | string | no |

### Delete Project (soft)

```http
DELETE /projects/:id
```

Roles: OWNER

Response `200`
```json
{ "message": "Project deleted successfully" }
```

### List Members

```http
GET /projects/:id/members
```

Roles: VIEWER, EDITOR, OWNER

Query params: standard `page`, `limitPerPage`, `all`

Response `200` — paginated members with `user.id`, `user.email`, `user.name`, `role`.

### Remove Member

```http
DELETE /projects/:id/members/:userId
```

Roles: OWNER

Response `200`
```json
{ "message": "Member removed successfully" }
```

### Invite Member

```http
POST /projects/:id/invitations
```

Roles: OWNER

| Field | Type | Required |
|-------|------|----------|
| email | string | yes |
| role | enum | yes (`OWNER`, `EDITOR`, `VIEWER`) |

- If user exists → added directly.
- If new → user created with `setupPasswordToken`, invitation email sent.

Response `201`
```json
{ "message": "Invitation sent successfully" }
```
or
```json
{ "message": "User added to project successfully" }
```

### List Invitations

```http
GET /projects/:id/invitations
```

Roles: OWNER

Query params:

| Param | Type | Description |
|-------|------|-------------|
| status | enum | `PENDING` or `ACCEPTED` — omit for all |
| page | int | Page number |
| limitPerPage | int | Items per page |
| all | bool | Return all without pagination |

Response `200` — paginated invitations with `invitedBy` and `invitedUser`.

---

## Environment Groups

All endpoints require JWT.

### Create Env Group

```http
POST /projects/:projectId/env-groups
```

Roles: OWNER

| Field | Type | Required |
|-------|------|----------|
| name | string | yes |

### List Env Groups

```http
GET /projects/:projectId/env-groups
```

Roles: VIEWER, EDITOR, OWNER

Query params: standard `page`, `limitPerPage`, `all`

Response `200` — paginated groups with variables included.

### Get Env Group

```http
GET /projects/:projectId/env-groups/:id
```

Roles: VIEWER, EDITOR, OWNER

Response `200` — group with variables.

### Update Env Group

```http
PATCH /projects/:projectId/env-groups/:id
```

Roles: OWNER

| Field | Type | Required |
|-------|------|----------|
| name | string | yes |

### Delete Env Group (soft)

```http
DELETE /projects/:projectId/env-groups/:id
```

Roles: OWNER

Response `200`
```json
{ "message": "Environment group deleted successfully" }
```

---

## Environment Variables

All endpoints require JWT.

### Create Variable

```http
POST /projects/:projectId/env-groups/:id/variables
```

Roles: EDITOR, OWNER

| Field | Type | Required |
|-------|------|----------|
| key | string | yes |
| value | string | yes |

### Update Variable

```http
PATCH /projects/:projectId/env-groups/:groupId/variables/:variableId
```

Roles: EDITOR, OWNER

| Field | Type | Required |
|-------|------|----------|
| key | string | yes |
| value | string | yes |

### Delete Variable

```http
DELETE /projects/:projectId/env-groups/:groupId/variables/:variableId
```

Roles: EDITOR, OWNER

Response `200`
```json
{ "message": "Environment variable deleted successfully" }
```

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Validation error, invalid/expired token |
| 401 | Missing/invalid JWT or bad credentials |
| 403 | Insufficient role |
| 404 | Resource not found |
| 409 | Duplicate email, already a member |

Validation error body:
```json
{
  "message": ["field1 must be ...", "field2 must be ..."],
  "error": "Bad Request",
  "statusCode": 400
}
```


