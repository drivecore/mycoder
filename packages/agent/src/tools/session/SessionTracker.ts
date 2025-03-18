import { v4 as uuidv4 } from 'uuid';

import { SessionManager } from './lib/SessionManager.js';
import { browserSessions } from './lib/types.js';

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
 * Registry to keep track of browser sessions
 */
export class SessionTracker {
  private sessions: Map<string, SessionInfo> = new Map();

  constructor(public ownerAgentId: string | undefined) {}

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

  // Get all browser sessions
  public getSessions(): SessionInfo[] {
    return Array.from(this.sessions.values());
  }

  // Get a specific browser session by ID
  public getSessionById(id: string): SessionInfo | undefined {
    return this.sessions.get(id);
  }

  // Filter sessions by status
  public getSessionsByStatus(status: SessionStatus): SessionInfo[] {
    return this.getSessions().filter((session) => session.status === status);
  }

  /**
   * Cleans up all browser sessions associated with this tracker
   * @returns A promise that resolves when cleanup is complete
   */
  public async cleanup(): Promise<void> {
    const sessions = this.getSessionsByStatus(SessionStatus.RUNNING);

    // Create cleanup promises for each session
    const cleanupPromises = sessions.map((session) =>
      this.cleanupSession(session),
    );

    // Wait for all cleanup operations to complete in parallel
    await Promise.all(cleanupPromises);
  }

  /**
   * Cleans up a browser session
   * @param session The browser session to clean up
   */
  private async cleanupSession(session: SessionInfo): Promise<void> {
    try {
      const browserManager = (
        globalThis as unknown as { __BROWSER_MANAGER__?: SessionManager }
      ).__BROWSER_MANAGER__;

      if (browserManager) {
        await browserManager.closeSession(session.id);
      } else {
        // Fallback to closing via browserSessions if SessionManager is not available
        const browserSession = browserSessions.get(session.id);
        if (browserSession) {
          await browserSession.page.context().close();
          await browserSession.browser.close();
          browserSessions.delete(session.id);
        }
      }

      this.updateSessionStatus(session.id, SessionStatus.COMPLETED);
    } catch (error) {
      this.updateSessionStatus(session.id, SessionStatus.ERROR, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
