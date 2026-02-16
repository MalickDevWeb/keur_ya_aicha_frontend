/**
 * Centralized Error Messages
 *
 * All application error messages in one place for easy maintenance
 * and consistent error handling across the app.
 */

// ==========================================
// Authentication Errors
// ==========================================

export const AUTH_ERRORS = {
  // Login errors
  INVALID_CREDENTIALS: 'Identifiants invalides',
  ACCOUNT_PENDING: 'Vous n\'êtes pas encore approuvé. Veuillez patienter quelques heures.',
  ACCOUNT_BLOCKED: 'Votre compte a été bloqué. Veuillez contacter l\'administrateur.',
  NETWORK_ERROR: 'Erreur de connexion. Veuillez vérifier votre connexion internet.',
  SESSION_EXPIRED: 'Votre session a expiré. Veuillez vous reconnecter.',

  // Registration errors
  PHONE_ALREADY_EXISTS: 'Ce numéro de téléphone est déjà utilisé.',
  EMAIL_ALREADY_EXISTS: 'Cette adresse email est déjà utilisée.',
  INVALID_INVITE_CODE: 'Code d\'invitation invalide.',

  // Password errors
  WEAK_PASSWORD: 'Le mot de passe doit contenir au moins 6 caractères.',
  PASSWORD_MISMATCH: 'Les mots de passe ne correspondent pas.',
} as const

// ==========================================
// Validation Errors
// ==========================================

export const VALIDATION_ERRORS = {
  // Common
  REQUIRED_FIELD: 'Ce champ est requis',
  INVALID_FORMAT: 'Format invalide',

  // Phone
  INVALID_PHONE: 'Numéro sénégalais invalide. Format: +221 77 123 45 67',
  PHONE_REQUIRED: 'Le numéro de téléphone est requis',

  // CNI
  INVALID_CNI: 'La CNI doit contenir 13 caractères alphanumériques',
  CNI_REQUIRED: 'La CNI est requise',

  // Email
  INVALID_EMAIL: 'Email invalide',
  EMAIL_REQUIRED: 'L\'email est requis',

  // Name
  INVALID_NAME: 'Le nom ne doit contenir que des lettres',
  NAME_TOO_SHORT: 'Le nom doit contenir au moins 2 caractères',
  NAME_TOO_LONG: 'Le nom ne peut pas dépasser 50 caractères',

  // Amount
  INVALID_AMOUNT: 'Le montant doit être un nombre positif',
  AMOUNT_TOO_HIGH: 'Le montant ne peut pas dépasser 100 000 000',

  // Date
  INVALID_DATE: 'Date invalide',
  DATE_PAST: 'La date ne peut pas être dans le passé',
  DATE_FUTURE: 'La date ne peut pas être dans le futur',
} as const

// ==========================================
// API Errors
// ==========================================

export const API_ERRORS = {
  // Generic
  UNKNOWN: 'Une erreur inattendue s\'est produite',
  SERVER_ERROR: 'Erreur serveur. Veuillez réessayer plus tard.',
  NETWORK: 'Erreur de connexion. Veuillez vérifier votre connexion.',
  TIMEOUT: 'La requête a expiré. Veuillez réessayer.',

  // Resource-specific
  NOT_FOUND: 'Ressource non trouvée',
  ALREADY_EXISTS: 'Cette ressource existe déjà',
  FORBIDDEN: 'Vous n\'avez pas l\'autorisation d\'effectuer cette action',
  UNAUTHORIZED: 'Vous devez être connecté pour effectuer cette action',

  // Operations
  CREATE_FAILED: 'Échec de la création',
  UPDATE_FAILED: 'Échec de la mise à jour',
  DELETE_FAILED: 'Échec de la suppression',

  // Import/Export
  IMPORT_FAILED: 'Échec de l\'importation',
  EXPORT_FAILED: 'Échec de l\'exportation',
  FILE_TOO_LARGE: 'Le fichier est trop volumineux',
  INVALID_FILE_TYPE: 'Type de fichier non autorisé',

  // Upload
  UPLOAD_FAILED: 'Échec de l\'upload',
  UPLOAD_CANCELLED: 'Upload annulé',
} as const

// ==========================================
// Payment Errors
// ==========================================

export const PAYMENT_ERRORS = {
  ALREADY_PAID: 'Ce paiement a déjà été effectué',
  AMOUNT_TOO_HIGH: 'Le montant dépasse le restant dû',
  AMOUNT_TOO_LOW: 'Le montant minimum est de 0',
  RENTAL_NOT_FOUND: 'Location non trouvée',
  INVALID_PAYMENT_METHOD: 'Mode de paiement invalide',
} as const

// ==========================================
// Rental Errors
// ==========================================

export const RENTAL_ERRORS = {
  ALREADY_ACTIVE: 'Ce client a déjà une location active',
  NO_AVAILABLE_PROPERTIES: 'Aucune propriété disponible',
  DEPOSIT_NOT_PAID: 'Le deposit doit être payé avant la mise en place',
  CLIENT_NOT_FOUND: 'Client non trouvé',
  PROPERTY_NOT_FOUND: 'Propriété non trouvée',
} as const

// ==========================================
// Client Errors
// ==========================================

export const CLIENT_ERRORS = {
  ALREADY_ARCHIVED: 'Ce client est déjà archivé',
  ALREADY_BLACKLISTED: 'Ce client est déjà blacklisté',
  NOT_ARCHIVED: 'Ce client n\'est pas archivé',
  CANNOT_RESTORE: 'Impossible de restaurer ce client',
  CNI_ALREADY_EXISTS: 'Ce numéro CNI est déjà utilisé par un autre client',
} as const

// ==========================================
// UI Errors
// ==========================================

export const UI_ERRORS = {
  FORM_SUBMIT_FAILED: 'Erreur lors de l\'envoi du formulaire',
  LOADING_FAILED: 'Erreur lors du chargement des données',
  NO_RESULTS: 'Aucun résultat trouvé',
  UNAUTHORIZED_ACCESS: 'Accès non autorisé',
} as const

// ==========================================
// Success Messages
// ==========================================

export const SUCCESS_MESSAGES = {
  // Operations
  CREATED: 'Créé avec succès',
  UPDATED: 'Mis à jour avec succès',
  DELETED: 'Supprimé avec succès',
  SAVED: 'Enregistré avec succès',

  // Specific
  LOGIN_SUCCESS: 'Connexion réussie',
  LOGOUT_SUCCESS: 'Déconnexion réussie',
  PAYMENT_SUCCESS: 'Paiement enregistré',
  IMPORT_SUCCESS: 'Importation réussie',
  EXPORT_SUCCESS: 'Exportation réussie',
  UPLOAD_SUCCESS: 'Upload réussi',
} as const

// ==========================================
// Helper function
// ==========================================

/**
 * Get error message by key
 */
export function getErrorMessage(
  category: typeof AUTH_ERRORS | typeof VALIDATION_ERRORS | typeof API_ERRORS,
  key: string
): string {
  return category[key as keyof typeof category] || API_ERRORS.UNKNOWN
}

export default {
  AUTH: AUTH_ERRORS,
  VALIDATION: VALIDATION_ERRORS,
  API: API_ERRORS,
  PAYMENT: PAYMENT_ERRORS,
  RENTAL: RENTAL_ERRORS,
  CLIENT: CLIENT_ERRORS,
  UI: UI_ERRORS,
  SUCCESS: SUCCESS_MESSAGES,
}
