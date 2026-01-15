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
- **State Management:** 
  - **React Query (TanStack Query v5)** - Server state, caching, data fetching (patients, visits, doctor profile)
  - **Zustand** - Client-side UI state (modals, pagination, filters)
  - **React Context** - Authentication state only (user, session)
- **Forms:** React Hook Form
- **Animations:** Framer Motion

## Architecture
The project follows a standard Next.js App Router structure with a three-layer state management approach:

- **Frontend:**
  - Pages are located in `src/app`.
  - Reusable UI components are in `src/components/ui`.
  - Feature-specific components (e.g., Modals, Forms) are in `src/components`.
  - React Query hooks for server state (`usePatients`, `useVisits`) are in `src/hooks`.
  - Zustand stores for UI state (`usePatientStore`, `useVisitStore`) are in `src/stores`.
  - React Query provider wrapper in `src/providers/QueryProvider.tsx`.

- **State Management (Three-Layer Strategy):**
  1. **Server State (React Query):** All database data (patients, visits, profile) with automatic caching, background refetching, and optimistic updates. Configured in `src/lib/query-client.ts`.
  2. **UI State (Zustand):** Modal states, pagination, search queries, filters, and selected items. No API calls or data fetching.
  3. **Global Auth State (React Context):** User authentication and session management only. No data fetching - all data comes from React Query.

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
- **`src/lib/query-client.ts`**: React Query configuration with caching strategy (10-min stale time, no refetch on focus/mount).
- **`src/contexts/AuthContext.tsx`**: Manages authentication state only (user, session). No data fetching - purely for auth.
- **`src/hooks/useDoctor.ts`**: React Query hook for doctor profile data (fetch, update).
- **`src/hooks/usePatients.ts`**: React Query hooks for patient data (fetch, add, update, delete).
- **`src/hooks/useVisits.ts`**: React Query hooks for visit data (fetch, add, update, delete).
- **`src/stores/usePatientStore.ts`**: Zustand store for patient UI state (modals, pagination, search, selected items).
- **`src/stores/useVisitStore.ts`**: Zustand store for visit UI state (modals, pagination, filters, date range).
- **`src/providers/QueryProvider.tsx`**: React Query provider wrapper.
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
- **Type Safety:** Use TypeScript interfaces for all data structures (Patients, Visits, Doctors). Keep interfaces consistent across hooks, stores, and components.
- **Styling:** Use Tailwind CSS utility classes. Avoid custom CSS files where possible.
- **State Management:**ALL server data (database queries, API calls, including doctor profile).
  - Use **Zustand** for UI state (modal visibility, pagination, filters, search terms).
  - Use **React Context** ONLY for authentication state (user, session) - no data fetching in Context.
  - Never mix concerns: UI state stays in Zustand, ALL server state in React Query, auth state in Context
  - Never mix concerns: UI state stays in Zustand, server state in React Query.
- **Components:** Distinct separation between "smart" components (using hooks/stores) and "dumb" components (pure UI).
- **Security:** Rigorous adherence to RLS. All API routes must verify the user's session.
- **Forms:** Use `react-hook-form` for form state and validation.
- **Caching:** Respect the 10-minute stale time. Use React Query's `refetch()` for manual updates and automatic cache invalidation on mutations.
- **Modals:** Use Radix UI's `modal={false}` prop to prevent scrollbar hiding issues.
