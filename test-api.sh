#!/bin/bash

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

API="http://localhost:4000"

echo -e "${BLUE}=== TEST API CRUD ===${NC}\n"

# 1. GET /clients
echo -e "${BLUE}1️⃣  GET /clients${NC}"
curl -s "$API/clients" | jq '.' && echo -e "${GREEN}✓ OK${NC}\n" || echo -e "${RED}✗ FAIL${NC}\n"

# 2. POST /clients (créer un client)
echo -e "${BLUE}2️⃣  POST /clients (créer client)${NC}"
NEW_CLIENT=$(curl -s -X POST "$API/clients" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "client-test-123",
    "firstName": "TestClient",
    "lastName": "FromAPI",
    "phone": "+221 77 999 99 99",
    "cni": "9999999999999",
    "status": "active",
    "createdAt": "2025-02-02T10:00:00.000Z",
    "rentals": []
  }')

echo "$NEW_CLIENT" | jq '.' && echo -e "${GREEN}✓ OK${NC}\n" || echo -e "${RED}✗ FAIL${NC}\n"

# 3. GET /clients/:id
echo -e "${BLUE}3️⃣  GET /clients/:id${NC}"
curl -s "$API/clients/client-1" | jq '.' && echo -e "${GREEN}✓ OK${NC}\n" || echo -e "${RED}✗ FAIL${NC}\n"

# 4. PUT /clients/:id (mettre à jour un client)
echo -e "${BLUE}4️⃣  PUT /clients/:id (mettre à jour)${NC}"
curl -s -X PUT "$API/clients/client-test-123" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "TestClientUpdated"
  }' | jq '.' && echo -e "${GREEN}✓ OK${NC}\n" || echo -e "${RED}✗ FAIL${NC}\n"

# 5. POST /documents
echo -e "${BLUE}5️⃣  POST /documents${NC}"
curl -s -X POST "$API/documents" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "doc-test-123",
    "name": "Contrat Test",
    "type": "contract",
    "url": "http://example.com/contract.pdf",
    "uploadedAt": "2025-02-02T10:00:00.000Z",
    "signed": false
  }' | jq '.' && echo -e "${GREEN}✓ OK${NC}\n" || echo -e "${RED}✗ FAIL${NC}\n"

# 6. GET /documents
echo -e "${BLUE}6️⃣  GET /documents${NC}"
curl -s "$API/documents" | jq '.' && echo -e "${GREEN}✓ OK${NC}\n" || echo -e "${RED}✗ FAIL${NC}\n"

# 7. DELETE /documents/:id
echo -e "${BLUE}7️⃣  DELETE /documents/:id${NC}"
curl -s -X DELETE "$API/documents/doc-test-123" | jq '.' && echo -e "${GREEN}✓ OK${NC}\n" || echo -e "${RED}✗ FAIL${NC}\n"

# 8. POST /payments
echo -e "${BLUE}8️⃣  POST /payments${NC}"
curl -s -X POST "$API/payments" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "payment-test-123",
    "rentalId": "rental-1",
    "paymentId": "monthly-1",
    "amount": 150000
  }' | jq '.' && echo -e "${GREEN}✓ OK${NC}\n" || echo -e "${RED}✗ FAIL${NC}\n"

# 9. GET /payments
echo -e "${BLUE}9️⃣  GET /payments${NC}"
curl -s "$API/payments" | jq '.' && echo -e "${GREEN}✓ OK${NC}\n" || echo -e "${RED}✗ FAIL${NC}\n"

# 10. POST /deposits
echo -e "${BLUE}🔟 POST /deposits${NC}"
curl -s -X POST "$API/deposits" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "deposit-test-123",
    "rentalId": "rental-1",
    "amount": 300000
  }' | jq '.' && echo -e "${GREEN}✓ OK${NC}\n" || echo -e "${RED}✗ FAIL${NC}\n"

# 11. GET /deposits
echo -e "${BLUE}1️⃣1️⃣  GET /deposits${NC}"
curl -s "$API/deposits" | jq '.' && echo -e "${GREEN}✓ OK${NC}\n" || echo -e "${RED}✗ FAIL${NC}\n"

# Vérifier le client test créé
echo -e "${BLUE}📊 Vérification du client créé${NC}"
curl -s "$API/clients/client-test-123" | jq '.'

echo -e "\n${GREEN}=== TESTS TERMINÉS ===${NC}"
