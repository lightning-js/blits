## Element generation benchmark: comparison

| Configuration | Value |
| --- | --- |
| Base commit | 7abb7a88652f3ec5990d7612503d70863b5a3a06 |
| Candidate commit | cc8a4e3d41651762590968ee88cdbd5a2e578ec8 |
| Candidate working tree changes | false |
| Size / warmup / samples per run | 1000 / 5 / 20 |
| Pairs | 5 |
| CPU slowdown | 20× |
| Chromium | 156.0.8078.4 |
| Mode | production |

| Median timing | Base (ms) | Candidate (ms) | Difference (ms) | Change (%) |
| --- | ---: | ---: | ---: | ---: |
| Synchronous generation | 58.45 | 61.60 | 1.70 | 3.07 |
| Total time to idle | 469.10 | 496.40 | 19.75 | 4.32 |

| Pair | Order | Generation change (%) | Time to idle change (%) |
| --- | --- | ---: | ---: |
| 1 | base → candidate | 1.09 | 0.05 |
| 2 | candidate → base | 8.46 | 3.00 |
| 3 | base → candidate | 5.39 | 7.33 |
| 4 | candidate → base | 3.07 | 4.32 |
| 5 | base → candidate | -10.53 | 5.33 |

Negative changes mean faster. Differences and percentages are medians of paired comparisons; base and candidate columns are medians of run medians.

Both versions use the current harness and installed dependencies. Warmups are excluded. Time to idle includes synchronous generation and frame scheduling, not GPU completion. Results are informational; no performance threshold is applied.

[JSON data](comparison.json) · [Workflow run](https://github.com/lightning-js/blits/actions/runs/39586864956)
