import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { MockLogger } from '../../../utils/mockLogger.js';
import { SessionTracker, SessionStatus } from '../SessionTracker.js';

import { BrowserError, BrowserErrorCode } from './types.js';

describe('SessionTracker', () => {
  let browserTracker: SessionTracker;
  const mockLogger = new MockLogger();

  beforeEach(() => {
    browserTracker = new SessionTracker('test-agent', mockLogger);
  });

  afterEach(async () => {
    await browserTracker.closeAllSessions();
  });

  describe('createSession', () => {
    it('should create a new browser session', async () => {
      const sessionId = await browserTracker.createSession();
      expect(sessionId).toBeDefined();

      const sessionInfo = browserTracker.getSessionById(sessionId);
      expect(sessionInfo).toBeDefined();
      expect(sessionInfo?.page).toBeDefined();
    });

    it('should create a headless session when specified', async () => {
      const sessionId = await browserTracker.createSession({ headless: true });
      expect(sessionId).toBeDefined();

      const sessionInfo = browserTracker.getSessionById(sessionId);
      expect(sessionInfo).toBeDefined();
    });

    it('should apply custom timeout when specified', async () => {
      const customTimeout = 500;
      const sessionId = await browserTracker.createSession({
        defaultTimeout: customTimeout,
      });

      const page = browserTracker.getSessionPage(sessionId);

      // Verify timeout by attempting to wait for a non-existent element
      try {
        await page.waitForSelector('#nonexistent', {
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
      const sessionId = await browserTracker.createSession();
      await browserTracker.closeSession(sessionId);

      const sessionInfo = browserTracker.getSessionById(sessionId);
      expect(sessionInfo?.status).toBe(SessionStatus.COMPLETED);
      expect(sessionInfo?.page).toBeUndefined();
    });

    it('should throw error when closing non-existent session', async () => {
      await expect(browserTracker.closeSession('invalid-id')).rejects.toThrow(
        new BrowserError('Session not found', BrowserErrorCode.SESSION_ERROR),
      );
    });
  });

  describe('getSessionPage', () => {
    it('should return page for existing session', async () => {
      const sessionId = await browserTracker.createSession();
      const page = browserTracker.getSessionPage(sessionId);
      expect(page).toBeDefined();
    });

    it('should throw error for non-existent session', () => {
      expect(() => {
        browserTracker.getSessionPage('invalid-id');
      }).toThrow(
        new BrowserError('Session not found', BrowserErrorCode.SESSION_ERROR),
      );
    });
  });
});
