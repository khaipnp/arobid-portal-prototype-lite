h1. USER STORY: Admin Flexible Expo Schedule Setup

h2. 1. User Story Statement

This section states the business actor, action, and value of the story in the required format.
As an Admin,
I want to create or edit an Expo schedule using exact dates, month and year, or a to-be-announced option,
So that Arobid can prepare Expo records even when the final event date has not been confirmed.

h2. 2. Description & Business Value

This section explains what the story does and why it matters to the business.
* This story covers the Schedule section in Admin Portal Create Expo and Edit Expo under TradeXpo Expo Management.
* Admin no longer needs to provide `Start date/Time` and `End date/Time` before creating or updating an Expo.
* Admin also does not need to provide month and year when the event timing is not confirmed.
* The Schedule section uses a selector so Admin can choose one of three schedule precision options: `Exact date range`, `Month & year`, or `To be announced`.
* Expo timeline status continues to use `Upcoming`, `Live`, and `Archive`, but only Expos with an exact date range can become `Live` or `Archive`.
* This story does not cover Partner Portal schedule change requests, public listing sorting, B2B Homepage Expo Preview, or booking CTA eligibility. Those are handled by separate stories.

h2. 3. Scope & Technical Constraints

This section defines the scope boundary, entry conditions, inputs, business flow, and outputs.

h3. 3.1. Pre-condition

* Admin is logged into Admin Portal with permission to create or edit Expo records.
* Create Expo and Edit Expo forms can load the Schedule section.
* Existing required non-schedule fields remain governed by their current rules.
* Existing Admin direct update behavior remains in place. Admin schedule changes in this story are applied directly when validation passes.
* Current server time is available for timeline status calculation.

h3. 3.2. Input

h4. 3.2.1 Schedule Selector Fields

|| Field || Field Type || Required || Validation Rule || Source / Mapping || Example || Notes ||
| Schedule precision | Enum | Yes | Allowed values: `exact_date_range`, `month_year`, `unscheduled`. Default for new Expo is `unscheduled` unless Product defines a different Admin default later. | Admin selection | `exact_date_range` | Drives which schedule fields are visible. |
| Start date/Time | Text | Conditionally required | Required only when Schedule precision = `exact_date_range`. Must be submitted together with End date/Time. Date display follows locale date rules; time follows the master `Time` 24-hour rule. | Admin input through date/time picker | `2026-07-08 09:00 GMT+7` | Hidden when Schedule precision is `month_year` or `unscheduled`. |
| End date/Time | Text | Conditionally required | Required only when Schedule precision = `exact_date_range`. Must be greater than Start date/Time. Date display follows locale date rules; time follows the master `Time` 24-hour rule. | Admin input through date/time picker | `2026-07-18 18:00 GMT+7` | Hidden when Schedule precision is `month_year` or `unscheduled`. |
| Month | Enum | Conditionally required | Required only when Schedule precision = `month_year`. Allowed values are calendar months `January` through `December`. | Admin selection | `July` | Hidden when Schedule precision is `exact_date_range` or `unscheduled`. |
| Year | Integer | Conditionally required | Required only when Schedule precision = `month_year`. Must be a valid four-digit event year accepted by the platform date rules. | Admin input or year picker | `2026` | Hidden when Schedule precision is `exact_date_range` or `unscheduled`. |
| Timezone | Enum | Yes when exact date range is used | Required when Schedule precision = `exact_date_range`. Must be selected from the existing timezone list. | Existing timezone master / Admin selection | `GMT+7` | Existing timezone behavior is reused. For `month_year` and `unscheduled`, timezone may remain stored as existing default but must not make dates required. |

h4. 3.2.2 Schedule Precision Status Rule

|| Attribute || Description || Validation Rule || Result / Display Rule || Example ||
| `exact_date_range` | Expo has both Start date/Time and End date/Time. | End date/Time must be greater than Start date/Time. | Timeline status is calculated from current server time: before start = `Upcoming`, within range = `Live`, after end = `Archive`. | Expo B `08-18/07/2026` can become `Live` during that range. |
| `month_year` | Expo has Month and Year only, without exact start/end date. | Month and Year must both be present when this precision is selected. | Timeline status is always `Upcoming` until Admin changes to valid exact date range. | Expo C `July 2026` remains `Upcoming`. |
| `unscheduled` | Expo timing is not confirmed. | No schedule date, month, or year input is required. | Timeline status is always `Upcoming` until Admin changes to valid exact date range. | Expo displays `Schedule to be announced`. |

h4. 3.2.3 Out-of-Scope Rule

|| Attribute || Description || Source / Mapping || Example ||
| Partner Portal schedule edit | Expo Owner, Partner Owner, and Partner Admin schedule change request flow is not part of this Admin story. | Partner Portal Schedule Change Request story | Expo Owner submits a new date from Partner Portal. |
| Public listing and preview sorting | Schedule-aware card display and sort are not defined here. | Public Display and Sorting story | Expo B appears before Expo A in July 2026 listing. |
| Booking CTA eligibility | CTA hide/disable rule for non-exact schedules is not defined here. | Booking / Registration CTA Guard story | `Book Now` stays disabled for `month_year` Expo. |
| Audit log | Audit log for schedule changes is deferred. | Future enhancement | Admin history report for every schedule edit. |

h3. 3.3. Process / Logic

