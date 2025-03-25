import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
} from 'vitest';

import { MockLogger } from '../../../utils/mockLogger.js';
import { SessionTracker } from '../SessionTracker.js';

import type { Page } from '@playwright/test';

// Set global timeout for all tests in this file
vi.setConfig({ testTimeout: 15000 });

describe('Wait Behavior Tests', () => {
  let browserManager: SessionTracker;
  let sessionId: string;
  let page: Page;
  const baseUrl = 'https://the-internet.herokuapp.com';

  beforeAll(async () => {
    browserManager = new SessionTracker('test-agent', new MockLogger());
    sessionId = await browserManager.createSession({ headless: true });
    page = browserManager.getSessionPage(sessionId);
  });

  afterAll(async () => {
    await browserManager.closeAllSessions();
  });

  describe('Dynamic Loading Tests', () => {
    beforeEach(async () => {
      await page.goto(`${baseUrl}/dynamic_loading/2`);
    });

    it('should handle dynamic loading with explicit waits', async () => {
      await page.click('button');

      // Wait for loading element to appear and then disappear
      await page.waitForSelector('#loading');
      await page.waitForSelector('#loading', { state: 'hidden' });

      const finishElement = await page.waitForSelector('#finish');
      const finishText = await finishElement?.evaluate((el) => el.textContent);
      expect(finishText).toBe('Hello World!');
    });

    it('should timeout on excessive wait times', async () => {
      await page.click('button');

      // Attempt to find a non-existent element with short timeout
      try {
        await page.waitForSelector('#nonexistent', { timeout: 1000 });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error.message).toContain('Timeout');
      }
    });
  });

  describe('Dynamic Controls Tests', () => {
    beforeEach(async () => {
      await page.goto(`${baseUrl}/dynamic_controls`);
    });

    it('should wait for element state changes', async () => {
      // Click remove button
      await page.click('button:has-text("Remove")');

      // Wait for checkbox to be removed
      await page.waitForSelector('#checkbox', { state: 'hidden' });

      // Verify gone message
      const message = await page.waitForSelector('#message');
      const messageText = await message?.evaluate((el) => el.textContent);
      expect(messageText).toContain("It's gone!");
    });

    it('should handle multiple sequential dynamic changes', async () => {
      // Remove checkbox
      await page.click('button:has-text("Remove")');
      await page.waitForSelector('#checkbox', { state: 'hidden' });

      // Add checkbox back
      await page.click('button:has-text("Add")');
      await page.waitForSelector('#checkbox');

      // Verify checkbox is present
      const checkbox = await page.$('#checkbox');
      expect(checkbox).toBeTruthy();
    });
  });
});