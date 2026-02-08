import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { createAdminRequest } from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const signupSchema = z.object({
  username: z.string().min(3, "Nom d'utilisateur requis (min. 3)"),
  name: z.string().min(2, "Nom complet requis"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  entrepriseName: z.string().min(2, "Entreprise requise"),
});

type SignupData = z.infer<typeof signupSchema>;

export default function AdminSignup() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      name: "",
      email: "",
      entrepriseName: "",
    },
  });

  const onSubmit = async (data: SignupData) => {
    setLoading(true);
    try {
      await createAdminRequest({
        id: crypto.randomUUID(),
        username: data.username.trim(),
        name: data.name.trim(),
        email: data.email?.trim() || undefined,
        entrepriseName: data.entrepriseName?.trim() || undefined,
        status: "EN_ATTENTE",
        createdAt: new Date().toISOString(),
      });

      addToast({
        type: "success",
        title: "Demande envoyée",
        message: "Votre demande a été soumise. Vous serez contacté après validation.",
        duration: 3000,
      });
      navigate("/login", { replace: true });
    } catch (e: any) {
      addToast({
        type: "error",
        title: "Erreur",
        message: e?.message || "Impossible d'envoyer la demande",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4 py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8">
        <div className="text-center text-white">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Gestion Locative</p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Demande d'accès administrateur</h1>
          <p className="mt-2 text-sm text-slate-300 sm:text-base">
            Demandez l’accès pour gérer vos clients et vos locations en toute sécurité.
          </p>
        </div>

        <Card className="w-full max-w-2xl border border-white/10 bg-white/95 shadow-2xl">
          <CardHeader>
            <CardTitle>Informations du compte admin</CardTitle>
            <CardDescription>L’entreprise est obligatoire pour créer un compte administrateur.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="username">Nom d'utilisateur</Label>
                  <Input id="username" placeholder="ex. admin_keur" {...register("username")} />
                  {errors.username && (
                    <p className="text-xs text-destructive">{errors.username.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet</Label>
                  <Input id="name" placeholder="Nom et prénom" {...register("name")} />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email (optionnel)</Label>
                  <Input id="email" placeholder="email@exemple.com" {...register("email")} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entrepriseName">Entreprise</Label>
                  <Input id="entrepriseName" placeholder="Nom de l’entreprise" {...register("entrepriseName")} />
                  {errors.entrepriseName && <p className="text-xs text-destructive">{errors.entrepriseName.message}</p>}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-slate-50 p-4 text-sm text-slate-600">
                Votre demande sera vérifiée par le Super Admin avant l'activation du compte.
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button type="button" variant="outline" onClick={() => navigate("/login")}>
                  Retour à la connexion
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Envoi..." : "Envoyer la demande"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
