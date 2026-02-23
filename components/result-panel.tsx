'use client'

import { motion } from 'framer-motion'
import type { EligibilityResult } from '@/types/patient.types'
import type { EligibilityScenario } from '@/types/patient.types'
import { ClaudeAnnotationPanel } from './claude-annotation-panel'
import { RawResponsePanel } from './raw-response-panel'
import { Badge } from '@/components/ui/badge'

interface ResultPanelProps {
  result: EligibilityResult
  scenario: EligibilityScenario
}

export function ResultPanel({ result, scenario }: ResultPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <div className="flex items-center gap-3 mb-4">
        <Badge variant="outline" className="font-mono text-xs text-muted-foreground">
          Eligibility: {result.durationMs.eligibility}ms
        </Badge>
        <Badge variant="outline" className="font-mono text-xs text-brand-secondary border-brand-secondary/30">
          AI Annotation: {result.durationMs.annotation}ms
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 p-6 border border-brand-secondary/20 bg-brand-secondary/[0.02]">
          <ClaudeAnnotationPanel annotation={result.annotation} scenario={scenario} />
        </div>
        <div className="lg:col-span-2 border border-border overflow-hidden">
          <RawResponsePanel
            response={result.rawResponse}
            fieldAnnotations={result.annotation.fieldAnnotations}
          />
        </div>
      </div>
    </motion.div>
  )
}
