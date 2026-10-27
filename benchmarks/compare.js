import { execFileSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, rm, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildBenchmark, measureBenchmark, writeReport } from './runner.js'
import { comparePairs, formatComparison, formatComparisonSuite } from './comparison.js'
import { benchmarks, defaultBenchmark, validateBenchmark } from './benchmarks.js'
import { validateOptions, validateCpuSlowdown } from './src/benchmark-utils.js'

const root = fileURLToPath(new URL('..', import.meta.url))
const args = process.argv.slice(2)
const value = (name, fallback) => {
  const index = args.indexOf(name)
  if (index === -1) return fallback
  if (!args[index + 1] || args[index + 1].startsWith('--')) {
    throw new Error(`${name} requires a value`)
  }
  return args[index + 1]
}
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
const commit = (ref) => {
  try {
    return git('rev-parse', '--verify', '--end-of-options', `${ref}^{commit}`)
  } catch {
    // Full fetches in CI usually provide origin/<branch>, not local branches.
    return git('rev-parse', '--verify', '--end-of-options', `refs/remotes/origin/${ref}^{commit}`)
  }
}

const snapshot = async (destination, sha, temporary) => {
  await mkdir(destination)
  if (sha) {
    const archive = join(temporary, 'source.tar')
    git('archive', '--format=tar', `--output=${archive}`, sha)
    execFileSync('tar', ['-xf', archive, '-C', destination])
  } else {
    // Include uncommitted and untracked source, but no ignored files or dependencies.
    const files = execFileSync(
      'git',
      ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
      {
        cwd: root,
        encoding: 'utf8',
      }
    )
      .split('\0')
      .filter(Boolean)
    for (const file of new Set(files)) {
      if (file.startsWith('benchmarks/')) continue
      const target = join(destination, file)
      await mkdir(dirname(target), { recursive: true })
      try {
        await cp(join(root, file), target, { dereference: false })
      } catch (error) {
        if (error.code !== 'ENOENT') throw error // Deleted working-tree files stay deleted.
      }
    }
  }
  // Compare Blits source with identical installed dependencies and build tooling.
  await rm(join(destination, 'node_modules'), { recursive: true, force: true })
  await symlink(join(root, 'node_modules'), join(destination, 'node_modules'), 'dir')
}

const run = async () => {
  const all = args.includes('--all')
  const short = args.includes('--short')
  if (all && args.includes('--benchmark'))
    throw new Error('Use either --all or --benchmark, not both')
  const baseRef = value('--base')
  if (!baseRef) throw new Error('Usage: npm run bench:compare -- --base <branch-or-commit>')
  const candidateRef = value('--candidate')
  const output = value('--output', 'results/comparison.json')
  const pairCount = Number(value('--pairs', 2))
  const options = {
    benchmark: validateBenchmark(value('--benchmark', defaultBenchmark)),
    cpuSlowdown: Number(value('--cpu-slowdown', 20)),
    size: Number(value('--size', 1000)),
    warmup: Number(value('--warmup', 5)),
    samples: Number(value('--samples', 20)),
  }
  validateOptions(options)
  validateCpuSlowdown(options.cpuSlowdown)
  if (!Number.isSafeInteger(pairCount) || pairCount < 1)
    throw new Error('--pairs must be a positive integer')
  if (args.includes('--profile'))
    throw new Error('Comparisons use production mode; --profile is unsupported')
  const base = { ref: baseRef, commit: commit(baseRef) }
  const candidate = {
    ref: candidateRef || 'working tree',
    commit: commit(candidateRef || 'HEAD'),
    dirty: !candidateRef && git('status', '--porcelain').length > 0,
  }
  const temporary = await mkdtemp(join(tmpdir(), 'blits-benchmark-'))
  try {
    const configs = {}
    for (const [name, sha] of [
      ['base', base.commit],
      ['candidate', candidateRef ? candidate.commit : undefined],
    ]) {
      console.log(`Preparing ${name}…`)
      const source = join(temporary, name)
      await snapshot(source, sha, temporary)
      configs[name] = await buildBenchmark(source, resolve(temporary, `${name}-dist`))
    }
    const reports = []
    const names = all ? Object.keys(benchmarks) : [options.benchmark]
    for (const benchmark of names) {
      const pairs = []
      for (let index = 0; index < pairCount; index++) {
        const order = index % 2 === 0 ? ['base', 'candidate'] : ['candidate', 'base']
        const pair = { order }
        for (const name of order) {
          console.log(`${benchmark}: pair ${index + 1}/${pairCount}: ${name}`)
          pair[name] = await measureBenchmark(
            configs[name],
            { ...options, benchmark, allowUnsupported: name === 'base' },
            args.includes('--headed')
          )
        }
        pairs.push(pair)
      }
      const report = {
        title: pairs[0].candidate.title,
        ...options,
        benchmark,
        base,
        candidate,
        cpuSlowdown: options.cpuSlowdown,
        browserVersion: pairs[0].candidate.browserVersion,
        pairs,
        comparison: comparePairs(pairs),
      }
      reports.push(report)
    }
    const report = all ? { base, candidate, benchmarks: reports } : reports[0]
    const summary = all ? formatComparisonSuite(report) : formatComparison(report)
    if (!short) console.log(summary)
    await writeReport(report, output, summary, short)
  } finally {
    await rm(temporary, { recursive: true, force: true })
  }
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
