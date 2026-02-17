import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { User, Lock, Volume2, VolumeX, Eye, EyeOff, ArrowRight, Loader } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { getAuthContext } from "@/services/api";
import {
  DEFAULT_PLATFORM_CONFIG,
  applyBrandingToDocument,
  clearFailedLoginAttempts,
  getLoginLockStatus,
  recordFailedLoginAttempt,
  refreshPlatformConfigFromServer,
  sendComplianceWebhookAlert,
  subscribePlatformConfigUpdates,
} from "@/services/platformConfig";
import { DEFAULT_LOGO_ASSET_PATH, DEFAULT_VIDEO_ASSET_PATH, resolveAssetUrl } from "@/services/assets";
import { ensureRuntimeConfigLoaded, getApiBaseUrl } from "@/services/runtimeConfig";
import { useToast } from "@/contexts/ToastContext";
import { connexionSchema, ConnexionFormData } from "@/validators/frontend";

// ─── InputField Component ──────────────────────────────────────────────
interface FieldProps {
  label: string;
  name: "telephone" | "motDePasse";
  icon: React.ReactNode;
  placeholder: string;
  type?: string;
  error?: string;
  register: UseFormRegisterReturn;
  watch: string;
  rightIcon?: React.ReactNode;
}

function InputField({ label, name, icon, placeholder, type = "text", error, register: reg, watch: watchValue, rightIcon }: FieldProps) {
  const [focused, setFocused] = useState(false);
  const hasValue = watchValue && watchValue.length > 0;
  const active = focused || hasValue;

  return (
    <div style={{ marginBottom: 20 }}>
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
  const { login } = useAuth();
  const { addToast } = useToast();

  const [isMuted, setIsMuted] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loginFieldError, setLoginFieldError] = useState("");
  const [pendingModalOpen, setPendingModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [isVideoExpanded, setIsVideoExpanded] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [brandName, setBrandName] = useState("Keur Ya Aicha");
  const [brandLogoUrl, setBrandLogoUrl] = useState(DEFAULT_PLATFORM_CONFIG.branding.logoUrl || "/logo.png");
  const fallbackLogoUrl = resolveAssetUrl(DEFAULT_PLATFORM_CONFIG.branding.logoUrl || DEFAULT_LOGO_ASSET_PATH);
  const resolvedBrandLogoUrl = resolveAssetUrl(brandLogoUrl || DEFAULT_PLATFORM_CONFIG.branding.logoUrl || DEFAULT_LOGO_ASSET_PATH);
  const resolvedVideoUrl = resolveAssetUrl(DEFAULT_VIDEO_ASSET_PATH);
  const lastToastRef = useRef<{ message: string; type: string; at: number } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ConnexionFormData>({
    resolver: zodResolver(connexionSchema),
    defaultValues: { telephone: "", motDePasse: "" },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  // Watch form values for the InputField components
  const watchTelephone = watch("telephone");
  const watchMotDePasse = watch("motDePasse");

  // Video auto-play logic
  useEffect(() => {
    let active = true;
    const loadPlatformConfig = async () => {
      const config = await refreshPlatformConfigFromServer();
      if (!active) return;
      setMaintenanceMessage(config.maintenance.enabled ? config.maintenance.message : "");
      setBrandName(config.branding.appName || "Keur Ya Aicha");
      setBrandLogoUrl(config.branding.logoUrl || DEFAULT_PLATFORM_CONFIG.branding.logoUrl || "/logo.png");
      applyBrandingToDocument(config);
    };
    void loadPlatformConfig();
    const unsubscribe = subscribePlatformConfigUpdates((config) => {
      if (!active) return;
      setMaintenanceMessage(config.maintenance.enabled ? config.maintenance.message : "");
      setBrandName(config.branding.appName || "Keur Ya Aicha");
      setBrandLogoUrl(config.branding.logoUrl || DEFAULT_PLATFORM_CONFIG.branding.logoUrl || "/logo.png");
      applyBrandingToDocument(config);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const playVideo = async () => {
      const el = videoRef.current;
      if (!el) return;
      el.muted = true;
      setIsMuted(true);
      try {
        await el.play();
      } catch {
        // ignore autoplay errors
      }
    };
    playVideo();
  }, []);

  // Unmute on first *trusted* pointer interaction (browser autoplay policy)
  useEffect(() => {
    const handleFirstInteraction = async (event: Event) => {
      if ("isTrusted" in event && !(event as { isTrusted?: boolean }).isTrusted) return;
      const el = videoRef.current;
      if (!el) return;
      const activation = (navigator as Navigator & {
        userActivation?: { isActive?: boolean; hasBeenActive?: boolean };
      }).userActivation;
      if (activation && !activation.isActive && !activation.hasBeenActive) return;
      if (el.muted) {
        el.muted = false;
        setIsMuted(false);
      }
      try {
        await el.play();
      } catch {
        // ignore
      }
    };
    window.addEventListener("pointerdown", handleFirstInteraction, { once: true });
    return () => {
      window.removeEventListener("pointerdown", handleFirstInteraction);
    };
  }, []);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!videoRef.current.muted);
    }
  };

  const onSubmit = async (data: ConnexionFormData) => {
    const lockStatus = getLoginLockStatus();
    if (lockStatus.blocked) {
      const remainingMinutes = Math.max(1, Math.ceil(lockStatus.remainingMs / 60000));
      setLoginFieldError(`Connexion temporairement bloquée. Réessayez dans ${remainingMinutes} minute(s).`);
      return;
    }

    setLoading(true);
    setLoginFieldError("");
    setPendingModalOpen(false);
    try {
      const success = await login(data.telephone, data.motDePasse);
      if (success) {
        clearFailedLoginAttempts();
        try {
          const ctx = await getAuthContext();
          const role = String(ctx.user?.role || '').toUpperCase();
          const isSuperAdmin = role === 'SUPER_ADMIN';
          const isSubscriptionBlocked = Boolean(ctx.user?.subscriptionBlocked);
          if (isSuperAdmin) {
          const now = Date.now();
          const toastKey = { message: 'Connexion réussie', type: 'success' };
          if (!lastToastRef.current || now - lastToastRef.current.at > 1500 || lastToastRef.current.message !== toastKey.message) {
            lastToastRef.current = { ...toastKey, at: now };
            addToast({
              type: 'success',
              title: 'Connexion réussie',
              message: `Bienvenue !`,
              duration: 2000,
            });
          }
            navigate("/pmt/admin", { replace: true });
            return;
          }
          if (role === 'ADMIN' && isSubscriptionBlocked) {
            const dueAt = ctx.user?.subscriptionDueAt
            const dueDateLabel = dueAt ? new Date(dueAt).toLocaleDateString('fr-FR') : null
            addToast({
              type: 'warning',
              title: 'Abonnement en retard',
              message: dueDateLabel
                ? `Votre accès est limité jusqu’au paiement. Date limite dépassée: ${dueDateLabel}.`
                : "Votre accès est limité jusqu'au paiement de l'abonnement.",
              duration: 4000,
            });
            navigate("/subscription", { replace: true });
            return;
          }
          const now = Date.now();
          const toastKey = { message: 'Connexion réussie', type: 'success' };
          if (!lastToastRef.current || now - lastToastRef.current.at > 1500 || lastToastRef.current.message !== toastKey.message) {
            lastToastRef.current = { ...toastKey, at: now };
            addToast({
              type: 'success',
              title: 'Connexion réussie',
              message: `Bienvenue !`,
              duration: 2000,
            });
          }
          navigate("/dashboard", { replace: true });
        } catch {
          navigate("/dashboard", { replace: true });
        }
      } else {
        try {
          await ensureRuntimeConfigLoaded();
          const apiBaseUrl = getApiBaseUrl();
          const res = await fetch(`${apiBaseUrl}/auth/pending-check`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: data.telephone, password: data.motDePasse }),
          });
          const pendingData = await res.json();
          if (pendingData?.pending) {
            setPendingModalOpen(true);
            setLoginFieldError("");
            return;
          }
        } catch {
          // ignore
        }
        const failedStatus = recordFailedLoginAttempt();
        void sendComplianceWebhookAlert('security', {
          event: 'login_failure',
          username: data.telephone,
          failures: failedStatus.failures,
          blocked: failedStatus.blocked,
        });
        if (failedStatus.blocked) {
          const remainingMinutes = Math.max(1, Math.ceil(failedStatus.remainingMs / 60000));
          setLoginFieldError(`Connexion temporairement bloquée. Réessayez dans ${remainingMinutes} minute(s).`);
          return;
        }
        setLoginFieldError("Identifiants incorrects.");
      }
    } catch (e: unknown) {
      const raw = e instanceof Error ? e.message : "Erreur lors de la connexion";
      const normalized = typeof raw === 'string' ? raw.toLowerCase() : '';
      const isApprovalBlock =
        normalized.includes('accès interdit') ||
        normalized.includes("demande en attente") ||
        normalized.includes('en attente');
      if (isApprovalBlock) {
        setLoginFieldError("");
        setPendingModalOpen(true);
        return;
      }
      const failedStatus = recordFailedLoginAttempt();
      void sendComplianceWebhookAlert('security', {
        event: 'login_failure',
        username: data.telephone,
        failures: failedStatus.failures,
        blocked: failedStatus.blocked,
      });
      if (failedStatus.blocked) {
        const remainingMinutes = Math.max(1, Math.ceil(failedStatus.remainingMs / 60000));
        setLoginFieldError(`Connexion temporairement bloquée. Réessayez dans ${remainingMinutes} minute(s).`);
        return;
      }
      setLoginFieldError("Identifiants incorrects.");
    } finally {
      setLoading(false);
    }
  };

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

      {/* Pulsing animation for signup button */}
      <style>
        {`
          @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 4px 20px rgba(74,124,255,.4); }
            50% { box-shadow: 0 4px 35px rgba(74,124,255,.7), 0 0 15px rgba(139,92,246,.3); }
          }
          @keyframes slide-up {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .login-shell {
            height: 100vh;
            min-height: -webkit-fill-available;
            display: grid;
            grid-template-columns: 1fr 1fr;
            font-family: 'DM Sans', sans-serif;
            background: ${NAVY};
          }
          .login-left-content {
            margin-top: -30px;
          }
          @media (max-width: 1024px) {
            .login-shell {
              grid-template-columns: 1fr !important;
              height: auto !important;
              min-height: 100vh !important;
            }
            .login-left {
              clip-path: none !important;
              padding: 48px 24px !important;
            }
            .login-right {
              padding: 24px 24px 36px !important;
            }
          }
          @media (max-width: 768px) {
            .login-left {
              display: none !important;
            }
            .login-right {
              padding: 20px 16px 32px !important;
              width: 100% !important;
              min-height: 100vh !important;
            }
            .login-left-content {
              margin-top: 0 !important;
            }
            .login-shell {
              background: #fff !important;
            }
            .login-video {
              display: none !important;
            }
            .login-zigzag {
              display: none !important;
            }
            .login-logo {
              width: 160px !important;
              height: 160px !important;
            }
            .login-logo img {
              width: 140px !important;
              height: 140px !important;
            }
            .login-title {
              font-size: 26px !important;
            }
          }
        `}
      </style>

      <div
        className="login-shell"
        style={{
          overflow: isVideoExpanded ? "visible" : "hidden",
        }}
      >
        {/* ════════════════ LEFT — Video panel ════════════════ */}
        <div
          className="login-left"
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "",
            alignItems: "center",
            padding: "60px 48px",
            overflow: isVideoExpanded ? "visible" : "hidden",
            clipPath: isVideoExpanded ? "none" : "url(#wave-clip)",
            zIndex: isVideoExpanded ? 9998 : "auto",
          }}
        >
          {/* Zig-zag separator moved to the right panel */}
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
          <div className="login-left-content" style={{ position: "relative", zIndex: 2, textAlign: "center", width: "100%" }}>
            {/* Logo */}
            <div
              className="login-logo"
              style={{
                width: 220, height: 220, borderRadius: 100, margin: "0 auto 24px",
                background: "linear-gradient(135deg, rgb(255, 255, 255), rgb(255, 255, 255))",
                border: "1.5px solid rgba(74,124,255,.3)",
                backdropFilter: "blur(12px)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 8px 40px rgba(74,124,255,.15)",
              }}
            >
              <img
                src={resolvedBrandLogoUrl}
                alt={brandName || "KYA"}
                onError={(event) => {
                  if (event.currentTarget.src !== fallbackLogoUrl) {
                    event.currentTarget.src = fallbackLogoUrl;
                  }
                }}
                style={{ width: 200, height: 200, objectFit: "contain", borderRadius: 16 }}
              />
            </div>

            <h1
              className="login-title"
              style={{
                fontFamily: "'Playfair Display', serif",
                color: "#fff",
                fontSize: 30,
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              {brandName}
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
          <div
            className="login-video"
            style={{
              position: isVideoExpanded ? "fixed" : "relative",
              inset: isVideoExpanded ? 0 : "auto",
              zIndex: isVideoExpanded ? 9999 : "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              maxWidth: isVideoExpanded ? "100%" : 520,
              margin: isVideoExpanded ? 0 : "0 auto",
              background: isVideoExpanded ? "rgba(0,0,0,0.7)" : "transparent",
              transition: "background .35s ease",
              padding: isVideoExpanded ? 16 : 0,
            }}
            onClick={() => {
              const next = !isVideoExpanded;
              setIsVideoExpanded(next);
              if (videoRef.current) {
                videoRef.current.muted = !next;
                setIsMuted(!next);
              }
            }}
          >
              {/* TV Screen Frame */}
              <div
                style={{
                  borderRadius: isVideoExpanded ? 24 : 20,
                  overflow: "hidden",
                  background: "#0a0a0a",
                  padding: 8,
                  width: isVideoExpanded ? "80vw" : "100%",
                  height: isVideoExpanded ? "90vh" : "auto",
                  maxWidth: isVideoExpanded ? 980 : "none",
                  boxShadow: isVideoActive || isVideoExpanded
                    ? "0 25px 60px rgba(0,0,0,.55), 0 8px 20px rgba(0,0,0,.3)"
                    : "0 15px 45px rgba(0,0,0,.45), 0 4px 15px rgba(0,0,0,.2)",
                  transform: isVideoActive ? "scale(1.04)" : "scale(1)",
                  transition: "transform .35s ease, box-shadow .35s ease, width .35s ease, height .35s ease, border-radius .35s ease",
                  cursor: "pointer",
                }}
                onClick={async (e) => {
                  e.stopPropagation();
                  setIsVideoActive(true);
                  const next = !isVideoExpanded;
                  setIsVideoExpanded(next);
                  if (videoRef.current) {
                    videoRef.current.muted = !next;
                    setIsMuted(!next);
                    try {
                      await videoRef.current.play();
                    } catch {
                      // ignore
                    }
                  }
                  window.setTimeout(() => setIsVideoActive(false), 600);
                }}
              >
                <div
                  style={{
                    borderRadius: 14,
                    overflow: "hidden",
                    background: "#000",
                    position: "relative",
                    height: isVideoExpanded ? "100%" : "auto",
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
                    style={{ width: "100%", height: isVideoExpanded ? "100%" : "auto", display: "block", borderRadius: 10, objectFit: "cover" }}
                  >
                    <source src={resolvedVideoUrl} type="video/mp4" />
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
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = "rgba(0,0,0,.72)";
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = "rgba(0,0,0,.55)";
                }}
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
          className="login-right"
          style={{
            background: "#fff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            padding: "24px 32px 36px",
            position: "relative",
            overflow: "hidden",
            zIndex: isVideoExpanded ? 0 : 1,
            boxShadow: "0 35px 100px rgba(8,12,40,0.28)",
          }}
        >
          {/* Zig-zag separator (blue teeth into white panel) */}
          <div
            className="login-zigzag"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: "24px",
              height: "100%",
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='80' viewBox='0 0 56 80'%3E%3Cpolygon points='0,0%2056,40%200,80' fill='%230F2854' fill-opacity='0.98'/%3E%3C/svg%3E\")",
              backgroundRepeat: "repeat-y",
              backgroundSize: "24px 36px",
              backgroundPosition: "0 0",
              filter: "drop-shadow(0 6px 12px rgba(8,12,40,0.25))",
              zIndex: 0,
              pointerEvents: "none",
            }}
          />

          <div style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 480 }}>
            {/* Logo centered at top */}
            <div
              style={{
                width: 110, height: 110, borderRadius: 100,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 12px",
              }}
            >
              <img
                src={resolvedBrandLogoUrl}
                alt={brandName || "KYA"}
                onError={(event) => {
                  if (event.currentTarget.src !== fallbackLogoUrl) {
                    event.currentTarget.src = fallbackLogoUrl;
                  }
                }}
                style={{ width: 100, height: 100, objectFit: "contain" }}
              />
            </div>

            <div style={{ textAlign: "center" }}>
              {maintenanceMessage && (
                <div
                  style={{
                    marginBottom: 14,
                    border: "1px solid #f59e0b",
                    background: "#fffbeb",
                    color: "#92400e",
                    borderRadius: 12,
                    padding: "10px 12px",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Maintenance globale: {maintenanceMessage}
                </div>
              )}
              <h2
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 36,
                  color: NAVY,
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                Bienvenue
              </h2>
              <p style={{ color: "#0F2854", fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
                Gérez vos clients en toute simplicité
              </p>

            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <InputField
                label="Téléphone"
                name="telephone"
                icon={<User size={18} />}
                placeholder="+221 77 123 45 67"
                error={errors.telephone?.message || loginFieldError}
                watch={watchTelephone || ""}
                register={register("telephone")}
                rightIcon={null}
              />

              <InputField
                label="Mot de passe"
                name="motDePasse"
                icon={<Lock size={18} />}
                placeholder="••••••••"
                type={showPass ? "text" : "password"}
                error={errors.motDePasse?.message || loginFieldError}
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
                    onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.currentTarget.style.color = ACCENT;
                    }}
                    onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.currentTarget.style.color = "#94a3b8";
                    }}
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />

              {/* Forgot password */}
              <div style={{ textAlign: "right", marginTop: 0, marginBottom: 40 }}>
                <a
                  href="#"
                  style={{
                    fontSize: 12, color: ACCENT, textDecoration: "none", fontWeight: 500,
                  }}
                >

                </a>
              </div>

              {/* Global error removed: errors are shown via popup */}

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
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                  if (!loading) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 30px rgba(15,40,84,.4)";
                  }
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 22px rgba(15,40,84,.3)";
                }}
              >
                {loading ? (
                  <>
                    <Loader size={20} className="animate-spin mr-2" />
                    Connexion…
                  </>
                ) : (
                  <>Se connecter <ArrowRight size={20} /></>
                )}
              </button>

              {/* Sign up CTA moved to bottom */}
              <div style={{ display: "flex", justifyContent: "center", marginTop: 14 }}>
                <button
                  type="button"
                  onClick={() => navigate("/admin/signup")}
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    color: NAVY,
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "pointer",
                    textDecoration: "underline",
                    textUnderlineOffset: 6,
                    letterSpacing: "0.4px",
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.currentTarget.style.color = ACCENT;
                  }}
                  onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.currentTarget.style.color = NAVY;
                  }}
                >
                  Créer un compte administrateur
                </button>
              </div>

              <div
                style={{
                  marginTop: 14,
                  borderTop: "1px solid #e2e8f0",
                  paddingTop: 10,
                  textAlign: "center",
                }}
              >
                <p style={{ fontSize: 12, color: "#0F2854", fontWeight: 600 }}>
                  Besoin d’aide ?
                </p>
                <p style={{ fontSize: 12, color: "#64748b" }}>
                  <a
                    href="https://wa.me/221771719013"
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#4a7cff", textDecoration: "none", fontWeight: 600 }}
                  >
                    77 1719013
                  </a>
                  <span style={{ padding: "0 6px" }}>·</span>
                  <a
                    href="mailto:malickteuw.devweb@gmail.com"
                    style={{ color: "#4a7cff", textDecoration: "none", fontWeight: 600 }}
                  >
                    malickteuw.devweb@gmail.com
                  </a>
                </p>
                <p style={{ marginTop: 6, fontSize: 11, color: "#94a3b8", letterSpacing: "0.6px" }}>
                  © malickdevweb
                </p>
              </div>
            </form>

          </div>
        </div>
      </div>

      {pendingModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(5, 10, 30, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
          onClick={() => setPendingModalOpen(false)}
        >
          <div
            style={{
              maxWidth: 420,
              width: "100%",
              background: "#fff",
              borderRadius: 16,
              padding: "18px 20px",
              boxShadow: "0 20px 60px rgba(10,15,40,0.25)",
              border: "1px solid rgba(18,27,83,0.12)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: "rgba(74,124,255,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#1E3A8A",
                  fontWeight: 700,
                }}
              >
                i
              </div>
              <div style={{ fontWeight: 700, color: "#121B53" }}>Compte en attente</div>
            </div>
            <p style={{ fontSize: 14, color: "#334155", lineHeight: 1.5 }}>
              Vous n’êtes pas encore approuvé. Veuillez patienter quelques heures.
            </p>
            <button
              type="button"
              onClick={() => setPendingModalOpen(false)}
              style={{
                marginTop: 14,
                width: "100%",
                background: "#121B53",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                padding: "10px 12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Compris
            </button>
          </div>
        </div>
      )}
    </>
  );
}
