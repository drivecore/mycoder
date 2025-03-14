import { Logger } from 'mycoder-agent';

import { checkForUpdates, getPackageInfo } from '../utils/versionCheck.js';

import type { Config } from '../settings/config.js';

/**
 * Service for managing version-related functionality
 * Handles version checking and update notifications
 */
export class VersionService {
  private logger: Logger;
  private config: Config;

  /**
   * Create a new VersionService
   * @param logger Logger instance
   * @param config Application configuration
   */
  constructor(logger: Logger, config: Config) {
    this.logger = logger;
    this.config = config;
  }

  /**
   * Get the current package information
   * @returns Object with name and version
   */
  getPackageInfo(): { name: string; version: string } {
    return getPackageInfo();
  }

  /**
   * Check for updates if enabled in config
   * @returns Promise that resolves when check is complete
   */
  async checkForUpdates(): Promise<void> {
    // Skip version check if upgradeCheck is false
    if (this.config.upgradeCheck === false) {
      this.logger.debug('Version check disabled by configuration');
      return;
    }

    this.logger.debug('Checking for updates...');
    await checkForUpdates(this.logger);
  }
}
