# Arobid Portal Prototype

This project is a prototype for the Arobid portal system, focusing on virtual exhibition management (Tradexpo), seller management, and integrated e-commerce features.

## 🚀 Tech Stack

- **Framework:** [Next.js 15+](https://nextjs.org/) (App Router)
- **Runtime:** [Bun](https://bun.sh/)
- **Language:** TypeScript
- **Styling:** Tailwind CSS, shadcn/ui
- **Database:** PostgreSQL (via Prisma ORM)
- **Linting & Formatting:** Biome

## 🛠️ Key Features

### 1. Tradexpo Management (Virtual Exhibition)
- Manage exhibition lists and details.
- Hall and Booth template libraries.
- Hall slot configuration.
- Translation system for templates.

### 2. Role-based Dashboards
- **Admin:** System-wide administration.
- **Partner:** For exhibition organizing partners.
- **Seller:** For exhibitors to manage and configure their booths.

### 3. Commerce & Orders
- Order Management system.
- Payment method and bank account configuration.
- eVoucher system (Management and Checkout).

### 4. Livestream & Interaction
- Host dashboard for streaming.
- Integrated Stream Player.
- Live Comments system.

### 5. Notifications
- Integrated real-time in-app notification system.

## 📁 Directory Structure

- `app/`: Next.js routes, pages, and API endpoints.
  - `(dashboard)/`: Role-based administration pages (admin, partner, seller).
  - `(tradexpo)/`: Virtual exhibition related pages.
  - `api/`: Backend logic and API routes.
- `components/`: Reusable React component library.
  - `ui/`: Base components from shadcn/ui.
  - `tradexpo/`, `seller/`, `orders/`, ...: Feature-specific modules.
- `lib/`: Utility functions, database configuration, and mock data.
- `prisma/`: Database schema definitions and migrations.
- `scripts/`: Data seeding scripts for various modules.

## 🛠️ Installation and Setup

### Prerequisites
- [Bun](https://bun.sh/) installed.

### Setup Steps

1. Install dependencies:
```bash
bun install
```

2. Configure environment variables:
Create a `.env` file and configure necessary parameters (Database URL, etc.).

3. Initialize Database:
```bash
bun run prisma migrate dev
bun run db:seed
```

4. Run the development server:
```bash
bun run dev
```

The application will be available at: `http://localhost:1995` (default).

## 📜 Available Scripts

- `bun run lint`: Check code style with Biome.
- `bun run format`: Auto-format code.
- `bun run typecheck`: Run TypeScript type checking.
- Data seeding scripts:
  - `bun run tradexpo:seed`
  - `bun run evoucher:seed`
  - `bun run platform:seed`
  - `bun run notifications:seed`

---
*Note: This is a prototype and is currently under active development.*
