## Element generation benchmark: comparison

| Configuration | Value |
| --- | --- |
| Base commit | d38eef864ec5fadc16838413ee19d0a8390c9a6e |
| Candidate commit | 33f7efb2b44d7032337813efde23193bd3ff2764 |
| Candidate working tree changes | false |
| Size / warmup / samples per run | 1000 / 5 / 20 |
| Pairs | 5 |
| CPU slowdown | 20× |
| Chromium | 156.0.8078.4 |
| Mode | production |

| Median timing | Base (ms) | Candidate (ms) | Difference (ms) | Change (%) |
| --- | ---: | ---: | ---: | ---: |
| Synchronous generation | 106.30 | 106.40 | 0.25 | 0.23 |
| Total time to idle | 809.65 | 822.90 | 7.30 | 0.91 |

| Pair | Order | Generation change (%) | Time to idle change (%) |
| --- | --- | ---: | ---: |
| 1 | base → candidate | 0.23 | 3.30 |
| 2 | candidate → base | 1.82 | 0.89 |
| 3 | base → candidate | -1.71 | -3.05 |
| 4 | candidate → base | 6.77 | 1.34 |
| 5 | base → candidate | -1.07 | 0.91 |

Negative changes mean faster. Differences and percentages are medians of paired comparisons; base and candidate columns are medians of run medians.

Both versions use the current harness and installed dependencies. Warmups are excluded. Time to idle includes synchronous generation and frame scheduling, not GPU completion. Results are informational; no performance threshold is applied.

[JSON data](comparison.json) · [Workflow run](https://github.com/lightning-js/blits/actions/runs/40311842723)
