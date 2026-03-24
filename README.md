# JumpPlusPlus

JumpPlusPlus is a full-stack web app built with:

- Frontend: Next.js 15, React 19, TypeScript, Tailwind CSS
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL + Prisma
- Authentication: JWT + role-based access control

## Monorepo Structure

```
jumpplusplus/
├── frontend/   # Next.js app
├── backend/    # Express API + Prisma
└── docs files  # README, QUICKSTART, ARCHITECTURE, FEATURES
```

## Features Implemented

### Auth and Security

- Sign up
- Sign in
- Current user profile endpoint
- Logout endpoint
- JWT auth middleware
- Role-based authorization (USER, MODERATOR, ADMIN)
- CORS allowlist
- Helmet security headers
- Zod request validation

### User Management

- List users (admin/moderator restricted)
- User statistics
- Get user detail
- Update user
- Delete user

### Event and Booking Management

- Event CRUD API (admin/moderator managed)
- Booking create/list/detail/cancel API
- Time-slot collision checks
- Max slot capacity checks
- Dashboard menu for booking flows
- Calendar UI to pick date and time
- My bookings page with status and cancellation

### UI

- Landing page
- Auth pages (sign in / sign up)
- Protected dashboard
- Users management page
- Booking page
- My bookings page
- Responsive layout and navigation

## API Endpoints

### Auth

- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- POST /api/auth/logout

### Users

- GET /api/users
- GET /api/users/stats
- GET /api/users/:id
- PATCH /api/users/:id
- DELETE /api/users/:id

### Events

- GET /api/events
- GET /api/events/:id
- POST /api/events
- PATCH /api/events/:id
- DELETE /api/events/:id

### Bookings

- GET /api/bookings
- GET /api/bookings/:id
- GET /api/bookings/admin/all
- POST /api/bookings
- PATCH /api/bookings/:id/cancel

## Quick Start

1. Install all dependencies

```bash
npm run install:all
```

2. Configure environment variables

- Create backend/.env with:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME?schema=public"
JWT_SECRET="change-this-secret"
PORT=4000
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"
```

- Create frontend/.env.local with:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
JWT_SECRET=change-this-secret
```

3. Generate Prisma client and apply migration

```bash
npm run db:migrate
```

4. Seed sample users

```bash
npm run db:seed
```

5. Run frontend + backend together

```bash
npm run dev
```

## Default Seed Accounts

- admin@jumpplusplus.com / Admin@123456
- moderator@jumpplusplus.com / User@123456
- user@jumpplusplus.com / User@123456

## Useful Commands

From project root:

- npm run dev
- npm run build
- npm run db:migrate
- npm run db:seed
- npm run db:studio

## Documentation Index

- QUICKSTART.md
- ARCHITECTURE.md
- FEATURES.md
- IMPLEMENTATION_SPEC.md
- SPRINT_PLAN.md

## Current Status

MVP is functional with auth, roles, user management, and booking/event workflows. Next implementation priorities are testing, production hardening, and deployment automation.
