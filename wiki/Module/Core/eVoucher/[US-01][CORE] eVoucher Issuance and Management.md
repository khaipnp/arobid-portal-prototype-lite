# 1. User Story Statement

**As an** Admin (Arobid),
**I want** to create, view, and manage eVoucher batches,
**so that** I can control the issuance of discount vouchers tied to specific services or expos and distribute them through authorized Partners.

# 2. Description & Business Value

Arobid is the sole authority for issuing eVouchers on the platform. Admin can choose between two code types:

- **Single-use batch**: system generates N unique individual codes, each redeemable once. Suited for targeted distribution where each business gets a distinct code.
- **Multi-use code**: Admin defines one memorable code (e.g., `SUMMER25`) usable up to N times total by any number of businesses. Suited for broadcast campaigns.

This screen gives Admin full visibility into all voucher batches and their redemption progress.

# 3. Scope & Technical Constraints

### 3.1. Pre-condition

- User is authenticated as Admin.
- At least one active Service or Expo exists on the platform (required for scoping a new voucher batch).

### 3.2. Input

#### 3.2.1 Voucher List Screen

The screen displays all eVoucher batches in a paginated table with the following columns:

| Column | Description |
|--------|-------------|
| Code | Code Prefix (single-use batch, e.g., `EXPO2025-*`) or the shared code (multi-use, e.g., `SUMMER25`) |
| Type | `Single-use batch` / `Multi-use code` |
| Name | Display name |
| Module | B2B Marketplace / TradeXpo + target name |
| Valid Period | Start date – End date |
| Quantity | Issued / Remaining (Remaining = Issued − Locked − Redeemed) |
| Discount | e.g., `10%` or `50,000 VND` |
| Status | `Active` / `Expired` / `Depleted` / `Revoked` |
| Actions | Edit, Export Codes, Revoke |

Filters available: Status, Code Type (Single-use / Multi-use), Module (B2B Marketplace / TradeXpo), Valid Period range.

#### 3.2.2 Create / Edit Voucher Form

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Name | Text | Yes | Display name shown to users |
| Module | Select: `B2B Marketplace` / `TradeXpo` | Yes | Determines which platform the voucher applies to |
| Target | Reference lookup | Yes | Specific service or expo the voucher applies to |
| Valid From | Date | Yes | Inclusive start of validity window |
| Valid Until | Date | Yes | Inclusive end of validity window; must be after Valid From |
| **Code Type** | Select: `Single-use batch` / `Multi-use code` | Yes | Determines how codes are generated and validated. Immutable after creation. |
| Code Prefix | Text | Conditional | **Single-use batch only.** Unique prefix used to seed code generation (e.g., `EXPO2025`). Admin may enter manually or leave blank for auto-generation. System appends a unique suffix per code. Immutable after creation. |
| Code | Text | Conditional | **Multi-use code only.** A single memorable code entered by Admin (e.g., `SUMMER25`). Must be unique across all vouchers. Immutable after creation. |
| Issued Quantity | Number (≥ 1) | Yes | **Single-use batch**: total individual codes to generate. **Multi-use code**: maximum number of times the code may be redeemed in total. |
| Discount Type | Select: `Percentage` / `Fixed Amount` | Yes | |
| Discount Value | Number (> 0) | Yes | Percentage: 1–100; Fixed: positive integer (VND) |
| Description / Conditions | Text Area | No | Usage conditions shown to the business at checkout |

**Edit rules:**
- `Code Type`, `Code Prefix`, `Code`, and `Target` are immutable after creation.
- `Discount Type` and `Discount Value` cannot be changed once any redemption exists.
- `Valid Until` can only be extended (moved forward), never shortened.
  - If the voucher is `Expired` and Admin extends `Valid Until` to a date after today, the status transitions back to `Active` automatically on save.
- `Issued Quantity` can only be increased, never decreased below the number already redeemed.
  - For **single-use batch**: increasing quantity causes the system to generate additional codes (the delta) and append them to the batch.
  - For **multi-use code**: increasing quantity raises the redemption ceiling; no new codes are generated.

**Status priority** (when multiple conditions apply simultaneously):
`Revoked > Depleted > Expired > Active`

### 3.3. Process / Logic

**Create:**
1. System validates all required fields.
2. System checks uniqueness:
   - **Single-use batch**: `Code Prefix` must be unique across all vouchers.
   - **Multi-use code**: `Code` must be unique across all vouchers.
3. System checks `Valid Until` > `Valid From`.
4. System checks `Discount Value` is within allowed range for the selected type.
5. If validation passes, system creates the voucher batch with status `Active` and:
   - **Single-use batch**: generates `Issued Quantity` unique individual codes (format: `{Code Prefix}-{unique suffix}`). All codes start as `Available`.
   - **Multi-use code**: stores the single code with a redemption counter. Remaining = Issued Quantity.

