import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as process from 'process';

// Global settings directory (in user's home directory)
const globalSettingsDir = path.join(os.homedir(), '.mycoder');

/**
 * Get the global settings directory, creating it if it doesn't exist
 */
export const getGlobalSettingsDir = (): string => {
  if (!fs.existsSync(globalSettingsDir)) {
    fs.mkdirSync(globalSettingsDir, { recursive: true });
  }
  return globalSettingsDir;
};

/**
 * Get the project-level settings directory, creating it if it doesn't exist
 * This will be .mycoder in the current working directory
 */
export const getProjectSettingsDir = (): string => {
  const projectSettingsDir = path.join(process.cwd(), '.mycoder');
  if (!fs.existsSync(projectSettingsDir)) {
    fs.mkdirSync(projectSettingsDir, { recursive: true });
  }
  return projectSettingsDir;
};

/**
 * For backwards compatibility, alias the global settings dir as the default
 */
export const getSettingsDir = getGlobalSettingsDir;

// Consent file is always global
const consentFile = path.join(globalSettingsDir, 'consent.json');

export const hasUserConsented = (): boolean => {
  return fs.existsSync(consentFile);
};

export const saveUserConsent = (): void => {
  const timestamp = new Date().toISOString();
  const data = JSON.stringify({ timestamp }, null, 2);
  fs.writeFileSync(consentFile, data);
};
