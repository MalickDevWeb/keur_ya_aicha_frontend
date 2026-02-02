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

const paymentSchema = z.object({
  amount: z.string().min(1, 'Montant requis').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    'Montant invalide'
  ),
  date: z.string().min(1, 'Date requise'),
  receiptNumber: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PaymentFormData) => void;
  isLoading?: boolean;
  maxAmount?: number;
  defaultValues?: Partial<PaymentFormData>;
  isEdit?: boolean;
}

export function PaymentModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
  maxAmount,
  defaultValues,
  isEdit = false,
}: PaymentModalProps) {
  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: defaultValues?.amount || '',
      date: defaultValues?.date || new Date().toISOString().split('T')[0],
      receiptNumber: defaultValues?.receiptNumber || '',
      notes: defaultValues?.notes || '',
    },
  });

  const handleSubmit = (data: PaymentFormData) => {
    if (maxAmount && Number(data.amount) > maxAmount) {
      form.setError('amount', {
        type: 'manual',
        message: `Le montant ne peut pas dépasser ${maxAmount.toLocaleString('fr-SN')} FCFA`,
      });
      return;
    }
    onSubmit(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Éditer le paiement' : 'Ajouter un paiement'}
          </DialogTitle>
          <DialogDescription>
            {maxAmount && (
              <span className="text-xs">
                Montant maximum: {maxAmount.toLocaleString('fr-SN')} FCFA
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

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
