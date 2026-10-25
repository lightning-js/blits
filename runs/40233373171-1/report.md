## Element generation benchmark: comparison

| Configuration | Value |
| --- | --- |
| Base commit | fb1783fa8f28e9364f2d049463dad735fe98eaa4 |
| Candidate commit | 46f01906d4f746ab2ee8b567273b62e786fcebd9 |
| Candidate working tree changes | false |
| Size / warmup / samples per run | 1000 / 5 / 20 |
| Pairs | 5 |
| CPU slowdown | 20× |
| Chromium | 156.0.8078.4 |
| Mode | production |

| Median timing | Base (ms) | Candidate (ms) | Difference (ms) | Change (%) |
| --- | ---: | ---: | ---: | ---: |
| Synchronous generation | 0.00 | 0.10 | 0.05 | n/a |
| Total time to idle | 485.15 | 489.70 | -22.80 | -4.70 |

| Pair | Order | Generation change (%) | Time to idle change (%) |
| --- | --- | ---: | ---: |
| 1 | base → candidate | n/a | -4.70 |
| 2 | candidate → base | n/a | -7.75 |
| 3 | base → candidate | n/a | 8.41 |
| 4 | candidate → base | 100.00 | -6.59 |
| 5 | base → candidate | -100.00 | 14.15 |

Negative changes mean faster. Differences and percentages are medians of paired comparisons; base and candidate columns are medians of run medians.

Both versions use the current harness and installed dependencies. Warmups are excluded. Time to idle includes synchronous generation and frame scheduling, not GPU completion. Results are informational; no performance threshold is applied.

[JSON data](comparison.json) · [Workflow run](https://github.com/lightning-js/blits/actions/runs/40233373171)
