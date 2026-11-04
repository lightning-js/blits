# Benchmarks

Four isolated workloads are available:

| Benchmark | Measured work |
| --- | --- |
| `element-creation` (default) | Create Elements with rectangles and text |
| `component-creation` | Create matching items with a component boundary |
| `computed-loop-creation` | Mount a list whose computed array supplies its Element loop |
| `computed-binding-updates` | Update ordinary computed bindings across mounted components |

Install dependencies and Chromium:

```sh
cd benchmarks
npm install
npx playwright install chromium
```

Run commands below from the repository root.

## Run locally

```sh
npm run bench -- --all --short --output results/benchmarks.json
npm run bench -- --benchmark component-creation
npm run bench -- --benchmark computed-loop-creation
npm run bench -- --benchmark computed-binding-updates
```

Options: `--size` (default 1000), `--warmup` (5), `--samples` (20), `--cpu-slowdown` (20; use 1 to disable), `--headed`, `--short`, and `--output`. Relative output paths resolve from `benchmarks/`. Full JSON is saved even with `--short`.

The benchmark server enables cross-origin isolation for higher-resolution timers. JSON also records isolation status, browser mode, measurement start time, and duration for each launch.

`--all` runs workloads sequentially with a fresh browser for each. Use `--benchmark` to select one instead. Results measure synchronous work and time to renderer idle, including frame scheduling but not GPU completion. Warmups, preparation, and resetting the previous sample are excluded. JSON retains the historical `generationSyncMs` / `medianGenerationSyncMs` field names for compatibility; for the update workload these represent batch update time.

For browser inspection, run `npm run bench:serve`, open the printed URL, and press Enter. Select a workload and options in the URL, for example `?benchmark=component-creation&size=1000&warmup=20&samples=20`. Manual runs use the browser's current CPU settings. Use `npm run bench:profile` for development profiling separately from production measurements.

## Compare versions

Compare the working tree against a local branch or commit:

```sh
npm run bench:compare -- --all --base origin/dev --warmup 20 --short
```

Use `--candidate <branch-or-commit>` to compare an exact revision instead of the working tree. Fetch remote references first if needed. Both versions use the current harness and installed dependencies.

To check comparison noise using identical source:

```sh
npm run bench:compare -- --all --base HEAD --candidate HEAD --warmup 20 --pairs 4 --threshold 5 --short --output results/aa-run1.json
```

Each pair uses fresh base and candidate browsers; order alternates. `--pairs` defaults to 2. Short runs are labelled **Preliminary**: their percentages are estimates, not performance conclusions. At least 4 pairs are required for a 95% interval. Four-pair intervals use only two independent blocks and can be very wide; this does not guarantee a conclusive result or reliable 5% sensitivity. Negative means faster. `--threshold` sets the practical band (default ±5%); the full interval determines improvement, regression, no meaningful change, or inconclusive. Choose the run budget before starting.

Completed launches are saved as the comparison progresses. A failed run retains partial results with `status: "failed"`; these are not a completed comparison or a resumable run.

## Add a benchmark

Create a CamelCase file in `src/benchmarks/` and register it in `benchmarks.js`. Export a `title` and a default `Blits.Component` with `setup`, `measure`, and `verify` methods. The shared application handles launching, repetition, and reporting.

Optionally export `checkSupport()` returning a non-empty reason string for a missing capability. Explicitly unsupported baselines produce N/A while candidate measurements still run. Unsupported candidates and unexpected errors fail the run.

## GitHub Actions

Automatic PR benchmark runs are disabled. Start Run Benchmarks manually from the Actions tab, selecting the candidate branch and supplying a baseline branch or commit. Defaults are all workloads, 4 pairs, 20 warmups, 20 samples, and 6× CPU slowdown. Four pairs complete two balanced blocks; an odd pair count leaves an incomplete block and no interval. The job is capped at 15 minutes. Manual runs can override pairs and CPU slowdown within that limit. It uploads available JSON even after a failure and writes a workflow summary on success. Results are informational; performance verdicts do not fail CI.

Manual runs provide workflow summaries and artifacts; they do not publish PR comments. The PR report publisher is retained for future automatic runs. The 95% intervals may be wide or inconclusive with only two blocks.
