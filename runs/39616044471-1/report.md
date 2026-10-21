## Element generation benchmark: comparison

| Configuration | Value |
| --- | --- |
| Base commit | 16e04054d89c06afae90458b25e75f82f203d7f4 |
| Candidate commit | 6ed28080188b159b3534567333d4c0ca0cd5465c |
| Candidate working tree changes | false |
| Size / warmup / samples per run | 1000 / 5 / 20 |
| Pairs | 5 |
| CPU slowdown | 20× |
| Chromium | 156.0.8078.4 |
| Mode | production |

| Median timing | Base (ms) | Candidate (ms) | Difference (ms) | Change (%) |
| --- | ---: | ---: | ---: | ---: |
| Synchronous generation | 97.45 | 97.70 | 4.05 | 4.13 |
| Total time to idle | 754.75 | 752.80 | -2.65 | -0.35 |

| Pair | Order | Generation change (%) | Time to idle change (%) |
| --- | --- | ---: | ---: |
| 1 | base → candidate | -0.25 | -0.70 |
| 2 | candidate → base | 4.13 | 3.60 |
| 3 | base → candidate | 5.25 | 1.19 |
| 4 | candidate → base | 5.97 | -0.35 |
| 5 | base → candidate | -2.21 | -2.98 |

Negative changes mean faster. Differences and percentages are medians of paired comparisons; base and candidate columns are medians of run medians.

Both versions use the current harness and installed dependencies. Warmups are excluded. Time to idle includes synchronous generation and frame scheduling, not GPU completion. Results are informational; no performance threshold is applied.

[JSON data](comparison.json) · [Workflow run](https://github.com/lightning-js/blits/actions/runs/39616044471)
