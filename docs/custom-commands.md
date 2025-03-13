# Custom CLI Commands

MyCoder allows you to define custom CLI commands in your `mycoder.config.js` file. These commands can have arguments and will execute predefined prompts using JavaScript functions.

## Configuration

To add custom commands, add a `commands` section to your `mycoder.config.js` file:

```js
// mycoder.config.js
export default {
  // ... other config options

  // Custom commands
  commands: {
    search: {
      description: 'Search for a term in the codebase',
      args: [{ name: 'term', description: 'Search term', required: true }],
      execute: (args) => {
        return `Find all instances of ${args.term} in the codebase and suggest improvements`;
      },
    },

    'fix-issue': {
      description: 'Fix a GitHub issue',
      args: [
        { name: 'issue', description: 'Issue number', required: true },
        { name: 'scope', description: 'Scope of the fix', default: 'full' },
      ],
      execute: (args) => {
        return `Analyze GitHub issue #${args.issue} and implement a ${args.scope} fix`;
      },
    },
  },
};
```

## Command Structure

Each command in the `commands` object has the following properties:

- `description` (optional): A description of what the command does
- `args` (optional): An array of argument definitions
  - `name`: The name of the argument
  - `description` (optional): A description of the argument
  - `required` (optional): Whether the argument is required (default: false)
  - `default` (optional): Default value for the argument if not provided
- `execute` (required): A function that takes the arguments and returns a prompt string

## Using Commands

Once defined in your config file, you can use your custom commands like any other MyCoder command:

```bash
# Using the search command
mycoder search "deprecated API"

# Using the fix-issue command with all arguments
mycoder fix-issue 123 --scope partial

# Using the fix-issue command with default scope
mycoder fix-issue 123
```

## Advanced Usage

The `execute` function can also be asynchronous, allowing you to fetch data or perform other async operations before generating the prompt:

```js
"github-pr": {
  description: "Review a GitHub PR",
  args: [
    { name: "repo", description: "Repository name", required: true },
    { name: "pr", description: "PR number", required: true }
  ],
  execute: async (args) => {
    // You could fetch PR details here if needed
    return `Review GitHub PR #${args.pr} in repository ${args.repo} and provide feedback`;
  }
}
```

## Command Naming

Command names must:

- Start with a letter
- Contain only letters, numbers, hyphens, and underscores

## Limitations

- Custom commands cannot override built-in commands
- The `execute` function must return a string (the prompt to execute)
