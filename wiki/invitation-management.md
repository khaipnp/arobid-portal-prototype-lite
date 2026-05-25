# USER STORY: Partner Portal - Partner Site Management - Invitations - Manage Invitations

## 1. User Story Statement

This section states the business actor, action, and value of the story in the required format.
As a Partner Portal Owner,
I want to search, filter, and manage invitation records for my Partner Site,
So that I can track invitation response status and resend pending invitations when needed.

## 2. Description & Business Value

This section explains what the story does and why it matters to the business.

- This story covers the invitation management list under `Partner Site Management / Invitations`.
- The Partner Portal Owner can view invitation records that were sent from the current Partner Site context.
- The screen includes a common search bar, business filters, and a tracking table.
- The table structure for this story is `Recipient | Status | Action`.
- `Accepted` means the user registered from the Partner Site invitation.
- `Pending` means the invitation has been sent or prepared and is still waiting for recipient response.
- `Accepted` invitation does not automatically mean the enterprise has `Join Status = Joined`.
- Enterprise `Join Status` becomes `Joined` only after the enterprise is linked to the Partner Site membership record.
- The row action for this story is `Resend`, and it applies only to invitations with `Pending` status.
- The business value is clearer follow-up visibility and easier re-engagement for unresponded invitations.

## 3. Scope & Technical Constraints

This section defines the scope boundary, entry conditions, inputs, business flow, and outputs.

### 3.1. Pre-condition

- A Partner Site already exists for the current Partner.
- One or more invitation records may already exist for the current Partner Site.
- The current user has permission to access `Partner Site Management / Invitations`.
- Each invitation record stores recipient, status, and send context.

### 3.2. Input

#### 3.2.1 Search and Filter Input

| Field           | Field Type | Required | Validation Rule                                           | Source / Mapping          | Example      | Notes                                   |
| --------------- | ---------- | -------- | --------------------------------------------------------- | ------------------------- | ------------ | --------------------------------------- |
| Search Keyword  | Text       | No       | Trim spaces, prevent script injection, max 255 characters | User-entered search input | `mekongagri` | Search by recipient                     |
| Status Filter   | Enum       | No       | Allowed values: `All`, `Accepted`, `Pending`              | Invitation status filter  | `Pending`    | Default = `All`                         |
| Pagination Page | Integer    | No       | Must be positive integer                                  | Table pagination state    | `1`          | System-controlled if pagination is used |

#### 3.2.2 Table Column Definition

| Field     | Field Type | Required | Validation Rule                                                                               | Source / Mapping            | Example                 | Notes                    |
| --------- | ---------- | -------- | --------------------------------------------------------------------------------------------- | --------------------------- | ----------------------- | ------------------------ |
| Recipient | Email      | Yes      | Must be a valid email stored in the invitation record                                         | Invitation recipient source | `contact@mekongagri.vn` | Primary row identifier   |
| Status    | Enum       | Yes      | Allowed values: `Accepted`, `Pending`                                                         | Invitation status source    | `Pending`               | Business response status |
| Action    | Enum       | Yes      | Allowed values in this story: `Resend` only when `Status = Pending`; no action for `Accepted` | Row action rule             | `Resend`                | Conditional row action   |

#### 3.2.3 Status Meaning

| Status   | Meaning                                               | Display Rule               | Example                              |
| -------- | ----------------------------------------------------- | -------------------------- | ------------------------------------ |
| Accepted | Recipient registered from the Partner Site invitation | Show accepted status badge | Invited user completed registration  |
| Pending  | Invitation is waiting for recipient response          | Show pending status badge  | Invitation sent but not yet accepted |

#### 3.2.4 Invitation to Enterprise Mapping

| Invitation Status            | Enterprise Join Status Impact          | Rule                                                                                                                | Example                                                  |
| ---------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Accepted                     | No automatic `Joined` status by itself | Accepted invitation means the recipient registered through the Partner Site invitation                              | Recipient completes registration from invite             |
| Accepted + membership linked | `Joined`                               | Enterprise `Join Status` becomes `Joined` only after the enterprise is linked to the Partner Site membership record | Registered recipient is linked to Mekong Agri Export JSC |
| Pending                      | No enterprise join impact              | Invitation is still waiting for recipient response                                                                  | Pending invitation to `sales@saigontextile.vn`           |

#### 3.2.5 Search and Filter Behavior

| Rule            | Description                          | Display Rule                                                 | Example                                          |
| --------------- | ------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------ |
| Search Scope    | Search applies to recipient email    | Show rows that partially or exactly match the keyword        | Search `saigon` returns `sales@saigontextile.vn` |
| Status Filter   | Filter by invitation response status | Show only rows with selected status unless `All` is selected | `Pending` shows pending invitations only         |
| Combined Filter | Search and filters apply together    | Result list must satisfy all active conditions               | Search `contact` + `Pending`                     |
| No Result State | No invitation matches criteria       | Show empty result state and keep active filters              | No row found for current filters                 |

#### 3.2.6 Action Definition

| Action | Description                                     | Validation Rule                      | Result                                                                            | Example                                           |
| ------ | ----------------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------- | ------------------------------------------------- |
| Resend | Send the invitation again to the same recipient | Allowed only when `Status = Pending` | System sends the invitation again and refreshes invitation metadata if applicable | Resend pending invite to `sales@saigontextile.vn` |

#### 3.2.7 Out-of-Scope Rule

