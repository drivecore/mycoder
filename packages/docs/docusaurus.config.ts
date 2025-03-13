import { themes as prismThemes } from 'prism-react-renderer';

import type * as Preset from '@docusaurus/preset-classic';
import type { Config } from '@docusaurus/types';
// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'MyCoder Documentation',
  tagline: 'Learn how to use MyCoder, the AI-powered coding assistant',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://docs.mycoder.ai',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'drivecore', // Usually your GitHub org/user name.
  projectName: 'mycoder', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/drivecore/mycoder/tree/main/packages/docs/',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/drivecore/mycoder/tree/main/packages/docs/',
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
          // Use short titles in blog sidebar
          blogSidebarTitle: 'Recent Posts',
          blogSidebarCount: 10,
          blogTitle: 'MyCoder Blog',
          postsPerPage: 5,
          blogListComponent: '@theme/BlogListPage',
          blogPostComponent: '@theme/BlogPostPage',
          blogTagsListComponent: '@theme/BlogTagsListPage',
          blogTagsPostsComponent: '@theme/BlogTagsPostsPage',
          rehypePlugins: [],
          beforeDefaultRemarkPlugins: [],
          beforeDefaultRehypePlugins: [],
          truncateMarker: /<!-- truncate -->/,
          // Custom sidebar item component is currently causing issues with the build
          // blogSidebarItemComponent: require.resolve('./src/components/BlogSidebarItem'),
        },
        theme: {
          customCss: './src/css/custom.css',
        },
        gtag: {
          trackingID: 'G-4G4NJBHVNF',
          anonymizeIP: true,
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      'docusaurus-plugin-sentry',
      {
        DSN: 'c928d425f7cf44cab41620de8f31fe57@o4508898407481344.ingest.us.sentry.io/4508935235698688',
        allEnvironments: false, // Only enable in production
        configuration: {
          script: {
            defer: true,
          },
        },
      },
    ],
  ],

  themeConfig: {
    colorMode: {
      disableSwitch: true,
      defaultMode: 'light',
    },
    navbar: {
      title: 'MyCoder Docs',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Intro',
        },
        {
          to: '/docs/getting-started/',
          label: 'Getting Started',
          position: 'left',
        },
        {
          to: '/docs/usage/',
          label: 'Usage',
          position: 'left',
        },
        {
          to: '/docs/examples/',
          label: 'Examples',
          position: 'left',
        },
        { to: '/blog', label: 'Blog', position: 'left' },
        {
          href: 'https://github.com/drivecore/mycoder',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/getting-started',
            },
            {
              label: 'Usage',
              to: '/docs/usage',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Discord',
              href: 'https://discord.gg/5K6TYrHGHt',
            },
            {
              label: 'X (Twitter)',
              href: 'https://twitter.com/mycoderAI',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Blog',
              to: '/blog',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/drivecore/mycoder',
            },
            {
              label: 'MyCoder.ai',
              href: 'https://mycoder.ai',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} <a href="https://drivecore.ai">DriveCore, Inc.</a> Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
