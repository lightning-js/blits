const { readFile } = require('node:fs/promises')

const marker = '<!-- blits-benchmark-results -->'
const branch = 'benchmark-reports'

module.exports = async ({ github, context, core }) => {
  const { comparePairs, formatComparison } = await import('../../benchmarks/comparison.js')
  const repo = context.repo
  const run = context.payload.workflow_run
  let pulls = run.pull_requests
  if (!pulls?.length) {
    pulls = await github.paginate(github.rest.repos.listPullRequestsAssociatedWithCommit, {
      ...repo,
      commit_sha: run.head_sha,
    })
  }
  const report = JSON.parse(await readFile('benchmark-data/comparison.json', 'utf8'))
  const prs = []
  for (const pull of pulls) {
    const { data: pr } = await github.rest.pulls.get({ ...repo, pull_number: pull.number })
    if (
      pr.state === 'open' &&
      pr.head.sha === run.head_sha &&
      pr.head.sha === report.candidate?.commit &&
      pr.base.sha === report.base?.commit
    ) {
      prs.push(pr)
    }
  }
  if (!prs.length) {
    core.info('No open PR matches these head and base commits; skipping stale results.')
    return
  }

  // Artifacts are untrusted data. Validate numeric inputs and escape display text.
  const positiveInteger = (value) => Number.isSafeInteger(value) && value > 0 && value <= 100_000
  if (
    !positiveInteger(report.size) ||
    !positiveInteger(report.samples) ||
    !Number.isSafeInteger(report.warmup) ||
    report.warmup < 0 ||
    report.warmup > 100_000 ||
    !Array.isArray(report.pairs) ||
    !report.pairs.length ||
    report.pairs.length > 100
  ) {
    throw new Error('Invalid benchmark configuration')
  }
  for (const pair of report.pairs) {
    if (
      !Array.isArray(pair.order) ||
      pair.order.length !== 2 ||
      [...pair.order].sort().join(',') !== 'base,candidate'
    ) {
      throw new Error('Invalid benchmark execution order')
    }
    for (const name of ['base', 'candidate']) {
      for (const metric of ['medianGenerationSyncMs', 'medianTotalToIdleMs']) {
        if (!Number.isFinite(pair[name]?.[metric]) || pair[name][metric] < 0) {
          throw new Error('Invalid benchmark timing')
        }
      }
    }
  }
  const text = (value) =>
    String(value)
      .slice(0, 120)
      .replace(/[\\`*_[\]<>|#\r\n]/g, ' ')
  report.title = text(report.title)
  report.browserVersion = text(report.browserVersion)
  report.cpuSlowdown = 20
  report.candidate.dirty = false
  report.comparison = comparePairs(report.pairs)
  if (
    report.comparison.some(
      (row) =>
        !Number.isFinite(row.differenceMs) ||
        (row.changePercent !== null && !Number.isFinite(row.changePercent))
    )
  ) {
    throw new Error('Invalid benchmark comparison')
  }

  const path = `runs/${run.id}-${run.run_attempt || 1}`
  const markdown = `${formatComparison(report)}\n[JSON data](comparison.json) · [Workflow run](${run.html_url})\n`
  let parent
  let baseTree
  try {
    const { data: ref } = await github.rest.git.getRef({ ...repo, ref: `heads/${branch}` })
    parent = ref.object.sha
    const { data: commit } = await github.rest.git.getCommit({ ...repo, commit_sha: parent })
    baseTree = commit.tree.sha
  } catch (error) {
    if (error.status !== 404) throw error
  }
  const { data: tree } = await github.rest.git.createTree({
    ...repo,
    ...(baseTree ? { base_tree: baseTree } : {}),
    tree: [
      { path: `${path}/report.md`, mode: '100644', type: 'blob', content: markdown },
      {
        path: `${path}/comparison.json`,
        mode: '100644',
        type: 'blob',
        content: JSON.stringify(report, null, 2),
      },
    ],
  })
  const { data: commit } = await github.rest.git.createCommit({
    ...repo,
    message: `Added benchmark report for run ${run.id}.`,
    tree: tree.sha,
    parents: parent ? [parent] : [],
  })
  if (parent) {
    await github.rest.git.updateRef({
      ...repo,
      ref: `heads/${branch}`,
      sha: commit.sha,
      force: false,
    })
  } else {
    await github.rest.git.createRef({ ...repo, ref: `refs/heads/${branch}`, sha: commit.sha })
  }

  const url = `${context.serverUrl}/${repo.owner}/${repo.repo}/blob/${commit.sha}/${path}/report.md`
  const change = (metric) => {
    const value = report.comparison.find((row) => row.metric === metric).changePercent
    return value === null ? 'n/a' : `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
  }
  const body = [
    marker,
    '### Benchmark comparison',
    '',
    '| Timing | Change |',
    '| --- | ---: |',
    `| Synchronous generation | ${change('medianGenerationSyncMs')} |`,
    `| Total time to idle | ${change('medianTotalToIdleMs')} |`,
    '',
    'Negative means faster. Informational results; small changes can be measurement noise.',
    '',
    `[Full report](${url}) · [Workflow run](${run.html_url})`,
    '',
    `Head: \`${report.candidate.commit.slice(0, 12)}\` · Base: \`${report.base.commit.slice(0, 12)}\``,
  ].join('\n')
  for (const pr of prs) {
    // Check again in case the PR changed while publishing.
    const { data: current } = await github.rest.pulls.get({ ...repo, pull_number: pr.number })
    if (
      current.state !== 'open' ||
      current.head.sha !== report.candidate.commit ||
      current.base.sha !== report.base.commit
    )
      continue
    const comments = await github.paginate(github.rest.issues.listComments, {
      ...repo,
      issue_number: pr.number,
    })
    const existing = comments.find(
      (comment) => comment.user.login === 'github-actions[bot]' && comment.body?.includes(marker)
    )
    if (existing) {
      await github.rest.issues.updateComment({ ...repo, comment_id: existing.id, body })
    } else {
      await github.rest.issues.createComment({ ...repo, issue_number: pr.number, body })
    }
  }
  core.info(`Published benchmark report: ${url}`)
}
