## Element generation benchmark: comparison

| Configuration | Value |
| --- | --- |
| Base commit | 6fcb4508b30c101dbb3970863eb37307f588583b |
| Candidate commit | 9717159f9385e99abe919269872da25044a614b0 |
| Candidate working tree changes | false |
| Size / warmup / samples per run | 1000 / 5 / 20 |
| Pairs | 5 |
| CPU slowdown | 20× |
| Chromium | 156.0.8078.4 |
| Mode | production |

| Median timing | Base (ms) | Candidate (ms) | Difference (ms) | Change (%) |
| --- | ---: | ---: | ---: | ---: |
| Synchronous generation | 88.95 | 89.80 | -0.35 | -0.41 |
| Total time to idle | 726.55 | 726.55 | -8.55 | -1.19 |

| Pair | Order | Generation change (%) | Time to idle change (%) |
| --- | --- | ---: | ---: |
| 1 | base → candidate | 5.71 | 1.17 |
| 2 | candidate → base | -1.26 | 3.21 |
| 3 | base → candidate | -0.41 | -1.93 |
| 4 | candidate → base | -3.91 | -3.23 |
| 5 | base → candidate | 1.80 | -1.19 |

Negative changes mean faster. Differences and percentages are medians of paired comparisons; base and candidate columns are medians of run medians.

Both versions use the current harness and installed dependencies. Warmups are excluded. Time to idle includes synchronous generation and frame scheduling, not GPU completion. Results are informational; no performance threshold is applied.

[JSON data](comparison.json) · [Workflow run](https://github.com/lightning-js/blits/actions/runs/39947914134)
