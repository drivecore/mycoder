import { chromium, firefox, webkit } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

import { Logger } from '../../utils/logger.js';

import { BrowserInfo } from './lib/browserDetectors.js';
import {
  BrowserConfig,
  Session,
  BrowserError,
  BrowserErrorCode,
  browserSessions,
} from './lib/types.js';

// Status of a browser session
export enum SessionStatus {
  RUNNING = 'running',
  COMPLETED = 'completed',
  ERROR = 'error',
  TERMINATED = 'terminated',
}

// Browser session tracking data
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
  };
}

/**
 * Creates, manages, and tracks browser sessions
 */
export class SessionTracker {
  // Map to track session info for reporting
  private sessions: Map<string, SessionInfo> = new Map();
  // Map to track actual browser sessions
  private browserSessions: Map<string, Session> = new Map();
  private readonly defaultConfig: BrowserConfig = {
    headless: true,
    defaultTimeout: 30000,
    useSystemBrowsers: true,
    preferredType: 'chromium',
  };
  private detectedBrowsers: BrowserInfo[] = [];
  private browserDetectionPromise: Promise<void> | null = null;

  constructor(
    public ownerAgentId: string | undefined,
    private logger?: Logger,
  ) {
    // Store a reference to the instance globally for cleanup
    // This allows the CLI to access the instance for cleanup
    (globalThis as any).__BROWSER_MANAGER__ = this;

    // Set up cleanup handlers for graceful shutdown
    this.setupGlobalCleanup();
  }

  // Register a new browser session
  public registerBrowser(url?: string): string {
    const id = uuidv4();
    const session: SessionInfo = {
      id,
      status: SessionStatus.RUNNING,
      startTime: new Date(),
      metadata: {
        url,
      },
    };
    this.sessions.set(id, session);
    return id;
  }

  // Update the status of a browser session
  public updateSessionStatus(
    id: string,
    status: SessionStatus,
    metadata?: Record<string, any>,
  ): boolean {
    const session = this.sessions.get(id);
    if (!session) {
      return false;
    }

    session.status = status;

    if (
      status === SessionStatus.COMPLETED ||
      status === SessionStatus.ERROR ||
      status === SessionStatus.TERMINATED
    ) {
      session.endTime = new Date();
    }

    if (metadata) {
      session.metadata = { ...session.metadata, ...metadata };
    }

    return true;
  }

  // Get all browser sessions info
  public getSessions(): SessionInfo[] {
    return Array.from(this.sessions.values());
  }

  // Get a specific browser session info by ID
  public getSessionById(id: string): SessionInfo | undefined {
    return this.sessions.get(id);
  }

  // Filter sessions by status
  public getSessionsByStatus(status: SessionStatus): SessionInfo[] {
    return this.getSessions().filter((session) => session.status === status);
  }

