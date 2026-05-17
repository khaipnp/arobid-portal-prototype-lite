# Epic Overview: Partner Portal

## 1. Business Context

Partner Portal is Arobid's shared operating environment for Partner Organizations. It replaces the older narrow assumption that Partner Portal is only an `Expo Owner` access surface.

The portal supports partner-led ecosystem operations while keeping Arobid as the platform control plane:

- Partner Organizations can operate assigned programs, Expos, campaigns, tenant mini-sites, company associations, and reporting views.
- Arobid keeps Company / Enterprise data, Expo setup, payment rules, TradeCredit rules, publishing control, and governance in platform-owned systems.
- Partner Portal reads and acts on Arobid SSOT data instead of creating a separate marketplace, company database, or deal database per partner.

This epic is a product-level scope definition. It is not yet a set of developer-ready user stories.

## 2. Product Model

### Partner Organization

`Partner Organization` is the business-facing parent entity for Partner Portal.

Partner Organization types / capabilities include:

| Type / Capability | Meaning |
|---|---|
| Strategic Partner | Association, government body, ecosystem sponsor, or institutional partner |
| Expo Partner | Co-host or Turnkey partner for Expo operations |
| Distribution Partner | Partner that distributes booth quota or campaign access |
| Alliance Partner | Partner that provides services or future bundles |
| Government Program Partner | Partner operating public / sponsored support programs |
| Tenant | Partner Organization with optional branded mini-site and scoped operating view |

`Tenant` is one type of Partner Organization. It is not a parallel entity or separate data silo.

### Company / Enterprise Association

Companies / Enterprises remain Arobid SSOT records.

Tenant company lists are Companies / Enterprises associated with a Tenant, not Tenant-owned Companies.

Rules:

- A Company / Enterprise can be associated with multiple Partner Organizations.
- Tenant cannot edit underlying Company / Enterprise profile data.
- Tenant can invite companies into its scope.
- Tenant can remove company associations from its scope.
- Removing an association does not delete or edit the underlying Arobid Company / Enterprise.

Association sources can include:

- Tenant invite
- Partner code
- Invite link
- Campaign attribution
- Expo participation
- Program enrollment
- Admin assignment

## 3. MVP Scope

| In Scope | Out of Scope |
|---|---|
| Partner Organization access model | Replacing all legacy Access Control stories in this epic directly |
| MVP roles: Partner Owner, Partner Admin, Viewer | Future fine-grained roles such as Program Manager, Operations, Finance |
| Shared Partner Portal sidebar with module visibility by capability | Separate portal UI per partner type |
| Tenant mini-site draft / submit / review / publish model | Tenant self-publishing |
| Tenant mini-site fields: logo, banner, brand color, company list display, expo list, CTA, contact info, service / bundle section | Advanced page builder or custom templates |
| Company association management | Tenant editing Company / Enterprise profile data |
| Company association audit | Full data-governance workflow outside association changes |
| Assigned Expo / program visibility | Turnkey partner self-creating or self-configuring Expos |
| TradeCredit report-only visibility | Partner allocation or TradeCredit rule configuration |
| Reporting / analytics for assigned scope | Full finance settlement workflow |
| Platform Billing as default finance model | Wholesale Partner collection as MVP product flow |

Deferred / phase-after-MVP:

- Communications / Partner Message Hub
- Finance & Settlement self-service
- Service Bundles self-service
- Wholesale payment flow
- Turnkey pricing workflow in Portal
- Advanced role matrix

## 4. Core Product Rules

| Topic | Rule |
|---|---|
| Platform control | Arobid remains the control plane for policy, platform configuration, payment rules, TradeCredit rules, settlement rules, and data governance. |
| Data ownership | Company / Enterprise records are Arobid SSOT data. Partner Organizations only receive scoped visibility and scoped operations. |
| Access model | Partner Portal access should be based on Partner Organization membership and enabled capability, not only `Expo Owner`. |
| Capability visibility | Tenant, Turnkey, Co-host, and Alliance use the same Partner Portal sidebar. Modules are shown or hidden by enabled capability. |
| Tenant mini-site | Tenant mini-site is optional and branded. Tenant drafts content; Arobid Admin reviews and publishes. |
| Mini-site live update | If a mini-site is already published, Tenant edits create a draft update. The live mini-site stays unchanged until Arobid Admin approves and publishes the update. |
| Mini-site rejection | Arobid Admin must provide a rejection reason. Tenant can revise from the rejected version and resubmit. |
| Company association review | Company association does not require Arobid Admin review in MVP. |
| Company accepted notification | When a Company accepts a Tenant association invite and becomes active, send Notification Center events to Partner Owner and Partner Admin users. |
| Turnkey control | Turnkey Partner does not self-create or self-configure Expo in Partner Portal. Turnkey works with Arobid outside Portal; Arobid Admin sets up and configures the Expo. |
| Turnkey pricing | Pricing proposal is handled outside Portal. No pricing proposal input, approval workflow, or approved pricing display is needed in MVP. |
| TradeCredit | Partner Portal displays report-only TradeCredit usage by assigned scope. Partner Organization cannot allocate credits or configure rules. |
| Finance | Platform Billing is default. Wholesale Partner collection is offline / exceptional and out of MVP. |

