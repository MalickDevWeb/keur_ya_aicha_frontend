import { useState } from 'react';
import { DollarSign, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/types';

interface QuickPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPayTotal: () => void;
  onPayPartial: (amount: number) => void;
  clientName: string;
  propertyName: string;
  amountDue: number;
}

export function QuickPaymentModal({
  open,
  onOpenChange,
  onPayTotal,
  onPayPartial,
  clientName,
  propertyName,
  amountDue,
}: QuickPaymentModalProps) {
  const [showPartialInput, setShowPartialInput] = useState(false);
  const [partialAmount, setPartialAmount] = useState(amountDue.toString());

  const handlePayPartial = () => {
    const amount = parseFloat(partialAmount);
    if (isNaN(amount) || amount <= 0 || amount > amountDue) {
      alert('Montant invalide');
      return;
    }
    onPayPartial(amount);
    onOpenChange(false);
  };

  const handlePayTotal = () => {
    onPayTotal();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Enregistrer un paiement
          </DialogTitle>
          <DialogDescription>
            Enregistrez rapidement le paiement du client
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Client Info */}
          <div className="bg-muted/50 p-3 rounded-lg space-y-1">
            <p className="text-sm text-muted-foreground">Client</p>
            <p className="font-semibold">{clientName}</p>
            <p className="text-sm text-muted-foreground">{propertyName}</p>
          </div>

          {/* Amount Due */}
          <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-muted-foreground mb-1">Montant dû</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(amountDue)} FCFA
            </p>
          </div>

          {/* Quick Actions */}
          <div className="space-y-3 pt-2">
            <Button
              onClick={handlePayTotal}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              Payer le total
            </Button>

            {!showPartialInput ? (
              <Button
                onClick={() => setShowPartialInput(true)}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Payer en partiel
              </Button>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="partial-amount" className="text-sm">
                    Montant à payer
                  </Label>
                  <Input
                    id="partial-amount"
                    type="number"
                    min="1"
                    max={amountDue}
                    value={partialAmount}
                    onChange={(e) => setPartialAmount(e.target.value)}
                    placeholder={formatCurrency(amountDue)}
                    className="text-lg font-semibold"
                  />
                  <p className="text-xs text-muted-foreground">
                    Max: {formatCurrency(amountDue)} FCFA
                  </p>
                </div>

                <Button
                  onClick={handlePayPartial}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  Confirmer
                </Button>

                <Button
                  onClick={() => setShowPartialInput(false)}
                  variant="ghost"
                  className="w-full"
                >
                  <X className="w-4 h-4 mr-2" />
                  Annuler
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
