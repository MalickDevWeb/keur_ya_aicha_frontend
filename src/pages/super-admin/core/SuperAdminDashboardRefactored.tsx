import type { AdminDTO } from '@/dto/frontend/responses'
import { SuperAdminDashboard } from './SuperAdminDashboard'

interface SuperAdminDashboardRefactoredProps {
  onCreatedAdmin?: (admin: AdminDTO) => void
}

/**
 * Thin wrapper to keep legacy imports working.
 * All logic now lives in SuperAdminDashboard + useSuperAdminDashboard.
 */
export function SuperAdminDashboardRefactored({ onCreatedAdmin }: SuperAdminDashboardRefactoredProps) {
  return <SuperAdminDashboard onCreatedAdmin={onCreatedAdmin} />
}
