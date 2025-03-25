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

describe('Form Interaction Tests', () => {
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

  beforeEach(async () => {
    await page.goto(`${baseUrl}/login`);
  });

  it('should handle login form with invalid credentials', async () => {
    await page.type('#username', 'invalid_user');
    await page.type('#password', 'invalid_pass');
    await page.click('button[type="submit"]');

    const flashMessage = await page.waitForSelector('#flash');
    const messageText = await flashMessage?.evaluate((el) => el.textContent);
    expect(messageText).toContain('Your username is invalid!');
  });

  it('should clear form fields between attempts', async () => {
    await page.type('#username', 'test_user');
    await page.type('#password', 'test_pass');

    // Clear fields
    await page.$eval(
      '#username',
      (el) => ((el as HTMLInputElement).value = ''),
    );
    await page.$eval(
      '#password',
      (el) => ((el as HTMLInputElement).value = ''),
    );

    // Verify fields are empty
    const username = await page.$eval(
      '#username',
      (el) => (el as HTMLInputElement).value,
    );
    const password = await page.$eval(
      '#password',
      (el) => (el as HTMLInputElement).value,
    );
    expect(username).toBe('');
    expect(password).toBe('');
  });

  it('should maintain form state after page refresh', async () => {
    const testUsername = 'persistence_test';
    await page.type('#username', testUsername);
    await page.reload();

    // Form should be cleared after refresh
    const username = await page.$eval(
      '#username',
      (el) => (el as HTMLInputElement).value,
    );
    expect(username).toBe('');
  });

  describe('Content Extraction', () => {
    it('should extract form labels and placeholders', async () => {
      const usernameLabel = await page.$eval(
        'label[for="username"]',
        (el) => el.textContent,
      );
      expect(usernameLabel).toBe('Username');

      const passwordPlaceholder = await page.$eval(
        '#password',
        (el) => (el as HTMLInputElement).placeholder,
      );
      expect(passwordPlaceholder).toBe('');
    });
  });
});
