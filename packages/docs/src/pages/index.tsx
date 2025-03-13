import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Heading from '@theme/Heading';
import Layout from '@theme/Layout';
import clsx from 'clsx';

import HomepageFeatures from '@site/src/components/HomepageFeatures';

import styles from './index.module.css';

import type { ReactNode } from 'react';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link className="button button--secondary button--lg" to="/docs">
            Get Started with MyCoder
          </Link>
        </div>
      </div>
    </header>
  );
}

function HomepageQuickStart() {
  return (
    <section className={styles.quickStart}>
      <div className="container">
        <div className="row">
          <div className="col col--6">
            <Heading as="h2">Quick Start</Heading>
            <p>
              Get up and running with MyCoder in minutes. MyCoder is an
              AI-powered coding assistant that helps you write better code
              faster.
            </p>
            <pre className={styles.codeBlock}>
              <code>
                # Install MyCoder globally
                <br />
                npm install -g mycoder
                <br />
                <br />
                # Use MyCoder with a prompt
                <br />
                mycoder &quot;Create a React component that displays a
                counter&quot;
              </code>
            </pre>
          </div>
          <div className="col col--6">
            <Heading as="h2">Popular Documentation</Heading>
            <ul className={styles.docsLinks}>
              <li>
                <Link to="/docs/getting-started/windows">Windows Setup</Link>
              </li>
              <li>
                <Link to="/docs/getting-started/macos">macOS Setup</Link>
              </li>
              <li>
                <Link to="/docs/getting-started/linux">Linux Setup</Link>
              </li>
              <li>
                <Link to="/docs/usage">Usage Guide</Link>
              </li>
              <li>
                <Link to="/blog">Latest Updates</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} - AI-Powered Coding Assistant`}
      description="MyCoder is an AI-powered coding assistant that helps developers write better code faster with context-aware code generation."
    >
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <HomepageQuickStart />
      </main>
    </Layout>
  );
}
