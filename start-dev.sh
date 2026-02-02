#!/bin/bash

# Fonction pour trouver un port libre
find_free_port() {
  local port=$1
  while lsof -i :$port > /dev/null 2>&1; do
    port=$((port + 1))
  done
  echo $port
}

# Trouver port libre pour json-server (commence par 4000)
JSON_PORT=$(find_free_port 4000)
echo "🚀 Démarrage json-server sur le port $JSON_PORT..."
json-server --watch db/db.json --port $JSON_PORT > /tmp/json-server.log 2>&1 &
JSON_PID=$!

# Exporter le port pour l'application
export VITE_API_URL="http://localhost:$JSON_PORT"

# Attendre que json-server démarre
sleep 2

# Vite gère automatiquement les ports alternatifs (8082, 8083, 8084, etc.)
echo "🚀 Démarrage de l'application sur le port suivant disponible..."
npm run dev:web &
VITE_PID=$!

# Afficher les infos
echo ""
echo "✅ Serveurs lancés!"
echo "📊 json-server: http://localhost:$JSON_PORT"
echo "🌐 App: http://localhost:8082+ (voir le terminal pour le port exact)"
echo ""
echo "Appuie sur Ctrl+C pour arrêter"
echo ""

# Cleanup au fermeture
trap "kill $JSON_PID $VITE_PID 2>/dev/null" EXIT INT

# Attendre
wait
