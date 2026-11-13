/** Validation shared by API create/update routes. Only allowlisted fields are returned. */
export class ApiError extends Error {
  constructor(message: string, public readonly status = 400) {
    super(message);
  }
}

type Payload = Record<string, unknown>;
const MAX_DATABASE_ID = 2147483647;

export function parsePositiveId(value: unknown, label = 'ID'): number {
  if ((typeof value !== 'number' && typeof value !== 'string') ||
      (typeof value === 'string' && !/^[1-9]\d*$/.test(value))) {
    throw new ApiError(`Invalid ${label}`);
  }
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1 || number > MAX_DATABASE_ID) {
    throw new ApiError(`Invalid ${label}`);
  }
  return number;
}

export function parsePagination(params: URLSearchParams) {
  const page = parsePositiveId(params.get('page') ?? '1', 'page');
  const limit = Math.min(parsePositiveId(params.get('limit') ?? '10', 'limit'), 100);
  const offset = (page - 1) * limit;
  if (offset > MAX_DATABASE_ID - limit) throw new ApiError('Page is too large');
  return { page, limit, offset };
}

export function validateDate(value: unknown, label = 'date'): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000')) {
    throw new ApiError(`Invalid ${label}`);
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new ApiError(`Invalid ${label}`);
  }
  return value;
}

function text(body: Payload, output: Payload, field: string, max: number, required = false) {
  const value = body[field];
  if (value === undefined && !required) return;
  if (value === null && !required) { output[field] = null; return; }
  if (typeof value !== 'string' || (required && !value.trim())) {
    throw new ApiError(`${field} must be ${required ? 'a non-empty' : 'a'} string`);
  }
  if (value.length > max) throw new ApiError(`${field} exceeds maximum length of ${max} characters`);
  output[field] = value.trim();
}

function enumeration(body: Payload, output: Payload, field: string, allowed: string[], required = false) {
  const value = body[field];
  if (value === undefined && !required) return;
  if (value === null && !required) { output[field] = null; return; }
  if (typeof value !== 'string' || !allowed.includes(value)) throw new ApiError(`Invalid ${field}`);
  output[field] = value;
}

export function validatePatient(body: Payload, partial = false): Payload {
  const output: Payload = {};
  for (const field of ['first_name', 'last_name']) {
    text(body, output, field, 30, !partial || body[field] !== undefined);
  }
  for (const [field, max] of Object.entries({ middle_name: 30, address: 200, allergies: 500, emergency_contact: 50 })) {
    text(body, output, field, max);
  }
  if (!partial || body.age !== undefined) {
    if (typeof body.age !== 'number' || !Number.isInteger(body.age) || body.age < 1 || body.age > 120) {
      throw new ApiError('Age must be an integer between 1 and 120');
    }
    output.age = body.age;
  }
  enumeration(body, output, 'gender', ['M', 'F', 'O'], !partial || body.gender !== undefined);
  enumeration(body, output, 'blood_group', ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']);
  text(body, output, 'phone', 10, !partial || body.phone !== undefined);
  if (output.phone !== undefined && !/^\d{10}$/.test(output.phone as string)) {
    throw new ApiError('Phone number must be 10 digits');
  }
  if (!Object.keys(output).length) throw new ApiError('No patient fields provided');
  return output;
}

export function validateVisit(body: Payload, partial = false): Payload {
  const output: Payload = {};
  if (!partial) output.patient_id = parsePositiveId(body.patient_id, 'patient ID');
  if (!partial || body.visit_date !== undefined) output.visit_date = validateDate(body.visit_date, 'visit date');
  text(body, output, 'chief_complaint', 300, !partial || body.chief_complaint !== undefined);
  for (const [field, max] of Object.entries({ symptoms: 500, diagnosis: 300, prescription: 1000, notes: 500 })) {
    text(body, output, field, max);
  }
  if (body.follow_up_date !== undefined) {
    output.follow_up_date = body.follow_up_date === null || body.follow_up_date === ''
      ? null : validateDate(body.follow_up_date, 'follow-up date');
  }
  if (body.vitals !== undefined) {
    if (body.vitals === null) output.vitals = null;
    else {
      if (typeof body.vitals !== 'object' || Array.isArray(body.vitals)) throw new ApiError('Invalid vitals format');
      const entries = Object.entries(body.vitals);
      if (entries.length > 20 || entries.some(([key, value]) =>
        !/^[a-zA-Z][a-zA-Z0-9_]{0,39}$/.test(key) ||
        !(typeof value === 'string' && value.length <= 100))) {
        throw new ApiError('Vitals must contain short text values');
      }
      output.vitals = body.vitals;
    }
  }
  if (body.consultation_fee !== undefined) {
    const fee = body.consultation_fee;
    if (fee !== null && (typeof fee !== 'number' || !Number.isInteger(fee) || fee < 0 || fee > MAX_DATABASE_ID)) {
      throw new ApiError('Consultation fee must be a non-negative integer');
    }
    output.consultation_fee = fee;
  }
  enumeration(body, output, 'payment_status', ['P', 'D']);
  enumeration(body, output, 'payment_method', ['C', 'O']);
  if (!partial) {
    output.consultation_fee ??= null;
    output.payment_status ??= 'D';
    output.payment_method ??= null;
  }
  if (output.payment_status === 'D') {
    if (output.payment_method) throw new ApiError('Payment method should not be set for Due status');
    // Also clear a previously stored method when marking an existing visit Due.
    output.payment_method = null;
  }
  if (!Object.keys(output).length) throw new ApiError('No visit fields provided');
  return output;
}

export function validateProfile(body: Payload): Payload {
  const output: Payload = {};
  text(body, output, 'first_name', 30, true);
  text(body, output, 'last_name', 30, true);
  for (const [field, max] of Object.entries({ middle_name: 30, phone: 10, clinic_name: 100, clinic_address: 2000 })) {
    text(body, output, field, max);
    output[field] = output[field] || null;
  }
  if (output.phone && !/^\d{10}$/.test(output.phone as string)) throw new ApiError('Phone number must be 10 digits');
  return output;
}
