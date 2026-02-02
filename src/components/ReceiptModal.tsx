import { useRef } from 'react';
import { Download, Printer, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Receipt } from './Receipt';

interface ReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function ReceiptModal({
  open,
  onOpenChange,
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
}: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (receiptRef.current) {
      const printWindow = window.open('', '', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(receiptRef.current.innerHTML);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleDownloadPDF = () => {
    if (receiptRef.current) {
      const html = receiptRef.current.innerHTML;
      // Create blob and download
      const printWindow = window.open('', '', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Reçu ${receiptNumber}</title>
              <style>
                body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 20px; }
                @media print {
                  body { margin: 0; padding: 0; }
                }
              </style>
            </head>
            <body>
              ${html}
              <script>
                window.addEventListener('load', () => {
                  window.print();
                  setTimeout(() => window.close(), 500);
                });
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>
            Reçu {type === 'payment' ? 'de paiement' : 'de caution'}
          </DialogTitle>
        </DialogHeader>

        {/* Receipt Preview */}
        <div className="px-6 py-4 bg-gray-50 overflow-auto">
          <div className="flex justify-center">
            <Receipt
              ref={receiptRef}
              type={type}
              clientName={clientName}
              propertyName={propertyName}
              propertyType={propertyType}
              amount={amount}
              date={date}
              receiptNumber={receiptNumber}
              periodStart={periodStart}
              periodEnd={periodEnd}
              monthlyRent={monthlyRent}
            />
          </div>
        </div>

        <DialogFooter className="px-6 pb-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-4 h-4 mr-2" />
            Fermer
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handlePrint}
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimer
          </Button>
          <Button
            type="button"
            onClick={handleDownloadPDF}
            className="bg-secondary hover:bg-secondary/90"
          >
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
