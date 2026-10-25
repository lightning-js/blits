/*
 * Copyright 2023 Comcast Cable Communications Management, LLC
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

// Async batch scheduler, ported from Vue2's
// `src/core/observer/scheduler.ts` (queueWatcher / flushSchedulerQueue)
// combined with `src/core/util/next-tick.ts` (microtask defer).
//
// Default behaviour: `trigger()` queues effects and flushes once per
// microtask, so N synchronous state writes that touch the same effect
// produce 1 run instead of N.
//
// The queue stays ordered (parents before children, by `job.id`) through
// sorted insertion on enqueue — no `Array.sort` pass on flush.

const queue = []
const has = new Set()
let waiting = false
let flushing = false
let index = 0

const jobId = (job) => (job.id === undefined ? 0 : job.id)

const scheduleMicrotaskFlush = () => {
  if (waiting === true) return
  waiting = true
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(flushJobs)
  } else {
    Promise.resolve().then(flushJobs)
  }
}

export const flushJobs = () => {
  if (flushing === true) return
  flushing = true
  try {
    for (index = 0; index < queue.length; index++) {
      const entry = queue[index]
      has.delete(entry.job)
      entry.job(entry.arg)
    }
  } finally {
    queue.length = 0
    has.clear()
    index = 0
    flushing = false
    waiting = false
  }
}

export const queueJob = (job, arg) => {
  if (has.has(job) === true) {
    return
  }
  has.add(job)
  const id = jobId(job)
  // Sorted insert, stable for equal ids (FIFO): scan backwards from the
  // end for the first entry with an id at or below ours and insert after
  // it. While flushing, never insert at or before the running index so
  // already-run jobs are not revisited.
  const start = flushing === true ? index + 1 : 0
  let pos = start
  for (let i = queue.length - 1; i >= start; i--) {
    if (jobId(queue[i].job) <= id) {
      pos = i + 1
      break
    }
    pos = i
  }
  queue.splice(pos, 0, { job: job, arg: arg })
  scheduleMicrotaskFlush()
}

export const invalidateJob = (job) => {
  if (has.has(job) === false) return
  has.delete(job)
  for (let i = 0; i < queue.length; i++) {
    if (queue[i].job === job) {
      queue.splice(i, 1)
      return
    }
  }
}
