---
sidebar_position: 3
---

# Performance Profiling

MyCoder includes a performance profiling feature that helps you understand startup times and identify potential bottlenecks. This is particularly useful for diagnosing performance differences between operating systems or environments.

## Enabling Profiling

You can enable performance profiling in two ways:

### 1. For a Single Session

Use the `--profile` flag with any MyCoder command:

```bash
# Enable profiling for a specific command
mycoder --profile "Fix the build errors"

# Or with other commands
mycoder --profile --interactive
```

### 2. As Default Behavior

Set profiling as the default behavior in your configuration file:

```javascript
// mycoder.config.js
export default {
  profile: true,
};
```

## Understanding Profiling Output

When profiling is enabled, MyCoder will output detailed timing information at the beginning of each session:

```
📊 Performance Profile:
=======================
Module initialization: 10.12ms (10.12ms)
After imports: 150.34ms (140.22ms)
Main function start: 269.99ms (119.65ms)
After dotenv config: 270.10ms (0.11ms)
After Sentry init: 297.57ms (27.48ms)
Before package.json load: 297.57ms (0.00ms)
After package.json load: 297.78ms (0.21ms)
Before yargs setup: 297.78ms (0.00ms)
After yargs setup: 401.45ms (103.67ms)
Total startup time: 401.45ms
=======================
```

The profiling output shows:

- **Absolute times**: The total elapsed time since the start of the process
- **Relative times** (in parentheses): The time taken by each specific step

## Reporting Performance Issues

If you encounter significant performance problems, please report them on our [Discord server](https://discord.gg/5K6TYrHGHt) with:

1. Your operating system and version
2. Node.js version (`node --version`)
3. The complete profiling output
4. Any relevant hardware details (CPU, RAM, disk type)