#!/usr/bin/env node

/* eslint-env node */

import fs from 'fs';
import path from 'path';

const ROOT_DIR = path.resolve('.');
const PACKAGES_DIR = path.join(ROOT_DIR, 'packages');

console.log('Starting verification script...');
console.log('Checking root package.json...');
// Check if required packages are installed
const rootPackageJson = JSON.parse(
  fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'),
);
const hasSemanticReleaseMonorepo =
  rootPackageJson.devDependencies &&
  'semantic-release-monorepo' in rootPackageJson.devDependencies;
const hasLerna =
  rootPackageJson.devDependencies && 'lerna' in rootPackageJson.devDependencies;

if (!hasSemanticReleaseMonorepo) {
  console.error(
    '❌ semantic-release-monorepo is not installed in root package.json',
  );
  process.exit(1);
}

if (!hasLerna) {
  console.error('❌ lerna is not installed in root package.json');
  process.exit(1);
}

console.log('Checking root .releaserc.json...');
// Check root .releaserc.json
const rootReleaseRc = JSON.parse(
  fs.readFileSync(path.join(ROOT_DIR, '.releaserc.json'), 'utf8'),
);
if (
  !rootReleaseRc.extends ||
  rootReleaseRc.extends !== 'semantic-release-monorepo'
) {
  console.error(
    '❌ Root .releaserc.json does not extend semantic-release-monorepo',
  );
  process.exit(1);
}

console.log('Checking lerna.json...');
// Check lerna.json
if (!fs.existsSync(path.join(ROOT_DIR, 'lerna.json'))) {
  console.error('❌ lerna.json is missing');
  process.exit(1);
}

console.log('Checking packages...');
// Check packages
const packages = fs
  .readdirSync(PACKAGES_DIR)
  .filter((dir) => fs.statSync(path.join(PACKAGES_DIR, dir)).isDirectory());

console.log(`Found packages: ${packages.join(', ')}`);

for (const pkg of packages) {
  const packageDir = path.join(PACKAGES_DIR, pkg);
  const packageJsonPath = path.join(packageDir, 'package.json');
  const releaseRcPath = path.join(packageDir, '.releaserc.json');

  console.log(`Checking package ${pkg}...`);

  // Check package.json
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (!packageJson.scripts || !packageJson.scripts['semantic-release']) {
      console.error(
        `❌ Package ${pkg} does not have a semantic-release script`,
      );
      process.exit(1);
    }
  } else {
    console.error(`❌ Package ${pkg} does not have a package.json file`);
    process.exit(1);
  }

  // Check .releaserc.json
  if (fs.existsSync(releaseRcPath)) {
    const releaseRc = JSON.parse(fs.readFileSync(releaseRcPath, 'utf8'));
    if (
      !releaseRc.extends ||
      releaseRc.extends !== 'semantic-release-monorepo'
    ) {
      console.error(
        `❌ Package ${pkg} .releaserc.json does not extend semantic-release-monorepo`,
      );
      process.exit(1);
    }
  } else {
    console.error(`❌ Package ${pkg} does not have a .releaserc.json file`);
    process.exit(1);
  }
}

console.log('✅ All semantic-release-monorepo configurations are correct!');
