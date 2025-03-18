import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { SessionManager } from './SessionManager.js';
import { BrowserError, BrowserErrorCode } from './types.js';

describe('SessionManager', () => {
  let browserManager: SessionManager;

  beforeEach(() => {
    browserManager = new SessionManager();
  });

  afterEach(async () => {
    await browserManager.closeAllSessions();
  });

  describe('createSession', () => {
    it('should create a new browser session', async () => {
      const session = await browserManager.createSession();
      expect(session.id).toBeDefined();
      expect(session.browser).toBeDefined();
      expect(session.page).toBeDefined();
    });

    it('should create a headless session when specified', async () => {
      const session = await browserManager.createSession({ headless: true });
      expect(session.id).toBeDefined();
    });

    it('should apply custom timeout when specified', async () => {
      const customTimeout = 500;
      const session = await browserManager.createSession({
        defaultTimeout: customTimeout,
      });
      // Verify timeout by attempting to wait for a non-existent element
      try {
        await session.page.waitForSelector('#nonexistent', {
          timeout: customTimeout - 100,
        });
      } catch (error: any) {
        expect(error.message).toContain('imeout');
        expect(error.message).toContain(`${customTimeout - 100}`);
      }
    });
  });

  describe('closeSession', () => {
    it('should close an existing session', async () => {
      const session = await browserManager.createSession();
      await browserManager.closeSession(session.id);

      expect(() => {
        browserManager.getSession(session.id);
      }).toThrow(BrowserError);
    });

    it('should throw error when closing non-existent session', async () => {
      await expect(browserManager.closeSession('invalid-id')).rejects.toThrow(
        new BrowserError('Session not found', BrowserErrorCode.SESSION_ERROR),
      );
    });
  });

  describe('getSession', () => {
    it('should return existing session', async () => {
      const session = await browserManager.createSession();
      const retrieved = browserManager.getSession(session.id);
      expect(retrieved).toBe(session);
    });

    it('should throw error for non-existent session', () => {
      expect(() => {
        browserManager.getSession('invalid-id');
      }).toThrow(
        new BrowserError('Session not found', BrowserErrorCode.SESSION_ERROR),
      );
    });
  });
});
