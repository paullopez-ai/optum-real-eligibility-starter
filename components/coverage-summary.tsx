import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircleIcon, CancelCircleIcon, TimeQuarterIcon } from '@hugeicons/core-free-icons'
import type { EligibilityScenario } from '@/types/patient.types'

interface CoverageSummaryProps {
  summary: string
  scenario: EligibilityScenario
}

function getStatusIcon(scenario: EligibilityScenario) {
  if (scenario === 'INELIGIBLE_TERMED' || scenario === 'INELIGIBLE_NOT_FOUND') {
    return { icon: CancelCircleIcon, className: 'text-destructive' }
  }
  if (scenario === 'ELIGIBLE_PENDING') {
    return { icon: TimeQuarterIcon, className: 'text-yellow-400' }
  }
  return { icon: CheckmarkCircleIcon, className: 'text-green-400' }
}

export function CoverageSummary({ summary, scenario }: CoverageSummaryProps) {
  const status = getStatusIcon(scenario)

  return (
    <div className="flex items-start gap-4 p-4 border-l-4 border-brand-secondary bg-brand-secondary/5">
      <HugeiconsIcon icon={status.icon} className={`h-8 w-8 flex-shrink-0 mt-0.5 ${status.className}`} />
      <p className="text-lg font-medium leading-relaxed text-brand-secondary">
        {summary}
      </p>
    </div>
  )
}
