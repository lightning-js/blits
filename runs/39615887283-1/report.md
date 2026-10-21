## Element generation benchmark: comparison

| Configuration | Value |
| --- | --- |
| Base commit | 16e04054d89c06afae90458b25e75f82f203d7f4 |
| Candidate commit | b878e1ae77a12234525c374b533e061b2132ecc4 |
| Candidate working tree changes | false |
| Size / warmup / samples per run | 1000 / 5 / 20 |
| Pairs | 5 |
| CPU slowdown | 20× |
| Chromium | 156.0.8078.4 |
| Mode | production |

| Median timing | Base (ms) | Candidate (ms) | Difference (ms) | Change (%) |
| --- | ---: | ---: | ---: | ---: |
| Synchronous generation | 87.30 | 87.40 | 0.10 | 0.11 |
| Total time to idle | 701.20 | 703.65 | 11.10 | 1.60 |

| Pair | Order | Generation change (%) | Time to idle change (%) |
| --- | --- | ---: | ---: |
| 1 | base → candidate | 7.79 | -2.63 |
| 2 | candidate → base | -6.43 | -1.02 |
| 3 | base → candidate | 0.11 | 1.60 |
| 4 | candidate → base | -3.00 | 2.08 |
| 5 | base → candidate | 10.86 | 2.05 |

Negative changes mean faster. Differences and percentages are medians of paired comparisons; base and candidate columns are medians of run medians.

Both versions use the current harness and installed dependencies. Warmups are excluded. Time to idle includes synchronous generation and frame scheduling, not GPU completion. Results are informational; no performance threshold is applied.

[JSON data](comparison.json) · [Workflow run](https://github.com/lightning-js/blits/actions/runs/39615887283)
