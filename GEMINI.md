# ClinicClerk

ClinicClerk is a modern, secure digital patient records management system built for solo medical practitioners. It allows doctors to manage patient profiles, track visits/consultations, and maintain medical histories with strict data isolation and security.

## Project Overview

- **Purpose**: Digital replacement for handwritten patient notebooks, featuring multi-tenancy and optimized performance.
- **Architecture**: Next.js 15 App Router application using Supabase for Backend-as-a-Service (Auth & Database).
- **Styling**: Tailwind CSS v4 with a mobile-first, glass-morphism design.
- **Security**: Relies heavily on Supabase Row Level Security (RLS) to ensure doctors only access their own data.

## Tech Stack

- **Framework**: Next.js 15.2.4 (React 19, TypeScript)
- **Database & Auth**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS v4, Framer Motion, Radix UI primitives
- **Forms**: React Hook Form
- **Utilities**: date-fns, react-hot-toast, jspdf (exporting)

## Key Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the development server (with Turbopack) |
| `npm run build` | Builds the application for production |
| `npm run start` | Starts the production server |
| `npm run lint` | Runs ESLint |

## Project Structure

- **`src/app/`**: Next.js App Router pages and API routes.
    - `api/`: Backend endpoints (patients, visits, auth) protected by rate limiting.
    - `login/`, `signup/`: Authentication pages.
    - `dashboard/` (implied or root): Main application interface.
- **`src/components/`**: React components.
    - `ui/`: Reusable primitives (buttons, modals, inputs).
    - `auth/`: Login/Signup forms.
    - `Patients.tsx`, `Visits.tsx`: Core feature components.
- **`src/lib/`**: Core utilities and configurations.
    - `supabase.ts` / `supabase-server.ts`: Supabase client initialization.
    - `schema.sql`: Database schema and RLS policies.
    - `rate-limit.ts`: API rate limiting logic.
- **`src/middleware.ts`**: Handles API rate limiting and request processing at the edge.

## Database Schema

The database consists of three core tables, all protected by RLS:
1.  **`doctors`**: Extends `auth.users`. Stores profile info (clinic name, address).
2.  **`patients`**: Linked to `doctor_id`. Stores demographics and medical history.
3.  **`visits`**: Linked to `doctor_id` and `patient_id`. Stores consultation details, diagnosis, and prescription.

## Development Conventions

- **Authentication**: All data access is scoped to the authenticated user (doctor) via RLS.
- **API Security**: API routes are rate-limited via middleware.
- **UI/UX**: Uses modal-based forms for CRUD operations to maintain context.
- **State Management**: Uses React hooks (`usePatients`, `useVisits`) for data fetching and state.