## 5. MVP Role and Action Matrix

These permissions apply only within the Partner Organization's assigned scope and enabled capabilities.

| Module / Action | Partner Owner | Partner Admin | Viewer |
|---|:---:|:---:|:---:|
| View Overview | Y | Y | Y |
| Invite user into Partner Organization | Y | Y | N |
| Assign role to user | Y | Admin / Viewer only | N |
| Remove user | Y | Limited | N |
| Transfer ownership | Y | N | N |
| Draft mini-site content | Y | Y | N |
| Submit mini-site for Arobid Admin review | Y | Y | N |
| View mini-site review / publish status | Y | Y | Y |
| View associated companies | Y | Y | Y |
| Invite / associate company | Y | Y | N |
| Remove company association from Tenant scope | Y | Y | N |
| View assigned Expos / programs | Y | Y | Y |
| View TradeCredit reports | Y | Y | Y |
| View analytics / reports | Y | Y | Y |

Default rule: Partner Admin can operate the Partner Organization but cannot change ownership or control Partner Owner accounts.

## 6. MVP Module Scope by Capability

All Partner Organization types use the same Partner Portal sidebar. Modules are shown or hidden based on enabled capability.

| Module | Tenant | Turnkey | Co-host | Alliance |
|---|:---:|:---:|:---:|:---:|
| Overview | Y | Y | Y | Y |
| Mini-site | Y | Optional | Optional | Optional |
| Enterprises & Members | Y | Y | Y | Later / limited |
| Expo Programs | If assigned | Y | Y | N |
| Quota & TradeCredit Reports | Report-only | Report-only | Report-only | Later |
| Communications | Later | Later | Later | Later |
| Finance & Settlement | View-only / later | View-only / later | View-only / later | Later |
| Analytics & Reports | Y | Y | Y | Limited |
| Service Bundles | Later | N | N | Later |

## 7. Mini-site Lifecycle

Mini-site content lifecycle is separate from Partner Organization status.

```text
draft -> submitted -> published
draft -> submitted -> rejected -> draft
published -> draft_update -> submitted -> published
published -> draft_update -> submitted -> rejected -> draft_update
```

Rules:

- Tenant can draft mini-site content.
- Tenant submits content to Arobid Admin for review.
- Tenant cannot self-publish.
- Arobid Admin must enter a rejection reason when rejecting submitted content.
- Partner Owner and Partner Admin receive Notification Center events when mini-site content is published or rejected.
- Version history should retain at least the currently published version, the latest submitted version, and the latest rejected / draft update version if applicable.

Mini-site draft fields:

| Section | MVP behavior |
|---|---|
| Logo | Tenant can draft / update |
| Banner | Tenant can draft / update |
| Brand color | Tenant can draft / update |
| Company list display | Tenant can configure display of eligible associated companies |
| Expo list | Tenant can display assigned / related Expos |
| CTA | Tenant can draft CTA label / destination from allowed options |
| Contact info | Tenant can draft public contact information |
| Service / bundle section | Draft field for future capability; Service Bundles remain phase-after-MVP |

Public mini-site company list should show only active associated companies whose Arobid company profile is public / approved.

## 8. Company Association Lifecycle

Company association status belongs to the relationship between Partner Organization and Company / Enterprise, not to the Company / Enterprise record.

```text
invited -> pending_acceptance -> active
active -> inactive
active -> removed
inactive -> active
inactive -> removed
blocked -> active only by Arobid Admin override
removed -> active only by new invite / partner code / admin assignment
```

Association statuses:

| Status | Meaning |
|---|---|
| `invited` | Tenant / Partner Organization has sent an invite or generated an invitation context |
| `pending_acceptance` | Company has not completed acceptance / onboarding for the association |
| `active` | Company is actively associated with the Partner Organization scope |
| `inactive` | Association remains recorded but is not active in the current program / scope |
| `removed` | Tenant removed the association from its scope |
| `blocked` | Arobid Admin blocked the association due to governance, risk, or policy |

Default rules:

- Company association does not require Arobid Admin review before becoming active in MVP.
- Company association does not use `pending_review` or `rejected`; those review/rejection semantics apply to mini-site content only.
- Partner Owner and Partner Admin can invite companies.
- Partner Owner and Partner Admin can remove company associations from Tenant scope.
- Removing an association does not delete or edit the underlying Arobid Company / Enterprise.
- Viewer can view associated companies but cannot invite, remove, or change association status.
- When a Company accepts an invitation and association becomes `active`, Partner Owner and Partner Admin receive Notification Center events.

### Association Audit Fields

Audit should track association state changes without implying Tenant ownership of Company / Enterprise data.

