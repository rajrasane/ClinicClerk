# ClinicClerk

A modern, secure digital patient records management system built for solo medical practitioners. Designed to replace handwritten patient notebooks with a comprehensive, searchable digital solution featuring multi-tenancy, authentication, and optimized performance.

## ✨ Features

### 🏥 Core Medical Management
- **Patient Management** - Complete CRUD operations with detailed patient profiles
- **Visit/Consultation Tracking** - Comprehensive visit records with medical details
- **Medical History** - Full patient history with visit timeline and medical data
- **Search & Filter** - Advanced search by name, phone, date ranges, and medical criteria

### 🔐 Security & Authentication  
- **Supabase Authentication** - Secure email/password authentication
- **Multi-Tenant Architecture** - Doctor-based data isolation using Row Level Security (RLS)
- **Data Privacy** - Each doctor only sees their own patients and visits
- **Secure API** - Protected endpoints with authentication middleware

### 🚀 Performance & Optimization
- **Optimized Database Schema** - 90% storage reduction with smart data types
- **Intelligent Caching** - React Query with 10-minute stale time and automatic cache invalidation
- **Optimistic Updates** - Instant UI feedback with background synchronization
- **Smart Data Fetching** - Automatic deduplication and request batching
- **Responsive Design** - Mobile-first UI with modern glass morphism effects

### 💻 Modern UI/UX
- **Clean Interface** - Modern, intuitive design with Tailwind CSS v4
- **Modal-based Forms** - Streamlined patient and visit management
- **Toast Notifications** - Real-time feedback for all operations
- **Date Pickers** - Advanced date selection with auto-close functionality
- **Responsive Layout** - Optimized for desktop, tablet, and mobile devices

## 🛠 Tech Stack

- **Framework**: Next.js 15.2.4 with TypeScript & React 19
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Supabase Auth with custom forms
- **State Management**: 
  - **React Query (TanStack Query)** - Server state management, caching, and data fetching (patients, visits, doctor profile)
  - **Zustand** - Client-side UI state management (modals, pagination, filters)
  - **React Context** - Authentication state only (user, session)
- **Styling**: Tailwind CSS v4 with custom components
- **UI Components**: Radix UI primitives + custom components
- **Forms**: React Hook Form with validation
- **Animations**: Framer Motion for smooth transitions
- **Icons**: Heroicons & Lucide React
- **Date Handling**: date-fns & React Day Picker
- **Notifications**: React Hot Toast

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account (free tier supported)

### Setup
```bash
# Clone and install
git clone https://github.com/rajrasane/ClinicClerk.git
cd ClinicClerk
npm install

# Environment variables
cp .env.example .env.local
# Add your Supabase credentials

# Run development server
npm run dev
```

### Environment Variables
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional: PostgreSQL Database (if using direct connection)
DATABASE_URL=your_database_url
```

### Database Setup
1. Create a new Supabase project
2. Run the SQL schema from `/src/lib/schema.sql` in your Supabase SQL editor
3. Enable Row Level Security policies (included in schema)
4. Update environment variables with your Supabase credentials

## 📁 Project Structure

```
src/
├── app/
│   ├── api/                    # API routes
│   │   ├── patients/          # Patient CRUD operations
│   │   ├── visits/            # Visit CRUD operations  
│   │   └── profile/           # Doctor profile management
│   ├── login/                 # Authentication pages
│   ├── signup/                # User registration
│   └── profile/               # Doctor profile page
├── components/
│   ├── auth/                  # Authentication components
│   │   ├── LoginForm.tsx      # Login form with validation
│   │   └── SignupForm.tsx     # Signup form with doctor profile
│   ├── ui/                    # Reusable UI components
│   │   ├── button.tsx         # Custom button component
│   │   ├── calendar.tsx       # Date picker component
│   │   └── [other-ui].tsx     # Various UI primitives
│   ├── AddPatientModalNew.tsx # Patient creation modal
│   ├── AddVisitModal.tsx      # Visit creation modal
│   ├── PatientDetailsModal.tsx# Patient details view
│   ├── VisitDetailsModal.tsx  # Visit details view
│   ├── Patients.tsx           # Patient management interface
│   └── Visits.tsx             # Visit management interface
├── contexts/
│   └── AuthContext.tsx        # Authentication context (user, session only)
├── hooks/
│   ├── useDoctor.ts           # React Query hooks for doctor profile
│   ├── usePatients.ts         # React Query hooks for patient data
│   ├── useVisits.ts           # React Query hooks for visit data
│   └── useDebounce.ts         # Debounce hook for search optimization
├── lib/
│   ├── supabase.ts            # Supabase client configuration
│   ├── supabase-server.ts     # Server-side Supabase client
│   ├── schema.sql             # Optimized database schema
│   ├── query-client.ts        # React Query configuration
│   ├── excel-generator-server.ts # Server-side Excel export
│   ├── pdf-generator-server.ts   # Server-side PDF export
│   └── utils.ts               # Utility functions
├── providers/
│   └── QueryProvider.tsx      # React Query provider wrapper
├── stores/
│   ├── usePatientStore.ts     # Zustand store for patient UI state
│   └── useVisitStore.ts       # Zustand store for visit UI state
└── sections/
    └── Header.tsx             # Main navigation header
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - Doctor registration
- `POST /api/auth/login` - Doctor login
- `POST /api/auth/logout` - User logout

