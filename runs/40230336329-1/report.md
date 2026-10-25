## Element generation benchmark: comparison

| Configuration | Value |
| --- | --- |
| Base commit | d38eef864ec5fadc16838413ee19d0a8390c9a6e |
| Candidate commit | c9f3603cbf4bed44b0f71cfe271fb48e9b8e291c |
| Candidate working tree changes | false |
| Size / warmup / samples per run | 1000 / 5 / 20 |
| Pairs | 5 |
| CPU slowdown | 20× |
| Chromium | 156.0.8078.4 |
| Mode | production |

| Median timing | Base (ms) | Candidate (ms) | Difference (ms) | Change (%) |
| --- | ---: | ---: | ---: | ---: |
| Synchronous generation | 99.25 | 0.05 | -99.20 | -99.95 |
| Total time to idle | 741.80 | 762.55 | 3.25 | 0.43 |

| Pair | Order | Generation change (%) | Time to idle change (%) |
| --- | --- | ---: | ---: |
| 1 | base → candidate | -99.95 | 0.43 |
| 2 | candidate → base | -100.00 | 0.06 |
| 3 | base → candidate | -99.95 | -3.23 |
| 4 | candidate → base | -99.95 | 4.59 |
| 5 | base → candidate | -100.00 | 2.80 |

Negative changes mean faster. Differences and percentages are medians of paired comparisons; base and candidate columns are medians of run medians.

Both versions use the current harness and installed dependencies. Warmups are excluded. Time to idle includes synchronous generation and frame scheduling, not GPU completion. Results are informational; no performance threshold is applied.

[JSON data](comparison.json) · [Workflow run](https://github.com/lightning-js/blits/actions/runs/40230336329)
