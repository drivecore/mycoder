import { execSync } from 'child_process';
import * as fsSync from 'fs';
import * as fs from 'fs/promises';
import * as path from 'path';

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { Tool } from '../../core/types.js';

const OUTPUT_LIMIT = 10 * 1024; // 10KB limit

// Store file states for undo functionality
const fileStateHistory: Record<string, string[]> = {};

const parameterSchema = z.object({
  command: z
    .enum(['view', 'create', 'str_replace', 'insert', 'undo_edit'])
    .describe(
      'The commands to run. Allowed options are: `view`, `create`, `str_replace`, `insert`, `undo_edit`.',
    ),
  path: z
    .string()
    .describe(
      'Absolute path to file or directory, e.g. `/repo/file.py` or `/repo`.',
    ),
  file_text: z
    .string()
    .optional()
    .describe(
      'Required parameter of `create` command, with the content of the file to be created.',
    ),
  insert_line: z
    .number()
    .optional()
    .describe(
      'Required parameter of `insert` command. The `new_str` will be inserted AFTER the line `insert_line` of `path`.',
    ),
  new_str: z
    .string()
    .optional()
    .describe(
      'Optional parameter of `str_replace` command containing the new string (if not given, no string will be added). Required parameter of `insert` command containing the string to insert.',
    ),
  old_str: z
    .string()
    .optional()
    .describe(
      'Required parameter of `str_replace` command containing the string in `path` to replace.',
    ),
  view_range: z
    .array(z.number())
    .optional()
    .describe(
      'Optional parameter of `view` command when `path` points to a file. If none is given, the full file is shown. If provided, the file will be shown in the indicated line number range, e.g. [11, 12] will show lines 11 and 12. Indexing at 1 to start. Setting `[start_line, -1]` shows all lines from `start_line` to the end of the file.',
    ),
  description: z
    .string()
    .describe('The reason you are using the text editor (max 80 chars)'),
});

const returnSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  content: z.string().optional(),
});

type Parameters = z.infer<typeof parameterSchema>;
type ReturnType = z.infer<typeof returnSchema>;

