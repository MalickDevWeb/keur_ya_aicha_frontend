export const CONFIRMATIONS = {
  DELETE_CLIENT: 'app.confirm.deleteClient',
  DELETE_RENTAL: 'app.confirm.deleteRental',
  DELETE_PAYMENT: 'app.confirm.deletePayment',
  ARCHIVE_CLIENT: 'app.confirm.archiveClient',
  UNARCHIVE_CLIENT: 'app.confirm.unarchiveClient',
  CANCEL_ACTION: 'app.confirm.cancelAction',
} as const

export const CONFIRMATIONS_FR: Record<string, string> = {
  [CONFIRMATIONS.DELETE_CLIENT]: 'Êtes-vous sûr de vouloir supprimer ce client ?',
  [CONFIRMATIONS.DELETE_RENTAL]: 'Êtes-vous sûr de vouloir supprimer cette location ?',
  [CONFIRMATIONS.DELETE_PAYMENT]: 'Êtes-vous sûr de vouloir supprimer ce paiement ?',
  [CONFIRMATIONS.ARCHIVE_CLIENT]: 'Êtes-vous sûr de vouloir archiver ce client ?',
  [CONFIRMATIONS.UNARCHIVE_CLIENT]: 'Êtes-vous sûr de vouloir désarchiver ce client ?',
  [CONFIRMATIONS.CANCEL_ACTION]: 'Êtes-vous sûr de vouloir annuler ?',
}

export const CONFIRMATIONS_EN: Record<string, string> = {
  [CONFIRMATIONS.DELETE_CLIENT]: 'Are you sure you want to delete this client?',
  [CONFIRMATIONS.DELETE_RENTAL]: 'Are you sure you want to delete this rental?',
  [CONFIRMATIONS.DELETE_PAYMENT]: 'Are you sure you want to delete this payment?',
  [CONFIRMATIONS.ARCHIVE_CLIENT]: 'Are you sure you want to archive this client?',
  [CONFIRMATIONS.UNARCHIVE_CLIENT]: 'Are you sure you want to unarchive this client?',
  [CONFIRMATIONS.CANCEL_ACTION]: 'Are you sure you want to cancel?',
}
