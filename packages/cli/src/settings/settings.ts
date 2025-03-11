import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// Global settings directory in user's home
const settingsDir = path.join(os.homedir(), '.mycoder');

// Get the global settings directory, creating it if it doesn't exist
export const getSettingsDir = (): string => {
  if (!fs.existsSync(settingsDir)) {
    fs.mkdirSync(settingsDir, { recursive: true });
  }
  return settingsDir;
};

// Get the project-level settings directory, creating it if it doesn't exist
export const getProjectSettingsDir = (): string => {
  const projectSettingsDir = path.join(process.cwd(), '.mycoder');
  if (!fs.existsSync(projectSettingsDir)) {
    try {
      fs.mkdirSync(projectSettingsDir, { recursive: true });
    } catch {
      // If we can't create the directory, return empty string
      // This will be handled by the config module
      return '';
    }
  }
  return projectSettingsDir;
};

// Check if the project-level settings directory exists and is writable
export const isProjectSettingsDirWritable = (): boolean => {
  const projectSettingsDir = path.join(process.cwd(), '.mycoder');

  // Check if directory exists
  if (fs.existsSync(projectSettingsDir)) {
    try {
      // Check if directory is writable
      fs.accessSync(projectSettingsDir, fs.constants.W_OK);
      return true;
    } catch {
      return false;
    }
  }

  // If directory doesn't exist, check if we can create it
  try {
    fs.mkdirSync(projectSettingsDir, { recursive: true });
    return true;
  } catch {
    return false;
  }
};

const consentFile = path.join(settingsDir, 'consent.json');

export const hasUserConsented = (): boolean => {
  return fs.existsSync(consentFile);
};

export const saveUserConsent = (): void => {
  const timestamp = new Date().toISOString();
  const data = JSON.stringify({ timestamp }, null, 2);
  fs.writeFileSync(consentFile, data);
};
