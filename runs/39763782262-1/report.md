## Element generation benchmark: comparison

| Configuration | Value |
| --- | --- |
| Base commit | f34a485dd2f0fe7a7e6bf75ef405b58feaf8d60b |
| Candidate commit | 847b20a0f1c14b49ea8afac92e143c48455bf399 |
| Candidate working tree changes | false |
| Size / warmup / samples per run | 1000 / 5 / 20 |
| Pairs | 5 |
| CPU slowdown | 20× |
| Chromium | 156.0.8078.4 |
| Mode | production |

| Median timing | Base (ms) | Candidate (ms) | Difference (ms) | Change (%) |
| --- | ---: | ---: | ---: | ---: |
| Synchronous generation | 107.50 | 103.70 | -4.05 | -3.76 |
| Total time to idle | 824.50 | 822.15 | 6.80 | 0.84 |

| Pair | Order | Generation change (%) | Time to idle change (%) |
| --- | --- | ---: | ---: |
| 1 | base → candidate | 7.75 | 2.70 |
| 2 | candidate → base | -3.76 | 0.84 |
| 3 | base → candidate | -8.93 | -0.50 |
| 4 | candidate → base | -12.05 | -0.60 |
| 5 | base → candidate | 9.83 | 1.52 |

Negative changes mean faster. Differences and percentages are medians of paired comparisons; base and candidate columns are medians of run medians.

Both versions use the current harness and installed dependencies. Warmups are excluded. Time to idle includes synchronous generation and frame scheduling, not GPU completion. Results are informational; no performance threshold is applied.

[JSON data](comparison.json) · [Workflow run](https://github.com/lightning-js/blits/actions/runs/39763782262)
