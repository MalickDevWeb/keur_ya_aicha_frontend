export const MENU = {
  GROUP_PRINCIPAL: 'app.menu.group.principal',
  GROUP_GESTION: 'app.menu.group.gestion',
  GROUP_ADMINISTRATION: 'app.menu.group.administration',
  GROUP_SUPER_ADMIN: 'app.menu.group.superAdmin',

  DASHBOARD_LABEL: 'app.menu.dashboard',

  CLIENTS_LABEL: 'app.menu.clients.label',
  CLIENTS_LIST: 'app.menu.clients.list',
  CLIENTS_ADD: 'app.menu.clients.add',
  CLIENTS_IMPORT_SUCCESS: 'app.menu.clients.importSuccess',
  CLIENTS_IMPORT_ERRORS: 'app.menu.clients.importErrors',

  RENTALS_LABEL: 'app.menu.rentals.label',
  RENTALS_LIST: 'app.menu.rentals.list',
  RENTALS_ADD: 'app.menu.rentals.add',

  PAYMENTS_LABEL: 'app.menu.payments.label',
  PAYMENTS_MONTHLY: 'app.menu.payments.monthly',
  PAYMENTS_DEPOSIT: 'app.menu.payments.deposit',
  PAYMENTS_HISTORY: 'app.menu.payments.history',
  PAYMENTS_RECEIPTS: 'app.menu.payments.receipts',

  DOCUMENTS_LABEL: 'app.menu.documents.label',
  DOCUMENTS_ALL: 'app.menu.documents.all',
  DOCUMENTS_CONTRACTS: 'app.menu.documents.contracts',
  DOCUMENTS_RECEIPTS: 'app.menu.documents.receipts',
  DOCUMENTS_ARCHIVE: 'app.menu.documents.archive',

  ARCHIVE_ADMIN_LABEL: 'app.menu.archiveAdmin.label',
  ARCHIVE_CLIENTS: 'app.menu.archiveAdmin.clients',
  BLACKLIST: 'app.menu.archiveAdmin.blacklist',
  DANGER: 'app.menu.archiveAdmin.danger',
  SETTINGS_LABEL: 'app.menu.archiveAdmin.settings',
  WORK: 'app.menu.archiveAdmin.work',

  SUPER_ADMIN_LABEL: 'app.menu.superAdmin.label',
  SUPER_ADMIN_STATS: 'app.menu.superAdmin.stats',
  SUPER_ADMIN_ADMINS: 'app.menu.superAdmin.admins',
  SUPER_ADMIN_QUICK_ACCESS: 'app.menu.superAdmin.quickAccess',
  SUPER_ADMIN_LOGS: 'app.menu.superAdmin.logs',
  SUPER_ADMIN_PENDING: 'app.menu.superAdmin.pending',
  SUPER_ADMIN_ENTREPRISES: 'app.menu.superAdmin.entreprises',

  APP_TITLE: 'app.menu.app.title',
  APP_SUBTITLE: 'app.menu.app.subtitle',
  LOGOUT_LABEL: 'app.menu.logout',
} as const

