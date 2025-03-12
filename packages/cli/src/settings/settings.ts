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
