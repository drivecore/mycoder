# MyCoder Documentation

This package contains the official documentation for MyCoder, an AI-powered coding assistant. The documentation is built using [Docusaurus v3](https://docusaurus.io/), a modern static website generator maintained by Meta.

## What's Inside

### Documentation Structure

- **Core Documentation**
  - **Introduction**: Overview of MyCoder and its capabilities
  - **Getting Started**: Platform-specific setup instructions for Windows, macOS, and Linux
  - **Usage Guides**: Detailed information on features, configuration, and capabilities
  - **Examples**: Practical examples of using MyCoder for different scenarios
  - **Providers**: Information about supported AI providers (OpenAI, Anthropic, Ollama, XAI)

- **Blog**: Updates, tutorials, and insights about MyCoder and AI-assisted development

### Technical Structure

- **docs/**: Contains all markdown documentation files organized by topic
- **blog/**: Contains blog posts with release notes and usage tips
- **src/**: Custom React components and CSS for the documentation site
  - **components/**: Custom React components for the site
  - **css/**: Custom styling
  - **pages/**: Custom pages including the home page
- **static/**: Static assets like images and icons
- **.docusaurus/**: Build cache (gitignored)
- **build/**: Output directory for the built documentation site

## Features

- **Responsive Design**: Works on desktop and mobile devices
- **Search Functionality**: Built-in search for documentation
- **Versioning Support**: Ability to maintain documentation for different versions
- **Blog with RSS Feed**: Integrated blog with RSS support
- **Analytics Integration**: Google Analytics for tracking site usage
- **Error Tracking**: Sentry integration for monitoring errors
- **Docker Deployment**: Containerized deployment option

## Development

### Prerequisites

- Node.js version 18.0 or above
- pnpm (recommended package manager)

### Local Development

```bash
# Navigate to the docs package
cd packages/docs

# Install dependencies
pnpm install

# Start the development server
pnpm start
# or
pnpm dev
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```bash
# Generate static content
pnpm build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Serve Built Site Locally

```bash
# Serve the built website locally
pnpm serve
```

### Other Commands

```bash
# Clean the build cache
pnpm clean

# Clean everything including node_modules
pnpm clean:all

# Type checking
pnpm typecheck

# Generate translations
pnpm write-translations

# Generate heading IDs
pnpm write-heading-ids
```

## Docker Deployment

The documentation site can be deployed using Docker:

```bash
# Build the Docker image
docker build -t mycoder-docs .

# Run the container
docker run -p 8080:8080 mycoder-docs
```

## Continuous Deployment

The documentation site is automatically deployed when changes are pushed to the `docs-release` branch. The deployment process uses semantic-release for versioning and release management.

## Contributing

We welcome contributions to improve the documentation:

1. Create a feature branch (`git checkout -b feature/amazing-improvement`)
2. Make your changes
3. Commit your changes following [Conventional Commits](https://www.conventionalcommits.org/) format
4. Push to the branch (`git push origin feature/amazing-improvement`)
5. Open a Pull Request

### Adding New Documentation

1. Create markdown files in the appropriate directory under `docs/`
2. The sidebar is automatically generated based on the file structure
3. Use front matter to customize the page title, description, and other metadata

### Adding Blog Posts

Create new markdown files in the `blog/` directory with the following front matter:

```markdown
---
slug: your-post-slug
title: Your Post Title
authors: [yourname]
tags: [tag1, tag2]
---

Your content here...

<!-- truncate -->

More content here (this part won't appear in the blog list preview)
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

If you have questions or feedback, please join our [Discord community](https://discord.gg/5K6TYrHGHt) or follow us on [X (Twitter)](https://twitter.com/mycoderAI).

## Links

- [MyCoder Website](https://mycoder.ai)
- [GitHub Repository](https://github.com/drivecore/mycoder)
- [Documentation Site](https://docs.mycoder.ai)