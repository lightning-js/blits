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
npm run bench:compare -- --base master
```

Relative `--output` paths resolve from the `benchmarks/` directory, so the example saves to `benchmarks/results/benchmark.json`.

For browser inspection, open the URL printed by `bench:serve` and press **Enter**. The loop is cleared and recreated on every repetition, and the final sample stays visible. Results are logged in the browser console. Options can be supplied in the URL:

```text
http://localhost:5173/?size=1000&warmup=5&samples=20
```

Browser and CLI runs use the same workload. The CLI applies a 20x Chromium CPU slowdown; manual browser runs use the browser's current CPU settings. Use DevTools CPU throttling for a manual slowdown.

Results include synchronous generation time (`generationSyncMs`) and elapsed time until the renderer completes an active → idle transition (`totalToIdleMs`). Both metrics report median, arithmetic average, minimum, and maximum in the browser console table and CLI JSON (for example, `medianGenerationSyncMs`, `averageGenerationSyncMs`, `minGenerationSyncMs`, and `maxGenerationSyncMs`). Each sample also waits for renderer idle after clearing the previous loop, outside the measured generation time. Idle means the renderer has no scene updates to process; this measurement includes frame scheduling and does not establish GPU completion. Each idle wait has a 30-second timeout. Warmup samples are excluded from all statistics. Compare repeated runs on the same machine with the same browser and settings.

`npm run bench:profile` enables development profiling while running this workload. Profile timings should be compared separately from production benchmark timings.

## Compare versions

From the repository root:

```sh
npm run bench:compare -- --base master
npm run bench:compare -- --base origin/dev
npm run bench:compare -- --base abc1234 --candidate def5678
npm run bench:compare -- --base HEAD --size 100 --warmup 2 --samples 5 --pairs 2
```

`--base` accepts a locally available branch, remote branch, or commit. Without `--candidate`, the candidate is the current working tree, including uncommitted and untracked source files, excluding ignored files. With `--candidate`, it is that exact commit or branch. Fetch remote references first if needed. Temporary snapshots are removed on success or failure; your branch and working tree are not modified.

Both snapshots use the current benchmark harness, Vite plugins, installed dependencies (including the renderer), and Chromium. This compares Blits source changes, not dependency or build-tool version changes. Baselines that are incompatible with the current harness fail rather than silently running a different workload.

Both production builds finish before measurement begins. Each run uses a fresh browser and its own warmups, with the same viewport and 20× CPU slowdown. The default is two pairs: base → candidate, then candidate → base. Use `--pairs` to increase repetitions, and `--headed` to see the browser. Profiling is not supported for comparisons.

The console prints a Markdown comparison table and saves `results/comparison.json` by default. Override the path with `--output`; relative paths resolve from `benchmarks/`. JSON includes commit identities, working-tree dirty status, execution order, all samples and statistics, and paired differences. Negative percentages mean faster. Summary columns show medians of run medians; differences and percentages are calculated within each pair and then summarized with a median. Per-pair percentages remain visible to expose inconsistent results. Percent changes from a zero baseline are reported as unavailable.

To estimate comparison noise, run the same commit on both sides:

```sh
npm run bench:compare -- --base HEAD --candidate HEAD
```

## GitHub Actions

The Run Benchmarks workflow compares the PR head SHA with the target branch's base SHA from the PR event, sequentially in the same job. It uses the PR's benchmark harness. For manual runs, supply a baseline branch or commit; the candidate is the selected workflow commit.

It uploads a `benchmark-results` artifact containing `comparison.json` and writes configuration, aggregate comparison, and per-pair tables to the workflow summary. Results are informational without performance thresholds; build or benchmark execution errors still fail the job.

After a successful PR run, Publish Benchmark Results saves a rendered Markdown report and JSON under `runs/<run-id>-<attempt>/` on the separate `benchmark-reports` branch. The branch is created automatically with report files only. Reports are publicly readable on GitHub while the repository is public and remain available after the Actions artifact expires.

One PR comment is created and updated with the synchronous generation and time-to-idle percentage changes, plus an immutable full-report link. Outdated head/base results are skipped. Publishing runs from the default branch with write permissions, reads the benchmark artifact as data, and never executes PR code. The publisher must be merged into the default branch before it can run; repository rules must allow Actions to write the report branch and PR comments. No extra hosting or secrets are needed. Manual benchmark runs still produce an artifact and workflow summary but do not publish a PR comment.
