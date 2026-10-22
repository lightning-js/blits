/*
 * Copyright 2024 Comcast Cable Communications Management, LLC
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

export interface LanguagePlugin {
  translate(key: string, ...replacements: any[]): string
  readonly language: string
  set(language: string): void
  translations(translationsObject: Record<string, unknown>): void
  load(file: string): Promise<void>
}

export interface LanguagePluginOptions {
  file?: string
  language?: string
}

declare const language: {
  readonly name: 'language'
  plugin: (options?: LanguagePluginOptions) => LanguagePlugin
}

export default language

