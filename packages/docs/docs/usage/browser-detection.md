---
sidebar_position: 7
---

# System Browser Detection

MyCoder includes a system browser detection feature that allows it to use your existing installed browsers instead of requiring Playwright's bundled browsers. This is especially useful when MyCoder is installed globally via npm.

## How It Works

When you start a browser session in MyCoder, the system will:

1. Detect available browsers on your system (Chrome, Edge, Firefox, etc.)
2. Select the most appropriate browser based on your configuration preferences
3. Launch the browser using Playwright's `executablePath` option
4. Fall back to Playwright's bundled browsers if no system browser is found

This process happens automatically and is designed to be seamless for the user.

## Supported Browsers

MyCoder can detect and use the following browsers:

### Windows

- Google Chrome
- Microsoft Edge
- Mozilla Firefox

### macOS

- Google Chrome
- Google Chrome Canary
- Microsoft Edge
- Mozilla Firefox
- Firefox Developer Edition
- Firefox Nightly

### Linux

- Google Chrome
- Chromium
- Mozilla Firefox

## Configuration Options

You can customize the browser detection behavior in your `mycoder.config.js` file:

```javascript
// mycoder.config.js
export default {
  // Other settings...

  // System browser detection settings
  browser: {
    // Whether to use system browsers or Playwright's bundled browsers
    useSystemBrowsers: true,

    // Preferred browser type (chromium, firefox, webkit)
    preferredType: 'chromium',

    // Custom browser executable path (overrides automatic detection)
    // executablePath: null, // e.g., '/path/to/chrome'
  },
};
```

### Configuration Options Explained

| Option              | Description                                                     | Default    |
| ------------------- | --------------------------------------------------------------- | ---------- |
| `useSystemBrowsers` | Whether to use system-installed browsers if available           | `true`     |
| `preferredType`     | Preferred browser engine type (`chromium`, `firefox`, `webkit`) | `chromium` |
| `executablePath`    | Custom browser executable path (overrides automatic detection)  | `null`     |

## Browser Selection Priority

When selecting a browser, MyCoder follows this priority order:

1. Custom executable path specified in `browser.executablePath` (if provided)
2. System browser matching the preferred type specified in `browser.preferredType`
3. Any available system browser
4. Playwright's bundled browsers (fallback)

## Troubleshooting

If you encounter issues with browser detection:

1. **Browser Not Found**: Ensure you have at least one supported browser installed on your system.

2. **Browser Compatibility Issues**: Some websites may work better with specific browser types. Try changing the `preferredType` setting if you encounter compatibility issues.

3. **Manual Override**: If automatic detection fails, you can manually specify the path to your browser using the `executablePath` option.

4. **Fallback to Bundled Browsers**: If you prefer to use Playwright's bundled browsers, set `useSystemBrowsers` to `false`.

## Examples

### Using Chrome as the Preferred Browser

```javascript
// mycoder.config.js
export default {
  browser: {
    useSystemBrowsers: true,
    preferredType: 'chromium',
  },
};
```

### Using Firefox as the Preferred Browser

```javascript
// mycoder.config.js
export default {
  browser: {
    useSystemBrowsers: true,
    preferredType: 'firefox',
  },
};
```

### Specifying a Custom Browser Path

```javascript
// mycoder.config.js
export default {
  browser: {
    useSystemBrowsers: true,
    executablePath:
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Windows example
    // executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // macOS example
    // executablePath: '/usr/bin/google-chrome', // Linux example
  },
};
```
