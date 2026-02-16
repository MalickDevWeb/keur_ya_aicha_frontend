import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

export type Language = 'fr' | 'en';

export type TranslationKey = string;

const translations: Record<Language, Record<TranslationKey, string>> = {
  fr: {
    // Navigation
    'nav.dashboard': 'Tableau de bord',
    'nav.clients': 'Clients',
    'nav.addClient': 'Ajouter client',
    'nav.settings': 'Paramètres',
    'nav.logout': 'Déconnexion',

    // Auth
    'auth.login': 'Connexion',
    'auth.username': 'Nom d\'utilisateur',
    'auth.password': 'Mot de passe',
    'auth.submit': 'Se connecter',
    'auth.error': 'Identifiants incorrects',
    'auth.welcome': 'Bienvenue',

    // Dashboard
    'dashboard.title': 'Tableau de bord',
    'dashboard.totalClients': 'Total clients',
    'dashboard.totalRentals': 'Total locations',
    'dashboard.paidRentals': 'Locations payées',
    'dashboard.unpaidRentals': 'Locations impayées',
    'dashboard.partialRentals': 'Paiements partiels',
    'dashboard.monthlyIncome': 'Encaissé ce mois',

    // Clients
    'clients.title': 'Liste des clients',
    'clients.search': 'Rechercher...',
    'clients.searchPlaceholder': 'Nom, prénom, téléphone ou CNI',
    'clients.name': 'Nom',
    'clients.firstName': 'Prénom',
    'clients.phone': 'Téléphone',
    'clients.cni': 'CNI',
    'clients.email': 'Email',
    'clients.rentals': 'Locations',
    'clients.status': 'Statut',
    'clients.actions': 'Actions',
    'clients.details': 'Détails',
    'clients.edit': 'Modifier',
    'clients.addRental': 'Ajouter location',
    'clients.noResults': 'Aucun client trouvé',

    // Add Client
    'addClient.title': 'Nouveau client',
    'addClient.personalInfo': 'Informations personnelles',
    'addClient.rentalInfo': 'Informations de location',
    'addClient.depositInfo': 'Informations de caution',
    'addClient.propertyType': 'Type de bien',
    'addClient.property': 'Bien loué',
    'addClient.startDate': 'Date de début',
    'addClient.monthlyRent': 'Loyer mensuel',
    'addClient.totalDeposit': 'Caution totale',
    'addClient.paidDeposit': 'Caution payée',
    'addClient.remainingDeposit': 'Reste à payer',
    'addClient.submit': 'Créer le client',
    'addClient.printContract': 'Imprimer contrat',

    // Property types
    'property.studio': 'Studio',
    'property.room': 'Chambre',
    'property.apartment': 'Appartement',
    'property.villa': 'Villa',
    'property.other': 'Autre',

    // Status
    'status.paid': 'Payé',
    'status.partial': 'Partiel',
    'status.unpaid': 'Non payé',
    'status.late': 'En retard',
    'status.active': 'Actif',
    'status.archived': 'Archivé',
    'status.blacklisted': 'Blacklisté',

    // Client Detail
    'detail.info': 'Informations',
    'detail.rentals': 'Locations',
    'detail.payments': 'Paiements',
    'detail.deposit': 'Caution',
    'detail.documents': 'Documents',
    'detail.archive': 'Archiver',
    'detail.blacklist': 'Blacklister',
    'detail.addPayment': 'Ajouter paiement',
    'detail.period': 'Période',
    'detail.dueDate': 'Date limite',
    'detail.amount': 'Montant',
    'detail.paidAmount': 'Payé',
    'detail.remaining': 'Reste',

    // Archive page
    'archive.title': 'Clients Archivés',
    'archive.description': 'Clients archivés et inactifs',
    'archive.totalArchived': 'Total Archivés',
    'archive.activeClients': 'Clients Actifs',
    'archive.propertiesArchived': 'Propriétés Archivées',
    'archive.table.fullName': 'Nom Complet',
    'archive.table.phone': 'Téléphone',
    'archive.table.cni': 'CNI',
    'archive.table.properties': 'Propriétés',
    'archive.table.archivedDate': "Date d'Archivage",
    'archive.table.status': 'Statut',
    'archive.table.actions': 'Actions',
    'archive.empty': 'Aucun client archivé',

    // Payments
    'payment.add': 'Ajouter un paiement',
    'payment.amount': 'Montant',
    'payment.date': 'Date',
    'payment.type': 'Type',
    'payment.monthly': 'Loyer mensuel',
    'payment.deposit': 'Caution',
    'payment.receipt': 'Reçu',
    'payment.download': 'Télécharger',
    'payment.send': 'Envoyer',
    'payment.whatsapp': 'WhatsApp',
    'payment.email': 'Email',
    'payment.telegram': 'Telegram',

    // Documents
    'document.upload': 'Téléverser',
    'document.contract': 'Contrat',
    'document.signed': 'Signé',
    'document.noDocuments': 'Aucun document',

    // Filters
    'filter.all': 'Tous',
    'filter.status': 'Statut',
    'filter.type': 'Type',
    'filter.property': 'Bien',

    // Common
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.delete': 'Supprimer',
    'common.confirm': 'Confirmer',
    'common.close': 'Fermer',
    'common.loading': 'Chargement...',
    'common.success': 'Succès',
    'common.error': 'Erreur',
    'common.currency': 'FCFA',
  },
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.clients': 'Clients',
    'nav.addClient': 'Add Client',
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',

    // Auth
    'auth.login': 'Login',
    'auth.username': 'Username',
    'auth.password': 'Password',
    'auth.submit': 'Sign In',
    'auth.error': 'Invalid credentials',
    'auth.welcome': 'Welcome',

    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.totalClients': 'Total Clients',
    'dashboard.totalRentals': 'Total Rentals',
    'dashboard.paidRentals': 'Paid Rentals',
    'dashboard.unpaidRentals': 'Unpaid Rentals',
    'dashboard.partialRentals': 'Partial Payments',
    'dashboard.monthlyIncome': 'Monthly Income',

    // Clients
    'clients.title': 'Client List',
    'clients.search': 'Search...',
    'clients.searchPlaceholder': 'Name, first name, phone or ID',
    'clients.name': 'Name',
    'clients.firstName': 'First Name',
    'clients.phone': 'Phone',
    'clients.cni': 'ID Number',
    'clients.email': 'Email',
    'clients.rentals': 'Rentals',
    'clients.status': 'Status',
    'clients.actions': 'Actions',
    'clients.details': 'Details',
    'clients.edit': 'Edit',
    'clients.addRental': 'Add Rental',
    'clients.noResults': 'No clients found',

    // Add Client
    'addClient.title': 'New Client',
    'addClient.personalInfo': 'Personal Information',
    'addClient.rentalInfo': 'Rental Information',
    'addClient.depositInfo': 'Deposit Information',
    'addClient.propertyType': 'Property Type',
    'addClient.property': 'Property',
    'addClient.startDate': 'Start Date',
    'addClient.monthlyRent': 'Monthly Rent',
    'addClient.totalDeposit': 'Total Deposit',
    'addClient.paidDeposit': 'Paid Deposit',
    'addClient.remainingDeposit': 'Remaining',
    'addClient.submit': 'Create Client',
    'addClient.printContract': 'Print Contract',

    // Property types
    'property.studio': 'Studio',
    'property.room': 'Room',
    'property.apartment': 'Apartment',
    'property.villa': 'Villa',
    'property.other': 'Other',

    // Status
    'status.paid': 'Paid',
    'status.partial': 'Partial',
    'status.unpaid': 'Unpaid',
    'status.late': 'Late',
    'status.active': 'Active',
    'status.archived': 'Archived',
    'status.blacklisted': 'Blacklisted',

    // Client Detail
    'detail.info': 'Information',
    'detail.rentals': 'Rentals',
    'detail.payments': 'Payments',
    'detail.deposit': 'Deposit',
    'detail.documents': 'Documents',
    'detail.archive': 'Archive',
    'detail.blacklist': 'Blacklist',
    'detail.addPayment': 'Add Payment',
    'detail.period': 'Period',
    'detail.dueDate': 'Due Date',
    'detail.amount': 'Amount',
    'detail.paidAmount': 'Paid',
    'detail.remaining': 'Remaining',

    // Archive page
    'archive.title': 'Archived Clients',
    'archive.description': 'Archived and inactive clients',
    'archive.totalArchived': 'Total Archived',
    'archive.activeClients': 'Active Clients',
    'archive.propertiesArchived': 'Properties Archived',
    'archive.table.fullName': 'Full name',
    'archive.table.phone': 'Phone',
    'archive.table.cni': 'ID Number',
    'archive.table.properties': 'Properties',
    'archive.table.archivedDate': 'Archived Date',
    'archive.table.status': 'Status',
    'archive.table.actions': 'Actions',
    'archive.empty': 'No archived clients',

    // Payments
    'payment.add': 'Add Payment',
    'payment.amount': 'Amount',
    'payment.date': 'Date',
    'payment.type': 'Type',
    'payment.monthly': 'Monthly Rent',
    'payment.deposit': 'Deposit',
    'payment.receipt': 'Receipt',
    'payment.download': 'Download',
    'payment.send': 'Send',
    'payment.whatsapp': 'WhatsApp',
    'payment.email': 'Email',
    'payment.telegram': 'Telegram',

    // Documents
    'document.upload': 'Upload',
    'document.contract': 'Contract',
    'document.signed': 'Signed',
    'document.noDocuments': 'No documents',

    // Filters
    'filter.all': 'All',
    'filter.status': 'Status',
    'filter.type': 'Type',
    'filter.property': 'Property',

    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.confirm': 'Confirm',
    'common.close': 'Close',
    'common.loading': 'Loading...',
    'common.success': 'Success',
    'common.error': 'Error',
    'common.currency': 'FCFA',
  },
};

type I18nContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

type I18nProviderProps = {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [language, setLanguage] = useState<Language>('fr');
  const [isLoading, setIsLoading] = useState(true);

  // Load language from server on mount
  useEffect(() => {
    let mounted = true;
    async function loadLanguage() {
      try {
        const { getSetting } = await import('@/services/api');
        const savedLang = await getSetting('language');
        if (!mounted) return;
        setLanguage((savedLang as Language) || 'fr');
      } catch {
        if (!mounted) return;
        setLanguage('fr');
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }
    loadLanguage();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSetLanguage = useCallback((lang: Language) => {
    setLanguage(lang);
    // Save to server
    void (async () => {
      const { setSetting } = await import('@/services/api');
      await setSetting('language', lang);
    })().catch(() => {});
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      return translations[language][key] || key;
    },
    [language]
  );

  if (isLoading) {
    return <div />;
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
