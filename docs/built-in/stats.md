# Blits Stats & Performance Logging

Blits provides a highly-performant stats and system logging mechanism. This feature is **entirely opt-in** and is controlled at build time using a Vite flag. When disabled, all stats code is removed from the final bundle for maximum performance.

Ideally this is only enabled in development or test builds for performance validation.

## Enabling Stats Logging

To enable stats logging, set the `__BLITS_STATS__` flag in your `vite.config.js`:

```js
import { defineConfig } from 'vite'

export default defineConfig({
  define: {
    __BLITS_STATS__: true // Set to false to disable stats (default)
  },
  // ...other Vite config options
})
```

- When `__BLITS_STATS__` is `true`, Blits will track and periodically log system statistics (components, elements, event listeners, timeouts, intervals, etc.).
- When `__BLITS_STATS__` is `false` (or not set), **all stats logic and function calls are optimized out** at build time. There is zero runtime cost in production.

## How It Works

- All stats-related calls (e.g., `increment`, `decrement`) are guarded with the `BLITS_STATS_ENABLED` flag, which is exported from `src/lib/stats.js`.
- Example usage in the codebase:

  ```js
  import { increment, BLITS_STATS_ENABLED } from './lib/stats.js'
  // ...
  BLITS_STATS_ENABLED && increment('components', 'created')
  ```
- When the flag is `false`, these calls are removed by dead code elimination during the build.

## No Runtime Settings

There is **no runtime setting** for enabling/disabling stats. The only way to enable stats is at build time using the Vite flag.

## What Gets Logged?

When enabled, Blits will periodically log:

- Number of active, created, and deleted components
- Number of elements, event listeners, timeouts, and intervals
- Rolling load averages for each category
- Renderer memory usage information (when available)

Example log output:

```
--- System Statistics ---
Components: Active: 5, Created: 10, Deleted: 5, Load: 0.10, 0.05, 0.01
Elements:   Active: 20, Created: 40, Deleted: 20, Load: 0.20, 0.10, 0.02
Listeners:  Active: 3, Created: 6, Deleted: 3, Load: 0.03, 0.01, 0.00
Timeouts:   Active: 1, Created: 2, Deleted: 1, Load: 0.01, 0.00, 0.00
Intervals:  Active: 2, Created: 4, Deleted: 2, Load: 0.02, 0.01, 0.00
--- Renderer Memory Info ---
Memory used: 27.27 Mb, Renderable: 25.62 Mb, Target: 160.00 Mb, Critical: 200.00 Mb
Textures loaded 6, renderable textures: 3
-------------------------
```

## Visual Stats Overlay

Blits includes a built-in component that displays real-time stats in the top left corner of the screen:

```js
// Import the component
import { StatsOverlay } from 'blits'

// Add it to your root component
export default Component('App', {
  template: `
    <Element>
      <!-- Your app content -->
      <StatsOverlay />
    </Element>
  `
})
```

The `StatsOverlay` component:
- Only updates when `__BLITS_STATS__` is enabled
- Shows real-time stats for components, elements, listeners, timeouts and intervals as well as texture and memory usage statistics
- Displays renderer memory information when available
- Automatically updates every 500ms
- Has zero impact when stats are disabled

## Best Practices

- **Enable stats only for development or diagnostics builds.**
- For production, keep `__BLITS_STATS__` set to `false` for optimal performance.
