import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import * as patients from '@/app/api/patients/route';
import * as patient from '@/app/api/patients/[id]/route';
import * as visits from '@/app/api/visits/route';
import * as visit from '@/app/api/visits/[id]/route';
import * as profile from '@/app/api/profile/route';

const mocks = vi.hoisted(() => ({ user: vi.fn(), client: vi.fn(), adminClient: vi.fn(), deleteUser: vi.fn() }));
vi.mock('@/lib/supabase-server', () => ({ getAuthenticatedUser: mocks.user, createSupabaseServerClient: mocks.client }));
vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.adminClient }));

type Result = { data: unknown; error: { code?: string; message?: string } | null; count?: number };
function database(...results: Result[]) {
  const queries: Array<Record<string, ReturnType<typeof vi.fn>>> = [];
  const from = vi.fn(() => {
    const result = results[queries.length] ?? { data: null, error: null };
    const query: Record<string, ReturnType<typeof vi.fn>> = {};
    for (const method of ['select', 'insert', 'update', 'delete', 'eq', 'or', 'order', 'range', 'gte', 'lte']) {
      query[method] = vi.fn(() => query);
    }
    query.single = vi.fn(async () => result);
    query.then = vi.fn((resolve: (value: Result) => unknown) => Promise.resolve(result).then(resolve));
    queries.push(query);
    return query;
  });
  mocks.client.mockReturnValue({ from });
  return { from, queries };
}
const context = { params: Promise.resolve({ id: '17' }) };
function request(method = 'GET', body?: unknown, path = '/api/test') {
  return new NextRequest(`http://localhost${path}`, {
    method,
    ...(body === undefined ? {} : { body: JSON.stringify(body), headers: { 'content-type': 'application/json' } })
  });
}
const syntheticVisit = { patient_id: 17, visit_date: '2026-11-13', chief_complaint: 'Synthetic test' };
const syntheticPatient = { first_name: 'Synthetic', last_name: 'Patient', age: 30, gender: 'O', phone: '0000000000' };
const endpoints = [patients.GET, patients.POST, patient.GET, patient.PUT, patient.DELETE, visits.GET, visits.POST, visit.GET, visit.PUT, visit.DELETE, profile.PUT, profile.DELETE];

beforeEach(() => {
  vi.clearAllMocks();
  mocks.user.mockResolvedValue({ id: 'synthetic-doctor-a' });
  mocks.adminClient.mockReturnValue({ auth: { admin: { deleteUser: mocks.deleteUser } } });
  mocks.deleteUser.mockResolvedValue({ error: null });
});

describe('API authentication and validation', () => {
  it.each(endpoints)('requires authentication before data access (%#)', async handler => {
    mocks.user.mockResolvedValue(null);
    expect((await handler(request(), context)).status).toBe(401);
    expect(mocks.client).not.toHaveBeenCalled();
    expect(mocks.adminClient).not.toHaveBeenCalled();
  });
  it.each(endpoints)('preserves session-clearing authentication responses (%#)', async handler => {
    const response = NextResponse.json({ success: false }, { status: 401 });
    response.cookies.set('synthetic-session', '', { expires: new Date(0) });
    mocks.user.mockRejectedValue(response);
    expect(await handler(request(), context)).toBe(response);
    expect(mocks.client).not.toHaveBeenCalled();
  });
  it.each([patients.POST, patient.PUT, visits.POST, visit.PUT, profile.PUT])('rejects invalid JSON without querying (%#)', async handler => {
    const response = await handler(new NextRequest('http://localhost/api/test', { method: 'POST', body: '{' }), context);
    expect(response.status).toBe(400);
    expect(mocks.client).not.toHaveBeenCalled();
  });
  it.each([null, [], 'text'])('rejects non-object JSON (%j)', async body => {
    expect((await patients.POST(request('POST', body))).status).toBe(400);
    expect(mocks.client).not.toHaveBeenCalled();
  });
  it('rejects oversized bodies even without Content-Length', async () => {
    expect((await patients.POST(request('POST', { notes: 'x'.repeat(65536) }))).status).toBe(413);
    expect(mocks.client).not.toHaveBeenCalled();
  });
  it.each([patient.GET, patient.PUT, patient.DELETE, visit.GET, visit.PUT, visit.DELETE])('rejects partial ID parsing (%#)', async handler => {
    expect((await handler(request(), { params: Promise.resolve({ id: '17junk' }) })).status).toBe(400);
    expect(mocks.client).not.toHaveBeenCalled();
  });
});

