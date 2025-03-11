import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const settingsDir = path.join(os.homedir(), '.mycoder');

export const getSettingsDir = (): string => {
  if (!fs.existsSync(settingsDir)) {
    fs.mkdirSync(settingsDir, { recursive: true });
  }
  return settingsDir;
};

/**
 * Gets the project-level settings directory
 * @returns The project settings directory path, or empty string if not in a project
 */
export const getProjectSettingsDir = (): string => {
  // Start with the current directory
  let currentDir = process.cwd();

  // Traverse up the directory tree until we find a .mycoder directory or reach the root
  while (currentDir !== path.parse(currentDir).root) {
    const projectSettingsDir = path.join(currentDir, '.mycoder');
    if (
      fs.existsSync(projectSettingsDir) &&
      fs.statSync(projectSettingsDir).isDirectory()
    ) {
      return projectSettingsDir;
    }
    // Move up one directory
    currentDir = path.dirname(currentDir);
  }

  // If we're creating a new project config, use the current directory
  return path.join(process.cwd(), '.mycoder');
};

/**
 * Checks if the project settings directory is writable
 * @returns True if the directory exists and is writable, or can be created
 */
export const isProjectSettingsDirWritable = (): boolean => {
  const projectDir = getProjectSettingsDir();

  // Check if directory exists
  if (fs.existsSync(projectDir)) {
    try {
      // Try to write a test file to check permissions
      const testFile = path.join(projectDir, '.write-test');
      fs.writeFileSync(testFile, '');
      fs.unlinkSync(testFile);
      return true;
    } catch {
      return false;
    }
  } else {
    // Directory doesn't exist yet, check if we can create it
    try {
      fs.mkdirSync(projectDir, { recursive: true });
      return true;
    } catch {
      return false;
    }
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