The system opens Admin Portal Create Expo or Edit Expo.
The system loads the Schedule section with the Schedule precision selector.
When Admin selects `Exact date range`, the system displays Start date/Time, End date/Time, and Timezone.
When Admin selects `Month & year`, the system displays Month and Year only.
When Admin selects `To be announced`, the system hides all schedule input fields.
The system validates the selected schedule precision and the visible fields.
If `Exact date range` is selected and either Start date/Time or End date/Time is missing, the system blocks submit and shows inline validation under the missing field.
If End date/Time is not greater than Start date/Time, the system blocks submit and shows inline validation for the date range.
If `Month & year` is selected and either Month or Year is missing, the system blocks submit and shows inline validation under the missing field.
If `To be announced` is selected, the system allows submit when all other required non-schedule fields are valid.
When validation passes, the system saves the Expo schedule precision and schedule values.
The system recalculates timeline status using the rules in Section 3.2.2.
This story stops at saving the Admin-created or Admin-edited Expo schedule and exposing the resulting schedule precision/status contract for downstream surfaces.

h3. 3.4. Output

* Admin can create or edit an Expo without exact date range.
* Admin can leave schedule as `To be announced` without selecting month and year.
* Admin can save a `month_year` schedule when both Month and Year are provided.
* Admin can save an `exact_date_range` schedule when both Start date/Time and End date/Time are valid.
* Expo status is `Upcoming` for `month_year` and `unscheduled` schedules.
* Expo status can become `Live` or `Archive` only for valid `exact_date_range` schedules.
* Existing non-schedule validations remain unchanged.

h2. 4. Diagram

This section shows the workflow-level actor/action swimlane for the story.

{code:plantuml}
@startuml
|Admin|
start
:Open Create Expo or Edit Expo;

|System|
:Load Schedule section;
:Show Schedule precision selector;

|Admin|
:Select schedule precision;

|System|
if (Exact date range?) then (Yes)
  :Show Start date/Time,\nEnd date/Time, Timezone;
elseif (Month & year?) then (Yes)
  :Show Month and Year;
else (To be announced)
  :Hide schedule input fields;
endif

|Admin|
:Submit Expo form;

|System|
if (Schedule validation passed?) then (Yes)
  :Save schedule values;
  :Calculate schedule precision\nand timeline status;
else (No)
  :Show inline validation;
endif

stop
@enduml
{code}

h2. 5. Design (UX/UI Interaction)

This section defines the expected UI interaction flow only.
Given: Admin is on Create Expo or Edit Expo in Admin Portal.
- Step 1: System displays the Schedule section with selector options `Exact date range`, `Month & year`, and `To be announced`.
- Step 2: Admin selects `Exact date range`; system shows Start date/Time, End date/Time, and Timezone.
- Step 3: Admin selects `Month & year`; system shows Month and Year only.
- Step 4: Admin selects `To be announced`; system hides all schedule input fields.
- Step 5: Admin submits the form.
- Step 6: System shows inline validation for incomplete or invalid schedule input when required by the selected precision.
- Step 7: If validation passes, system saves the Expo and shows the existing success response for Create Expo or Edit Expo.
- Step 8: This flow stops after the Admin schedule update is saved.

h2. 6. Acceptance Criteria

This section defines the testable business outcomes in Given-When-Then format.

|| AC || Given || When || Then ||
| AC-01 | Given Admin opens Create Expo | When the Schedule section renders | Then the system shows a Schedule precision selector with `Exact date range`, `Month & year`, and `To be announced` |
| AC-02 | Given Admin selects `Exact date range` | When the Schedule section refreshes | Then Start date/Time, End date/Time, and Timezone are visible, while Month and Year are hidden |
| AC-03 | Given Admin selects `Month & year` | When the Schedule section refreshes | Then Month and Year are visible, while Start date/Time and End date/Time are hidden |
| AC-04 | Given Admin selects `To be announced` | When the Schedule section refreshes | Then no schedule input fields are visible |
| AC-05 | Given Admin selects `To be announced` and all non-schedule required fields are valid | When Admin submits Create Expo | Then the system creates the Expo without requiring Start date/Time, End date/Time, Month, or Year |
| AC-06 | Given Admin selects `Month & year` | When Admin submits with Month missing or Year missing | Then the system blocks submit and shows inline validation for the missing field |
| AC-07 | Given Admin selects `Month & year` and enters both Month and Year | When Admin submits with all other required fields valid | Then the system saves the Expo schedule as `month_year` |
| AC-08 | Given Admin selects `Exact date range` | When Admin submits with only Start date/Time or only End date/Time | Then the system blocks submit and shows inline validation requiring a complete date range |
| AC-09 | Given Admin selects `Exact date range` | When Admin submits End date/Time less than or equal to Start date/Time | Then the system blocks submit and shows inline validation for the date range |
| AC-10 | Given Admin selects `Exact date range` and enters a valid range | When Admin submits with all other required fields valid | Then the system saves the Expo schedule as `exact_date_range` |
| AC-11 | Given an Expo has schedule precision `exact_date_range` | When current server time is before Start date/Time | Then the timeline status is `Upcoming` |
| AC-12 | Given an Expo has schedule precision `exact_date_range` | When current server time is between Start date/Time and End date/Time inclusive | Then the timeline status is `Live` |
| AC-13 | Given an Expo has schedule precision `exact_date_range` | When current server time is after End date/Time | Then the timeline status is `Archive` |
| AC-14 | Given an Expo has schedule precision `month_year` | When timeline status is evaluated at any time | Then the timeline status remains `Upcoming` until a valid exact date range is saved |
| AC-15 | Given an Expo has schedule precision `unscheduled` | When timeline status is evaluated at any time | Then the timeline status remains `Upcoming` until a valid exact date range is saved |
