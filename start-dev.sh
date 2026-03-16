#!/bin/bash

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Ports
BACKEND_PORT=3000
VITE_PORT=5173
DB_PORT=55432

# Local DB defaults (docker compose)
DB_NAME="kya_extreme_test"
DB_USER="kya_extreme"
DB_PASSWORD="kya_extreme_password"
DB_HOST="localhost"
DB_URL_DEFAULT="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

echo -e "${BLUE}🚀 Démarrage frontend + backend (local)...${NC}\n"

# Fonction pour libérer un port
free_port() {
  local port=$1
  echo -e "${YELLOW}🔧 Vérification du port $port...${NC}"

  # Chercher les processus écoutant sur ce port
  local pids=$(lsof -i :$port 2>/dev/null | grep -v COMMAND | awk '{print $2}' | sort -u)

  if [ ! -z "$pids" ]; then
    echo -e "${YELLOW}   ⚠️  Port $port occupé, nettoyage...${NC}"
    for pid in $pids; do
      echo -e "${YELLOW}   Arrêt du processus $pid${NC}"
      kill -9 $pid 2>/dev/null || true
    done
    sleep 1

    # Double check avec fuser
    fuser -k $port/tcp 2>/dev/null || true
    sleep 1
    echo -e "${GREEN}   ✅ Port $port libéré${NC}"
  else
    echo -e "${GREEN}   ✅ Port $port libre${NC}"
  fi
}

# Cleanup function
cleanup() {
  echo -e "\n${YELLOW}📤 Arrêt de tous les serveurs...${NC}"

  echo -e "${YELLOW}Arrêt du backend Next.js...${NC}"
  pkill -f "next dev" 2>/dev/null || true

  echo -e "${YELLOW}Arrêt de Vite...${NC}"
  pkill -f "vite" 2>/dev/null || true

  sleep 1
  echo -e "${GREEN}✅ Tous les serveurs arrêtés${NC}"
  exit 0
}

trap cleanup EXIT INT TERM

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Libération des ports...${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

free_port $BACKEND_PORT
free_port $VITE_PORT

# Optional: start local Postgres via docker compose
if command -v docker >/dev/null 2>&1; then
  echo -e "${BLUE}🗄️  Démarrage PostgreSQL (docker compose)...${NC}"
  docker compose -f next-backend/docker-compose.extreme-local.yml up -d >/dev/null 2>&1 || true
else
  echo -e "${YELLOW}⚠️  Docker non disponible, DB locale non démarrée.${NC}"
fi

# Wait for DB port (best effort)
wait_for_port() {
  local host=$1
  local port=$2
  local retries=${3:-20}
  for _ in $(seq 1 "$retries"); do
    (echo > /dev/tcp/${host}/${port}) >/dev/null 2>&1 && return 0
    sleep 1
  done
  return 1
}

echo -e "${BLUE}⏳ Attente DB ${DB_HOST}:${DB_PORT}...${NC}"
if wait_for_port "$DB_HOST" "$DB_PORT" 15; then
  echo -e "${GREEN}✅ DB accessible${NC}"
else
  echo -e "${YELLOW}⚠️  DB non accessible pour l'instant. Le backend peut échouer si DATABASE_URL est invalide.${NC}"
fi

echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Démarrage des serveurs...${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Backend Next.js
echo -e "${BLUE}1️⃣  Démarrage du backend Next.js sur le port $BACKEND_PORT...${NC}"
export DATABASE_URL="${DATABASE_URL:-$DB_URL_DEFAULT}"
export CORS_ORIGINES_AUTORISEES="${CORS_ORIGINES_AUTORISEES:-http://localhost:$VITE_PORT}"
export PUBLIC_API_BASE_URL="${PUBLIC_API_BASE_URL:-http://localhost:$BACKEND_PORT/api}"

# Prisma (best effort)
if command -v npm >/dev/null 2>&1; then
  (cd next-backend && npm run prisma:generate >/dev/null 2>&1 || true)
  (cd next-backend && npm run prisma:push >/dev/null 2>&1 || true)
  (cd next-backend && npm run prisma:seed >/dev/null 2>&1 || true)
fi

PORT=$BACKEND_PORT npm --prefix next-backend run dev 2>&1 &
BACKEND_PID=$!
sleep 2
if ps -p $BACKEND_PID > /dev/null; then
  echo -e "${GREEN}✅ Backend démarré (PID: $BACKEND_PID)${NC}\n"
else
  echo -e "${RED}❌ Erreur: le backend n'a pas pu démarrer${NC}\n"
  exit 1
fi

# Vite
echo -e "${BLUE}2️⃣  Démarrage de Vite sur le port $VITE_PORT...${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ TOUS LES SERVEURS LANCÉS!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🧠 Backend:${NC}            http://localhost:$BACKEND_PORT"
echo -e "${BLUE}📄 Swagger:${NC}            http://localhost:$BACKEND_PORT/documentation"
echo -e "${BLUE}🌐 Application:${NC}        http://localhost:$VITE_PORT${NC}\n"
echo -e "${BLUE}🔐 Comptes seed:${NC}       superadmin@kya.local / SuperAdmin@123456"
echo -e "${BLUE}                          admin@kya.local / Admin@123456${NC}\n"
echo -e "${YELLOW}⏸️  Appuie sur Ctrl+C pour arrêter tous les serveurs${NC}\n"

npx vite --host --port $VITE_PORT
