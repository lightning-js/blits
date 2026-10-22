## Element generation benchmark: comparison

| Configuration | Value |
| --- | --- |
| Base commit | 6bd46f43dc334971ae9cb36b3ac9244b26550e94 |
| Candidate commit | 73ccda59c98e068ab6f51cd8389e16ecadce4364 |
| Candidate working tree changes | false |
| Size / warmup / samples per run | 1000 / 5 / 20 |
| Pairs | 5 |
| CPU slowdown | 20× |
| Chromium | 156.0.8078.4 |
| Mode | production |

| Median timing | Base (ms) | Candidate (ms) | Difference (ms) | Change (%) |
| --- | ---: | ---: | ---: | ---: |
| Synchronous generation | 63.55 | 61.90 | 0.70 | 1.05 |
| Total time to idle | 508.05 | 510.65 | 2.60 | 0.51 |

| Pair | Order | Generation change (%) | Time to idle change (%) |
| --- | --- | ---: | ---: |
| 1 | base → candidate | -3.48 | 3.81 |
| 2 | candidate → base | 7.37 | 11.26 |
| 3 | base → candidate | 1.05 | 0.51 |
| 4 | candidate → base | 1.71 | -3.07 |
| 5 | base → candidate | -4.64 | -2.98 |

Negative changes mean faster. Differences and percentages are medians of paired comparisons; base and candidate columns are medians of run medians.

Both versions use the current harness and installed dependencies. Warmups are excluded. Time to idle includes synchronous generation and frame scheduling, not GPU completion. Results are informational; no performance threshold is applied.

[JSON data](comparison.json) · [Workflow run](https://github.com/lightning-js/blits/actions/runs/39799759640)