### Patients
- `GET /api/patients` - Get all patients (filtered by doctor)
- `POST /api/patients` - Create new patient
- `PUT /api/patients/[id]` - Update patient
- `DELETE /api/patients/[id]` - Delete patient

### Visits  
- `GET /api/visits` - Get all visits (filtered by doctor)
- `POST /api/visits` - Create new visit
- `PUT /api/visits/[id]` - Update visit
- `DELETE /api/visits/[id]` - Delete visit

### Profile
- `GET /api/profile` - Get doctor profile
- `PUT /api/profile` - Update doctor profile

## 🏥 Usage

### For Solo Practitioners
1. **Sign Up** - Create your doctor account with clinic details
2. **Add Patients** - Register new patients with comprehensive medical information
3. **Record Visits** - Document consultations, diagnoses, and prescriptions
4. **Search & Filter** - Quickly find patients and review medical history
5. **Manage Profile** - Update your clinic information and preferences

### Key Workflows
- **Patient Registration** - Capture demographics, medical history, and emergency contacts
- **Visit Documentation** - Record chief complaints, symptoms, diagnosis, and treatment plans
- **Medical History Review** - Access complete patient timeline with all previous visits
- **Search Operations** - Find patients by name, phone, or filter visits by date range

## 🏗️ State Management Architecture

### Three-Layer State Strategy

**1. Server State (React Query)**
- Manages all data from the database (patients, visits, doctor profile)
- Automatic caching with 10-minute stale time
- Background refetching and revalidation
- Optimistic updates for instant UI feedback
- Automatic request deduplication
- Configuration: `src/lib/query-client.ts`

**2. UI State (Zustand)**
- Modal visibility states (add, edit, details)
- Pagination state (current page, page size)
- Search and filter states
- Date range selections
- Selected items for operations
- No data fetching or API calls
- Stores: `src/stores/usePatientStore.ts`, `src/stores/useVisitStore.ts`

**3. Global Auth State (React Context)**
- User authentication status (user, session)
- Session management
- Sign in/out operations
- **No data fetching** - purely for authentication
- Context: `src/contexts/AuthContext.tsx`

### Benefits
- **Clean Separation**: Server state, UI state, and auth state are clearly separated
- **No Prop Drilling**: Zustand eliminates the need to pass state through components
- **Single Source of Truth**: All server data (including profile) managed by React Query
- **Type Safety**: Full TypeScript support across all state layers
- **Developer Experience**: Easy to debug and maintain
- **Performance**: Auth Context is lightweight with no data fetching overheadstate layers
- **Developer Experience**: Easy to debug and maintain

## 🔒 Security Features

- **Row Level Security (RLS)** - Database-level data isolation per doctor
- **Authentication Required** - All routes protected with Supabase Auth
- **Data Validation** - Comprehensive input validation and sanitization
- **Secure API** - Protected endpoints with proper error handling
- **Privacy Compliance** - Each doctor can only access their own data

## 🚀 Performance Optimizations

- **Database Schema** - Optimized data types for 90% storage reduction
- **Smart Caching** - Intelligent cache invalidation strategies
- **Optimistic Updates** - Immediate UI updates with background sync
- **Connection Pooling** - Efficient database connection management
- **Responsive Loading** - Progressive loading with skeleton states

## 📊 Scale & Deployment

**Designed for Production:**
- Supports 3K+ patients and 10K+ visits per doctor
- Optimized for Vercel + Supabase free tiers
- Ready for real-world medical practice deployment
- Bandwidth-optimized for cost-effective scaling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues, feature requests, or questions:
1. Check existing GitHub issues
2. Create a new issue with detailed description
3. Include steps to reproduce for bugs

---

**Built with ❤️ for modern medical practices**