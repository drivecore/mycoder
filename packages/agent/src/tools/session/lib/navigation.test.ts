import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

import { MockLogger } from '../../../utils/mockLogger.js';
import { SessionTracker } from '../SessionTracker.js';

import type { Page } from '@playwright/test';

// Set global timeout for all tests in this file
vi.setConfig({ testTimeout: 15000 });

describe('Browser Navigation Tests', () => {
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

  it('should navigate to main page and verify content', async () => {
    await page.goto(baseUrl);
    const title = await page.title();
    expect(title).toBe('The Internet');

    const headerText = await page.$eval('h1.heading', (el) => el.textContent);
    expect(headerText).toBe('Welcome to the-internet');
  });

  it('should navigate to login page and verify title', async () => {
    await page.goto(`${baseUrl}/login`);
    const title = await page.title();
    expect(title).toBe('The Internet');

    const headerText = await page.$eval('h2', (el) => el.textContent);
    expect(headerText).toBe('Login Page');
  });

  it('should handle 404 pages appropriately', async () => {
    await page.goto(`${baseUrl}/nonexistent`);

    // Wait for the page to stabilize
    await page.waitForLoadState('networkidle');

    // Check for 404 content instead of title since title may vary
    const bodyText = await page.$eval('body', (el) => el.textContent);
    expect(bodyText).toContain('Not Found');
  });

  it('should handle navigation timeouts', async () => {
    await expect(
      page.goto(`${baseUrl}/slow`, { timeout: 1 }),
    ).rejects.toThrow();
  });

  it('should wait for network idle', async () => {
    await page.goto(baseUrl, {
      waitUntil: 'networkidle',
    });
    expect(page.url()).toBe(`${baseUrl}/`);
  });
});