**Edit:**
1. System applies edit rules (see 3.2.2).
2. Admin may update: Name, Valid Until (extend only), Issued Quantity (increase only), Description.
3. If `Valid Until` is extended past today on an `Expired` voucher, status reverts to `Active`.
4. If Issued Quantity is increased:
   - **Single-use batch**: system generates additional codes for the delta.
   - **Multi-use code**: redemption ceiling is raised; no new codes generated.
5. System saves changes; updated values take effect immediately.

**Revoke:**
1. Admin may revoke any non-Revoked voucher.
2. Revoking sets status to `Revoked`; all `Available` codes become immediately invalid.
3. `Locked` codes (mid-transaction) remain locked until the transaction resolves, then enter `Revoked` state (not reusable).

**Export Codes:**
1. Admin clicks **"Export Codes"** on a voucher row.
2. System generates a CSV file. The content differs by code type:
   - **Single-use batch**: one row per individual code. Columns: `Code`, `Voucher Name`, `Module`, `Valid From`, `Valid Until`, `Discount`, `Description`, `Status`.
   - **Multi-use code**: one row containing the shared code and summary stats. Columns: `Code`, `Voucher Name`, `Module`, `Valid From`, `Valid Until`, `Discount`, `Issued Quantity`, `Remaining`, `Description`.
3. File downloads immediately. Export is available for vouchers in any status.
4. File name format: `evoucher-{code or prefix}-{date}.csv`.

**Automatic status transitions:**
- `Active` → `Expired`: when current date passes `Valid Until`.
- `Active` → `Depleted`: when remaining quantity (Issued − Locked − Redeemed) reaches 0.
- `Expired` → `Active`: when Admin extends `Valid Until` past today on save.
- Status priority when multiple conditions apply: `Revoked > Depleted > Expired > Active`.

### 3.4. Output

- Voucher list reflects the latest state (remaining quantity, status).
- On successful creation: new voucher batch appears at the top of the list with a success confirmation.
- On revoke: voucher row updates status to `Revoked` immediately.
- On export: a CSV file is downloaded to Admin's device. File name format: `evoucher-{code-prefix}-{date}.csv`.

# 4. Diagram

```mermaid
flowchart TD
    A([Admin opens eVoucher Management]) --> B[View voucher list with filters]
    B --> C{Action}
    C --> D[Create New Voucher Batch]
    C --> E[Edit Voucher Batch]
    C --> F[Revoke Voucher Batch]

    D --> D1[Fill create form]
    D1 --> D2{Validation pass?}
    D2 -- No --> D3[Show field errors]
    D3 --> D1
    D2 -- Yes --> D4[Batch created — Active\nSingle-use: generates N unique codes\nMulti-use: stores 1 shared code with counter]
    D4 --> B

    E --> E1[Edit allowed fields only]
    E1 --> E2{Edit rules pass?}
    E2 -- No --> E3[Show constraint error]
    E3 --> E1
    E2 -- Yes --> E4[Changes saved\nExpired → Active if Valid Until extended past today]
    E4 --> B

    F --> F1{Confirm revoke?}
    F1 -- Cancel --> B
    F1 -- Confirm --> F2[Status → Revoked\nAvailable codes invalidated]
    F2 --> B

    C --> G[Export Codes]
    G --> G1[Generate CSV — 1 row per unique code]
    G1 --> G2[Download to Admin device]
    G2 --> B
```

# 5. Design (UX/UI Interaction)

### User Flow 1a: Create a Single-use Batch

**Given:** Admin is on the eVoucher Management screen.

- **Step 1:** Admin clicks **"Create eVoucher"**.
- **Step 2:** System opens a form with all fields from section 3.2.2.
- **Step 3:** Admin selects **Module** and **Target**.
- **Step 4:** Admin selects **Code Type = Single-use batch**. The **Code Prefix** field appears.
- **Step 5:** Admin enters a Code Prefix (e.g., `EXPO2025`) or leaves blank for auto-generation.
- **Step 6:** Admin fills in Issued Quantity, discount, and validity window.
- **Step 7:** Admin clicks **"Save"**.
- **Step 8:** On success, the batch is created, and the system generates N individual codes ready for export.

### User Flow 1b: Create a Multi-use Code

**Given:** Admin is on the eVoucher Management screen.

- **Step 1:** Admin clicks **"Create eVoucher"**.
- **Step 2:** System opens a form with all fields from section 3.2.2.
- **Step 3:** Admin selects **Module** and **Target**.
- **Step 4:** Admin selects **Code Type = Multi-use code**. The **Code** field appears.
- **Step 5:** Admin enters a memorable code (e.g., `SUMMER25`).
- **Step 6:** Admin fills in Issued Quantity (max uses), discount, and validity window.
- **Step 7:** Admin clicks **"Save"**.
- **Step 8:** On success, the voucher is created with the shared code and a redemption counter set to Issued Quantity.

