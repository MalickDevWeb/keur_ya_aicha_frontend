import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Lock, Volume2, VolumeX, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

// ─── 1. Validation schema ────────────────────────────────────────────
const loginSchema = z.object({
  nomUtilisateur: z.string().min(1, "Nom d'utilisateur requis"),
  motDePasse: z.string().min(1, "Mot de passe requis"),
});
type LoginData = z.infer<typeof loginSchema>;

// ─── InputField Component ──────────────────────────────────────────────
interface FieldProps {
  label: string;
  name: "nomUtilisateur" | "motDePasse";
  icon: React.ReactNode;
  placeholder: string;
  type?: string;
  error?: string;
  register: any;
  watch: string;
  rightIcon?: React.ReactNode;
}

function InputField({ label, name, icon, placeholder, type = "text", error, register: reg, watch: watchValue, rightIcon }: FieldProps) {
  const [focused, setFocused] = useState(false);
  const hasValue = watchValue && watchValue.length > 0;
  const active = focused || hasValue;

  return (
    <div style={{ marginBottom: 28 }}>
      {/* Label */}
      <label
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: "1.4px",
          textTransform: "uppercase",
          color: active ? "#4a7cff" : "#7a8fa8",
          marginBottom: 10,
          transition: "color .25s",
        }}
      >
        {label}
      </label>

      {/* Input wrapper */}
      <div
        style={{
          position: "relative",
          borderRadius: 16,
          border: `2px solid ${error ? "#ef4444" : focused ? "#4a7cff" : hasValue ? "#cbd5e1" : "#e2e8f0"}`,
          background: "#fff",
          boxShadow: focused ? "0 0 0 4px rgba(74,124,255,.13)" : "none",
          transition: "border-color .25s, box-shadow .25s",
        }}
      >
        {/* Left icon */}
        <span
          style={{
            position: "absolute",
            left: 18,
            top: "50%",
            transform: "translateY(-50%)",
            color: focused ? "#4a7cff" : "#64748b",
            display: "flex",
            alignItems: "center",
            transition: "color .25s",
            pointerEvents: "none",
          }}
        >
          {icon}
        </span>

        <input
          id={name}
          type={type}
          placeholder={placeholder}
          value={watchValue || ""}
          {...reg}
          onFocus={() => setFocused(true)}
          onBlur={(e) => {
            setFocused(false);
            reg.onBlur(e);
          }}
          style={{
            width: "100%",
            padding: "16px 48px 16px 52px",
            border: "none",
            background: "transparent",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 16,
            fontWeight: 500,
            color: "#000000",
            outline: "none",
            borderRadius: 16,
          }}
        />

        {/* Right icon (e.g. eye toggle) */}
        {rightIcon && (
          <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)" }}>
            {rightIcon}
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <p style={{ marginTop: 6, fontSize: 12, color: "#ef4444", fontWeight: 500 }}>
          {error}
        </p>
      )}
    </div>
  );
}

