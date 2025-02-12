import { Logger } from "./logger.js";
import chalk from "chalk";
import { createRequire } from "module";
import type { PackageJson } from "type-fest";
import { VersionCache } from './versionCache.js';
import semver from 'semver';

const require = createRequire(import.meta.url);
const logger = new Logger({ name: "version-check" });
const versionCache = new VersionCache();

/**
 * Gets the current package info from package.json
 */
export function getPackageInfo(): {
  name: string | undefined;
  version: string | undefined;
} {
  const packageInfo = require("../../package.json") as PackageJson;
  return {
    name: packageInfo.name,
    version: packageInfo.version,
  };
}

/**
 * Checks if the package is running as a global npm package
 */
export function isGlobalPackage(): boolean {
  return !!process.env.npm_config_global;
}

/**
 * Fetches the latest version of a package from npm registry
 */
export async function fetchLatestVersion(
  packageName: string,
): Promise<string | null> {
  try {
    const registryUrl = `https://registry.npmjs.org/${packageName}/latest`;
    const response = await fetch(registryUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch version info: ${response.statusText}`);
    }

    const data = (await response.json()) as { version: string | undefined };
    return data.version ?? null;
  } catch (error) {
    logger.warn(
      "Error fetching latest version:",
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}

/**
 * Generates an upgrade message if versions differ
 */
export function generateUpgradeMessage(
  currentVersion: string,
  latestVersion: string,
  packageName: string,
): string | null {
  return semver.gt(latestVersion, currentVersion)
    ? chalk.green(
        `  Update available: ${currentVersion} → ${latestVersion}\n  Run 'npm install -g ${packageName}' to update`,
      )
    : null;
}

/**
 * Updates the version cache
 */
async function updateVersionCache(
  packageName: string,
  version: string,
): Promise<void> {
  try {
    versionCache.write({ version });
  } catch (error) {
    logger.warn(
      "Error updating version cache:",
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * Performs a background version check and updates the cache
 */
async function backgroundVersionCheck(
  packageName: string,
): Promise<void> {
  try {
    const latestVersion = await fetchLatestVersion(packageName);
    if (latestVersion) {
      await updateVersionCache(packageName, latestVersion);
    }
  } catch (error) {
    logger.warn(
      "Background version check failed:",
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * Checks if a newer version of the package is available on npm.
 * - Immediately returns cached version check result if available
 * - Always performs a background check to update cache for next time
 *
 * @returns Upgrade message string if update available, null otherwise
 */
export async function checkForUpdates(): Promise<string | null> {
  try {
    const { name: packageName, version: currentVersion } = getPackageInfo();

    if (!packageName || !currentVersion) {
      logger.warn("Unable to determine current package name or version");
      return null;
    }

    // Always trigger background version check for next time
    setImmediate(() => {
      backgroundVersionCheck(packageName).catch(error => {
        logger.warn(
          "Background version check failed:",
          error instanceof Error ? error.message : String(error),
        );
      });
    });

    // Use cached data for immediate response if available
    const cachedData = versionCache.read();
    if (cachedData) {
      return generateUpgradeMessage(currentVersion, cachedData.version, packageName);
    }

    // No cache available, need to check server
    const latestVersion = await fetchLatestVersion(packageName);
    if (!latestVersion) {
      logger.warn("Unable to determine latest published version");
      return null;
    }

    // Update cache with result
    await updateVersionCache(packageName, latestVersion);

    return generateUpgradeMessage(currentVersion, latestVersion, packageName);
  } catch (error) {
    // Log error but don't throw to handle gracefully
    logger.warn(
      "Error checking for updates:",
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}