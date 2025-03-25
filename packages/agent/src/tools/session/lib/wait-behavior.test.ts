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

import { Session } from './types.js';

// Set global timeout for all tests in this file
vi.setConfig({ testTimeout: 15000 });

describe('Wait Behavior Tests', () => {
  let browserManager: SessionTracker;
  let session: Session;
  const baseUrl = 'https://the-internet.herokuapp.com';

  beforeAll(async () => {
    browserManager = new SessionTracker('test-agent', new MockLogger());
    session = await browserManager.createSession({ headless: true });
  });

  afterAll(async () => {
    await browserManager.closeAllSessions();
  });

  describe('Dynamic Loading Tests', () => {
    beforeEach(async () => {
      await session.page.goto(`${baseUrl}/dynamic_loading/2`);
    });

    it('should handle dynamic loading with explicit waits', async () => {
      await session.page.click('button');

      // Wait for loading element to appear and then disappear
      await session.page.waitForSelector('#loading');
      await session.page.waitForSelector('#loading', { state: 'hidden' });

      const finishElement = await session.page.waitForSelector('#finish');
      const finishText = await finishElement?.evaluate((el) => el.textContent);
      expect(finishText).toBe('Hello World!');
    });

    it('should timeout on excessive wait times', async () => {
      await session.page.click('button');

      // Attempt to find a non-existent element with short timeout
      try {
        await session.page.waitForSelector('#nonexistent', { timeout: 1000 });
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.message).toContain('Timeout');
      }
    });
  });

  describe('Dynamic Controls Tests', () => {
    beforeEach(async () => {
      await session.page.goto(`${baseUrl}/dynamic_controls`);
    });

    it('should wait for element state changes', async () => {
      // Click remove button
      await session.page.click('button:has-text("Remove")');

      // Wait for checkbox to be removed
      await session.page.waitForSelector('#checkbox', { state: 'hidden' });

      // Verify gone message
      const message = await session.page.waitForSelector('#message');
      const messageText = await message?.evaluate((el) => el.textContent);
      expect(messageText).toContain("It's gone!");
    });

    it('should handle multiple sequential dynamic changes', async () => {
      // Remove checkbox
      await session.page.click('button:has-text("Remove")');
      await session.page.waitForSelector('#checkbox', { state: 'hidden' });

      // Add checkbox back
      await session.page.click('button:has-text("Add")');
      await session.page.waitForSelector('#checkbox');

      // Verify checkbox is present
      const checkbox = await session.page.$('#checkbox');
      expect(checkbox).toBeTruthy();
    });
  });
});
