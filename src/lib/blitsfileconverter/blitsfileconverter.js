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

export default (source) => {
  const { template, script } = parseBlitsFile(source)
  return injectTemplate(script, template)
}

const parseBlitsFile = (source) => {
  const templateMatch = source.match(/<template>([\s\S]*?)<\/template>/)
  const scriptMatch = source.match(/<script>([\s\S]*?)<\/script>/)
  return {
    template: templateMatch ? templateMatch[1].trim() : '',
    script: scriptMatch ? scriptMatch[1].trim() : '',
  }
}

const injectTemplate = (script, template) => {
  const componentRegex =
    /(Blits\.Component|Component)\s*\(\s*(['"`])(?:(?=(\\?))\3.)*?\2\s*,\s*\{|Blits\.Application\s*\(\s*\{/

  const match = script.match(componentRegex)

  if (!match) {
    // we might consider initializing a component if it's not found automatically
    throw new Error(
      'Could not find Blits.Component, Component, or Blits.Application initialization in the script'
    )
  }

  // The insertion point is right after the opening curly brace
  const insertIndex = match.index + match[0].length

  // Using template literals to preserve multiline strings and escape characters
  const injection = `\n  template: \`${template.replace(/`/g, '\\`')}\`,\n`
  return script.slice(0, insertIndex) + injection + script.slice(insertIndex)
}
