# JumpPlusPlus Architecture & Flow Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Next.js 15 Frontend (localhost:3000)                  │   │
│  │  ├── Landing Page (/)                                  │   │
│  │  ├── Auth Pages (/auth/sign-in, /auth/sign-up)        │   │
│  │  ├── Dashboard (/dashboard) - Protected              │   │
│  │  └── User Management (/dashboard/users) - Admin Only  │   │
│  │                                                        │   │
│  │  Features:                                             │   │
│  │  • useAuth() hook for auth state                       │   │
│  │  • Middleware protection                               │   │
│  │  • API client for calls                                │   │
│  │  • JWT token in localStorage + httpOnly cookie        │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────┬────────────────────────────────────────────┬──────────┘
         │ HTTP/HTTPS                                 │ REST API
         │ Authorization: Bearer <JWT>                │
         │                                             │
         ▼                                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                 Node.js Express API (localhost:4000)             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Routes                                                     │ │
│  │ ├── POST   /api/auth/register      ← Create Account       │ │
│  │ ├── POST   /api/auth/login          ← Sign In             │ │
│  │ ├── GET    /api/auth/me             ← Get Current User    │ │
│  │ ├── POST   /api/auth/logout         ← Sign Out            │ │
│  │ │                                                          │ │
│  │ ├── GET    /api/users               ← List Users (Admin)  │ │
│  │ ├── GET    /api/users/stats         ← Stats (Admin)       │ │
│  │ ├── GET    /api/users/:id           ← Get User            │ │
│  │ ├── PATCH  /api/users/:id           ← Update User (Admin) │ │
│  │ └── DELETE /api/users/:id           ← Delete User (Admin) │ │
│  │                                                            │ │
│  │ Middleware                                                 │ │
│  │ ├── Helmet (Security)                                      │ │
│  │ ├── CORS (Cross-Origin)                                    │ │
│  │ ├── JWT Authentication                                     │ │
│  │ └── Role Validation                                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                          │                                       │
│                          │ Prisma ORM                            │
│                          ▼                                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Database Layer (Prisma Client)                             │ │
│  │ Models:                                                     │ │
│  │ • User (id, email, password, name, role, avatar, etc)     │ │
│  │ • Session (id, userId, token, expiresAt)                  │ │
│  │ • AuditLog (id, userId, action, target, metadata)         │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────┬───────────────────────────────────────────────────────┘
           │ PostgreSQL Protocol
           │
           ▼
┌──────────────────────────────────────────────────────────────────┐
│         PostgreSQL Database (Remote or Local)                    │
│  ├── public.users (User accounts)                                │
│  ├── public.sessions (JWT tokens)                                │
│  └── public.audit_logs (Action history)                          │
└──────────────────────────────────────────────────────────────────┘
```

## Authentication Flow

```
User Visit
   │
   ▼
Is Authenticated?
   │
   ├─ No  → Redirect to /auth/sign-in
   │
   └─ Yes → Display Dashboard
      │
      ├─ Is Admin? → Show User Management
      │
      └─ Not Admin → Show Profile Info
```

## Sign-Up Flow

```
1. User fills form at /auth/sign-up
        │
        ▼
2. Client validates (name, email, password)
        │
        ▼
3. POST /api/auth/register
        │
        ▼
4. Backend validates again (Zod schema)
        │
        ├─ Invalid? → Return 400 error
        │
        └─ Valid?
            ├─ Email exists? → Return 409 conflict
            │
            └─ New user?
                ├─ Hash password (bcryptjs)
                │
                ├─ Create user in database
                │
                ├─ Generate JWT token
                │
                └─ Return token + user data
                   │
                   ▼
5. Client stores token in localStorage
        │
        ├─ Set httpOnly cookie
        │
        └─ Redirect to /dashboard
```

## API Request with Authentication

```
1. Client wants to access protected route
        │
        ▼
2. Get token from localStorage
        │
        ▼
3. Add to request header:
   Authorization: Bearer <token>
        │
        ▼
4. Send POST /api/users/123 (update user)
        │
        ▼
5. Backend middleware intercepts
        │
        ├─ Extract token from header
        │
        ├─ Verify with JWT_SECRET
        │
        ├─ Invalid? → Return 401
        │
        └─ Valid?
           ├─ Extract user info (id, role)
           │
           ├─ Check role (Admin only for update)
           │
           ├─ Unauthorized? → Return 403
           │
           └─ Authorized?
              ├─ Update Prisma database
              │
              ├─ Log to AuditLog
              │
              └─ Return 200 + updated user
```

## Database Schema

```
┌──────────────────────────────┐
│         User Table           │
├──────────────────────────────┤
│ id (SERIAL PK)              │
│ email (UNIQUE)              │
│ name (VARCHAR)              │
│ password (VARCHAR HASHED)   │
│ role (ENUM: USER/MOD/ADMIN) │
│ avatar (VARCHAR NULL)       │
│ isActive (BOOLEAN)          │
│ createdAt (TIMESTAMP)       │
│ updatedAt (TIMESTAMP)       │
└──────────────────────────────┘
        │
        • 1 User → Many Sessions
        • 1 User → Many AuditLogs
        │
