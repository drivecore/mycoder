import chalk, { ChalkInstance } from 'chalk';

export enum LogLevel {
  debug = 0,
  info = 1,
  log = 2,
  warn = 3,
  error = 4,
}

export type LoggerProps = {
  name: string;
  logLevel?: LogLevel;
  parent?: Logger;
  customPrefix?: string;
  color?: ChalkInstance;
};

export type LoggerListener = (
  logger: Logger,
  logLevel: LogLevel,
  lines: string[],
) => void;

export class Logger {
  public readonly prefix: string;
  public readonly logLevel: LogLevel;
  public readonly logLevelIndex: LogLevel;
  public readonly parent?: Logger;
  public readonly name: string;
  public readonly nesting: number;
  public readonly customPrefix?: string;
  public readonly color?: ChalkInstance;

  readonly listeners: LoggerListener[] = [];

  constructor({
    name,
    parent = undefined,
    logLevel = parent?.logLevel ?? LogLevel.info,
    customPrefix,
    color,
  }: LoggerProps) {
    this.customPrefix = customPrefix;
    this.name = name;
    this.parent = parent;
    this.logLevel = logLevel;
    this.logLevelIndex = logLevel;
    // Inherit color from parent if not provided and parent has a color
    this.color = color ?? parent?.color;

    // Calculate indent level and offset based on parent chain
    this.nesting = 0;
    let offsetSpaces = 0;
    let currentParent = parent;
    while (currentParent) {
      offsetSpaces += 2;
      this.nesting++;
      currentParent = currentParent.parent;
    }

    this.prefix = ' '.repeat(offsetSpaces);

    if (parent) {
      this.listeners.push((logger, logLevel, lines) => {
        parent.listeners.forEach((listener) => {
          listener(logger, logLevel, lines);
        });
      });
    }
  }

  private emitMessages(level: LogLevel, messages: unknown[]) {
    // Allow all messages at the configured log level or higher
    if (level < this.logLevelIndex) return;

    const lines = messages
      .map((message) =>
        typeof message === 'object'
          ? JSON.stringify(message, null, 2)
          : String(message),
      )
      .join('\n')
      .split('\n');

    this.listeners.forEach((listener) => listener(this, level, lines));
  }

  debug(...messages: unknown[]): void {
    this.emitMessages(LogLevel.debug, messages);
  }

  info(...messages: unknown[]): void {
    this.emitMessages(LogLevel.info, messages);
  }

  log(...messages: unknown[]): void {
    this.emitMessages(LogLevel.log, messages);
  }

  warn(...messages: unknown[]): void {
    this.emitMessages(LogLevel.warn, messages);
  }

  error(...messages: unknown[]): void {
    this.emitMessages(LogLevel.error, messages);
  }
}

export const consoleOutputLogger: LoggerListener = (
  logger: Logger,
  level: LogLevel,
  lines: string[],
) => {
  const getColor = (level: LogLevel, _nesting: number = 0): ChalkInstance => {
    // Always use red for errors and yellow for warnings regardless of agent color
    if (level === LogLevel.error) {
      return chalk.red;
    }
    if (level === LogLevel.warn) {
      return chalk.yellow;
    }

    // Use logger's color if available for log level
    if (level === LogLevel.log && logger.color) {
      return logger.color;
    }

    // Default colors for different log levels
    switch (level) {
      case LogLevel.debug:
      case LogLevel.info:
        return chalk.white.dim;
      case LogLevel.log:
        return chalk.white;
      default:
        throw new Error(`Unknown log level: ${level}`);
    }
  };
  const formatPrefix = (
    prefix: string,
    level: LogLevel,
    _nesting: number = 0,
  ): string =>
    level === LogLevel.debug || level === LogLevel.info
      ? chalk.dim(prefix)
      : prefix;
  const showPrefix = (_level: LogLevel): boolean => {
    // Show prefix for all log levels
    return false;
  };

  // name of enum value
  const logLevelName = LogLevel[level];
  const messageColor = getColor(level, logger.nesting);

  let combinedPrefix = logger.prefix;

  if (showPrefix(level)) {
    const prefix = formatPrefix(`[${logger.name}]`, level, logger.nesting);

    if (logger.customPrefix) {
      combinedPrefix = `${logger.prefix}${logger.customPrefix} `;
    } else {
      combinedPrefix = `${logger.prefix}${prefix} `;
    }
  }

  const coloredLies = lines.map(
    (line) => `${combinedPrefix}${messageColor(line)}`,
  );

  const consoleOutput = console[logLevelName];
  coloredLies.forEach((line) => consoleOutput(line));
};
