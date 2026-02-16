import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getWorkItems, postWorkItem, updateWorkItem, deleteWorkItem } from '@/services/api'
import { useStore } from '@/stores/dataStore'
import { useGoBack } from '@/hooks/useGoBack'
import { SectionWrapper } from '@/pages/common/SectionWrapper'
import { WorkHeaderSection } from './sections/WorkHeaderSection'
import { WorkStatsSection } from './sections/WorkStatsSection'
import { WorkAddSection } from './sections/WorkAddSection'
import { WorkListSection } from './sections/WorkListSection'
import { WorkEmptySection } from './sections/WorkEmptySection'
import type { WorkItem } from './types'
import { buildNewWorkItem, detectWorkItems, mergeWorkItems, toggleWorkStatus } from './utils'

export default function WorkPage() {
  const navigate = useNavigate()
  const goBack = useGoBack('/dashboard')
  const clients = useStore((state) => state.clients)
  const [workItems, setWorkItems] = useState<WorkItem[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [showGuide, setShowGuide] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const savedItems = await getWorkItems()
        const detected = detectWorkItems(clients)
        setWorkItems(mergeWorkItems(savedItems, detected))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [clients])

  const pendingCount = workItems.filter((item) => item.status === 'pending').length
  const completedCount = workItems.filter((item) => item.status === 'completed').length

  const handleAddWork = async () => {
    if (!newTitle.trim()) return

    const newWork = buildNewWorkItem(newTitle, newDescription)
    await postWorkItem(newWork)
    setWorkItems((prev) => [newWork, ...prev])
    setNewTitle('')
    setNewDescription('')
  }

  const handleToggleStatus = async (id: string) => {
    const updated = workItems.map((item) =>
      item.id === id ? { ...item, status: toggleWorkStatus(item.status) } : item
    )
    const itemToUpdate = updated.find((item) => item.id === id)
    if (itemToUpdate && !itemToUpdate.autoDetected) {
      await updateWorkItem(itemToUpdate.id, itemToUpdate)
      setWorkItems(updated)
      return
    }
    setWorkItems(updated)
  }

  const handleDeleteWork = async (id: string) => {
    const item = workItems.find((item) => item.id === id)
    if (!item) return

    if (!item.autoDetected) {
      await deleteWorkItem(id)
    }
    setWorkItems(workItems.filter((workItem) => workItem.id !== id))
  }

  const handleNavigateToFix = (item: WorkItem) => {
    if (!item.autoDetected) return
    if (item.id.includes('missing-contracts')) {
      navigate('/documents?filter=missing-contracts')
    } else if (item.id.includes('unsigned-contracts')) {
      navigate('/documents?filter=unsigned-contracts')
    } else if (item.id.includes('invalid-clients')) {
      navigate('/clients?filter=invalid')
    } else if (item.id.includes('overdue-payments')) {
      navigate('/payments?filter=overdue')
    }
  }

  return (
    <div className="space-y-6">
      <SectionWrapper>
        <WorkHeaderSection onBack={() => goBack('/dashboard')} showGuide={showGuide} onToggleGuide={() => setShowGuide((prev) => !prev)} />
      </SectionWrapper>

      <SectionWrapper>
        <WorkStatsSection pending={pendingCount} completed={completedCount} />
      </SectionWrapper>

      <SectionWrapper>
        <WorkAddSection
          title={newTitle}
          description={newDescription}
          onTitleChange={setNewTitle}
          onDescriptionChange={setNewDescription}
          onAdd={handleAddWork}
        />
      </SectionWrapper>

      {!loading && workItems.length > 0 && (
        <SectionWrapper>
          <WorkListSection items={workItems} onToggleStatus={handleToggleStatus} onDelete={handleDeleteWork} onFix={handleNavigateToFix} />
        </SectionWrapper>
      )}

      {!loading && workItems.length === 0 && (
        <SectionWrapper>
          <WorkEmptySection message="Aucun travail enregistré. Ajoutez-en un ci-dessus!" />
        </SectionWrapper>
      )}
    </div>
  )
}
