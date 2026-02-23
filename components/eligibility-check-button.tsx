'use client'

import { Button } from '@/components/ui/button'

interface EligibilityCheckButtonProps {
  isLoading: boolean
  isDisabled: boolean
  onClick: () => void
}

export function EligibilityCheckButton({ isLoading, isDisabled, onClick }: EligibilityCheckButtonProps) {
  return (
    <Button
      size="lg"
      className="w-full max-w-md h-12 text-base font-semibold"
      disabled={isDisabled || isLoading}
      onClick={onClick}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Checking...
        </span>
      ) : (
        'Check Eligibility'
      )}
    </Button>
  )
}
