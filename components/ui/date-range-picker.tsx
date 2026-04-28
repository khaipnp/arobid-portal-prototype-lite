"use client"

import { format, isValid, parse } from "date-fns"
import { CalendarIcon, ChevronDown } from "lucide-react"
import * as React from "react"
import type { DateRange } from "react-day-picker"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { Label } from "./label"

const DATE_FORMAT = "MMM d, yyyy"
const TIME_FORMAT = "h:mm a"

interface DateRangePickerProps {
  value?: DateRange
  onChange?: (range: DateRange | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  /**
   * Override the timezone label shown in the footer. Defaults to the
   * browser's resolved IANA timezone (e.g. "Asia/Saigon").
   */
  timezoneLabel?: string
}

function formatDate(date: Date | undefined): string {
  return date ? format(date, DATE_FORMAT) : ""
}

function formatTime(date: Date | undefined): string {
  return date ? format(date, TIME_FORMAT) : ""
}

function parseDateInput(input: string): Date | undefined {
  const parsed = parse(input, DATE_FORMAT, new Date())
  return isValid(parsed) ? parsed : undefined
}

function parseTimeInput(input: string, base: Date): Date | undefined {
  const parsed = parse(input, TIME_FORMAT, base)
  return isValid(parsed) ? parsed : undefined
}

function mergeDateAndTime(date: Date, time: Date): Date {
  const merged = new Date(date)
  merged.setHours(time.getHours(), time.getMinutes(), 0, 0)
  return merged
}

function getLocalTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return "Local"
  }
}

function formatTriggerLabel(range: DateRange | undefined): string | null {
  if (!range?.from) return null
  if (!range.to) return format(range.from, "MMM d, yyyy h:mm a")
  const sameDay =
    range.from.getFullYear() === range.to.getFullYear() &&
    range.from.getMonth() === range.to.getMonth() &&
    range.from.getDate() === range.to.getDate()
  if (sameDay) {
    return `${format(range.from, "MMM d, yyyy")} · ${format(range.from, "h:mm a")} – ${format(range.to, "h:mm a")}`
  }
  return `${format(range.from, "MMM d, yyyy h:mm a")} – ${format(range.to, "MMM d, yyyy h:mm a")}`
}

