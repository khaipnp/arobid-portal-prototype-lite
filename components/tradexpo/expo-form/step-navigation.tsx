import { cn } from "@/lib/utils"
import type { ExpoFormStep } from "./types"

type StepNavigationProps = {
  steps: ExpoFormStep[]
  activeStep: ExpoFormStep
  onStepChange: (stepId: ExpoFormStep["id"]) => void
}

export function StepNavigation({
  steps,
  activeStep,
  onStepChange
}: StepNavigationProps) {
  return (
    <nav
      aria-label="Expo form steps"
      className="flex gap-2 overflow-x-auto rounded-2xl border bg-card p-2 lg:flex-col lg:self-start"
    >
      {steps.map((step, index) => {
        const isActive = step.id === activeStep.id

        return (
          <button
            key={step.id}
            type="button"
            onClick={() => onStepChange(step.id)}
            className={cn(
              "flex min-w-56 items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors lg:min-w-0",
              isActive
                ? "bg-legend/10 text-legend"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            )}
            aria-current={isActive ? "step" : undefined}
          >
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full font-medium text-xs",
                isActive
                  ? "bg-legend text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {index + 1}
            </span>
            <span className="grid gap-1">
              <span className="font-medium text-sm capitalize leading-none">
                {step.title}
              </span>
              <span className="line-clamp-2 text-xs leading-snug">
                {step.description}
              </span>
            </span>
          </button>
        )
      })}
    </nav>
  )
}