| Attribute                  | Description                                                                                    | Source / Mapping                         | Example                     |
| -------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------- | --------------------------- |
| Accepted User Detail Flow  | This story does not define what happens after accepted registration detail is opened elsewhere | Downstream registration/member scope     | No profile open action here |
| Invitation Delete / Revoke | This story only includes `Resend` as row action                                                | Not requested in current scope           | No revoke action            |
| Invitation Creation UI     | This story does not cover link generation or initial sharing                                   | Covered in invitation create/share scope | No create panel detail here |

### 3.3. Process / Logic

1. The system opens the invitation management list for the current Partner Site.
2. The system loads invitation records for the current Partner Site.
3. The system displays a common search bar and business filters above the table.
4. The search bar must search by recipient email.
5. The system must support filtering by invitation `Status`.
6. The table must display columns `Recipient`, `Status`, and `Action`.
7. `Accepted` means the user registered from the Partner Site invitation.
8. `Pending` means the invitation is waiting for recipient response.
9. Enterprise `Join Status` becomes `Joined` only after the enterprise is linked to the Partner Site membership record.
10. When the user applies search or filters, the system refreshes the result list using all active criteria.
11. When no record matches the current criteria, the system shows an empty result state.
12. The system shows `Resend` only for rows with `Pending` status.
13. When the user selects `Resend` for a pending invitation, the system sends the invitation again to the same recipient.
14. The system must not show or perform `Resend` for rows with `Accepted` status.
15. This story stops at invitation listing, filtering, and resend behavior.

### 3.4. Output

- The system displays the invitation tracking list for the current Partner Site.
- The user can search and filter the list.
- The user can see invitation `Status`.
- The user can resend pending invitations.
- The system preserves clear distinction between `Accepted` and `Pending` invitation records.

## 4. Diagram

This section shows the workflow-level actor/action swimlane for the story.

```
Unable to find source-code formatter for language: plantuml. Available languages are: actionscript, ada, applescript, bash, c, c#, c++, cpp, css, erlang, go, groovy, haskell, html, java, javascript, js, json, lua, none, nyan, objc, perl, php, python, r, rainbow, ruby, scala, sh, sql, swift, visualbasic, xml, yaml@startuml
|Partner Portal Owner|
start
:Open Partner Site Management / Invitation;

|System|
:Load invitation records;
:Show search bar and filters;
:Show invitation table;

|Partner Portal Owner|
:Search or filter invitation list;

|System|
:Refresh matching rows;

|Partner Portal Owner|
if (Select Resend on pending row?) then (Yes)
  |System|
  :Resend invitation to recipient;
endif

stop
@enduml
```

## 5. Design (UX/UI Interaction)

This section defines the expected UI interaction flow only.
Given: The Partner Portal Owner is on `Partner Site Management / Invitation`
Step 1: The system shows a common search bar and business filters above the invitation table.
Step 2: The system displays the table with columns `Recipient`, `Status`, and `Action`.
Step 3: The user can search by recipient email.
Step 4: The user can filter by `Status`.
Step 5: The system refreshes the visible rows based on the active search and filter criteria.
Step 6: If no row matches the criteria, the system shows an empty result state.
Step 7: For rows with `Pending` status, the system shows the `Resend` action.
Step 8: For rows with `Accepted` status, the system does not show the `Resend` action.
Step 9: Accepted invitation means the recipient registered through the Partner Site invitation, but Enterprise `Join Status` becomes `Joined` only after the enterprise is linked to the Partner Site membership record.
Step 10: When the user selects `Resend` on a pending row, the system sends the invitation again to the same recipient.
Step 11: The current scope stops at invitation list management and resend behavior.

## 6. Acceptance Criteria

This section defines the testable business outcomes in Given-When-Then format.

| AC    | Given                                                       | When                                                                 | Then                                                                                                                                                                                     |
| ----- | ----------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-01 | Given invitation records exist for the current Partner Site | When the Partner Portal Owner opens the invitation management screen | Then the system shows the table with columns `Recipient`, `Status`, and `Action`                                                                                                         |
| AC-02 | Given the screen is displayed                               | When the user views the top control area                             | Then the system shows a common search bar and a filter for `Status`                                                                                                                      |
| AC-03 | Given the user enters a recipient keyword                   | When the search is applied                                           | Then the system shows only rows whose `Recipient` matches the keyword rule                                                                                                               |
| AC-04 | Given the user selects a `Status` filter                    | When the filter is applied                                           | Then the system shows only rows matching the selected `Status` value                                                                                                                     |
| AC-05 | Given both search and filters are active                    | When the result list is refreshed                                    | Then the system shows only rows satisfying all active conditions                                                                                                                         |
| AC-06 | Given no invitation record matches the current criteria     | When the result list is rendered                                     | Then the system shows an empty result state                                                                                                                                              |
| AC-07 | Given a row has `Status = Accepted`                         | When the table is rendered                                           | Then the system shows that the invited user has registered from the Partner Site invitation                                                                                              |
| AC-08 | Given a row has `Status = Pending`                          | When the table is rendered                                           | Then the system shows that the invitation is still waiting for recipient response                                                                                                        |
| AC-09 | Given a row has `Status = Pending`                          | When the row is rendered                                             | Then the system shows the `Resend` action                                                                                                                                                |
| AC-10 | Given a row has `Status = Accepted`                         | When the row is rendered                                             | Then the system does not show the `Resend` action                                                                                                                                        |
| AC-11 | Given the user selects `Resend` on a pending row            | When the action is triggered                                         | Then the system resends the invitation to the same recipient                                                                                                                             |
| AC-12 | Given an invitation has `Status = Accepted`                 | When enterprise membership is evaluated                              | Then the system treats acceptance as recipient registration only and does not set Enterprise `Join Status = Joined` until the enterprise is linked to the Partner Site membership record |
