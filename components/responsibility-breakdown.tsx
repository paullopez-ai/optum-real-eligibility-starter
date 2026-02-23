import type { ClaudeEligibilityAnnotation } from '@/types/claude.types'
import { Card, CardContent } from '@/components/ui/card'

interface ResponsibilityBreakdownProps {
  responsibility: ClaudeEligibilityAnnotation['patientResponsibility']
}

export function ResponsibilityBreakdown({ responsibility }: ResponsibilityBreakdownProps) {
  const items = [
    { label: 'Deductible Remaining', value: responsibility.deductibleRemaining },
    { label: 'Copay', value: responsibility.copay },
    { label: 'Coinsurance', value: responsibility.coinsurance },
    { label: 'Out-of-Pocket Maximum', value: responsibility.outOfPocketMax },
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-secondary">
        Patient Responsibility
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item) => (
          <Card key={item.label} className="bg-brand-secondary/5 border-brand-secondary/20">
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                {item.label}
              </p>
              <p className="text-sm text-brand-secondary leading-relaxed">
                {item.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="p-3 bg-brand-secondary/10 border border-brand-secondary/20">
        <p className="text-sm text-brand-secondary italic">
          &ldquo;{responsibility.plainEnglishSummary}&rdquo;
        </p>
      </div>
    </div>
  )
}
