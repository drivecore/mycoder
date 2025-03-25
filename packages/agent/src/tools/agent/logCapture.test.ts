import { expect, test, describe } from 'vitest';

import { ToolContext } from '../../core/types.js';
import { LogLevel, Logger } from '../../utils/logger.js';

import { AgentState } from './AgentTracker.js';

// Helper function to directly invoke a listener with a log message
function emitLog(logger: Logger, level: LogLevel, message: string) {
  const lines = [message];
  // Directly call all listeners on this logger
  logger.listeners.forEach((listener) => {
    listener(logger, level, lines);
  });
}

describe('Log capture functionality', () => {
  test('should capture log messages based on log level and nesting', () => {
    // Create a mock agent state
    const agentState: AgentState = {
      agentId: 'test-agent',
      goal: 'Test log capturing',
      prompt: 'Test prompt',
      output: '',
      capturedLogs: [],
      completed: false,
      context: {} as ToolContext,
      workingDirectory: '/test',
      tools: [],
      aborted: false,
      parentMessages: [],
    };

    // Create a logger hierarchy
    const mainLogger = new Logger({ name: 'main' });
    const agentLogger = new Logger({ name: 'agent', parent: mainLogger });
    const toolLogger = new Logger({ name: 'tool', parent: agentLogger });
    const deepToolLogger = new Logger({
      name: 'deep-tool',
      parent: toolLogger,
    });

    // Create the log capture listener
    const logCaptureListener = (
      logger: Logger,
      logLevel: LogLevel,
      lines: string[],
    ) => {
      // Only capture log, warn, and error levels (not debug or info)
      if (
        logLevel === LogLevel.log ||
        logLevel === LogLevel.warn ||
        logLevel === LogLevel.error
      ) {
        // Only capture logs from the agent and its immediate tools (not deeper than that)
        let isAgentOrImmediateTool = false;
        if (logger === agentLogger) {
          isAgentOrImmediateTool = true;
        } else if (logger.parent === agentLogger) {
          isAgentOrImmediateTool = true;
        }

        if (isAgentOrImmediateTool) {
          const logPrefix =
            logLevel === LogLevel.warn
              ? '[WARN] '
              : logLevel === LogLevel.error
                ? '[ERROR] '
                : '';

          // Add each line to the capturedLogs array with logger name for context
          lines.forEach((line) => {
            const loggerPrefix =
              logger.name !== 'agent' ? `[${logger.name}] ` : '';
            agentState.capturedLogs.push(`${logPrefix}${loggerPrefix}${line}`);
          });
        }
      }
    };

    // Add the listener to the agent logger
    agentLogger.listeners.push(logCaptureListener);

    // Emit log messages at different levels and from different loggers
    // We use our helper function to directly invoke the listeners
    emitLog(agentLogger, LogLevel.debug, 'Agent debug message');
    emitLog(agentLogger, LogLevel.info, 'Agent info message');
    emitLog(agentLogger, LogLevel.log, 'Agent log message');
    emitLog(agentLogger, LogLevel.warn, 'Agent warning message');
    emitLog(agentLogger, LogLevel.error, 'Agent error message');

    emitLog(toolLogger, LogLevel.log, 'Tool log message');
    emitLog(toolLogger, LogLevel.warn, 'Tool warning message');
    emitLog(toolLogger, LogLevel.error, 'Tool error message');

    emitLog(deepToolLogger, LogLevel.log, 'Deep tool log message');
    emitLog(deepToolLogger, LogLevel.warn, 'Deep tool warning message');

    // Verify captured logs
    console.log('Captured logs:', agentState.capturedLogs);

    // Verify that only the expected messages were captured
    // We should have 6 messages: 3 from agent (log, warn, error) and 3 from tools (log, warn, error)
    expect(agentState.capturedLogs.length).toBe(6);

    // Agent messages at log, warn, and error levels should be captured
    expect(
      agentState.capturedLogs.some((log) => log === 'Agent log message'),
    ).toBe(true);
    expect(
      agentState.capturedLogs.some(
        (log) => log === '[WARN] Agent warning message',
      ),
    ).toBe(true);
    expect(
      agentState.capturedLogs.some(
        (log) => log === '[ERROR] Agent error message',
      ),
    ).toBe(true);

    // Tool messages at log, warn, and error levels should be captured
    expect(
      agentState.capturedLogs.some((log) => log === '[tool] Tool log message'),
    ).toBe(true);
    expect(
      agentState.capturedLogs.some(
        (log) => log === '[WARN] [tool] Tool warning message',
      ),
    ).toBe(true);
    expect(
      agentState.capturedLogs.some(
        (log) => log === '[ERROR] [tool] Tool error message',
      ),
    ).toBe(true);

    // Debug and info messages should not be captured
    expect(agentState.capturedLogs.some((log) => log.includes('debug'))).toBe(
      false,
    );
    expect(agentState.capturedLogs.some((log) => log.includes('info'))).toBe(
      false,
    );
  });

  test('should handle nested loggers correctly', () => {
    // Create a mock agent state
    const agentState: AgentState = {
      agentId: 'test-agent',
      goal: 'Test log capturing',
      prompt: 'Test prompt',
      output: '',
      capturedLogs: [],
      completed: false,
      context: {} as ToolContext,
      workingDirectory: '/test',
      tools: [],
      aborted: false,
      parentMessages: [],
    };

    // Create a logger hierarchy
    const mainLogger = new Logger({ name: 'main' });
    const agentLogger = new Logger({ name: 'agent', parent: mainLogger });
    const toolLogger = new Logger({ name: 'tool', parent: agentLogger });
    const deepToolLogger = new Logger({
      name: 'deep-tool',
      parent: toolLogger,
    });

    // Create the log capture listener that filters based on nesting level
    const logCaptureListener = (
      logger: Logger,
      logLevel: LogLevel,
      lines: string[],
    ) => {
      // Only capture log, warn, and error levels
      if (
        logLevel === LogLevel.log ||
        logLevel === LogLevel.warn ||
        logLevel === LogLevel.error
      ) {
        // Check nesting level - only capture from agent and immediate tools
        if (logger.nesting <= 2) {
          // agent has nesting=1, immediate tools have nesting=2
          const logPrefix =
            logLevel === LogLevel.warn
              ? '[WARN] '
              : logLevel === LogLevel.error
                ? '[ERROR] '
                : '';

          lines.forEach((line) => {
            const loggerPrefix =
              logger.name !== 'agent' ? `[${logger.name}] ` : '';
            agentState.capturedLogs.push(`${logPrefix}${loggerPrefix}${line}`);
          });
        }
      }
    };

    // Add the listener to all loggers to test filtering by nesting
    mainLogger.listeners.push(logCaptureListener);

    // Log at different nesting levels
    emitLog(mainLogger, LogLevel.log, 'Main logger message'); // nesting = 0
    emitLog(agentLogger, LogLevel.log, 'Agent logger message'); // nesting = 1
    emitLog(toolLogger, LogLevel.log, 'Tool logger message'); // nesting = 2
    emitLog(deepToolLogger, LogLevel.log, 'Deep tool message'); // nesting = 3

    // We should capture from agent (nesting=1) and tool (nesting=2) but not deeper
    expect(agentState.capturedLogs.length).toBe(3);
    expect(
      agentState.capturedLogs.some((log) =>
        log.includes('Agent logger message'),
      ),
    ).toBe(true);
    expect(
      agentState.capturedLogs.some((log) =>
        log.includes('Tool logger message'),
      ),
    ).toBe(true);
    expect(
      agentState.capturedLogs.some((log) => log.includes('Deep tool message')),
    ).toBe(false);
  });
});
