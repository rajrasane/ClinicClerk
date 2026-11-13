import { expect, type Page, type TestInfo } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

export const patient = {
  id: 101, first_name: 'Alex', middle_name: '', last_name: 'Example', age: 34,
  gender: 'O', phone: '9999990001', address: '123 Synthetic Street', blood_group: 'O+',
  allergies: 'None recorded', emergency_contact: '9999990002', visit_count: 1,
  created_at: '2026-01-10T10:00:00Z', updated_at: '2026-01-10T10:00:00Z',
};
export const visit = {
  id: 201, patient_id: patient.id, first_name: patient.first_name, last_name: patient.last_name,
  phone: patient.phone, age: patient.age, gender: patient.gender, visit_date: '2026-11-10',
  chief_complaint: 'Synthetic routine checkup', symptoms: 'Synthetic example only', diagnosis: 'Routine review',
  prescription: 'Synthetic instructions', notes: 'Test fixture; not medical advice', follow_up_date: '2026-12-10',
  vitals: { blood_pressure: '120/80' }, consultation_fee: 500, payment_status: 'P', payment_method: 'C',
  created_at: '2026-11-10T10:00:00Z', updated_at: '2026-11-10T10:00:00Z',
};
const doctor = {
  id: '11111111-1111-4111-8111-111111111111', first_name: 'Taylor', last_name: 'Example',
  email: 'doctor@example.test', clinic_name: 'Synthetic Test Clinic', clinic_address: 'Example Street', phone: '9999990000',
};
const pagination = { currentPage: 1, totalPages: 1, totalCount: 1, hasNext: false, hasPrev: false };

/** Install before navigation. No nonlocal request or unmocked API reaches a server. */
export async function syntheticBrowser(page: Page, authenticated = false) {
  const unexpected: string[] = [];
  page.on('pageerror', error => unexpected.push(`Uncaught browser error: ${error.message}`));
  await page.context().routeWebSocket('**/*', socket => {
    const url = new URL(socket.url());
    unexpected.push(`WebSocket ${url.origin}${url.pathname}`);
    socket.close();
  });
  await page.context().route('**/*', async route => {
    const url = new URL(route.request().url());
    const respond = (body: unknown) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    if (url.origin === 'https://synthetic.supabase.co' && url.pathname === '/rest/v1/doctors') return respond(doctor);
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if (local && url.pathname.startsWith('/api/patients')) {
      if (route.request().method() !== 'GET') return respond({ success: true, data: { ...patient, ...route.request().postDataJSON() } });
      const rows = !url.searchParams.get('search') || 'alex example 9999990001'.includes(url.searchParams.get('search')!.toLowerCase()) ? [patient] : [];
      return respond({ success: true, data: rows, pagination: { ...pagination, totalCount: rows.length } });
    }
    if (local && url.pathname.startsWith('/api/visits')) return respond({ success: true, data: [visit], pagination });
    if (local && !url.pathname.startsWith('/api/')) return route.continue();
    unexpected.push(`${route.request().method()} ${url.origin}${url.pathname}`);
    return route.abort('blockedbyclient');
  });
  if (authenticated) {
    await page.addInitScript(({ doctor }) => {
      localStorage.setItem('sb-synthetic-auth-token', JSON.stringify({
        access_token: 'synthetic-access-token', refresh_token: 'synthetic-refresh-token', token_type: 'bearer',
        expires_in: 36000, expires_at: Math.floor(Date.now() / 1000) + 36000,
        user: { id: doctor.id, aud: 'authenticated', role: 'authenticated', email: doctor.email,
          app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' },
      }));
    }, { doctor });
  }
  return unexpected;
}

export async function noHorizontalOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
}
export async function capture(page: Page, info: TestInfo, name: string) {
  const directory = process.env.SCREENSHOT_DIR;
  if (!directory) return;
  await mkdir(directory, { recursive: true });
  if (name === 'landing') {
    // Full-page screenshots do not trigger offscreen IntersectionObservers.
    // Visit each section so the existing scroll-reveal content is represented.
    for (const section of await page.locator('section').all()) {
      await section.scrollIntoViewIfNeeded();
      await expect.poll(() => section.locator('[style]').evaluateAll(elements =>
        elements.every(element => !(element as HTMLElement).style.opacity
          || Number((element as HTMLElement).style.opacity) === 1))).toBe(true);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
  }
  // Framer Motion uses JS-driven opacity; screenshot animations:disabled alone
  // does not wait for it. Require the dialog and its overlay to settle.
  const dialog = page.getByRole('dialog');
  if (await dialog.count()) {
    await expect(dialog).toHaveCSS('opacity', '1');
    await expect(dialog.locator('..')).toHaveCSS('opacity', '1');
  }
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(directory, `${process.env.SCREENSHOT_PREFIX || 'final'}-${info.project.name}-${name}.png`), fullPage: true, animations: 'disabled' });
}
