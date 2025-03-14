import { Logger } from 'mycoder-agent';

import { getContainer } from '../di/container.js';

import { CommandService } from './command.service.js';
import { ConfigService } from './config.service.js';
import { GitHubService } from './github.service.js';
import { LoggerService } from './logger.service.js';
import { VersionService } from './version.service.js';

import type { Container } from '../di/container.js';
import type { SharedOptions } from '../options.js';
import type { Config } from '../settings/config.js';
import type { ArgumentsCamelCase } from 'yargs';

/**
 * Factory for creating and registering services
 * Manages the initialization and dependencies of services
 */
export class ServiceFactory {
  private container: Container;

  /**
   * Create a new ServiceFactory
   * @param container Optional DI container (uses global container if not provided)
   */
  constructor(container?: Container) {
    this.container = container || getContainer();
  }

  /**
   * Initialize all core services
   * @param argv Command line arguments
   * @returns Promise that resolves when services are initialized
   */
  async initializeServices(
    argv: ArgumentsCamelCase<SharedOptions>,
  ): Promise<void> {
    // Create and register ConfigService
    const configService = await this.createConfigService(argv);

    // Create and register LoggerService
    const loggerService = this.createLoggerService(configService.getConfig());

    // Create and register VersionService
    const versionService = this.createVersionService(
      loggerService.getDefaultLogger(),
      configService.getConfig(),
    );

    // Create and register GitHubService
    const githubService = this.createGitHubService(
      loggerService.getDefaultLogger(),
      configService.getConfig(),
    );

    // Create and register CommandService
    this.createCommandService(
      loggerService.getDefaultLogger(),
      configService.getConfig(),
      versionService,
      githubService,
    );
  }

  /**
   * Create and register ConfigService
   * @param argv Command line arguments
   * @returns ConfigService instance
   */
  private async createConfigService(
    argv: ArgumentsCamelCase<SharedOptions>,
  ): Promise<ConfigService> {
    const configService = new ConfigService();

    // Convert argv to Partial<Config>
    const cliOptions: Partial<Config> = {
      logLevel: argv.logLevel as string,
      tokenCache: argv.tokenCache as boolean,
      provider: argv.provider as string,
      model: argv.model as string,
      maxTokens: argv.maxTokens as number,
      temperature: argv.temperature as number,
      profile: argv.profile as boolean,
      githubMode: argv.githubMode as boolean,
      userSession: argv.userSession as boolean,
      pageFilter: argv.pageFilter as 'simple' | 'none' | 'readability',
      headless: argv.headless as boolean,
      baseUrl: argv.ollamaBaseUrl as string,
      userPrompt: argv.userPrompt as boolean,
      upgradeCheck: argv.upgradeCheck as boolean,
      tokenUsage: argv.tokenUsage as boolean,
    };

    // Load configuration
    await configService.load(cliOptions);

    // Register with container
    this.container.register('configService', configService);

    return configService;
  }

  /**
   * Create and register LoggerService
   * @param config Application configuration
   * @returns LoggerService instance
   */
  private createLoggerService(config: Config): LoggerService {
    const loggerService = new LoggerService(config);
    this.container.register('loggerService', loggerService);
    return loggerService;
  }

  /**
   * Create and register VersionService
   * @param logger Logger instance
   * @param config Application configuration
   * @returns VersionService instance
   */
  private createVersionService(logger: Logger, config: Config): VersionService {
    const versionService = new VersionService(logger, config);
    this.container.register('versionService', versionService);
    return versionService;
  }

  /**
   * Create and register GitHubService
   * @param logger Logger instance
   * @param config Application configuration
   * @returns GitHubService instance
   */
  private createGitHubService(logger: Logger, config: Config): GitHubService {
    const githubService = new GitHubService(logger, config);
    this.container.register('githubService', githubService);
    return githubService;
  }

  /**
   * Create and register CommandService
   * @param logger Logger instance
   * @param config Application configuration
   * @param versionService VersionService instance
   * @param githubService GitHubService instance
   * @returns CommandService instance
   */
  private createCommandService(
    logger: Logger,
    config: Config,
    versionService: VersionService,
    githubService: GitHubService,
  ): CommandService {
    const commandService = new CommandService(
      logger,
      config,
      versionService,
      githubService,
    );
    this.container.register('commandService', commandService);
    return commandService;
  }
}
