import { Logger, subAgentTool } from 'mycoder-agent';

import { nameToLogIndex } from '../utils/nameToLogIndex.js';

import type { Config } from '../settings/config.js';

/**
 * Centralized service for managing loggers
 * Prevents creating multiple logger instances with the same configuration
 */
export class LoggerService {
  private loggers: Map<string, Logger> = new Map();
  private config: Config;

  /**
   * Create a new LoggerService
   * @param config The application configuration
   */
  constructor(config: Config) {
    this.config = config;
  }

  /**
   * Get or create a logger with the given name
   * @param name The logger name
   * @returns A Logger instance
   */
  getLogger(name: string): Logger {
    if (!this.loggers.has(name)) {
      this.loggers.set(
        name,
        new Logger({
          name,
          logLevel: nameToLogIndex(this.config.logLevel),
          customPrefix: subAgentTool.logPrefix,
        }),
      );
    }

    return this.loggers.get(name)!;
  }

  /**
   * Get the default logger (named 'Default')
   * @returns The default logger
   */
  getDefaultLogger(): Logger {
    return this.getLogger('Default');
  }

  /**
   * Update all loggers with new configuration
   * @param config The updated configuration
   */
  updateConfig(config: Config): void {
    this.config = config;

    // Create new loggers with updated log level instead of updating existing ones
    // since Logger doesn't expose a setLogLevel method
    const newLoggers = new Map<string, Logger>();

    this.loggers.forEach((logger, name) => {
      newLoggers.set(
        name,
        new Logger({
          name,
          logLevel: nameToLogIndex(config.logLevel),
          customPrefix: subAgentTool.logPrefix,
        }),
      );
    });

    this.loggers = newLoggers;
  }
}
