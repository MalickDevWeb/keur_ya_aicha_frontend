export default function BlocPresentation() {
  return (
    <div className="relative overflow-hidden rounded-[36px] border border-white/15 bg-[#0F2854] p-8 text-white shadow-[0_35px_90px_rgba(7,10,34,0.7)]">
      <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-[#7EA2FF]/20 blur-3xl animate-float-slow" />
      <div className="absolute -left-24 -bottom-10 h-60 w-60 rounded-full bg-[#1B1F5E]/45 blur-3xl animate-float-slower" />
      <div className="pointer-events-none absolute inset-0 bg-black/15" />
      <div className="pointer-events-none absolute right-8 top-10 h-28 w-28 rounded-full border border-white/10 bg-white/5 blur-[1px] animate-pulse-soft" />
      <div className="relative z-10 flex h-full flex-col justify-between gap-6">
        <div>
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E5ECFF] via-white to-[#C7D6FF] shadow-[0_12px_24px_rgba(14,20,60,0.35)] ring-1 ring-white/40">
              <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[#B9CCFF]">Gestion Locative</p>
              <h1 className="mt-2 text-3xl font-semibold font-serif">Inscription Administrateur</h1>
            </div>
          </div>
          <p className="text-sm text-slate-200 max-w-md">
            Gérez vos locations et vos clients en toute simplicité. Accédez à un tableau de bord complet,
            des alertes de paiements, et un suivi en temps réel.
          </p>
        </div>

        <div className="grid gap-4">
          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#7EA2FF] shadow-[0_0_12px_rgba(126,162,255,0.9)] animate-pulse" />
              <p className="text-xs uppercase tracking-[0.2em] text-[#B9CCFF]">Rapide</p>
            </div>
            <p className="mt-2 text-base font-medium text-white">Validation sous 24h ouvrées</p>
            <p className="text-xs text-slate-200">Votre demande est vérifiée avant activation.</p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur animate-fade-in" style={{ animationDelay: "80ms" }}>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#9FB5FF] shadow-[0_0_12px_rgba(159,181,255,0.9)] animate-pulse" />
              <p className="text-xs uppercase tracking-[0.2em] text-[#B9CCFF]">Sécurisé</p>
            </div>
            <p className="mt-2 text-base font-medium text-white">Accès personnalisé</p>
            <p className="text-xs text-slate-200">Identifiants uniques et gestion sécurisée.</p>
          </div>
          <div className="flex flex-wrap gap-2 animate-fade-in" style={{ animationDelay: "140ms" }}>
            {["Tableau de bord", "Alertes paiements", "Suivi temps réel"].map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-wide text-slate-200 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-white/5 via-white/10 to-white/5 p-4 text-xs text-slate-200 shadow-[0_10px_30px_rgba(10,14,40,0.45)] animate-fade-in" style={{ animationDelay: "200ms" }}>
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#C7D6FF]">Support</p>
          <p className="mt-2 text-sm font-medium text-white">Vous pouvez nous contacter pour plus d'info</p>
          <p className="mt-1 text-sm text-[#B9CCFF]">+221 77 171 90 13</p>
        </div>
      </div>
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes float-slower {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(16px); }
        }
        @keyframes shimmer-soft {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.35; }
        }
        @keyframes pulse-soft {
          0%, 100% { transform: scale(1); opacity: 0.35; }
          50% { transform: scale(1.08); opacity: 0.65; }
        }
        .animate-float-slow {
          animation: float-slow 10s ease-in-out infinite;
        }
        .animate-float-slower {
          animation: float-slower 14s ease-in-out infinite;
        }
        .animate-shimmer-soft {
          animation: shimmer-soft 8s ease-in-out infinite;
        }
        .animate-pulse-soft {
          animation: pulse-soft 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
