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

describe('Form Interaction Tests', () => {
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

  beforeEach(async () => {
    await session.page.goto(`${baseUrl}/login`);
  });

  it('should handle login form with invalid credentials', async () => {
    await session.page.type('#username', 'invalid_user');
    await session.page.type('#password', 'invalid_pass');
    await session.page.click('button[type="submit"]');

    const flashMessage = await session.page.waitForSelector('#flash');
    const messageText = await flashMessage?.evaluate((el) => el.textContent);
    expect(messageText).toContain('Your username is invalid!');
  });

  it('should clear form fields between attempts', async () => {
    await session.page.type('#username', 'test_user');
    await session.page.type('#password', 'test_pass');

    // Clear fields
    await session.page.$eval(
      '#username',
      (el) => ((el as HTMLInputElement).value = ''),
    );
    await session.page.$eval(
      '#password',
      (el) => ((el as HTMLInputElement).value = ''),
    );

    // Verify fields are empty
    const username = await session.page.$eval(
      '#username',
      (el) => (el as HTMLInputElement).value,
    );
    const password = await session.page.$eval(
      '#password',
      (el) => (el as HTMLInputElement).value,
    );
    expect(username).toBe('');
    expect(password).toBe('');
  });

  it('should maintain form state after page refresh', async () => {
    const testUsername = 'persistence_test';
    await session.page.type('#username', testUsername);
    await session.page.reload();

    // Form should be cleared after refresh
    const username = await session.page.$eval(
      '#username',
      (el) => (el as HTMLInputElement).value,
    );
    expect(username).toBe('');
  });

  describe('Content Extraction', () => {
    it('should extract form labels and placeholders', async () => {
      const usernameLabel = await session.page.$eval(
        'label[for="username"]',
        (el) => el.textContent,
      );
      expect(usernameLabel).toBe('Username');

      const passwordPlaceholder = await session.page.$eval(
        '#password',
        (el) => (el as HTMLInputElement).placeholder,
      );
      expect(passwordPlaceholder).toBe('');
    });
  });
});
