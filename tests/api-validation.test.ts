import { describe, expect, it } from 'vitest';
import { parsePagination, parsePositiveId, validateDate, validatePatient, validateProfile, validateVisit } from '@/lib/api-validation';

const patient = { first_name: 'Synthetic', last_name: 'Patient', age: 30, gender: 'O', phone: '0000000000' };
const visit = { patient_id: 17, visit_date: '2026-11-13', chief_complaint: 'Synthetic test' };

describe('API input boundaries', () => {
  it.each(['1junk', '1.5', '0', '-1', '', 'NaN', '2147483648', [], {}, null, true])('rejects malformed IDs: %j', value => {
    expect(() => parsePositiveId(value)).toThrow('Invalid ID');
  });
  it('keeps integer IDs and bounded pagination', () => {
    expect(parsePositiveId('17')).toBe(17);
    expect(parsePositiveId(17)).toBe(17);
    expect(parsePagination(new URLSearchParams('page=2&limit=500'))).toEqual({ page: 2, limit: 100, offset: 100 });
    expect(() => parsePagination(new URLSearchParams('limit=0'))).toThrow();
    expect(() => parsePagination(new URLSearchParams('page=2147483647'))).toThrow();
  });
  it.each(['2026-02-30', '2026-13-01', '2026-1-1', '2026-11-13T00:00:00Z', '0000-01-01', 0])('rejects invalid calendar dates: %j', value => {
    expect(() => validateDate(value)).toThrow();
  });
  it('accepts leap days only in leap years', () => {
    expect(validateDate('2024-02-29')).toBe('2024-02-29');
    expect(() => validateDate('2025-02-29')).toThrow();
  });
  it.each([{ age: 0 }, { age: '30' }, { age: 1.5 }, { age: null }, { first_name: {} }, { last_name: ' ' }, { address: 'x'.repeat(201) }, { phone: 1234567890 }, { gender: null }])('rejects invalid patient create and update: %j', invalid => {
    expect(() => validatePatient({ ...patient, ...invalid })).toThrow();
    expect(() => validatePatient(invalid, true)).toThrow();
  });
  it('allowlists mutable patient fields and preserves optional clearing', () => {
    expect(validatePatient({ ...patient, doctor_id: 'other', id: 91, allergies: null })).toEqual({ ...patient, allergies: null });
    expect(validatePatient({ middle_name: null }, true)).toEqual({ middle_name: null });
  });
  it.each([{ consultation_fee: -1 }, { consultation_fee: '500' }, { consultation_fee: 1.2 }, { consultation_fee: Infinity }, { payment_status: 'X' }, { payment_method: 'X' }, { vitals: [] }, { vitals: { bp: {} } }, { vitals: { bp: 'x'.repeat(101) } }, { notes: 'x'.repeat(501) }, { visit_date: '2026-02-30' }])('rejects invalid visit create and update: %j', invalid => {
    expect(() => validateVisit({ ...visit, ...invalid })).toThrow();
    expect(() => validateVisit(invalid, true)).toThrow();
  });
  it('preserves form payloads and rejects reparenting-only updates', () => {
    const data = validateVisit({ ...visit, consultation_fee: null, payment_status: 'D', payment_method: null, vitals: { bp: '120/80' }, follow_up_date: null, doctor_id: 'other' });
    expect(data).toEqual({ ...visit, consultation_fee: null, payment_status: 'D', payment_method: null, vitals: { bp: '120/80' }, follow_up_date: null });
    expect(() => validateVisit({ patient_id: 99, doctor_id: 'other' }, true)).toThrow();
    expect(validateVisit({ payment_status: 'D' }, true)).toEqual({ payment_status: 'D', payment_method: null });
    expect(() => validateVisit({ ...visit, payment_method: 'C' })).toThrow();
  });
  it('checks profile types before string operations and bounds their sizes', () => {
    expect(() => validateProfile({ first_name: {}, last_name: 'Test' })).toThrow();
    expect(() => validateProfile({ first_name: 'x'.repeat(31), last_name: 'Test' })).toThrow();
    expect(() => validateProfile({ first_name: 'Test', last_name: 'Test', clinic_name: [] })).toThrow();
  });
});
