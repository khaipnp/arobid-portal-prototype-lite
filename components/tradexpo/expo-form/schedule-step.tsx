import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EXPO_FORM_TIMEZONES } from "@/lib/tradexpo/expo-form-utils";
import { EXPO_MONTH_OPTIONS } from "@/lib/tradexpo/schedule";
import type { ExpoSchedulePrecision } from "@/lib/tradexpo/types";
import { SCHEDULE_PRECISION_OPTIONS } from "./constants";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2Icon } from "lucide-react";

type ScheduleStepProps = {
  schedulePrecision: ExpoSchedulePrecision;
  onSchedulePrecisionChange: (value: ExpoSchedulePrecision) => void;
  startLocal: string;
  onStartLocalChange: (value: string) => void;
  endLocal: string;
  onEndLocalChange: (value: string) => void;
  timezone: string;
  onTimezoneChange: (value: string) => void;
  scheduleMonth: string;
  onScheduleMonthChange: (value: string) => void;
  scheduleYear: string;
  onScheduleYearChange: (value: string) => void;
  scheduleError: string | null;
  onScheduleErrorChange: (value: string | null) => void;
};

export function ScheduleStep({
  schedulePrecision,
  onSchedulePrecisionChange,
  startLocal,
  onStartLocalChange,
  endLocal,
  onEndLocalChange,
  timezone,
  onTimezoneChange,
  scheduleMonth,
  onScheduleMonthChange,
  scheduleYear,
  onScheduleYearChange,
  scheduleError,
  onScheduleErrorChange,
}: ScheduleStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-semibold text-xl leading-none">Schedule</h2>
        <p className="text-muted-foreground text-sm">
          Choose how precise the Expo schedule is right now.
        </p>
      </div>

      <section className="space-y-6">
        <RadioGroup
          value={schedulePrecision}
          onValueChange={(value) => {
            onSchedulePrecisionChange(value as ExpoSchedulePrecision);
            onScheduleErrorChange(null);
          }}
          className="grid gap-3 md:grid-cols-3"
        >
          {SCHEDULE_PRECISION_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer gap-3 rounded-2xl border p-3 text-sm transition-colors hover:bg-muted/60 has-data-[state=checked]:border-legend has-data-[state=checked]:bg-legend/5"
            >
              <RadioGroupItem value={option.value} />
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-base">{option.label}</span>
                <span className="text-muted-foreground text-sm">
                  {option.description}
                </span>
              </div>
            </label>
          ))}
        </RadioGroup>

        {schedulePrecision === "exact_date_range" ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="start">Start</Label>
              <Input
                id="start"
                type="datetime-local"
                value={startLocal}
                onChange={(e) => onStartLocalChange(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end">End</Label>
              <Input
                id="end"
                type="datetime-local"
                value={endLocal}
                onChange={(e) => onEndLocalChange(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Timezone</Label>
              <Select value={timezone} onValueChange={onTimezoneChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPO_FORM_TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : null}

        {schedulePrecision === "month_year" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Month</Label>
              <Select
                value={scheduleMonth}
                onValueChange={onScheduleMonthChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {EXPO_MONTH_OPTIONS.map((month) => (
                    <SelectItem key={month.value} value={String(month.value)}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="schedule-year">Year</Label>
              <Input
                id="schedule-year"
                inputMode="numeric"
                pattern="[0-9]{4}"
                value={scheduleYear}
                onChange={(e) => onScheduleYearChange(e.target.value)}
                placeholder="2026"
                required
              />
            </div>
          </div>
        ) : null}

        {schedulePrecision === "unscheduled" ? (
          <Alert>
            <CheckCircle2Icon />
            <AlertTitle>TBA Information</AlertTitle>
            <AlertDescription>
              Schedule to be announced. You can add exact dates later from Edit
              Expo.
            </AlertDescription>
          </Alert>
        ) : null}

        {scheduleError ? (
          <p className="text-destructive text-xs">{scheduleError}</p>
        ) : null}
      </section>
    </div>
  );
}
