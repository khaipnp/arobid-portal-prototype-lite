# Epic Overview: Payment

## 1. Business Context

The Payment epic owns the **payment infrastructure layer** for the Arobid platform. It covers payment method configuration and VNPay gateway integration. Other epics (Orders & Transactions, TradeXpo) plug into this layer to initiate and complete payments.

This epic does **not** manage the order lifecycle — that is handled by the Orders & Transactions epic. The boundary is:
- **Payment epic:** payment config, VNPay gateway integration and checkout execution
- **Orders & Transactions epic:** order records, order status tracking, Admin reconciliation dashboard, customer order history

> **Current version scope:** VNPay is the only supported payment gateway. Bank Transfer (VietQR) is **not active** in this version — related stories ([US-02] and [US-03]) are closed.

## 2. Scope

| In Scope | Out of Scope |
|----------|-------------|
| VNPay payment method configuration — platform and per-Expo | Bank Transfer / VietQR (deferred to future version) |
| VNPay gateway redirect and callback handling | Bank account masterdata management |
| Per-Expo payment config with platform default inheritance | Admin reconciliation dashboard |
| | Automated refunds via gateway |
| | Multi-currency support |
| | Instalment / partial payments |
| | Subscription billing (separate epic: Plan & Subscriptions) |

## 3. Payment Method & Config Resolution

The system uses a **2-tier configuration** model:

| Tier | Config | Applies to |
|------|--------|-----------|
| **Platform Default** ([US-01]) | VNPay on/off | B2B Marketplace purchases + all Expos with `isInherited = true` |
| **Per-Expo Override** ([US-04]) | VNPay on/off | TradeXpo booth payments for Expos individually configured |

**Config resolution at checkout:**

```
TradeXpo booth payment:
  1. Read ExpoPaymentConfig for this Expo
  2. isInherited = true? → use Platform Default
  3. isInherited = false? → use Expo-specific config

B2B Marketplace purchase:
  → Always reads Platform Default directly
```

**Supported methods:**

| Method | Flow | Booth Lock Timing |
|--------|------|-------------------|
| **VNPay** | Redirect to VNPay gateway → callback | At "Proceed to Payment" click — timeout managed by gateway |

## 4. Data Model

### ExpoPaymentConfig

| Field | Type | Description |
|-------|------|-------------|
| `expoId` | FK (unique) | One config per Expo |
| `isInherited` | Boolean | `true` = use Platform Default dynamically; `false` = Expo-specific override |
| `vnpayEnabled` | Boolean | |

> New Expos are created with `isInherited = true` by default — no Admin action required to get a working payment config.

### Order (reference — owned by Orders & Transactions epic)

| Field | Type | Description |
|-------|------|-------------|
| `orderId` | String | Display ID — e.g. `ORD-2026-00001` |
| `paymentMethod` | Enum | `vnpay` |
| `status` | Enum | See Orders & Transactions EPIC_OVERVIEW for state machine |

### Transaction (reference — owned by Orders & Transactions epic)

| Field | Type | Description |
|-------|------|-------------|
| `transactionId` | String | Internal reference |
| `orderId` | FK | Parent order |
| `paymentMethod` | Enum | `vnpay` |
| `gatewayRef` | String | VNPay transaction ID |

## 5. Story Map

| # | Story | Actor | Scope | Status |
|---|-------|-------|-------|--------|
| [US-01] | Admin: Configure Platform Payment Methods | Admin | Platform-wide default | Active |
| [US-02] | Admin: Manage Bank Accounts (Masterdata) | Admin | Bank Transfer | **CLOSED** |
| [US-03] | Customer: Pay via QR Bank Transfer | Customer | Bank Transfer checkout | **CLOSED** |
| [US-04] | Admin: Configure Payment Methods per Expo | Admin | Per-Expo override | Active |

## 6. Dependencies

| Dependency | Direction | Note |
|-----------|-----------|------|
| [US-01][TX] Select Booth Type and Position | Upstream | Booth selection triggers payment checkout. VNPay selected: Order created + booth → Pending at "Proceed to Payment"; redirects to VNPay gateway |
| [US-02][TX] Booth Payment (VNPay) | Upstream | VNPay callback updates Order status to Paid / Failed / Cancelled / Expired |
| Orders & Transactions epic | Downstream | Order records, Admin reconciliation, customer order history all depend on payments initiated by this epic |
| Plan & Subscriptions epic | Downstream | B2B subscription payments use `orderType = b2b_subscription`; payment layer handled by this epic |
| Partner Portal | Downstream | Triggered after Order: Paid |
