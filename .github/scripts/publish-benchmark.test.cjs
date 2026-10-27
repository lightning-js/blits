const assert = require('node:assert/strict')
const { before, after, test } = require('node:test')
const { mkdtemp, mkdir, writeFile, rm } = require('node:fs/promises')
const { tmpdir } = require('node:os')
const { join } = require('node:path')
const publish = require('./publish-benchmark.cjs')

const head = 'a'.repeat(40)
const base = 'b'.repeat(40)
const originalDirectory = process.cwd()
let directory
before(async () => {
  directory = await mkdtemp(join(tmpdir(), 'benchmark-publisher-test-'))
  process.chdir(directory)
  await mkdir('benchmark-data')
})
after(async () => {
  process.chdir(originalDirectory)
  await rm(directory, { recursive: true, force: true })
})

const fixture = async ({
  existing = false,
  stale = false,
  invalid = false,
  suite = false,
  mutate,
} = {}) => {
  const calls = []
  const report = {
    title: 'Element generation benchmark',
    base: { commit: base },
    candidate: { commit: head },
    size: 1000,
    warmup: 5,
    samples: 20,
    browserVersion: '156.0',
    pairs: [
      {
        order: ['base', 'candidate'],
        base: { medianGenerationSyncMs: 100, medianTotalToIdleMs: 200 },
        candidate: { medianGenerationSyncMs: invalid ? 'bad' : 80, medianTotalToIdleMs: 220 },
      },
    ],
    comparison: [{ changePercent: 999 }], // Recomputed rather than trusted.
  }
  const data = suite
    ? {
        base: report.base,
        candidate: report.candidate,
        benchmarks: [
          { ...report, benchmark: 'element-creation' },
          {
            ...structuredClone(report),
            benchmark: 'component-creation',
            title: 'Component generation benchmark',
          },
        ],
      }
    : report
  mutate?.(data)
  await writeFile('benchmark-data/comparison.json', JSON.stringify(data))
  const method = (name, data) => async (args) => {
    calls.push({ name, args })
    return { data }
  }
  const github = {
    rest: {
      pulls: {
        get: method('pulls.get', {
          number: 12,
          state: 'open',
          head: { sha: stale ? 'c'.repeat(40) : head },
          base: { sha: base },
        }),
      },
      repos: { listPullRequestsAssociatedWithCommit: () => {} },
      issues: {
        listComments: () => {},
        createComment: method('createComment', {}),
        updateComment: method('updateComment', {}),
      },
      git: {
        getRef: existing
          ? method('getRef', { object: { sha: 'parent' } })
          : async () => {
              throw Object.assign(new Error('missing'), { status: 404 })
            },
        getCommit: method('getCommit', { tree: { sha: 'previous-tree' } }),
        createTree: method('createTree', { sha: 'tree' }),
        createCommit: method('createCommit', { sha: 'report-commit' }),
        createRef: method('createRef', {}),
        updateRef: method('updateRef', {}),
      },
    },
  }
  github.paginate = async () =>
    existing
      ? [
          {
            id: 42,
            user: { login: 'github-actions[bot]' },
            body: '<!-- blits-benchmark-results -->',
          },
        ]
      : []
  const context = {
    repo: { owner: 'example', repo: 'blits' },
    serverUrl: 'https://github.com',
    payload: {
      workflow_run: {
        id: 123,
        run_attempt: 1,
        head_sha: head,
        pull_requests: [{ number: 12 }],
        html_url: 'https://github.com/example/blits/actions/runs/123',
      },
    },
  }
  return { github, context, core: { info: () => {} }, calls }
}

test('creates an isolated report branch and links its immutable commit with computed percentages', async () => {
  const mock = await fixture()
  await publish(mock)
  const tree = mock.calls.find((call) => call.name === 'createTree').args
  assert.equal(tree.base_tree, undefined)
  assert.match(tree.tree[0].content, /Synchronous generation/)
  assert.deepEqual(mock.calls.find((call) => call.name === 'createCommit').args.parents, [])
  assert.equal(
    mock.calls.find((call) => call.name === 'createRef').args.ref,
    'refs/heads/benchmark-reports'
  )
  const body = mock.calls.find((call) => call.name === 'createComment').args.body
  assert.match(body, /-20\.00%/)
  assert.match(body, /\+10\.00%/)
  assert.match(body, /blob\/report-commit\/runs\/123-1\/report.md/)
})

test('preserves previous reports and updates the existing bot comment', async () => {
  const mock = await fixture({ existing: true })
  await publish(mock)
  assert.equal(
    mock.calls.find((call) => call.name === 'createTree').args.base_tree,
    'previous-tree'
  )
  assert.deepEqual(mock.calls.find((call) => call.name === 'createCommit').args.parents, ['parent'])
  assert.equal(mock.calls.find((call) => call.name === 'updateRef').args.force, false)
  assert.equal(mock.calls.find((call) => call.name === 'updateComment').args.comment_id, 42)
  assert.ok(!mock.calls.some((call) => call.name === 'createComment'))
})