  /**
   * Create a new browser session
   */
  public async createSession(config?: BrowserConfig): Promise<Session> {
    try {
      // Wait for browser detection to complete if it's still running
      if (this.browserDetectionPromise) {
        await this.browserDetectionPromise;
        this.browserDetectionPromise = null;
      }

      const sessionConfig = { ...this.defaultConfig, ...config };

      // Determine if we should try to use system browsers
      const useSystemBrowsers = sessionConfig.useSystemBrowsers !== false;

      // If a specific executable path is provided, use that
      if (sessionConfig.executablePath) {
        console.log(
          `Using specified browser executable: ${sessionConfig.executablePath}`,
        );
        return this.launchWithExecutablePath(
          sessionConfig.executablePath,
          sessionConfig.preferredType || 'chromium',
          sessionConfig,
        );
      }

      // Try to use a system browser if enabled and any were detected
      if (useSystemBrowsers && this.detectedBrowsers.length > 0) {
        const preferredType = sessionConfig.preferredType || 'chromium';

        // First try to find a browser of the preferred type
        let browserInfo = this.detectedBrowsers.find(
          (b) => b.type === preferredType,
        );

        // If no preferred browser type found, use any available browser
        if (!browserInfo) {
          browserInfo = this.detectedBrowsers[0];
        }

        if (browserInfo) {
          console.log(
            `Using system browser: ${browserInfo.name} (${browserInfo.type}) at ${browserInfo.path}`,
          );
          return this.launchWithExecutablePath(
            browserInfo.path,
            browserInfo.type,
            sessionConfig,
          );
        }
      }

      // Fall back to Playwright's bundled browser
      console.log('Using Playwright bundled browser');
      const browser = await chromium.launch({
        headless: sessionConfig.headless,
      });

      // Create a new context (equivalent to incognito)
      const context = await browser.newContext({
        viewport: null,
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      });

      const page = await context.newPage();
      page.setDefaultTimeout(sessionConfig.defaultTimeout ?? 30000);

      const session: Session = {
        browser,
        page,
        id: uuidv4(),
      };

      this.browserSessions.set(session.id, session);
      // Also store in global browserSessions for compatibility
      browserSessions.set(session.id, session);

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
   * Launch a browser with a specific executable path
   */
  private async launchWithExecutablePath(
    executablePath: string,
    browserType: 'chromium' | 'firefox' | 'webkit',
    config: BrowserConfig,
  ): Promise<Session> {
    let browser;

    // Launch the browser using the detected executable path
    switch (browserType) {
      case 'chromium':
        browser = await chromium.launch({
          headless: config.headless,
          executablePath: executablePath,
        });
        break;
      case 'firefox':
        browser = await firefox.launch({
          headless: config.headless,
          executablePath: executablePath,
        });
        break;
      case 'webkit':
        browser = await webkit.launch({
          headless: config.headless,
          executablePath: executablePath,
        });
        break;
      default:
        throw new BrowserError(
          `Unsupported browser type: ${browserType}`,
          BrowserErrorCode.LAUNCH_FAILED,
        );
    }

    // Create a new context (equivalent to incognito)
    const context = await browser.newContext({
      viewport: null,
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    });

    const page = await context.newPage();
    page.setDefaultTimeout(config.defaultTimeout ?? 30000);

    const session: Session = {
      browser,
      page,
      id: uuidv4(),
    };

    this.browserSessions.set(session.id, session);
    // Also store in global browserSessions for compatibility
    browserSessions.set(session.id, session);

    this.setupCleanup(session);

    return session;
  }

  /**
   * Get a browser session by ID
   */
  public getSession(sessionId: string): Session {
    const session = this.browserSessions.get(sessionId);
    if (!session) {
      console.log(
        'getting session, but here are the sessions',
        this.browserSessions,
      );
      throw new BrowserError(
        'Session not found',
        BrowserErrorCode.SESSION_ERROR,
      );
    }
    return session;
  }

  /**
   * Close a specific browser session
   */
  public async closeSession(sessionId: string): Promise<void> {
    const session = this.browserSessions.get(sessionId);
    if (!session) {
      console.log(
        'closing session, but here are the sessions',
        this.browserSessions,
      );
      throw new BrowserError(
        'Session not found',
        BrowserErrorCode.SESSION_ERROR,
      );
    }

    try {
      // In Playwright, we should close the context which will automatically close its pages
      await session.page.context().close();
      await session.browser.close();

      // Remove from both maps
      this.browserSessions.delete(sessionId);
      browserSessions.delete(sessionId);

      // Update status
      this.updateSessionStatus(sessionId, SessionStatus.COMPLETED, {
        closedExplicitly: true,
      });
    } catch (error) {
      this.updateSessionStatus(sessionId, SessionStatus.ERROR, {
        error: error instanceof Error ? error.message : String(error),
      });

      throw new BrowserError(
        'Failed to close session',
        BrowserErrorCode.SESSION_ERROR,
        error,
      );
    }
  }

  /**
   * Cleans up all browser sessions associated with this tracker
   */
  public async cleanup(): Promise<void> {
    await this.closeAllSessions();
  }

  /**
   * Close all browser sessions
   */
  public async closeAllSessions(): Promise<void> {
    const closePromises = Array.from(this.browserSessions.keys()).map(
      (sessionId) => this.closeSession(sessionId).catch(() => {}),
    );
    await Promise.all(closePromises);
  }

  private setupCleanup(session: Session): void {
    // Handle browser disconnection
    session.browser.on('disconnected', () => {
      this.browserSessions.delete(session.id);
      browserSessions.delete(session.id);

      // Update session status
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
      for (const session of this.browserSessions.values()) {
        try {
          // Attempt synchronous close - may not fully work
          session.browser.close();
        } catch {
          // Ignore errors during exit
        }
      }
    });

    // Handle SIGINT (Ctrl+C)
    process.on('SIGINT', () => {
      this.closeAllSessions()
        .catch(() => {
          return false;
        })
        .finally(() => {
          // Give a moment for cleanup to complete
          setTimeout(() => process.exit(0), 500);
        })
        .catch(() => {
          // Additional catch for any unexpected errors in the finally block
        });
    });
  }
}
