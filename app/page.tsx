'use client'

import { useReducer, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { SyntheticPatient, AppState, EligibilityResult } from '@/types/patient.types'
import type { EligibilityResponse } from '@/types/optum.types'
import { syntheticPatients } from '@/lib/patients'
import { ThemeToggle } from '@/components/theme-toggle'
import { PatientSelector } from '@/components/patient-selector'
import { PatientCard } from '@/components/patient-card'
import { EligibilityCheckButton } from '@/components/eligibility-check-button'
import { LoadingSequence } from '@/components/loading-sequence'
import { ResultPanel } from '@/components/result-panel'
import { RawResponsePanel } from '@/components/raw-response-panel'
import { SandboxDisclosure } from '@/components/sandbox-disclosure'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { HugeiconsIcon } from '@hugeicons/react'
import { AlertCircleIcon } from '@hugeicons/core-free-icons'

type AppAction =
  | { type: 'SELECT_PATIENT'; patient: SyntheticPatient }
  | { type: 'START_CHECK' }
  | { type: 'ELIGIBILITY_COMPLETE' }
  | { type: 'CHECK_SUCCESS'; result: EligibilityResult }
  | { type: 'CHECK_ERROR'; error: string }
  | { type: 'CHECK_FALLBACK'; rawResponse: EligibilityResponse }
  | { type: 'RESET' }

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SELECT_PATIENT':
      return { status: 'selected', patient: action.patient }
    case 'START_CHECK':
      if ('patient' in state) {
        return { status: 'loading', patient: state.patient, step: 'eligibility' }
      }
      return state
    case 'ELIGIBILITY_COMPLETE':
      if (state.status === 'loading') {
        return { ...state, step: 'annotation' }
      }
      return state
    case 'CHECK_SUCCESS':
      if (state.status === 'loading') {
        return { status: 'success', patient: state.patient, result: action.result }
      }
      return state
    case 'CHECK_ERROR':
      if (state.status === 'loading') {
        return { status: 'error', patient: state.patient, error: action.error }
      }
      return state
    case 'CHECK_FALLBACK':
      if (state.status === 'loading') {
        return { status: 'fallback', patient: state.patient, rawResponse: action.rawResponse }
      }
      return state
    case 'RESET':
      return { status: 'idle' }
    default:
      return state
  }
}

export default function Home() {
  const [state, dispatch] = useReducer(appReducer, { status: 'idle' })

  const selectedPatient = 'patient' in state ? state.patient : null
  const isLoading = state.status === 'loading'

  const handleCheckEligibility = useCallback(async () => {
    if (!selectedPatient) return

    dispatch({ type: 'START_CHECK' })

    try {
      const stepTimer = setTimeout(() => {
        dispatch({ type: 'ELIGIBILITY_COMPLETE' })
      }, 600)

      const response = await fetch('/api/optum/eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient: selectedPatient }),
      })

      clearTimeout(stepTimer)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.annotation) {
        dispatch({
          type: 'CHECK_SUCCESS',
          result: {
            rawResponse: data.rawResponse,
            annotation: data.annotation,
            durationMs: data.durationMs,
          },
        })
      } else {
        dispatch({ type: 'CHECK_FALLBACK', rawResponse: data.rawResponse })
      }
    } catch (error) {
      dispatch({
        type: 'CHECK_ERROR',
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      })
    }
  }, [selectedPatient])

  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <header className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="font-display text-5xl font-bold tracking-tight">
              Eligibility Explorer
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              What does real-time insurance verification actually look like?
            </p>
            <div className="flex gap-2 pt-1">
              <Badge variant="outline" className="text-xs">Optum Real API</Badge>
              <Badge variant="outline" className="text-xs text-brand-secondary border-brand-secondary/30">Claude AI</Badge>
              <Badge variant="outline" className="text-xs text-muted-foreground">Sandbox Mode</Badge>
            </div>
          </div>
          <ThemeToggle />
        </header>

        {/* Patient Selection */}
        <section className="space-y-6">
          <PatientSelector
            patients={syntheticPatients}
            selectedPatient={selectedPatient}
            onSelect={(patient) => dispatch({ type: 'SELECT_PATIENT', patient })}
          />

          <AnimatePresence mode="wait">
            {selectedPatient && state.status !== 'loading' && (
              <motion.div
                key={selectedPatient.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <PatientCard patient={selectedPatient} />
                <EligibilityCheckButton
                  isLoading={false}
                  isDisabled={false}
                  onClick={handleCheckEligibility}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Loading State */}
        <AnimatePresence>
          {state.status === 'loading' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <EligibilityCheckButton
                isLoading={true}
                isDisabled={true}
                onClick={() => {}}
              />
              <LoadingSequence step={state.step} payerName="UnitedHealthcare" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Result */}
        <AnimatePresence>
          {state.status === 'success' && (
            <ResultPanel result={state.result} scenario={state.patient.scenario} />
          )}
        </AnimatePresence>

        {/* Fallback: Raw Response Only */}
        <AnimatePresence>
          {state.status === 'fallback' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Alert className="border-brand/50 bg-brand/10">
                <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4 text-brand" />
                <AlertTitle className="text-brand font-semibold">AI annotation unavailable</AlertTitle>
                <AlertDescription>
                  Showing raw eligibility data. The Claude annotation service did not respond. The eligibility data below is still accurate.
                </AlertDescription>
              </Alert>
              <div className="border border-border overflow-hidden">
                <RawResponsePanel response={state.rawResponse} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error State */}
        <AnimatePresence>
          {state.status === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Alert variant="destructive">
                <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4" />
                <AlertTitle>Eligibility Check Failed</AlertTitle>
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <SandboxDisclosure />
      </div>
    </main>
  )
}
