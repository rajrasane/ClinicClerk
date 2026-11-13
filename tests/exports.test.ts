import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import * as XLSX from 'xlsx';
import { csvCell, createCsv } from '@/lib/csv';
import { generatePatientsExcelBuffer, generateVisitsExcelBuffer } from '@/lib/excel-generator-server';

const mocks = vi.hoisted(() => ({
  user: vi.fn(), from: vi.fn(),
  patientPdf: vi.fn(() => Buffer.from('synthetic-pdf')),
  visitPdf: vi.fn(() => Buffer.from('synthetic-pdf')),
}));
vi.mock('@/lib/supabase-server', () => ({
  getAuthenticatedUser: mocks.user,
  createSupabaseServerClient: () => ({ from: mocks.from }),
}));
vi.mock('@/lib/pdf-generator-server', () => ({ generatePatientsPDFBuffer: mocks.patientPdf, generateVisitsPDFBuffer: mocks.visitPdf }));
import { GET as exportPatients } from '@/app/api/export/patients/route';
import { GET as exportVisits } from '@/app/api/export/visits/route';

const patient = {
  first_name: '=SUM(1,2)', middle_name: '', last_name: 'Synthetic', full_name: '=SUM(1,2) Synthetic',
  age: 40, gender: 'M', phone: '0000000000', address: 'One "quoted",\nline', blood_group: '',
  allergies: '@formula', emergency_contact: '+0000000000'
};
const visit = { patients: patient, patient_id: 1, visit_date: '2026-11-13', chief_complaint: '=1+1',
  symptoms: 'Synthetic', diagnosis: '', prescription: '', notes: '"quoted",\nnew line', follow_up_date: '2026-12-14', vitals: { pulse: '70' } };
function query(data: unknown) {
  const result = { data, error: null };
  const chain = {
    select: vi.fn(), eq: vi.fn(), order: vi.fn(), or: vi.fn(), gte: vi.fn(), lte: vi.fn(),
    single: vi.fn().mockResolvedValue(result),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  };
  for (const key of ['select', 'eq', 'order', 'or', 'gte', 'lte'] as const) chain[key].mockReturnValue(chain);
  return chain;
}
function request(path: string) { return new NextRequest(`http://localhost/api/export/${path}`); }

beforeEach(() => { mocks.user.mockResolvedValue({ id: 'synthetic-doctor-a' }); });

describe('CSV cells', () => {
  it.each(['=1+1', '+cmd', '-1+2', '@SUM(A1)', '   =1', '\ttext', '\rtext', '\ntext'])('neutralizes spreadsheet text %j', text => {
    expect(csvCell(text)).toBe(`"'${text}"`);
  });
  it('quotes delimiters, doubles embedded quotes and preserves numeric values', () => {
    expect(csvCell('One "quoted",\nline')).toBe('"One ""quoted"",\nline"');
    expect(csvCell(-12)).toBe('"-12"');
    expect(csvCell(null)).toBe('""');
    expect(createCsv(['a', 'b'], [['one,two', 'three']])).toBe('"a","b"\r\n"one,two","three"');
  });
});

describe('workbook data', () => {
  it('writes formula-looking patient fields as literal string cells', () => {
    const book = XLSX.read(generatePatientsExcelBuffer([patient]), { type: 'buffer' });
    expect(book.Sheets.Patients.A2).toMatchObject({ t: 's', v: patient.full_name });
    expect(book.Sheets.Patients.A2.f).toBeUndefined();
    expect(book.Sheets.Patients.G2.f).toBeUndefined();
  });
  it('formats ISO dates once and stores visit formulas as text', () => {
    const book = XLSX.read(generateVisitsExcelBuffer([{ ...visit, patient_name: '=1+1', vitals: JSON.stringify(visit.vitals) }]), { type: 'buffer' });
    expect(book.Sheets.Visits.A2).toMatchObject({ t: 's', v: '=1+1' });
    expect(book.Sheets.Visits.A2.f).toBeUndefined();
    expect(book.Sheets.Visits.B2.v).toBe('13/11/2026');
  });
});

describe('export routes', () => {
  it.each([exportPatients, exportVisits])('rejects unauthenticated exports before querying', async route => {
    mocks.user.mockResolvedValue(null);
    expect((await route(request('patients')))?.status).toBe(401);
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it.each(['csv', 'excel', 'pdf', 'json'])('scopes patient %s exports and prevents HTTP storage', async format => {
    const patients = query([patient]);
    mocks.from.mockImplementation((table: string) => table === 'doctors' ? query(patient) : patients);
    const response = await exportPatients(request(`patients?format=${format}`));
    expect(response?.status).toBe(200);
    expect(response?.headers.get('cache-control')).toBe('private, no-store');
    expect(patients.eq).toHaveBeenCalledWith('doctor_id', 'synthetic-doctor-a');
    if (format === 'csv') {
      const text = await response!.text();
      expect(text).toContain('"\'=SUM(1,2) Synthetic"');
      expect(text).toContain('"One ""quoted"",\nline"');
    }
  });
  it.each(['csv', 'excel', 'pdf', 'json'])('scopes visit and joined patient in %s exports', async format => {
    const visits = query([visit]);
    mocks.from.mockImplementation((table: string) => table === 'doctors' ? query(patient) : visits);
    const response = await exportVisits(request(`visits?format=${format}&patient_id=1`));
    expect(response?.status).toBe(200);
    expect(response?.headers.get('cache-control')).toBe('private, no-store');
    expect(visits.eq).toHaveBeenCalledWith('doctor_id', 'synthetic-doctor-a');
    expect(visits.eq).toHaveBeenCalledWith('patients.doctor_id', 'synthetic-doctor-a');
    expect(visits.eq).toHaveBeenCalledWith('patient_id', 1);
    if (format === 'json') {
      expect((await response!.json()).data[0]).toMatchObject({ visit_date: '13/11/2026', follow_up_date: '14/12/2026', vitals: '{"pulse":"70"}' });
    }
  });
  it.each(['patient_id=1bad', 'patient_id=-1', 'startDate=2026-02-30', 'startDate=2026-12-01&endDate=2026-11-01', 'format=html'])('rejects malformed export filter %s', async filter => {
    expect((await exportVisits(request(`visits?${filter}`)))?.status).toBe(400);
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it('does not expose database error details', async () => {
    const chain = query(null);
    chain.then = resolve => Promise.resolve({ data: null, error: { message: 'private synthetic record' } }).then(resolve as (value: unknown) => unknown);
    mocks.from.mockReturnValue(chain);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = await exportPatients(request('patients'));
    expect(response?.status).toBe(500);
    expect(await response!.text()).not.toContain('private synthetic record');
  });
});
