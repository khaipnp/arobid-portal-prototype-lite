# 1. User Story Statement

**As a** Visitor, **I want to** browse, search, and filter the list of Expos by status and industry **so that** I can quickly discover relevant exhibitions that match my interests and availability.

---

# 2. Description & Business Value

The Explore Expos page serves as the primary discovery surface for Visitors looking to find and attend virtual exhibitions on TradeXpo (Arobid). It aggregates all published Expos and enables Visitors to narrow down results through keyword search, status filters (Upcoming / Live / Archive), and industry category filters. This feature directly drives visitor engagement and attendance by reducing time-to-discovery for relevant events.

> **Platform context:** TradeXpo is an **online-only** exhibition platform. All Expos are virtual — no physical or hybrid format.
> 

---

# 3. Scope & Technical Constraints
### 3.1. Pre-conditions
- Visitor is on the platform (authentication not required — public access)
- At least one published Expo exists in the system
- Expo records include: name, organizer, cover image, start/end date, status, industry category
### 3.2. Inputs
- **Search keyword:** free-text string matched against Expo name and organizer name
- **Status filter:** single-select — `All` (default) | `Upcoming` | `Live` | `Archive`
- **Industry filter:** multi-select — list of predefined industry categories `[TBD: final category list]`
- **Sort order:** by newest (created date descending) — fixed default, no user toggle
- **Page size:** 20 items per load (infinite scroll)
### 3.3. Process Logic
- On page load, system fetches and displays all published Expos sorted by **newest first** (created date descending), page size = 20
- **Search:** system filters Expo list in real-time (debounced ~300ms) matching keyword against Expo name and organizer name; case-insensitive
- **Status filter:** system computes status dynamically based on current date vs. Expo start/end date:
    - `Upcoming` — start date > today
    - `Live` — start date ≤ today ≤ end date
    - `Archive` — end date < today
- **Industry filter:** multi-select; system applies **OR logic** across selected industries
- Filters are **additive** (AND between: search + status + industry)
- Active filters reflected as dismissible chip tags below filter bar
- URL query parameters updated to reflect active filters (shareable/bookmarkable URLs)
- **Infinite scroll:** system loads next 20 items when user scrolls to bottom; shows loading indicator during fetch
- If combined filters return 0 results → show empty state with "Clear all filters" CTA
### 3.4. Outputs
- Filtered and sorted list of Expo cards, each displaying:
    - Cover image (thumbnail)
    - Expo name
    - Status badge: `Live` (green) | `Upcoming` (blue) | `Archive` (grey)
    - Start – End date
    - Industry tag(s)
    - Format: **Virtual** (fixed — all expos on TradeXpo are online)
- Result count label (e.g. "Showing 20 of 84 expos")
- Active filter chips (dismissible)
- Empty state UI when no results match
- Infinite scroll loading indicator at bottom
# 4. Flow / Process Diagram
*A flowchart that shows the function flow*
# 5. Design (UX/UI Interaction)
*This section provides the step-by-step User Flow for the design team.*
### User Flow 1: Browse & Discover Expos
**Given:** Visitor is on the TradeXpo platform (logged in or not)
- **Step 1:** Visitor navigates to `/expos` — Explore Expos page — via Homepage CTA or top navigation
- **Step 2:** System displays search bar at top, filter bar below (Status tabs + Industry dropdown), result count label, and grid of Expo cards (20 items, newest first)
- **Step 3:** Visitor scrolls down — when reaching bottom, next 20 Expos load automatically with a loading spinner
### User Flow 2: Search by Keyword
- **Step 1:** Visitor types keyword in search bar
- **Step 2:** After ~300ms debounce, system refreshes Expo list in real-time matching Expo name or organizer name
- **Step 3:** Result count updates (e.g. "Showing 5 of 5 expos")
- **Step 4:** Visitor clears search → full list is restored (respecting other active filters)
### User Flow 3: Filter by Status
- **Step 1:** Visitor clicks a status tab: `All` / `Upcoming` / `Live` / `Archive`
- **Step 2:** List immediately updates; active tab is visually highlighted
### User Flow 4: Filter by Industry
- **Step 1:** Visitor clicks "Industry" dropdown; sees checklist of industry categories
- **Step 2:** Visitor selects one or more industries; list updates in real-time
- **Step 3:** Selected industries appear as dismissible chip tags below filter bar
- **Step 4:** Visitor removes a chip → that industry deselected, list refreshes
### User Flow 5: No Results
- **Step 1:** Combined filters return 0 results
- **Step 2:** System shows empty state illustration + message: *"No expos found. Try adjusting your filters."*
- **Step 3:** Visitor clicks "Clear all filters" → all filters reset, full list shown
### User Flow 6: Navigate to Expo Detail
- **Step 1:** Visitor clicks on any Expo card
- **Step 2:** System navigates to the Expo Detail page for that Expo
# 6. Acceptance Criteria (AC)

| **AC #** | **Given** | **When** | **Then** |
| --- | --- | --- | --- |
| AC-01 | Visitor lands on Explore Expos page | Page finishes loading | All published Expos are displayed sorted by newest first, 20 items per page, with result count shown |
| AC-02 | Visitor is on Explore Expos page | Visitor types a keyword in the search bar | The Expo list updates within ~300ms to show only Expos whose name or organizer name contains the keyword (case-insensitive) |
| AC-03 | Visitor has typed a search keyword | Visitor clears the search input | The full Expo list is restored, respecting any active status/industry filters |
| AC-04 | Visitor is on Explore Expos page | Visitor clicks the "Upcoming" status tab | Only Expos with start date > today are displayed |
| AC-05 | Visitor is on Explore Expos page | Visitor clicks the "Live" status tab | Only Expos where today falls within start date – end date are displayed |
| AC-06 | Visitor is on Explore Expos page | Visitor clicks the "Archive" status tab | Only Expos with end date < today are displayed |
| AC-07 | Visitor is on Explore Expos page | Visitor clicks the "All" status tab | Expos of all statuses are displayed |
| AC-08 | Visitor selects one or more industries from the Industry dropdown | Selections are made | List updates to show Expos belonging to at least one selected industry; selected industries appear as dismissible chips |
| AC-09 | Visitor has active industry chips | Visitor clicks "×" on a chip | That industry is deselected and the list refreshes accordingly |
| AC-10 | Visitor has search keyword + status filter + industry filters active simultaneously | All filters are applied | List shows only Expos matching all three criteria (AND logic across filter types; OR logic within industry multi-select) |
| AC-11 | Active filters are set | URL query parameters are updated (e.g. `?q=tech&status=upcoming&industry=IT,Healthcare`) | Visitor can share the URL and another user opening it sees the same filtered view |
| AC-12 | Combined filters return zero Expos | System processes the query | Empty state is shown with message and "Clear all filters" CTA; clicking it resets all filters and shows full list |
| AC-13 | Visitor has scrolled to the bottom of the Expo list | More Expos are available beyond current page | System loads the next 20 Expos and appends them to the list with a loading indicator |
| AC-14 | All Expos have been loaded | Visitor scrolls to bottom | No further loading is triggered; an end-of-list indicator may be shown `[TBD]` |
| AC-15 | Visitor is on Explore Expos page | Visitor clicks an Expo card | System navigates to the Expo Detail page for that Expo |
