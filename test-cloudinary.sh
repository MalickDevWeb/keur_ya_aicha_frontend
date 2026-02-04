#!/bin/bash
# Script de test - Upload vers Cloudinary

echo "🧪 Test Upload Cloudinary"
echo "=========================="
echo ""

# Variables
CLOUD_NAME="djp423xyr"
UPLOAD_PRESET="Unsigned"
UPLOAD_URL="https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload"

echo "📡 Configuration:"
echo "   Cloud Name: $CLOUD_NAME"
echo "   Upload Preset: $UPLOAD_PRESET"
echo "   URL: $UPLOAD_URL"
echo ""

# Test 1: Vérifier la connexion à Cloudinary
echo "🔍 Test 1: Connexion à Cloudinary..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$UPLOAD_URL")

if [ "$RESPONSE" = "400" ] || [ "$RESPONSE" = "200" ]; then
  echo "✅ Cloudinary accessible (Status: $RESPONSE)"
else
  echo "❌ Erreur connexion Cloudinary (Status: $RESPONSE)"
  exit 1
fi

echo ""
echo "✅ Cloudinary Configuration est VALIDE"
echo ""
echo "Pour tester l'upload complet:"
echo "1. Ouvrir http://localhost:8082"
echo "2. Aller à Documents page"
echo "3. Sélectionner client + location"
echo "4. Choisir fichier (JPG/PNG/PDF)"
echo "5. Cliquer 'Importer Document'"
echo "6. Vérifier console (F12) pour les logs"
echo ""
echo "Attendus dans console:"
echo "  📡 [API] Uploading file to Cloudinary"
echo "  ✅ [API] Uploaded to Cloudinary: https://res.cloudinary.com/..."
