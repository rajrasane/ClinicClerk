# ClinicClerk

## Project Overview
ClinicClerk is a modern, secure digital patient records management system designed for solo medical practitioners. It replaces handwritten notes with a searchable digital solution featuring multi-tenancy, authentication, and optimized performance. The application allows doctors to manage patient profiles, track visits/consultations, and view medical history in a secure, isolated environment.

## Tech Stack
- **Framework:** Next.js 15.2+ (App Router)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Styling:** Tailwind CSS v4
- **UI Components:** Radix UI primitives, Headless UI, Heroicons, Lucide React
- **State Management:** React Context (`AuthContext`), React Hook Form
- **Animations:** Framer Motion

## Architecture
The project follows a standard Next.js App Router structure:

- **Frontend:**
  - Pages are located in `src/app`.
  - Reusable UI components are in `src/components/ui`.
  - Feature-specific components (e.g., Modals, Forms) are in `src/components`.
  - Custom hooks for data fetching (`usePatients`, `useVisits`) are in `src/hooks`.
- **Backend:**
  - API routes are defined in `src/app/api` (e.g., `/api/patients`, `/api/visits`).
  - These routes interact with Supabase using a server-side client.
- **Database & Security:**
  - Data is stored in Supabase (PostgreSQL).
  - **Multi-tenancy:** Achieved via Row Level Security (RLS). Each `patients` and `visits` record is linked to a `doctor_id`.
  - RLS policies ensure doctors can only access their own data (`doctor_id = auth.uid()`).

## Key Files
- **`src/lib/schema.sql`**: The specific SQL schema defining `doctors`, `patients`, and `visits` tables, along with RLS policies. **Always refer to this for database structure.**
- **`src/lib/supabase.ts`**: Client-side Supabase client configuration.
- **`src/contexts/AuthContext.tsx`**: Manages global authentication state.
- **`src/app/api/**`**: Backend logic for CRUD operations.
- **`src/components/**`**: UI components. Note the distinction between generic `ui` components and feature components.

## Building and Running
- **Install Dependencies:** `npm install`
- **Development Server:** `npm run dev`
- **Build for Production:** `npm run build`
- **Lint Code:** `npm run lint`

## Environment Setup
The project requires a `.env.local` file with the following keys (see `.env.example`):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL` (optional, for direct connection)

## Development Conventions
- **Type Safety:** Use TypeScript interfaces for all data structures (Patients, Visits, Doctors).
- **Styling:** Use Tailwind CSS utility classes. Avoid custom CSS files where possible.
- **Components:** distinct separation between "smart" components (fetching data) and "dumb" components (UI).
- **Security:** rigorous adherence to RLS. All API routes must verify the user's session.
- **Forms:** Use `react-hook-form` for form state and validation.
