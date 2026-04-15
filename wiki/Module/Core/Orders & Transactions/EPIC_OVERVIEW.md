# Epic Overview: Orders & Transactions

## 1. Business Context

The Orders & Transactions epic provides the **core payment infrastructure layer** for the Arobid platform. It manages the full order lifecycle — from creation to completion — and gives Admin full visibility to monitor, reconcile, and manage all transactions across the platform.

This epic is the **foundational layer** that other product modules plug into:
- **TradeXpo** — Booth registration payments (current scope)
- **B2B Marketplace** — Future scope

## 2. Scope

| In Scope | Out of Scope |
|----------|-------------|
| Payment method configuration (VNPay / Bank Transfer) | Automated refunds via gateway |
| Bank account masterdata management | Multi-currency support |
| Manual bank transfer via VietQR | Instalment / partial payments |
| Admin order management & reconciliation | Subscription billing (separate epic: Plan & Subscriptions) |
| Customer order history | Marketplace orders |
| Order expiry (72h for Bank Transfer) | |

## 3. Payment Methods & Config Resolution

The system uses a **2-tier configuration** model:

| Tier | Config | Applies to |
|------|--------|-----------|
| **Platform Default** ([US-01][CORE]) | VNPay on/off + Bank Transfer on/off | B2B Marketplace purchases + all Expos with `isInherited = true` |
| **Per-Expo Override** ([US-07][CORE]) | Same fields + specific bank account | TradeXpo booth payments for Expos that have been individually configured |

**Config resolution at checkout:**

```
TradeXpo booth payment:
  1. Read ExpoPaymentConfig for this Expo
  2. isInherited = true? → use Platform Default
  3. isInherited = false? → use Expo-specific config

B2B Marketplace purchase:
  → Always reads Platform Default directly
```

**Payment method selection at checkout:**

| Enabled methods | Exhibitor experience |
|----------------|---------------------|
| 1 method only | No selector — proceed directly to that method |
| ≥2 methods | Payment method selector shown before "Proceed to Payment" |

**Supported methods:**

| Method | Flow | Booth Lock Timing |
|--------|------|-------------------|
| **VNPay** | Redirect to VNPay gateway → callback | At "Proceed to Payment" click (VNPay selected) — timeout managed by gateway |
| **Bank Transfer** | Display VietQR → customer confirms → admin reconciles | At "I've Transferred" confirmation by customer |

## 4. Data Model

### Order

| Field | Type | Description |
|-------|------|-------------|
| `orderId` | String | Display ID — e.g. `ORD-2026-00001` |
| `customerId` | FK | User placing the order |
| `orderType` | Enum | `booth_registration` \| `b2b_subscription` |
| `referenceId` | FK | e.g. `boothRegistrationId` or `subscriptionId` |
| `amount` | Decimal | Order total in VND |
| `paymentMethod` | Enum | `vnpay` \| `bank_transfer` |
| `status` | Enum | See state machine below |
| `expiresAt` | DateTime | 72h from creation — Bank Transfer only |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

### Transaction

| Field | Type | Description |
|-------|------|-------------|
| `transactionId` | String | Internal reference |
| `orderId` | FK | Parent order |
| `type` | Enum | `payment` \| `refund` |
| `paymentMethod` | Enum | `vnpay` \| `bank_transfer` |
| `amount` | Decimal | |
| `gatewayRef` | String | VNPay transaction ID (VNPay only) |
| `confirmedBy` | FK | Admin user ID (Bank Transfer only) |
| `rejectionReason` | String | Admin reason if rejected |
| `processedAt` | DateTime | |

### BankAccount (Masterdata)

| Field | Type | Description |
|-------|------|-------------|
| `bankAccountId` | String | |
| `bankName` | String | e.g. `Vietcombank` |
| `bankBIN` | String | For VietQR generation |
| `accountNumber` | String | |
| `accountHolderName` | String | |
| `branch` | String | Optional |
| `isPrimary` | Boolean | Only 1 primary at a time |
| `isActive` | Boolean | |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

