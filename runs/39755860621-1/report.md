## Element generation benchmark: comparison

| Configuration | Value |
| --- | --- |
| Base commit | f34a485dd2f0fe7a7e6bf75ef405b58feaf8d60b |
| Candidate commit | 41f00630f1ab9b7ea20f01aff5889db0a724dfb5 |
| Candidate working tree changes | false |
| Size / warmup / samples per run | 1000 / 5 / 20 |
| Pairs | 5 |
| CPU slowdown | 20× |
| Chromium | 156.0.8078.4 |
| Mode | production |

| Median timing | Base (ms) | Candidate (ms) | Difference (ms) | Change (%) |
| --- | ---: | ---: | ---: | ---: |
| Synchronous generation | 111.50 | 107.65 | -3.70 | -3.25 |
| Total time to idle | 817.00 | 823.80 | -0.90 | -0.11 |

| Pair | Order | Generation change (%) | Time to idle change (%) |
| --- | --- | ---: | ---: |
| 1 | base → candidate | -3.25 | 0.83 |
| 2 | candidate → base | -1.87 | -0.23 |
| 3 | base → candidate | -1.27 | -0.11 |
| 4 | candidate → base | -3.45 | 2.16 |
| 5 | base → candidate | -5.40 | -0.96 |

Negative changes mean faster. Differences and percentages are medians of paired comparisons; base and candidate columns are medians of run medians.

Both versions use the current harness and installed dependencies. Warmups are excluded. Time to idle includes synchronous generation and frame scheduling, not GPU completion. Results are informational; no performance threshold is applied.

[JSON data](comparison.json) · [Workflow run](https://github.com/lightning-js/blits/actions/runs/39755860621)