export const MENU_FR: Record<string, string> = {
  [MENU.GROUP_PRINCIPAL]: 'Principal',
  [MENU.GROUP_GESTION]: 'Gestion',
  [MENU.GROUP_ADMINISTRATION]: 'Administration',
  [MENU.GROUP_SUPER_ADMIN]: 'Super Admin',

  [MENU.DASHBOARD_LABEL]: 'Tableau de bord',

  [MENU.CLIENTS_LABEL]: 'Clients',
  [MENU.CLIENTS_LIST]: 'Liste des clients',
  [MENU.CLIENTS_ADD]: 'Ajouter un client',
  [MENU.CLIENTS_IMPORT_SUCCESS]: 'Imports réussis',
  [MENU.CLIENTS_IMPORT_ERRORS]: "Erreurs d'import",

  [MENU.RENTALS_LABEL]: 'Locations',
  [MENU.RENTALS_LIST]: 'Liste des locations',
  [MENU.RENTALS_ADD]: 'Ajouter une location',

  [MENU.PAYMENTS_LABEL]: 'Paiements',
  [MENU.PAYMENTS_MONTHLY]: 'Paiements mensuels',
  [MENU.PAYMENTS_DEPOSIT]: 'Paiements de caution',
  [MENU.PAYMENTS_HISTORY]: 'Historique',
  [MENU.PAYMENTS_RECEIPTS]: 'Reçus',

  [MENU.DOCUMENTS_LABEL]: '📑 Gest Docs',
  [MENU.DOCUMENTS_ALL]: '📋 Tous les documents',
  [MENU.DOCUMENTS_CONTRACTS]: '📄 Contrats signés',
  [MENU.DOCUMENTS_RECEIPTS]: '🧾 Reçus de paiement',
  [MENU.DOCUMENTS_ARCHIVE]: '📎 Autres documents',

  [MENU.ARCHIVE_ADMIN_LABEL]: '⚙️ Gest Admin',
  [MENU.ARCHIVE_CLIENTS]: '🗂️ Clients archivés',
  [MENU.BLACKLIST]: '⛔ Blacklist',
  [MENU.DANGER]: '⚠️ Zone Danger',
  [MENU.SETTINGS_LABEL]: '⚙️ Paramètres',
  [MENU.WORK]: '📋 Travaux à faire',

  [MENU.SUPER_ADMIN_LABEL]: 'Super Admin',
  [MENU.SUPER_ADMIN_STATS]: 'Stats globales',
  [MENU.SUPER_ADMIN_ADMINS]: 'Liste admins + actions',
  [MENU.SUPER_ADMIN_QUICK_ACCESS]: 'Accès rapide',
  [MENU.SUPER_ADMIN_LOGS]: 'Logs / audit',
  [MENU.SUPER_ADMIN_PENDING]: 'Demandes en attente',
  [MENU.SUPER_ADMIN_ENTREPRISES]: 'Entreprises',

  [MENU.APP_TITLE]: 'Gestion Locative',
  [MENU.APP_SUBTITLE]: 'Administration',
  [MENU.LOGOUT_LABEL]: 'Déconnexion',
}

export const MENU_EN: Record<string, string> = {
  [MENU.GROUP_PRINCIPAL]: 'Main',
  [MENU.GROUP_GESTION]: 'Management',
  [MENU.GROUP_ADMINISTRATION]: 'Administration',
  [MENU.GROUP_SUPER_ADMIN]: 'Super Admin',

  [MENU.DASHBOARD_LABEL]: 'Dashboard',

  [MENU.CLIENTS_LABEL]: 'Clients',
  [MENU.CLIENTS_LIST]: 'Client List',
  [MENU.CLIENTS_ADD]: 'Add Client',
  [MENU.CLIENTS_IMPORT_SUCCESS]: 'Successful Imports',
  [MENU.CLIENTS_IMPORT_ERRORS]: 'Import Errors',

  [MENU.RENTALS_LABEL]: 'Rentals',
  [MENU.RENTALS_LIST]: 'Rental List',
  [MENU.RENTALS_ADD]: 'Add Rental',

  [MENU.PAYMENTS_LABEL]: 'Payments',
  [MENU.PAYMENTS_MONTHLY]: 'Monthly Payments',
  [MENU.PAYMENTS_DEPOSIT]: 'Deposit Payments',
  [MENU.PAYMENTS_HISTORY]: 'History',
  [MENU.PAYMENTS_RECEIPTS]: 'Receipts',

  [MENU.DOCUMENTS_LABEL]: '📑 Doc Mgmt',
  [MENU.DOCUMENTS_ALL]: '📋 All Documents',
  [MENU.DOCUMENTS_CONTRACTS]: '📄 Signed Contracts',
  [MENU.DOCUMENTS_RECEIPTS]: '🧾 Payment Receipts',
  [MENU.DOCUMENTS_ARCHIVE]: '📎 Other Documents',

  [MENU.ARCHIVE_ADMIN_LABEL]: '⚙️ Admin Mgmt',
  [MENU.ARCHIVE_CLIENTS]: '🗂️ Archived Clients',
  [MENU.BLACKLIST]: '⛔ Blacklist',
  [MENU.DANGER]: '⚠️ Danger Zone',
  [MENU.SETTINGS_LABEL]: '⚙️ Settings',
  [MENU.WORK]: '📋 To-Do List',

  [MENU.SUPER_ADMIN_LABEL]: 'Super Admin',
  [MENU.SUPER_ADMIN_STATS]: 'Global Stats',
  [MENU.SUPER_ADMIN_ADMINS]: 'Admin List + Actions',
  [MENU.SUPER_ADMIN_QUICK_ACCESS]: 'Quick Access',
  [MENU.SUPER_ADMIN_LOGS]: 'Logs / Audit',
  [MENU.SUPER_ADMIN_PENDING]: 'Pending Requests',
  [MENU.SUPER_ADMIN_ENTREPRISES]: 'Companies',

  [MENU.APP_TITLE]: 'Rental Management',
  [MENU.APP_SUBTITLE]: 'Administration',
  [MENU.LOGOUT_LABEL]: 'Logout',
}
