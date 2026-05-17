# Partner Portal MVP Story Map and Refinement Plan

## 1. Purpose

This document turns the Partner Portal Epic Overview into an MVP delivery map.

It is a planning and refinement bridge, not a developer-ready user story set. User stories should be created only after the delivery slices below are confirmed.

Source documents:

- [EPIC_OVERVIEW.md](./EPIC_OVERVIEW.md)
- [Partner Portal & Dashboard Architecture.md](./Partner%20Portal%20%26%20Dashboard%20Architecture.md)

## 2. MVP Outcome

Partner Portal MVP should let Arobid onboard and operate Partner Organizations without creating a separate marketplace or data silo.

MVP outcome:

- Arobid Admin can create/manage Partner Organization setup and capabilities.
- Partner users can access the portal based on Partner Organization membership, role, capability, and assigned scope.
- Tenant can draft and submit mini-site content, but Arobid Admin reviews and publishes it.
- Tenant can invite, view, and remove Company / Enterprise associations without editing Company / Enterprise profile data.
- Partner users can view assigned Expo / program operations and report-only metrics.
- TradeCredit is report-only for Partner Portal.

## 3. MVP Journey Map

```text
Arobid Admin sets up Partner Organization
  -> Arobid Admin enables capabilities and initial users
  -> Partner Owner / Admin accesses Partner Portal
  -> Tenant drafts mini-site content
  -> Tenant submits mini-site for Arobid Admin review
  -> Arobid Admin publishes or rejects mini-site content
  -> Tenant invites Companies / Enterprises into scope
  -> Company accepts invite
  -> Partner Owner / Admin receives Notification Center event
  -> Partner views associated companies and assigned Expos / programs
  -> Partner views analytics and TradeCredit report-only metrics
```

## 4. Delivery Slices

| Slice | Capability | Primary actors | Why first / dependency | Refinement output |
|---|---|---|---|---|
| S1 | Partner Organization setup and capability routing | Arobid Admin, Partner Owner, Partner Admin, Viewer | Foundation for all Portal access, sidebar visibility, and scoped data | Admin setup story + Partner access/capability routing story |
| S2 | Partner user role and membership management | Arobid Admin, Partner Owner, Partner Admin | Required before multi-user MVP can operate | Role/action matrix story |
| S3 | Tenant mini-site draft and submit | Partner Owner, Partner Admin, Viewer | First visible Tenant capability; depends on access and roles | Tenant mini-site draft/preview/submit story |
| S4 | Arobid Admin mini-site review and publish | Arobid Admin, Partner Owner, Partner Admin | Required because Tenant cannot self-publish | Admin review/publish/reject/versioning story |
| S5 | Tenant Company association management | Partner Owner, Partner Admin, Viewer, Company user | Core Tenant operating model; depends on Partner Organization scope | Invite/list/remove association story |
| S6 | Company association audit and notifications | Partner Owner, Partner Admin, Arobid Admin, Company user | Required for traceability and accepted-company event | Audit log story + Notification integration story |
| S7 | Assigned Expo / program operations | Tenant, Turnkey, Co-host | Gives Partner Portal operational value beyond mini-site | Assigned Expo/program list and scoped detail story |
| S8 | Partner Overview, analytics, and TradeCredit reporting | Partner users | Reporting layer depends on scoped data and upstream event availability | Overview dashboard + report-only TradeCredit story |

## 5. Candidate Story Backlog

### S1 - Partner Organization Setup and Capability Routing

| Candidate Story | Actor | Scope |
|---|---|---|
| [[US-01][CORE] Admin Creates and Manages Partner Organization](./%5BUS-01%5D%5BCORE%5D%20Admin%20Creates%20and%20Manages%20Partner%20Organization.md) | Arobid Admin | Create Partner Organization, assign type/capabilities, status, branding basics |
| [[US-02][CORE] Partner Portal Access and Capability Routing](./%5BUS-02%5D%5BCORE%5D%20Partner%20Portal%20Access%20and%20Capability%20Routing.md) | Partner user | Validate membership, role, enabled capability, and assigned scope before rendering Portal modules |
| [[US-03][CORE] Shared Partner Portal Sidebar Module Visibility](./%5BUS-03%5D%5BCORE%5D%20Shared%20Partner%20Portal%20Sidebar%20Module%20Visibility.md) | Partner user | Show/hide modules based on enabled Partner Organization capability |

### S2 - Partner User Role and Membership Management

| Candidate Story | Actor | Scope |
|---|---|---|
| [[US-04][CORE] Invite Partner Organization User](./%5BUS-04%5D%5BCORE%5D%20Invite%20Partner%20Organization%20User.md) | Partner Owner / Partner Admin | Invite users into Partner Organization |
| [[US-05][CORE] Assign Partner User Role](./%5BUS-05%5D%5BCORE%5D%20Assign%20Partner%20User%20Role.md) | Partner Owner / Partner Admin | Owner can assign Owner/Admin/Viewer; Admin can assign Admin/Viewer only |
| [[US-06][CORE] Remove or Disable Partner Organization User](./%5BUS-06%5D%5BCORE%5D%20Remove%20or%20Disable%20Partner%20Organization%20User.md) | Partner Owner / Partner Admin | Owner has full control; Admin has limited control and cannot control Owner |

