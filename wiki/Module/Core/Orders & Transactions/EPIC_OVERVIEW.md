# Epic Overview: Orders & Transactions

## 1. Business Context

The Orders & Transactions epic manages the **order lifecycle layer** for the Arobid platform. It tracks orders from creation to final status, gives Admin visibility to monitor transactions, and allows customers to track their payment history.

Payment infrastructure and VNPay checkout execution are handled by the **Payment epic**. This epic consumes those payment outcomes and manages the resulting order records, invoice-request workflow, and customer/admin visibility.

This epic serves:
- **TradeXpo** — Booth registration orders (current scope)
- **B2B Marketplace** — Future scope

## 2. Scope

| In Scope | Out of Scope |
|----------|-------------|
| Admin order management dashboard | Payment method configuration (-> Payment epic) |
| Customer order history and detail | Bank Transfer / VietQR checkout flows |
| VNPay-based order status state machine | Automated refunds via gateway |
| Invoice request queue, export, and manual processing status | Invoice issuance automation / external accounting integration |
| Order-level transaction visibility and audit trail | Multi-currency support |
| | Instalment / partial payments |
| | Subscription billing (separate epic: Plan & Subscriptions) |
| | Marketplace orders |

## 3. Order Status State Machine

### VNPay

```
Pending Payment ──[VNPay success]──► Paid
                ──[VNPay failed]───► Failed
                ──[VNPay cancel]───► Cancelled
                ──[Gateway timeout]► Expired
```

**Booth status mapping:**

| Order Status | Booth Status | Triggered by |
|-------------|-------------|-------------|
| Pending Payment | Pending | VNPay session created from booth checkout |
| Paid | Occupied | VNPay success callback |
| Failed | Available | VNPay failure callback |
| Cancelled | Available | VNPay cancel callback |
| Expired | Available | Gateway timeout |

> **Current module rule:** Orders & Transactions is VNPay-only. There is no manual payment confirmation, rejection, or post-checkout payment retry action inside this module.

## 4. Data Model

### Order

| Field | Type | Description |
|-------|------|-------------|
| `orderId` | String | Display ID — e.g. `ORD-2026-00001` |
| `customerId` | FK | User placing the order |
| `partnerId` | FK (nullable) | Expo Owner linked to this order; populated for `booth_registration`; `null` for other types |
| `orderType` | Enum | `booth_registration` \| `b2b_subscription` |
| `referenceId` | FK | e.g. `boothRegistrationId` or `subscriptionId` |
| `originalAmount` | Decimal | Pre-discount total in VND |
| `discountAmount` | Decimal | Reduction applied from eVoucher; `0` if no voucher used |
| `amount` | Decimal | Final amount charged (`originalAmount - discountAmount`) |
| `voucherId` | FK (nullable) | eVoucher applied; `null` if none |
| `paymentMethod` | Enum | `vnpay` |
| `status` | Enum | `pending_payment` \| `paid` \| `failed` \| `cancelled` \| `expired` |
| `invoiceRequested` | Boolean | Whether customer requested invoice information |
| `invoiceType` | Enum (nullable) | `individual` \| `business`; null if invoice not requested |
| `billingInfoSnapshot` | JSON / object (nullable) | Billing information captured at order creation time |
| `invoiceStatus` | Enum | `not_requested` \| `requested_pending_payment` \| `requested_paid` \| `exported` \| `issued` \| `sent` |
| `expiresAt` | DateTime (nullable) | VNPay session expiry timestamp while status is `pending_payment` |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

### Invoice Request Lifecycle

```
not_requested

requested_pending_payment ──[Order Paid]──────────────────────────────► requested_paid
requested_pending_payment ──[Order Failed / Cancelled / Expired]─────► no invoice issued

requested_paid ──[Admin export]──► exported
exported ───────[Admin mark issued]──► issued
issued ─────────[Admin mark sent]────► sent
```

| Invoice Status | Meaning |
|----------------|---------|
| `not_requested` | Customer did not request invoice |
| `requested_pending_payment` | Invoice info captured, but Order is not paid yet |
| `requested_paid` | Order is paid and ready for Admin / Finance export |
| `exported` | Invoice data has been exported for manual processing |
| `issued` | Finance/Admin has issued invoice outside the system |
| `sent` | Invoice communication has been sent to the invoice email |

### Transaction

| Field | Type | Description |
|-------|------|-------------|
| `transactionId` | String | Internal reference |
| `orderId` | FK | Parent order |
| `type` | Enum | `payment` \| `refund` |
| `paymentMethod` | Enum | `vnpay` |
| `amount` | Decimal | |
| `gatewayRef` | String | VNPay transaction ID |
| `processedAt` | DateTime | |

## 5. Story Map

| # | Story | Actor | Scope |
|---|-------|-------|-------|
| [US-01] | Admin: Order Management Dashboard | Admin | Order monitoring and investigation |
| [US-02] | Customer: Order History & Detail | Customer | TradeXpo booth-registration orders |
| [US-03] | Admin: Invoice Request Management | Admin / Finance | Invoice queue, export, issued/sent tracking |

## 6. Dependencies

| Dependency | Direction | Note |
|-----------|-----------|------|
| [US-01][TX] Select Booth Type and Position | Upstream | Creates the initial `Pending Payment` order and VNPay session context |
| [US-02][TX] Booth Payment (VNPay) | Upstream | VNPay callback creates `Paid` / `Failed` / `Cancelled` / `Expired` orders |
| [US-03][TX] Optional Billing Information for Booth Order | Upstream | Captures invoice request and billing snapshot on booth orders |
| Payment epic [US-01] Configure Platform Default | Upstream | Payment config controls VNPay availability |
| Partner Portal | Downstream | Triggered after Order: Paid |
| Plan & Subscriptions epic | Downstream | B2B subscription payments use `orderType = b2b_subscription`; order records remain owned here once that scope is introduced |
