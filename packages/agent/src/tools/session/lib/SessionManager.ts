import { chromium } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

import {
  BrowserConfig,
  Session,
  BrowserError,
  BrowserErrorCode,
} from './types.js';

export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private readonly defaultConfig: BrowserConfig = {
    headless: true,
    defaultTimeout: 30000,
  };

  constructor() {
    // Store a reference to the instance globally for cleanup
    // This allows the CLI to access the instance for cleanup
    (globalThis as any).__BROWSER_MANAGER__ = this;

    // Set up cleanup handlers for graceful shutdown
    this.setupGlobalCleanup();
  }

  async createSession(config?: BrowserConfig): Promise<Session> {
    try {
      const sessionConfig = { ...this.defaultConfig, ...config };
      const browser = await chromium.launch({
        headless: sessionConfig.headless,
      });

      // Create a new context (equivalent to Puppeteer's incognito context)
      const context = await browser.newContext({
        viewport: null,
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      });

      const page = await context.newPage();
      page.setDefaultTimeout(sessionConfig.defaultTimeout ?? 1000);

      const session: Session = {
        browser,
        page,
        id: uuidv4(),
      };

      this.sessions.set(session.id, session);
      this.setupCleanup(session);

      return session;
    } catch (error) {
      throw new BrowserError(
        'Failed to create browser session',
        BrowserErrorCode.LAUNCH_FAILED,
        error,
      );
    }
  }

  async closeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new BrowserError(
        'Session not found',
        BrowserErrorCode.SESSION_ERROR,
      );
    }

    try {
      // In Playwright, we should close the context which will automatically close its pages
      await session.page.context().close();
      await session.browser.close();
      this.sessions.delete(sessionId);
    } catch (error) {
      throw new BrowserError(
        'Failed to close session',
        BrowserErrorCode.SESSION_ERROR,
        error,
      );
    }
  }

  private setupCleanup(session: Session): void {
    // Handle browser disconnection
    session.browser.on('disconnected', () => {
      this.sessions.delete(session.id);
    });

    // No need to add individual process handlers for each session
    // We'll handle all sessions in the global cleanup
  }

  /**
   * Sets up global cleanup handlers for all browser sessions
   */
  private setupGlobalCleanup(): void {
    // Use beforeExit for async cleanup
    process.on('beforeExit', () => {
      this.closeAllSessions().catch((err) => {
        console.error('Error closing browser sessions:', err);
      });
    });

    // Use exit for synchronous cleanup (as a fallback)
    process.on('exit', () => {
      // Can only do synchronous operations here
      for (const session of this.sessions.values()) {
        try {
          // Attempt synchronous close - may not fully work
          session.browser.close();
          // eslint-disable-next-line unused-imports/no-unused-vars
        } catch (e) {
          // Ignore errors during exit
        }
      }
    });

    // Handle SIGINT (Ctrl+C)
    process.on('SIGINT', () => {
      // eslint-disable-next-line promise/catch-or-return
      this.closeAllSessions()
        .catch(() => {
          return false;
        })
        .finally(() => {
          // Give a moment for cleanup to complete
          setTimeout(() => process.exit(0), 500);
        });
    });
  }

  async closeAllSessions(): Promise<void> {
    const closePromises = Array.from(this.sessions.keys()).map((sessionId) =>
      this.closeSession(sessionId).catch(() => {}),
    );
    await Promise.all(closePromises);
  }

  getSession(sessionId: string): Session {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new BrowserError(
        'Session not found',
        BrowserErrorCode.SESSION_ERROR,
      );
    }
    return session;
  }
}
