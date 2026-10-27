# Security

## What the plugin touches

- The plugin is computed entirely in the browser: it reads the user's clock and a static price table.
- It makes no network requests, reads no credentials and registers no Host route or service.
- It writes no configuration, cache file or local storage.

## Data handling

- No API key, cookie, session token or workspace ID is read or stored.
- No usage, balance or conversation data is collected.
- The only visible state is the current band, the countdown, the local time and the shipped prices.

## Network

There is no outbound request. The official source link is a plain link the user opens in the browser.

## Reporting a vulnerability

Please use a private security advisory on the GitHub repository rather than a public issue. Include the affected version, the impact and the smallest reproduction you can.
