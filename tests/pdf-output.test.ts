import { expect, it } from 'vitest';
import { generatePatientsPDFBuffer, generateVisitsPDFBuffer } from '@/lib/pdf-generator-server';

it('generates real patient and visit PDFs with the patched PDF libraries', () => {
  const patient = { full_name: 'Synthetic Patient', age: 30, gender: 'Other', phone: '0000000000', address: '', blood_group: '', allergies: '', emergency_contact: '' };
  const visit = { patient_name: 'Synthetic Patient', visit_date: '13/11/2026', chief_complaint: 'Synthetic complaint', symptoms: '', diagnosis: '', prescription: '', notes: '', follow_up_date: '', vitals: '{"pulse":"70"}' };
  for (const pdf of [generatePatientsPDFBuffer([patient], 'Synthetic Doctor'), generateVisitsPDFBuffer([visit], 'Synthetic Doctor')]) {
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pdf.toString()).toContain('Synthetic Patient');
    expect(pdf.toString()).toContain('%%EOF');
  }
});
