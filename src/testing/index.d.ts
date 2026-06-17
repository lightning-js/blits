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

import type { ComponentFactory, Settings } from '@lightningjs/blits'

export interface SnapshotNode {
  type: string
  attributes: Record<string, any>
  children: SnapshotNode[]
}

export interface ComponentSnapshotNode extends SnapshotNode {
  type: 'Component'
  name: string
  props: Record<string, any>
  state: Record<string, any>
}

export interface RenderComponentOptions {
  props?: Record<string, any>
  settings?: Settings
}

export interface RenderComponentFixture {
  component: any
  root: any
  snapshot(): SnapshotNode | ComponentSnapshotNode
  setProps(props: Record<string, any>): void
  destroy(): void
}

export function renderComponent(
  Component: ComponentFactory,
  options?: RenderComponentOptions
): RenderComponentFixture
