// Exemple de requêtes fetch pour interagir avec le JSON Server

// Récupérer tous les utilisateurs
fetch('http://localhost:3000/users')
  .then((response) => response.json())
  .then((data) => console.log('Users:', data))
  .catch((error) => console.error('Error fetching users:', error))

// Récupérer les notifications d'un utilisateur spécifique
fetch('http://localhost:3000/notifications?user_id=1')
  .then((response) => response.json())
  .then((data) => console.log('Notifications for user 1:', data))
  .catch((error) => console.error('Error fetching notifications:', error))

// Créer une nouvelle location pour un client
fetch('http://localhost:3000/rentals', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    id: 'rental3',
    clientId: 3,
    propertyType: 'Office',
    propertyName: 'Business Center',
    monthlyRent: 1200000,
    startDate: '2026-03-01',
    deposit: 2400000,
  }),
})
  .then((response) => response.json())
  .then((data) => console.log('New rental created:', data))
  .catch((error) => console.error('Error creating rental:', error))

// Vérifier les OTP non utilisés pour un utilisateur
fetch('http://localhost:3000/otp?user_id=2&is_used=false')
  .then((response) => response.json())
  .then((data) => console.log('Unused OTPs for user 2:', data))
  .catch((error) => console.error('Error fetching OTPs:', error))

// Récupérer les relations Admin-Client
fetch('http://localhost:3000/admin_clients')
  .then((response) => response.json())
  .then((data) => console.log('Admin-Client relationships:', data))
  .catch((error) => console.error('Error fetching admin-client relationships:', error))
