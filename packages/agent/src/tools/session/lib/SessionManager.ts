import { chromium, firefox, webkit } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

import { BrowserDetector, BrowserInfo } from './BrowserDetector.js';
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
    useSystemBrowsers: true,
    preferredType: 'chromium',
  };
  private detectedBrowsers: BrowserInfo[] = [];
  private browserDetectionPromise: Promise<void> | null = null;

  constructor() {
    // Store a reference to the instance globally for cleanup
    // This allows the CLI to access the instance for cleanup
    (globalThis as any).__BROWSER_MANAGER__ = this;

    // Set up cleanup handlers for graceful shutdown
    this.setupGlobalCleanup();

    // Start browser detection in the background
    this.browserDetectionPromise = this.detectBrowsers();
  }

  /**
   * Detect available browsers on the system
   */
  private async detectBrowsers(): Promise<void> {
    try {
      this.detectedBrowsers = await BrowserDetector.detectBrowsers();
      console.log(
        `Detected ${this.detectedBrowsers.length} browsers on the system`,
      );
      if (this.detectedBrowsers.length > 0) {
        console.log('Available browsers:');
        this.detectedBrowsers.forEach((browser) => {
          console.log(`- ${browser.name} (${browser.type}) at ${browser.path}`);
        });
      }
    } catch (error) {
      console.error('Failed to detect system browsers:', error);
      this.detectedBrowsers = [];
    }
  }

  async createSession(config?: BrowserConfig): Promise<Session> {
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

    this.sessions.set(session.id, session);
    this.setupCleanup(session);

    return session;
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
