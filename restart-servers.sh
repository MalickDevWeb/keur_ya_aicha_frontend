#!/bin/bash

echo "🔄 Arrêt des serveurs existants..."
pkill -f "json-server" 2>/dev/null
pkill -f "electron" 2>/dev/null
sleep 2

echo "🚀 Démarrage de json-server..."
cd /home/pmt/KeurYaAicha/kya/frontend
npx json-server db/db.json --port 4000 &
sleep 3

echo "✅ Vérification de la connexion..."
curl -s http://localhost:4000/clients 2>/dev/null | head -c 300 || echo "Le serveur n'est pas encore prêt"

echo ""
echo "🎉 Redémarrage terminé!"
echo "📡 API: http://localhost:4000"
