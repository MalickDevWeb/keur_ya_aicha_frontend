import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { createAdminRequest } from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import { applyApiFieldErrors } from "@/utils/apiFieldErrors";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle2, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { inscriptionAdminSchema, InscriptionAdminData } from "@/validators/frontend";

export default function AdminSignup() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<InscriptionAdminData>({
    resolver: zodResolver(inscriptionAdminSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      password: "",
      confirmPassword: "",
      phone: "",
      email: "",
      entrepriseName: "",
    },
  });

  const onSubmit = async (data: InscriptionAdminData) => {
    setLoading(true);
    try {
      const normalizedPhone = data.phone.trim();
      const phoneDigits = normalizedPhone.replace(/\D/g, "");
      const lastThreeDigits = phoneDigits.slice(-3) || "000";
      const fallbackEntreprise = `${data.firstName.trim()} ${data.lastName.trim()} ${lastThreeDigits}`.trim();
      const entrepriseName = data.entrepriseName?.trim() || fallbackEntreprise;

      await createAdminRequest({
        id: crypto.randomUUID(),
        name: `${data.firstName.trim()} ${data.lastName.trim()}`.trim(),
        password: data.password,
        phone: data.phone.trim(),
        email: data.email?.trim() || undefined,
        entrepriseName,
        status: "EN_ATTENTE",
        createdAt: new Date().toISOString(),
      });

      setShowSuccessDialog(true);
    } catch (e: unknown) {
      const raw = e instanceof Error ? e.message : "Impossible d'envoyer la demande";
      const message = raw.includes(':') ? raw.split(':').slice(-1)[0].trim() : raw;
      applyApiFieldErrors(setError, message);
      addToast({
        type: "error",
        title: "Erreur",
        message: message || "Impossible d'envoyer la demande",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setShowSuccessDialog(false);
    navigate("/login", { replace: true });
  };

  return (
    <>
    <div className="min-h-screen bg-[#0F2854] px-4 py-8">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(74,124,255,0.18),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(15,40,84,0.35),transparent_55%),linear-gradient(135deg,#0F2854,#0B1C3D,#0F2854)] p-8 text-white shadow-[0_30px_90px_rgba(9,24,54,0.6)]">
          <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-[#4A7CFF]/15 blur-3xl" />
          <div className="absolute -left-20 bottom-0 h-52 w-52 rounded-full bg-[#0F2854]/30 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,0.08),transparent_40%),linear-gradient(transparent,rgba(15,23,42,0.6))]" />
          <div className="pointer-events-none absolute right-10 top-10 h-24 w-24 rounded-full border border-white/10 bg-white/5 blur-[1px]" />
          <div className="relative z-10 flex h-full flex-col justify-between gap-6">
            <div>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/95 shadow-lg ring-1 ring-white/20">
                  <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-blue-200">Gestion Locative</p>
                  <h1 className="mt-2 text-3xl font-semibold font-serif">Inscription Administrateur</h1>
                </div>
              </div>
              <p className="text-sm text-slate-200 max-w-md">
                Gérez vos locations et vos clients en toute simplicité. Accédez à un tableau de bord complet,
                des alertes de paiements, et un suivi en temps réel.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#4A7CFF] shadow-[0_0_12px_rgba(74,124,255,0.9)]" />
                  <p className="text-xs uppercase tracking-[0.2em] text-blue-200">Rapide</p>
                </div>
                <p className="mt-2 text-base font-medium text-white">Validation sous 24h ouvrées</p>
                <p className="text-xs text-slate-200">Votre demande est vérifiée avant activation.</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#8FA8FF] shadow-[0_0_12px_rgba(143,168,255,0.9)]" />
                  <p className="text-xs uppercase tracking-[0.2em] text-blue-200">Sécurisé</p>
                </div>
                <p className="mt-2 text-base font-medium text-white">Accès personnalisé</p>
                <p className="text-xs text-slate-200">Identifiants uniques et gestion sécurisée.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {['Tableau de bord', 'Alertes paiements', 'Suivi temps réel'].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-wide text-slate-200"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-white/5 via-white/10 to-white/5 p-4 text-xs text-slate-200 shadow-[0_10px_30px_rgba(15,23,42,0.35)]">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300">Support</p>
              <p className="mt-2 text-sm font-medium text-white">
                Vous pouvez nous contacter pour plus d'info
              </p>
              <p className="mt-1 text-sm text-blue-200">+221 77 171 90 13</p>
            </div>
          </div>
        </div>

        <Card className="w-full rounded-[32px] border border-white/20 bg-white/95 shadow-[0_20px_60px_rgba(15,23,42,0.25)]">
          <CardHeader className="pb-4">
            <CardTitle className="text-[#0F2854] text-lg">Informations du compte</CardTitle>
            <CardDescription className="text-xs">Tous les champs obligatoires doivent être remplis.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="firstName" className="text-[#0F2854] text-sm font-medium">Prénom</Label>
                  <Input id="firstName" placeholder="Votre prénom" className="border-slate-300 focus:border-[#0F2854] focus:ring-[#0F2854]" {...register("firstName")} />
                  {errors.firstName && (
                    <p className="text-xs text-destructive">{errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lastName" className="text-[#0F2854] text-sm font-medium">Nom</Label>
                  <Input id="lastName" placeholder="Votre nom" className="border-slate-300 focus:border-[#0F2854] focus:ring-[#0F2854]" {...register("lastName")} />
                  {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="password" className="text-[#0F2854] text-sm font-medium">Mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Votre mot de passe"
                      className="border-slate-300 pr-12 focus:border-[#0F2854] focus:ring-[#0F2854]"
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#0F2854]"
                      aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="confirmPassword" className="text-[#0F2854] text-sm font-medium">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirmez le mot de passe"
                      className="border-slate-300 pr-12 focus:border-[#0F2854] focus:ring-[#0F2854]"
                      {...register("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#0F2854]"
                      aria-label={showConfirmPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="phone" className="text-[#0F2854] text-sm font-medium">Téléphone</Label>
                <Input id="phone" placeholder="+221 77 123 45 67" className="border-slate-300 focus:border-[#0F2854] focus:ring-[#0F2854]" {...register("phone")} />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-[#0F2854] text-sm font-medium">Email <span className="text-slate-400 font-normal">(optionnel)</span></Label>
                  <Input id="email" type="email" placeholder="email@exemple.com" className="border-slate-300 focus:border-[#0F2854] focus:ring-[#0F2854]" {...register("email")} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="entrepriseName" className="text-[#0F2854] text-sm font-medium">Entreprise <span className="text-slate-400 font-normal">(optionnel)</span></Label>
                  <Input id="entrepriseName" placeholder="Nom de votre entreprise" className="border-slate-300 focus:border-[#0F2854] focus:ring-[#0F2854]" {...register("entrepriseName")} />
                  {errors.entrepriseName && <p className="text-xs text-destructive">{errors.entrepriseName.message}</p>}
                </div>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-[#0F2854]">
                <strong>Validation :</strong> Votre demande sera vérifiée avant l'activation.
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-2">
                <Button type="button" variant="outline" onClick={() => navigate("/login")} className="border-[#0F2854] text-[#0F2854] hover:bg-blue-50 text-sm">
                  ← Retour à la connexion
                </Button>
                <Button type="submit" disabled={loading} className="bg-gradient-to-r from-[#0F2854] to-[#123A74] hover:from-[#0C2450] hover:to-[#123A74] text-white text-sm shadow-[0_12px_30px_rgba(15,40,84,0.35)]">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {loading ? "Envoi..." : "Envoyer la demande"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>

    {/* Success Dialog */}
    <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
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
          <Button onClick={handleCloseDialog} className="bg-[#0F2854] hover:bg-[#1C4D8D] w-full">
            Retour à la connexion
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
