#!/bin/bash

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Ports
JSON_PORT=4000
SIGN_PORT=3001
VITE_PORT=5173

echo -e "${BLUE}🚀 Démarrage de tous les serveurs...${NC}\n"

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

  echo -e "${YELLOW}Arrêt de json-server...${NC}"
  pkill -f "json-server.*db/db.json" 2>/dev/null || true

  echo -e "${YELLOW}Arrêt du serveur Cloudinary...${NC}"
  pkill -f "node.*server/index.js" 2>/dev/null || true

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

free_port $JSON_PORT
free_port $SIGN_PORT
free_port $VITE_PORT

echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Démarrage des serveurs...${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# JSON Server
echo -e "${BLUE}1️⃣  Démarrage de json-server sur le port $JSON_PORT...${NC}"
json-server --watch db/db.json --port $JSON_PORT 2>&1 &
JSON_PID=$!
sleep 2
if ps -p $JSON_PID > /dev/null; then
  echo -e "${GREEN}✅ json-server démarré (PID: $JSON_PID)${NC}\n"
else
  echo -e "${RED}❌ Erreur: json-server n'a pas pu démarrer${NC}\n"
  exit 1
fi

# Cloudinary Sign Server
echo -e "${BLUE}2️⃣  Démarrage du serveur Cloudinary sur le port $SIGN_PORT...${NC}"
(cd server && node index.js) 2>&1 &
SIGN_PID=$!
sleep 2
if ps -p $SIGN_PID > /dev/null; then
  echo -e "${GREEN}✅ Cloudinary Sign Server démarré (PID: $SIGN_PID)${NC}\n"
else
  echo -e "${RED}❌ Erreur: Cloudinary Sign Server n'a pas pu démarrer${NC}\n"
  kill $JSON_PID 2>/dev/null || true
  exit 1
fi

# Vite
echo -e "${BLUE}3️⃣  Démarrage de Vite sur le port $VITE_PORT...${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ TOUS LES SERVEURS LANCÉS!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📊 json-server:${NC}         http://localhost:$JSON_PORT"
echo -e "${BLUE}🔐 Cloudinary Sign:${NC}    http://localhost:$SIGN_PORT"
echo -e "${BLUE}🌐 Application:${NC}        http://localhost:$VITE_PORT${NC}\n"
echo -e "${YELLOW}⏸️  Appuie sur Ctrl+C pour arrêter tous les serveurs${NC}\n"

npx vite --host --port $VITE_PORT
