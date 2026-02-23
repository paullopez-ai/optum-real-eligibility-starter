'use client'

import type { ClaudeEligibilityAnnotation } from '@/types/claude.types'
import type { EligibilityScenario } from '@/types/patient.types'
import { CoverageSummary } from './coverage-summary'
import { ResponsibilityBreakdown } from './responsibility-breakdown'
import { ActionItems } from './action-items'
import { RiskFlag } from './risk-flag'

interface ClaudeAnnotationPanelProps {
  annotation: ClaudeEligibilityAnnotation
  scenario: EligibilityScenario
}

export function ClaudeAnnotationPanel({ annotation, scenario }: ClaudeAnnotationPanelProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-2 w-2 bg-brand-secondary" />
        <span className="text-xs font-semibold uppercase tracking-wider text-brand-secondary">
          AI-Powered Analysis
        </span>
      </div>

      <CoverageSummary summary={annotation.coverageStatusSummary} scenario={scenario} />

      <ResponsibilityBreakdown responsibility={annotation.patientResponsibility} />

      <RiskFlag riskFlag={annotation.riskFlag} />

      <ActionItems items={annotation.actionItems} />

      <div className="pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground italic">
          {annotation.sandboxNote}
        </p>
      </div>
    </div>
  )
}
