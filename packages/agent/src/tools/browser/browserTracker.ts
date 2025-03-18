import { v4 as uuidv4 } from 'uuid';

import { BrowserManager } from './BrowserManager.js';
import { browserSessions } from './types.js';

// Status of a browser session
export enum BrowserSessionStatus {
  RUNNING = 'running',
  COMPLETED = 'completed',
  ERROR = 'error',
  TERMINATED = 'terminated',
}

// Browser session tracking data
export interface BrowserSessionInfo {
  id: string;
  status: BrowserSessionStatus;
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
 * Registry to keep track of browser sessions
 */
export class BrowserTracker {
  private sessions: Map<string, BrowserSessionInfo> = new Map();

  constructor(public ownerAgentId: string | undefined) {}

  // Register a new browser session
  public registerBrowser(url?: string): string {
    const id = uuidv4();
    const session: BrowserSessionInfo = {
      id,
      status: BrowserSessionStatus.RUNNING,
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
    status: BrowserSessionStatus,
    metadata?: Record<string, any>,
  ): boolean {
    const session = this.sessions.get(id);
    if (!session) {
      return false;
    }

    session.status = status;

    if (
      status === BrowserSessionStatus.COMPLETED ||
      status === BrowserSessionStatus.ERROR ||
      status === BrowserSessionStatus.TERMINATED
    ) {
      session.endTime = new Date();
    }

    if (metadata) {
      session.metadata = { ...session.metadata, ...metadata };
    }

    return true;
  }

  // Get all browser sessions
  public getSessions(): BrowserSessionInfo[] {
    return Array.from(this.sessions.values());
  }

  // Get a specific browser session by ID
  public getSessionById(id: string): BrowserSessionInfo | undefined {
    return this.sessions.get(id);
  }

  // Filter sessions by status
  public getSessionsByStatus(
    status: BrowserSessionStatus,
  ): BrowserSessionInfo[] {
    return this.getSessions().filter((session) => session.status === status);
  }

  /**
   * Cleans up all browser sessions associated with this tracker
   * @returns A promise that resolves when cleanup is complete
   */
  public async cleanup(): Promise<void> {
    const sessions = this.getSessionsByStatus(BrowserSessionStatus.RUNNING);

    // Create cleanup promises for each session
    const cleanupPromises = sessions.map((session) =>
      this.cleanupBrowserSession(session),
    );

    // Wait for all cleanup operations to complete in parallel
    await Promise.all(cleanupPromises);
  }

  /**
   * Cleans up a browser session
   * @param session The browser session to clean up
   */
  private async cleanupBrowserSession(
    session: BrowserSessionInfo,
  ): Promise<void> {
    try {
      const browserManager = (
        globalThis as unknown as { __BROWSER_MANAGER__?: BrowserManager }
      ).__BROWSER_MANAGER__;

      if (browserManager) {
        await browserManager.closeSession(session.id);
      } else {
        // Fallback to closing via browserSessions if BrowserManager is not available
        const browserSession = browserSessions.get(session.id);
        if (browserSession) {
          await browserSession.page.context().close();
          await browserSession.browser.close();
          browserSessions.delete(session.id);
        }
      }

      this.updateSessionStatus(session.id, BrowserSessionStatus.COMPLETED);
    } catch (error) {
      this.updateSessionStatus(session.id, BrowserSessionStatus.ERROR, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
