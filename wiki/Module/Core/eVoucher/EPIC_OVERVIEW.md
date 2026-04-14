# Epic: eVoucher

## Purpose

The eVoucher module provides a platform-level mechanism for Arobid (Admin) to issue discount vouchers that can be applied by businesses at checkout. Vouchers can be scoped to a specific service or expo and are distributed by authorized Partners on behalf of Arobid.

## Issuer Model

- **Arobid (Admin)** is the sole issuer of eVouchers. No external party can create or modify vouchers.
- **Partners** may purchase voucher batches from Arobid under a separate commercial agreement (out of scope for this module) and distribute them to businesses. Each voucher batch records which Partner it was assigned to for audit purposes.
- **Businesses** receive individual voucher codes and apply them during checkout.

## Voucher Scope

An eVoucher is always scoped to exactly one of:
- A **specific service** available on B2B Marketplace, or
- A **specific Expo** on TradeXpo.

This scoping ensures vouchers cannot be misapplied across unintended contexts.

## Voucher Code Model

Each voucher batch (definition) generates **N unique individual codes** — one per issued quantity unit. For example, a batch with `Issued Quantity = 1000` produces 1000 distinct codes (e.g., `EXPO2025-A1B2`, `EXPO2025-C3D4`, …). Admin exports these codes as a CSV to distribute via Partners.

- Codes are **case-insensitive** — the system normalizes input to uppercase before validation.
- Only **one voucher code** may be applied per order at a time.

## Discount Mechanics

- Discount is applied **at the payment step**, reducing the payable amount on the order.
- Supported discount types: **Percentage (%)** or **Fixed Amount (VND)**.
- One unique code = one transaction. A code cannot be split or reused across multiple transactions.
- `Remaining = Issued − Locked − Redeemed`. Locked codes (payment in-progress) are excluded from availability to prevent double-use.

## Redemption Lifecycle

Each individual code follows this lifecycle:

```
Generated → [Available] → Locked (payment in-progress) → Redeemed (payment success)
                                                        ↘ Available (payment failed / timeout / canceled)
                                                        ↘ Revoked   (batch revoked while locked)
```

A locked code is released back to `Available` if the transaction does not complete successfully. If the batch was revoked while the code was locked, the released code enters `Revoked` state and cannot be reused.

## Cross-Module Usage

eVoucher is a **Core** module. It is consumed by:
- `Module/Core/Orders & Transactions` — checkout and payment flows
- `Module/TradeXpo/Exhibitor Payment` — expo booth payment
- `Module/B2B Marketplace` — service subscriptions and packages (future)

## User Stories

| # | Title | Actor |
|---|-------|-------|
| US-01 | eVoucher Issuance and Management | Admin |
| US-02 | Apply eVoucher at Checkout | Business (Buyer/Exhibitor) |
| US-03 | Voucher Redemption Lock and Release | System |
