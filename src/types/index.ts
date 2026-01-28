/**
 * Shared types for ClinicClerk
 * Single source of truth for Patient, Visit, and common interfaces
 */

// ============ Patient Types ============

export interface Patient {
    id: number;
    first_name: string;
    middle_name?: string;
    last_name: string;
    age: number;
    gender: 'M' | 'F' | 'O';
    phone: string;
    address: string;
    blood_group: string;
    allergies: string;
    emergency_contact: string;
    created_at: string;
    updated_at: string;
    visit_count?: number;
}

/** Minimal patient info for dropdowns/selects */
export type PatientSummary = Pick<Patient, 'id' | 'first_name' | 'last_name' | 'phone'>;

// ============ Visit Types ============

export interface Visit {
    id: number;
    patient_id: number;
    visit_date: string;
    chief_complaint: string;
    symptoms: string;
    diagnosis: string;
    prescription: string;
    notes: string;
    follow_up_date: string;
    vitals: Record<string, string> | null;
    created_at: string;
    updated_at?: string;
    // Denormalized patient fields (from JOIN)
    first_name: string;
    last_name: string;
    phone: string;
    age?: number;
    gender?: string;
    // Payment fields
    consultation_fee: number | null;
    payment_status: 'P' | 'D' | null;
    payment_method: 'C' | 'O' | null;
}

// ============ Pagination ============

export interface PaginationData {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
}

// ============ Gender Utilities ============

export const GENDER_DISPLAY_TO_DB = {
    'Male': 'M',
    'Female': 'F',
    'Other': 'O'
} as const;

export const GENDER_DB_TO_DISPLAY = {
    'M': 'Male',
    'F': 'Female',
    'O': 'Other'
} as const;

export type GenderCode = 'M' | 'F' | 'O';
export type GenderDisplay = 'Male' | 'Female' | 'Other';
