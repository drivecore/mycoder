import { homedir } from 'os';
import { join } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { Logger } from './logger.js';
import semver from 'semver';

const logger = new Logger({ name: 'version-cache' });

/**
 * Interface for the version cache data structure
 */
export interface VersionCacheData {
  /** The cached version string */
  version: string;
}

/**
 * Class to manage version cache in the user's home directory
 */
export class VersionCache {
  private readonly cacheDir: string;
  private readonly cacheFile: string;

  constructor() {
    this.cacheDir = join(homedir(), '.mycoder');
    this.cacheFile = join(this.cacheDir, 'version-cache.json');

    // Ensure cache directory exists
    this.ensureCacheDir();
  }

  /**
   * Ensures the cache directory exists
   */
  private ensureCacheDir(): void {
    try {
      if (!existsSync(this.cacheDir)) {
        mkdirSync(this.cacheDir, { recursive: true });
      }
    } catch (error) {
      logger.warn(
        'Failed to create cache directory ~/.mycoder:',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Reads the cache data from disk
   * @returns The cached data or null if not found/invalid
   */
  read(): VersionCacheData | null {
    try {
      if (!existsSync(this.cacheFile)) {
        return null;
      }

      const data = JSON.parse(
        readFileSync(this.cacheFile, 'utf-8')
      ) as VersionCacheData;

      // Validate required fields
      if (!data || typeof data.version !== 'string') {
        return null;
      }

      return data;
    } catch (error) {
      logger.warn(
        'Error reading version cache:',
        error instanceof Error ? error.message : String(error)
      );
      return null;
    }
  }

  /**
   * Writes data to the cache file
   * @param data The version cache data to write
   */
  write(data: VersionCacheData): void {
    try {
      writeFileSync(this.cacheFile, JSON.stringify(data, null, 2));
    } catch (error) {
      logger.warn(
        'Error writing version cache:',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Checks if the cached version is greater than the current version
   * @param currentVersion The current package version
   * @returns true if cached version > current version, false otherwise
   */
  shouldCheckServer(currentVersion: string): boolean {
    try {
      const data = this.read();
      if (!data) {
        return true; // No cache, should check server
      }

      // If cached version is greater than current, we should check server
      // as an upgrade is likely available
      return semver.gt(data.version, currentVersion);
    } catch (error) {
      logger.warn(
        'Error comparing versions:',
        error instanceof Error ? error.message : String(error)
      );
      return true; // On error, check server to be safe
    }
  }

  /**
   * Clears the cache file
   */
  clear(): void {
    try {
      if (existsSync(this.cacheFile)) {
        writeFileSync(this.cacheFile, '');
      }
    } catch (error) {
      logger.warn(
        'Error clearing version cache:',
        error instanceof Error ? error.message : String(error)
      );
    }
  }
}