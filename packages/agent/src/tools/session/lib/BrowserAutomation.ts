import { PageController } from './PageController.js';
import { SessionManager } from './SessionManager.js';

export class BrowserAutomation {
  private static instance: BrowserAutomation;
  private browserManager: SessionManager;

  private constructor() {
    this.browserManager = new SessionManager();
  }

  static getInstance(): BrowserAutomation {
    if (!BrowserAutomation.instance) {
      BrowserAutomation.instance = new BrowserAutomation();
    }
    return BrowserAutomation.instance;
  }

  async createSession(headless: boolean = true) {
    const session = await this.browserManager.createSession({ headless });
    const pageController = new PageController(session.page);

    return {
      sessionId: session.id,
      pageController,
      close: () => this.browserManager.closeSession(session.id),
    };
  }

  async cleanup() {
    await this.browserManager.closeAllSessions();
  }
}

// Export singleton instance
export const browserAutomation = BrowserAutomation.getInstance();
