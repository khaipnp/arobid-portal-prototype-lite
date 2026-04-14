# Epic: eVoucher

## Purpose

The eVoucher module provides a platform-level mechanism for Arobid (Admin) to issue discount vouchers that can be applied by businesses at checkout. Vouchers can be scoped to a specific service or expo and are distributed by authorized Partners on behalf of Arobid.

## Issuer Model

- **Arobid (Admin)** is the sole issuer of eVouchers. No external party can create or modify vouchers.
- **Partners** may purchase voucher batches from Arobid under a separate commercial agreement (out of scope for this module) and distribute them to businesses.
- **Businesses** receive individual voucher codes and apply them during checkout.

## Voucher Scope

An eVoucher is always scoped to exactly one **Module** and one **Target** within that module:

| Module | Target |
|--------|--------|
| `B2B Marketplace` | A specific service available on the marketplace |
| `TradeXpo` | A specific expo event |

This scoping ensures vouchers cannot be misapplied across unintended contexts.

## Voucher Code Model

Admin chooses one of two code types when creating a voucher:

| Type | Description | Use case |
|------|-------------|----------|
| **Single-use batch** | System generates N unique individual codes (e.g., `EXPO2025-A1B2`, `EXPO2025-C3D4`). Each code is redeemable exactly once. Admin exports all codes as CSV to distribute via Partners. | Targeted distribution — each Partner/business gets a distinct code. |
| **Multi-use code** | Admin enters one memorable code (e.g., `SUMMER25`). That single code can be used up to `Issued Quantity` times across any number of businesses. No per-business use limit. | Broadcast campaigns — one code shared publicly or sent to a group. |

- Codes are **case-insensitive** — the system normalizes input to uppercase before validation.
- Only **one voucher code** may be applied per order at a time.

## Discount Mechanics

- Discount is applied **at the payment step**, reducing the payable amount on the order.
- Supported discount types: **Percentage (%)** or **Fixed Amount (VND)**.
- For **single-use batch**: each unique code can be redeemed exactly once.
- For **multi-use code**: the shared code can be applied up to `Issued Quantity` times total, with no per-business restriction.
- `Remaining = Issued − Locked − Redeemed`. Locked quantity (payment in-progress) is excluded from availability to prevent double-use.

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
