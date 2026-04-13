# Production Deployment (Docker + Compose + Nginx)

## Files Added

- `backend/Dockerfile`
- `frontend/Dockerfile`
- `docker-compose.yml`
- `docker-stack.yml`
- `nginx/nginx.conf`
- `.env.production.example`
- `backend/.dockerignore`
- `frontend/.dockerignore`
- `deploy-swarm.sh`
- `destroy-swarm.sh`

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

## Docker Swarm deployment

1. Initialize Docker Swarm on the host if needed:

```bash
docker swarm init
```

2. Build and deploy the stack from the project root:

```bash
./deploy-swarm.sh
```

3. Check stack status:

```bash
docker stack ls
docker stack services jumpplusplus
docker service logs -f jumpplusplus_nginx jumpplusplus_backend
```

4. Remove the stack:

```bash
./destroy-swarm.sh
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
