## Element generation benchmark: comparison

| Configuration | Value |
| --- | --- |
| Base commit | 46f01906d4f746ab2ee8b567273b62e786fcebd9 |
| Candidate commit | 4b8a330dcd816eeba92f6822b1b1cd7d6b4edc0c |
| Candidate working tree changes | false |
| Size / warmup / samples per run | 1000 / 5 / 20 |
| Pairs | 5 |
| CPU slowdown | 20× |
| Chromium | 156.0.8078.4 |
| Mode | production |

| Median timing | Base (ms) | Candidate (ms) | Difference (ms) | Change (%) |
| --- | ---: | ---: | ---: | ---: |
| Synchronous generation | 0.10 | 0.10 | 0.00 | n/a |
| Total time to idle | 691.45 | 685.65 | 7.30 | 1.08 |

| Pair | Order | Generation change (%) | Time to idle change (%) |
| --- | --- | ---: | ---: |
| 1 | base → candidate | -100.00 | -4.27 |
| 2 | candidate → base | n/a | -0.32 |
| 3 | base → candidate | -100.00 | 1.08 |
| 4 | candidate → base | n/a | 1.61 |
| 5 | base → candidate | 0.00 | 1.60 |

Negative changes mean faster. Differences and percentages are medians of paired comparisons; base and candidate columns are medians of run medians.

Both versions use the current harness and installed dependencies. Warmups are excluded. Time to idle includes synchronous generation and frame scheduling, not GPU completion. Results are informational; no performance threshold is applied.

[JSON data](comparison.json) · [Workflow run](https://github.com/lightning-js/blits/actions/runs/40234020022)
