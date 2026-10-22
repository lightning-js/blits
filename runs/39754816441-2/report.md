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
| Synchronous generation | 100.85 | 96.25 | -4.30 | -4.28 |
| Total time to idle | 766.40 | 768.90 | -4.80 | -0.62 |

| Pair | Order | Generation change (%) | Time to idle change (%) |
| --- | --- | ---: | ---: |
| 1 | base → candidate | -1.75 | -0.62 |
| 2 | candidate → base | -5.01 | 2.88 |
| 3 | base → candidate | -2.23 | -0.78 |
| 4 | candidate → base | -10.58 | 0.04 |
| 5 | base → candidate | -4.28 | -3.91 |

Negative changes mean faster. Differences and percentages are medians of paired comparisons; base and candidate columns are medians of run medians.

Both versions use the current harness and installed dependencies. Warmups are excluded. Time to idle includes synchronous generation and frame scheduling, not GPU completion. Results are informational; no performance threshold is applied.

[JSON data](comparison.json) · [Workflow run](https://github.com/lightning-js/blits/actions/runs/39754816441)
