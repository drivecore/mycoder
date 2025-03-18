import { chromium } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

import {
  browserSessions,
  BrowserConfig,
  Session,
  BrowserError,
  BrowserErrorCode,
} from './lib/types.js';

// Status of a browser session
export enum SessionStatus {
  RUNNING = 'running',
  COMPLETED = 'completed',
  ERROR = 'error',
  TERMINATED = 'terminated',
}

export interface SessionInfo {
  id: string;
  status: SessionStatus;
  startTime: Date;
  endTime?: Date;
  metadata: {
    url?: string;
    contentLength?: number;
    closedExplicitly?: boolean;
    error?: string;
    actionType?: string;
    closedByCleanup?: boolean;
  };
}

/**
 * Registry to keep track of browser sessions
 */
export class SessionTracker {
  private sessions: Map<string, SessionInfo> = new Map();
  private readonly defaultConfig: BrowserConfig = {
    headless: true,
    defaultTimeout: 30000,
  };

  constructor(public ownerAgentId: string | undefined) {
    // Store a reference to the instance globally for cleanup
    // This allows the CLI to access the instance for cleanup
    (globalThis as Record<string, unknown>).__BROWSER_MANAGER__ = this;

    // Set up cleanup handlers for graceful shutdown
    this.setupGlobalCleanup();
  }

  // Register a new browser session
  registerBrowser(url?: string): string {
    const id = uuidv4();
    this.sessions.set(id, {
      id,
      status: SessionStatus.RUNNING,
      startTime: new Date(),
      metadata: {
        url: url || 'about:blank',
      },
    });
    return id;
  }

  // Update the status of a session
  updateSessionStatus(
    id: string,
    status: SessionStatus,
    metadata?: Record<string, unknown>,
  ): boolean {
    const session = this.sessions.get(id);
    if (!session) return false;

    session.status = status;

    // If the session is no longer running, set the end time
    if (status !== SessionStatus.RUNNING) {
      session.endTime = new Date();
    }

    // Update metadata if provided
    if (metadata) {
      session.metadata = { ...session.metadata, ...metadata };
    }

    return true;
  }

  // Get all sessions
  getSessions(): SessionInfo[] {
    return Array.from(this.sessions.values());
  }

  // Get a session by ID
  getSessionById(id: string): SessionInfo | undefined {
    return this.sessions.get(id);
  }

  // Get sessions by status
  getSessionsByStatus(status: SessionStatus): SessionInfo[] {
    return this.getSessions().filter((session) => session.status === status);
  }

  /**
   * Creates a new browser session
   * @param config Optional browser configuration
   * @returns A promise that resolves to a browser session
   */
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
      page.setDefaultTimeout(sessionConfig.defaultTimeout ?? 30000);

      const id = this.registerBrowser();

      const session: Session = {
        browser,
        page,
        id,
      };

      browserSessions.set(id, session);
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

  /**
   * Closes a browser session by ID
   * @param sessionId The ID of the session to close
   */
  async closeSession(sessionId: string): Promise<void> {
    const session = browserSessions.get(sessionId);
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
      browserSessions.delete(sessionId);

      // Update session status
      this.updateSessionStatus(sessionId, SessionStatus.COMPLETED, {
        closedExplicitly: true,
      });
    } catch (error) {
      throw new BrowserError(
        'Failed to close session',
        BrowserErrorCode.SESSION_ERROR,
        error,
      );
    }
  }

  /**
   * Gets a browser session by ID
   * @param sessionId The ID of the session to get
   * @returns The browser session
   */
  getSession(sessionId: string): Session {
    const session = browserSessions.get(sessionId);
    if (!session) {
      throw new BrowserError(
        'Session not found',
        BrowserErrorCode.SESSION_ERROR,
      );
    }
    return session;
  }

  /**
   * Cleans up all browser sessions associated with this tracker
   * @returns A promise that resolves when cleanup is complete
   */
  async cleanup(): Promise<void> {
    const cleanupPromises = Array.from(this.sessions.values()).map((session) =>
      this.cleanupSession(session),
    );
    await Promise.all(cleanupPromises);
  }

  /**
   * Cleans up a browser session
   * @param session The browser session to clean up
   */
  private async cleanupSession(session: SessionInfo): Promise<void> {
    // Only clean up running sessions
    if (session.status !== SessionStatus.RUNNING) return;

    const browserSession = browserSessions.get(session.id);
    if (!browserSession) return;

    try {
      // Close the browser session
      await browserSession.page.context().close();
      await browserSession.browser.close();
      browserSessions.delete(session.id);

      // Update session status
      this.updateSessionStatus(session.id, SessionStatus.TERMINATED, {
        closedByCleanup: true,
      });
    } catch {
      // Ignore errors during cleanup
    }
  }

  /**
   * Closes all browser sessions
   * @returns A promise that resolves when all sessions are closed
   */
  async closeAllSessions(): Promise<void> {
    const closePromises = Array.from(this.sessions.keys())
      .filter(
        (sessionId) =>
          this.sessions.get(sessionId)?.status === SessionStatus.RUNNING,
      )
      .map((sessionId) => this.closeSession(sessionId).catch(() => {}));
    await Promise.all(closePromises);
  }

  /**
   * Sets up cleanup handlers for a browser session
   * @param session The browser session to set up cleanup handlers for
   */
  private setupCleanup(session: Session): void {
    // Handle browser disconnection
    session.browser.on('disconnected', () => {
      browserSessions.delete(session.id);
      this.updateSessionStatus(session.id, SessionStatus.TERMINATED);
    });
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
      for (const sessionId of browserSessions.keys()) {
        try {
          const session = browserSessions.get(sessionId);
          if (session) {
            // Attempt synchronous close - may not fully work
            session.browser.close();
          }
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
}
