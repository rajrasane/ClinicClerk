import { expect, it, vi } from 'vitest';
const table = vi.hoisted(() => vi.fn());
vi.mock('jspdf-autotable', () => ({ default: table }));
import { generatePatientsPDFBuffer } from '@/lib/pdf-generator-server';

it('keeps optional patient PDF columns aligned across mixed empty values', () => {
  const base = { full_name: 'Synthetic Example', age: 30, gender: 'Other', phone: '', address: '', blood_group: '', allergies: '', emergency_contact: '' };
  generatePatientsPDFBuffer([{ ...base, phone: '0000000000' }, { ...base, address: 'Synthetic address' }]);
  expect(table.mock.calls[0][1].head[0]).toEqual(['Patient Name', 'Age', 'Gender', 'Phone', 'Address']);
  expect(table.mock.calls[0][1].body).toEqual([
    ['Synthetic Example', '30', 'Other', '0000000000', ''],
    ['Synthetic Example', '30', 'Other', '', 'Synthetic address'],
  ]);
});