### ExpoPaymentConfig

| Field | Type | Description |
|-------|------|-------------|
| `expoId` | FK (unique) | One config per Expo |
| `isInherited` | Boolean | `true` = use Platform Default dynamically; `false` = Expo-specific override |
| `vnpayEnabled` | Boolean | |
| `bankTransferEnabled` | Boolean | |
| `bankAccountId` | FK (nullable) | Specific account for this Expo; `null` → fallback to global primary account |

> New Expos are created with `isInherited = true` by default — no Admin action required to get a working payment config.

## 5. Order Status State Machine

### VNPay

```
Pending Payment ──[VNPay success]──► Paid
                ──[VNPay failed]───► Failed
                ──[VNPay cancel]───► Cancelled
                ──[Gateway timeout]► Expired
```

### Bank Transfer

```
Pending Payment ──[Customer confirms QR, 72h window]──► Awaiting Confirmation
                │                                        ├──[Admin confirm]──► Paid
                │                                        └──[Admin reject]───► Rejected ──[Customer retry]──► Pending Payment (retry)
                │                                                                                             └──[72h no action]──► Expired
                └──[72h no action]────────────────────────────────────────────────────────────────────────────────────────────────► Expired
```

> **Note on 72h expiry:** The 72h clock applies to ALL `Pending Payment` states — both initial and post-rejection retry. On rejection, the clock resets from the rejection timestamp, giving the customer a fresh 72h window to retry.

**Booth status mapping:**

| Order Status | Booth Status | Triggered by |
|-------------|-------------|-------------|
| Pending Payment | Available | — (booth not yet locked) |
| Awaiting Confirmation | **Occupied** | Customer "I've Transferred" confirmation |
| Paid | Occupied | Admin confirm |
| Rejected | **Available** | Admin reject (revert) |
| Expired | Available | System (72h timeout) |
| Failed / Cancelled | Available | VNPay callback |

> **Design rationale — optimistic lock on Bank Transfer:** Booth is set to `Occupied` immediately when customer confirms, preventing another session from taking the slot while waiting for Admin reconciliation. If Admin rejects, booth reverts to `Available` manually.

## 6. Story Map

| # | Story | Actor | Scope |
|---|-------|-------|-------|
| [US-01] | Admin: Configure Platform Default Payment Methods | Admin | Platform-wide default |
| [US-02] | Admin: Manage Bank Accounts (Masterdata) | Admin | Bank Transfer |
| [US-03] | Admin: Order Management Dashboard | Admin | All orders |
| [US-04] | Admin: Confirm / Reject Bank Transfer | Admin | Bank Transfer |
| [US-05] | Customer: Pay via QR Bank Transfer | Customer | Bank Transfer |
| [US-06] | Customer: Order History & Detail | Customer | All orders |
| [US-07] | Admin: Configure Payment Methods per Expo | Admin | Per-Expo override |

## 7. Dependencies

| Dependency | Direction | Note |
|-----------|-----------|------|
| [US-01][TX] Select Booth Type and Position | Upstream | Payment method selector rendered here (if ≥2 methods enabled for Expo). **VNPay selected:** Order created + booth → Pending at "Proceed to Payment". **Bank Transfer selected:** redirect to Core US-05 (Order created there) |
| [US-02][TX] Booth Payment (VNPay) | Upstream | VNPay callback updates Order status to Paid / Failed / Cancelled / Expired |
| Core US-05 (QR Payment) | Downstream | Handles Bank Transfer checkout; creates Order on page load; reads ExpoPaymentConfig for bank account resolution |
| Plan & Subscriptions epic | Downstream | B2B subscription payments use `orderType = b2b_subscription`; payment layer handled by this epic |
| Partner Portal | Downstream | Triggered after Order: Paid (same trigger for both VNPay and Bank Transfer success paths) |
