import { exec } from 'child_process';
import { promisify } from 'util';
import { Logger } from 'mycoder-agent';

const execAsync = promisify(exec);

/**
 * Result of CLI tool checks
 */
export interface GitCliCheckResult {
  gitAvailable: boolean;
  ghAvailable: boolean;
  ghAuthenticated: boolean;
  errors: string[];
}

/**
 * Checks if git command is available
 */
async function checkGitAvailable(): Promise<boolean> {
  try {
    await execAsync('git --version');
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if gh command is available
 */
async function checkGhAvailable(): Promise<boolean> {
  try {
    await execAsync('gh --version');
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if gh is authenticated
 */
async function checkGhAuthenticated(): Promise<boolean> {
  try {
    const { stdout } = await execAsync('gh auth status');
    return stdout.includes('Logged in to');
  } catch {
    return false;
  }
}

/**
 * Checks if git and gh CLI tools are available and if gh is authenticated
 * @param logger Optional logger for debug output
 * @returns Object with check results
 */
export async function checkGitCli(logger?: Logger): Promise<GitCliCheckResult> {
  const result: GitCliCheckResult = {
    gitAvailable: false,
    ghAvailable: false,
    ghAuthenticated: false,
    errors: [],
  };

  logger?.debug('Checking for git CLI availability...');
  result.gitAvailable = await checkGitAvailable();

  logger?.debug('Checking for gh CLI availability...');
  result.ghAvailable = await checkGhAvailable();

  if (result.ghAvailable) {
    logger?.debug('Checking for gh CLI authentication...');
    result.ghAuthenticated = await checkGhAuthenticated();
  }

  // Collect any errors
  if (!result.gitAvailable) {
    result.errors.push('Git CLI is not available. Please install git.');
  }
  
  if (!result.ghAvailable) {
    result.errors.push('GitHub CLI is not available. Please install gh CLI.');
  } else if (!result.ghAuthenticated) {
    result.errors.push('GitHub CLI is not authenticated. Please run "gh auth login".');
  }

  return result;
}