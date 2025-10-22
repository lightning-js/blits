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

// Utility function: Character-wise brace matcher that handles strings and comments
const findMatchingBrace = (text, startPos) => {
  let braceLevel = 1
  let position = startPos + 1
  let inString = false
  let stringChar = ''

  for (; position < text.length && braceLevel > 0; position++) {
    const char = text[position]

    // Handle string boundaries (ignore escaped quotes)
    if (!inString && (char === '"' || char === "'" || char === '`')) {
      inString = true
      stringChar = char
    } else if (inString && char === stringChar && text[position - 1] !== '\\') {
      inString = false
    }
    // Skip comments when not in strings
    else if (!inString && char === '/' && text[position + 1] === '/') {
      // Skip line comment
      position = text.indexOf('\n', position) || text.length - 1
    } else if (!inString && char === '/' && text[position + 1] === '*') {
      // Skip block comment
      position = text.indexOf('*/', position + 2) || text.length - 1
    }
    // Count braces only outside strings and comments
    else if (!inString) {
      if (char === '{') braceLevel++
      else if (char === '}') braceLevel--
    }
  }

  return braceLevel === 0 ? position : -1
}

// Find computed object boundaries in component config
const findComputedObjectEnd = (configObject, computedStart) => {
  return findMatchingBrace(configObject, computedStart)
}

// Find individual computed function boundaries
const findComputedFunctionEnd = (computedObj, openingBracePos) => {
  return findMatchingBrace(computedObj, openingBracePos)
}

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

      // Find the matching closing brace for computed object in config
      const computedEnd = findComputedObjectEnd(configObject, computedStart)

      if (computedEnd !== -1) {
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

          // Find closing brace for individual computed function
          const closingBracePos = findComputedFunctionEnd(computedObj, openingBracePos)

          if (closingBracePos === -1) {
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
              // Extract indentation from the original function body
              const indentMatch = prop.body.match(/^(\s+)/)
              const indent = indentMatch ? indentMatch[1] + '  ' : '    ' // Default to 4 spaces if no indent found

              const modifiedPropText =
                prop.fullText.substring(0, openBraceIndex + 1) +
                '\n' +
                indent +
                commentText +
                '\n' +
                indent +
                refCode +
                '\n' +
                indent +
                prop.body +
                '\n' +
                prop.fullText.substring(0, openBraceIndex).match(/^(\s*)/)[0] +
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