function DateRangePicker({
  value,
  onChange,
  placeholder = "Select Date Range",
  className,
  disabled,
  timezoneLabel,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [draft, setDraft] = React.useState<DateRange | undefined>(value)
  const [startDateText, setStartDateText] = React.useState(
    formatDate(value?.from),
  )
  const [startTimeText, setStartTimeText] = React.useState(
    formatTime(value?.from),
  )
  const [endDateText, setEndDateText] = React.useState(formatDate(value?.to))
  const [endTimeText, setEndTimeText] = React.useState(formatTime(value?.to))

  const syncFromValue = React.useCallback((next: DateRange | undefined) => {
    setDraft(next)
    setStartDateText(formatDate(next?.from))
    setStartTimeText(formatTime(next?.from))
    setEndDateText(formatDate(next?.to))
    setEndTimeText(formatTime(next?.to))
  }, [])

  React.useEffect(() => {
    if (!open) {
      syncFromValue(value)
    }
  }, [value, open, syncFromValue])

  const resolvedTimezone = timezoneLabel ?? getLocalTimezone()
  const triggerLabel = formatTriggerLabel(value)
  const isEmpty = !value?.from && !value?.to

  const handleCalendarSelect = (range: DateRange | undefined) => {
    if (!range) {
      setDraft(undefined)
      setStartDateText("")
      setStartTimeText("")
      setEndDateText("")
      setEndTimeText("")
      return
    }

    const rangeFrom = range.from
    const rangeTo = range.to

    const from = rangeFrom
      ? mergeDateAndTime(
          rangeFrom,
          draft?.from ??
            (() => {
              const d = new Date(rangeFrom)
              d.setHours(0, 0, 0, 0)
              return d
            })(),
        )
      : undefined

    const to = rangeTo
      ? mergeDateAndTime(
          rangeTo,
          draft?.to ??
            (() => {
              const d = new Date(rangeTo)
              d.setHours(23, 59, 0, 0)
              return d
            })(),
        )
      : undefined

    const next: DateRange = { from, to }
    setDraft(next)
    setStartDateText(formatDate(from))
    if (!startTimeText) setStartTimeText(from ? formatTime(from) : "12:00 AM")
    setEndDateText(formatDate(to))
    if (!endTimeText) setEndTimeText(to ? formatTime(to) : "11:59 PM")
  }

  const commitStartDate = (text: string) => {
    const parsed = parseDateInput(text)
    if (!parsed) return
    const base = draft?.from ?? new Date(parsed)
    const withTime = mergeDateAndTime(parsed, base)
    setDraft((prev) => ({ from: withTime, to: prev?.to }))
    setStartDateText(formatDate(withTime))
  }

  const commitStartTime = (text: string) => {
    if (!draft?.from) return
    const parsed = parseTimeInput(text, draft.from)
    if (!parsed) return
    const withTime = mergeDateAndTime(draft.from, parsed)
    setDraft((prev) => ({ from: withTime, to: prev?.to }))
    setStartTimeText(formatTime(withTime))
  }

  const commitEndDate = (text: string) => {
    const parsed = parseDateInput(text)
    if (!parsed) return
    const base =
      draft?.to ??
      (() => {
        const d = new Date(parsed)
        d.setHours(23, 59, 0, 0)
        return d
      })()
    const withTime = mergeDateAndTime(parsed, base)
    setDraft((prev) => ({ from: prev?.from, to: withTime }))
    setEndDateText(formatDate(withTime))
  }

  const commitEndTime = (text: string) => {
    if (!draft?.to) return
    const parsed = parseTimeInput(text, draft.to)
    if (!parsed) return
    const withTime = mergeDateAndTime(draft.to, parsed)
    setDraft((prev) => ({ from: prev?.from, to: withTime }))
    setEndTimeText(formatTime(withTime))
  }

  const apply = () => {
    onChange?.(draft)
    setOpen(false)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter") {
      event.preventDefault()
      apply()
    }
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) syncFromValue(value)
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-empty={isEmpty}
          disabled={disabled}
          className={cn(
            "justify-start rounded-lg text-left font-normal data-[empty=true]:text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">{triggerLabel ?? placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[20rem] p-0"
        onKeyDown={handleKeyDown}
      >
        <Calendar
          mode="range"
          selected={draft}
          onSelect={handleCalendarSelect}
          numberOfMonths={1}
          initialFocus
          className="w-full"
        />

        <Separator />

        <div className="space-y-3 px-3 py-1">
          <div className="space-y-1">
            <Label
              htmlFor="date-range-start"
              className="font-medium text-muted-foreground text-xs"
            >
              Start
            </Label>
            <div className="flex gap-2">
              <Input
                id="date-range-start"
                value={startDateText}
                placeholder={DATE_FORMAT}
                onChange={(event) => setStartDateText(event.target.value)}
                onBlur={(event) => commitStartDate(event.target.value)}
                className="h-9 flex-1 text-sm"
              />
              <Input
                aria-label="Start time"
                value={startTimeText}
                placeholder={TIME_FORMAT}
                onChange={(event) => setStartTimeText(event.target.value)}
                onBlur={(event) => commitStartTime(event.target.value)}
                className="h-9 w-24 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="date-range-end"
              className="font-medium text-muted-foreground text-xs"
            >
              End
            </Label>
            <div className="flex gap-2">
              <Input
                id="date-range-end"
                value={endDateText}
                placeholder={DATE_FORMAT}
                onChange={(event) => setEndDateText(event.target.value)}
                onBlur={(event) => commitEndDate(event.target.value)}
                className="h-9 flex-1 text-sm"
              />
              <Input
                aria-label="End time"
                value={endTimeText}
                placeholder={TIME_FORMAT}
                onChange={(event) => setEndTimeText(event.target.value)}
                onBlur={(event) => commitEndTime(event.target.value)}
                className="h-9 w-24 text-sm"
              />
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-9 w-full justify-center rounded-lg font-medium text-sm"
            onClick={apply}
            disabled={!draft?.from}
          >
            Apply
          </Button>
        </div>

        <Separator />

        <button
          type="button"
          className="flex w-full items-center justify-center gap-1 py-2 text-muted-foreground text-xs transition-colors hover:text-foreground"
        >
          <span>Local ({resolvedTimezone})</span>
          <ChevronDown className="h-3 w-3" />
        </button>
      </PopoverContent>
    </Popover>
  )
}

export type { DateRange }
export { DateRangePicker }
