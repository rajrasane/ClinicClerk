# ClinicClerk

Digital patient records management system built with Next.js 15 and PostgreSQL for medical practices. Designed to replace handwritten patient notebooks with a secure, searchable digital system.

## Features

- **Patient Management** - Create, read, update, delete patient records
- **Visit/Consultation Tracking** - Record each patient visit with medical details
- **Search & Filter** - Search patients by name, phone, or other criteria
- **Medical Data Storage** - Store comprehensive patient information and visit history
- **API-First Design** - RESTful API endpoints for all operations
- **Postman Testing** - Comprehensive API testing documentation

## Tech Stack

- **Framework**: Next.js 15 with TypeScript
- **Database**: PostgreSQL with pg library
- **Styling**: Tailwind CSS v4
- **Forms**: React Hook Form
- **API Testing**: Postman documentation included

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 12+ installed locally

### Setup
```bash
# Clone and install
git clone <your-repo-url>
cd ClinicClerk-Initial
npm install

# Set up PostgreSQL database
createdb clinicclerk_dev

# Environment variables
cp .env.example .env.local
# Add your PostgreSQL credentials

# Run development server
npm run dev
```

### Environment Variables
```env
# PostgreSQL Database
DATABASE_URL=postgresql://username:password@localhost:5432/clinicclerk_dev
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=clinicclerk_dev
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password
```

## Project Structure

```
src/
├── app/
│   ├── api/                    # API routes (patients, visits)
│   └── admin/                  # Admin dashboard
├── components/
│   └── admin/                  # Admin components for patient & visit management
├── lib/
│   └── db/                     # Database configuration and schemas
└── sections/                   # Reusable page sections
```

## API Endpoints

- `GET/POST /api/patients` - Patient management
- `GET/POST /api/visits` - Visit records management
- `PUT /api/admin/*` - Admin operations

## Usage

**Staff**: Access patient records, create new patients, record visits
**Doctors**: Review patient history, record diagnoses and prescriptions

## License

MIT

