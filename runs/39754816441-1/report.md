## Element generation benchmark: comparison

| Configuration | Value |
| --- | --- |
| Base commit | 16e04054d89c06afae90458b25e75f82f203d7f4 |
| Candidate commit | b23db1ee9d8ccf7be506d413dc10655171ea9aae |
| Candidate working tree changes | false |
| Size / warmup / samples per run | 1000 / 5 / 20 |
| Pairs | 5 |
| CPU slowdown | 20× |
| Chromium | 156.0.8078.4 |
| Mode | production |

| Median timing | Base (ms) | Candidate (ms) | Difference (ms) | Change (%) |
| --- | ---: | ---: | ---: | ---: |
| Synchronous generation | 95.25 | 96.80 | 1.20 | 1.26 |
| Total time to idle | 726.85 | 731.80 | 4.95 | 0.68 |

| Pair | Order | Generation change (%) | Time to idle change (%) |
| --- | --- | ---: | ---: |
| 1 | base → candidate | 1.26 | 0.68 |
| 2 | candidate → base | 4.03 | 2.29 |
| 3 | base → candidate | 3.17 | 3.81 |
| 4 | candidate → base | -5.32 | -6.45 |
| 5 | base → candidate | 0.20 | -6.19 |

Negative changes mean faster. Differences and percentages are medians of paired comparisons; base and candidate columns are medians of run medians.

Both versions use the current harness and installed dependencies. Warmups are excluded. Time to idle includes synchronous generation and frame scheduling, not GPU completion. Results are informational; no performance threshold is applied.

[JSON data](comparison.json) · [Workflow run](https://github.com/lightning-js/blits/actions/runs/39754816441)
