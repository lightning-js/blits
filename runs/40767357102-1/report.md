## Element generation benchmark: comparison

| Configuration | Value |
| --- | --- |
| Base commit | 2a255a530a264d14cfa8599902ff0b84960e0771 |
| Candidate commit | 45311f4079c44a065e4d0ee19e2549f761511241 |
| Candidate working tree changes | false |
| Size / warmup / samples per run | 1000 / 5 / 20 |
| Pairs | 5 |
| CPU slowdown | 20× |
| Chromium | 156.0.8078.4 |
| Mode | production |

| Median timing | Base (ms) | Candidate (ms) | Difference (ms) | Change (%) |
| --- | ---: | ---: | ---: | ---: |
| Synchronous generation | 79.05 | 78.10 | 0.20 | 0.26 |
| Total time to idle | 642.60 | 635.50 | -6.10 | -0.93 |

| Pair | Order | Generation change (%) | Time to idle change (%) |
| --- | --- | ---: | ---: |
| 1 | base → candidate | -10.07 | -4.91 |
| 2 | candidate → base | 5.42 | 4.87 |
| 3 | base → candidate | 7.94 | 3.39 |
| 4 | candidate → base | 0.26 | -0.93 |
| 5 | base → candidate | -0.57 | -1.52 |

Negative changes mean faster. Differences and percentages are medians of paired comparisons; base and candidate columns are medians of run medians.

Both versions use the current harness and installed dependencies. Warmups are excluded. Time to idle includes synchronous generation and frame scheduling, not GPU completion. Results are informational; no performance threshold is applied.

[JSON data](comparison.json) · [Workflow run](https://github.com/lightning-js/blits/actions/runs/40767357102)
