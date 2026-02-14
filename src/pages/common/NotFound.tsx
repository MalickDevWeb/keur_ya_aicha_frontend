import { useEffect, useState, useRef } from "react";
import { Home, RotateCcw, MapPin, Compass, AlertTriangle, Eye } from "lucide-react";

const NotFound = () => {
  const [logoPosition, setLogoPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleLogoMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left - rect.width / 2,
      y: e.clientY - rect.top - rect.height / 2,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newX = e.clientX - containerRect.left - containerRect.width / 2 - dragOffset.x;
      const newY = e.clientY - containerRect.top - containerRect.height / 2 - dragOffset.y;

      setLogoPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  return (
    <div ref={containerRef} className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50">
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-60 -left-60 h-[500px] w-[500px] animate-pulse rounded-full bg-blue-200 opacity-40 blur-3xl"></div>
        <div className="absolute -bottom-60 -right-60 h-[500px] w-[500px] animate-pulse delay-700 rounded-full bg-sky-200 opacity-40 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 animate-pulse delay-300 rounded-full bg-cyan-200 opacity-30 blur-3xl"></div>

        {/* Question marks floating */}
        {[...Array(15)].map((_, i) => (
          <div
            key={`q-${i}`}
            className="absolute text-blue-300 opacity-20 animate-float-text"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
              fontSize: `${2 + Math.random() * 3}rem`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`,
            }}
          >
            ?
          </div>
        ))}
      </div>

      {/* Lost compass */}
      <div className="absolute top-20 right-20 animate-spin-slow opacity-30">
        <Compass className="h-32 w-32 text-blue-400" />
      </div>

      {/* Map markers scattered */}
      <div className="absolute bottom-20 left-20 animate-bounce opacity-40">
        <MapPin className="h-16 w-16 text-blue-400" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${8 + Math.random() * 12}s`,
            }}
          >
            <div className={`h-1 w-1 rounded-full opacity-40 ${
              i % 3 === 0 ? 'bg-blue-400' : i % 3 === 1 ? 'bg-sky-400' : 'bg-cyan-400'
            }`}></div>
          </div>
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-4">
        {/* Lost character/emoji area */}
        <div className="relative mb-6">
          <div className="text-8xl animate-wobble">😕</div>
          <div className="absolute -top-4 -right-4 animate-ping">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
          </div>
        </div>

        {/* Looking around eyes */}
        <div className="flex gap-8 mb-8">
          <div className="relative">
            <Eye className="h-12 w-12 text-blue-500 animate-look-left" />
          </div>
          <div className="relative">
            <Eye className="h-12 w-12 text-blue-500 animate-look-right" />
          </div>
        </div>

        {/* Draggable Logo with spin animation */}
        <div
          className={`relative mb-6 cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
          style={{
            transform: `translate(${logoPosition.x}px, ${logoPosition.y}px)`,
            transition: isDragging ? 'none' : 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
          onMouseDown={handleLogoMouseDown}
        >
          <div className="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-20"></div>
          <img
            src="/logo.png"
            alt="Keur Ya Aicha - Clique et déplace moi!"
            className="relative h-32 w-32 object-contain drop-shadow-2xl animate-spin hover:scale-110 transition-transform"
            style={{ animationDuration: '12s' }}
            draggable={false}
          />
          <p className="text-xs text-blue-400 mt-2 opacity-70">↓ Clique et déplace moi ↓</p>
        </div>

        {/* 404 with animation */}
        <div className="relative mb-6">
          <h1 className="text-[10rem] font-black leading-none tracking-tighter text-transparent bg-gradient-to-b from-blue-600 via-sky-500 to-cyan-500 bg-clip-text animate-pulse filter drop-shadow-lg">
            404
          </h1>
          <div className="absolute inset-0 animate-tilt text-[10rem] leading-none font-black text-blue-200 opacity-40 blur-xl">
            404
          </div>
          <div className="absolute -inset-10 animate-glow rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 opacity-10 blur-3xl"></div>
        </div>

        {/* Message - Lost theme */}
        <div className="mb-8 space-y-3">
          <h2 className="text-3xl font-bold text-gray-800">Vous semblez être perdu...</h2>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            Cette page n'existe pas ou a été déplacée. Vous n'êtes pas au bon endroit.
          </p>
        </div>

        {/* Direction arrows */}
        <div className="flex gap-4 mb-8 text-blue-400">
          <div className="animate-bounce delay-100">
            <RotateCcw className="h-8 w-8 rotate-45" />
          </div>
          <div className="animate-bounce delay-300">
            <Home className="h-8 w-8" />
          </div>
          <div className="animate-bounce delay-200">
            <RotateCcw className="h-8 w-8 -rotate-45" />
          </div>
        </div>

        {/* Decorative divider */}
        <div className="relative mb-8 h-1 w-32 overflow-hidden rounded-full bg-gradient-to-r from-transparent via-blue-400 to-transparent">
          <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-blue-600 to-transparent"></div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-4 justify-center">
          <a
            href="/"
            className="group relative overflow-hidden rounded-full bg-gradient-to-r from-blue-500 via-sky-500 to-blue-500 px-8 py-4 font-semibold text-white shadow-2xl shadow-blue-200 transition-all hover:scale-105 hover:shadow-blue-300"
            style={{ backgroundSize: '200% 100%' }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            <span className="relative flex items-center gap-2">
              <Home className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
              Retour à la maison
            </span>
          </a>
          <button
            onClick={() => window.history.back()}
            className="group flex items-center gap-2 rounded-full border-2 border-blue-300 px-8 py-4 font-semibold text-blue-700 transition-all hover:border-blue-500 hover:bg-blue-50 hover:text-blue-800"
          >
            <RotateCcw className="h-5 w-5 transition-transform group-hover:rotate-180" />
            Retour en arrière
          </button>
        </div>

        {/* Path info - subtle */}
        <p className="mt-10 text-sm text-gray-400 font-mono bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
          <span className="opacity-50">Emplacement :</span> {location.pathname}
        </p>
      </div>

      {/* CSS for custom animations */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0) rotate(0deg);
            opacity: 0.2;
          }
          25% {
            transform: translateY(-30px) translateX(15px) rotate(5deg);
            opacity: 0.5;
          }
          50% {
            transform: translateY(-15px) translateX(-10px) rotate(-5deg);
            opacity: 0.4;
          }
          75% {
            transform: translateY(-40px) translateX(5px) rotate(3deg);
            opacity: 0.3;
          }
        }
        @keyframes float-text {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
            opacity: 0.15;
          }
          50% {
            transform: translateY(-20px) rotate(10deg);
            opacity: 0.3;
          }
        }
        @keyframes tilt {
          0%, 100% {
            transform: perspective(1000px) rotateY(-5deg);
          }
          50% {
            transform: perspective(1000px) rotateY(5deg);
          }
        }
        @keyframes wobble {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
        @keyframes look-left {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-5px); }
        }
        @keyframes look-right {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(5px); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes glow {
          0%, 100% {
            opacity: 0.1;
            transform: scale(1);
          }
          50% {
            opacity: 0.2;
            transform: scale(1.1);
          }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-float {
          animation: float infinite ease-in-out;
        }
        .animate-float-text {
          animation: float-text infinite ease-in-out;
        }
        .animate-tilt {
          animation: tilt 3s ease-in-out infinite;
        }
        .animate-wobble {
          animation: wobble 1s ease-in-out infinite;
        }
        .animate-look-left {
          animation: look-left 2s ease-in-out infinite;
        }
        .animate-look-right {
          animation: look-right 2s ease-in-out infinite 1s;
        }
        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }
        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default NotFound;
