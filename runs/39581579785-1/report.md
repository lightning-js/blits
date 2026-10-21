## Element generation benchmark: comparison

| Configuration | Value |
| --- | --- |
| Base commit | 7abb7a88652f3ec5990d7612503d70863b5a3a06 |
| Candidate commit | bb63a64057217520b7c1ce7b3e1fc1723f3c1f8a |
| Candidate working tree changes | false |
| Size / warmup / samples per run | 1000 / 5 / 20 |
| Pairs | 5 |
| CPU slowdown | 20× |
| Chromium | 156.0.8078.4 |
| Mode | production |

| Median timing | Base (ms) | Candidate (ms) | Difference (ms) | Change (%) |
| --- | ---: | ---: | ---: | ---: |
| Synchronous generation | 59.55 | 58.55 | -1.95 | -3.27 |
| Total time to idle | 544.75 | 535.20 | 1.40 | 0.27 |

| Pair | Order | Generation change (%) | Time to idle change (%) |
| --- | --- | ---: | ---: |
| 1 | base → candidate | -12.93 | -13.89 |
| 2 | candidate → base | -9.25 | 4.28 |
| 3 | base → candidate | -1.26 | 4.42 |
| 4 | candidate → base | -3.27 | 0.27 |
| 5 | base → candidate | 41.42 | -0.29 |

Negative changes mean faster. Differences and percentages are medians of paired comparisons; base and candidate columns are medians of run medians.

Both versions use the current harness and installed dependencies. Warmups are excluded. Time to idle includes synchronous generation and frame scheduling, not GPU completion. Results are informational; no performance threshold is applied.

[JSON data](comparison.json) · [Workflow run](https://github.com/lightning-js/blits/actions/runs/39581579785)