### S3 - Tenant Mini-site Draft and Submit

| Candidate Story | Actor | Scope |
|---|---|---|
| [[US-07][CORE] Draft Tenant Mini-site Content](./%5BUS-07%5D%5BCORE%5D%20Draft%20Tenant%20Mini-site%20Content.md) | Partner Owner / Partner Admin | Draft logo, banner, brand color, company list display, expo list, CTA, contact info, service/bundle section |
| [[US-08][CORE] Preview Tenant Mini-site](./%5BUS-08%5D%5BCORE%5D%20Preview%20Tenant%20Mini-site.md) | Partner Owner / Partner Admin / Viewer | Preview draft or published state within allowed scope |
| [[US-09][CORE] Submit Tenant Mini-site for Review](./%5BUS-09%5D%5BCORE%5D%20Submit%20Tenant%20Mini-site%20for%20Review.md) | Partner Owner / Partner Admin | Submit draft or draft update to Arobid Admin |

### S4 - Arobid Admin Mini-site Review and Publish

| Candidate Story | Actor | Scope |
|---|---|---|
| [[US-10][CORE] Review Submitted Tenant Mini-site](./%5BUS-10%5D%5BCORE%5D%20Review%20Submitted%20Tenant%20Mini-site.md) | Arobid Admin | Compare submitted version with current published version when applicable |
| [[US-11][CORE] Publish Tenant Mini-site](./%5BUS-11%5D%5BCORE%5D%20Publish%20Tenant%20Mini-site.md) | Arobid Admin | Publish submitted version and preserve version history |
| [[US-12][CORE] Reject Tenant Mini-site Submission](./%5BUS-12%5D%5BCORE%5D%20Reject%20Tenant%20Mini-site%20Submission.md) | Arobid Admin | Reject with required reason; Tenant can revise from rejected version |
| [[US-13][CORE] Notify Mini-site Review Result](./%5BUS-13%5D%5BCORE%5D%20Notify%20Mini-site%20Review%20Result.md) | System / Notification Service | Send Notification Center event to Partner Owner and Partner Admin on publish/reject |

### S5 - Tenant Company Association Management

| Candidate Story | Actor | Scope |
|---|---|---|
| [[US-14][CORE] Invite Company into Tenant Scope](./%5BUS-14%5D%5BCORE%5D%20Invite%20Company%20into%20Tenant%20Scope.md) | Partner Owner / Partner Admin | Create invitation / association context |
| [[US-15][CORE] Accept Tenant Association Invite](./%5BUS-15%5D%5BCORE%5D%20Accept%20Tenant%20Association%20Invite.md) | Company user | Company accepts invitation and association becomes active |
| [[US-16][CORE] View Tenant-associated Companies](./%5BUS-16%5D%5BCORE%5D%20View%20Tenant-associated%20Companies.md) | Partner Owner / Partner Admin / Viewer | List companies associated with Tenant scope |
| [[US-17][CORE] Remove Company Association from Tenant Scope](./%5BUS-17%5D%5BCORE%5D%20Remove%20Company%20Association%20from%20Tenant%20Scope.md) | Partner Owner / Partner Admin | Remove association from Tenant scope without editing Company record |

### S6 - Company Association Audit and Notifications

| Candidate Story | Actor | Scope |
|---|---|---|
| [[US-18][CORE] Record Company Association Audit Events](./%5BUS-18%5D%5BCORE%5D%20Record%20Company%20Association%20Audit%20Events.md) | System | Track invite, accept, activate, deactivate, remove, block, unblock, reactivate |
| [[US-19][CORE] View Company Association Audit Log](./%5BUS-19%5D%5BCORE%5D%20View%20Company%20Association%20Audit%20Log.md) | Arobid Admin / Support | Inspect association state changes and actor/source/reason |
| [[US-20][CORE] Notify Tenant When Company Accepts Invite](./%5BUS-20%5D%5BCORE%5D%20Notify%20Tenant%20When%20Company%20Accepts%20Invite.md) | System / Notification Service | Send Notification Center event to Partner Owner and Partner Admin |

### S7 - Assigned Expo / Program Operations

| Candidate Story | Actor | Scope |
|---|---|---|
| [[US-21][CORE] View Assigned Expos and Programs](./%5BUS-21%5D%5BCORE%5D%20View%20Assigned%20Expos%20and%20Programs.md) | Tenant / Turnkey / Co-host users | List assigned Expos/programs filtered by Partner Organization scope |
| [[US-22][CORE] Open Assigned Expo or Program Operational View](./%5BUS-22%5D%5BCORE%5D%20Open%20Assigned%20Expo%20or%20Program%20Operational%20View.md) | Tenant / Turnkey / Co-host users | View operational summary for selected assigned scope |
| [[US-23][CORE] Show Turnkey Expo as Arobid-configured](./%5BUS-23%5D%5BCORE%5D%20Show%20Turnkey%20Expo%20as%20Arobid-configured.md) | Turnkey Partner | Display Expo configured by Arobid Admin; no self-configuration action |