test('skips stale results and rejects invalid timings before publication', async () => {
  const stale = await fixture({ stale: true })
  await publish(stale)
  assert.ok(!stale.calls.some((call) => call.name === 'createTree'))
  const invalid = await fixture({ invalid: true })
  await assert.rejects(publish(invalid), /Invalid benchmark timing/)
  assert.ok(!invalid.calls.some((call) => call.name === 'createTree'))
})

test('publishes every benchmark with individual comparisons and run configuration', async () => {
  const mock = await fixture({ suite: true })
  await publish(mock)
  const body = mock.calls.find((call) => call.name === 'createComment').args.body
  assert.match(body, /Benchmark \| Generation change \| Time to idle change/)
  assert.match(body, /Element generation benchmark \| -20\.00% \| \+10\.00%/)
  assert.match(body, /Component generation benchmark \| -20\.00% \| \+10\.00%/)
  assert.match(body, /1 pairs, 5 warmups and 20 samples/)
  const tree = mock.calls.find((call) => call.name === 'createTree').args.tree
  assert.match(tree[0].content, /## Element generation benchmark: comparison/)
  assert.match(tree[0].content, /## Component generation benchmark: comparison/)
  const saved = JSON.parse(tree[1].content)
  assert.equal(saved.benchmarks.length, 2)
  assert.equal(saved.benchmarks[1].comparison[0].changePercent, -20)
})

test('rejects invalid suite entries before writing reports or comments', async () => {
  for (const [mutate, expected] of [
    [
      (report) => {
        report.benchmarks = []
      },
      /Invalid benchmark suite/,
    ],
    [
      (report) => {
        report.benchmarks[1].pairs[0].candidate.medianTotalToIdleMs = -1
      },
      /Invalid benchmark timing/,
    ],
    [
      (report) => {
        report.benchmarks[1].candidate.commit = 'different'
      },
      /commit identities/,
    ],
  ]) {
    const mock = await fixture({ suite: true, mutate })
    await assert.rejects(publish(mock), expected)
    assert.ok(
      !mock.calls.some((call) =>
        ['createTree', 'createComment', 'updateComment'].includes(call.name)
      )
    )
  }
})

test('escapes suite titles before rendering comment tables and report sections', async () => {
  const mock = await fixture({
    suite: true,
    mutate: (report) => {
      report.benchmarks[1].title = '<script>|injected\nrow'
    },
  })
  await publish(mock)
  const body = mock.calls.find((call) => call.name === 'createComment').args.body
  assert.doesNotMatch(body, /<script>|injected\nrow/)
})

test('publishes N/A for explicitly unsupported baselines with candidate timings and escaped reasons', async () => {
  const mock = await fixture({
    suite: true,
    mutate: (report) => {
      report.benchmarks[1].pairs[0].base = {
        status: 'unsupported',
        reason: 'Requires <new> API|test',
      }
    },
  })
  await publish(mock)
  const body = mock.calls.find((call) => call.name === 'createComment').args.body
  assert.match(body, /Component generation benchmark \| N\/A \| N\/A/)
  assert.match(body, /unsupported by baseline: Requires {2}new {2}API test/)
  const tree = mock.calls.find((call) => call.name === 'createTree').args.tree
  assert.match(tree[0].content, /N\/A \| 80\.00 \| N\/A/)
  const report = JSON.parse(tree[1].content)
  assert.equal(report.benchmarks[1].comparison[0].candidateMs, 80)
})

test('rejects unsupported candidates and unsupported baselines without explicit reasons', async () => {
  for (const [side, reason, expected] of [
    ['candidate', 'Requires feature X', /Candidate benchmark unsupported/],
    ['base', '', /Invalid unsupported baseline reason/],
  ]) {
    const mock = await fixture({
      suite: true,
      mutate: (report) => {
        report.benchmarks[1].pairs[0][side] = { status: 'unsupported', reason }
      },
    })
    await assert.rejects(publish(mock), expected)
    assert.ok(!mock.calls.some((call) => call.name === 'createTree'))
  }
})

test('preserves the measured CPU rate and rejects invalid rates', async () => {
  const mock = await fixture({
    mutate: (report) => {
      report.cpuSlowdown = 4
    },
  })
  await publish(mock)
  const tree = mock.calls.find((call) => call.name === 'createTree').args.tree
  assert.match(tree[0].content, /CPU slowdown \| 4×/)
  assert.equal(JSON.parse(tree[1].content).cpuSlowdown, 4)
  const invalid = await fixture({
    mutate: (report) => {
      report.cpuSlowdown = 0
    },
  })
  await assert.rejects(publish(invalid), /Invalid CPU slowdown/)
})
