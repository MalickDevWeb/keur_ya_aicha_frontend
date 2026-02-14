import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Shield, Lock, User, Eye, EyeOff, Loader2, ArrowRight, Key, Fingerprint, Radio, AlertTriangle, Camera, CheckCircle } from 'lucide-react'

export function SuperAdminLogin({ requireSecondAuth = false }: { requireSecondAuth?: boolean }) {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showFingerprint, setShowFingerprint] = useState(false)
  const [scanLine, setScanLine] = useState(0)
  const [timeString, setTimeString] = useState('')
  const [cameraReady, setCameraReady] = useState(false)
  const [flashActive, setFlashActive] = useState(false)
  const [screenshotCount, setScreenshotCount] = useState(0)
  const [capturedAlerts, setCapturedAlerts] = useState<Array<{id: number, time: string}>>([])
  const videoRefMain = useRef<HTMLVideoElement>(null)
  const videoRefSmall = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(document.createElement('canvas'))

  // Update time every second
  useEffect(() => {
    const updateTime = () => {
      setTimeString(new Date().toLocaleTimeString('fr-FR'))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  // Animated scanline effect
  useEffect(() => {
    let pos = 0
    let direction = 1
    const animate = () => {
      pos += direction * 2
      if (pos > 100 || pos < 0) direction *= -1
      setScanLine(pos)
      requestAnimationFrame(animate)
    }
    const animationId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationId)
  }, [])

  // Initialize camera
  useEffect(() => {
    let mounted = true

    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          }
        })

        if (!mounted) {
          stream.getTracks().forEach(t => t.stop())
          return
        }

        streamRef.current = stream
        setCameraReady(true)
      } catch (err) {
        console.log('Camera not available:', err)
        if (mounted) setCameraReady(false)
      }
    }

    initCamera()

    return () => {
      mounted = false
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
    }
  }, [])

  // Attach stream to main video when camera is ready and fingerprint not shown
  useEffect(() => {
    if (!showFingerprint && cameraReady && videoRefMain.current && streamRef.current) {
      videoRefMain.current.srcObject = streamRef.current
      videoRefMain.current.play().catch(() => {})
    }
  }, [showFingerprint, cameraReady])

  // Attach stream to small video when fingerprint is shown
  useEffect(() => {
    if (showFingerprint && cameraReady && videoRefSmall.current && streamRef.current) {
      videoRefSmall.current.srcObject = streamRef.current
      videoRefSmall.current.play().catch(() => {})
    }
  }, [showFingerprint, cameraReady])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const ok = await login(username, password)
      if (!ok) {
        setError('Identifiants invalides')
        return
      }
      if (requireSecondAuth) {
        sessionStorage.setItem('superadminSecondAuth', 'true')
      }
      navigate('/pmt/admin', { replace: true })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur de connexion'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleFingerprintClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowFingerprint(!showFingerprint)
  }

  // Classic KA-CHUNK camera shutter sound
  const playShutterSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const t = audioContext.currentTime

      // Master gain
      const master = audioContext.createGain()
      master.gain.setValueAtTime(0.6, t)
      master.connect(audioContext.destination)

      // === KA (sharp mechanical sound at 0ms) ===
      const kaOsc = audioContext.createOscillator()
      kaOsc.type = 'square'
      kaOsc.frequency.setValueAtTime(1800, t)
      kaOsc.frequency.exponentialRampToValueAtTime(400, t + 0.015)

      const kaFilter = audioContext.createBiquadFilter()
      kaFilter.type = 'bandpass'
      kaFilter.frequency.setValueAtTime(2000, t)
      kaFilter.Q.value = 5

      const kaGain = audioContext.createGain()
      kaGain.gain.setValueAtTime(0.8, t)
      kaGain.gain.exponentialRampToValueAtTime(0.01, t + 0.015)

      kaOsc.connect(kaFilter)
      kaFilter.connect(kaGain)
      kaGain.connect(master)
      kaOsc.start(t)
      kaOsc.stop(t + 0.02)

      // === CHUNK (low thud at 20ms) ===
      const chunkOsc = audioContext.createOscillator()
      chunkOsc.type = 'triangle'
      chunkOsc.frequency.setValueAtTime(250, t + 0.02)
      chunkOsc.frequency.exponentialRampToValueAtTime(60, t + 0.08)

      const chunkGain = audioContext.createGain()
      chunkGain.gain.setValueAtTime(0.7, t + 0.02)
      chunkGain.gain.exponentialRampToValueAtTime(0.01, t + 0.08)

      chunkOsc.connect(chunkGain)
      chunkGain.connect(master)
      chunkOsc.start(t + 0.02)
      chunkOsc.stop(t + 0.1)

      // === Mechanical noise burst ===
      const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.06, audioContext.sampleRate)
      const noiseData = noiseBuffer.getChannelData(0)
      for (let i = 0; i < noiseBuffer.length; i++) {
        noiseData[i] = (Math.random() * 2 - 0.8) * Math.pow(1 - i / noiseBuffer.length, 4)
      }

      const noise = audioContext.createBufferSource()
      noise.buffer = noiseBuffer

      const noiseFilter = audioContext.createBiquadFilter()
      noiseFilter.type = 'lowpass'
      noiseFilter.frequency.setValueAtTime(800, t + 0.02)

      const noiseGain = audioContext.createGain()
      noiseGain.gain.setValueAtTime(0.4, t + 0.02)
      noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.06)

      noise.connect(noiseFilter)
      noiseFilter.connect(noiseGain)
      noiseGain.connect(master)
      noise.start(t + 0.02)

      // === Secondary click ===
      const clickOsc = audioContext.createOscillator()
      clickOsc.type = 'sine'
      clickOsc.frequency.setValueAtTime(3000, t + 0.025)
      clickOsc.frequency.exponentialRampToValueAtTime(500, t + 0.035)

      const clickGain = audioContext.createGain()
      clickGain.gain.setValueAtTime(0.2, t + 0.025)
      clickGain.gain.exponentialRampToValueAtTime(0.01, t + 0.04)

      clickOsc.connect(clickGain)
      clickGain.connect(master)
      clickOsc.start(t + 0.025)
      clickOsc.stop(t + 0.05)

    } catch (err) {
      console.log('Audio not available')
    }
  }, [])

  // Capture and "upload" screenshot
  const captureScreenshot = useCallback(() => {
    const video = showFingerprint ? videoRefSmall.current : videoRefMain.current
    if (!video || !cameraReady) return

    canvasRef.current!.width = video.videoWidth || 640
    canvasRef.current!.height = video.videoHeight || 480

    const ctx = canvasRef.current!.getContext('2d')
    if (ctx) {
      ctx.drawImage(video, 0, 0)

      canvasRef.current!.toBlob(async (blob) => {
        if (blob) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
          const filename = `surveillance-capture-${timestamp}.jpg`

          console.log('📸 CAPTURED:', {
            filename,
            size: blob.size,
            type: blob.type,
            timestamp: new Date().toLocaleString()
          })

          setCapturedAlerts(prev => [...prev.slice(-4), { id: Date.now(), time: new Date().toLocaleTimeString() }])
        }
      }, 'image/jpeg', 0.85)
    }
  }, [showFingerprint, cameraReady])

  // Handle page click for screenshot effect
  const handlePageClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.fingerprint-btn') ||
        (e.target as HTMLElement).closest('input') ||
        (e.target as HTMLElement).closest('form')) {
      return
    }

    if (screenshotCount < 5) {
      setFlashActive(true)
      setScreenshotCount(prev => prev + 1)
      playShutterSound()
      captureScreenshot()

      setTimeout(() => {
        setFlashActive(false)
      }, 120)
    }
  }, [screenshotCount, playShutterSound, captureScreenshot])

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes record {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255, 0, 0, .7); }
          50% { box-shadow: 0 0 0 8px rgba(255, 0, 0, 0); }
        }
        .scanlines {
          background: repeating-linear-gradient(
            0deg, transparent, transparent 2px, rgba(0, 255, 255, .03) 2px, rgba(0, 255, 255, .03) 4px
          );
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulseAlert {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
      `}} />

      <div
        onClick={handlePageClick}
        style={{
          height: '100vh',
          minHeight: '-webkit-fill-available',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          fontFamily: "'DM Sans', sans-serif",
          background: '#050510',
          overflow: 'hidden',
          cursor: 'crosshair',
        }}
      >
        {/* LEFT - Security Panel */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '60px 48px',
            overflow: 'hidden',
            background: 'radial-gradient(ellipse at center, #0a0a1a 0%, #000005 100%)',
          }}
        >
          {/* Grid pattern */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `
                linear-gradient(rgba(0, 200, 255, .02) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 200, 255, .02) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
              pointerEvents: 'none',
            }}
          />

          {/* Recording indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              background: 'rgba(0, 0, 0, .6)',
              borderRadius: 20,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#ff0000',
                animation: 'record 1.5s infinite',
              }}
            />
            <span style={{ color: '#ff0000', fontSize: 12, fontWeight: 600 }}>
              REC
            </span>
          </div>

          {/* Timestamp and CAM ID */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 32,
            }}
          >
            <span style={{ fontFamily: 'monospace', fontSize: 14, color: '#00ff00', fontWeight: 500 }}>
              {timeString}
            </span>
            <span
              style={{
                padding: '4px 12px',
                background: 'rgba(0, 200, 255, .1)',
                border: '1px solid rgba(0, 200, 255, .3)',
                borderRadius: 4,
                fontFamily: 'monospace',
                fontSize: 11,
                color: 'rgba(0, 200, 255, .8)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
              <Radio size={10} style={{ color: '#00ff00' }} />
              CAM-01 [SECURE]
            </span>
          </div>

          {/* Main Shield */}
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(0, 200, 255, .1) 0%, rgba(0, 100, 150, .05) 100%)',
              border: '1px solid rgba(0, 200, 255, .2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
              boxShadow: '0 0 40px rgba(0, 200, 255, .1)',
            }}
          >
            <Shield size={50} style={{ color: '#00c8ff' }} />
          </div>

          {/* Titles */}
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              color: '#fff',
              fontSize: 32,
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            Security Command
          </h1>
          <p
            style={{
              color: 'rgba(0, 200, 255, .6)',
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              marginBottom: 32,
            }}
          >
            Super Admin Access
          </p>

          {/* Security icons */}
          <div
            style={{
              display: 'flex',
              gap: 32,
              justifyContent: 'center',
              marginBottom: 32,
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <Key size={22} style={{ color: 'rgba(0, 200, 255, .5)', marginBottom: 6 }} />
              <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 10 }}>Encryption</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <Fingerprint
                size={22}
                className="fingerprint-btn"
                style={{
                  color: showFingerprint ? '#00ff00' : 'rgba(0, 200, 255, .5)',
                  marginBottom: 6,
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
                onClick={handleFingerprintClick}
              />
              <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 10 }}>Biometric</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <Shield size={22} style={{ color: 'rgba(0, 200, 255, .5)', marginBottom: 6 }} />
              <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 10 }}>Protected</p>
            </div>
          </div>

          {/* surveillance warning */}
          <div
            style={{
              background: 'rgba(255, 0, 0, .05)',
              border: '1px solid rgba(255, 0, 0, .2)',
              borderRadius: 8,
              padding: '12px 20px',
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <AlertTriangle size={18} style={{ color: 'rgba(255, 0, 0, .6)' }} />
            <p style={{ color: 'rgba(255, 0, 0, .7)', fontSize: 12, fontWeight: 500 }}>
              Vous êtes actuellement sous surveillance
            </p>
          </div>

          {/* Capture alerts */}
          <div style={{ position: 'absolute', bottom: 80, left: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {capturedAlerts.map((alert) => (
              <div
                key={alert.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  background: 'rgba(255, 0, 0, .1)',
                  border: '1px solid rgba(255, 0, 0, .3)',
                  borderRadius: 6,
                  animation: 'pulseAlert 0.5s ease',
                }}
              >
                <Camera size={16} style={{ color: '#ff0000' }} />
                <span style={{ color: '#ff0000', fontSize: 11, fontFamily: 'monospace' }}>
                  CAPTURE {alert.time}
                </span>
              </div>
            ))}
          </div>

          <p style={{ color: 'rgba(255,255,255,.3)', fontSize: 11 }}>
            Zone strictement surveillée
          </p>

          {/* Footer */}
          <p
            style={{
              position: 'absolute',
              bottom: 24,
              color: 'rgba(0, 200, 255, .15)',
              fontSize: 10,
              letterSpacing: '1px',
            }}
          >
            Secured by Keur Ya Aicha
          </p>
        </div>

        {/* RIGHT - Camera View */}
        <div
          style={{
            background: 'linear-gradient(180deg, #0a0a15 0%, #050510 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 36px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Small camera in corner when form is shown */}
          {showFingerprint && (
            <div
              style={{
                position: 'absolute',
                top: 20,
                right: 20,
                width: 150,
                height: 110,
                background: '#000',
                borderRadius: 6,
                overflow: 'hidden',
                border: '2px solid rgba(0, 200, 255, .4)',
                boxShadow: '0 0 20px rgba(0, 200, 255, .2)',
                zIndex: 10,
              }}
            >
              {cameraReady ? (
                <video
                  ref={videoRefSmall}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: 'grayscale(30%) contrast(1.2) brightness(0.9)',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(180deg, #0a0a0a 0%, #111 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage: `
                        linear-gradient(rgba(0, 200, 255, .08) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0, 200, 255, .08) 1px, transparent 1px)
                      `,
                      backgroundSize: '15px 15px',
                    }}
                  />
                  <div
                    style={{
                      left: 0,
                      right: 0,
                      height: 2,
                      background: 'linear-gradient(90deg, transparent, #00c8ff, transparent)',
                      top: `${scanLine}%`,
                      boxShadow: '0 0 10px #00c8ff',
                      position: 'absolute',
                    }}
                  />
                  <Radio size={20} style={{ color: 'rgba(0, 200, 255, .5)', zIndex: 1 }} />
                </div>
              )}
              {/* Recording dot */}
              <div style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: '#ff0000', animation: 'record 1.5s infinite' }} />
            </div>
          )}

          {/* Main camera view - only visible when fingerprint is NOT clicked */}
          {!showFingerprint && (
            <div
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: 600,
                height: 450,
                background: '#000',
                borderRadius: 8,
                overflow: 'hidden',
                border: '3px solid rgba(0, 200, 255, .4)',
                boxShadow: '0 0 40px rgba(0, 200, 255, .2)',
                transition: 'all 0.3s ease',
              }}
            >
              {cameraReady ? (
                <video
                  ref={videoRefMain}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: 'grayscale(30%) contrast(1.2) brightness(0.9)',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(180deg, #0a0a0a 0%, #111 50%, #0a0a0a 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* Grid overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage: `
                        linear-gradient(rgba(0, 200, 255, .1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0, 200, 255, .1) 1px, transparent 1px)
                      `,
                      backgroundSize: '30px 30px',
                    }}
                  />
                  {/* Scanning line */}
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      height: 2,
                      background: 'linear-gradient(90deg, transparent, #00c8ff, transparent)',
                      top: `${scanLine}%`,
                      boxShadow: '0 0 10px #00c8ff',
                    }}
                  />
                  {/* Center content */}
                  <Radio size={48} style={{ color: 'rgba(0, 200, 255, .3)' }} />
                  <p style={{ color: 'rgba(0, 200, 255, .3)', fontSize: 11, marginTop: 12, fontFamily: 'monospace' }}>
                    SURVEILLANCE ACTIVE
                  </p>
                </div>
              )}

              {/* Overlay elements */}
              <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'rgba(0,0,0,.7)', borderRadius: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff0000', animation: 'record 1.5s infinite' }} />
                <span style={{ color: '#ff0000', fontSize: 10, fontWeight: 600 }}>REC</span>
              </div>

              <div style={{ position: 'absolute', top: 12, left: 12, padding: '4px 10px', background: 'rgba(0,0,0,.7)', borderRadius: 4, fontFamily: 'monospace', fontSize: 11, color: '#00ff00' }}>
                {timeString}
              </div>

              <div style={{ position: 'absolute', bottom: 12, right: 12, padding: '4px 10px', background: 'rgba(0,0,0,.7)', borderRadius: 4, fontFamily: 'monospace', fontSize: 10, color: 'rgba(0,200,255,.8)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Radio size={10} style={{ color: '#00ff00' }} />CAM-01
              </div>

              {/* Corners */}
              {[
                { top: 4, left: 4 },
                { top: 4, right: 4 },
                { bottom: 4, left: 4 },
                { bottom: 4, right: 4 },
              ].map((pos, i) => (
                <div key={i} style={{ position: 'absolute', top: pos.top, left: pos.left, right: pos.right, bottom: pos.bottom, width: 25, height: 25, border: '2px solid rgba(0,200,255,.5)' }} />
              ))}

              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} className="scanlines" />
            </div>
          )}

          {/* Auth form when fingerprint clicked */}
          {showFingerprint && (
            <div
              style={{
                position: 'relative',
                zIndex: 5,
                width: '100%',
                maxWidth: 400,
                marginTop: 30,
                animation: 'fadeIn 0.3s ease',
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: 30 }}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: '#fff', fontWeight: 700, marginBottom: 6 }}>
                  Authentification
                </h2>
                <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 13 }}>
                  Accès au panneau d'administration
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 600, letterSpacing: '1.6px', textTransform: 'uppercase', color: 'rgba(0, 200, 255, .7)', marginBottom: 8 }}>
                    Identifiant
                  </label>
                  <div style={{ position: 'relative', borderRadius: 14, border: `2px solid ${error ? 'rgba(239,68,68,.5)' : username ? 'rgba(0, 200, 255, .3)' : 'rgba(255,255,255,.1)'}`, background: 'rgba(255,255,255,.02)', transition: 'all .25s' }}>
                    <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: username ? '#00c8ff' : 'rgba(255,255,255,.3)' }}>
                      <User size={18} />
                    </span>
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="superadmin"
                      style={{ width: '100%', padding: '14px 46px 14px 50px', border: 'none', background: 'transparent', fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: '#fff', outline: 'none', borderRadius: 14 }} />
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 600, letterSpacing: '1.6px', textTransform: 'uppercase', color: 'rgba(0, 200, 255, .7)', marginBottom: 8 }}>
                    Mot de passe
                  </label>
                  <div style={{ position: 'relative', borderRadius: 14, border: `2px solid ${error ? 'rgba(239,68,68,.5)' : password ? 'rgba(0, 200, 255, .3)' : 'rgba(255,255,255,.1)'}`, background: 'rgba(255,255,255,.02)', transition: 'all .25s' }}>
                    <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: password ? '#00c8ff' : 'rgba(255,255,255,.3)' }}>
                      <Lock size={18} />
                    </span>
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe"
                      style={{ width: '100%', padding: '14px 46px 14px 50px', border: 'none', background: 'transparent', fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: '#fff', outline: 'none', borderRadius: 14 }} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.4)', padding: 4, display: 'flex' }}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 18, fontSize: 12, color: '#ef4444', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Lock size={14} />{error}
                  </div>
                )}

                <button type="submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '16px 0', border: 'none', borderRadius: 14, background: 'linear-gradient(135deg, #00c8ff 0%, #0088cc 100%)', color: '#000', fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, letterSpacing: '1.3px', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 4px 25px rgba(0, 200, 255, .3)', transition: 'all 0.3s ease' }}>
                  {loading ? <><Loader2 size={18} className="animate-spin" />Vérification...</> : <><ArrowRight size={18} />Authentifier</>}
                </button>
              </form>

              <p style={{ textAlign: 'center', marginTop: 24, color: 'rgba(255,255,255,.2)', fontSize: 10 }}>
                Accès restreint - Usage autorisé uniquement
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Flash effect for screenshot */}
      {flashActive && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'white',
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Capture status indicator */}
      {capturedAlerts.length > 0 && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            left: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            background: 'rgba(0, 0, 0, .8)',
            border: '1px solid rgba(255, 0, 0, .5)',
            borderRadius: 8,
            zIndex: 10000,
          }}
        >
          <Camera size={18} style={{ color: '#ff0000', animation: 'pulseAlert 1s infinite' }} />
          <span style={{ color: '#ff0000', fontSize: 12, fontWeight: 600 }}>
            ENREGISTREMENT EN COURS
          </span>
        </div>
      )}
    </>
  )
}
