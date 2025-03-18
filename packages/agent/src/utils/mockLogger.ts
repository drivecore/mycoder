import { Logger } from './logger.js';

export class MockLogger extends Logger {
  constructor() {
    super({ name: 'mock' });
  }

  debug(..._messages: any[]): void {}
  info(..._messages: any[]): void {}
  log(..._messages: any[]): void {}
  warn(..._messages: any[]): void {}
  error(..._messages: any[]): void {}
}

// Export an instance of MockLogger for tests
export const mockLogger = new MockLogger();
