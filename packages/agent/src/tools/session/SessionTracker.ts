import { chromium, firefox, webkit } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

import { Logger } from '../../utils/logger.js';

import { BrowserInfo } from './lib/browserDetectors.js';
import {
  BrowserConfig,
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

// Browser session tracking data
export interface SessionInfo {
  id: string;
  status: SessionStatus;
  startTime: Date;
  endTime?: Date;
  page?: import('@playwright/test').Page;
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
  private browser: import('@playwright/test').Browser | null = null;
  private readonly defaultConfig: BrowserConfig = {
    headless: true,
    defaultTimeout: 30000,
    useSystemBrowsers: true,
    preferredType: 'chromium',
  };
  private detectedBrowsers: BrowserInfo[] = [];
  private browserDetectionPromise: Promise<void> | null = null;
  private currentConfig: BrowserConfig | null = null;

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

  // Register a new browser session without creating a page yet
  public registerBrowser(url?: string): string {
    const id = uuidv4();
    const sessionInfo: SessionInfo = {
      id,
      status: SessionStatus.RUNNING,
      startTime: new Date(),
      metadata: {
        url,
      },
    };
    this.sessions.set(id, sessionInfo);
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
  public async createSession(config?: BrowserConfig): Promise<string> {
    try {
      const sessionConfig = { ...this.defaultConfig, ...config };
      
      // Initialize browser if needed
      const browser = await this.initializeBrowser(sessionConfig);
      
      // Create a new context (equivalent to incognito)
      const context = await browser.newContext({
        viewport: null,
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      });

      const page = await context.newPage();
      page.setDefaultTimeout(sessionConfig.defaultTimeout ?? 30000);

      // Create session info
      const id = uuidv4();
      const sessionInfo: SessionInfo = {
        id,
        status: SessionStatus.RUNNING,
        startTime: new Date(),
        page,
        metadata: {},
      };

      this.sessions.set(id, sessionInfo);

      return id;
    } catch (error) {
      throw new BrowserError(
        'Failed to create browser session',
        BrowserErrorCode.LAUNCH_FAILED,
        error,
      );
    }
  }



  /**
   * Get a page from a session by ID
   */
  public getSessionPage(sessionId: string): import('@playwright/test').Page {
    const sessionInfo = this.sessions.get(sessionId);
    if (!sessionInfo || !sessionInfo.page) {
      console.log(
        'getting session, but here are the sessions',
        this.sessions,
      );
      throw new BrowserError(
        'Session not found',
        BrowserErrorCode.SESSION_ERROR,
      );
    }
    return sessionInfo.page;
  }

  /**
   * Close a specific browser session
   */
  public async closeSession(sessionId: string): Promise<void> {
    const sessionInfo = this.sessions.get(sessionId);
    if (!sessionInfo || !sessionInfo.page) {
      console.log(
        'closing session, but here are the sessions',
        this.sessions,
      );
      throw new BrowserError(
        'Session not found',
        BrowserErrorCode.SESSION_ERROR,
      );
    }

    try {
      // In Playwright, we should close the context which will automatically close its pages
      await sessionInfo.page.context().close();
      
      // Remove the page reference
      sessionInfo.page = undefined;

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
   * Cleans up all browser sessions and the browser itself
   */
  public async cleanup(): Promise<void> {
    await this.closeAllSessions();
    
    // Close the browser if it exists
    if (this.browser) {
      try {
        await this.browser.close();
        this.browser = null;
        this.currentConfig = null;
      } catch (error) {
        console.error('Error closing browser:', error);
      }
    }
  }

  /**
   * Close all browser sessions
   */
  public async closeAllSessions(): Promise<void> {
    const closePromises = Array.from(this.sessions.keys())
      .filter(sessionId => {
        const sessionInfo = this.sessions.get(sessionId);
        return sessionInfo && sessionInfo.page;
      })
      .map(sessionId => this.closeSession(sessionId).catch(() => {}));
    
    await Promise.all(closePromises);
  }

  /**
   * Sets up global cleanup handlers for all browser sessions
   */
  /**
   * Lazily initializes the browser instance
   */
  private async initializeBrowser(config: BrowserConfig): Promise<import('@playwright/test').Browser> {
    if (this.browser) {
      // If we already have a browser with the same config, reuse it
      if (this.currentConfig && 
          this.currentConfig.headless === config.headless &&
          this.currentConfig.executablePath === config.executablePath &&
          this.currentConfig.preferredType === config.preferredType) {
        return this.browser;
      }
      
      // Otherwise, close the existing browser before creating a new one
      await this.browser.close();
      this.browser = null;
    }

    // Wait for browser detection to complete if it's still running
    if (this.browserDetectionPromise) {
      await this.browserDetectionPromise;
      this.browserDetectionPromise = null;
    }

    // Determine if we should try to use system browsers
    const useSystemBrowsers = config.useSystemBrowsers !== false;

    // If a specific executable path is provided, use that
    if (config.executablePath) {
      console.log(
        `Using specified browser executable: ${config.executablePath}`,
      );
      this.browser = await this.launchBrowserWithExecutablePath(
        config.executablePath,
        config.preferredType || 'chromium',
        config,
      );
    } 
    // Try to use a system browser if enabled and any were detected
    else if (useSystemBrowsers && this.detectedBrowsers.length > 0) {
      const preferredType = config.preferredType || 'chromium';

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
        this.browser = await this.launchBrowserWithExecutablePath(
          browserInfo.path,
          browserInfo.type,
          config,
        );
      }
    }

    // Fall back to Playwright's bundled browser if no browser was created
    if (!this.browser) {
      console.log('Using Playwright bundled browser');
      this.browser = await chromium.launch({
        headless: config.headless,
      });
    }

    // Store the current config
    this.currentConfig = { ...config };
    
    // Set up event handlers for the browser
    this.browser.on('disconnected', () => {
      this.browser = null;
      this.currentConfig = null;
    });

    return this.browser;
  }

  /**
   * Launch a browser with a specific executable path
   */
  private async launchBrowserWithExecutablePath(
    executablePath: string,
    browserType: 'chromium' | 'firefox' | 'webkit',
    config: BrowserConfig,
  ): Promise<import('@playwright/test').Browser> {
    // Launch the browser using the detected executable path
    switch (browserType) {
      case 'chromium':
        return await chromium.launch({
          headless: config.headless,
          executablePath: executablePath,
        });
      case 'firefox':
        return await firefox.launch({
          headless: config.headless,
          executablePath: executablePath,
        });
      case 'webkit':
        return await webkit.launch({
          headless: config.headless,
          executablePath: executablePath,
        });
      default:
        throw new BrowserError(
          `Unsupported browser type: ${browserType}`,
          BrowserErrorCode.LAUNCH_FAILED,
        );
    }
  }

  private setupGlobalCleanup(): void {
    // Use beforeExit for async cleanup
    process.on('beforeExit', () => {
      this.cleanup().catch((err) => {
        console.error('Error closing browser sessions:', err);
      });
    });

    // Use exit for synchronous cleanup (as a fallback)
    process.on('exit', () => {
      // Can only do synchronous operations here
      if (this.browser) {
        try {
          // Attempt synchronous close - may not fully work
          this.browser.close();
        } catch {
          // Ignore errors during exit
        }
      }
    });

    // Handle SIGINT (Ctrl+C)
    process.on('SIGINT', () => {
      this.cleanup()
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
