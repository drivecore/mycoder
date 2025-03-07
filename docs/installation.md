---
title: MyCoder Installation Guide for macOS and Linux
shortTitle: Installation Guide
date: 2025-03-07
author: MyCoder Team
excerpt: Detailed instructions for installing MyCoder on macOS and Linux systems, including Node.js setup using NVM.
topics: installation, macos, linux, nodejs, nvm
readTimeMinutes: 5
---

# MyCoder Installation Guide for macOS and Linux

This guide provides detailed instructions for installing MyCoder on macOS and Linux operating systems. We'll cover how to install Node.js using NVM (Node Version Manager) and then install the MyCoder CLI.

## Prerequisites

Before installing MyCoder, make sure your system meets the following requirements:

- macOS 10.15+ or Linux (Ubuntu, Debian, CentOS, Fedora, etc.)
- Terminal access
- Internet connection
- Basic command-line knowledge

## Installing Node.js with NVM (Recommended)

Using NVM (Node Version Manager) is the recommended way to install Node.js as it allows you to easily switch between different Node.js versions.

### 1. Install NVM

#### macOS and Linux

Open your terminal and run the following command:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

Or using wget:

```bash
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

After installation, you'll need to close and reopen your terminal, or run the following to use NVM right away:

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
```

To verify that NVM is installed, run:

```bash
nvm --version
```

### 2. Install Node.js

MyCoder requires Node.js version 20.0.0 or later. Install it using NVM:

```bash
nvm install 20
nvm use 20
```

To verify the installation, run:

```bash
node --version
```

This should display a version number that starts with `v20.x.x`.

## Alternative: Direct Node.js Installation

If you prefer not to use NVM, you can install Node.js directly.

### macOS

1. Using Homebrew (recommended for macOS):

```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node
```

2. Using the official installer:
   - Download the macOS installer from [Node.js official website](https://nodejs.org/)
   - Run the installer and follow the instructions

### Linux

#### Ubuntu/Debian:

```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
sudo apt-get install -y nodejs
```

#### CentOS/RHEL/Fedora:

```bash
# Add NodeSource repository
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -

# Install Node.js
sudo yum install -y nodejs
```

#### Arch Linux:

```bash
sudo pacman -S nodejs npm
```

## Installing MyCoder

Once Node.js is installed, you can install MyCoder globally using npm:

```bash
npm install -g mycoder
```

To verify the installation, run:

```bash
mycoder --version
```

This should display the current version of MyCoder.

## Setting Up API Keys

MyCoder requires an API key from your chosen AI provider. You can set this up using environment variables:

```bash
# For Anthropic (recommended)
export ANTHROPIC_API_KEY=your-api-key

# Or for OpenAI
export OPENAI_API_KEY=your-api-key

# Or for Mistral AI
export MISTRAL_API_KEY=your-api-key

# Or for xAI/Grok
export XAI_API_KEY=your-api-key
```

To make these environment variables persistent, add them to your shell profile file:

### For Bash (macOS and Linux)

```bash
echo 'export ANTHROPIC_API_KEY=your-api-key' >> ~/.bashrc
source ~/.bashrc
```

### For Zsh (default on macOS)

```bash
echo 'export ANTHROPIC_API_KEY=your-api-key' >> ~/.zshrc
source ~/.zshrc
```

Alternatively, you can create a `.env` file in your working directory with the appropriate key:

```
ANTHROPIC_API_KEY=your-api-key
```

## GitHub Integration (Optional)

If you plan to use MyCoder's GitHub integration, you'll need to install the GitHub CLI (`gh`):

### macOS

```bash
brew install gh
```

### Linux

#### Ubuntu/Debian:

```bash
# Add the GitHub CLI repository
type -p curl >/dev/null || (sudo apt update && sudo apt install curl -y)
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
&& sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg \
&& echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
&& sudo apt update \
&& sudo apt install gh -y
```

#### Fedora/CentOS/RHEL:

```bash
sudo dnf install gh
```

#### Arch Linux:

```bash
sudo pacman -S github-cli
```

After installation, authenticate with GitHub:

```bash
gh auth login
```

Follow the interactive prompts to complete the authentication process.

## Basic Usage

Once installed, you can start using MyCoder:

```bash
# Interactive mode
mycoder -i

# Run with a prompt
mycoder "Implement a React component that displays a list of items"

# Enable GitHub mode
mycoder config set githubMode true
```

For more detailed usage instructions, see the [MyCoder Usage Guide](usage.md).

## Troubleshooting

### Common Issues on macOS

1. **Permission Errors**: If you encounter permission errors when installing packages globally:

```bash
sudo npm install -g mycoder
```

2. **Command Not Found**: If the `mycoder` command is not found after installation, check your PATH:

```bash
echo $PATH
```

Ensure that the npm global bin directory is in your PATH. You can add it with:

```bash
echo 'export PATH="$PATH:$(npm config get prefix)/bin"' >> ~/.zshrc
source ~/.zshrc
```

### Common Issues on Linux

1. **Missing Dependencies**: If you encounter missing dependencies:

```bash
# For Ubuntu/Debian
sudo apt-get install -y build-essential

# For CentOS/RHEL/Fedora
sudo yum group install "Development Tools"
```

2. **Node.js Version Conflicts**: If you have multiple Node.js versions installed:

```bash
# Use NVM to switch to the correct version
nvm use 20
```

## Getting Help

If you encounter any issues during installation or usage:

- Check the [MyCoder documentation](https://github.com/drivecore/mycoder/tree/main/docs)
- Join the [MyCoder Discord community](https://discord.gg/5K6TYrHGHt) for support
- Open an issue on the [GitHub repository](https://github.com/drivecore/mycoder/issues)