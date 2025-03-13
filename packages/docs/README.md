# MyCoder Documentation

This package contains the official documentation for MyCoder, an AI-powered coding assistant. The documentation is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

## What's Inside

- **Product Documentation**: Comprehensive guides on how to use MyCoder
- **Getting Started**: Platform-specific setup instructions for Windows, macOS, and Linux
- **Usage Guides**: Detailed information on features and capabilities
- **Blog**: Updates, tutorials, and insights about MyCoder

## Development

### Prerequisites

- Node.js version 18.0 or above
- pnpm (recommended)

### Local Development

```bash
# Navigate to the docs package
cd packages/docs

# Start the development server
pnpm start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```bash
# Generate static content
pnpm build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Deployment

The documentation site is automatically deployed when changes are pushed to the `docs-release` branch.

## Contributing

We welcome contributions to improve the documentation:

1. Create a feature branch (`git checkout -b feature/amazing-improvement`)
2. Make your changes
3. Commit your changes (`git commit -m 'Add some amazing improvement'`)
4. Push to the branch (`git push origin feature/amazing-improvement`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

If you have questions or feedback, please join our [Discord community](https://discord.gg/5K6TYrHGHt).