// ─── 2. Main Page ─────────────────────────────────────────────────────
export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [isMuted, setIsMuted] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { nomUtilisateur: "", motDePasse: "" },
  });

  // Watch form values for the InputField components
  const watchNomUtilisateur = watch("nomUtilisateur");
  const watchMotDePasse = watch("motDePasse");

  // Video auto-play logic
  useEffect(() => {
    const playVideo = async () => {
      if (videoRef.current) {
        try {
          await videoRef.current.play();
          videoRef.current.muted = false;
          setIsMuted(false);
        } catch {
          videoRef.current.muted = true;
          setIsMuted(true);
          await videoRef.current.play();
        }
      }
    };
    playVideo();
  }, []);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!videoRef.current.muted);
    }
  };

  const onSubmit = async (data: LoginData) => {
    setLoading(true);
    setLoginError("");
    try {
      const success = await login(data.nomUtilisateur, data.motDePasse);
      if (success) {
        navigate("/dashboard", { replace: true });
      } else {
        setLoginError("Identifiants invalides");
      }
    } catch (e: any) {
      setLoginError(e.message || "Erreur lors de la connexion");
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  // ─── styles constants
  const NAVY = "#0F2854";
  const NAVY_MID = "#162d5e";
  const ACCENT = "#4a7cff";

  return (
    <>
      {/* Google Font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />

      {/* Hidden SVG clipPath for wavy border */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <clipPath id="wave-clip" clipPathUnits="objectBoundingBox">
            <path
              d="
                M 0 0
                L 1 0
                C 1 0.08, 0.84 0.14, 1 0.2
                C 1.16 0.26, 0.84 0.32, 1 0.38
                C 1.16 0.44, 0.84 0.5, 1 0.56
                C 1.16 0.62, 0.84 0.68, 1 0.74
                C 1.16 0.8, 0.84 0.86, 1 0.92
                C 1.16 0.96, 1 1, 1 1
                L 0 1
                Z
              "
            />
          </clipPath>
        </defs>
      </svg>

      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          fontFamily: "'DM Sans', sans-serif",
          background: NAVY,
        }}
      >
        {/* ════════════════ LEFT — Video panel ════════════════ */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "",
            alignItems: "center",
            padding: "60px 48px",
            overflow: "hidden",
            clipPath: "url(#wave-clip)",
          }}
        >
          {/* Exceptional diagonal separator */}
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              width: "20px",
              height: "100%",
              background: "linear-gradient(135deg, transparent 50%, #fff 50%)",
              zIndex: 1,
            }}
          />
          {/* Ambient blobs */}
          <div
            style={{
              position: "absolute", width: 420, height: 420,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(74,124,255,.22) 0%, transparent 70%)",
              filter: "blur(70px)",
              top: -140, left: -100,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute", width: 300, height: 300,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(108,59,224,.18) 0%, transparent 70%)",
              filter: "blur(60px)",
              bottom: -80, right: -60,
              pointerEvents: "none",
            }}
          />

          {/* Subtle grid */}
          <div
            style={{
              position: "absolute", inset: 0,
              backgroundImage: `
                linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)
              `,
              backgroundSize: "48px 48px",
              pointerEvents: "none",
            }}
          />

          {/* Content */}
          <div style={{ position: "relative", zIndex: 2, textAlign: "center", width: "100%" }}>
            {/* Logo */}
            <div
              style={{
                width: 220, height: 220, borderRadius: 100, margin: "0 auto 24px",
                background: "linear-gradient(135deg, rgb(255, 255, 255), rgb(255, 255, 255))",
                border: "1.5px solid rgba(74,124,255,.3)",
                backdropFilter: "blur(12px)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 8px 40px rgba(74,124,255,.15)",
              }}
            >
              <img src="/logo.png" alt="KYA" style={{ width: 200, height: 200, objectFit: "contain", borderRadius: 16 }} />
            </div>

            <h1
              style={{
                fontFamily: "'Playfair Display', serif",
                color: "#fff",
                fontSize: 30,
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              Keur Ya Aicha
            </h1>
            <p
              style={{
                color: "#c9a84c",
                fontSize: 11,
                fontWeight: 300,
                letterSpacing: "3.5px",
                textTransform: "uppercase",
                marginBottom: 40,
              }}
            >
              Location Immobilier & Services
            </p>

            {/* Video */}
            <div style={{ position: "relative", maxWidth: 520, margin: "0 auto" }}>
              {/* TV Screen Frame */}
              <div
                style={{
                  borderRadius: 20,
                  overflow: "hidden",
                  background: "#0a0a0a",
                  padding: 8,
                  boxShadow: "0 15px 45px rgba(0,0,0,.45), 0 4px 15px rgba(0,0,0,.2)",
                }}
              >
                <div
                  style={{
                    borderRadius: 14,
                    overflow: "hidden",
                    background: "#000",
                    position: "relative",
                  }}
                >
                  {/* Screen Glare Effect */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "50%",
                      background: "linear-gradient(180deg, rgba(255,255,255,.03) 0%, transparent 100%)",
                      pointerEvents: "none",
                      zIndex: 1,
                    }}
                  />
                  {/* Samsung Logo */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: 12,
                      right: 16,
                      fontFamily: "Arial, sans-serif",
                      fontSize: 10,
                      fontWeight: 700,
                      color: "rgba(255,255,255,.35)",
                      letterSpacing: 1,
                      zIndex: 2,
                    }}
                  >
                    SAMSUNG
                  </div>
                  <video
                    ref={videoRef}
                    autoPlay
                    loop
                    playsInline
                    style={{ width: "100%", display: "block", borderRadius: 10 }}
                  >
                    <source src="/VIDEO.mp4" type="video/mp4" />
                  </video>
                </div>
              </div>

              {/* Mute toggle */}
              <button
                onClick={toggleMute}
                style={{
                  position: "absolute", bottom: 14, left: 14,
                  width: 42, height: 42, borderRadius: "50%",
                  background: "rgba(0,0,0,.55)",
                  border: "1px solid rgba(255,255,255,.15)",
                  backdropFilter: "blur(6px)",
                  color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                  transition: "background .2s",
                }}
                onMouseEnter={(e) => ((e.target as any).style.background = "rgba(0,0,0,.72)")}
                onMouseLeave={(e) => ((e.target as any).style.background = "rgba(0,0,0,.55)")}
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
            </div>
          </div>

          {/* Footer */}
          <p
            style={{
              position: "absolute", bottom: 28,
              color: "rgba(255,255,255,.18)",
              fontSize: 11, letterSpacing: "1px",
            }}
          >
            © 2025 Keur Ya Aicha — Dakar, Sénégal
          </p>
        </div>

        {/* ════════════════ RIGHT — Form panel ════════════════ */}
        <div
          style={{
            background: "#fff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            padding: "60px 36px",
            position: "relative",
            overflow: "hidden",
          }}
        >

          <div style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 480 }}>
            {/* Logo centered at top */}
            <div
              style={{
                width: 140, height: 140, borderRadius: 100,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 32px",
              }}
            >
              <img src="/logo.png" alt="KYA" style={{ width: 100, height: 100, objectFit: "contain" }} />
            </div>

            <div style={{ textAlign: "center" }}>
              <h2
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 36,
                  color: NAVY,
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                Bienvenue
              </h2>
              <p style={{ color: "#7a8fa8", fontSize: 17, fontWeight: 300, marginBottom: 48 }}>
                Entrez vos identifiants pour accéder
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)}>
              <InputField
                label="Nom d'utilisateur"
                name="nomUtilisateur"
                icon={<User size={18} />}
                placeholder="admin"
                error={errors.nomUtilisateur?.message}
                watch={watchNomUtilisateur || ""}
                register={register("nomUtilisateur")}
                rightIcon={null}
              />

              <InputField
                label="Mot de passe"
                name="motDePasse"
                icon={<Lock size={18} />}
                placeholder="••••••••"
                type={showPass ? "text" : "password"}
                error={errors.motDePasse?.message}
                watch={watchMotDePasse || ""}
                register={register("motDePasse")}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "#94a3b8", padding: 4,
                      display: "flex", alignItems: "center",
                      transition: "color .2s",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as any).style.color = ACCENT)}
                    onMouseLeave={(e) => ((e.currentTarget as any).style.color = "#94a3b8")}
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />

              {/* Forgot password */}
              <div style={{ textAlign: "right", marginTop: -16, marginBottom: 28 }}>
                <a
                  href="#"
                  style={{
                    fontSize: 12, color: ACCENT, textDecoration: "none", fontWeight: 500,
                  }}
                >

                </a>
              </div>

              {/* Global error */}
              {loginError && (
                <div
                  style={{
                    background: "#fef2f2", border: "1px solid #fecaca",
                    borderRadius: 10, padding: "10px 14px",
                    marginBottom: 18,
                    fontSize: 13, color: "#dc2626", fontWeight: 500,
                  }}
                >
                  {loginError}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  width: "100%", padding: "22px 0",
                  border: "none", borderRadius: 16,
                  background: `linear-gradient(135deg, ${NAVY}, ${NAVY_MID})`,
                  color: "#fff",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 17,
                  fontWeight: 600,
                  letterSpacing: "1.3px",
                  textTransform: "uppercase",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? .7 : 1,
                  boxShadow: "0 4px 22px rgba(15,40,84,.3)",
                  transition: "transform .2s, box-shadow .2s, opacity .2s",
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    (e.currentTarget as any).style.transform = "translateY(-2px)";
                    (e.currentTarget as any).style.boxShadow = "0 6px 30px rgba(15,40,84,.4)";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as any).style.transform = "translateY(0)";
                  (e.currentTarget as any).style.boxShadow = "0 4px 22px rgba(15,40,84,.3)";
                }}
              >
                {loading ? "Connexion…" : <>Se connecter <ArrowRight size={20} /></>}
              </button>
            </form>

          </div>
        </div>
      </div>
    </>
  );
}

