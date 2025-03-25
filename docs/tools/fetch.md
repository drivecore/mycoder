# Fetch Tool

The `fetch` tool allows MyCoder to make HTTP requests to external APIs. It uses the native Node.js fetch API and includes robust error handling capabilities.

## Basic Usage

```javascript
const response = await fetch({
  method: 'GET',
  url: 'https://api.example.com/data',
  headers: {
    Authorization: 'Bearer token123',
  },
});

console.log(response.status); // HTTP status code
console.log(response.body); // Response body
```

## Parameters

| Parameter  | Type    | Required | Description                                                               |
| ---------- | ------- | -------- | ------------------------------------------------------------------------- |
| method     | string  | Yes      | HTTP method to use (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS)         |
| url        | string  | Yes      | URL to make the request to                                                |
| params     | object  | No       | Query parameters to append to the URL                                     |
| body       | object  | No       | Request body (for POST, PUT, PATCH requests)                              |
| headers    | object  | No       | Request headers                                                           |
| maxRetries | number  | No       | Maximum number of retries for 4xx errors (default: 3, max: 5)             |
| retryDelay | number  | No       | Initial delay in ms before retrying (default: 1000, min: 100, max: 30000) |
| slowMode   | boolean | No       | Enable slow mode to avoid rate limits (default: false)                    |

## Error Handling

The fetch tool includes sophisticated error handling for different types of HTTP errors:

### 400 Bad Request Errors

When a 400 Bad Request error occurs, the fetch tool will automatically retry the request with exponential backoff. This helps handle temporary issues or malformed requests.

```javascript
// Fetch with custom retry settings for Bad Request errors
const response = await fetch({
  method: 'GET',
  url: 'https://api.example.com/data',
  maxRetries: 2, // Retry up to 2 times (3 requests total)
  retryDelay: 500, // Start with a 500ms delay, then increase exponentially
});
```

### 429 Rate Limit Errors

For 429 Rate Limit Exceeded errors, the fetch tool will:

1. Automatically retry with exponential backoff
2. Respect the `Retry-After` header if provided by the server
3. Switch to "slow mode" to prevent further rate limit errors

```javascript
// Fetch with rate limit handling
const response = await fetch({
  method: 'GET',
  url: 'https://api.example.com/data',
  maxRetries: 5, // Retry up to 5 times for rate limit errors
  retryDelay: 1000, // Start with a 1 second delay
});

// Check if slow mode was enabled due to rate limiting
if (response.slowModeEnabled) {
  console.log('Slow mode was enabled to handle rate limits');
}
```

### Preemptive Slow Mode

You can enable slow mode preemptively to avoid hitting rate limits in the first place:

```javascript
// Start with slow mode enabled
const response = await fetch({
  method: 'GET',
  url: 'https://api.example.com/data',
  slowMode: true, // Enable slow mode from the first request
});
```

### Network Errors

The fetch tool also handles network errors (such as connection issues) with the same retry mechanism.

## Response Object

The fetch tool returns an object with the following properties:

| Property        | Type             | Description                                                        |
| --------------- | ---------------- | ------------------------------------------------------------------ |
| status          | number           | HTTP status code                                                   |
| statusText      | string           | HTTP status text                                                   |
| headers         | object           | Response headers                                                   |
| body            | string or object | Response body (parsed as JSON if content-type is application/json) |
| retries         | number           | Number of retries performed (if any)                               |
| slowModeEnabled | boolean          | Whether slow mode was enabled                                      |
