'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface LoadingSequenceProps {
  step: 'eligibility' | 'annotation'
  payerName?: string
}

export function LoadingSequence({ step, payerName = 'UnitedHealthcare' }: LoadingSequenceProps) {
  return (
    <div className="w-full max-w-2xl mx-auto py-12">
      <div className="space-y-6">
        <AnimatePresence mode="wait">
          {step === 'eligibility' ? (
            <motion.div
              key="eligibility"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-4"
            >
              <div className="relative h-8 w-8 flex-shrink-0">
                <motion.div
                  className="absolute inset-0 border-2 border-primary border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{ borderRadius: '50%' }}
                />
              </div>
              <div>
                <p className="text-lg font-medium">
                  Verifying coverage with {payerName}...
                </p>
                <p className="text-sm text-muted-foreground">
                  Sending 270 eligibility request to Optum Real API
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="annotation"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-4"
            >
              <div className="relative h-8 w-8 flex-shrink-0">
                <motion.div
                  className="absolute inset-0 border-2 border-brand-secondary border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{ borderRadius: '50%' }}
                />
              </div>
              <div>
                <p className="text-lg font-medium text-brand-secondary">
                  Interpreting results with AI...
                </p>
                <p className="text-sm text-muted-foreground">
                  Claude is analyzing the 271 response in plain English
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2">
          <motion.div
            className={`h-1 flex-1 ${step === 'eligibility' ? 'bg-primary' : 'bg-primary'}`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5 }}
            style={{ transformOrigin: 'left' }}
          />
          <motion.div
            className={`h-1 flex-1 ${step === 'annotation' ? 'bg-brand-secondary' : 'bg-muted'}`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: step === 'annotation' ? 1 : 0 }}
            transition={{ duration: 0.5 }}
            style={{ transformOrigin: 'left' }}
          />
        </div>
      </div>
    </div>
  )
}
