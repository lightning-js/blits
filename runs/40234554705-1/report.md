## Element generation benchmark: comparison

| Configuration | Value |
| --- | --- |
| Base commit | 4b8a330dcd816eeba92f6822b1b1cd7d6b4edc0c |
| Candidate commit | 5e4126a526098ca0fe251f2002957d29c134c9be |
| Candidate working tree changes | false |
| Size / warmup / samples per run | 1000 / 5 / 20 |
| Pairs | 5 |
| CPU slowdown | 20× |
| Chromium | 156.0.8078.4 |
| Mode | production |

| Median timing | Base (ms) | Candidate (ms) | Difference (ms) | Change (%) |
| --- | ---: | ---: | ---: | ---: |
| Synchronous generation | 0.00 | 0.00 | 0.00 | n/a |
| Total time to idle | 743.60 | 735.00 | -13.65 | -1.82 |

| Pair | Order | Generation change (%) | Time to idle change (%) |
| --- | --- | ---: | ---: |
| 1 | base → candidate | n/a | 1.63 |
| 2 | candidate → base | n/a | -3.78 |
| 3 | base → candidate | n/a | -1.98 |
| 4 | candidate → base | n/a | 2.65 |
| 5 | base → candidate | -100.00 | -1.82 |

Negative changes mean faster. Differences and percentages are medians of paired comparisons; base and candidate columns are medians of run medians.

Both versions use the current harness and installed dependencies. Warmups are excluded. Time to idle includes synchronous generation and frame scheduling, not GPU completion. Results are informational; no performance threshold is applied.

[JSON data](comparison.json) · [Workflow run](https://github.com/lightning-js/blits/actions/runs/40234554705)
