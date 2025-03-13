---
sidebar_position: 1
---

# Windows Setup

This guide will help you set up MyCoder on Windows.

## Prerequisites

1. **Node.js**: Install Node.js version 20.0.0 or higher
   
   > **⚠️ Important:** MyCoder requires Node.js runtime to function properly.
   
   **Recommended: Using NVM for Windows (Node Version Manager)**
   
   NVM for Windows is the preferred way to install Node.js as it allows for easy version management.
   
   Visit [NVM for Windows releases](https://github.com/coreybutler/nvm-windows/releases) and download the latest nvm-setup.exe file.
   
   After installation:
   
   ```
   # Open a new Command Prompt and install Node.js
   nvm install lts
   
   # Set it as default
   nvm use lts
   
   # Verify installation
   node --version
   ```
   
   **Alternative: Direct download**
   - Download from [nodejs.org](https://nodejs.org/)
   - Run the installer and follow the prompts
   - Verify installation with `node --version`

2. **Git**: Install Git for Windows
   - Download from [git-scm.com](https://git-scm.com/download/win)
   - Verify installation with `git --version`

3. **GitHub CLI**: Command-line tool for interacting with GitHub
   - Download from [cli.github.com](https://cli.github.com/)
   - Run the installer and follow the prompts
   - Verify installation with `gh --version`
   - Authenticate with GitHub:
     ```
     gh auth login
     ```
   
   The GitHub CLI makes it easy to:
   - Create and manage issues
   - Create and review pull requests
   - Clone repositories
   - Manage GitHub workflows
   
   This is especially useful if you plan to contribute to MyCoder or related projects.
   
   **Enable GitHub Mode in MyCoder**:
   
   After installing the GitHub CLI, enable GitHub mode in MyCoder for enhanced GitHub integration by creating a configuration file:
   
   ```javascript
   // mycoder.config.js
   export default {
     githubMode: true,
   };
   ```
   
   Or by using the CLI option for a single session:
   
   ```
   mycoder --githubMode true "Your prompt here"
   ```
   
   With GitHub mode enabled, MyCoder can create issues, branches, and pull requests directly through the GitHub CLI.

## Installation

Install MyCoder globally using npm:

```bash
npm install -g mycoder
```

Or use it directly with npx:

```bash
npx mycoder "Your prompt here"
```

## Environment Setup

### Setting up API keys

1. **Temporary Environment Variables**:

   From the command prompt (CMD):
   ```
   set ANTHROPIC_API_KEY=your-api-key
   ```
   In a PowerShell session:
   ```
   $env:ANTHROPIC_API_KEY="your-api-key"
   ```
   
3. **Persistent Environment Variables**:
   - Right-click on "This PC" or "My Computer"
   - Select "Properties"
   - Click "Advanced system settings"
   - Click "Environment Variables"
   - Under "User variables", click "New"
   - Add your API key (e.g., ANTHROPIC_API_KEY as variable name)

4. **Using .env File**:
   - Create a file named `.env` in your project directory
   - Add your API key: `ANTHROPIC_API_KEY=your-api-key`

## Browser Integration

MyCoder can use a browser for research. On Windows:

1. **Chrome/Edge**: MyCoder works with both browsers automatically
2. **First Run**: You may see a browser window open briefly when MyCoder is first run
3. **Headless Mode**: By default, browser windows are hidden (use `--headless false` to show them)

## Troubleshooting

### Common Issues

- **Permission Errors**: Run Command Prompt or PowerShell as Administrator
- **Node Version**: Ensure you're using Node.js 20+
- **Path Issues**: Make sure npm global bin directory is in your PATH

If you encounter any other issues, please check our [Discord community](https://discord.gg/5K6TYrHGHt) for help.
