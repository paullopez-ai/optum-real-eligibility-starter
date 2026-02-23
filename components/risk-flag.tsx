import type { ClaudeEligibilityAnnotation } from '@/types/claude.types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { HugeiconsIcon } from '@hugeicons/react'
import { AlertCircleIcon } from '@hugeicons/core-free-icons'

interface RiskFlagProps {
  riskFlag: ClaudeEligibilityAnnotation['riskFlag']
}

export function RiskFlag({ riskFlag }: RiskFlagProps) {
  if (!riskFlag.hasRisk) return null

  const isHigh = riskFlag.riskLevel === 'HIGH'

  return (
    <Alert className={isHigh
      ? 'border-destructive/50 bg-destructive/10'
      : 'border-brand/50 bg-brand/10'
    }>
      <HugeiconsIcon icon={AlertCircleIcon} className={`h-4 w-4 ${isHigh ? 'text-destructive' : 'text-brand'}`} />
      <AlertTitle className={`font-semibold ${isHigh ? 'text-destructive' : 'text-brand'}`}>
        {isHigh ? 'High Risk' : 'Caution'}: {riskFlag.riskSummary}
      </AlertTitle>
      <AlertDescription className="text-sm mt-1">
        {riskFlag.specificReason}
      </AlertDescription>
    </Alert>
  )
}
