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
      const session = await browserTracker.createSession();
      expect(session.id).toBeDefined();
      expect(session.browser).toBeDefined();
      expect(session.page).toBeDefined();
    });

    it('should create a headless session when specified', async () => {
      const session = await browserTracker.createSession({ headless: true });
      expect(session.id).toBeDefined();
    });

    it('should apply custom timeout when specified', async () => {
      const customTimeout = 500;
      const session = await browserTracker.createSession({
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
      const session = await browserTracker.createSession();
      await browserTracker.closeSession(session.id);

      expect(() => {
        browserTracker.getSession(session.id);
      }).toThrow(BrowserError);
    });

    it('should throw error when closing non-existent session', async () => {
      await expect(browserTracker.closeSession('invalid-id')).rejects.toThrow(
        new BrowserError('Session not found', BrowserErrorCode.SESSION_ERROR),
      );
    });
  });

  describe('getSession', () => {
    it('should return existing session', async () => {
      const session = await browserTracker.createSession();
      const retrieved = browserTracker.getSession(session.id);
      expect(retrieved.id).toBe(session.id);
    });

    it('should throw error for non-existent session', () => {
      expect(() => {
        browserTracker.getSession('invalid-id');
      }).toThrow(
        new BrowserError('Session not found', BrowserErrorCode.SESSION_ERROR),
      );
    });
  });

  describe('session tracking', () => {
    it('should register and track browser sessions', async () => {
      const instanceId = browserTracker.registerBrowser('https://example.com');
      expect(instanceId).toBeDefined();

      const sessionInfo = browserTracker.getSessionById(instanceId);
      expect(sessionInfo).toBeDefined();
      expect(sessionInfo?.status).toBe('running');
      expect(sessionInfo?.metadata.url).toBe('https://example.com');
    });

    it('should update session status', async () => {
      const instanceId = browserTracker.registerBrowser();
      const updated = browserTracker.updateSessionStatus(
        instanceId,
        SessionStatus.COMPLETED,
        {
          closedExplicitly: true,
        },
      );

      expect(updated).toBe(true);

      const sessionInfo = browserTracker.getSessionById(instanceId);
      expect(sessionInfo?.status).toBe('completed');
      expect(sessionInfo?.metadata.closedExplicitly).toBe(true);
    });
  });
});