export const textEditorTool: Tool<Parameters, ReturnType> = {
  name: 'textEditor',
  description:
    'View, create, and edit files with persistent state across command calls',
  logPrefix: '📝',
  parameters: parameterSchema,
  returns: returnSchema,
  parametersJsonSchema: zodToJsonSchema(parameterSchema),
  returnsJsonSchema: zodToJsonSchema(returnSchema),
  execute: async (
    {
      command,
      path: filePath,
      file_text,
      insert_line,
      new_str,
      old_str,
      view_range,
    },
    context,
  ) => {
    const normalizedPath = path.normalize(filePath);
    const absolutePath = path.isAbsolute(normalizedPath)
      ? normalizedPath
      : context?.workingDirectory
        ? path.join(context.workingDirectory, normalizedPath)
        : path.resolve(normalizedPath);

    switch (command) {
      case 'view': {
        // Check if path is a directory
        const stats = await fs.stat(absolutePath).catch(() => null);
        if (!stats) {
          throw new Error(`File or directory not found: ${filePath}`);
        }

        if (stats.isDirectory()) {
          // List directory contents up to 2 levels deep
          try {
            const output = execSync(
              `find "${absolutePath}" -type f -not -path "*/\\.*" -maxdepth 2 | sort`,
              { encoding: 'utf8' },
            );
            return {
              success: true,
              message: `Directory listing for ${filePath}:`,
              content: output,
            };
          } catch (error) {
            throw new Error(`Error listing directory: ${error}`);
          }
        } else {
          // Read file content
          const content = await fs.readFile(absolutePath, 'utf8');
          const lines = content.split('\n');

          // Apply view range if specified
          let displayContent = content;
          if (view_range && view_range.length === 2) {
            const [start, end] = view_range;
            const startLine = Math.max(1, start || 1) - 1; // Convert to 0-indexed
            const endLine = end === -1 ? lines.length : end;
            displayContent = lines.slice(startLine, endLine).join('\n');
          }

          // Add line numbers
          const startLineNum =
            view_range && view_range.length === 2 ? view_range[0] : 1;
          const numberedContent = displayContent
            .split('\n')
            .map((line, i) => `${(startLineNum || 1) + i}: ${line}`)
            .join('\n');

          // Truncate if too large
          if (numberedContent.length > OUTPUT_LIMIT) {
            const truncatedContent = numberedContent.substring(0, OUTPUT_LIMIT);
            return {
              success: true,
              message: `File content (truncated):`,
              content: `${truncatedContent}\n<response clipped>`,
            };
          }

          return {
            success: true,
            message: `File content:`,
            content: numberedContent,
          };
        }
      }

      case 'create': {
        // Check if file already exists
        if (fsSync.existsSync(absolutePath)) {
          throw new Error(
            `File already exists: ${filePath}. Use str_replace to modify it.`,
          );
        }

        if (!file_text) {
          throw new Error('file_text parameter is required for create command');
        }

        // Create parent directories if they don't exist
        await fs.mkdir(path.dirname(absolutePath), { recursive: true });

        // Create the file
        await fs.writeFile(absolutePath, file_text, 'utf8');

        // Store initial state for undo
        fileStateHistory[absolutePath] = [file_text];

        return {
          success: true,
          message: `File created: ${filePath}`,
        };
      }

      case 'str_replace': {
        if (!old_str) {
          throw new Error(
            'old_str parameter is required for str_replace command',
          );
        }

        // Ensure the file exists
        if (!fsSync.existsSync(absolutePath)) {
          throw new Error(`File not found: ${filePath}`);
        }

        // Read the current content
        const content = await fs.readFile(absolutePath, 'utf8');

        // Check if old_str exists uniquely in the file
        const occurrences = content.split(old_str).length - 1;
        if (occurrences === 0) {
          throw new Error(`The specified old_str was not found in the file`);
        }
        if (occurrences > 1) {
          throw new Error(
            `Found ${occurrences} occurrences of old_str, expected exactly 1`,
          );
        }

        // Save current state for undo
        if (!fileStateHistory[absolutePath]) {
          fileStateHistory[absolutePath] = [];
        }
        fileStateHistory[absolutePath].push(content);

        // Replace the content
        const updatedContent = content.replace(old_str, new_str || '');
        await fs.writeFile(absolutePath, updatedContent, 'utf8');

        return {
          success: true,
          message: `Successfully replaced text in ${filePath}`,
        };
      }

      case 'insert': {
        if (insert_line === undefined) {
          throw new Error(
            'insert_line parameter is required for insert command',
          );
        }

        if (!new_str) {
          throw new Error('new_str parameter is required for insert command');
        }

        // Ensure the file exists
        if (!fsSync.existsSync(absolutePath)) {
          throw new Error(`File not found: ${filePath}`);
        }

        // Read the current content
        const content = await fs.readFile(absolutePath, 'utf8');
        const lines = content.split('\n');

        // Validate line number
        if (insert_line < 0 || insert_line > lines.length) {
          throw new Error(
            `Invalid line number: ${insert_line}. File has ${lines.length} lines.`,
          );
        }

        // Save current state for undo
        if (!fileStateHistory[absolutePath]) {
          fileStateHistory[absolutePath] = [];
        }
        fileStateHistory[absolutePath].push(content);

        // Insert the new content after the specified line
        lines.splice(insert_line, 0, new_str);
        const updatedContent = lines.join('\n');
        await fs.writeFile(absolutePath, updatedContent, 'utf8');

        return {
          success: true,
          message: `Successfully inserted text after line ${insert_line} in ${filePath}`,
        };
      }

      case 'undo_edit': {
        // Check if we have history for this file
        if (
          !fileStateHistory[absolutePath] ||
          fileStateHistory[absolutePath].length === 0
        ) {
          throw new Error(`No edit history found for ${filePath}`);
        }

        // Get the previous state
        const previousState = fileStateHistory[absolutePath].pop();
        await fs.writeFile(absolutePath, previousState as string, 'utf8');

        return {
          success: true,
          message: `Successfully reverted last edit to ${filePath}`,
        };
      }

      default:
        throw new Error(`Unknown command: ${command}`);
    }
  },
  logParameters: (input, { logger }) => {
    logger.info(
      `${input.command} operation on "${input.path}", ${input.description}`,
    );
  },
  logReturns: (result, { logger }) => {
    if (!result.success) {
      logger.error(`Text editor operation failed: ${result.message}`);
    }
  },
};
