import { Badge } from '@/components/ui/badge'

export function SandboxDisclosure() {
  return (
    <footer className="w-full py-6 text-center">
      <Badge variant="outline" className="text-xs text-muted-foreground border-muted-foreground/20 px-4 py-1.5">
        Sandbox Environment — This demo uses synthetic data from the Optum sandbox API. No real patient information is displayed.
      </Badge>
    </footer>
  )
}
