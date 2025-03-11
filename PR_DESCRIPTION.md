# Implement Hierarchical Configuration System

This PR implements a hierarchical configuration system for the mycoder CLI with 4 levels of precedence:

1. CLI options (highest precedence)
2. Project-level config (.mycoder/config.json in current directory)
3. Global config (~/.mycoder/config.json)
4. Default values (lowest precedence)

## Changes

- Enhanced `settings.ts` to support both global and project-level config directories
- Refactored `config.ts` to implement hierarchical configuration merging
- Updated the `config` command to support the `--global` / `-g` flag for storing settings at the global level
- Added enhanced display of config sources in the `list` and `get` commands
- Added tests for the hierarchical configuration system

## Usage Examples

```bash
# Set a project-level config (default)
mycoder config set githubMode true

# Set a global config
mycoder config set model claude-3-opus --global
# or using the short flag
mycoder config set provider anthropic -g

# List all settings (showing merged config with source indicators)
mycoder config list

# List only global settings
mycoder config list --global

# Get a specific setting (showing source)
mycoder config get model

# Clear a setting at project level
mycoder config clear githubMode

# Clear a setting at global level
mycoder config clear model --global

# Clear all project settings
mycoder config clear --all

# Clear all global settings
mycoder config clear --all --global
```

## Implementation Details

The configuration system now uses the [deepmerge](https://github.com/TehShrike/deepmerge) package to properly merge configuration objects from different levels. When retrieving configuration, it starts with the defaults and progressively applies global, project, and CLI options.

When displaying configuration, the system now shows the source of each setting (project, global, or default) to make it clear where each value is coming from.

## Testing

Added unit tests to verify the hierarchical configuration system works as expected.
