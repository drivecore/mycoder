import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { Logger, LogLevel } from './logger.js';

describe('Logger', () => {
  let consoleSpy: { [key: string]: any };

  beforeEach(() => {
    // Setup console spies before each test
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    // Clear all mocks after each test
    vi.clearAllMocks();
  });

  describe('Basic logging functionality', () => {
    const logger = new Logger({ name: 'TestLogger', logLevel: LogLevel.debug });
    const testMessage = 'Test message';

    it('should log debug messages', () => {
      logger.debug(testMessage);
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining(testMessage),
      );
    });

    it('should log verbose messages', () => {
      logger.verbose(testMessage);
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining(testMessage),
      );
    });

    it('should log info messages', () => {
      logger.info(testMessage);
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

    it('should include proper indentation for nested loggers', () => {
      childLogger.info(testMessage);
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('  '), // Two spaces of indentation
      );
    });

    it('should properly log messages at all levels with nested logger', () => {
      childLogger.debug(testMessage);
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining(testMessage),
      );

      childLogger.verbose(testMessage);
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining(testMessage),
      );

      childLogger.info(testMessage);
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
