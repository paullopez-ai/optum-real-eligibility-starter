import type { ClaudeEligibilityAnnotation } from '@/types/claude.types'

interface ActionItemsProps {
  items: ClaudeEligibilityAnnotation['actionItems']
}

export function ActionItems({ items }: ActionItemsProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-secondary">
        Action Items
      </h3>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.priority} className="flex gap-3 p-3 bg-brand-secondary/5 border border-brand-secondary/20">
            <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 bg-brand-secondary text-brand-secondary-foreground text-xs font-bold">
              {item.priority}
            </span>
            <div className="space-y-1">
              <p className="text-sm font-medium">{item.action}</p>
              <p className="text-xs text-muted-foreground">{item.reason}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