### User Flow 2: Edit an Existing Voucher Batch

**Given:** Admin is viewing an `Active` or `Expired` voucher batch on the list.

- **Step 1:** Admin clicks **"Edit"** on a voucher row.
- **Step 2:** System opens the edit form pre-filled with current values; immutable fields (`Code Prefix`, `Target`, `Discount Type`/`Value` if redemptions exist) are shown as read-only.
- **Step 3:** Admin updates allowed fields (e.g., extends `Valid Until`, increases quantity, updates description).
- **Step 4:** Admin clicks **"Save"**.
- **Step 5:** System validates edit rules and saves. If an `Expired` voucher's `Valid Until` was extended past today, its status reverts to `Active` and a confirmation note is shown.

### User Flow 3: Export Voucher Codes for Partner Distribution

**Given:** Admin is viewing any voucher batch on the list.

- **Step 1:** Admin clicks **"Export Codes"** on a voucher row.
- **Step 2:** System generates a CSV:
  - **Single-use batch**: one row per unique code. Columns: `Code`, `Voucher Name`, `Module`, `Valid From`, `Valid Until`, `Discount`, `Description`, `Status`.
  - **Multi-use code**: one row with the shared code and summary. Columns: `Code`, `Voucher Name`, `Module`, `Valid From`, `Valid Until`, `Discount`, `Issued Quantity`, `Remaining`, `Description`.
- **Step 3:** File downloads automatically to Admin's device.
- **Step 4:** Admin shares the file with the designated Partner for redistribution to businesses.

### User Flow 4: Revoke a Voucher Batch

**Given:** Admin is viewing any non-Revoked voucher batch on the list.

- **Step 1:** Admin clicks **"Revoke"** on a voucher row.
- **Step 2:** System shows a confirmation dialog: *"Revoking this voucher batch will immediately invalidate all unused codes. This cannot be undone."*
- **Step 3:** Admin confirms.
- **Step 4:** Voucher status changes to `Revoked`; the list row updates immediately.

# 6. Acceptance Criteria (AC)

| # | Given | When | Then |
|:--|:------|:-----|:-----|
| **01** | Admin creates a **Single-use batch** with Issued Quantity = N | All fields are valid | Batch is created with status `Active`; system generates N unique codes with format `{Code Prefix}-{suffix}` |
| **02** | Admin creates a **Multi-use code** with Issued Quantity = N | All fields are valid | Voucher is created with status `Active`; the shared code is stored with a redemption counter = N |
| **03** | Admin fills the create form (Single-use) | Code Prefix already exists on the platform | System blocks creation and shows a duplicate prefix error |
| **04** | Admin fills the create form (Multi-use) | Code already exists on the platform | System blocks creation and shows a duplicate code error |
| **05** | Admin fills the create form | `Valid Until` is before or equal to `Valid From` | System shows a date range error and blocks creation |
| **06** | Admin fills the create form with Percentage discount | Discount Value is outside 1–100 | System shows a value range error |
| **07** | A batch has at least one redeemed transaction | Admin attempts to change Discount Type or Discount Value | Fields are read-only; system does not allow the change |
| **08** | Admin edits a batch | Admin attempts to set a new `Valid Until` earlier than the current value | System blocks the change and shows a constraint error |
| **09** | Admin edits a batch | Admin attempts to reduce Issued Quantity below the number already redeemed | System blocks the change |
| **10** | Admin revokes an `Active` batch | Revocation is confirmed | Status changes to `Revoked`; all remaining uses/codes are invalidated immediately |
| **11** | A batch's `Valid Until` date has passed | System evaluates the batch | Status transitions to `Expired` automatically |
| **12** | Remaining quantity reaches 0 after a successful redemption | System evaluates the batch | Status transitions to `Depleted` automatically |
| **13** | A batch is both `Depleted` and `Expired` | System displays the status | Status shown is `Depleted` (Depleted takes priority over Expired) |
| **14** | Admin extends `Valid Until` of an `Expired` batch to a future date | Admin saves the edit | Status transitions from `Expired` back to `Active` |
| **15** | Admin increases Issued Quantity on a **Single-use batch** | Admin saves the edit | System generates additional codes equal to the delta and appends them to the batch |
| **16** | Admin increases Issued Quantity on a **Multi-use code** | Admin saves the edit | Redemption ceiling is raised; no new codes are generated |
| **17** | Admin clicks "Export Codes" on a **Single-use batch** | System generates the export | CSV downloaded with one row per individual code; columns: Code, Voucher Name, Module, Valid From, Valid Until, Discount, Description, Status |
| **18** | Admin clicks "Export Codes" on a **Multi-use code** | System generates the export | CSV downloaded with one row; columns: Code, Voucher Name, Module, Valid From, Valid Until, Discount, Issued Quantity, Remaining, Description |
