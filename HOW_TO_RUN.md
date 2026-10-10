# How to run

Everything runs in Docker. Run these from the repo root.

## Dev

```bash
# start everything (mongo, api :4000, web :3000)
docker compose up

# start in background
docker compose up -d

# stop
docker compose down

# logs
docker compose logs -f api
docker compose logs -f web

# restart one service
docker compose restart api

# rebuild the dev image (after changing docker/dev.Dockerfile)
docker compose build
```

- Store: http://localhost:3000
- Admin: http://localhost:3000/admin (`admin@123commerce.com` / `admin12345`)
- API: http://localhost:4000/health

## Packages

```bash
# install / update deps after pulling
docker compose run --rm install

# add a package
docker compose run --rm tools pnpm --filter @123/web add some-package
docker compose run --rm tools pnpm --filter @123/api add some-package
docker compose run --rm tools pnpm --filter @123/shared add some-package

# shell inside the tools container
docker compose run --rm tools
```

## Checks

```bash
# lint + format check (must pass)
docker compose run --rm tools pnpm lint
docker compose run --rm tools pnpm format:check

# auto-fix formatting
docker compose run --rm tools pnpm format

# typecheck
docker compose run --rm tools pnpm typecheck

# production build
docker compose run --rm tools pnpm build
```

## Database (local dev)

```bash
# add demo products (safe to run again)
./Hack/Database/seed.sh

# delete everything in local db
./Hack/Database/clear.sh

# fresh start: clear + seed
YES=1 ./Hack/Database/clear.sh && ./Hack/Database/seed.sh

# dump local db -> Hack/Database/dumps/
./Hack/Database/dump.sh

# dump production db (first: cp Hack/Database/.env.example Hack/Database/.env and fill it)
./Hack/Database/dump.sh prod

# restore newest dump into local db
./Hack/Database/restore.sh

# restore a specific dump into local db
./Hack/Database/restore.sh Hack/Database/dumps/prod-commerce-20260101-120000.archive.gz

# skip the "are you sure?" prompt
YES=1 ./Hack/Database/restore.sh

# mongo shell on local db
docker compose exec mongo mongosh commerce

# wipe mongo completely (removes the volume)
docker compose down -v
```

Note: restore never touches production. After restoring a prod dump, log in with prod admin
credentials, or reset one:

```bash
# create admin / reset password
docker compose run --rm api pnpm --filter @123/api admin:create you@mail.com 'StrongPass123' 'Your Name'
```

## Production

```bash
# api on a VPS
docker compose -f docker-compose.prod.api.yml --env-file apps/api/.env.production up -d --build

# deploy web to Cloudflare Workers
docker compose -f docker-compose.prod.web.yml --env-file apps/web/.env.production run --rm deploy
```
