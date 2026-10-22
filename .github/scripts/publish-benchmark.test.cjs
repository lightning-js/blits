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

const fixture = async ({ existing = false, stale = false, invalid = false } = {}) => {
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
  await writeFile('benchmark-data/comparison.json', JSON.stringify(report))
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
