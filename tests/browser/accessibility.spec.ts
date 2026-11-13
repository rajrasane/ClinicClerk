import { test, expect } from '@playwright/test';
import { syntheticBrowser, noHorizontalOverflow } from './synthetic';

test('password visibility is keyboard operable and labelled', async ({ page }) => {
  const unexpected = await syntheticBrowser(page);
  for (const route of ['/login', '/signup']) {
    await page.goto(route);
    const password = page.getByLabel(/^Password\s*\*?$/);
    await password.fill('Synthetic-test-password-42!');
    await expect(password).toHaveAttribute('type', 'password');
    await password.press('Tab');
    const show = page.getByRole('button', { name: 'Show password' });
    await expect(show).toBeFocused();
    await expect(show).toHaveAttribute('aria-pressed', 'false');
    await expect(show).toHaveCSS('outline-style', 'solid');
    await show.press('Enter');
    await expect(password).toHaveAttribute('type', 'text');
    const hide = page.getByRole('button', { name: 'Hide password' });
    await expect(hide).toHaveAttribute('aria-pressed', 'true');
    await hide.press('Enter');
    await expect(password).toHaveAttribute('type', 'password');
    await noHorizontalOverflow(page);
  }
  expect(unexpected).toEqual([]);
});

test('record navigation, search, dates, and patient validation expose accessible states', async ({ page }) => {
  const unexpected = await syntheticBrowser(page, true);
  await page.goto('/');
  const patients = page.getByRole('button', { name: 'Patients', exact: true });
  const visits = page.getByRole('button', { name: 'Visits', exact: true });
  await expect(patients).toHaveAttribute('aria-pressed', 'true');
  await expect(visits).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('table', { name: 'Patients', exact: true })).toBeVisible();
  const search = page.getByRole('textbox', { name: 'Search patients' });
  await search.fill('Missing synthetic patient');
  await expect(page.getByText('Alex Example').filter({ visible: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Clear search', exact: true }).click();
  await expect(search).toHaveValue('');
  await expect(page.getByText('Alex Example').filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Edit patient', exact: true })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Delete patient', exact: true })).toHaveCount(1);

  await page.getByRole('button', { name: 'Add Patient', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Add New Patient' });
  await expect.poll(() => dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
  await expect(dialog.getByRole('button', { name: 'Next', exact: true })).toBeDisabled();
  const firstName = dialog.getByRole('textbox', { name: 'First Name' });
  await expect(firstName).toHaveAttribute('aria-required', 'true');
  await firstName.fill('Alex');
  await firstName.fill('');
  await firstName.press('Tab');
  await expect(firstName).toHaveAttribute('aria-invalid', 'true');
  const errorId = await firstName.getAttribute('aria-describedby');
  expect(errorId).toBeTruthy();
  await expect(dialog.locator(`[id="${errorId}"]`)).toHaveText('This field is required');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);

  await visits.focus();
  await page.keyboard.press('Enter');
  await expect(visits).toHaveAttribute('aria-pressed', 'true');
  await expect(patients).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('table', { name: 'Visits', exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Search visits' })).toBeVisible();
  const filter = page.getByRole('button', { name: 'Filter visits by date' });
  await expect(filter).toHaveAttribute('aria-expanded', 'false');
  await filter.click();
  await expect(filter).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('button', { name: 'Start date', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'End date', exact: true })).toBeDisabled();
  await noHorizontalOverflow(page);
  expect(unexpected).toEqual([]);
});

test('existing-patient visit steps retain accessible clinical and payment labels', async ({ page }) => {
  const unexpected = await syntheticBrowser(page, true);
  await page.goto('/');
  await page.getByRole('button', { name: 'Visits', exact: true }).click();
  await page.getByRole('button', { name: 'Add Visit', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect.poll(() => dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
  await dialog.getByRole('button', { name: 'Existing Patient', exact: true }).click();
  await dialog.getByRole('button', { name: 'Next', exact: true }).click();
  const patientSearch = dialog.getByRole('textbox', { name: 'Search Patient' });
  await patientSearch.fill('Alex');
  const patientOption = dialog.getByRole('button', { name: 'Alex Example - 9999990001', exact: true });
  await expect(patientOption).toBeVisible();
  await patientSearch.press('Tab');
  await expect(patientOption).toBeFocused();
  await patientOption.press('Enter');
  await expect(patientOption).toHaveAttribute('aria-pressed', 'true');
  await expect(dialog.getByLabel('Visit Date', { exact: false })).toBeVisible();
  await dialog.getByRole('button', { name: 'Next', exact: true }).click();
  await dialog.getByLabel('Chief Complaint', { exact: false }).fill('Synthetic checkup');
  await expect(dialog.getByLabel('Symptoms', { exact: true })).toBeVisible();
  await expect(dialog.getByLabel('Diagnosis', { exact: true })).toBeVisible();
  await expect(dialog.getByLabel('Prescription', { exact: false })).toBeVisible();
  await dialog.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(dialog.getByLabel('Notes', { exact: false })).toBeVisible();
  await dialog.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(dialog.getByLabel('Consultation Fee', { exact: false })).toBeVisible();
  await expect(dialog.getByLabel('Payment Status', { exact: true })).toBeVisible();
  await expect(dialog.getByLabel('Payment Method', { exact: true })).toBeVisible();
  await noHorizontalOverflow(page);
  expect(unexpected).toEqual([]);
});


test('add and edit dialogs contain keyboard focus and restore their triggers', async ({ page }) => {
  const unexpected = await syntheticBrowser(page, true);
  await page.goto('/');
  await expect(page.getByText('Alex Example').filter({ visible: true }).first()).toBeVisible();
  const flows = [
    { trigger: 'Add Patient', dialog: 'Add New Patient' },
    { trigger: 'Edit patient', dialog: 'Edit Patient' },
  ];
  for (const flow of flows) {
    const trigger = page.getByRole('button', { name: flow.trigger, exact: true });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: flow.dialog, exact: true });
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect.poll(() => dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
    const enabled = dialog.locator('button:visible:enabled, input:visible:enabled, select:visible:enabled, textarea:visible:enabled, a[href]:visible');
    await enabled.first().focus();
    await page.keyboard.press('Shift+Tab');
    await expect(enabled.last()).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(enabled.first()).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
  }
  await page.getByRole('button', { name: 'Visits', exact: true }).click();
  await expect(page.getByText('Alex Example').filter({ visible: true }).first()).toBeVisible();
  const editVisit = page.getByRole('button', { name: 'Edit visit', exact: true });
  await editVisit.click();
  const dialog = page.getByRole('dialog', { name: 'Edit Visit', exact: true });
  await expect(dialog).toHaveAttribute('aria-modal', 'true');
  await expect.poll(() => dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
  const visitDate = dialog.getByLabel('Visit Date', { exact: false });
  await visitDate.click();
  await expect(visitDate).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(visitDate).toHaveAttribute('aria-expanded', 'false');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(editVisit).toBeFocused();
  expect(unexpected).toEqual([]);
});
