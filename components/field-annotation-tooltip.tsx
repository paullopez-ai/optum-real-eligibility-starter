import type { ClaudeEligibilityAnnotation } from '@/types/claude.types'
import { Badge } from '@/components/ui/badge'

interface FieldAnnotationTooltipProps {
  annotation: ClaudeEligibilityAnnotation['fieldAnnotations'][number]
}

const importanceColors: Record<string, string> = {
  HIGH: 'bg-brand-secondary text-brand-secondary-foreground',
  MEDIUM: 'bg-brand-secondary/60 text-brand-secondary-foreground',
  LOW: 'bg-muted text-muted-foreground',
}

export function FieldAnnotationTooltip({ annotation }: FieldAnnotationTooltipProps) {
  return (
    <div className="absolute z-50 bottom-full left-0 mb-2 w-72 p-3 bg-zinc-900 border border-brand-secondary/40 shadow-lg shadow-brand-secondary/10">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-brand-secondary">
          {annotation.plainEnglishLabel}
        </span>
        <Badge className={`text-[10px] px-1.5 py-0 ${importanceColors[annotation.importance]}`}>
          {annotation.importance}
        </Badge>
      </div>
      <p className="text-xs text-zinc-300 leading-relaxed">
        {annotation.explanation}
      </p>
      <div className="mt-2 pt-2 border-t border-zinc-700">
        <span className="text-[10px] text-zinc-500 font-mono">{annotation.fieldName}: {annotation.fieldValue}</span>
      </div>
    </div>
  )
}
