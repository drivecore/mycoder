import { randomUUID } from 'crypto';
import { mkdtemp, readFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { ToolContext } from '../../core/types.js';
import { getMockToolContext } from '../getTools.test.js';
import { shellExecuteTool } from '../system/shellExecute.js';

import { textEditorTool } from './textEditor.js';

const toolContext: ToolContext = getMockToolContext();

describe('textEditor', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'texteditor-test-'));
  });

  afterEach(async () => {
    await shellExecuteTool.execute(
      { command: `rm -rf "${testDir}"`, description: 'test' },
      toolContext,
    );
  });

  it('should create a file', async () => {
    const testContent = 'test content';
    const testPath = join(testDir, `${randomUUID()}.txt`);

    // Create the file
    const result = await textEditorTool.execute(
      {
        command: 'create',
        path: testPath,
        file_text: testContent,
        description: 'test',
      },
      toolContext,
    );

    // Verify return value
    expect(result.success).toBe(true);
    expect(result.message).toContain('File created');

    // Verify content
    const content = await readFile(testPath, 'utf8');
    expect(content).toBe(testContent);
  });

  it('should view a file', async () => {
    const testContent = 'line 1\nline 2\nline 3';
    const testPath = join(testDir, `${randomUUID()}.txt`);

    // Create the file
    await textEditorTool.execute(
      {
        command: 'create',
        path: testPath,
        file_text: testContent,
        description: 'test',
      },
      toolContext,
    );

    // View the file
    const result = await textEditorTool.execute(
      {
        command: 'view',
        path: testPath,
        description: 'test',
      },
      toolContext,
    );

    // Verify return value
    expect(result.success).toBe(true);
    expect(result.content).toContain('1: line 1');
    expect(result.content).toContain('2: line 2');
    expect(result.content).toContain('3: line 3');
  });

  it('should view a file with range', async () => {
    const testContent = 'line 1\nline 2\nline 3\nline 4\nline 5';
    const testPath = join(testDir, `${randomUUID()}.txt`);

    // Create the file
    await textEditorTool.execute(
      {
        command: 'create',
        path: testPath,
        file_text: testContent,
        description: 'test',
      },
      toolContext,
    );

    // View the file with range
    const result = await textEditorTool.execute(
      {
        command: 'view',
        path: testPath,
        view_range: [2, 4],
        description: 'test',
      },
      toolContext,
    );

    // Verify return value
    expect(result.success).toBe(true);
    expect(result.content).not.toContain('1: line 1');
    expect(result.content).toContain('2: line 2');
    expect(result.content).toContain('3: line 3');
    expect(result.content).toContain('4: line 4');
    expect(result.content).not.toContain('5: line 5');
  });

  it('should replace text in a file', async () => {
    const initialContent = 'Hello world! This is a test.';
    const oldStr = 'world';
    const newStr = 'universe';
    const expectedContent = 'Hello universe! This is a test.';
    const testPath = join(testDir, `${randomUUID()}.txt`);

    // Create initial file
    await textEditorTool.execute(
      {
        command: 'create',
        path: testPath,
        file_text: initialContent,
        description: 'test',
      },
      toolContext,
    );

    // Replace text
    const result = await textEditorTool.execute(
      {
        command: 'str_replace',
        path: testPath,
        old_str: oldStr,
        new_str: newStr,
        description: 'test',
      },
      toolContext,
    );

    // Verify return value
    expect(result.success).toBe(true);
    expect(result.message).toContain('Successfully replaced');

    // Verify content
    const content = await readFile(testPath, 'utf8');
    expect(content).toBe(expectedContent);
  });

  it('should insert text at a specific line', async () => {
    const initialContent = 'line 1\nline 2\nline 4';
    const insertLine = 2; // After "line 2"
    const newStr = 'line 3';
    const expectedContent = 'line 1\nline 2\nline 3\nline 4';
    const testPath = join(testDir, `${randomUUID()}.txt`);

    // Create initial file
    await textEditorTool.execute(
      {
        command: 'create',
        path: testPath,
        file_text: initialContent,
        description: 'test',
      },
      toolContext,
    );

    // Insert text
    const result = await textEditorTool.execute(
      {
        command: 'insert',
        path: testPath,
        insert_line: insertLine,
        new_str: newStr,
        description: 'test',
      },
      toolContext,
    );

    // Verify return value
    expect(result.success).toBe(true);
    expect(result.message).toContain('Successfully inserted');

    // Verify content
    const content = await readFile(testPath, 'utf8');
    expect(content).toBe(expectedContent);
  });

  it('should undo an edit', async () => {
    const initialContent = 'Hello world!';
    const modifiedContent = 'Hello universe!';
    const testPath = join(testDir, `${randomUUID()}.txt`);

    // Create initial file
    await textEditorTool.execute(
      {
        command: 'create',
        path: testPath,
        file_text: initialContent,
        description: 'test',
      },
      toolContext,
    );

    // Modify the file
    await textEditorTool.execute(
      {
        command: 'str_replace',
        path: testPath,
        old_str: 'world',
        new_str: 'universe',
        description: 'test',
      },
      toolContext,
    );

    // Verify modified content
    let content = await readFile(testPath, 'utf8');
    expect(content).toBe(modifiedContent);

    // Undo the edit
    const result = await textEditorTool.execute(
      {
        command: 'undo_edit',
        path: testPath,
        description: 'test',
      },
      toolContext,
    );

    // Verify return value
    expect(result.success).toBe(true);
    expect(result.message).toContain('Successfully reverted');

    // Verify content is back to initial
    content = await readFile(testPath, 'utf8');
    expect(content).toBe(initialContent);
  });

  it('should handle errors for non-existent files', async () => {
    const testPath = join(testDir, `${randomUUID()}.txt`);

    // Try to view a non-existent file
    await expect(async () => {
      await textEditorTool.execute(
        {
          command: 'view',
          path: testPath,
          description: 'test',
        },
        toolContext,
      );
    }).rejects.toThrow(/not found/);
  });

  it('should handle errors for duplicate string replacements', async () => {
    const initialContent = 'Hello world! This is a world test.';
    const oldStr = 'world';
    const newStr = 'universe';
    const testPath = join(testDir, `${randomUUID()}.txt`);

    // Create initial file
    await textEditorTool.execute(
      {
        command: 'create',
        path: testPath,
        file_text: initialContent,
        description: 'test',
      },
      toolContext,
    );

    // Try to replace text with multiple occurrences
    await expect(async () => {
      await textEditorTool.execute(
        {
          command: 'str_replace',
          path: testPath,
          old_str: oldStr,
          new_str: newStr,
          description: 'test',
        },
        toolContext,
      );
    }).rejects.toThrow(/Found 2 occurrences/);
  });

  it('should overwrite an existing file with create command', async () => {
    const initialContent = 'Initial content';
    const newContent = 'New content that overwrites the file';
    const testPath = join(testDir, `${randomUUID()}.txt`);

    // Create initial file
    await textEditorTool.execute(
      {
        command: 'create',
        path: testPath,
        file_text: initialContent,
        description: 'test',
      },
      toolContext,
    );

    // Verify initial content
    let content = await readFile(testPath, 'utf8');
    expect(content).toBe(initialContent);

    // Overwrite the file using create command
    const result = await textEditorTool.execute(
      {
        command: 'create',
        path: testPath,
        file_text: newContent,
        description: 'test',
      },
      toolContext,
    );

    // Verify return value
    expect(result.success).toBe(true);
    expect(result.message).toContain('File overwritten');

    // Verify content has been updated
    content = await readFile(testPath, 'utf8');
    expect(content).toBe(newContent);
  });

  it('should be able to undo file overwrite', async () => {
    const initialContent = 'Initial content that will be restored';
    const overwrittenContent = 'This content will be undone';
    const testPath = join(testDir, `${randomUUID()}.txt`);

    // Create initial file
    await textEditorTool.execute(
      {
        command: 'create',
        path: testPath,
        file_text: initialContent,
        description: 'test',
      },
      toolContext,
    );

    // Overwrite the file
    await textEditorTool.execute(
      {
        command: 'create',
        path: testPath,
        file_text: overwrittenContent,
        description: 'test',
      },
      toolContext,
    );

    // Verify overwritten content
    let content = await readFile(testPath, 'utf8');
    expect(content).toBe(overwrittenContent);

    // Undo the overwrite
    const result = await textEditorTool.execute(
      {
        command: 'undo_edit',
        path: testPath,
        description: 'test',
      },
      toolContext,
    );

    // Verify return value
    expect(result.success).toBe(true);
    expect(result.message).toContain('Successfully reverted');

    // Verify content is back to initial
    content = await readFile(testPath, 'utf8');
    expect(content).toBe(initialContent);
  });
});
