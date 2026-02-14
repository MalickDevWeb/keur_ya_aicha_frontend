import { forwardRef } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Landmark } from 'lucide-react';

interface ReceiptProps {
  type: 'payment' | 'deposit';
  clientName: string;
  propertyName: string;
  propertyType: string;
  amount: number;
  date: Date;
  receiptNumber: string;
  periodStart?: Date;
  periodEnd?: Date;
  monthlyRent?: number;
}

export const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(
  (
    {
      type,
      clientName,
      propertyName,
      propertyType,
      amount,
      date,
      receiptNumber,
      periodStart,
      periodEnd,
      monthlyRent,
    },
    ref
  ) => {
    const isPayment = type === 'payment';
    const now = new Date();

    return (
      <div
        ref={ref}
        className="w-full max-w-2xl bg-white p-8 text-gray-900"
        style={{ fontSize: '14px', fontFamily: 'system-ui, -apple-system, sans-serif' }}
      >
        {/* Header with Logo */}
        <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-blue-200">
          <div className="flex items-center gap-4">
            {/* Elegant Logo */}
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
                <Landmark className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Keur Ya Aïcha</h1>
              <p className="text-sm font-semibold text-blue-600">Gestion Immobilière Professionnelle</p>
              <p className="text-xs text-gray-500 mt-1">📍 Dakar, Sénégal</p>
            </div>
          </div>
          <div className="text-right bg-blue-50 px-4 py-3 rounded-lg border border-blue-200">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-widest mb-1">Reçu {isPayment ? 'de Paiement' : 'de Caution'}</p>
            <p className="text-lg font-bold text-gray-900">#{receiptNumber}</p>
          </div>
        </div>

        {/* Document Info */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Date du reçu</p>
            <p className="font-semibold">{format(now, 'dd MMMM yyyy', { locale: fr })}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Date du paiement</p>
            <p className="font-semibold">{format(date, 'dd MMMM yyyy', { locale: fr })}</p>
          </div>
        </div>

        {/* Client & Property Info */}
        <div className="bg-gray-50 p-4 rounded mb-8">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Client</p>
              <p className="font-semibold">{clientName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Bien loué</p>
              <p className="font-semibold">{propertyName}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Type de bien</p>
              <p className="text-sm">
                {propertyType === 'apartment' && 'Appartement'}
                {propertyType === 'house' && 'Maison'}
                {propertyType === 'shop' && 'Commerce'}
                {propertyType === 'office' && 'Bureau'}
                {propertyType === 'studio' && 'Studio'}
                {propertyType === 'room' && 'Chambre'}
                {propertyType === 'villa' && 'Villa'}
                {propertyType === 'other' && 'Autre'}
              </p>
            </div>
            {isPayment && monthlyRent && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Loyer mensuel</p>
                <p className="text-sm font-medium">{monthlyRent.toLocaleString('fr-SN')} FCFA</p>
              </div>
            )}
          </div>
        </div>

        {/* Period (for monthly payments) */}
        {isPayment && periodStart && periodEnd && (
          <div className="mb-8 p-4 border border-blue-200 bg-blue-50 rounded">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Période comptable</p>
            <p className="font-semibold">
              {format(periodStart, 'd MMMM', { locale: fr })} à{' '}
              {format(periodEnd, 'd MMMM yyyy', { locale: fr })}
            </p>
          </div>
        )}

        {/* Amount Details */}
        <div className="mb-8">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Description</p>
              <p className="font-semibold">
                {isPayment ? 'Paiement de loyer' : 'Paiement de caution'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Mode paiement</p>
              <p className="text-sm">Reçu</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Montant reçu</p>
              <p className="text-2xl font-bold text-green-600">
                {amount.toLocaleString('fr-SN')} FCFA
              </p>
            </div>
          </div>
        </div>

        {/* Summary Box */}
        <div className="bg-green-50 border-2 border-green-600 p-4 rounded mb-8">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Montant payé</p>
            <p className="text-4xl font-bold text-green-600">
              {amount.toLocaleString('fr-SN')}
            </p>
            <p className="text-sm text-gray-600 mt-2">Francs CFA</p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 pt-6 text-center">
          <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded mb-4">
            <p className="text-sm font-semibold text-green-800 mb-1">✓ Paiement Reçu</p>
            <p className="text-xs text-gray-600">
              Merci pour votre confiance. Ce reçu officiel valide la transaction mentionnée.
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Généré le {format(now, 'dd MMMM yyyy à HH:mm', { locale: fr })}
          </p>
          <p className="text-xs text-gray-400 mt-2">© 2026 Keur Ya Aïcha - Tous droits réservés</p>
        </div>

        {/* Print Instruction */}
        <div className="mt-6 pt-6 border-t text-center text-xs text-gray-400 print:hidden">
          <p>💡 Imprimez ou téléchargez en PDF pour conserver une copie de ce reçu</p>
        </div>
      </div>
    );
  }
);

Receipt.displayName = 'Receipt';
