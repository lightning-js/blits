## Element generation benchmark: comparison

| Configuration | Value |
| --- | --- |
| Base commit | c9f3603cbf4bed44b0f71cfe271fb48e9b8e291c |
| Candidate commit | 6e255578aab17923894fe956e95894b73e92fd40 |
| Candidate working tree changes | false |
| Size / warmup / samples per run | 1000 / 5 / 20 |
| Pairs | 5 |
| CPU slowdown | 20× |
| Chromium | 156.0.8078.4 |
| Mode | production |

| Median timing | Base (ms) | Candidate (ms) | Difference (ms) | Change (%) |
| --- | ---: | ---: | ---: | ---: |
| Synchronous generation | 0.00 | 0.00 | 0.00 | n/a |
| Total time to idle | 750.70 | 760.70 | 10.00 | 1.33 |

| Pair | Order | Generation change (%) | Time to idle change (%) |
| --- | --- | ---: | ---: |
| 1 | base → candidate | n/a | -11.59 |
| 2 | candidate → base | n/a | 5.50 |
| 3 | base → candidate | n/a | 1.33 |
| 4 | candidate → base | n/a | -2.67 |
| 5 | base → candidate | -100.00 | 5.05 |

Negative changes mean faster. Differences and percentages are medians of paired comparisons; base and candidate columns are medians of run medians.

Both versions use the current harness and installed dependencies. Warmups are excluded. Time to idle includes synchronous generation and frame scheduling, not GPU completion. Results are informational; no performance threshold is applied.

[JSON data](comparison.json) · [Workflow run](https://github.com/lightning-js/blits/actions/runs/40231143546)
