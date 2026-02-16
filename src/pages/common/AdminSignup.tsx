import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { createAdminRequest } from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import { applyApiFieldErrors } from "@/utils/apiFieldErrors";
import { inscriptionAdminSchema, InscriptionAdminData } from "@/validators/frontend";
import BlocPresentation from "@/components/page_inscription/admin-signup/BlocPresentation";
import FormulaireInscriptionAdmin from "@/components/page_inscription/admin-signup/FormulaireInscriptionAdmin";
import DialogueSuccesInscription from "@/components/page_inscription/admin-signup/DialogueSuccesInscription";

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
      <div className="signup-shell relative min-h-screen bg-[#0F2854] px-4 py-8 overflow-hidden">
        <div className="signup-grid pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:48px_48px] opacity-100" />
        <div className="mx-auto w-full max-w-6xl">
          <div className="book-shell">
            <div className="book-ambient" />
            <div className="book-spine" />
            <div className="book-crease" />
            <div className="book-pages">
              <div className="book-left">
                <BlocPresentation />
              </div>
              <div className="book-right">
                <FormulaireInscriptionAdmin
                  register={register}
                  handleSubmit={handleSubmit}
                  errors={errors}
                  loading={loading}
                  showPassword={showPassword}
                  showConfirmPassword={showConfirmPassword}
                  onTogglePassword={() => setShowPassword((v) => !v)}
                  onToggleConfirmPassword={() => setShowConfirmPassword((v) => !v)}
                  onSubmit={onSubmit}
                  onBack={() => navigate("/login")}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <DialogueSuccesInscription
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        onClose={handleCloseDialog}
      />
      <style>{`
        .book-shell {
          position: relative;
          perspective: 2200px;
          transform-style: preserve-3d;
          animation: book-float 12s ease-in-out infinite;
          filter: drop-shadow(0 40px 110px rgba(6, 10, 32, 0.45));
        }
        .book-pages {
          display: flex;
          gap: 22px;
          position: relative;
          transform-style: preserve-3d;
          align-items: stretch;
          z-index: 2;
        }
        .book-left,
        .book-right {
          flex: 1 1 0%;
          min-width: 0;
          transform-style: preserve-3d;
          display: flex;
          position: relative;
          will-change: transform;
          backface-visibility: hidden;
          filter: drop-shadow(0 20px 40px rgba(6, 8, 28, 0.35));
        }
        .book-left {
          --page-dir: 1;
          transform-origin: right center;
          animation: page-open 4500ms cubic-bezier(0.22, 0.61, 0.36, 1) both;
        }
        .book-right {
          --page-dir: -1;
          transform-origin: left center;
          animation: page-open 4500ms cubic-bezier(0.22, 0.61, 0.36, 1) both;
        }
        .book-left > *,
        .book-right > * {
          flex: 1 1 0%;
          height: 100%;
        }
        .book-left::before,
        .book-right::before {
          content: "";
          position: absolute;
          top: 10px;
          bottom: 10px;
          width: 18px;
          pointer-events: none;
          opacity: 0.2;
          filter: blur(6px);
          animation: page-edge-glow 4500ms cubic-bezier(0.22, 0.61, 0.36, 1) both;
        }
        .book-left::before {
          right: -6px;
          background: linear-gradient(90deg, rgba(14,18,58,0), rgba(255,255,255,0.14));
        }
        .book-right::before {
          left: -6px;
          background: linear-gradient(90deg, rgba(255,255,255,0.14), rgba(14,18,58,0));
        }
        .book-left::after,
        .book-right::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 36px;
          pointer-events: none;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08), inset 0 10px 30px rgba(7,10,34,0.25);
          opacity: 0.2;
          animation: page-inner-shadow 4500ms cubic-bezier(0.22, 0.61, 0.36, 1) both;
        }
        .book-spine {
          position: absolute;
          left: 50%;
          top: 12px;
          bottom: 12px;
          width: 26px;
          transform: translateX(-50%);
          border-radius: 999px;
          background: linear-gradient(180deg, #050B1C, #020611);
          box-shadow: 0 0 30px rgba(2,4,12,0.8), inset 0 0 10px rgba(255,255,255,0.06);
          z-index: 3;
          opacity: 0.8;
        }
        .book-crease {
          position: absolute;
          left: 50%;
          top: 20px;
          bottom: 20px;
          width: 2px;
          transform: translateX(-50%);
          background: linear-gradient(180deg, rgba(255,255,255,0.2), rgba(255,255,255,0.04));
          box-shadow: 0 0 18px rgba(0,0,0,0.6);
          z-index: 4;
          opacity: 0.7;
        }
        .book-ambient {
          position: absolute;
          inset: -40px;
          border-radius: 40px;
          background: radial-gradient(circle at 30% 20%, rgba(108,140,255,0.35), transparent 45%),
            radial-gradient(circle at 70% 10%, rgba(88,120,255,0.28), transparent 50%),
            radial-gradient(circle at 50% 120%, rgba(12,16,54,0.7), transparent 60%);
          filter: blur(6px);
          z-index: 1;
          opacity: 0.9;
        }
        .book-left > * ,
        .book-right > * {
          position: relative;
          z-index: 1;
        }
        @keyframes page-open {
          0% { transform: rotateY(calc(var(--page-dir) * 96deg)) translateX(calc(var(--page-dir) * 40px)) translateZ(28px); opacity: 0.1; }
          55% { transform: rotateY(calc(var(--page-dir) * 26deg)) translateX(calc(var(--page-dir) * 10px)) translateZ(10px); opacity: 0.85; }
          100% { transform: rotateY(calc(var(--page-dir) * 18deg)) translateX(calc(var(--page-dir) * 2px)) translateZ(0); opacity: 1; }
        }
        @keyframes page-edge-glow {
          0% { opacity: 0.05; }
          60% { opacity: 0.35; }
          100% { opacity: 0.55; }
        }
        @keyframes page-inner-shadow {
          0% { opacity: 0.05; }
          60% { opacity: 0.45; }
          100% { opacity: 0.65; }
        }
        @keyframes book-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @media (max-width: 1024px) {
          .book-pages { flex-direction: column; gap: 20px; }
          .book-spine { display: none; }
          .book-left, .book-right { animation: none; transform: none; }
          .book-shell { animation: none; }
        }
        @media (max-width: 768px) {
          .signup-shell {
            background: #fff !important;
            padding: 24px 16px 32px !important;
          }
          .signup-grid {
            display: none !important;
          }
          .book-shell {
            filter: none !important;
          }
          .book-ambient,
          .book-spine,
          .book-crease {
            display: none !important;
          }
          .book-pages {
            gap: 0 !important;
          }
          .book-left {
            display: none !important;
          }
          .book-right {
            animation: none !important;
            transform: none !important;
            max-width: 560px;
            margin: 0 auto;
          }
        }
      `}</style>
    </>
  );
}