describe('tenant boundaries', () => {
  it('does not insert a visit when its parent is absent or belongs to another doctor', async () => {
    const db = database({ data: null, error: { code: 'PGRST116' } });
    expect((await visits.POST(request('POST', syntheticVisit))).status).toBe(404);
    expect(db.from).toHaveBeenCalledTimes(1);
    expect(db.from).toHaveBeenCalledWith('patients');
    expect(db.queries[0].eq.mock.calls).toEqual([['id', 17], ['doctor_id', 'synthetic-doctor-a']]);
  });
  it('creates an owned visit with server-selected doctor_id', async () => {
    const db = database({ data: { id: 17 }, error: null }, { data: { id: 31 }, error: null });
    expect((await visits.POST(request('POST', { ...syntheticVisit, doctor_id: 'synthetic-doctor-b' }))).status).toBe(200);
    expect(db.queries[1].insert).toHaveBeenCalledWith(expect.objectContaining({ doctor_id: 'synthetic-doctor-a', patient_id: 17 }));
  });
  it('creates patients with server-selected doctor_id', async () => {
    const db = database({ data: { id: 17 }, error: null });
    expect((await patients.POST(request('POST', { ...syntheticPatient, doctor_id: 'synthetic-doctor-b' }))).status).toBe(201);
    expect(db.queries[0].insert).toHaveBeenCalledWith(expect.objectContaining({ doctor_id: 'synthetic-doctor-a' }));
  });
  it.each([patient.GET, patient.PUT, patient.DELETE])('scopes patient access and returns uniform missing-record errors (%#)', async handler => {
    const db = database({ data: null, error: { code: 'PGRST116' } });
    expect((await handler(request('PUT', syntheticPatient), context)).status).toBe(404);
    expect(db.queries[0].eq).toHaveBeenCalledWith('doctor_id', 'synthetic-doctor-a');
  });
  it.each([visit.GET, visit.PUT, visit.DELETE])('requires both visit and patient ownership (%#)', async handler => {
    const db = database({ data: null, error: { code: 'PGRST116' } });
    expect((await handler(request('PUT', syntheticVisit), context)).status).toBe(404);
    expect(db.queries[0].eq).toHaveBeenCalledWith('doctor_id', 'synthetic-doctor-a');
    expect(db.queries[0].eq).toHaveBeenCalledWith('patients.doctor_id', 'synthetic-doctor-a');
    expect(db.queries[0].select.mock.calls[0][0]).toContain('patients!inner(');
    expect(db.from).toHaveBeenCalledTimes(1);
  });
  it.each([visit.PUT, visit.DELETE])('keeps owner and parent constraints on visit mutations (%#)', async handler => {
    const db = database({ data: { patient_id: 17, payment_status: 'D', payment_method: null }, error: null }, { data: { id: 31 }, error: null });
    expect((await handler(request('PUT', { ...syntheticVisit, patient_id: 99 }), context)).status).toBe(200);
    expect(db.queries[1].eq.mock.calls).toEqual([['id', 17], ['doctor_id', 'synthetic-doctor-a'], ['patient_id', 17]]);
    if (handler === visit.PUT) expect(db.queries[1].update.mock.calls[0][0]).not.toHaveProperty('patient_id');
  });
  it('scopes list results, embedded visits, and count to one filtered query', async () => {
    const db = database({ data: [], error: null, count: 0 });
    expect((await patients.GET(request('GET', undefined, '/api/patients?search=Synthetic'))).status).toBe(200);
    expect(db.from).toHaveBeenCalledTimes(1);
    expect(db.queries[0].eq.mock.calls).toEqual([['doctor_id', 'synthetic-doctor-a'], ['visits.doctor_id', 'synthetic-doctor-a']]);
    expect(db.queries[0].select.mock.calls[0][1]).toEqual({ count: 'exact' });
  });
  it('scopes visit lists and patient search to the doctor', async () => {
    const db = database({ data: [], error: null, count: 0 }, { data: [], error: null });
    expect((await visits.GET(request('GET', undefined, '/api/visits?search=Synthetic'))).status).toBe(200);
    expect(db.queries[0].eq).toHaveBeenCalledWith('doctor_id', 'synthetic-doctor-a');
    expect(db.queries[0].eq).toHaveBeenCalledWith('patients.doctor_id', 'synthetic-doctor-a');
    expect(db.queries[1].eq).toHaveBeenCalledWith('doctor_id', 'synthetic-doctor-a');
  });
});

describe('safe account deletion and failures', () => {
  it('deletes only the authenticated auth user, relying on database cascade', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://synthetic.invalid');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'synthetic-test-key');
    try {
      expect((await profile.DELETE(request('DELETE'))).status).toBe(200);
      expect(mocks.deleteUser).toHaveBeenCalledWith('synthetic-doctor-a');
      expect(mocks.client).not.toHaveBeenCalled();
    } finally { vi.unstubAllEnvs(); }
  });
  it('does not erase doctor records when the admin operation fails', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://synthetic.invalid');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'synthetic-test-key');
    const logger = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.deleteUser.mockResolvedValue({ error: { message: 'synthetic secret detail' } });
    try {
      const response = await profile.DELETE(request('DELETE'));
      expect(response.status).toBe(500);
      expect(await response.text()).not.toContain('synthetic secret detail');
      expect(logger).not.toHaveBeenCalledWith(expect.anything(), expect.anything());
      expect(mocks.client).not.toHaveBeenCalled();
    } finally { logger.mockRestore(); vi.unstubAllEnvs(); }
  });
  it('fails before mutation if account deletion is unconfigured', async () => {
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    const logger = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect((await profile.DELETE(request('DELETE'))).status).toBe(500);
      expect(mocks.adminClient).not.toHaveBeenCalled();
      expect(mocks.client).not.toHaveBeenCalled();
    } finally { logger.mockRestore(); vi.unstubAllEnvs(); }
  });
});
