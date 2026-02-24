'use client'

import { motion } from 'framer-motion'
import type { SyntheticPatient } from '@/types/patient.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const scenarioBadgeColors: Record<string, string> = {
  ELIGIBLE_ACTIVE: 'bg-green-500/15 text-green-400 border-green-500/30',
  ELIGIBLE_DEDUCTIBLE_MET: 'bg-primary/15 text-primary border-primary/30',
  ELIGIBLE_HIGH_COPAY: 'bg-brand/15 text-brand border-brand/30',
  INELIGIBLE_TERMED: 'bg-destructive/15 text-destructive border-destructive/30',
  INELIGIBLE_NOT_FOUND: 'bg-destructive/15 text-destructive border-destructive/30',
  ELIGIBLE_PENDING: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
}

interface PatientCardProps {
  patient: SyntheticPatient
}

export function PatientCard({ patient }: PatientCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="font-display text-2xl">
              {patient.firstName} {patient.lastName}
            </CardTitle>
            <Badge variant="outline" className={scenarioBadgeColors[patient.scenario]}>
              {patient.scenarioLabel}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Date of Birth</span>
              <p className="font-mono">{patient.dateOfBirth}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Member ID</span>
              <p className="font-mono">{patient.memberId}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Insurance Plan</span>
              <p className="font-medium">{patient.insurancePlan}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Primary Care Provider</span>
              <p className="font-medium">{patient.primaryCareProvider}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
