# Element generation benchmark

One workload: clear a keyed loop and generate Elements again. Data creation and clearing happen outside the measured generation time. The default run uses 1,000 Elements, five warmups, and 20 measured samples. Each sample verifies the number of live rendered Elements.

Install dependencies in this folder with `npm install` and install Chromium with `npx playwright install chromium`.

From the repository root:

```sh
npm run bench
npm run bench -- --size 100 --samples 5 --warmup 2
npm run bench -- --headed
npm run bench -- --output results/benchmark.json
npm run bench:serve
```

Relative `--output` paths resolve from the `benchmarks/` directory, so the example saves to `benchmarks/results/benchmark.json`.

For browser inspection, open the URL printed by `bench:serve` and press **Enter**. The loop is cleared and recreated on every repetition, and the final sample stays visible. Results are logged in the browser console. Options can be supplied in the URL:

```text
http://localhost:5173/?size=1000&warmup=5&samples=20
```

Browser and CLI runs use the same workload. The CLI applies a 20x Chromium CPU slowdown; manual browser runs use the browser's current CPU settings. Use DevTools CPU throttling for a manual slowdown.

Results include synchronous generation time (`generationSyncMs`) and elapsed time until the renderer completes an active → idle transition (`totalToIdleMs`). Both metrics report median, arithmetic average, minimum, and maximum in the browser console table and CLI JSON (for example, `medianGenerationSyncMs`, `averageGenerationSyncMs`, `minGenerationSyncMs`, and `maxGenerationSyncMs`). Each sample also waits for renderer idle after clearing the previous loop, outside the measured generation time. Idle means the renderer has no scene updates to process; this measurement includes frame scheduling and does not establish GPU completion. Each idle wait has a 30-second timeout. Warmup samples are excluded from all statistics. Compare repeated runs on the same machine with the same browser and settings.

`npm run bench:profile` enables development profiling while running this workload. Profile timings should be compared separately from production benchmark timings.

The Run Benchmarks workflow runs on pull requests and can also be started manually. It uploads a `benchmark-results` JSON artifact and writes configuration and timing tables to the workflow summary. Results include individual samples, summary statistics, browser version, CPU slowdown, build mode, and the tested commit in GitHub Actions. The workflow reports timings without a base comparison or performance thresholds; benchmark execution errors still fail the job.
