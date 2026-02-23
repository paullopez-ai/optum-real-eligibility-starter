'use client'

import type { SyntheticPatient } from '@/types/patient.types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

const scenarioBadgeColors: Record<string, string> = {
  ELIGIBLE_ACTIVE: 'bg-green-500/15 text-green-400 border-green-500/30',
  ELIGIBLE_DEDUCTIBLE_MET: 'bg-primary/15 text-primary border-primary/30',
  ELIGIBLE_HIGH_COPAY: 'bg-brand/15 text-brand border-brand/30',
  INELIGIBLE_TERMED: 'bg-destructive/15 text-destructive border-destructive/30',
  INELIGIBLE_NOT_FOUND: 'bg-destructive/15 text-destructive border-destructive/30',
  ELIGIBLE_PENDING: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
}

interface PatientSelectorProps {
  patients: SyntheticPatient[]
  selectedPatient: SyntheticPatient | null
  onSelect: (patient: SyntheticPatient) => void
}

export function PatientSelector({ patients, selectedPatient, onSelect }: PatientSelectorProps) {
  return (
    <Select
      value={selectedPatient?.id ?? ''}
      onValueChange={(value) => {
        const patient = patients.find(p => p.id === value)
        if (patient) onSelect(patient)
      }}
    >
      <SelectTrigger className="w-full max-w-md h-12 text-base">
        <SelectValue placeholder="Select a patient to check eligibility..." />
      </SelectTrigger>
      <SelectContent>
        {patients.map((patient) => (
          <SelectItem key={patient.id} value={patient.id} className="py-3">
            <div className="flex items-center gap-3">
              <span className="font-medium">
                {patient.firstName} {patient.lastName}
              </span>
              <Badge variant="outline" className={`text-xs ${scenarioBadgeColors[patient.scenario]}`}>
                {patient.scenarioLabel}
              </Badge>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
