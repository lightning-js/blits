/*
 * Copyright 2026 Comcast Cable Communications Management, LLC
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

import type { Profiler, ProfilerEntry } from '@lightningjs/blits'

export type { Profiler, ProfilerEntry }

/** Session-bound measurement token. Pass unchanged to profileEnd. */
export interface ProfileToken {
  readonly sessionId: number
  readonly startTime: number
}

export interface ProfilerFrameOptions {
  frames?: boolean
  maxFrames?: number
  targetFps?: number
}

export interface ProfilerSnapshot {
  measurements: Record<string, ProfilerEntry>
  frames: object
}

/**
 * Marks the start of a measurement.
 *
 * Returns `0` when the profiler is disabled.
 */
export function profileBegin(): ProfileToken | 0

/**
 * Records a measurement started with `profileBegin`
 */
export function profileEnd(name: string, start: ProfileToken | 0): void

/**
 * Measures the execution time of a (synchronous) function
 */
export function profile<T>(name: string, fn: () => T): T

/** Attaches the profiler to a renderer that emits frameTick events. */
export function setProfilerRenderer(renderer: unknown): void

declare const profiler: Profiler
export default profiler
