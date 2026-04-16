## 1. User Story Statement
As an **Admin** or **System Admin**,  
**I want to create** a new Expo record from a selected **Template** (managed in the system) and configure its metadata, schedule, and spatial structure (**Hall / Zone / Booth**) **within the Template’s limits**, while assigning an **Expo Owner** by **searching and selecting an existing user account**,  
**so that** the system can quickly initialize the virtual environment via background jobs, set the Expo to **Draft** with a dynamically calculated **Timeline Phase** (Lazy Evaluation), and notify the Expo Owner via an assignment email giving direct access to the partner dashboard.

## 2. Description & Business Value

This feature allows Admins to serve as the **“Architect”** of the exhibition. By setting up the spatial hierarchy (Hall > Zone > Booth) and assigning an owner early, we ensure:

- **Resource Optimization**: 3D rendering resources are allocated based on the specific service package purchased.
- **Operational Readiness**: The Expo Owner receives a pre-configured environment, reducing onboarding friction.
- **Brand Standards**: Admins maintain control over the aesthetic and structural quality of the platform.

## 3. Scope & Technical Constraints

### 3.1. Pre-condition

- **Admin is logged into** the Admin Portal ([portal.arobid.com](http://portal.arobid.com/)) with valid credentials.
- **Admin has permissions** to manage exhibition records.

### 3.2. Input

|   |   |   |   |
|---|---|---|---|
|**Label**|**Type**|**Required**|**Note**|
|Template|Select|YES|Selection of the pre-built 3D environment layout. (TBD)|
|Expo Name|Text|YES|Limit 255 chars; must be unique.|
|Description|Text Area|YES|Detailed information about the Expo.|
|Thumbnail/Cover Image|Image|NO|Limit size 5MB, **Aspect Ratio 16:9**. Supports JPG, PNG, WEBP.|
|Categories|Multi-select|YES|Supports 3-level industry hierarchy.|
|Start date/Time|Date/Time|YES|Default Start Date = Current Date.|
|End date/Time|Date/Time|YES|Must be > Start Date.|
|Timezone|Dropdown|YES|Default GMT+7.|
|Expo Owner Email|Search Input|YES|Admin inputs email; system returns existing account (if available).|
|Hall|Text|YES|Default: Hall A; acts as the primary group.|
|Zone(s)|Array of Strings|NO|Input as Multi-Tag. Admin can define multiple zones within a Hall.|
|Booth Count|Int|NO|Number of placeholders to generate in the 3D space.|

### 3.3. Process / Logic

- **UUID Generation**: System generates a unique identifier for the Expo record.
- **Spatial Hierarchy**: System establishes the logic: **Hall (Parent) > Zone (Child) > Booth (Grandchild)**.

#### 3.3.3. Unified Status Logic

Immediately upon clicking **“Create”**, the system automatically assigns the following default statuses:

- **Administrative Status (Primary)**: Automatically set to Draft upon creation.
- **Timeline Phase (Secondary / Dynamic)**: **Automatically and dynamically calculated (Lazy Evaluation) on query** based on Current Server Time vs. Start/End Dates, eliminating the need for cron jobs:

- **Upcoming**: Current Time < Start Date.
- **Live**: Start Date ≤ Current Time ≤ End Date.
- **Archived**: Current Time > End Date.

#### 3.3.5. Permissions & Notifications

- **Partner Portal Access**: The assigned Expo Owner email is granted access to [partner.arobid.com](http://partner.arobid.com/) for this specific Expo.
- **Assignment Notification Email**: An automated email is triggered containing:

- Notification of their new role as Expo Owner.
- Direct link to the configuration dashboard.

#### 3.4. Output

- A new Expo record is created with **Status = Draft**.

## 4. Diagram

  

## 5. Design (UX/UI Interaction)
**User Flow 1: Create New Expo**
Given: Admin is on the **Expo Management** list page.
1. Admin clicks **“Create new”** button.
2. System redirects to the **creation form** page.
3. Admin fills in **Metadata**, **Dates**, **Owner Email**, and **Spatial Structure**.
4. Admin clicks **“Submit”** button.
5. System processes data and display toast **“Congratulations”**.
## 6. Acceptance Criteria (AC)

|   |   |   |   |
|---|---|---|---|
|**AC**|**Given**|**When**|**Then**|
|**01**|Admin is on Dashboard.|Clicks **“Create new”**|Redirects to /create-expo.|
|**02**|Form is displayed.|A **Template** is selected and all required fields are filled.|**Submit** button changes from Disabled/Empty to Enabled.|
|**03**|Admin clicks **“Submit”**.|Data is valid and spatial inputs are within the selected Template’s limits.|Record is saved with Status = Draft; redirects to Success page.|
|**04**|Expo is created.|Success page is shown.|After 5s or manual click, Admin returns to the List View.|
|**05**|Creation is successful.|System triggers background communications.|An assignment email with a direct dashboard link is sent to the Expo Owner.|
|**06**|Invalid dates are entered.|End Date < Start Date OR Start Date < Current.|System displays an error toast; **Submit** is blocked.|
|**07**|Template defines spatial capacity.|Admin configures Hall/Zone/Booth within the Template.|System instantly returns success and dispatches an asynchronous background job (Message Queue). Expo initially has Progressing/Initializing status while generating booth coordinates/placeholders and sending emails, then switches to Draft. Email service includes a retry queue (max 3 times) for failures.|
|**08**|Expo Owner email is entered.|System finds matching existing account(s).|System displays user card(s); Admin must select one as Expo Owner.|
|**09**|Expo Owner email is entered.|System finds no matching account.|System shows “User not found” and **blocks Submit** until an existing user is selected.|
|**10**|Expo is accessed or queried.|System retrieves Expo list or details.|Timeline Phase is dynamically evaluated via calculation (Start/End Date vs now()) without storing static phase states or using cron jobs.|