## Element generation benchmark: comparison

| Configuration | Value |
| --- | --- |
| Base commit | 6b67468a4e1ea4042573c0c31457295086938881 |
| Candidate commit | 51ee508af4dd1951f6e52d5fb7fb58bc45c4095f |
| Candidate working tree changes | false |
| Size / warmup / samples per run | 1000 / 5 / 20 |
| Pairs | 5 |
| CPU slowdown | 20× |
| Chromium | 156.0.8078.4 |
| Mode | production |

| Median timing | Base (ms) | Candidate (ms) | Difference (ms) | Change (%) |
| --- | ---: | ---: | ---: | ---: |
| Synchronous generation | 53.85 | 54.60 | 1.70 | 3.29 |
| Total time to idle | 404.35 | 391.55 | -14.90 | -3.68 |

| Pair | Order | Generation change (%) | Time to idle change (%) |
| --- | --- | ---: | ---: |
| 1 | base → candidate | 4.35 | -10.03 |
| 2 | candidate → base | 3.29 | 3.07 |
| 3 | base → candidate | 6.31 | -4.78 |
| 4 | candidate → base | -2.41 | -3.68 |
| 5 | base → candidate | 2.40 | 1.20 |

Negative changes mean faster. Differences and percentages are medians of paired comparisons; base and candidate columns are medians of run medians.

Both versions use the current harness and installed dependencies. Warmups are excluded. Time to idle includes synchronous generation and frame scheduling, not GPU completion. Results are informational; no performance threshold is applied.

[JSON data](comparison.json) · [Workflow run](https://github.com/lightning-js/blits/actions/runs/39314211937)
