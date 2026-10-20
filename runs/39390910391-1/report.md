## Element generation benchmark: comparison

| Configuration | Value |
| --- | --- |
| Base commit | 6b67468a4e1ea4042573c0c31457295086938881 |
| Candidate commit | 4ace7d54eeded0f618d72822e0c12655a8863c5e |
| Candidate working tree changes | false |
| Size / warmup / samples per run | 1000 / 5 / 20 |
| Pairs | 5 |
| CPU slowdown | 20× |
| Chromium | 156.0.8078.4 |
| Mode | production |

| Median timing | Base (ms) | Candidate (ms) | Difference (ms) | Change (%) |
| --- | ---: | ---: | ---: | ---: |
| Synchronous generation | 97.90 | 102.65 | 4.75 | 4.85 |
| Total time to idle | 766.35 | 794.20 | 18.20 | 2.44 |

| Pair | Order | Generation change (%) | Time to idle change (%) |
| --- | --- | ---: | ---: |
| 1 | base → candidate | -8.13 | -9.33 |
| 2 | candidate → base | 5.76 | 2.44 |
| 3 | base → candidate | 8.55 | 7.56 |
| 4 | candidate → base | 4.85 | 3.80 |
| 5 | base → candidate | -1.23 | -0.86 |

Negative changes mean faster. Differences and percentages are medians of paired comparisons; base and candidate columns are medians of run medians.

Both versions use the current harness and installed dependencies. Warmups are excluded. Time to idle includes synchronous generation and frame scheduling, not GPU completion. Results are informational; no performance threshold is applied.

[JSON data](comparison.json) · [Workflow run](https://github.com/lightning-js/blits/actions/runs/39390910391)
