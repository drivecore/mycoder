import { loadConfig, watchConfigForChanges } from '../settings/config.js';

import type { Config } from '../settings/config.js';

/**
 * Service for managing application configuration
 * Centralizes config loading and provides a single source of truth
 */
export class ConfigService {
  private config: Config | null = null;
  private unwatchFn: (() => void) | null = null;

  /**
   * Load configuration from files and CLI options
   * @param cliOptions Options provided via command line
   * @returns The loaded configuration
   */
  async load(cliOptions: Partial<Config> = {}): Promise<Config> {
    this.config = await loadConfig(cliOptions);
    return this.config;
  }

  /**
   * Get the current configuration
   * @throws Error if configuration has not been loaded
   * @returns The current configuration
   */
  getConfig(): Config {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call load() first.');
    }
    return this.config;
  }

  /**
   * Watch configuration files for changes and update automatically
   * @param cliOptions Options provided via command line
   * @param onUpdate Optional callback when configuration changes
   * @returns The current configuration
   */
  async watchConfig(
    cliOptions: Partial<Config> = {},
    onUpdate?: (config: Config) => void,
  ): Promise<Config> {
    // Unwatch previous config if any
    if (this.unwatchFn) {
      this.unwatchFn();
      this.unwatchFn = null;
    }

    const { config, unwatch } = await watchConfigForChanges(
      cliOptions,
      (updatedConfig) => {
        this.config = updatedConfig;
        if (onUpdate) {
          onUpdate(updatedConfig);
        }
      },
    );

    this.config = config;
    this.unwatchFn = unwatch;

    return config;
  }

  /**
   * Stop watching configuration files
   */
  stopWatching(): void {
    if (this.unwatchFn) {
      this.unwatchFn();
      this.unwatchFn = null;
    }
  }
}
