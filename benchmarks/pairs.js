export const runPairs = async (count, measure, onProgress) => {
  const pairs = []
  for (let index = 0; index < count; index++) {
    const order = index % 2 === 0 ? ['base', 'candidate'] : ['candidate', 'base']
    const pair = { order }
    pairs.push(pair)
    await onProgress(pairs)
    for (const side of order) {
      pair[side] = await measure(side, index)
      await onProgress(pairs)
    }
  }
  return pairs
}
