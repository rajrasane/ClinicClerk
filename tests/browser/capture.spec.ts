import { test, expect } from '@playwright/test';
import { syntheticBrowser, capture, noHorizontalOverflow } from './synthetic';

test('public landing and authentication pages fit viewport', async ({ page }, info) => {
  const unexpected = await syntheticBrowser(page);
  for (const route of ['/landing', '/login', '/signup']) {
    await page.goto(route);
    await expect(page.locator('body')).toContainText(/ClinicClerk|Welcome|Create/);
    await page.evaluate(() => document.fonts.ready);
    await capture(page, info, route.slice(1));
    await noHorizontalOverflow(page);
  }
  expect(unexpected).toEqual([]);
});

test('synthetic patient and visit dashboard and forms fit viewport', async ({ page }, info) => {
  const unexpected = await syntheticBrowser(page, true);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Patient Management' })).toBeVisible();
  await expect(page.getByText('Alex Example').first()).toBeVisible();
  await capture(page, info, 'patients');
  await noHorizontalOverflow(page);
  await page.getByRole('button', { name: 'Add Patient', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await capture(page, info, 'add-patient');
  await noHorizontalOverflow(page);
  await page.getByRole('button', { name: 'Close modal', exact: true }).click();
  await page.getByRole('button', { name: 'Visits', exact: true }).click();
  await expect(page.getByText('Synthetic routine checkup').filter({ visible: true })).toBeVisible();
  if (info.project.name === 'desktop') {
    const edit = await page.getByTitle('Edit Visit', { exact: true }).boundingBox();
    const remove = await page.getByTitle('Delete Visit', { exact: true }).boundingBox();
    expect(edit).not.toBeNull();
    expect(remove).not.toBeNull();
    expect(Math.abs(edit!.y - remove!.y)).toBeLessThanOrEqual(1);
  }
  await capture(page, info, 'visits');
  await noHorizontalOverflow(page);
  await page.getByRole('button', { name: 'Add Visit', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await capture(page, info, 'add-visit');
  await noHorizontalOverflow(page);
  expect(unexpected).toEqual([]);
});
