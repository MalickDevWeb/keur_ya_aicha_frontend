import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Home, Search, RotateCcw } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-rose-50 via-white to-amber-50">
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-80 w-80 animate-pulse rounded-full bg-rose-200 opacity-30 blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 h-80 w-80 animate-pulse delay-1000 rounded-full bg-amber-200 opacity-30 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 h-60 w-60 -translate-x-1/2 -translate-y-1/2 animate-pulse delay-500 rounded-full bg-pink-200 opacity-20 blur-3xl"></div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`,
            }}
          >
            <div className="h-2 w-2 rounded-full bg-rose-300 opacity-50"></div>
          </div>
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Logo with animation */}
        <div className="mb-8 animate-bounce">
          <img
            src="/logo.png"
            alt="Keur Ya Aicha"
            className="h-32 w-32 object-contain drop-shadow-xl"
          />
        </div>

        {/* 404 with animation */}
        <div className="relative mb-6">
          <h1 className="text-9xl font-black tracking-tighter text-transparent bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 bg-clip-text animate-pulse">
            404
          </h1>
          <div className="absolute inset-0 animate-shake text-9xl font-black text-rose-200 opacity-50 blur-sm">
            404
          </div>
        </div>

        {/* Message */}
        <div className="mb-8 space-y-2">
          <h2 className="text-2xl font-semibold text-gray-800">Oups! Page introuvable</h2>
          <p className="text-gray-500">La page que vous cherchez n'existe pas ou a été déplacée.</p>
        </div>

        {/* Decorative line */}
        <div className="mb-8 h-1 w-24 overflow-hidden rounded-full bg-gradient-to-r from-rose-400 to-amber-400">
          <div className="h-full w-full animate-slide bg-gradient-to-r from-rose-600 to-amber-600"></div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-4">
          <a
            href="/"
            className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-3 font-medium text-white shadow-lg shadow-rose-200 transition-all hover:scale-105 hover:shadow-xl hover:shadow-rose-300"
          >
            <Home className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Accueil
          </a>
          <button
            onClick={() => window.history.back()}
            className="group flex items-center gap-2 rounded-full border-2 border-gray-200 px-6 py-3 font-medium text-gray-600 transition-all hover:border-rose-300 hover:bg-rose-50 hover:text-rose-500"
          >
            <RotateCcw className="h-4 w-4 transition-transform group-hover:rotate-180" />
            Retour
          </button>
        </div>

        {/* Path info */}
        <p className="mt-8 text-sm text-gray-400">
          Chemin demandé: <code className="rounded bg-gray-100 px-2 py-1">{location.pathname}</code>
        </p>
      </div>

      {/* CSS for custom animations */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.6;
          }
        }
        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
        }
        @keyframes slide {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-float {
          animation: float infinite ease-in-out;
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out infinite;
        }
        .animate-slide {
          animation: slide 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default NotFound;
