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

export default (code) => {
  // Find component declarations
  const componentRegex =
    /Blits\.(Component|Application)\s*\(\s*(?:'[^']*'|"[^"]*")?\s*(?:,\s*)?({[\s\S]*?})\s*\)/g
  const modifications = []
  const commentText = ' /* auto-generated reactivity guard */ '

  let match
  while ((match = componentRegex.exec(code)) !== null) {
    const configObject = match[2]

    // Find computed section with proper brace balancing
    const computedKeywordMatch = /computed\s*:\s*{/.exec(configObject)

    if (computedKeywordMatch) {
      // Find start position of the computed block
      const computedStart = computedKeywordMatch.index + computedKeywordMatch[0].length - 1 // Position of the opening brace

      // Find the matching closing brace with balance tracking
      let braceLevel = 1
      let pos = computedStart + 1

      while (braceLevel > 0 && pos < configObject.length) {
        if (configObject[pos] === '{') braceLevel++
        else if (configObject[pos] === '}') braceLevel--
        pos++
      }

      if (braceLevel === 0) {
        const computedEnd = pos
        const computedObj = configObject.substring(computedStart, computedEnd)

        // Process each computed property
        const computedProps = []
        let currentPos = 1 // Start after the opening brace

        // Process computed properties content
        // intentionally not using regexes to extract functions and their content
        // using cursor-based parsing gives better accuracy
        while (currentPos < computedObj.length - 1) {
          // -1 to exclude the closing brace
          // Find the next function name
          const functionNameMatch = /\s*(\w+)\s*\(\)/.exec(computedObj.substring(currentPos))
          if (!functionNameMatch) break

          const funcName = functionNameMatch[1]
          const funcNamePos = currentPos + functionNameMatch.index

          // Find opening brace for this function
          const openingBracePos = computedObj.indexOf('{', funcNamePos)
          if (openingBracePos === -1) break

          // Find closing brace with proper nesting
          let braceLevel = 1
          let closingBracePos = openingBracePos + 1

          while (braceLevel > 0 && closingBracePos < computedObj.length) {
            if (computedObj[closingBracePos] === '{') braceLevel++
            else if (computedObj[closingBracePos] === '}') braceLevel--
            closingBracePos++
          }

          if (braceLevel !== 0) {
            // Could not find matching brace
            break
          }

          // Extract the entire function and its body
          // This is better and more accurate than using regex to avoid nested braces
          const functionStartPos = funcNamePos
          const functionEndPos = closingBracePos
          const fullFunction = computedObj.substring(functionStartPos, functionEndPos)
          const functionBody = computedObj
            .substring(openingBracePos + 1, closingBracePos - 1)
            .trim()

          computedProps.push({
            name: funcName,
            fullText: fullFunction,
            body: functionBody,
            startPos: functionStartPos,
            endPos: functionEndPos,
          })

          // Move past this function
          currentPos = closingBracePos
        }

        // Store the original computed object for later replacement
        const originalComputedObj = configObject.substring(
          computedStart - 'computed: '.length,
          computedEnd
        )

        let modifiedComputedObj = originalComputedObj
        let hasChanges = false

        for (const prop of computedProps) {
          const thisRefs = extractThisReferences(prop.body)

          if (thisRefs.size > 0) {
            // Skip if already modified
            if (
              prop.body.includes(commentText) ||
              Array.from(thisRefs).some((ref) => prop.body.startsWith(ref))
            ) {
              continue
            }

            // reactivity code
            const refCode = Array.from(thisRefs)
              .map((ref) => `${ref};`)
              .join(' ')

            // replacement with the same whitespace
            const openBraceIndex = prop.fullText.indexOf('{')

            if (openBraceIndex !== -1) {
              const modifiedPropText =
                prop.fullText.substring(0, openBraceIndex + 1) +
                commentText +
                refCode +
                ' ' +
                prop.body +
                '}'

              // Replace this property in the computed object text
              modifiedComputedObj = modifiedComputedObj.replace(prop.fullText, modifiedPropText)
              hasChanges = true
            }
          }
        }

        if (hasChanges) {
          // Store the modification of the entire computed object
          modifications.push({
            original: originalComputedObj,
            replacement: modifiedComputedObj,
          })
        }
      }
    }
  }

  // Apply all modifications at once, from last to first to preserve positions
  if (modifications.length > 0) {
    let modifiedCode = code
    // Sort modifications from last to first to avoid position changes
    modifications.sort((a, b) => {
      const posA = modifiedCode.indexOf(a.original)
      const posB = modifiedCode.indexOf(b.original)
      return posB - posA
    })

    for (const mod of modifications) {
      modifiedCode = modifiedCode.replace(mod.original, mod.replacement)
    }

    return { code: modifiedCode }
  }

  return null
}

const extractThisReferences = (funcBody) => {
  const thisRefs = new Set()

  // Find all this.X references, but exclude method calls
  const refRegex = /this\.\w+(?!\s*\()/g // matches this.X but not this.X() or this.X.Y()
  let refMatch

  while ((refMatch = refRegex.exec(funcBody)) !== null) {
    const fullRef = refMatch[0]

    // Extract just the variable part (this.X)
    // We need to avoid method calls or chained methods
    const varRef = fullRef.split('.').slice(0, 2).join('.')

    // Don't add if it's part of a method call
    if (
      !funcBody
        .substring(refMatch.index)
        .match(new RegExp(`^${varRef.replace(/\./g, '\\.')}\\s*\\(`))
    ) {
      thisRefs.add(varRef)
    }
  }

  return thisRefs
}
