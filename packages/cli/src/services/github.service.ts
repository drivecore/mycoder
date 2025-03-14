import { Logger } from 'mycoder-agent';

import { checkGitCli } from '../utils/gitCliCheck.js';

import type { Config } from '../settings/config.js';
import type { GitCliCheckResult } from '../utils/gitCliCheck.js';

/**
 * Service for managing GitHub-related functionality
 * Handles GitHub mode and CLI tool validation
 */
export class GitHubService {
  private logger: Logger;
  private config: Config;

  /**
   * Create a new GitHubService
   * @param logger Logger instance
   * @param config Application configuration
   */
  constructor(logger: Logger, config: Config) {
    this.logger = logger;
    this.config = config;
  }

  /**
   * Check if GitHub mode should be enabled
   * Validates git and gh CLI tools if GitHub mode is enabled
   * @returns Updated GitHub mode status (may be disabled if tools are missing)
   */
  async validateGitHubMode(): Promise<boolean> {
    // If GitHub mode is not enabled, no need to check
    if (!this.config.githubMode) {
      return false;
    }

    this.logger.debug(
      'GitHub mode is enabled, checking for git and gh CLI tools...',
    );
    const gitCliCheck = await checkGitCli(this.logger);

    return this.handleGitCliCheckResult(gitCliCheck);
  }

  /**
   * Process the results of the Git CLI check
   * @param gitCliCheck Result of the Git CLI check
   * @returns Whether GitHub mode should remain enabled
   */
  private handleGitCliCheckResult(gitCliCheck: GitCliCheckResult): boolean {
    if (gitCliCheck.errors.length > 0) {
      this.logger.warn(
        'GitHub mode is enabled but there are issues with git/gh CLI tools:',
      );
      gitCliCheck.errors.forEach((error) => this.logger.warn(`- ${error}`));

      if (!gitCliCheck.gitAvailable || !gitCliCheck.ghAvailable) {
        this.logger.warn(
          'GitHub mode requires git and gh CLI tools to be installed.',
        );
        this.logger.warn(
          'Please install the missing tools or disable GitHub mode with --githubMode false',
        );
        this.logger.info('Disabling GitHub mode due to missing CLI tools.');
        return false;
      } else if (!gitCliCheck.ghAuthenticated) {
        this.logger.warn(
          'GitHub CLI is not authenticated. Please run "gh auth login" to authenticate.',
        );
        this.logger.info(
          'Disabling GitHub mode due to unauthenticated GitHub CLI.',
        );
        return false;
      }
    } else {
      this.logger.info(
        'GitHub mode is enabled and all required CLI tools are available.',
      );
    }

    return true;
  }
}
