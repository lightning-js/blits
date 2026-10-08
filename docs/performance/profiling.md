# Profiling

Blits includes a small profiler that is used internally to find and address bottlenecks in the Blits codebase itself. You can also use it in App code to measure work that is specific to your application.

Note that the profiler is tree-shaken from production builds. It is intended for local development and performance investigation.

## Profiling App code

Import the profiler and start a recording before the interaction or workload you want to inspect.

```js
import profiler from '@lightningjs/blits/profiler'

profiler.start()
```

Use `mark()` before the work and `markEnd()` afterwards. The supplied name groups calls in the report.

```js
methods: {
  updateProducts() {
    profiler.mark('products.sort')
    this.products = [...this.products].sort((a, b) => a.price - b.price)
    profiler.markEnd('products.sort')
  },
}
```

When the workload is complete, stop the recording and print the report.

```js
profiler.stop()
profiler.report()
```

The report shows all recorded marker timings, marker timings within retained frames, and the most expensive retained frames. Frame analysis also reports frame interval and instrumented-time percentiles.

If the measured code can throw or return early, pair the markers with `try` and `finally`.

```js
profiler.mark('products.filter')
try {
  this.filteredProducts = this.products.filter(matchesSearch)
} finally {
  profiler.markEnd('products.filter')
}
```

## The profile helper

`profile()` is useful when wrapping a synchronous expression is more convenient. It calls `markEnd()` in a `finally` block, but changes the shape of the measured code.

```js
import { profile } from '@lightningjs/blits/profiler'

const sortedProducts = profile('products.sort', () =>
  [...this.products].sort((a, b) => a.price - b.price)
)
```

## Frame analysis

Frame analysis is enabled by default. The profiler retains the latest 300 complete frames. You can change the limit and target frame rate when needed, or disable frame analysis when it is not needed.

```js
profiler.start({
  maxFrames: 600,
  targetFps: 60,
})
```

```js
profiler.start({ frames: false })
```

The frame report helps distinguish a marker that is expensive per call from one that is cheap but runs many times per frame.

## Browser console

In development, Blits exposes the profiler as `__BLITS_PROFILER__` in the browser console. This is useful when you want to start, stop or report on a recording without adding temporary App code.
