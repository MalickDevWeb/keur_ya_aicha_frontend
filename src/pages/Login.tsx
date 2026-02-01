import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Lock, Volume2, VolumeX, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Redirect } from "wouter";
import { useState, useRef, useEffect } from "react";

// ─── 1. Validation schema ────────────────────────────────────────────
const loginSchema = z.object({
  nomUtilisateur: z.string().min(1, "Nom d'utilisateur requis"),
  motDePasse: z.string().min(1, "Mot de passe requis"),
});
type LoginData = z.infer<typeof loginSchema>;

// ─── 2. Fake auth (swap with real API) ───────────────────────────────
const fakeLogin = async (username: string, password: string) => {
  if (username === "admin" && password === "password123") {
    localStorage.setItem("user", JSON.stringify({ username }));
    return { username };
  }
  throw new Error("Identifiants invalides");
};

// ─── 3. Tiny reusable input ───────────────────────────────────────────
interface FieldProps {
  label: string;
  name: "nomUtilisateur" | "motDePasse";
  icon: React.ReactNode;
  placeholder: string;
  type?: string;
  error?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  rightIcon?: React.ReactNode;
}

function InputField({ label, icon, placeholder, type = "text", error, value, onChange, onBlur, rightIcon }: FieldProps) {
  const [focused, setFocused] = useState(false);
  const hasValue = value.length > 0;
  const active = focused || hasValue;

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Label */}
      <label
        style={{
          display: "block",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "1.4px",
          textTransform: "uppercase",
          color: active ? "#4a7cff" : "#7a8fa8",
          marginBottom: 8,
          transition: "color .25s",
        }}
      >
        {label}
      </label>

      {/* Input wrapper */}
      <div
        style={{
          position: "relative",
          borderRadius: 14,
          border: `1.5px solid ${error ? "#ef4444" : focused ? "#4a7cff" : hasValue ? "#cbd5e1" : "#e2e8f0"}`,
          background: focused ? "#fff" : "#f8fafc",
          boxShadow: focused ? "0 0 0 3.5px rgba(74,124,255,.13)" : "none",
          transition: "border-color .25s, box-shadow .25s, background .25s",
        }}
      >
        {/* Left icon */}
        <span
          style={{
            position: "absolute",
            left: 16,
            top: "50%",
            transform: "translateY(-50%)",
            color: focused ? "#4a7cff" : "#94a3b8",
            display: "flex",
            alignItems: "center",
            transition: "color .25s",
            pointerEvents: "none",
          }}
        >
          {icon}
        </span>

        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={() => setFocused(true)}
          style={{
            width: "100%",
            padding: "14px 44px 14px 48px",
            border: "none",
            background: "transparent",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            color: "#0f2854",
            outline: "none",
            borderRadius: 14,
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

// ─── 4. Main Page ─────────────────────────────────────────────────────
export default function LoginPage() {
  const savedUser = localStorage.getItem("user");
  const user = savedUser ? JSON.parse(savedUser) : null;

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
      await fakeLogin(data.nomUtilisateur, data.motDePasse);
      window.location.reload();
    } catch (e: any) {
      setLoginError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (user) return <Redirect to="/" />;

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
            clipPath: "polygon(100 100, 100% 0, 100% 75%, 0 85%, 0 100%)",
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
              <div
                style={{
                  borderRadius: 18,
                  overflow: "hidden",
                  border: "1.5px solid rgba(255,255,255,.1)",
                  boxShadow: "0 12px 50px rgba(0,0,0,.35)",
                }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  loop
                  playsInline
                  style={{ width: "100%", display: "block", borderRadius: 20 }}
                >
                  <source src="/VIDEO.mp4" type="video/mp4" />
                </video>
              </div>

              {/* Mute toggle */}
              <button
                onClick={toggleMute}
                style={{
                  position: "absolute", bottom: 14, right: 14,
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
                width: 100, height: 100, borderRadius: 100,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 24px",
              }}
            >
              <img src="/logo.png" alt="KYA" style={{ width: 70, height: 70, objectFit: "contain" }} />
            </div>

            <div style={{ textAlign: "center" }}>
              <h2
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 32,
                  color: NAVY,
                  fontWeight: 700,
                  marginBottom: 4,
                }}
              >
                Bienvenue
              </h2>
              <p style={{ color: "#7a8fa8", fontSize: 15, fontWeight: 300, marginBottom: 42 }}>
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
                value={watchNomUtilisateur || ""}
                {...register("nomUtilisateur")}
                rightIcon={null}
              />

              <InputField
                label="Mot de passe"
                name="motDePasse"
                icon={<Lock size={18} />}
                placeholder="••••••••"
                type={showPass ? "text" : "password"}
                error={errors.motDePasse?.message}
                value={watchMotDePasse || ""}
                {...register("motDePasse")}
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
                  width: "100%", padding: "18px 0",
                  border: "none", borderRadius: 14,
                  background: `linear-gradient(135deg, ${NAVY}, ${NAVY_MID})`,
                  color: "#fff",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 15,
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
                {loading ? "Connexion…" : <>Se connecter <ArrowRight size={18} /></>}
              </button>
            </form>

          </div>
        </div>
      </div>
    </>
  );
}

