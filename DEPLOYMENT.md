# Production Deployment (Docker + Compose + Nginx)

## Files Added

- `backend/Dockerfile`
- `frontend/Dockerfile`
- `docker-compose.yml`
- `nginx/nginx.conf`
- `.env.production.example`
- `backend/.dockerignore`
- `frontend/.dockerignore`

## 1. Create production env file

From project root:

```bash
cp .env.production.example .env.production
```

Edit `.env.production` and set strong values, especially:

- `POSTGRES_PASSWORD`
- `JWT_SECRET`
- `FRONTEND_URL` (your public domain)

## 2. Build and run

```bash
docker compose --env-file .env.production up -d --build
```

## 3. Check service status

```bash
docker compose ps
docker compose logs -f nginx
docker compose logs -f backend
```

## Routing behavior

Nginx listens on port 80 and routes:

- `/` -> frontend (Next.js)
- `/api/` -> backend (Express)
- `/uploads/` -> backend static uploads

## Notes

- Backend runs Prisma migrations on startup via `prisma migrate deploy`.
- Postgres data is persisted in Docker volume `postgres_data`.
- Uploaded files are persisted in Docker volume `backend_uploads`.
