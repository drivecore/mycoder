import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { consoleOutputLogger, Logger, LogLevel } from './logger.js';

describe('Logger', () => {
  let consoleSpy: { [key: string]: any };

  beforeEach(() => {
    // Setup console spies before each test
    consoleSpy = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    // Clear all mocks after each test
    vi.clearAllMocks();
  });

  describe('Basic console output logger', () => {
    const logger = new Logger({ name: 'TestLogger', logLevel: LogLevel.debug });
    const testMessage = 'Test message';

    it('should log log messages', () => {
      consoleOutputLogger(logger, LogLevel.log, [testMessage]);
      console.log(consoleSpy.log);
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining(testMessage),
      );
    });
  });

  describe('Basic logging functionality', () => {
    const logger = new Logger({ name: 'TestLogger', logLevel: LogLevel.debug });
    logger.listeners.push(consoleOutputLogger);
    const testMessage = 'Test message';

    it('should log debug messages', () => {
      logger.debug(testMessage);
      expect(consoleSpy.debug).toHaveBeenCalledWith(
        expect.stringContaining(testMessage),
      );
    });

    it('should log info messages', () => {
      logger.info(testMessage);
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining(testMessage),
      );
    });

    it('should log log messages', () => {
      logger.log(testMessage);
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining(testMessage),
      );
    });

    it('should log warning messages', () => {
      logger.warn(testMessage);
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining(testMessage),
      );
    });

    it('should log error messages', () => {
      logger.error(testMessage);
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining(testMessage),
      );
    });
  });

  describe('Nested logger functionality', () => {
    const parentLogger = new Logger({
      name: 'ParentLogger',
      logLevel: LogLevel.debug,
    });
    const childLogger = new Logger({
      name: 'ChildLogger',
      parent: parentLogger,
      logLevel: LogLevel.debug,
    });
    const testMessage = 'Nested test message';

    parentLogger.listeners.push(consoleOutputLogger);

    it('should include proper indentation for nested loggers', () => {
      childLogger.log(testMessage);
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('  '), // Two spaces of indentation
      );
    });

    it('should properly log messages at all levels with nested logger', () => {
      childLogger.debug(testMessage);
      expect(consoleSpy.debug).toHaveBeenCalledWith(
        expect.stringContaining(testMessage),
      );

      childLogger.info(testMessage);
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining(testMessage),
      );

      childLogger.log(testMessage);
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining(testMessage),
      );

      childLogger.warn(testMessage);
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining(testMessage),
      );

      childLogger.error(testMessage);
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining(testMessage),
      );
    });
  });
});
