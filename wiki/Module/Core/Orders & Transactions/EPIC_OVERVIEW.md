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

## 3. Payment Methods

The system supports **one active payment method at a time**, configured by Admin:

| Method | Flow | Booth Lock Timing |
|--------|------|-------------------|
| **VNPay** | Redirect to VNPay gateway → callback | At "Proceed to Payment" click — timeout managed by gateway |
| **Bank Transfer** | Display VietQR → customer confirms → admin reconciles | At "I've Transferred" confirmation by customer |

## 4. Data Model

### Order

| Field | Type | Description |
|-------|------|-------------|
| `orderId` | String | Display ID — e.g. `ORD-2026-00001` |
| `customerId` | FK | User placing the order |
| `orderType` | Enum | `booth_registration` (current scope) |
| `referenceId` | FK | e.g. `boothRegistrationId` |
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

| # | Story | Actor | Payment Method |
|---|-------|-------|---------------|
| [US-01] | Admin: Configure Payment Method | Admin | System config |
| [US-02] | Admin: Manage Bank Accounts (Masterdata) | Admin | Bank Transfer |
| [US-03] | Admin: Order Management Dashboard | Admin | Both |
| [US-04] | Admin: Confirm / Reject Bank Transfer | Admin | Bank Transfer |
| [US-05] | Customer: Pay via QR Bank Transfer | Customer | Bank Transfer |
| [US-06] | Customer: Order History & Detail | Customer | Both |

## 7. Dependencies

| Dependency | Direction | Note |
|-----------|-----------|------|
| [US-01][TX] Select Booth Type and Position | Upstream | **VNPay:** Order record is created here at "Proceed to Payment" click (booth → Pending, Order → Pending Payment). **Bank Transfer:** Order is created in Core US-05 on page load. |
| [US-02][TX] Booth Payment (VNPay) | Upstream | VNPay callback updates Order status to Paid / Failed / Cancelled / Expired |
| Core US-05 (QR Payment) | New | Replaces VNPay redirect when payment method = Bank Transfer; creates Order record on page load |
| Partner Portal | Downstream | Triggered after Order: Paid (same trigger for both VNPay and Bank Transfer success paths) |
