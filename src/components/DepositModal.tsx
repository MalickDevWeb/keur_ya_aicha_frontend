import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const depositSchema = z.object({
  amount: z
    .string()
    .min(1, 'Le montant est requis')
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      'Le montant doit être un nombre positif'
    )
    .refine(
      (val) => Number(val) < 100000000,
      'Le montant semble être invalide'
    ),
  date: z
    .string()
    .min(1, 'La date est requise'),
  receiptNumber: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[a-zA-Z0-9\-/]+$/.test(val),
      'Le numéro de reçu est invalide'
    ),
  notes: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length <= 500,
      'Les notes ne peuvent pas dépasser 500 caractères'
    ),
});

type DepositFormData = z.infer<typeof depositSchema>;

interface DepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: DepositFormData) => void;
  isLoading?: boolean;
  maxAmount?: number;
  currentPaid?: number;
  totalDeposit?: number;
  defaultValues?: Partial<DepositFormData>;
  isEdit?: boolean;
}

export function DepositModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
  maxAmount,
  currentPaid = 0,
  totalDeposit = 0,
  defaultValues,
  isEdit = false,
}: DepositModalProps) {
  const form = useForm<DepositFormData>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      amount: defaultValues?.amount || '',
      date: defaultValues?.date || new Date().toISOString().split('T')[0],
      receiptNumber: defaultValues?.receiptNumber || '',
      notes: defaultValues?.notes || '',
    },
  });

  const handleSubmit = (data: DepositFormData) => {
    if (maxAmount && Number(data.amount) > maxAmount) {
      form.setError('amount', {
        type: 'manual',
        message: `Le montant ne peut pas dépasser ${maxAmount.toLocaleString('fr-SN')} FCFA (reste à payer)`,
      });
      return;
    }
    onSubmit(data);
    form.reset();
  };

  const remaining = totalDeposit - currentPaid;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Éditer le paiement de caution' : 'Ajouter un paiement de caution'}
          </DialogTitle>
        </DialogHeader>

        {totalDeposit > 0 && (
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="bg-blue-50 p-3 rounded">
              <p className="text-xs text-muted-foreground">Caution Totale</p>
              <p className="font-semibold">{totalDeposit.toLocaleString('fr-SN')} FCFA</p>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <p className="text-xs text-muted-foreground">Déjà Payée</p>
              <p className="font-semibold">{currentPaid.toLocaleString('fr-SN')} FCFA</p>
            </div>
            <div className="bg-red-50 p-3 rounded">
              <p className="text-xs text-muted-foreground">À Percevoir</p>
              <p className="font-semibold text-red-600">{remaining.toLocaleString('fr-SN')} FCFA</p>
            </div>
          </div>
        )}

        {maxAmount && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Montant maximum: {maxAmount.toLocaleString('fr-SN')} FCFA
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Montant (FCFA)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="1000"
                      placeholder="0"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date du paiement</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="receiptNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Numéro de reçu (optionnel)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="REC-202601-XXXXXX"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ajouter des notes..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'Enregistrement...' : isEdit ? 'Mettre à jour' : 'Ajouter'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
