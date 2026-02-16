import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface DialogueSuccesInscriptionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}

export default function DialogueSuccesInscription({
  open,
  onOpenChange,
  onClose,
}: DialogueSuccesInscriptionProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <DialogTitle className="text-xl font-serif text-[#0F2854]">Demande soumise avec succès !</DialogTitle>
          <DialogDescription className="text-center text-slate-600">
            Votre demande d'inscription administrateur a été soumise avec succès.
            <br /><br />
            Notre équipe va vérifier votre demande et vous contactera soon pour l'activation de votre compte.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <Button onClick={onClose} className="bg-[#0F2854] hover:bg-[#1C4D8D] w-full">
            Retour à la connexion
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
