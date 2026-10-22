## Element generation benchmark: comparison

| Configuration | Value |
| --- | --- |
| Base commit | 16e04054d89c06afae90458b25e75f82f203d7f4 |
| Candidate commit | e60972878fa9bd4cfb654f3d337f5aa857cdc678 |
| Candidate working tree changes | false |
| Size / warmup / samples per run | 1000 / 5 / 20 |
| Pairs | 5 |
| CPU slowdown | 20× |
| Chromium | 156.0.8078.4 |
| Mode | production |

| Median timing | Base (ms) | Candidate (ms) | Difference (ms) | Change (%) |
| --- | ---: | ---: | ---: | ---: |
| Synchronous generation | 57.65 | 63.10 | 6.20 | 10.90 |
| Total time to idle | 486.05 | 492.35 | 6.30 | 1.30 |

| Pair | Order | Generation change (%) | Time to idle change (%) |
| --- | --- | ---: | ---: |
| 1 | base → candidate | 11.51 | 2.55 |
| 2 | candidate → base | -4.80 | 1.30 |
| 3 | base → candidate | -10.54 | -0.82 |
| 4 | candidate → base | 13.01 | -3.21 |
| 5 | base → candidate | 10.90 | 3.55 |

Negative changes mean faster. Differences and percentages are medians of paired comparisons; base and candidate columns are medians of run medians.

Both versions use the current harness and installed dependencies. Warmups are excluded. Time to idle includes synchronous generation and frame scheduling, not GPU completion. Results are informational; no performance threshold is applied.

[JSON data](comparison.json) · [Workflow run](https://github.com/lightning-js/blits/actions/runs/39732080835)
