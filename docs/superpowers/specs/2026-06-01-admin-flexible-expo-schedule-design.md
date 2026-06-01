# Admin Flexible Expo Schedule Design

## Context

Business requested flexible scheduling for Admin Portal Create Expo and Edit Expo under TradeXpo Expo Management. Admin must be able to create or update an Expo with one of three schedule precision options:

- `exact_date_range`: exact start/end date time with timezone.
- `month_year`: event month and year only.
- `unscheduled`: timing to be announced.

Only exact date range Expos can evaluate to a live or archived timeline phase. Month/year and unscheduled Expos always evaluate as upcoming until Admin saves a valid exact date range.

## Scope

In scope:

- Admin Create Expo schedule section.
- Admin Edit Expo schedule section.
- Admin create/update API validation.
- Expo persistence and mapping.
- Timeline helper contract for schedule precision.
- Basic downstream guard so non-exact schedules do not become Live/Archived from timeline calculation.

Out of scope:

- Partner Portal schedule change requests.
- Public listing schedule-aware sorting and display polish.
- B2B homepage preview sorting.
- Booking CTA eligibility.
- Audit log.

## Data model

Add schedule precision fields to the `expos` table:

- `schedule_precision text not null default 'exact_date_range'`
- `schedule_month int null`
- `schedule_year int null`

Relax legacy schedule columns so non-exact schedules can be stored without fake dates:

- `start_date date null`
- `end_date date null`
- `start_at timestamptz null`
- `end_at timestamptz null`

Existing rows migrate as `exact_date_range`. Existing start/end values remain unchanged.

Domain types add:

- `ExpoSchedulePrecision = "exact_date_range" | "month_year" | "unscheduled"`
- `Expo.schedulePrecision`
- `Expo.scheduleMonth?: number | null`
- `Expo.scheduleYear?: number | null`

`startAt` and `endAt` are meaningful only when schedule precision is `exact_date_range`.

## API and validation

Admin create/update payload accepts:

- `schedulePrecision`
- `startAt`, `endAt`, `timezone` for exact date range
- `scheduleMonth`, `scheduleYear` for month/year

Validation rules:

- `exact_date_range`: require `startAt`, `endAt`, and `timezone`; both timestamps must parse; end must be greater than start. Create keeps the existing "start cannot be in the past" rule.
- `month_year`: require month `1..12` and a four-digit year accepted by the platform. No start/end timestamps required.
- `unscheduled`: no schedule date, month, or year required.

When Admin changes an existing Expo from `Live` or `Archived` to `month_year` or `unscheduled`, raw `status` is reset to `Draft`. This avoids contradiction between raw status and the CR rule that non-exact schedules always evaluate as upcoming.

Partner Portal content editing remains out of scope. Partner update code must preserve existing schedule values instead of forcing exact schedule fields.

## UI design

The Schedule section in `ExpoForm` uses a shadcn `RadioGroup` displayed as three compact card options:

1. Exact date range
2. Month & year
3. To be announced

Create Expo defaults to `unscheduled`.

Edit Expo loads `initialExpo.schedulePrecision`. If older data has no schedule precision but has exact timestamps, the form falls back to `exact_date_range`.

Conditional fields:

- `exact_date_range`: show Start date/time, End date/time, Timezone.
- `month_year`: show Month select and Year input.
- `unscheduled`: hide all schedule inputs and show helper text that schedule will be announced later.

The form performs inline validation before submit so hidden fields do not create invalid `Date` values.

## Data flow

1. Admin selects schedule precision.
2. Form shows only relevant schedule fields.
3. Submit builds a precision-aware payload.
4. API validates only fields required for selected precision.
5. DB stores schedule precision and matching schedule values.
6. Domain mapper returns schedule precision fields to pages/components.
7. Timeline helper returns:
   - exact: `Upcoming`, `Live`, or `Archived` from timestamps.
   - month/year: `Upcoming`.
   - unscheduled: `Upcoming`.

## Error handling

Client validation displays schedule-specific messages below the relevant field or schedule section:

- Missing start/end for exact range.
- Invalid or reversed exact range.
- Missing month or year.
- Invalid month or year.

Server validation returns the same business errors as API JSON. Form keeps the existing top-level error display for API/network failures.

## Testing and verification

Per project preference, no new test files are required unless requested. Verification should use:

- `bun typecheck`
- `bun check`
- Manual form reasoning against the acceptance criteria

No seed scripts or DB data mutation scripts should be run automatically because dev/prod share the database.
