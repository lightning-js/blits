## Element generation benchmark: comparison

| Configuration | Value |
| --- | --- |
| Base commit | f34a485dd2f0fe7a7e6bf75ef405b58feaf8d60b |
| Candidate commit | 19f63196d48a27303f40cc42aa01528162d32129 |
| Candidate working tree changes | false |
| Size / warmup / samples per run | 1000 / 5 / 20 |
| Pairs | 5 |
| CPU slowdown | 20× |
| Chromium | 156.0.8078.4 |
| Mode | production |

| Median timing | Base (ms) | Candidate (ms) | Difference (ms) | Change (%) |
| --- | ---: | ---: | ---: | ---: |
| Synchronous generation | 100.00 | 101.40 | 1.85 | 1.86 |
| Total time to idle | 787.40 | 793.60 | 1.50 | 0.19 |

| Pair | Order | Generation change (%) | Time to idle change (%) |
| --- | --- | ---: | ---: |
| 1 | base → candidate | 1.86 | -1.23 |
| 2 | candidate → base | -0.62 | 1.08 |
| 3 | base → candidate | 9.61 | 0.47 |
| 4 | candidate → base | 2.75 | -0.89 |
| 5 | base → candidate | -3.78 | 0.19 |

Negative changes mean faster. Differences and percentages are medians of paired comparisons; base and candidate columns are medians of run medians.

Both versions use the current harness and installed dependencies. Warmups are excluded. Time to idle includes synchronous generation and frame scheduling, not GPU completion. Results are informational; no performance threshold is applied.

[JSON data](comparison.json) · [Workflow run](https://github.com/lightning-js/blits/actions/runs/39747663064)
