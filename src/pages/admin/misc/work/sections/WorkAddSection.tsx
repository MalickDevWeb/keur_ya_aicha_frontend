import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type WorkAddSectionProps = {
  title: string
  description: string
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onAdd: () => void
}

export function WorkAddSection({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  onAdd,
}: WorkAddSectionProps) {
  return (
    <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Ajouter un travail
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Input placeholder="Titre du travail..." value={title} onChange={(event) => onTitleChange(event.target.value)} />
          <Input
            placeholder="Description (optionnel)"
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
          />
          <Button className="w-full gap-2 bg-gradient-to-r from-blue-600 to-cyan-600" onClick={onAdd}>
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
