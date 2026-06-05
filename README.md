# 企業管理系統 (Enterprise Management System)

An internal administrative management system for a medium-sized company (51–200 employees).

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **UI Library**: shadcn/ui
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Data Fetching**: @tanstack/react-query

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
4. Run the dev server:
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── api/          # Supabase data layer (entity CRUD operations)
├── components/   # Reusable UI components
├── hooks/        # Custom React hooks
├── lib/          # Utilities, auth context, configs
├── pages/        # Route pages
└── types/        # TypeScript type definitions
```

## Features

- 🏢 Company info & news
- ⏰ Attendance & leave management
- 📊 Work reporting (daily/KPI)
- 🎓 Course & training management
- 💼 Business development (tenders)
- 👑 Leadership & peer reviews
- ⚙️ Admin approvals & settings
- 📈 Analytics & reports
