## Element generation benchmark: comparison

| Configuration | Value |
| --- | --- |
| Base commit | d38eef864ec5fadc16838413ee19d0a8390c9a6e |
| Candidate commit | b496385c172255740d60e903e23065f71cca7734 |
| Candidate working tree changes | false |
| Size / warmup / samples per run | 1000 / 5 / 20 |
| Pairs | 5 |
| CPU slowdown | 20× |
| Chromium | 156.0.8078.4 |
| Mode | production |

| Median timing | Base (ms) | Candidate (ms) | Difference (ms) | Change (%) |
| --- | ---: | ---: | ---: | ---: |
| Synchronous generation | 107.00 | 108.75 | 3.30 | 3.08 |
| Total time to idle | 840.95 | 847.80 | 1.05 | 0.13 |

| Pair | Order | Generation change (%) | Time to idle change (%) |
| --- | --- | ---: | ---: |
| 1 | base → candidate | -10.93 | -5.12 |
| 2 | candidate → base | 3.19 | 0.13 |
| 3 | base → candidate | 7.67 | 3.52 |
| 4 | candidate → base | 2.52 | -0.73 |
| 5 | base → candidate | 3.08 | 0.81 |

Negative changes mean faster. Differences and percentages are medians of paired comparisons; base and candidate columns are medians of run medians.

Both versions use the current harness and installed dependencies. Warmups are excluded. Time to idle includes synchronous generation and frame scheduling, not GPU completion. Results are informational; no performance threshold is applied.

[JSON data](comparison.json) · [Workflow run](https://github.com/lightning-js/blits/actions/runs/39744382824)
