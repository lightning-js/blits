## Element generation benchmark: comparison

| Configuration | Value |
| --- | --- |
| Base commit | d38eef864ec5fadc16838413ee19d0a8390c9a6e |
| Candidate commit | 00cdd57499cd7e8d1ef1258f8968c97cfb778e6a |
| Candidate working tree changes | false |
| Size / warmup / samples per run | 1000 / 5 / 20 |
| Pairs | 5 |
| CPU slowdown | 20× |
| Chromium | 156.0.8078.4 |
| Mode | production |

| Median timing | Base (ms) | Candidate (ms) | Difference (ms) | Change (%) |
| --- | ---: | ---: | ---: | ---: |
| Synchronous generation | 105.05 | 103.95 | -0.35 | -0.32 |
| Total time to idle | 796.30 | 805.15 | 15.50 | 1.95 |

| Pair | Order | Generation change (%) | Time to idle change (%) |
| --- | --- | ---: | ---: |
| 1 | base → candidate | 1.53 | 1.95 |
| 2 | candidate → base | 2.88 | 3.82 |
| 3 | base → candidate | -2.48 | 1.07 |
| 4 | candidate → base | -1.42 | 0.94 |
| 5 | base → candidate | -0.32 | 2.62 |

Negative changes mean faster. Differences and percentages are medians of paired comparisons; base and candidate columns are medians of run medians.

Both versions use the current harness and installed dependencies. Warmups are excluded. Time to idle includes synchronous generation and frame scheduling, not GPU completion. Results are informational; no performance threshold is applied.

[JSON data](comparison.json) · [Workflow run](https://github.com/lightning-js/blits/actions/runs/39568144673)
