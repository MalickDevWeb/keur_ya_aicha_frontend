import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { getSignature, saveSignature, type Signature } from '@/services/api/signatures.api'

const CANVAS_W = 500
const CANVAS_H = 180

export function SettingsSignatureSection() {
  const { toast } = useToast()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [signature, setSignature] = useState<Signature | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void (async () => {
      setLoading(true)
      try {
        const sig = await getSignature()
        setSignature(sig)
      } catch (error) {
        toast({ title: 'Erreur', description: 'Impossible de charger la signature', variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    })()
  }, [toast])

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  useEffect(() => {
    clearCanvas()
  }, [])

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.strokeStyle = '#111827'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY)
    setIsDrawing(true)
  }

  const moveDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY)
    ctx.stroke()
  }

  const endDraw = () => {
    setIsDrawing(false)
  }

  const handleSave = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    try {
      setSaving(true)
      const dataUrl = canvas.toDataURL('image/png')
      const sig = await saveSignature(dataUrl)
      setSignature(sig)
      toast({ title: 'Signature enregistrée' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Échec de sauvegarde'
      toast({ title: 'Erreur', description: message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Signature électronique</CardTitle>
        <div className="text-sm text-muted-foreground">{loading ? 'Chargement…' : 'Dessinez puis enregistrez'}</div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="text-xs uppercase text-muted-foreground">Zone de signature</div>
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              className="border rounded-md bg-white shadow-sm touch-none"
              onPointerDown={startDraw}
              onPointerMove={moveDraw}
              onPointerUp={endDraw}
              onPointerLeave={endDraw}
            />
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={clearCanvas} disabled={saving}>
                Effacer
              </Button>
              <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
            </div>
          </div>
          {signature?.imageUrl && (
            <div className="space-y-2">
              <div className="text-xs uppercase text-muted-foreground">Signature actuelle</div>
              <img
                src={signature.imageUrl}
                alt="Signature enregistrée"
                className="border rounded-md bg-white max-w-xs"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