┌──────────────────────────────┐
│      Session Table           │
├──────────────────────────────┤
│ id (SERIAL PK)              │
│ userId (FK to User)         │
│ token (UNIQUE)              │
│ expiresAt (TIMESTAMP)       │
│ createdAt (TIMESTAMP)       │
└──────────────────────────────┘

┌──────────────────────────────┐
│      AuditLog Table          │
├──────────────────────────────┤
│ id (SERIAL PK)              │
│ userId (FK to User)         │
│ action (VARCHAR: LOGIN...)  │
│ target (VARCHAR NULL)       │
│ metadata (JSON NULL)        │
│ createdAt (TIMESTAMP)       │
└──────────────────────────────┘
```

## Role-Based Access Control (RBAC)

```
┌────────────────────────────────────────────────────────┐
│                 Route: /dashboard/users               │
│                                                        │
│ User Role    │ Access?   │ Can Do?         │ Redirect?│
├──────────────┼───────────┼─────────────────┼──────────┤
│ Not logged in│ ❌ No     │ N/A             │ Sign-in  │
│ USER         │ ✅ Yes    │ View own info   │ Own info │
│ MODERATOR    │ ✅ Yes    │ View own info   │ Own info │
│ ADMIN        │ ✅ Yes    │ Manage all      │ Full     │
└────────────────────────────────────────────────────────┘

API Query by Role:
┌────────────────────────────────────────────────────────┐
│            GET /api/users (List all users)            │
├──────────────────┬──────────────────────────────────┤
│ Unauthorized     │ → 401 Unauthorized              │
│ User role:USER   │ → 403 Forbidden (not admin)     │
│ User role:ADMIN  │ → 200 OK (returns all users)    │
└────────────────────────────────────────────────────────┘
```

## File Upload & Error Handling

```
Frontend Component (e.g., SignUp)
        │
        ├─ Client Validation
        │  ├─ Email format: user@example.com ✓
        │  ├─ Password length >= 8 ✓
        │  └─ Name length >= 2 ✓
        │
        ├─ API Call fails
        │  ├─ Network error? → "Network failed"
        │  ├─ Server returns 400? → Show validation errors
        │  └─ Server returns 409? → "Email already registered"
        │
        └─ Success
           ├─ Store token
           ├─ Redirect to /dashboard
           └─ Auto-fetch user data

Backend Validation Layer:
        │
        ├─ Zod schema validation
        │  ├─ Invalid? → 400 error
        │  └─ Valid? → Continue
        │
        ├─ Business logic checks
        │  ├─ Email exists? → 409 Conflict
        │  ├─ Password too weak? → 400 Bad Request
        │  └─ All checks pass? → Continue
        │
        ├─ Database operations
        │  ├─ Unique constraint violation? → 409 Conflict
        │  ├─ Database down? → 500 Server Error
        │  └─ Success? → Create user
        │
        └─ Response
           ├─ Generate JWT token
           ├─ Return 201 Created
           └─ Client handles success
```

## Development Workflow

```
1. Make code changes
        │
        ▼
2. Save file
        │
        ├─ Frontend: Next.js hot reload (automatic)
        ├─ Backend: ts-node-dev auto-restart (if using npm run dev)
        │
        ▼
3. Test changes (http://localhost:3000, http://localhost:4000)
        │
        ├─ Check browser console for errors
        ├─ Check backend terminal for logs
        │
        ▼
4. API debugging
        │
        ├─ Use Postman/Insomnia
        ├─ Or use fetch in browser console
        ├─ Or use curl command line
        │
        ▼
5. Database debugging
        │
        └─ npm run db:studio  (Prisma visual editor)
           └─ View/edit data in GUI
```

## Deployment Architecture

```
Production Setup:

Frontend: Vercel (Recommended)     │    Backend: Railway/Render/AWS
├─ Deploy Next.js build            │   ├─ Deploy Node.js app
├─ Automatic builds from git       │   ├─ Set environment variables
├─ Built-in CDN & SSL              │   ├─ Connect PostgreSQL (managed)
└─ Zero-config                     │   └─ Auto-restart on crash
                                   │
        ▼ HTTPS Requests           │

┌─────────────────────────────────────────────────────────┐
│              CloudFlare/CDN                              │
│  ├─ Cache static assets                                 │
│  ├─ DDoS protection                                     │
│  └─ SSL termination                                     │
└─────────────────────────────────────────────────────────┘

        ▼ API Requests

┌─────────────────────────────────────────────────────────┐
│           PostgreSQL (Managed Service)                   │
│  ├─ AWS RDS / DigitalOcean / Vercel Postgres            │
│  ├─ Automatic backups                                    │
│  ├─ SSL connections                                      │
│  └─ Scalable resources                                   │
└─────────────────────────────────────────────────────────┘
```

---

This architecture ensures:

- ✅ Clean separation of concerns
- ✅ Type-safe throughout (TypeScript)
- ✅ Scalable & maintainable code
- ✅ Secure authentication
- ✅ Role-based permissions
- ✅ Easy to extend & customize