| Field | Meaning |
|---|---|
| `association_id` | Unique ID of the Partner Organization - Enterprise association |
| `partner_organization_id` | Partner Organization / Tenant scope |
| `enterprise_id` | Arobid Company / Enterprise record |
| `old_status` | Previous association status |
| `new_status` | New association status |
| `action` | `invite`, `accept`, `activate`, `deactivate`, `remove`, `block`, `unblock`, `reactivate` |
| `source` | `tenant_invite`, `partner_code`, `invite_link`, `campaign`, `expo_participation`, `program_enrollment`, `admin_assignment` |
| `actor_type` | `partner_user`, `company_user`, `arobid_admin`, or `system` |
| `actor_id` | User/system actor that caused the transition |
| `reason` | Optional for invite/accept/activate; required for remove/block |
| `created_at` | Timestamp of the audit event |

## 9. Admin Portal Dependencies

Partner Portal MVP requires Admin Portal capabilities because Arobid remains the control plane.

| Admin dependency | Why it is needed |
|---|---|
| Create / manage Partner Organization | Partner Portal access depends on Partner Organization records and capabilities |
| Enable / disable Partner Organization capabilities | Controls sidebar/module visibility |
| Manage Partner Organization users if needed | Admin override / support flow |
| Review and publish Tenant mini-site | Tenant cannot self-publish public mini-site content |
| Reject mini-site with reason | Required for review loop |
| View mini-site version history | Required to compare submitted, published, rejected, or draft update content |
| Setup and configure Turnkey Expo | Turnkey Partner does not self-configure Expo |
| Block / unblock company association | Arobid governance / risk control |
| View association audit | Required for traceability and support |

## 10. Reporting and Analytics

MVP reports should stay scoped to assigned Partner Organization data.

Suggested MVP metrics:

| Metric | Scope |
|---|---|
| Enterprises associated | Tenant / Partner Organization |
| Enterprises activated | Tenant / program / Expo scope |
| Expos assigned | Partner Organization |
| Booth usage | Assigned Expo / program scope |
| TradeCredit usage | Aggregate report-only by assigned scope |
| RFQ generated | Aggregate by assigned scope |
| Deal contexts | Aggregate by assigned scope |
| Mini-site status | Tenant mini-site review / publish status |

Detailed deal content, company-private data, and user-level wallet balances are out of scope unless separately authorized.

## 11. Candidate Refinement Backlog

These are story areas to refine after the MVP product definition is approved.

| Area | Actor | Scope |
|---|---|---|
| Partner Organization Access and Capability Routing | Partner Owner / Partner Admin / Viewer | Membership, role, sidebar visibility, assigned scope |
| Tenant Mini-site Draft and Submit | Partner Owner / Partner Admin | Draft fields, preview, submit for Arobid Admin review |
| Arobid Admin Mini-site Review and Publish | Arobid Admin | Review, publish, reject with reason, version history |
| Tenant Company Association Management | Partner Owner / Partner Admin | Invite, list, remove association, accepted notification |
| Company Association Audit | Arobid Admin / Support | Audit log for invite, accept, remove, block, unblock |
| Partner Overview Dashboard | Partner users | Overview KPIs scoped by capability and assignment |
| Assigned Expo / Program Operations | Tenant / Turnkey / Co-host | Assigned Expo/program list and operational reporting |
| TradeCredit Reporting | Partner users | Aggregate report-only metrics by assigned scope |

## 12. Dependencies

| Dependency | Direction | Note |
|---|---|---|
| Access Control | Upstream / peer | Existing `Expo Owner-only` assumptions must be reconciled with Partner Organization membership and capability routing. |
| Admin Portal | Upstream | Admin owns Partner Organization creation, capability setup, mini-site publish, Turnkey Expo setup, and governance overrides. |
| B2B Core / Enterprise SSOT | Upstream | Company / Enterprise data remains owned by Arobid. Partner Portal only sees scoped associations. |
| TradeXpo Engine | Upstream / peer | Assigned Expo and program operations depend on Expo records configured by Arobid Admin. |
| TradeCredit | Downstream data source | Partner Portal displays aggregate report-only TradeCredit metrics. |
| Notification Service | Downstream | Delivers mini-site publish/reject notifications and company association accepted notifications. |
| Orders & Transactions / Payment | Future peer | Platform Billing remains default; full Partner settlement is out of MVP. |

## 13. Open Items for Story Refinement

These items do not block product model approval, but should be resolved when writing implementation-ready user stories.

| Item | Needed for |
|---|---|
| Exact notification title/body/deep link copy for mini-site publish/reject and company accepted events | Notification user stories / AC |
| Admin review screen layout and comparison behavior between submitted and published mini-site versions | Admin mini-site review story |
| Audit log screen layout and filters | Association audit story |
| Exact public mini-site CTA allowed options | Tenant mini-site story |
| Exact report freshness policy for Partner Portal analytics | Dashboard/reporting stories |

## 14. Source Documents

- [Partner Portal & Dashboard Architecture](./Partner%20Portal%20%26%20Dashboard%20Architecture.md)
- [Access Control - Partner Portal](../Access%20Control/[US-04][CORE]%20Access%20Control%20%E2%80%94%20Partner%20Portal.md)
- [Partner and Tenant TradeCredit Reporting](../TradeCredit/[US-05][CORE]%20Partner%20and%20Tenant%20TradeCredit%20Reporting.md)
