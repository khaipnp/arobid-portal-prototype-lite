## 1. User Story Statement

**As a** System Administrator (Admin),

**I want** to view and filter the list of all Expos currently on the system,

**so that** I can monitor operational status, manage resources, and perform administrative tasks (such as assigning owners or approving) quickly.

## 2. Description & Business Value

This feature provides a control center (Dashboard) for Admins to manage the lifecycle of Expos.

**Business value:** Helps Admins control the amount of resources being used, provide timely support to Expo Owners, and ensure data consistency on the Arobid platform.

## 3. Scope & Technical Constraints

### **3.1. Pre-condition**

The Admin has successfully logged into the admin page.

At least one Expo record has been created in the system.

### **3.2. Input**

The system provides filters and search functions for Admin to quickly query data:

| Search Bar | Text | Partial match for Expo Name or Exact match for Manager Email. |
| --- | --- | --- |
| Status | Dropdown | Options: All, Draft, Pending Review, Live, Ended, Archived, Canceled. |
| Categories | Multi-select | Filter by Industry Categories (Levels 1-4). |
| Time | Date Picker | Filter by "Start Date" or "End Date" duration. |

### **3.3. Process / Logic**

- **Default Sorting:** The list must display in descending order of the creation date (Newest first).
- **Pagination:** Standard display of 20 records per page to optimize loading speed.
- **Debounce Logic:** For the Search Bar, the system should trigger the search query 500ms after the user stops typing to reduce API calls.
- **State Management:** Actions that modify data (e.g., "Archive" or "Delete") must trigger a **Confirmation Modal** to prevent accidental clicks.
- **Approval Synchronization:** When an Expo status is updated to "Live," the system must trigger a cache refresh or database update to render the Expo in the Public/Client-facing list.
- **Notification Trigger:** The system must automatically trigger an SMTP notification service upon a successful status change to "Live".

### **3.4. Output**

The display table includes the following columns:

- **Expo Name:** Displayed with a high-res Thumbnail.
- **Owner:** Registered Email of the exhibitor.
- **Duration:** Formatted as [DD/MM/YYYY] - [DD/MM/YYYY].
- **Status:** Color-coded badges (e.g., Green for "Live", Yellow for "Pending").
- **Actions:** View Details, Approve, Edit, Archive/Delete.

## 4. Diagram

`Admin Login` -> `Sidebar: Expo Management` -> `Fetch Data API` -> `Render Table` -> `Apply Filters` -> `Update View`

## 5. Design (UX/UI Interaction)

### **User Flow 1: Advanced Search & Filter**

**Given:** Admin is on the main Admin Dashboard.

- **Step 1:** Admin clicks "Expo Management" on the Sidebar menu.
- **Step 2:** System loads the full list of Expos.
- **Step 3:** Admin enters a specific keyword in the Search bar and selects "Pending Review" from the Status dropdown.
- **Step 4:** System updates the table in real-time to show matching results.

## **6. Acceptance Criteria (AC)**

| **AC-01** | Admin accesses the list. | Page loads. | Table displays columns: Name, Owner, Time, Status. Default sort: Newest. |
| --- | --- | --- | --- |
| **AC-02** | Admin enters keywords in Search. | 500ms elapses after typing. | List filters by Expo Name or Owner Email containing the keyword. |
| **AC-03** | Admin selects a Category. | Filter applied. | The list refreshes to show only Expos assigned to that specific industry. |
| **AC-04** | Admin clicks "Archive". | Admin confirms in popup. | Status changes to "Archived"; the Expo is removed from the Client-facing list. |
| **AC-05** | Admin clicks "View". | Action completed | The system redirects the Admin to the full Detail page for that specific Expo. |
| **AC-06** | An Expo is "Pending Review". | Admin clicks "Approve" and confirms. | Status changes to "Live" and the Expo is immediately visible on the Client-facing list. |
| **AC-07** | Status changes to "Live". | Action is successfully processed. | The system sends an automated approval notification to the Expo Owner's email. |