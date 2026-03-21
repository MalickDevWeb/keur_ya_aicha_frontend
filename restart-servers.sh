#!/bin/bash

echo "🔄 Arrêt des serveurs existants..."
pkill -f "next dev" 2>/dev/null
pkill -f "vite" 2>/dev/null
sleep 2

echo "🚀 Démarrage backend Next.js..."
cd /home/pmt/KeurYaAicha/kya/frontend
PORT=3000 npm --prefix next-backend run dev &
sleep 3

echo "✅ Vérification de la connexion..."
curl -s http://localhost:3000/api/sante 2>/dev/null | head -c 300 || echo "Le serveur n'est pas encore prêt"

echo ""
echo "🎉 Redémarrage terminé!"
echo "📡 API: http://localhost:3000"