### S8 - Partner Overview, Analytics, and TradeCredit Reporting

| Candidate Story | Actor | Scope |
|---|---|---|
| [[US-24][CORE] Partner Overview Dashboard](./%5BUS-24%5D%5BCORE%5D%20Partner%20Overview%20Dashboard.md) | Partner users | Show scoped KPIs: associated enterprises, activated enterprises, assigned Expos, booth usage, RFQ, DealContext |
| [[US-25][CORE] TradeCredit Report-only View](./%5BUS-25%5D%5BCORE%5D%20TradeCredit%20Report-only%20View.md) | Partner users | Show aggregate TradeCredit usage by assigned scope; no allocation/configuration |
| [[US-26][CORE] Analytics Report Filters](./%5BUS-26%5D%5BCORE%5D%20Analytics%20Report%20Filters.md) | Partner users | Filter metrics by assigned scope and time period |

## 6. Admin Portal Parallel Backlog

Partner Portal MVP depends on Admin Portal work. These stories should be refined in parallel or before their Partner Portal downstream stories.

| Admin Story Area | Needed by |
|---|---|
| Create / manage Partner Organization | S1 |
| Enable / disable Partner Organization capability | S1, S7, S8 |
| Admin override for Partner users | S2 |
| Review / publish / reject Tenant mini-site | S4 |
| Mini-site version history and comparison | S4 |
| Setup / configure Turnkey Expo | S7 |
| Block / unblock Company association | S6 |
| View Company association audit log | S6 |

## 7. Cross-Cutting Contracts

### Access Contract

Every Partner Portal request should evaluate:

```text
authenticated user
-> Partner Organization membership
-> Partner user role
-> Partner Organization enabled capability
-> assigned data scope
```

### Notification Contract

Partner Portal should emit Notification Center events for:

| Event | Recipients |
|---|---|
| Mini-site published | Partner Owner, Partner Admin |
| Mini-site rejected | Partner Owner, Partner Admin |
| Company association accepted | Partner Owner, Partner Admin |

Exact notification title, body, and deep link are resolved in [US-13][CORE] Notify Mini-site Review Result and [US-20][CORE] Notify Tenant When Company Accepts Invite.

### Audit Contract

Company association audit fields:

| Field |
|---|
| `association_id` |
| `partner_organization_id` |
| `enterprise_id` |
| `old_status` |
| `new_status` |
| `action` |
| `source` |
| `actor_type` |
| `actor_id` |
| `reason` |
| `created_at` |

`reason` is optional for invite / accept / activate and required for remove / block.

## 8. Definition of Ready for User Stories

Each Partner Portal story is ready for developer handoff only when it specifies:

| Required item | Why |
|---|---|
| Actor and role | Avoids unclear permissions |
| Partner Organization capability | Determines module visibility |
| Assigned data scope | Prevents data leakage across tenants / partners |
| Pre-condition | Clarifies upstream setup required |
| Input fields / actions | Gives design and dev concrete surface |
| Process / lifecycle logic | Prevents hidden state assumptions |
| Output / state change | Makes AC testable |
| Notification behavior | Required where events are emitted |
| Audit behavior | Required where data scope or association changes |
| Given / When / Then AC | Developer-ready acceptance criteria |

## 9. Recommended Refinement Order

Refine in this order:

1. Admin creates and manages Partner Organization.
2. Partner Portal access and capability routing.
3. Partner user role and membership management.
4. Tenant mini-site draft / preview / submit.
5. Arobid Admin mini-site review / publish / reject.
6. Tenant Company association invite / accept / remove.
7. Company association audit and accepted-company notification.
8. Assigned Expo / program operations.
9. Partner Overview dashboard and TradeCredit reporting.

Rationale: access and admin setup must be stable before mini-site, company association, or reporting stories can be written without hidden assumptions.

## 10. Story-Level Open Items Resolved During Refinement

The following open items were resolved while refining S3-S8 into developer-ready user stories.

| Open item | Resolution |
|---|---|
| Exact notification title/body/deep link for mini-site publish/reject | Resolved in [US-13][CORE] Notify Mini-site Review Result |
| Exact notification title/body/deep link for company accepted event | Resolved in [US-20][CORE] Notify Tenant When Company Accepts Invite |
| Mini-site Admin review screen layout | Resolved in [US-10][CORE] Review Submitted Tenant Mini-site |
| Mini-site version comparison behavior | Resolved in [US-10][CORE] Review Submitted Tenant Mini-site |
| Public mini-site CTA allowed destination options | Resolved in [US-07][CORE] Draft Tenant Mini-site Content |
| Association audit log filters and layout | Resolved in [US-19][CORE] View Company Association Audit Log |
| Report freshness policy | Resolved in [US-24][CORE] Partner Overview Dashboard and [US-26][CORE] Analytics Report Filters |
