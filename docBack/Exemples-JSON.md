# Exemples JSON (entites et interactions)

## 1. User + Admin
```json
{
  "user": {
    "id": "user-123",
    "username": "771234567",
    "password": "hash_ou_secret",
    "name": "Alioune Diop",
    "email": "alioune@kya.sn",
    "phone": "+221771234567",
    "role": "ADMIN",
    "status": "ACTIF",
    "createdAt": "2026-02-01T10:00:00.000Z",
    "updatedAt": "2026-02-01T10:00:00.000Z"
  },
  "admin": {
    "id": "user-123",
    "entrepriseId": "ent-001",
    "status": "ACTIF",
    "paid": true,
    "paidAt": "2026-02-05T12:00:00.000Z"
  }
}
```

## 2. Admin request
```json
{
  "id": "req-001",
  "name": "Moussa Fall",
  "email": "moussa@kya.sn",
  "phone": "+221771112233",
  "entrepriseName": "Immo Dakar",
  "username": "771112233",
  "password": "secret",
  "status": "EN_ATTENTE",
  "paid": false,
  "paidAt": null,
  "createdAt": "2026-02-10T09:00:00.000Z"
}
```

## 3. Client + Contact (admin_clients) + location
```json
{
  "client": {
    "id": "client-001",
    "adminId": "user-123",
    "firstName": "Fatou",
    "lastName": "Sarr",
    "phone": "+221771998877",
    "email": "fatou@example.com",
    "cni": "1234567890123",
    "status": "active",
    "createdAt": "2026-02-12T10:00:00.000Z",
    "rentals": [
      {
        "id": "rental-001",
        "clientId": "client-001",
        "propertyType": "apartment",
        "propertyName": "Appartement A1",
        "monthlyRent": 150000,
        "startDate": "2026-02-01T00:00:00.000Z",
        "deposit": {
          "total": 300000,
          "paid": 150000,
          "payments": [
            {
              "id": "dep-pay-1",
              "amount": 150000,
              "date": "2026-02-01T08:00:00.000Z",
              "receiptNumber": "DEP-202602-ABC123"
            }
          ]
        },
        "payments": [],
        "documents": []
      }
    ]
  },
  "admin_client_link": {
    "id": "ac-001",
    "adminId": "user-123",
    "clientId": "client-001",
    "createdAt": "2026-02-12T10:00:00.000Z"
  }
}
```

## 4. Paiement loyer (table legacy `payments`)
```json
{
  "id": "pay-001",
  "rentalId": "rental-001",
  "paymentId": "month-2026-02",
  "amount": 150000,
  "receiptId": "rec-001",
  "date": "2026-02-15T10:00:00.000Z",
  "description": "Loyer fevrier"
}
```

## 5. Depot caution (table legacy `deposits`)
```json
{
  "id": "dep-001",
  "rentalId": "rental-001",
  "amount": 50000,
  "receiptId": "dep-rec-001",
  "date": "2026-02-16T10:00:00.000Z"
}
```

## 6. Admin payment (abonnement)
### 6.1 Demande creation
```json
{
  "adminId": "user-123",
  "amount": 10000,
  "method": "wave",
  "payerPhone": "+221771234567",
  "month": "2026-02"
}
```

### 6.2 Reponse pending provider
```json
{
  "id": "adminpay-001",
  "adminId": "user-123",
  "amount": 10000,
  "method": "wave",
  "status": "pending",
  "provider": "wave",
  "providerReference": "wave_abc_123",
  "checkoutUrl": "https://provider/checkout/abc",
  "month": "2026-02",
  "paidAt": null,
  "approvedAt": null,
  "approvedBy": null,
  "createdAt": "2026-02-20T12:00:00.000Z"
}
```

### 6.3 Webhook confirme
```json
{
  "ok": true,
  "paymentId": "adminpay-001",
  "status": "paid"
}
```

## 7. Documents
```json
{
  "id": "doc-001",
  "clientId": "client-001",
  "rentalId": "rental-001",
  "name": "Contrat location",
  "type": "contract",
  "url": "https://res.cloudinary.com/demo/raw/upload/v.../contrat.pdf",
  "signed": false,
  "uploadedAt": "2026-02-17T14:00:00.000Z"
}
```

## 8. Messages (notifications)
```json
{
  "id": "notif-001",
  "user_id": "superadmin-001",
  "type": "SECURITY_ALERT",
  "message": "IP bloquee automatiquement: 41.82.xx.xx",
  "is_read": false,
  "created_at": "2026-02-18T10:00:00.000Z"
}
```

## 9. Audit log
```json
{
  "id": "log-001",
  "actor": "system",
  "action": "FAILED_LOGIN",
  "targetType": "auth",
  "targetId": "771234567",
  "message": "Tentative de connexion echouee",
  "ipAddress": "41.82.10.30",
  "createdAt": "2026-02-18T10:01:00.000Z"
}
```

## 10. Import run
```json
{
  "id": "imprun-001",
  "adminId": "user-123",
  "fileName": "clients_fevrier.xlsx",
  "totalRows": 3,
  "inserted": [
    {
      "id": "client-002",
      "firstName": "Awa",
      "lastName": "Ba",
      "phone": "+221771010101",
      "email": "awa@x.com"
    }
  ],
  "errors": [
    {
      "rowNumber": 2,
      "errors": ["CNI invalide"],
      "parsed": {"firstName": "X", "cni": "123"}
    }
  ],
  "ignored": false,
  "readSuccess": false,
  "readErrors": false,
  "createdAt": "2026-02-19T09:00:00.000Z"
}
```

## 11. Undo action
```json
{
  "id": "undo-001",
  "resource": "clients",
  "resourceId": "client-001",
  "method": "PATCH",
  "actorId": "user-123",
  "createdAt": "2026-02-19T10:00:00.000Z",
  "expiresAt": "2026-04-20T10:00:00.000Z",
  "path": "/clients/client-001",
  "rollback": {
    "type": "upsert",
    "item": {"id": "client-001", "firstName": "Fatou"}
  },
  "sideEffects": null
}
```

## 12. Setting platform config
```json
{
  "id": "platform_config_v1",
  "key": "platform_config_v1",
  "value": "{\"maintenance\":{\"enabled\":false},\"sessionSecurity\":{\"maxFailedLogins\":5,\"lockoutMinutes\":30},\"paymentRules\":{\"graceDays\":5,\"blockOnOverdue\":true},\"documents\":{\"retentionDays\":365},\"auditCompliance\":{\"retentionDays\":365}}"
}
```
