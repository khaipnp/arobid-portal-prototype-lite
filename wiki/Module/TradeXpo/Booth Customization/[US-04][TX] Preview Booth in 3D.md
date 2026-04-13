# 1. User Story Statement

**As an** Exhibitor,
**I want** to preview my booth in 3D while customizing it,
**so that** I can see how my booth will look to visitors before publishing.

# 2. Description & Business Value

The 3D preview gives exhibitors a real-time visual of their booth as they make customization changes — without needing to publish first. This reduces trial-and-error and helps exhibitors make confident design decisions before going live.

# 3. Scope & Technical Constraints

### 3.1. Pre-condition

- Exhibitor is in Booth Management
- Booth has a template selected

### 3.2. Input

- Current customization state (including unsaved changes)

### 3.3. Process / Logic

- 3D preview renders using the current in-memory customization state — including changes not yet saved
- Preview is read-only; no edits can be made from within the 3D viewer
- Preview reflects real-time changes: as the exhibitor modifies fields (e.g., changes a color), the 3D view updates immediately
- Closing the preview returns exhibitor to the customization panel without any side effects

### 3.4. Output

- 3D visual representation of the booth with current customizations applied

# 4. Diagram

```mermaid
flowchart TD
    A[Booth Management] --> B{Template selected?}
    B -- No --> C["Preview 3D" button disabled]
    B -- Yes --> D["Preview 3D" button enabled]
    D --> E[Click "Preview 3D"]
    E --> F[3D viewer opens\nRenders current customization state]
    F --> G[Exhibitor changes a field]
    G --> F
    F --> H[Close preview]
    H --> A
```

# 5. Design (UX/UI Interaction)

### User Flow: Preview Booth in 3D

**Given:** Exhibitor is in Booth Management with a template selected; may or may not have unsaved changes.

- **Step 1:** Exhibitor clicks "Preview 3D".
- **Step 2:** 3D viewer opens (as a modal or side panel) rendering the booth with current customization values.
- **Step 3:** Exhibitor rotates or navigates the 3D view to inspect the booth layout.
- **Step 4:** Exhibitor returns to the customization panel, changes a color.
- **Step 5:** 3D preview updates in real-time to reflect the new color.
- **Step 6:** Exhibitor closes the 3D viewer.
- **Step 7:** Returns to customization panel; no changes were made to the customization state.

# 6. Acceptance Criteria (AC)

| #      | Given                                          | When                          | Then                                                             |
| :----- | :--------------------------------------------- | :---------------------------- | :--------------------------------------------------------------- |
| **01** | No template selected                           | Exhibitor views Booth Management | "Preview 3D" button is disabled                               |
| **02** | Template selected                              | Exhibitor views Booth Management | "Preview 3D" button is enabled                                |
| **03** | Exhibitor clicks "Preview 3D"                  | Button clicked                | 3D viewer opens rendering the booth with current customization  |
| **04** | Exhibitor has unsaved customization changes    | 3D viewer opens               | Unsaved changes are reflected in the 3D preview                 |
| **05** | Exhibitor changes a field while preview is open | Field value changed           | 3D preview updates in real-time without requiring a page reload |
| **06** | Exhibitor closes the 3D viewer                 | Viewer closed                 | Returns to customization panel; no changes to customization state |

# 7. Open Items
