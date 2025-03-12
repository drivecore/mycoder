import { describe, it, expect } from 'vitest';

import { getDefaultConfig } from './config';

describe('config', () => {
  it('getDefaultConfig should return the default configuration', () => {
    const defaultConfig = getDefaultConfig();

    // Just check some key properties to make sure we have a valid config
    expect(defaultConfig).toHaveProperty('githubMode');
    expect(defaultConfig).toHaveProperty('provider');
    expect(defaultConfig).toHaveProperty('model');
    expect(defaultConfig).toHaveProperty('ollamaBaseUrl');
  });
});
