## Element generation benchmark: comparison

| Configuration | Value |
| --- | --- |
| Base commit | 7abb7a88652f3ec5990d7612503d70863b5a3a06 |
| Candidate commit | 1a4cff13e2da96a3f7828eb08f5662c98933c18e |
| Candidate working tree changes | false |
| Size / warmup / samples per run | 1000 / 5 / 20 |
| Pairs | 5 |
| CPU slowdown | 20× |
| Chromium | 156.0.8078.4 |
| Mode | production |

| Median timing | Base (ms) | Candidate (ms) | Difference (ms) | Change (%) |
| --- | ---: | ---: | ---: | ---: |
| Synchronous generation | 101.30 | 98.25 | -2.70 | -2.83 |
| Total time to idle | 785.70 | 742.55 | -24.55 | -3.13 |

| Pair | Order | Generation change (%) | Time to idle change (%) |
| --- | --- | ---: | ---: |
| 1 | base → candidate | -2.83 | -2.13 |
| 2 | candidate → base | -6.03 | -11.33 |
| 3 | base → candidate | 2.26 | -5.49 |
| 4 | candidate → base | -3.01 | -3.13 |
| 5 | base → candidate | 0.28 | -1.71 |

Negative changes mean faster. Differences and percentages are medians of paired comparisons; base and candidate columns are medians of run medians.

Both versions use the current harness and installed dependencies. Warmups are excluded. Time to idle includes synchronous generation and frame scheduling, not GPU completion. Results are informational; no performance threshold is applied.

[JSON data](comparison.json) · [Workflow run](https://github.com/lightning-js/blits/actions/runs/39316051209)
