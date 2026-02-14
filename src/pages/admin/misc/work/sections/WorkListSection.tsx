import { CheckCircle2, Circle, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { WorkItem } from '../types'
import { getPriorityBadgeClass, getPriorityLabel, getStatusLabel } from '../utils'

type WorkListSectionProps = {
  items: WorkItem[]
  onToggleStatus: (id: string) => void
  onDelete: (id: string) => void
  onFix: (item: WorkItem) => void
}

export function WorkListSection({ items, onToggleStatus, onDelete, onFix }: WorkListSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Liste des travaux</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">État</TableHead>
                <TableHead>Titre</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Priorité</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} className={item.status === 'completed' ? 'opacity-60' : ''}>
                  <TableCell>
                    <button onClick={() => onToggleStatus(item.id)} className="hover:scale-110 transition-transform">
                      {item.status === 'completed' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="font-medium">
                    {item.autoDetected ? (
                      <button onClick={() => onFix(item)} className="text-blue-600 hover:underline cursor-pointer">
                        {item.title}
                      </button>
                    ) : (
                      item.title
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{item.description}</TableCell>
                  <TableCell>
                    <Badge className={`${getPriorityBadgeClass(item.priority)} text-white`}>{getPriorityLabel(item.priority)}</Badge>
                  </TableCell>
                  <TableCell>{getStatusLabel(item.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {item.autoDetected && (
                        <Button variant="outline" size="sm" onClick={() => onFix(item)}>
                          🔧 Corriger
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDelete(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
