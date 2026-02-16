import { UseFormHandleSubmit, UseFormRegister, FieldErrors } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { InscriptionAdminData } from "@/validators/frontend";

interface FormulaireInscriptionAdminProps {
  register: UseFormRegister<InscriptionAdminData>;
  handleSubmit: UseFormHandleSubmit<InscriptionAdminData>;
  errors: FieldErrors<InscriptionAdminData>;
  loading: boolean;
  showPassword: boolean;
  showConfirmPassword: boolean;
  onTogglePassword: () => void;
  onToggleConfirmPassword: () => void;
  onSubmit: (data: InscriptionAdminData) => void | Promise<void>;
  onBack: () => void;
}

export default function FormulaireInscriptionAdmin({
  register,
  handleSubmit,
  errors,
  loading,
  showPassword,
  showConfirmPassword,
  onTogglePassword,
  onToggleConfirmPassword,
  onSubmit,
  onBack,
}: FormulaireInscriptionAdminProps) {
  return (
    <Card className="w-full rounded-2xl sm:rounded-[32px] border border-slate-200 sm:border-white/20 bg-white sm:bg-white/95 shadow-lg sm:shadow-[0_20px_60px_rgba(15,23,42,0.25)]">
      <CardHeader className="pb-4 px-5 pt-6 sm:px-8 sm:pt-6">
        <CardTitle className="text-[#0F2854] text-lg">Informations du compte</CardTitle>
        <CardDescription className="text-xs">Tous les champs obligatoires doivent être remplis.</CardDescription>
      </CardHeader>
      <CardContent className="pt-0 px-5 pb-6 sm:px-8 sm:pb-8">
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
                  onClick={onTogglePassword}
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
                  onClick={onToggleConfirmPassword}
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
            <Button type="button" variant="outline" onClick={onBack} className="border-[#0F2854] text-[#0F2854] hover:bg-blue-50 text-sm">
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
  );
}
