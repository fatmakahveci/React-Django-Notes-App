#!/usr/bin/env bash
set -Eeuo pipefail

if [[ $# -ne 5 ]]; then
  echo "Usage: deploy-production.sh DEPLOY_PATH BACKEND_IMAGE FRONTEND_IMAGE RELEASE HEALTH_URL" >&2
  exit 64
fi

deploy_path=$1
backend_image=$2
frontend_image=$3
release=$4
health_url=${5%/}/api/accounts/csrf/

[[ "$deploy_path" =~ ^/[A-Za-z0-9._/-]+$ ]] || exit 64
[[ "$backend_image" =~ ^ghcr\.io/[a-z0-9._/-]+:sha-[0-9a-f]{40}$ ]] || exit 64
[[ "$frontend_image" =~ ^ghcr\.io/[a-z0-9._/-]+:sha-[0-9a-f]{40}$ ]] || exit 64
[[ "$release" =~ ^v[0-9]+\.[0-9]+\.[0-9]+([.-][0-9A-Za-z.-]+)?$ ]] || exit 64
[[ "$health_url" =~ ^https:// ]] || exit 64

cd "$deploy_path"
test -f .env.production

compose=(docker compose --env-file .env.production --env-file .env.release -f compose.yaml -f compose.production.yaml)
mkdir -p backups
chmod 700 backups

if [[ -f .env.release ]]; then
  cp .env.release .env.release.previous
fi

cat > .env.release.next <<EOF
BACKEND_IMAGE=$backend_image
FRONTEND_IMAGE=$frontend_image
APP_RELEASE=$release
EOF
chmod 600 .env.release.next

rollback() {
  echo "Deployment failed; restoring the previous application images." >&2
  if [[ -f .env.release.previous ]]; then
    mv .env.release.previous .env.release
    "${compose[@]}" up --detach --no-build --wait backend frontend || true
  fi
}
trap rollback ERR

mv .env.release.next .env.release
"${compose[@]}" exec -T db sh -c \
  'pg_dump --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --format custom --no-owner --no-acl' \
  > "backups/pre-${release}-$(date -u +%Y%m%dT%H%M%SZ).dump"
"${compose[@]}" pull backend frontend
"${compose[@]}" run --rm --no-deps backend python manage.py migrate --noinput
"${compose[@]}" up --detach --no-build --wait
curl --fail --silent --show-error --retry 12 --retry-all-errors \
  --retry-delay 5 --max-time 10 "$health_url" >/dev/null

trap - ERR
rm -f .env.release.previous
docker image prune --force --filter "until=168h"
echo "Successfully deployed $release"
