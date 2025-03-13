import Link from '@docusaurus/Link';
import React from 'react';

import styles from './styles.module.css';

export default function BlogSidebarItem({ permalink, title, shortTitle }) {
  // Use shortTitle if available, otherwise use title
  const displayTitle = shortTitle || title;

  return (
    <Link to={permalink} className={styles.sidebarItemLink}>
      {displayTitle}
    </Link>
  );
}
