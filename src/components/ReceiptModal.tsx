import { useRef } from 'react';
import { Download, Printer, X } from 'lucide-react';
import { format } from 'date-fns';
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
    // Use pdfUtils to generate a branded PDF and offer download/share
    (async () => {
      try {
        const { generatePdfForDocument, downloadBlob, shareBlobViaWebShare } = await import('@/lib/pdfUtils');
        const docForPdf: any = {
          payerName: clientName,
          payerPhone: '',
          amount,
          uploadedAt: date || new Date(),
          name: `${receiptNumber}`,
          note: type === 'payment' && periodStart ? `Période: ${format(periodStart, 'dd/MM/yyyy')} - ${format(periodEnd || new Date(), 'dd/MM/yyyy')}` : undefined,
        };
        const blob = await generatePdfForDocument(docForPdf);
        downloadBlob(blob, `${docForPdf.name || 'recu'}.pdf`);
        const shared = await shareBlobViaWebShare(blob, `${docForPdf.name || 'recu'}.pdf`, `Reçu: ${docForPdf.name}`);
        if (!shared) {
          try {
            const { uploadBlobToFileIo } = await import('@/lib/pdfUtils');
            const link = await uploadBlobToFileIo(blob, `${docForPdf.name || 'recu'}.pdf`);
            window.open(`https://wa.me/?text=${encodeURIComponent(`Reçu ${docForPdf.name} pour ${clientName}: ${link}`)}`, '_blank');
          } catch (e) {
            window.open(`https://wa.me/?text=${encodeURIComponent(`Reçu ${docForPdf.name} pour ${clientName}`)}`, '_blank');
          }
        }
      } catch (e: any) {
        alert(e?.message || 'Impossible de générer le PDF.');
      }
    })();
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
