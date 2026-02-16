#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

usage() {
  cat <<'EOF'
Usage:
  ./scripts/deploy-frontend-vercel.sh [--api-url URL] [--sign-url URL] [--token TOKEN]

Description:
  Deploie uniquement le frontend Vite sur Vercel.
  Le backend peut etre deploye plus tard.

Options:
  --api-url   URL backend a injecter dans Vercel (VITE_API_URL)
  --sign-url  URL signature Cloudinary (VITE_CLOUDINARY_SIGN_URL)
  --token     Token Vercel (evite le login interactif)
  --help      Affiche cette aide
EOF
}

API_URL="${VITE_API_URL:-}"
SIGN_URL="${VITE_CLOUDINARY_SIGN_URL:-}"
VERCEL_TOKEN_VALUE="${VERCEL_TOKEN:-}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --api-url)
      if [[ $# -lt 2 ]]; then
        echo "Option --api-url invalide (URL manquante)." >&2
        exit 1
      fi
      API_URL="$2"
      shift 2
      ;;
    --sign-url)
      if [[ $# -lt 2 ]]; then
        echo "Option --sign-url invalide (URL manquante)." >&2
        exit 1
      fi
      SIGN_URL="$2"
      shift 2
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    --token)
      if [[ $# -lt 2 ]]; then
        echo "Option --token invalide (TOKEN manquant)." >&2
        exit 1
      fi
      VERCEL_TOKEN_VALUE="$2"
      shift 2
      ;;
    *)
      echo "Option inconnue: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ ! -f package.json ]]; then
  echo "package.json introuvable dans: $ROOT_DIR" >&2
  exit 1
fi

if [[ ! -f vercel.json ]]; then
  echo "vercel.json introuvable. Le projet n'est pas configure pour Vercel." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm introuvable. Installe Node.js puis reessaie." >&2
  exit 1
fi

if [[ ! -d node_modules ]]; then
  echo "Installation des dependances..."
  npm install
fi

vercel_cmd() {
  if [[ -n "$VERCEL_TOKEN_VALUE" ]]; then
    npx --yes vercel@latest "$@" --token "$VERCEL_TOKEN_VALUE"
  else
    npx --yes vercel@latest "$@"
  fi
}

set_vercel_env() {
  local key="$1"
  local value="$2"
  if [[ -z "$value" ]]; then
    return
  fi

  # Ignore if env does not exist yet.
  vercel_cmd env rm "$key" production --yes >/dev/null 2>&1 || true
  printf '%s\n' "$value" | vercel_cmd env add "$key" production
}

echo "Verification session Vercel..."
if ! vercel_cmd whoami; then
  if [[ -n "$VERCEL_TOKEN_VALUE" ]]; then
    echo "Token Vercel invalide ou expire." >&2
    exit 1
  fi
  echo "Connexion Vercel requise..."
  vercel_cmd login
fi

echo "Liaison du projet Vercel (si necessaire)..."
vercel_cmd link

if [[ -n "$API_URL" ]]; then
  echo "Configuration VITE_API_URL..."
  set_vercel_env "VITE_API_URL" "$API_URL"
fi

if [[ -n "$SIGN_URL" ]]; then
  echo "Configuration VITE_CLOUDINARY_SIGN_URL..."
  set_vercel_env "VITE_CLOUDINARY_SIGN_URL" "$SIGN_URL"
fi

echo "Deploiement frontend en production..."
vercel_cmd --prod

echo "Deploy frontend termine."
