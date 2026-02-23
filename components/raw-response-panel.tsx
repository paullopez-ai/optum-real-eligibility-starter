'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { EligibilityResponse } from '@/types/optum.types'
import type { ClaudeEligibilityAnnotation } from '@/types/claude.types'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FieldAnnotationTooltip } from './field-annotation-tooltip'

interface RawResponsePanelProps {
  response: EligibilityResponse
  fieldAnnotations?: ClaudeEligibilityAnnotation['fieldAnnotations']
}

function syntaxHighlight(json: string): Array<{ text: string; type: 'key' | 'string' | 'number' | 'boolean' | 'null' | 'punctuation' }> {
  const tokens: Array<{ text: string; type: 'key' | 'string' | 'number' | 'boolean' | 'null' | 'punctuation' }> = []
  const regex = /("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?|[{}[\],])/g
  let match

  while ((match = regex.exec(json)) !== null) {
    let type: 'key' | 'string' | 'number' | 'boolean' | 'null' | 'punctuation' = 'punctuation'
    if (/^"/.test(match[0])) {
      type = match[3] ? 'key' : 'string'
    } else if (/true|false/.test(match[0])) {
      type = 'boolean'
    } else if (/null/.test(match[0])) {
      type = 'null'
    } else if (/^-?\d/.test(match[0])) {
      type = 'number'
    }
    tokens.push({ text: match[0], type })
  }

  return tokens
}

const typeColors: Record<string, string> = {
  key: 'text-primary',
  string: 'text-green-400',
  number: 'text-brand',
  boolean: 'text-brand',
  null: 'text-muted-foreground',
  punctuation: 'text-muted-foreground',
}

export function RawResponsePanel({ response, fieldAnnotations }: RawResponsePanelProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [hoveredField, setHoveredField] = useState<string | null>(null)

  const jsonString = JSON.stringify(response, null, 2)
  const tokens = syntaxHighlight(jsonString)

  const annotationMap = new Map(
    (fieldAnnotations ?? []).map(a => [a.fieldName, a])
  )

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Raw API Response
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </Button>
      </div>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-hidden"
          >
            <ScrollArea className="h-[600px]">
              <pre className="p-4 text-xs font-mono leading-relaxed bg-zinc-950 text-zinc-300 relative">
                {tokens.map((token, i) => {
                  const cleanKey = token.type === 'key' ? token.text.replace(/"/g, '').replace(/:$/, '').trim() : null
                  const annotation = cleanKey ? annotationMap.get(cleanKey) : null
                  const hasAnnotation = !!annotation

                  if (hasAnnotation && annotation) {
                    return (
                      <span
                        key={i}
                        className={`${typeColors[token.type]} cursor-help border-b border-dashed border-brand-secondary/50 relative`}
                        onMouseEnter={() => setHoveredField(cleanKey)}
                        onMouseLeave={() => setHoveredField(null)}
                      >
                        {token.text}
                        {hoveredField === cleanKey && (
                          <FieldAnnotationTooltip annotation={annotation} />
                        )}
                      </span>
                    )
                  }

                  return (
                    <span key={i} className={typeColors[token.type]}>
                      {token.text}
                    </span>
                  )
                })}
              </pre>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
